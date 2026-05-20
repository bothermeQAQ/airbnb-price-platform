"""Service layer for the Airbnb Price Intelligence API.

Maps the frontend's listing payload onto the model's raw `train.csv` schema,
runs the real saved_models inference pipeline, and assembles the /predict
response (price, confidence range, price drivers).

Price drivers are a feature-contribution approximation: each driver is the
*real model's* price delta when one feature group is reset to a neutral
baseline — i.e. a counterfactual ablation on the actual 12-model ensemble.
Global feature importance comes from the LightGBM bases' gain importance.
"""
import json
import math
import os
import sys

import numpy as np

# --- locate + import the saved inference pipeline ---------------------------
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_SAVED = os.path.join(os.path.dirname(_BACKEND_DIR), 'saved_models')
if _SAVED not in sys.path:
    sys.path.insert(0, _SAVED)
import inference  # noqa: E402  — loads every .pkl artifact at import time

# --- real market data (computed from train.csv by build_market_data.py) -----
with open(os.path.join(_BACKEND_DIR, 'market_data.json')) as _f:
    MARKET = json.load(_f)

NEIGH = {n['name']: n for n in MARKET['neighborhoods']}
MODEL_OOF = round(float(inference.META.get('oof_mae', {}).get('final', 36.53)), 2)

# --- frontend id -> raw train.csv value maps --------------------------------
ROOM_TYPE = {'entire': 'Entire home/apt', 'private': 'Private room',
             'shared': 'Shared room'}
PROPERTY_TYPE = {'apartment': 'Apartment', 'condominium': 'Condominium',
                 'loft': 'Loft', 'house': 'House', 'townhouse': 'Townhouse',
                 'brownstone': 'Townhouse', 'bnb': 'Bed & Breakfast',
                 'other': 'Other'}
AMENITY = {'wifi': 'Wifi', 'kitchen': 'Kitchen', 'ac': 'Air conditioning',
           'washer': 'Washer', 'elevator': 'Elevator', 'gym': 'Gym',
           'doorman': 'Doorman', 'pool': 'Pool'}

# neutral baseline for the location counterfactual: the neighborhood whose
# median is closest to the city-wide median.
_cm = MARKET['overall']['median']
_base_nb = min(MARKET['neighborhoods'], key=lambda d: abs(d['median'] - _cm))
_LOCATION_BASELINE = {
    'neighbourhood_cleansed': _base_nb['name'],
    'neighbourhood_group_cleansed': _base_nb['borough'],
    'zipcode': _base_nb['zipcode'] or '11206',
}

_QUANTILE_MODELS = ('lgb_quantile_a50', 'lgb_quantile_a90')


# ---------------------------------------------------------------- raw mapping
def _quote(name):
    return f'"{name}"' if (' ' in name or '/' in name) else name


def _amenities_str(ids):
    names = [AMENITY[a] for a in ids if a in AMENITY]
    return '{' + ','.join(_quote(n) for n in names) + '}'


def build_raw(p):
    """Frontend payload dict -> raw train.csv-style listing dict for the model."""
    name = p.get('neighborhood', '') or ''
    nb = NEIGH.get(name)
    if nb:
        cleansed, borough, zipc = nb['name'], nb['borough'], (nb['zipcode'] or '10001')
        median = nb['median']
    else:
        cleansed, borough, zipc = (name or 'Midtown'), 'Manhattan', '10001'
        median = MARKET['overall']['median']

    rating = float(p.get('reviewScore', 92))      # 0-100 overall rating
    sub = round(rating / 10.0, 2)                  # 0-10 sub-score equivalent
    bedrooms = float(p.get('bedrooms', 1))

    raw = {
        'room_type': ROOM_TYPE.get(p.get('roomType'), 'Entire home/apt'),
        'property_type': PROPERTY_TYPE.get(p.get('propertyType'), 'Apartment'),
        'accommodates': float(p.get('accommodates', 2)),
        'bedrooms': bedrooms,
        'bathrooms': float(p.get('bathrooms', 1)),
        'beds': max(bedrooms, 1.0),
        'guests_included': 1.0,
        'bed_type': 'Real Bed',
        'neighbourhood_cleansed': cleansed,
        'neighbourhood_group_cleansed': borough,
        'zipcode': zipc,
        'city': 'New York',
        'amenities': _amenities_str(p.get('amenities', []) or []),
        'number_of_reviews': float(p.get('numReviews', 0)),
        'review_scores_rating': rating,
        'review_scores_accuracy': sub,
        'review_scores_cleanliness': sub,
        'review_scores_checkin': sub,
        'review_scores_communication': sub,
        'review_scores_location': sub,
        'review_scores_value': sub,
        'cancellation_policy': 'moderate',
        'minimum_nights': 2.0,
        'name': (p.get('description') or '')[:90],
        'summary': p.get('description') or '',
        'description': p.get('description') or '',
    }
    return raw, {'cleansed': cleansed, 'borough': borough, 'median': median}


# ---------------------------------------------------------------- prediction
def _point_std(base_log):
    """Std of the non-quantile base models' log-price predictions = ensemble
    disagreement, a genuine epistemic-uncertainty signal."""
    pts = [v for k, v in base_log.items() if k not in _QUANTILE_MODELS]
    return float(np.std(pts)) if pts else 0.1


def _price_drivers(raw, price, payload, ctx):
    """Counterfactual feature contributions on the real model."""
    n_bed = int(round(raw['bedrooms']))
    n_am = len([a for a in (payload.get('amenities') or []) if a in AMENITY])
    rt = raw['room_type']

    neutral_reviews = dict(raw)
    neutral_reviews.update({
        'review_scores_rating': 92.0, 'review_scores_accuracy': 9.2,
        'review_scores_cleanliness': 9.2, 'review_scores_checkin': 9.2,
        'review_scores_communication': 9.2, 'review_scores_location': 9.2,
        'review_scores_value': 9.2,
    })

    candidates = [
        (rt, {**raw, 'room_type': 'Private room'}),
        (f'{ctx["cleansed"]} location', {**raw, **_LOCATION_BASELINE}),
        (f'{n_bed} bedroom' + ('' if n_bed == 1 else 's'),
         {**raw, 'bedrooms': 1.0, 'beds': 1.0}),
        (f'Amenities ({n_am})', {**raw, 'amenities': '{}'}),
        ('Review score', neutral_reviews),
        ('Guest capacity', {**raw, 'accommodates': 2.0}),
        ('Listing-copy signals',
         {**raw, 'name': '', 'summary': '', 'description': ''}),
    ]

    drivers = []
    for feature, counterfactual in candidates:
        delta = price - inference.predict(counterfactual)
        impact = int(round(delta))
        if abs(impact) >= 1:
            drivers.append({'feature': feature, 'impact': impact})
    drivers.sort(key=lambda d: abs(d['impact']), reverse=True)
    return drivers[:6]


def run_prediction(payload):
    """Full /predict response for one listing payload."""
    raw, ctx = build_raw(payload)
    detail = inference.predict(raw, return_detail=True)
    price = float(detail['price'])
    base_log = detail['base_log_predictions']
    std = _point_std(base_log)

    # confidence range — width scales with ensemble disagreement
    half = min(max(std, 0.055), 0.26) * 0.95
    low = price * math.exp(-half)
    high = price * math.exp(half)

    # confidence score 0-100 (tighter agreement -> higher; high tier penalised)
    score = 100.0 - min(std * 230.0, 52.0)
    if price > 300:
        score -= 20
    elif price > 200:
        score -= 9
    if float(payload.get('numReviews', 0)) < 3:
        score -= 6
    score = int(round(min(max(score, 35.0), 97.0)))
    conf_word = 'high' if score >= 80 else 'medium' if score >= 62 else 'low'

    # market position vs the real neighborhood median
    median = ctx['median']
    pct = round((price - median) / median * 100) if median else 0
    nb = ctx['cleansed']
    if pct > 0:
        market_position = f'{pct}% above the {nb} median'
    elif pct < 0:
        market_position = f'{abs(pct)}% below the {nb} median'
    else:
        market_position = f'at the {nb} median'

    drivers = _price_drivers(raw, price, payload, ctx)
    tier = 'High' if price >= 300 else 'Mid' if price >= 100 else 'Low'

    return {
        'predicted_price': int(round(price)),
        'price_range': {'low': int(round(low)), 'high': int(round(high))},
        'confidence': conf_word,
        'market_position': market_position,
        'price_drivers': drivers,
        'meta': {
            'confidence_score': score,
            'tier': tier,
            'neighbourhood': nb,
            'borough': ctx['borough'],
            'neighbourhood_median': median,
            'ensemble_std': round(std, 4),
            'stacker_log': round(float(detail['stacker_log']), 4),
            'residual': round(float(detail['residual']), 4),
            'quantile_spread': round(float(detail['quantile_spread']), 4),
            'base_models': len(base_log),
            'model_oof_mae': MODEL_OOF,
        },
    }


# ----------------------------------------------------------- feature importance
_FEAT_EXACT = {
    'accommodates': 'Guests accommodated', 'bedrooms': 'Bedrooms',
    'bathrooms': 'Bathrooms', 'beds': 'Beds', 'guests_included': 'Guests included',
    'room_type': 'Room type', 'property_type': 'Property type',
    'bed_type': 'Bed type', 'cancellation_policy': 'Cancellation policy',
    'latitude': 'Latitude', 'longitude': 'Longitude', 'zipcode': 'Zip code',
    'neighbourhood_cleansed': 'Neighborhood', 'city': 'City',
    'neighbourhood_group_cleansed': 'Borough', 'host_neighbourhood': 'Host neighborhood',
    'market': 'Market', 'extra_people': 'Extra-people fee',
    'amenities_count': 'Amenity count', 'amenities_len': 'Amenities text length',
    'minimum_nights': 'Minimum nights', 'maximum_nights': 'Maximum nights',
    'number_of_reviews': 'Number of reviews', 'reviews_per_month': 'Reviews per month',
    'reviews_per_tenure': 'Reviews per tenure', 'avg_review_score': 'Average review score',
    'host_listings_count': 'Host listing count', 'square_feet': 'Square feet',
    'calculated_host_listings_count': 'Host listings (calculated)',
    'host_tenure_days': 'Host tenure (days)', 'dist_manhattan': 'Distance to Midtown',
    'dist_centroid': 'Distance to city centroid', 'host_response_rate': 'Host response rate',
    'name_words': 'Title length (words)', 'description_words': 'Description length (words)',
    'beds_per_person': 'Beds per guest', 'bath_per_person': 'Baths per guest',
    'bedroom_per_person': 'Bedrooms per guest', 'host_response_time': 'Host response time',
}


def _pretty_feature(c):
    if c in _FEAT_EXACT:
        return _FEAT_EXACT[c]
    if c.startswith('dist_'):
        return 'Distance to ' + c[5:].replace('_', ' ').title()
    if c.startswith('am_'):
        return 'Amenity: ' + c[3:].replace('_', ' ').title()
    if c.startswith('name_has_'):
        return 'Title keyword: ' + c[9:].title()
    if c.startswith('geo_cluster_'):
        return f'Geo cluster (k={c[12:]})'
    if c.endswith('_te_mean'):
        return _pretty_feature(c[:-8]) + ' — price encoding (mean)'
    if c.endswith('_te_std'):
        return _pretty_feature(c[:-7]) + ' — price encoding (spread)'
    if c.endswith('_count'):
        return _pretty_feature(c[:-6]) + ' — listing density'
    if c.endswith('_len'):
        return _pretty_feature(c[:-4]) + ' — text length'
    return c.replace('_', ' ').capitalize()


def _compute_feature_importance(top_n=15):
    """Mean gain importance across the 8 LightGBM base models."""
    cols = list(inference.PREPROCESSOR.feature_cols)
    lgb_models = [m['model'] for m in inference.BASE_MODELS if m['kind'] == 'lgb']
    gains = np.zeros(len(cols))
    for mdl in lgb_models:
        g = np.asarray(mdl.booster_.feature_importance(importance_type='gain'),
                       dtype=float)
        if g.sum() > 0:
            gains += g / g.sum()
    if lgb_models:
        gains /= len(lgb_models)
    total = gains.sum() or 1.0
    order = np.argsort(gains)[::-1][:top_n]
    return [
        {
            'feature': _pretty_feature(cols[i]),
            'raw_name': cols[i],
            'importance_pct': round(float(gains[i] / total * 100), 2),
        }
        for i in order
    ]


FEATURE_IMPORTANCE = _compute_feature_importance()
