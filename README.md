# Airbnb Price Intelligence Platform

A full-stack ML product for **NYC Airbnb nightly price prediction** — a real
stacked ensemble served through a FastAPI backend and a dark, animation-rich
Next.js 14 frontend.

**Live demo → https://airbnb-price-platform.vercel.app**

The model placed at the top of the Kaggle leaderboard with **MAE = 36.18291**.
The artifact served by this app is a faithful reconstruction at **36.53 OOF MAE**.

---

## Overview

The platform turns a messy price-regression problem into an explainable,
interactive product:

- **`/`** — landing page: headline metrics, model-evolution timeline.
- **`/predict`** — configure a listing; the **real model** returns a price, a
  confidence band and a transparent, per-feature price-driver breakdown.
- **`/dashboard`** — NYC market intelligence: borough heatmap, neighborhood
  grid, price distribution, per-tier error analysis — all from real data.
- **`/methodology`** — the full pipeline, feature groups, model architecture
  and the techniques that moved the metric.

Every market figure (neighborhood medians, borough averages, price
distribution) is **computed from the 33,522-row competition training set** by
`backend/build_market_data.py`.

## Screenshots

The four pages are live — click through the demo:

| Page | Link |
|------|------|
| Landing | https://airbnb-price-platform.vercel.app |
| Price Prediction | https://airbnb-price-platform.vercel.app/predict |
| Market Dashboard | https://airbnb-price-platform.vercel.app/dashboard |
| Methodology | https://airbnb-price-platform.vercel.app/methodology |

_(Static screenshots can be dropped into `docs/screenshots/` for offline docs.)_

## Tech stack

**Frontend** — Next.js 14 · TypeScript · Tailwind CSS · Recharts · Framer Motion
(static export, deployed on Vercel)

**Backend** — FastAPI · Uvicorn · Pydantic (deployed via `render.yaml`)

**Model** — Python · LightGBM · XGBoost · CatBoost · scikit-learn · pandas ·
NumPy · Optuna · sentence-transformers · pgeocode

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Next.js 14 frontend          (Vercel — static export)              │
│  /   ·   /predict   ·   /dashboard   ·   /methodology               │
└───────────────┬─────────────────────────────────────────────────────┘
                │  POST /predict          (graceful fallback to the
                │  GET  /market-summary    local heuristic in
                │  GET  /feature-importance lib/predict.ts if the
                ▼                           API is unreachable)
┌────────────────────────────────────────────────────────────────────┐
│  FastAPI backend              (backend/ — Python)                   │
│  /health · /predict · /market-summary · /feature-importance         │
└───────────────┬─────────────────────────────────────────────────────┘
                │  inference.predict()
                ▼
┌────────────────────────────────────────────────────────────────────┐
│  Saved model                  (saved_models/)                       │
│  CoreFeatureBuilder  →  12 base models  →  Ridge stacker             │
│      →  LGB-L1 residual correction  →  Jensen scaling  →  price      │
│                                                                      │
│  base models: 8 × LightGBM · 2 × XGBoost · CatBoost · HistGBM        │
└────────────────────────────────────────────────────────────────────┘
```

The `/predict` endpoint runs the real ensemble; **price drivers** are a
counterfactual feature-contribution approximation — each driver is the model's
price delta when one feature group is reset to a neutral baseline.

## Model performance

| Metric | Value |
|--------|-------|
| Kaggle public leaderboard MAE | **36.18291** |
| Served reconstruction — OOF MAE | **36.53** |
| Honest leakage-free OOF (GroupKFold) | 37.49 |
| Base models in the served ensemble | 12 |
| Engineered features | 183 (core) |
| Training listings | 33,522 (price > 0) |

Per-tier segment MAE (oracle): low `<$100` ≈ **10.9** · mid `$100–300` ≈ **30.2**
· high `>$300` ≈ **127** — the heavy-tailed high segment is the dominant error
source. See `TECHNICAL_SUMMARY.md` for the full write-up.

## Run locally

### 1. Backend (FastAPI)

The inference stack (numpy, pandas, scikit-learn, lightgbm, xgboost, catboost)
is heavy — reuse a system Python that already has it:

```bash
cd backend
python3 -m venv .venv --system-site-packages
.venv/bin/pip install fastapi uvicorn
.venv/bin/uvicorn main:app --reload --port 8000
```

Verify: `curl localhost:8000/health` → `{"status":"ok","model":"36.53 MAE",...}`

> `saved_models/base_models.pkl` (~162 MB) is git-ignored — keep the
> `saved_models/` directory in place locally for the backend to load it.

### 2. Frontend (Next.js)

```bash
npm install
npm run dev          # http://localhost:3000
```

The frontend calls the backend at `NEXT_PUBLIC_API_URL` (default
`http://localhost:8000`). If the API is down, `/predict` falls back to a local
heuristic so the page still works.

### 3. Production build

```bash
npm run build        # static export → ./out
```

## Deployment

- **Frontend** — Vercel (`vercel --prod`). Set `NEXT_PUBLIC_API_URL` to the
  deployed backend URL.
- **Backend** — `render.yaml` is a self-contained Render Blueprint. The 162 MB
  `base_models.pkl` is published as a GitHub Release asset and downloaded
  automatically at build time. Deploy via the Render dashboard → New →
  Blueprint → this repo.

## Repository layout

```
app/              Next.js routes (/, /predict, /dashboard, /methodology)
components/       UI components + charts
lib/              data layer, API client, heuristic fallback
backend/          FastAPI app, model service, market-data builder
saved_models/     fitted model artifacts + inference.py
render.yaml       Render deployment blueprint
TECHNICAL_SUMMARY.md   full modeling write-up
```

## Links

- **Live demo** — https://airbnb-price-platform.vercel.app
- **Kaggle competition** — https://www.kaggle.com/competitions/ucsd-spring-2026-dsc-148
- **Repository** — https://github.com/bothermeQAQ/airbnb-price-platform

---

Built as a portfolio piece. Model write-up in `TECHNICAL_SUMMARY.md`.
