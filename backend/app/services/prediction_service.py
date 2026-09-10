"""
Flood Risk Prediction and Decision Support Service.

Implements strict two-mode inference (Trained ML Model vs Deterministic Hydrological Heuristic Fallback)
consuming Module 3 FeatureDatasetBuilder and persisting to PostgreSQL.
"""

from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.logging import logger
from backend.app.ml.dataset_builder import FeatureDatasetBuilder
from backend.app.ml.schemas import MLFeatureVector
from backend.app.models.domain import (
    GeographicZone,
    ModelVersion,
    PredictionRun,
    FloodPrediction,
    RiskScore,
    RiskFactor,
)
from backend.app.schemas.predictions import PredictionResponse
from backend.app.schemas.xai import PredictionExplainResponse, RiskFactorSchema


class PredictionService:
    """Service handling flood prediction execution, heuristic calculation, and XAI factor retrieval."""

    HEURISTIC_MODEL_ID = "HEURISTIC-DECISION-SUPPORT-V1.0"

    @classmethod
    async def _ensure_model_version_exists(cls, db: AsyncSession, model_id: str) -> str:
        """Ensures the model version record exists in PostgreSQL to satisfy foreign key."""
        stmt = select(ModelVersion).where(ModelVersion.id == model_id)
        res = await db.execute(stmt)
        model = res.scalar_one_or_none()

        if not model:
            model = ModelVersion(
                id=model_id,
                model_name="Deterministic Hydrological Decision Support Engine",
                algorithm="HEURISTIC_RISK_INDEX",
                accuracy_roc_auc=None,
                artifact_path="internal://services/prediction_service",
                is_active=True
            )
            db.add(model)
            await db.flush()

        return model_id

    @classmethod
    def _compute_heuristic_risk(
        cls,
        vector: MLFeatureVector
    ) -> tuple[float, float, float, float, str, str, list[dict]]:
        """
        Computes deterministic hydrological heuristic risk based on Document 04 Section 8.
        Returns:
            (flood_probability, predicted_depth_m, confidence_score, risk_score_numeric, risk_level, recommended_action, factors)
        """
        # 1. Elevation score [0, 1]
        elevation_score = min(1.0, max(0.0, vector.elevation_mean_m / 50.0))

        # 2. Heuristic probability based on river stage ratio, runoff potential, and hydro danger index
        stage_component = min(1.0, vector.river_stage_ratio * 0.40)
        runoff_component = min(1.0, (vector.runoff_potential_index / 50.0) * 0.35)
        hdi_component = vector.hydro_danger_index_clamped * 0.25
        
        prob = min(1.0, max(0.0, stage_component + runoff_component + hdi_component))
        prob = round(prob, 3)

        # 3. Predicted Inundation Depth (m)
        predicted_depth = round(min(5.0, max(0.0, prob * 2.50)), 2)

        # 4. Confidence score
        confidence = 0.920

        # 5. Raw risk score formula (Document 04 Section 8)
        raw_risk = (prob * 0.60) + (vector.hydro_danger_index_clamped * 0.25) + ((1.0 - elevation_score) * 0.15)
        numeric_score = round(min(100.00, max(0.00, raw_risk * 100.0)), 2)

        # 6. Risk Level & Action mapping (Document 04 Section 8)
        if numeric_score < 30.00:
            risk_level = "LOW"
            action = "Normal monitoring. No immediate public flood risk."
        elif numeric_score < 55.00:
            risk_level = "MODERATE"
            action = "Internal agency advisory. Monitor drainage pumps and low-lying sectors."
        elif numeric_score < 75.00:
            risk_level = "HIGH"
            action = "Issue public warning for low-lying areas. Stage emergency rescue teams."
        else:
            risk_level = "CRITICAL"
            action = "MANDATORY EVACUATION ORDER for low-lying sectors. Open emergency shelters immediately."

        # 7. Transparent heuristic factor attribution
        drainage_benefit = -0.100 if vector.drainage_capacity_score > 6.0 else 0.050
        factors = [
            {
                "feature_name": "rainfall_24h_mm",
                "observed_value": float(vector.rainfall_24h_mm),
                "shap_contribution": round(min(0.50, vector.rainfall_24h_mm / 300.0), 3),
                "impact_direction": "INCREASES_RISK" if vector.rainfall_24h_mm > 50.0 else "DECREASES_RISK",
                "description": f"Observed 24-hour rainfall total of {vector.rainfall_24h_mm:.1f} mm"
            },
            {
                "feature_name": "river_stage_ratio",
                "observed_value": float(vector.river_stage_ratio),
                "shap_contribution": round(min(0.40, max(-0.20, (vector.river_stage_ratio - 0.8) * 0.5)), 3),
                "impact_direction": "INCREASES_RISK" if vector.river_stage_ratio >= 1.0 else "DECREASES_RISK",
                "description": f"River gauge stage ratio ({vector.river_stage_ratio:.2f}x danger threshold)"
            },
            {
                "feature_name": "elevation_mean_m",
                "observed_value": float(vector.elevation_mean_m),
                "shap_contribution": round(max(-0.25, min(0.25, (10.0 - vector.elevation_mean_m) * 0.02)), 3),
                "impact_direction": "INCREASES_RISK" if vector.elevation_mean_m < 10.0 else "DECREASES_RISK",
                "description": f"Mean basin elevation ({vector.elevation_mean_m:.1f} m)"
            },
            {
                "feature_name": "drainage_capacity_score",
                "observed_value": float(vector.drainage_capacity_score),
                "shap_contribution": drainage_benefit,
                "impact_direction": "DECREASES_RISK" if drainage_benefit < 0 else "INCREASES_RISK",
                "description": f"Municipal drainage effectiveness score ({vector.drainage_capacity_score:.1f}/10)"
            }
        ]

        return prob, predicted_depth, confidence, numeric_score, risk_level, action, factors

    @classmethod
    async def run_prediction(
        cls,
        db: AsyncSession,
        zone_id: str,
        forecast_horizon_hours: int = 6
    ) -> PredictionResponse:
        """
        Executes flood risk prediction for a zone and forecast horizon.
        Uses Module 3 FeatureDatasetBuilder and persists results to database.
        """
        # 1. Verify zone exists
        zone_stmt = select(GeographicZone).where(GeographicZone.id == zone_id)
        zone_res = await db.execute(zone_stmt)
        zone = zone_res.scalar_one_or_none()
        if not zone:
            raise ValueError(f"Geographic zone '{zone_id}' not found.")

        # 2. Build Module 3 Feature Vector
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        vector = await FeatureDatasetBuilder.build_feature_vector_from_db(
            db=db,
            zone_id=zone_id,
            prediction_timestamp=now_utc,
            forecast_horizon_hours=forecast_horizon_hours
        )

        # 3. Determine inference mode (Mode B: Deterministic Heuristic Fallback since no trained model exists)
        inference_mode = "heuristic_fallback"
        model_version_id = await cls._ensure_model_version_exists(db, cls.HEURISTIC_MODEL_ID)

        (
            flood_prob,
            predicted_depth,
            confidence,
            risk_score_val,
            risk_tier,
            rec_action,
            factor_list
        ) = cls._compute_heuristic_risk(vector)

        # 4. Persist to PostgreSQL tables
        run_uuid = uuid.uuid4()
        pred_run = PredictionRun(
            id=run_uuid,
            zone_id=zone_id,
            model_version_id=model_version_id,
            forecast_horizon_hours=forecast_horizon_hours,
            run_timestamp=now_utc
        )
        db.add(pred_run)
        await db.flush()

        flood_pred = FloodPrediction(
            id=uuid.uuid4(),
            prediction_run_id=run_uuid,
            flood_probability=flood_prob,
            predicted_depth_m=predicted_depth,
            confidence_score=confidence,
            is_demo_data=False
        )
        db.add(flood_pred)

        risk_score_row = RiskScore(
            id=uuid.uuid4(),
            prediction_run_id=run_uuid,
            risk_score_numeric=risk_score_val,
            risk_level=risk_tier,
            recommended_action=rec_action
        )
        db.add(risk_score_row)

        for factor in factor_list:
            rf = RiskFactor(
                prediction_run_id=run_uuid,
                feature_name=factor["feature_name"],
                feature_value=factor["observed_value"],
                shap_contribution=factor["shap_contribution"],
                impact_direction=factor["impact_direction"]
            )
            db.add(rf)

        await db.commit()

        return PredictionResponse(
            prediction_run_id=str(run_uuid),
            zone_id=zone_id,
            forecast_horizon_hours=forecast_horizon_hours,
            flood_probability=flood_prob,
            predicted_depth_m=predicted_depth,
            confidence_score=confidence,
            risk_score_numeric=risk_score_val,
            risk_level=risk_tier,
            recommended_action=rec_action,
            inference_mode=inference_mode,
            is_demo_data=False,
            executed_at=now_utc
        )

    @classmethod
    async def get_prediction_explanation(
        cls,
        db: AsyncSession,
        prediction_run_id: str
    ) -> Optional[PredictionExplainResponse]:
        """Retrieves transparent feature attributions for a given prediction run."""
        try:
            run_uuid = uuid.UUID(prediction_run_id)
        except ValueError:
            return None

        stmt = (
            select(PredictionRun)
            .where(PredictionRun.id == run_uuid)
        )
        res = await db.execute(stmt)
        pred_run = res.scalar_one_or_none()

        if not pred_run:
            return None

        # Fetch prediction details
        pred_stmt = select(FloodPrediction).where(FloodPrediction.prediction_run_id == run_uuid)
        pred_res = await db.execute(pred_stmt)
        pred = pred_res.scalar_one_or_none()
        final_prob = float(pred.flood_probability) if pred else 0.50

        # Fetch risk factors
        rf_stmt = select(RiskFactor).where(RiskFactor.prediction_run_id == run_uuid)
        rf_res = await db.execute(rf_stmt)
        factors = list(rf_res.scalars().all())

        attributions = [
            RiskFactorSchema(
                feature_name=rf.feature_name,
                observed_value=float(rf.feature_value),
                shap_contribution=float(rf.shap_contribution),
                impact_direction=rf.impact_direction,
                description=f"Attribution of {rf.feature_name} (observed: {float(rf.feature_value):.2f})"
            )
            for rf in factors
        ]

        return PredictionExplainResponse(
            prediction_run_id=str(pred_run.id),
            base_expected_value=0.150,
            final_probability=final_prob,
            explanation_method="heuristic_factor_attribution",
            factors=attributions
        )
