"""Inference for the retrained NYC Airbnb price pipeline.

Loads every fitted object saved by train_pipeline.py and exposes predict(),
which takes a single listing as a dict and returns the predicted nightly price.

Pipeline at inference time:
    raw dict
      -> CoreFeatureBuilder  (preprocessor.pkl)        : 183 core features
      -> 12 base models      (base_models.pkl)         : log-price predictions
      -> + quantile spread feature
      -> Ridge stacker       (stacker.pkl)             : blended log-price
      -> LGB-L1 residual     (residual_model.pkl)      : non-linear correction
      -> Jensen scaling, expm1, clip >= 0              : final price (USD)

Usage:
    from inference import predict
    price = predict({'room_type': 'Entire home/apt', 'accommodates': 2, ...})
"""
import os
import sys
import json
import pickle
import warnings

import numpy as np
import pandas as pd

# The residual LGB model was fit on a NumPy stacking matrix; predicting with the
# same NumPy layout is correct but trips a benign sklearn feature-name notice.
warnings.filterwarnings('ignore', message='X does not have valid feature names')

_DIR = os.path.dirname(os.path.abspath(__file__))
if _DIR not in sys.path:
    sys.path.insert(0, _DIR)
import core_features  # noqa: F401  (needed so preprocessor.pkl unpickles)


# --------------------------------------------------------------------------
# Load all fitted artifacts once at import time.
# --------------------------------------------------------------------------
def _load(name):
    with open(os.path.join(_DIR, name), 'rb') as f:
        return pickle.load(f)


PREPROCESSOR = _load('preprocessor.pkl')          # CoreFeatureBuilder
BASE_MODELS = _load('base_models.pkl')            # list of 12 dicts
STACKER = _load('stacker.pkl')                    # {ridge, base_order, ...}
RESIDUAL = _load('residual_model.pkl')            # {model, shrink}
with open(os.path.join(_DIR, 'feature_cols.json')) as f:
    META = json.load(f)

_BASE_BY_NAME = {m['name']: m for m in BASE_MODELS}
_BASE_ORDER = STACKER['base_order']
_SPREAD_HI, _SPREAD_LO = STACKER['spread_pair']   # ('lgb_quantile_a90', 'lgb_quantile_a50')
_JENSEN_C = STACKER['jensen_c']
_SHRINK = RESIDUAL['shrink']


def _base_predict(entry, X_num, X_cb):
    """Log-price prediction from one base model on the right feature matrix."""
    X = X_cb if entry['matrix'] == 'cb' else X_num
    model = entry['model']
    if entry['kind'] == 'hgb':
        return float(model.predict(X.values)[0])
    return float(model.predict(X)[0])


def predict(listing, return_detail=False):
    """Predict the nightly price (USD) for a single Airbnb listing.

    Parameters
    ----------
    listing : dict
        Raw listing fields, using the original column names from train.csv
        (e.g. 'room_type', 'accommodates', 'zipcode', 'amenities', ...).
        Missing fields are treated as NaN.
    return_detail : bool
        If True, return a dict with the stage-by-stage breakdown instead of a
        single float.

    Returns
    -------
    float  (or dict if return_detail=True)
    """
    if not isinstance(listing, dict):
        raise TypeError("listing must be a dict of raw listing fields")

    raw = pd.DataFrame([listing])
    X_num = PREPROCESSOR.transform_num(raw)   # 1 x 183, int-coded categoricals
    X_cb = PREPROCESSOR.transform_cb(raw)     # 1 x 183, string categoricals

    # 1. base models -> log-price predictions
    base_log = {m['name']: _base_predict(m, X_num, X_cb) for m in BASE_MODELS}

    # 2. quantile-spread stacker feature
    spread = base_log[_SPREAD_HI] - base_log[_SPREAD_LO]

    # 3. Ridge stacker
    stack_row = np.array([[base_log[n] for n in _BASE_ORDER] + [spread]])
    stacker_log = float(STACKER['ridge'].predict(stack_row)[0])

    # 4. LGB-L1 residual correction
    resid_row = np.concatenate([stack_row, [[stacker_log]]], axis=1)
    residual = float(RESIDUAL['model'].predict(resid_row)[0])
    corrected_log = stacker_log + _SHRINK * residual

    # 5. back to price space + Jensen scaling
    price = max(0.0, np.expm1(corrected_log)) * _JENSEN_C

    if return_detail:
        return {
            'price': float(price),
            'base_log_predictions': base_log,
            'quantile_spread': float(spread),
            'stacker_log': stacker_log,
            'residual': float(residual),
            'corrected_log': float(corrected_log),
        }
    return float(price)


if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(_DIR), 'ucsd-spring-2026-dsc-148')

    # --- Test 1: a real train.csv listing (in-sample; has a ground-truth price) ---
    df = pd.read_csv(os.path.join(data_dir, 'train.csv'), low_memory=False)
    row = df.iloc[0]
    actual = float(row['price'])
    listing = row.drop(labels=['price']).to_dict()

    print("=" * 62)
    print("predict() smoke test 1 — train.csv listing (in-sample)")
    print("=" * 62)
    print(f"Listing: {listing.get('name')!r}")
    print(f"  room_type={listing.get('room_type')}  accommodates={listing.get('accommodates')}"
          f"  bedrooms={listing.get('bedrooms')}  zipcode={listing.get('zipcode')}"
          f"  neighbourhood={listing.get('neighbourhood_cleansed')}")

    detail = predict(listing, return_detail=True)
    print(f"\nPredicted price : ${detail['price']:.2f}")
    print(f"Actual price    : ${actual:.2f}   (in-sample — model trained on this row)")
    print(f"Absolute error  : ${abs(detail['price'] - actual):.2f}")
    print(f"\nStage breakdown:")
    print(f"  stacker_log   = {detail['stacker_log']:.4f}")
    print(f"  residual      = {detail['residual']:+.4f}  (shrink={_SHRINK})")
    print(f"  corrected_log = {detail['corrected_log']:.4f}")
    print(f"  jensen_c      = {_JENSEN_C:.4f}")
    print(f"\nbase model log-predictions:")
    for k, v in detail['base_log_predictions'].items():
        print(f"  {k:22s} {v:.4f}  (${np.expm1(v):.2f})")

    # --- Test 2: an unseen test.csv listing (out-of-sample; no ground truth) ---
    test_df = pd.read_csv(os.path.join(data_dir, 'test.csv'), low_memory=False)
    trow = test_df.iloc[100].to_dict()
    print("\n" + "=" * 62)
    print("predict() smoke test 2 — test.csv listing (unseen)")
    print("=" * 62)
    print(f"Listing: {trow.get('name')!r}")
    print(f"  room_type={trow.get('room_type')}  accommodates={trow.get('accommodates')}"
          f"  bedrooms={trow.get('bedrooms')}  zipcode={trow.get('zipcode')}"
          f"  neighbourhood={trow.get('neighbourhood_cleansed')}")
    print(f"\nPredicted price : ${predict(trow):.2f}")

    # --- Test 3: a hand-written partial dict (missing fields -> treated as NaN) ---
    sparse = {'room_type': 'Private room', 'accommodates': 2, 'bedrooms': 1.0,
              'bathrooms': 1.0, 'beds': 1, 'zipcode': 11211,
              'neighbourhood_cleansed': 'Williamsburg',
              'neighbourhood_group_cleansed': 'Brooklyn',
              'property_type': 'Apartment', 'amenities': '{Wifi,Heating,Kitchen}'}
    print("\n" + "=" * 62)
    print("predict() smoke test 3 — sparse hand-written dict")
    print("=" * 62)
    print(f"Input: {sparse}")
    print(f"\nPredicted price : ${predict(sparse):.2f}")

    print(f"\nOK — predict() works on full, unseen, and sparse listings.")
    print(f"Final OOF MAE of this rebuild: {META['oof_mae']['final']:.4f}")
