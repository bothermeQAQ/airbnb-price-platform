"""Compute real NYC Airbnb market statistics from the competition train.csv.

Outputs backend/market_data.json — consumed by the FastAPI /market-summary
endpoint and imported by the Next.js dashboard so every figure is grounded in
the real training data. Re-run whenever train.csv changes:

    python3 build_market_data.py [path/to/train.csv]
"""
import json
import os
import re
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TRAIN = os.path.expanduser(
    '~/Desktop/DSC148/ucsd-spring-2026-dsc-148/train.csv'
)
MIN_LISTINGS = 30  # neighborhoods below this are too sparse for a stable median


def parse_money(s):
    if pd.isna(s):
        return np.nan
    try:
        return float(re.sub(r'[^0-9.]', '', str(s)))
    except Exception:
        return np.nan


def _r(x):
    """Round a price to a whole dollar."""
    return int(round(float(x)))


def main():
    train_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TRAIN
    if not os.path.exists(train_path):
        sys.exit(f'train.csv not found at {train_path}')

    df = pd.read_csv(train_path, low_memory=False)
    df['price_usd'] = df['price'].apply(parse_money)
    df = df[df['price_usd'] > 0].copy()
    n = len(df)
    price = df['price_usd']

    overall = {
        'n': int(n),
        'mean': _r(price.mean()),
        'median': _r(price.median()),
        'p25': _r(price.quantile(0.25)),
        'p75': _r(price.quantile(0.75)),
        'p90': _r(price.quantile(0.90)),
        'max': _r(price.max()),
    }

    # --- price distribution histogram ---
    edges = [0, 50, 100, 150, 200, 250, 300, 400, 600, 10 ** 9]
    labels = ['$0–50', '$50–100', '$100–150', '$150–200', '$200–250',
              '$250–300', '$300–400', '$400–600', '$600+']
    hist = [
        {'band': lab,
         'count': int(((price >= edges[i]) & (price < edges[i + 1])).sum())}
        for i, lab in enumerate(labels)
    ]

    # --- per-neighborhood stats (with the modal 5-digit zipcode) ---
    df['zip5'] = df['zipcode'].astype(str).str.extract(r'(\d{5})', expand=False)
    neighborhoods = []
    for name, sub in df.groupby('neighbourhood_cleansed'):
        if len(sub) < MIN_LISTINGS:
            continue
        borough_mode = sub['neighbourhood_group_cleansed'].mode()
        zp = sub['zip5'].dropna()
        neighborhoods.append({
            'name': str(name),
            'borough': str(borough_mode.iloc[0]) if len(borough_mode) else 'NA',
            'median': _r(sub['price_usd'].median()),
            'mean': _r(sub['price_usd'].mean()),
            'count': int(len(sub)),
            'zipcode': str(zp.mode().iloc[0]) if len(zp) else None,
        })
    neighborhoods.sort(key=lambda d: d['count'], reverse=True)

    # --- per-borough stats ---
    boroughs = {}
    for b, sub in df.groupby('neighbourhood_group_cleansed'):
        in_b = [x for x in neighborhoods if x['borough'] == str(b)]
        top = max(in_b, key=lambda d: d['median'])['name'] if in_b else 'NA'
        boroughs[str(b)] = {
            'borough': str(b),
            'avgPrice': _r(sub['price_usd'].mean()),
            'median': _r(sub['price_usd'].median()),
            'listings': int(len(sub)),
            'topNeighborhood': top,
        }

    # --- per-room-type stats ---
    room_label = {'Entire home/apt': 'Entire home / apt',
                  'Private room': 'Private room', 'Shared room': 'Shared room'}
    room_types = []
    for rt, sub in df.groupby('room_type'):
        room_types.append({
            'type': room_label.get(str(rt), str(rt)),
            'avgPrice': _r(sub['price_usd'].mean()),
            'listings': int(len(sub)),
            'share': round(100 * len(sub) / n, 1),
        })
    order = {'Entire home / apt': 0, 'Private room': 1, 'Shared room': 2}
    room_types.sort(key=lambda d: order.get(d['type'], 9))

    out = {
        'generated_from': f'train.csv — {n} listings with price > 0',
        'overall': overall,
        'priceHistogram': hist,
        'boroughs': boroughs,
        'neighborhoods': neighborhoods,
        'roomTypes': room_types,
    }
    path = os.path.join(HERE, 'market_data.json')
    with open(path, 'w') as f:
        json.dump(out, f, indent=2)

    print(f'wrote {path}')
    print(f'  {n} listings · {len(neighborhoods)} neighborhoods (count >= {MIN_LISTINGS})')
    print(f'  overall median ${overall["median"]} · mean ${overall["mean"]}')
    for b, s in boroughs.items():
        print(f'  {b:14s} median ${s["median"]:>7} · avg ${s["avgPrice"]:>7} · n={s["listings"]}')


if __name__ == '__main__':
    main()
