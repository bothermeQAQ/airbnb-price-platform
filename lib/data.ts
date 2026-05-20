// ---------------------------------------------------------------------------
// Data layer for the Airbnb Price Intelligence Platform.
// Project facts are sourced from TECHNICAL_SUMMARY.md (Kaggle MAE = 36.18291).
// Neighborhood / borough / room-type / distribution figures are REAL — computed
// from the 33,522-row competition training set by backend/build_market_data.py.
// ---------------------------------------------------------------------------

import market from '@/backend/market_data.json';

export type Borough = 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';

// Real overall price statistics from train.csv (price > 0).
export const MARKET_OVERALL = market.overall;
export const MARKET_SOURCE = market.generated_from;

// --- Headline project numbers ------------------------------------------------

export const PROJECT = {
  mae: 36.18,
  maeFull: 36.18291,
  oofBest: 35.57,
  oofGroupKfold: 37.49,
  baseModels: 40,
  features: 310,
  featuresNumeric: 344,
  trainRows: 33538,
  testRows: 17337,
  totalListings: 50875,
  columns: 65,
  meanPrice: 145,
  medianPrice: 109,
  stackerFeatures: 44,
  snapshot: '2019-08-01',
  github: 'https://github.com/bothermeQAQ/airbnb-price-platform',
};

// --- MAE development trajectory (TECHNICAL_SUMMARY §10) ----------------------

export interface MaePoint {
  stage: string;
  detail: string;
  mae: number;
}

export const MAE_TRAJECTORY: MaePoint[] = [
  { stage: 'V3', detail: 'LGB + XGB + CatBoost, untuned', mae: 36.83 },
  { stage: 'V5', detail: '+ geo features, Optuna, 4-model stack', mae: 36.80 },
  { stage: '18-model', detail: '+ TF-IDF + LightGBM-Huber variants', mae: 36.21 },
  { stage: 'MoE', detail: '+ unconstrained Ridge stacker + tier probs', mae: 35.85 },
  { stage: 'Calibration', detail: '+ Jensen + quantile-spread feature', mae: 35.77 },
  { stage: 'Residual', detail: '+ LGB-L1 residual correction + weighted bases', mae: 35.60 },
  { stage: 'Final', detail: '+ quantile blend + HuberRegressor stacker', mae: 35.57 },
];

// --- Neighborhoods -----------------------------------------------------------

export interface Neighborhood {
  name: string;
  borough: Borough;
  median: number; // median nightly price (USD), from train.csv
  mean?: number;
  count?: number; // number of training listings
  zipcode?: string; // modal 5-digit zipcode
}

// Every neighborhood with >= 30 training listings — real medians, means,
// listing counts and modal zipcodes computed from train.csv.
export const NEIGHBORHOODS: Neighborhood[] = market.neighborhoods.map((n) => ({
  name: n.name,
  borough: n.borough as Borough,
  median: n.median,
  mean: n.mean,
  count: n.count,
  zipcode: n.zipcode ?? undefined,
}));

export const BOROUGHS: Borough[] = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
];

// Borough-level price stats — real averages across all room types (train.csv).
export interface BoroughStat {
  borough: Borough;
  avgPrice: number;
  median: number;
  listings: number;
  topNeighborhood: string;
}

function boroughStat(b: Borough): BoroughStat {
  const s = (market.boroughs as Record<string, Omit<BoroughStat, 'borough'>>)[b];
  return {
    borough: b,
    avgPrice: s.avgPrice,
    median: s.median,
    listings: s.listings,
    topNeighborhood: s.topNeighborhood,
  };
}

export const BOROUGH_STATS: Record<Borough, BoroughStat> = {
  Manhattan: boroughStat('Manhattan'),
  Brooklyn: boroughStat('Brooklyn'),
  Queens: boroughStat('Queens'),
  Bronx: boroughStat('Bronx'),
  'Staten Island': boroughStat('Staten Island'),
};

// --- Property & room types ---------------------------------------------------

export const ROOM_TYPES = [
  { id: 'entire', label: 'Entire home / apt', mult: 1.0 },
  { id: 'private', label: 'Private room', mult: 0.58 },
  { id: 'shared', label: 'Shared room', mult: 0.36 },
] as const;

export type RoomTypeId = (typeof ROOM_TYPES)[number]['id'];

export const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', mult: 1.0 },
  { id: 'condominium', label: 'Condominium', mult: 1.08 },
  { id: 'loft', label: 'Loft', mult: 1.12 },
  { id: 'house', label: 'House', mult: 1.05 },
  { id: 'townhouse', label: 'Townhouse', mult: 1.1 },
  { id: 'brownstone', label: 'Brownstone', mult: 1.09 },
  { id: 'bnb', label: 'Bed & Breakfast', mult: 0.92 },
  { id: 'other', label: 'Other', mult: 0.96 },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]['id'];

// --- Amenities ---------------------------------------------------------------

export const AMENITIES = [
  { id: 'wifi', label: 'Wifi', value: 4 },
  { id: 'kitchen', label: 'Kitchen', value: 7 },
  { id: 'ac', label: 'Air Conditioning', value: 9 },
  { id: 'washer', label: 'Washer', value: 8 },
  { id: 'elevator', label: 'Elevator', value: 11 },
  { id: 'gym', label: 'Gym', value: 16 },
  { id: 'doorman', label: 'Doorman', value: 21 },
  { id: 'pool', label: 'Pool', value: 26 },
] as const;

export type AmenityId = (typeof AMENITIES)[number]['id'];

// Borough-level subway access premium (illustrative).
export const SUBWAY_ADJ: Record<Borough, number> = {
  Manhattan: 13,
  Brooklyn: 9,
  Queens: 6,
  Bronx: 4,
  'Staten Island': 2,
};

// Listing-copy keywords that signal price (mirrors the real name-keyword flags).
export const COPY_KEYWORDS = [
  'luxury',
  'renovated',
  'view',
  'spacious',
  'modern',
  'prime',
  'sunny',
  'designer',
  'balcony',
  'penthouse',
];

// --- Market dashboard data ---------------------------------------------------

export interface RoomTypeStat {
  type: string;
  avgPrice: number;
  listings: number;
  share: number;
}

// Real average price + listing share per room type (train.csv).
export const ROOM_TYPE_STATS: RoomTypeStat[] = market.roomTypes;

// Real price distribution histogram — right-skewed (median $109, mean $145).
export interface PriceBand {
  band: string;
  count: number;
}

export const PRICE_HISTOGRAM: PriceBand[] = market.priceHistogram;

export interface TopNeighborhood {
  name: string;
  borough: Borough;
  price: number;
}

// Top 10 priciest neighborhoods by real median (>= 80 listings for stability).
export const TOP_NEIGHBORHOODS: TopNeighborhood[] = [...NEIGHBORHOODS]
  .filter((n) => (n.count ?? 0) >= 80)
  .sort((a, b) => b.median - a.median)
  .slice(0, 10)
  .map((n) => ({ name: n.name, borough: n.borough, price: n.median }));

// Most-listed neighborhoods — used for the dashboard heatmap grid.
export const HEATMAP_NEIGHBORHOODS: Neighborhood[] = [...NEIGHBORHOODS]
  .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
  .slice(0, 28);

// Per-tier OOF analysis (TECHNICAL_SUMMARY §8.2).
export interface TierStat {
  tier: string;
  range: string;
  rows: number;
  mae: number;
  note: string;
}

export const TIER_STATS: TierStat[] = [
  {
    tier: 'Low',
    range: '< $100',
    rows: 15000,
    mae: 10.9,
    note: 'Dense, low-variance segment — easiest to fit.',
  },
  {
    tier: 'Mid',
    range: '$100 – $300',
    rows: 16200,
    mae: 30.2,
    note: 'The bulk of listings; drives the headline metric.',
  },
  {
    tier: 'High',
    range: '> $300',
    rows: 2300,
    mae: 127.0,
    note: 'Heavy-tailed and sparse — the dominant error source.',
  },
];

// What didn't work (TECHNICAL_SUMMARY §7).
export interface FailedExperiment {
  title: string;
  result: string;
  reason: string;
}

export const FAILED_EXPERIMENTS: FailedExperiment[] = [
  {
    title: 'Cross target encoding',
    result: 'Hurt the model',
    reason:
      'Encoding pairs like room×neighbourhood created multicollinear noise; smoothing=20 left rare combos uninformative.',
  },
  {
    title: 'kNN OOF price feature',
    result: 'Neutral / hurt',
    reason:
      'Train side saw 4/5 of the data, test side 5/5 — the distribution shift made the model over-trust the test-side feature.',
  },
  {
    title: 'CatBoost with Huber loss',
    result: 'Diverged — MAE 2.7×10¹³',
    reason:
      'CatBoost’s Huber gradient on a log target produced runaway predictions. Aborted.',
  },
  {
    title: 'Isotonic calibration',
    result: 'All variants worse (35.8–36.0)',
    reason:
      'The stacker output was already well-calibrated; isotonic binning only added noise.',
  },
  {
    title: 'LightGBM meta-learner',
    result: '36.19 vs Ridge 36.00',
    reason:
      'Tree meta-learners overfit a 40-model stack even at depth 3 — the linear blend generalizes better.',
  },
  {
    title: 'Per-segment primary models',
    result: 'Oracle 28 → operational 85',
    reason:
      'Tantalizing oracle MAE, but tier-classifier accuracy at the boundaries amplified misclassification.',
  },
];

// --- Methodology data --------------------------------------------------------

export interface FeatureGroup {
  group: string;
  count: number;
  description: string;
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    group: 'Core listing & host',
    count: 42,
    description:
      'Parsed $/%/boolean fields, capacity, host tenure, verifications, review-score aggregates.',
  },
  {
    group: 'Amenities',
    count: 52,
    description:
      '50+ hand-curated binary flags plus amenities_count and raw-string-length summaries.',
  },
  {
    group: 'Geo & proximity',
    count: 30,
    description:
      'pgeocode lat/lon, 12 landmark haversine distances, 3 KMeans clusters, subway & restaurant POI density via BallTree.',
  },
  {
    group: 'OOF target encoding',
    count: 28,
    description:
      'K-fold mean/std/count encodings (smoothing=20) for high-cardinality categoricals and geo clusters.',
  },
  {
    group: 'Text length & keywords',
    count: 29,
    description:
      'Character lengths for 11 text fields, word counts, and 16 name-keyword flags (luxury, loft, view…).',
  },
  {
    group: 'TF-IDF + TruncatedSVD',
    count: 70,
    description:
      'SVD-50 on concatenated text fields plus SVD-20 on the amenities text channel.',
  },
  {
    group: 'SBERT embeddings',
    count: 50,
    description:
      'all-MiniLM-L6-v2 384-dim embeddings of name+summary+description, reduced via SVD-50 (62.7% var).',
  },
  {
    group: 'Derived ratios',
    count: 9,
    description:
      'beds-per-person, bath-per-person, accom−beds, extra-guest interactions.',
  },
];

export interface ModelRow {
  family: string;
  variants: string;
  count: number;
  role: string;
}

export const MODEL_ARCHITECTURE: ModelRow[] = [
  {
    family: 'GBM core trio',
    variants: 'LightGBM-L1 · XGBoost-MAE · CatBoost-MAE',
    count: 9,
    role: 'Three algorithms across three feature versions (v5 / +TF-IDF / +SBERT).',
  },
  {
    family: 'LightGBM-Huber',
    variants: 'α ∈ {0.3, 0.5, 0.7, 0.9, 0.95} · ff ∈ {0.5, 0.75}',
    count: 8,
    role: 'The workhorse — smoother gradient than L1, best single model at 36.49 OOF.',
  },
  {
    family: 'Diverse objectives',
    variants: 'L1 on raw price · quantile q40–q90',
    count: 7,
    role: 'Error-structure diversity; q90−q50 becomes a stacker uncertainty feature.',
  },
  {
    family: 'Specialized learners',
    variants: 'HistGradientBoosting · per-room-type · per-borough · weighted-Huber',
    count: 6,
    role: 'Architectural and segment-level diversity for the stack.',
  },
  {
    family: 'Mixture-of-Experts',
    variants: 'MoE low / mid / high / soft + tier classifier',
    count: 4,
    role: 'Tier-weighted experts (AUC 0.947) targeting the heavy-tailed high segment.',
  },
  {
    family: 'Multi-fold-seed averages',
    variants: '3 KFold seeds × 2 model seeds = 6 fits / fold',
    count: 7,
    role: 'Fold-bagging on the dominant models — ~0.2 MAE each.',
  },
];

export interface Technique {
  name: string;
  delta: number;
  from: number;
  to: number;
  why: string;
}

export const KEY_TECHNIQUES: Technique[] = [
  {
    name: 'LightGBM with Huber loss',
    delta: -0.3,
    from: 36.57,
    to: 36.27,
    why: 'Smoother gradient than L1, more robust than L2 — best matches the MAE objective.',
  },
  {
    name: 'TF-IDF + SVD-50 on text',
    delta: -0.26,
    from: 36.83,
    to: 36.57,
    why: 'Captures phrases like "near subway", "luxury", "spacious" that signal price.',
  },
  {
    name: 'Multi-fold-seed averaging',
    delta: -0.21,
    from: 36.21,
    to: 36.0,
    why: 'Fold-bagging removes the ~0.2 MAE of residual variance between KFold seeds.',
  },
  {
    name: 'Residual correction model',
    delta: -0.18,
    from: 35.8,
    to: 35.62,
    why: 'An LGB-L1 on stacker OOF outputs extracts non-linear patterns the linear blend missed.',
  },
  {
    name: 'MoE + tier probabilities',
    delta: -0.12,
    from: 35.97,
    to: 35.85,
    why: 'Per-tier predictions and probabilities help the sparse high-price segment.',
  },
  {
    name: 'Unconstrained Ridge stacking',
    delta: -0.08,
    from: 36.21,
    to: 36.13,
    why: 'Allowing negative weights and an intercept beats convex-only blending.',
  },
  {
    name: 'Quantile-spread feature (q90−q50)',
    delta: -0.05,
    from: 35.85,
    to: 35.8,
    why: 'Encodes per-row prediction uncertainty without a separate uncertainty model.',
  },
];

export const PIPELINE_STAGES = [
  {
    title: 'Raw Data',
    sub: '33,538 train rows · 65 columns',
    detail: 'Text, categorical, numeric, missing-heavy. No listing-level lat/lon — only zipcode.',
  },
  {
    title: 'Feature Engineering',
    sub: '310 engineered features',
    detail: 'Parsing, amenities flags, geo proximity, TF-IDF & SBERT, OOF target encoding.',
  },
  {
    title: '40 Base Models',
    sub: '5-fold OOF in log space',
    detail: 'GBM trio, 8 Huber variants, quantile learners, MoE experts, fold-seed averages.',
  },
  {
    title: 'Huber Stacker',
    sub: 'ε = 1.35 · α = 0.001',
    detail: '44 stacker features. HuberRegressor beat Ridge by ~0.05 — its loss matches MAE.',
  },
  {
    title: 'Residual Correction',
    sub: 'LGB-L1 · shrinkage 1.0',
    detail: 'Second-level model on stacker OOF — the single biggest stacking win at −0.18 MAE.',
  },
  {
    title: 'Final Prediction',
    sub: 'Jensen c = 0.9995 · expm1',
    detail: 'Calibrate, exponentiate back to price space, clip to ≥ 0.',
  },
];

export const TECH_STACK = [
  'Python',
  'LightGBM',
  'XGBoost',
  'CatBoost',
  'scikit-learn',
  'Optuna',
  'sentence-transformers',
  'pgeocode',
  'pandas',
  'NumPy',
];

export const APP_STACK = ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Recharts', 'Framer Motion'];
