"""
Historical Flood Analytics & Data Export Service.

Executes queries on historical flood archives and generates structured JSON or RFC 4180 CSV exports.
Matches Document 05 Section 11 (FR-11, FR-15).
"""

import io
import csv
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    HistoricalFloodEvent,
    PredictionRun,
    FloodPrediction,
    RiskScore,
    Alert,
    InfrastructureAsset,
    GeographicZone,
)
from app.schemas.analytics import (
    HistoricalFloodEventItem,
    HistoricalAnalyticsResponse,
    DataExportResponse,
)


class AnalyticsService:
    """Service for querying historical flood events and exporting operational datasets."""

    @classmethod
    async def get_historical_events(
        cls,
        db: AsyncSession,
        zone_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> HistoricalAnalyticsResponse:
        """Queries historical flood records with optional zone and temporal range filtering."""
        stmt = select(HistoricalFloodEvent).order_by(desc(HistoricalFloodEvent.event_date))

        if zone_id:
            stmt = stmt.where(HistoricalFloodEvent.zone_id == zone_id)
        if start_date:
            stmt = stmt.where(HistoricalFloodEvent.event_date >= start_date)
        if end_date:
            stmt = stmt.where(HistoricalFloodEvent.event_date <= end_date)

        res = await db.execute(stmt)
        events = res.scalars().all()

        event_items = [
            HistoricalFloodEventItem(
                event_id=str(e.id),
                event_date=e.event_date.isoformat(),
                peak_water_depth_m=float(e.peak_water_depth_m) if e.peak_water_depth_m is not None else None,
                total_rainfall_mm=float(e.total_rainfall_mm) if e.total_rainfall_mm is not None else None,
                severity_level=e.severity_level,
                notes=e.notes
            )
            for e in events
        ]

        return HistoricalAnalyticsResponse(
            zone_id=zone_id,
            total_recorded_events=len(event_items),
            historical_events=event_items
        )

    @classmethod
    async def export_data(
        cls,
        db: AsyncSession,
        data_type: str,
        export_format: str
    ) -> tuple[Any, str]:
        """Exports real database records in JSON or RFC 4180 CSV format.
        
        Returns: (payload_data, media_type)
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        records: List[Dict[str, Any]] = []

        clean_type = data_type.lower()

        if clean_type == "predictions":
            stmt = (
                select(PredictionRun, FloodPrediction, RiskScore)
                .outerjoin(FloodPrediction, FloodPrediction.prediction_run_id == PredictionRun.id)
                .outerjoin(RiskScore, RiskScore.prediction_run_id == PredictionRun.id)
                .order_by(desc(PredictionRun.run_timestamp))
                .limit(500)
            )
            res = await db.execute(stmt)
            for run, pred, risk in res.all():
                records.append({
                    "prediction_run_id": str(run.id),
                    "zone_id": run.zone_id,
                    "forecast_horizon_hours": run.forecast_horizon_hours,
                    "run_timestamp": run.run_timestamp.isoformat() if run.run_timestamp else None,
                    "flood_probability": float(pred.flood_probability) if pred else None,
                    "predicted_depth_m": float(pred.predicted_depth_m) if pred else None,
                    "risk_score_numeric": float(risk.risk_score_numeric) if risk else None,
                    "risk_level": risk.risk_level if risk else None,
                })

        elif clean_type == "alerts":
            stmt = select(Alert).order_by(desc(Alert.issued_at)).limit(500)
            res = await db.execute(stmt)
            for a in res.scalars().all():
                records.append({
                    "alert_id": str(a.id),
                    "zone_id": a.zone_id,
                    "severity": a.severity,
                    "title": a.title,
                    "message": a.message,
                    "status": a.status,
                    "issued_at": a.issued_at.isoformat() if a.issued_at else None,
                    "expires_at": a.expires_at.isoformat() if a.expires_at else None,
                })

        elif clean_type == "infrastructure":
            stmt = select(InfrastructureAsset).order_by(InfrastructureAsset.id).limit(500)
            res = await db.execute(stmt)
            for asset in res.scalars().all():
                records.append({
                    "asset_id": asset.id,
                    "name": asset.name,
                    "asset_type": asset.asset_type,
                    "zone_id": asset.zone_id,
                    "elevation_m": float(asset.elevation_m),
                    "capacity": asset.capacity,
                })

        elif clean_type == "historical":
            stmt = select(HistoricalFloodEvent).order_by(desc(HistoricalFloodEvent.event_date)).limit(500)
            res = await db.execute(stmt)
            for h in res.scalars().all():
                records.append({
                    "event_id": str(h.id),
                    "zone_id": h.zone_id,
                    "event_date": h.event_date.isoformat(),
                    "peak_water_depth_m": float(h.peak_water_depth_m) if h.peak_water_depth_m is not None else None,
                    "total_rainfall_mm": float(h.total_rainfall_mm) if h.total_rainfall_mm is not None else None,
                    "severity_level": h.severity_level,
                    "notes": h.notes,
                })

        elif clean_type == "zones":
            stmt = select(GeographicZone).order_by(GeographicZone.id)
            res = await db.execute(stmt)
            for z in res.scalars().all():
                records.append({
                    "zone_id": z.id,
                    "name": z.name,
                    "location_id": z.location_id,
                    "elevation_mean_m": float(z.elevation_mean_m),
                    "drainage_capacity_score": float(z.drainage_capacity_score) if z.drainage_capacity_score is not None else None,
                    "population_density": float(z.population_density) if z.population_density is not None else None,
                })

        if export_format.lower() == "csv":
            output = io.StringIO()
            if records:
                fieldnames = list(records[0].keys())
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                for row in records:
                    writer.writerow(row)
            else:
                output.write("no_data_available\n")
            return output.getvalue(), "text/csv"

        # Default JSON format
        return DataExportResponse(
            exported_at=now,
            record_count=len(records),
            data_type=clean_type,
            records=records
        ), "application/json"
