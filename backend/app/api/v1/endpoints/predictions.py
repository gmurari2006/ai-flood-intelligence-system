"""
AI Flood Risk Prediction and XAI Attribution API Endpoints.

Implements POST /api/v1/predictions and GET /api/v1/predictions/{prediction_run_id}/explain
matching Document 05 Section 5.1 & 5.2.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.logging import logger
from backend.app.db.session import get_db
from backend.app.schemas.predictions import PredictionRequest, PredictionResponse
from backend.app.schemas.xai import PredictionExplainResponse
from backend.app.services.prediction_service import PredictionService
from backend.app.api.deps import get_current_user
from backend.app.models.domain import User

router = APIRouter()


@router.post(
    "/predictions",
    response_model=PredictionResponse,
    summary="Trigger AI Flood Risk Prediction",
    description="Calculates flood probability, inundation depth, and decision-support risk rating for a zone and forecast horizon."
)
async def trigger_prediction(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    # Optional or standard auth check
    current_user: User = Depends(get_current_user)
) -> PredictionResponse:
    """Trigger flood prediction calculation for a zone."""
    if request.forecast_horizon_hours < 1 or request.forecast_horizon_hours > 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Horizon must be 1-24 hours."
        )

    try:
        response = await PredictionService.run_prediction(
            db=db,
            zone_id=request.zone_id,
            forecast_horizon_hours=request.forecast_horizon_hours
        )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Prediction execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction execution failed: {str(e)}"
        )


@router.get(
    "/predictions/{prediction_run_id}/explain",
    response_model=PredictionExplainResponse,
    summary="Get Explainable AI Factor Attribution",
    description="Returns transparent contributing feature attributions and impact directions for a prediction run."
)
async def explain_prediction(
    prediction_run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PredictionExplainResponse:
    """Retrieve factor attribution breakdown for a prediction."""
    explanation = await PredictionService.get_prediction_explanation(db, prediction_run_id)
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction run '{prediction_run_id}' not found."
        )
    return explanation
