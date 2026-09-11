"""
Geographic Zone Service.

Queries monitored hydrological zones and spatial centroids from PostgreSQL/PostGIS.
"""

from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import GeographicZone
from app.schemas.zones import ZoneListResponse, ZoneSummarySchema, CentroidSchema


class ZoneService:
    """Service for querying geographic zones and spatial coordinates."""

    @classmethod
    async def get_all_zones(cls, db: AsyncSession) -> ZoneListResponse:
        """Retrieves all monitored geographic zones with spatial centroids."""
        stmt = (
            select(
                GeographicZone,
                func.ST_Y(GeographicZone.centroid).label("lat"),
                func.ST_X(GeographicZone.centroid).label("lon")
            )
            .order_by(GeographicZone.id)
        )
        res = await db.execute(stmt)
        rows = res.all()

        zone_schemas = []
        for zone, lat, lon in rows:
            zone_schemas.append(
                ZoneSummarySchema(
                    id=zone.id,
                    name=zone.name,
                    location_id=zone.location_id,
                    elevation_mean_m=float(zone.elevation_mean_m),
                    drainage_capacity_score=float(zone.drainage_capacity_score) if zone.drainage_capacity_score is not None else None,
                    centroid=CentroidSchema(
                        latitude=float(lat) if lat is not None else 19.0760,
                        longitude=float(lon) if lon is not None else 72.8777
                    )
                )
            )

        return ZoneListResponse(
            total_count=len(zone_schemas),
            zones=zone_schemas
        )

    @classmethod
    async def get_zone_by_id(cls, db: AsyncSession, zone_id: str) -> Optional[GeographicZone]:
        """Retrieves a single geographic zone by ID."""
        stmt = select(GeographicZone).where(GeographicZone.id == zone_id)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
