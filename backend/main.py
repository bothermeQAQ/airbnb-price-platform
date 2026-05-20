"""Airbnb Price Intelligence API — FastAPI backend.

Serves real ML inference for NYC Airbnb nightly prices using the saved 12-model
stacked ensemble (saved_models/inference.py).

Endpoints:
    GET  /                    API info
    GET  /health              liveness + model summary
    POST /predict             price prediction for one listing
    GET  /market-summary      neighborhood-level price statistics
    GET  /feature-importance  top global model features

Run locally:   uvicorn main:app --reload --port 8000
"""
import os
import sys

# make sibling modules importable regardless of the working directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, ConfigDict, Field  # noqa: E402
from typing import List  # noqa: E402

import model_service as svc  # noqa: E402  — loads the model artifacts at import

app = FastAPI(
    title='Airbnb Price Intelligence API',
    description='Real ML inference for NYC Airbnb nightly prices — a 12-model '
                'stacked ensemble (LightGBM · XGBoost · CatBoost) at '
                f'{svc.MODEL_OOF} OOF MAE.',
    version='1.0.0',
)

# CORS — open, so the Next.js frontend (any origin) can call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'OPTIONS'],
    allow_headers=['*'],
)


class ListingInput(BaseModel):
    """A listing as sent by the frontend /predict form."""
    model_config = ConfigDict(extra='ignore')

    neighborhood: str = Field('Williamsburg', description='Neighborhood name')
    roomType: str = Field('entire', description='entire | private | shared')
    propertyType: str = Field('apartment', description='apartment | loft | house | …')
    bedrooms: float = 1
    bathrooms: float = 1
    accommodates: int = 2
    amenities: List[str] = Field(default_factory=list)
    numReviews: int = 0
    reviewScore: float = Field(92, description='Overall review score, 0–100')
    description: str = ''


@app.get('/')
def root():
    return {
        'service': 'Airbnb Price Intelligence API',
        'version': '1.0.0',
        'model': f'{svc.MODEL_OOF} MAE — 12-model stacked ensemble',
        'endpoints': {
            'GET /health': 'liveness + model summary',
            'POST /predict': 'price prediction for one listing',
            'GET /market-summary': 'neighborhood-level price statistics',
            'GET /feature-importance': 'top global model features',
            'GET /docs': 'interactive OpenAPI docs',
        },
    }


@app.get('/health')
def health():
    """Liveness probe. Returns the model summary."""
    return {
        'status': 'ok',
        'model': f'{svc.MODEL_OOF} MAE',
        'base_models': len(svc.inference.BASE_MODELS),
        'features': len(svc.inference.PREPROCESSOR.feature_cols),
        'neighborhoods': len(svc.MARKET['neighborhoods']),
    }


@app.post('/predict')
def predict(listing: ListingInput):
    """Predict the nightly price for one listing.

    Returns predicted_price, price_range, confidence, market_position and
    price_drivers (counterfactual feature contributions on the real model).
    """
    try:
        return svc.run_prediction(listing.model_dump())
    except Exception as exc:  # surface model errors as 500s
        raise HTTPException(status_code=500, detail=f'prediction failed: {exc}')


@app.get('/market-summary')
def market_summary():
    """Neighborhood-level price statistics, computed from the 33,522-row
    training set (price > 0)."""
    return svc.MARKET


@app.get('/feature-importance')
def feature_importance():
    """Top global features by mean gain importance across the LightGBM bases."""
    return {
        'model': '12-model stacked ensemble',
        'importance_type': 'gain — mean over the 8 LightGBM base models',
        'feature_count': len(svc.inference.PREPROCESSOR.feature_cols),
        'features': svc.FEATURE_IMPORTANCE,
    }


if __name__ == '__main__':
    import uvicorn

    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('main:app', host='0.0.0.0', port=port)
