"""
GIS & Spatial Risk Map Vector Layers Service.

Queries PostGIS spatial geometries and joins predictive risk metrics.
Preserves SRID 4326 and constructs GeoJSON FeatureCollections.
Matches Document 05 Section 6.1 (FR-05, FR-06).
"""

import json
from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    GeographicZone,
    PredictionRun,
    FloodPrediction,
    RiskScore,
    InfrastructureAsset,
    InfrastructureRisk,
    WaterLevelObservation,
    RainfallObservation,
)
from app.schemas.gis import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    GeoJSONGeometry,
)


class GISService:
    """Service for querying PostGIS spatial layers and predictive flood risk contours."""

    RISK_COLORS = {
        "CRITICAL": "#EF4444",
        "HIGH": "#F97316",
        "MODERATE": "#EAB308",
        "LOW": "#22C55E",
        "UNKNOWN": "#64748B",
    }

    @classmethod
    async def get_map_layers(
        cls,
        db: AsyncSession,
        layer_type: Optional[str] = None
    ) -> GeoJSONFeatureCollection:
        """Retrieves GeoJSON FeatureCollection for specified spatial layer type."""
        features = []

        if layer_type is None or layer_type in ["risk_zones", "all"]:
            zone_features = await cls._get_risk_zone_features(db)
            features.extend(zone_features)

        if layer_type in ["infrastructure", "all"]:
            infra_features = await cls._get_infrastructure_features(db)
            features.extend(infra_features)

        if layer_type in ["river_lines", "all"]:
            river_features = await cls._get_river_features(db)
            features.extend(river_features)

        if layer_type in ["rainfall_heatmap", "all"]:
            rain_features = await cls._get_rainfall_heatmap_features(db)
            features.extend(rain_features)

        return GeoJSONFeatureCollection(
            type="FeatureCollection",
            features=features
        )

    @classmethod
    async def _get_risk_zone_features(cls, db: AsyncSession) -> list[GeoJSONFeature]:
        """Queries geographic zones with PostGIS boundary polygons and joins latest risk metrics."""
        stmt = select(
            GeographicZone,
            func.ST_AsGeoJSON(GeographicZone.boundary).label("boundary_geojson")
        )
        res = await db.execute(stmt)
        rows = res.all()

        features = []
        for zone, boundary_geojson_str in rows:
            if not boundary_geojson_str:
                continue

            try:
                geom_dict = json.loads(boundary_geojson_str)
            except Exception:
                continue

            # Query latest prediction for this zone
            pred_stmt = (
                select(PredictionRun, FloodPrediction, RiskScore)
                .outerjoin(FloodPrediction, FloodPrediction.prediction_run_id == PredictionRun.id)
                .outerjoin(RiskScore, RiskScore.prediction_run_id == PredictionRun.id)
                .where(PredictionRun.zone_id == zone.id)
                .order_by(desc(PredictionRun.run_timestamp))
                .limit(1)
            )
            pred_res = await db.execute(pred_stmt)
            pred_row = pred_res.first()

            if pred_row and pred_row[1] and pred_row[2]:
                _, flood_pred, risk_score = pred_row
                risk_level = risk_score.risk_level.upper() if risk_score.risk_level else "LOW"
                risk_color = cls.RISK_COLORS.get(risk_level, cls.RISK_COLORS["UNKNOWN"])
                flood_probability = float(flood_pred.flood_probability)
                water_depth_m = float(flood_pred.predicted_depth_m)
            else:
                risk_level = "LOW"
                risk_color = cls.RISK_COLORS["LOW"]
                flood_probability = 0.0
                water_depth_m = 0.0

            properties = {
                "layer": "risk_zones",
                "zone_id": zone.id,
                "zone_name": zone.name,
                "elevation_mean_m": float(zone.elevation_mean_m),
                "drainage_capacity_score": float(zone.drainage_capacity_score) if zone.drainage_capacity_score is not None else None,
                "population_density": float(zone.population_density) if zone.population_density is not None else None,
                "risk_level": risk_level,
                "risk_color": risk_color,
                "flood_probability": flood_probability,
                "water_depth_m": water_depth_m,
            }

            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry=GeoJSONGeometry(
                        type=geom_dict.get("type", "Polygon"),
                        coordinates=geom_dict.get("coordinates", [])
                    ),
                    properties=properties
                )
            )

        return features

    @classmethod
    async def _get_infrastructure_features(cls, db: AsyncSession) -> list[GeoJSONFeature]:
        """Queries infrastructure assets with PostGIS point locations and risk status."""
        stmt = select(
            InfrastructureAsset,
            func.ST_AsGeoJSON(InfrastructureAsset.location).label("loc_geojson")
        )
        res = await db.execute(stmt)
        rows = res.all()

        features = []
        for asset, loc_geojson_str in rows:
            if not loc_geojson_str:
                continue

            try:
                geom_dict = json.loads(loc_geojson_str)
            except Exception:
                continue

            # Query latest risk assessment for asset
            risk_stmt = (
                select(InfrastructureRisk)
                .where(InfrastructureRisk.asset_id == asset.id)
                .order_by(desc(InfrastructureRisk.id))
                .limit(1)
            )
            risk_res = await db.execute(risk_stmt)
            risk_record = risk_res.scalar_one_or_none()

            vulnerability_status = risk_record.vulnerability_status if risk_record else "SAFE"
            est_depth = float(risk_record.estimated_water_depth_m) if risk_record else 0.0

            properties = {
                "layer": "infrastructure",
                "asset_id": asset.id,
                "name": asset.name,
                "asset_type": asset.asset_type,
                "zone_id": asset.zone_id,
                "elevation_m": float(asset.elevation_m),
                "capacity": asset.capacity,
                "vulnerability_status": vulnerability_status,
                "estimated_water_depth_m": est_depth,
                "recommended_protection": risk_record.recommended_protection if risk_record else None,
            }

            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry=GeoJSONGeometry(
                        type=geom_dict.get("type", "Point"),
                        coordinates=geom_dict.get("coordinates", [])
                    ),
                    properties=properties
                )
            )

        return features

    @classmethod
    async def _get_river_features(cls, db: AsyncSession) -> list[GeoJSONFeature]:
        """Queries active river gauge points."""
        stmt = (
            select(
                WaterLevelObservation,
                func.ST_AsGeoJSON(GeographicZone.centroid).label("gauge_loc_geojson")
            )
            .join(GeographicZone, GeographicZone.id == WaterLevelObservation.zone_id)
            .order_by(desc(WaterLevelObservation.observed_at))
            .limit(20)
        )
        res = await db.execute(stmt)
        rows = res.all()

        features = []
        for obs, loc_geojson_str in rows:
            if not loc_geojson_str:
                continue

            try:
                geom_dict = json.loads(loc_geojson_str)
            except Exception:
                continue

            properties = {
                "layer": "river_lines",
                "zone_id": obs.zone_id,
                "river_name": obs.river_name,
                "gauge_station_id": obs.gauge_station_id,
                "water_level_m": float(obs.water_level_m),
                "warning_level_m": float(obs.warning_level_m),
                "danger_level_m": float(obs.danger_level_m),
                "discharge_rate_m3s": float(obs.discharge_rate_m3s) if obs.discharge_rate_m3s is not None else None,
                "observed_at": obs.observed_at.isoformat() if obs.observed_at else None,
            }

            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry=GeoJSONGeometry(
                        type=geom_dict.get("type", "Point"),
                        coordinates=geom_dict.get("coordinates", [])
                    ),
                    properties=properties
                )
            )

        return features

    @classmethod
    async def _get_rainfall_heatmap_features(cls, db: AsyncSession) -> list[GeoJSONFeature]:
        """Queries recent rainfall observations positioned at zone centroids."""
        stmt = (
            select(
                RainfallObservation,
                func.ST_AsGeoJSON(GeographicZone.centroid).label("centroid_geojson")
            )
            .join(GeographicZone, GeographicZone.id == RainfallObservation.zone_id)
            .order_by(desc(RainfallObservation.observed_at))
            .limit(20)
        )
        res = await db.execute(stmt)
        rows = res.all()

        features = []
        for obs, loc_geojson_str in rows:
            if not loc_geojson_str:
                continue

            try:
                geom_dict = json.loads(loc_geojson_str)
            except Exception:
                continue

            properties = {
                "layer": "rainfall_heatmap",
                "zone_id": obs.zone_id,
                "rainfall_1h_mm": float(obs.rainfall_1h_mm),
                "rainfall_6h_mm": float(obs.rainfall_6h_mm),
                "rainfall_24h_mm": float(obs.rainfall_24h_mm),
                "observed_at": obs.observed_at.isoformat() if obs.observed_at else None,
            }

            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry=GeoJSONGeometry(
                        type=geom_dict.get("type", "Point"),
                        coordinates=geom_dict.get("coordinates", [])
                    ),
                    properties=properties
                )
            )

        return features
