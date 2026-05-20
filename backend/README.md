# Airbnb Price Intelligence API

FastAPI backend that serves **real ML inference** for NYC Airbnb nightly prices,
using the saved 12-model stacked ensemble (`saved_models/inference.py`).

- Ensemble: 8 × LightGBM + 2 × XGBoost + CatBoost + HistGradientBoosting
- Stacking: Ridge stacker → LightGBM-L1 residual correction → Jensen scaling
- Reconstruction OOF MAE: **36.53**

## Endpoints

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| GET    | `/health`             | Liveness + model summary |
| POST   | `/predict`            | Price prediction for one listing |
| GET    | `/market-summary`     | Neighborhood-level price statistics |
| GET    | `/feature-importance` | Top global model features (LightGBM gain) |
| GET    | `/docs`               | Interactive OpenAPI docs |

### `POST /predict`

Request body (all fields optional except sensible defaults):

```json
{
  "neighborhood": "Williamsburg",
  "roomType": "entire",
  "propertyType": "apartment",
  "bedrooms": 1, "bathrooms": 1, "accommodates": 2,
  "amenities": ["wifi", "kitchen", "ac"],
  "numReviews": 24, "reviewScore": 95,
  "description": "Bright, recently renovated apartment near the subway."
}
```

Response:

```json
{
  "predicted_price": 168,
  "price_range": { "low": 152, "high": 184 },
  "confidence": "high",
  "market_position": "12% above the Williamsburg median",
  "price_drivers": [
    { "feature": "Entire home/apt", "impact": 42 },
    { "feature": "Williamsburg location", "impact": 31 }
  ],
  "meta": { "confidence_score": 86, "tier": "Mid", "model_oof_mae": 36.53, ... }
}
```

**Price drivers** are a feature-contribution approximation: each driver is the
real model's price delta when one feature group is reset to a neutral baseline
(counterfactual ablation on the actual ensemble — no separate surrogate model).

## Run locally

The inference stack (numpy, pandas, scikit-learn, lightgbm, xgboost, catboost)
is heavy; the recommended setup reuses a system Python that already has it:

```bash
cd backend
python3 -m venv .venv --system-site-packages
.venv/bin/pip install fastapi uvicorn
.venv/bin/uvicorn main:app --reload --port 8000
```

Clean install (no system packages):

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000
```

Regenerate the market statistics from `train.csv`:

```bash
python3 build_market_data.py /path/to/train.csv
```

## Files

| File | Purpose |
|------|---------|
| `main.py`               | FastAPI app + 4 endpoints + CORS |
| `model_service.py`      | Payload mapping, prediction assembly, feature importance |
| `build_market_data.py`  | Computes `market_data.json` from `train.csv` |
| `market_data.json`      | Real per-neighborhood / borough / room-type stats |
| `requirements.txt`      | Dependencies |
| `../saved_models/`      | Fitted model artifacts (`inference.py`, `*.pkl`) |
| `../render.yaml`        | Render deployment blueprint |

## Deploy (Render)

`render.yaml` (repo root) is a Render Blueprint. Note: `base_models.pkl`
(~162 MB) exceeds GitHub's 100 MB file limit and is git-ignored — track it with
Git LFS or download it in the build step before deploying. See the comments in
`render.yaml`. The free instance (512 MB RAM) is tight for the full ensemble.
