// ---------------------------------------------------------------------------
// Heuristic pricing engine for the /predict tool.
//
// This is NOT the production 40-model ensemble — that pipeline runs offline.
// It is a transparent, additive heuristic calibrated to the feature effects
// the ensemble learned, so the demo produces realistic, explainable estimates.
// ---------------------------------------------------------------------------

import {
  AMENITIES,
  COPY_KEYWORDS,
  NEIGHBORHOODS,
  PROPERTY_TYPES,
  ROOM_TYPES,
  SUBWAY_ADJ,
  type AmenityId,
  type Borough,
  type PropertyTypeId,
  type RoomTypeId,
} from './data';

const CITY_BASELINE = 135; // city-wide reference median nightly price

export interface PredictInput {
  neighborhood: string;
  roomType: RoomTypeId;
  propertyType: PropertyTypeId;
  bedrooms: number;
  bathrooms: number;
  accommodates: number;
  amenities: AmenityId[];
  numReviews: number;
  reviewScore: number; // 0–100
  description: string;
}

export interface Driver {
  label: string;
  value: number;
}

export interface Prediction {
  price: number;
  low: number;
  high: number;
  neighborhood: string;
  borough: Borough;
  median: number;
  positionPct: number;
  drivers: Driver[];
  confidence: number; // 0–100
  confidenceLabel: string;
  tier: 'Low' | 'Mid' | 'High';
}

function clampNum(v: number, lo: number, hi: number) {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function lookupNeighborhood(name: string) {
  // Sentinel used by the location driver to measure the premium vs. a
  // city-baseline neighborhood.
  if (name === '__city__') {
    return { name: 'City baseline', borough: 'Manhattan' as Borough, median: CITY_BASELINE };
  }
  return NEIGHBORHOODS.find((n) => n.name === name) ?? NEIGHBORHOODS[0];
}

function roomMult(id: RoomTypeId) {
  return ROOM_TYPES.find((r) => r.id === id)?.mult ?? 1;
}

function propMult(id: PropertyTypeId) {
  return PROPERTY_TYPES.find((p) => p.id === id)?.mult ?? 1;
}

function amenityValue(id: AmenityId) {
  return AMENITIES.find((a) => a.id === id)?.value ?? 0;
}

function copyBonus(description: string) {
  const text = description.toLowerCase();
  const hits = COPY_KEYWORDS.filter((k) => text.includes(k)).length;
  return Math.min(hits * 3, 15);
}

// Core additive price model — pure function of the (possibly modified) input.
function corePrice(input: PredictInput): number {
  const nb = lookupNeighborhood(input.neighborhood);
  const rMult = roomMult(input.roomType);
  const pMult = propMult(input.propertyType);

  const scaledBase = nb.median * rMult * pMult;

  const bedroomAdj = (clampNum(input.bedrooms, 0, 10) - 1) * 26 * rMult;
  const bathAdj = Math.max(0, clampNum(input.bathrooms, 0, 10) - 1) * 17 * rMult;
  const accomAdj = (clampNum(input.accommodates, 1, 16) - 2) * 8.5 * rMult;

  const amenitiesSum = input.amenities.reduce((s, a) => s + amenityValue(a), 0);

  const reviewScoreAdj = (clampNum(input.reviewScore, 0, 100) - 92) * 1.6;
  const reviewVolumeAdj = (Math.min(clampNum(input.numReviews, 0, 2000), 160) / 160) * 9;

  const subwayAdj = SUBWAY_ADJ[nb.borough];
  const copyAdj = copyBonus(input.description);

  const price =
    scaledBase +
    bedroomAdj +
    bathAdj +
    accomAdj +
    amenitiesSum +
    reviewScoreAdj +
    reviewVolumeAdj +
    subwayAdj +
    copyAdj;

  return Math.max(28, price);
}

// A driver = the marginal effect of one factor, found by neutralizing it.
function marginal(input: PredictInput, neutral: Partial<PredictInput>): number {
  return corePrice(input) - corePrice({ ...input, ...neutral });
}

export function predictPrice(input: PredictInput): Prediction {
  const nb = lookupNeighborhood(input.neighborhood);
  const price = corePrice(input);

  // --- Driver decomposition --------------------------------------------------
  const roomLabel = ROOM_TYPES.find((r) => r.id === input.roomType)?.label ?? '';
  const drivers: Driver[] = [
    {
      label: input.roomType === 'entire' ? 'Entire home / apt' : roomLabel,
      value: marginal(input, { roomType: 'private' }),
    },
    {
      label: 'Location premium',
      value: marginal(input, { neighborhood: '__city__' }),
    },
    {
      label: `${input.bedrooms} bedroom${input.bedrooms === 1 ? '' : 's'}`,
      value: marginal(input, { bedrooms: 1 }),
    },
    {
      label: `Amenities (${input.amenities.length})`,
      value: marginal(input, { amenities: [] }),
    },
    {
      label: input.reviewScore >= 92 ? 'Strong review score' : 'Below-avg review score',
      value: marginal(input, { reviewScore: 92, numReviews: 0 }),
    },
    {
      label: 'Subway proximity',
      value: SUBWAY_ADJ[nb.borough],
    },
    {
      label: 'Listing-copy signals',
      value: copyBonus(input.description),
    },
  ]
    .filter((d) => Math.abs(d.value) >= 0.5)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6);

  // --- Confidence ------------------------------------------------------------
  // Mirrors the real per-tier error profile: the high-price tier is hard
  // (segment MAE 127), so confidence drops as the estimate climbs.
  let confidence = 80;
  confidence += (Math.min(input.numReviews, 150) / 150) * 13;
  confidence += Math.min(input.amenities.length, 6) * 0.7;
  if (input.reviewScore >= 90 && input.numReviews > 20) confidence += 5;
  if (price > 300) confidence -= 30;
  else if (price > 200) confidence -= 13;
  if (input.numReviews < 3) confidence -= 9;
  confidence = Math.round(clampNum(confidence, 34, 97));

  const confidenceLabel =
    confidence >= 80 ? 'High confidence' : confidence >= 62 ? 'Moderate confidence' : 'Wider band';

  // Range width scales inversely with confidence.
  const bandFrac = 0.055 + ((100 - confidence) / 100) * 0.2;
  const low = price * (1 - bandFrac);
  const high = price * (1 + bandFrac);

  const tier: Prediction['tier'] = price >= 300 ? 'High' : price >= 100 ? 'Mid' : 'Low';

  return {
    price: Math.round(price),
    low: Math.round(low),
    high: Math.round(high),
    neighborhood: nb.name,
    borough: nb.borough,
    median: nb.median,
    positionPct: Math.round(((price - nb.median) / nb.median) * 100),
    drivers,
    confidence,
    confidenceLabel,
    tier,
  };
}
