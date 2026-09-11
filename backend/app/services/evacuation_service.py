"""
Evacuation Center Management & Safe Path Routing Service.

Handles emergency shelter capacity, spatial distance queries via PostGIS,
and integrates with the routing adapter.
Matches Document 05 Section 8 (FR-08, FR-10).
"""

from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import EvacuationCenter
from app.schemas.evacuation import (
    EvacuationShelterSummary,
    EvacuationShelterListResponse,
    EvacuationRoutePlanResponse,
    RouteDetails,
)
from app.schemas.zones import CentroidSchema
from app.services.routing.adapter import BaseRoutingProvider, NullRoutingProvider


class EvacuationService:
    """Service for managing evacuation centers and routing evacuees."""

    # Default package-level routing provider (Null by default to prevent fabrication)
    _default_provider: BaseRoutingProvider = NullRoutingProvider()

    @classmethod
    def set_routing_provider(cls, provider: BaseRoutingProvider):
        """Allows injecting an active road network routing provider (e.g. for testing)."""
        cls._default_provider = provider

    @classmethod
    def get_routing_provider(cls) -> BaseRoutingProvider:
        """Retrieves active routing provider."""
        return cls._default_provider

    @classmethod
    async def get_shelters(
        cls,
        db: AsyncSession,
        zone_id: Optional[str] = None,
        is_active: Optional[bool] = True,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        max_distance_meters: Optional[float] = None
    ) -> EvacuationShelterListResponse:
        """Queries evacuation centers with available capacity and optional PostGIS distance calculation."""
        if origin_lat is not None and origin_lon is not None:
            origin_geom = func.ST_SetSRID(func.ST_MakePoint(origin_lon, origin_lat), 4326)
            dist_expr = func.ST_DistanceSphere(EvacuationCenter.location, origin_geom).label("dist_m")
            stmt = select(
                EvacuationCenter,
                func.ST_Y(EvacuationCenter.location).label("lat"),
                func.ST_X(EvacuationCenter.location).label("lon"),
                dist_expr
            )
            if max_distance_meters is not None:
                stmt = stmt.where(func.ST_DistanceSphere(EvacuationCenter.location, origin_geom) <= max_distance_meters)
            stmt = stmt.order_by("dist_m")
        else:
            stmt = select(
                EvacuationCenter,
                func.ST_Y(EvacuationCenter.location).label("lat"),
                func.ST_X(EvacuationCenter.location).label("lon")
            )

        if is_active is not None:
            stmt = stmt.where(EvacuationCenter.is_active == is_active)

        res = await db.execute(stmt)
        rows = res.all()

        shelters = []
        for row in rows:
            center = row[0]
            lat = row[1]
            lon = row[2]
            dist_m = row[3] if len(row) > 3 else None

            max_cap = center.max_capacity
            curr_occ = center.current_occupancy or 0
            avail_cap = max(0, max_cap - curr_occ)

            shelters.append(
                EvacuationShelterSummary(
                    id=center.id,
                    name=center.name,
                    address=center.address,
                    max_capacity=max_cap,
                    current_occupancy=curr_occ,
                    available_capacity=avail_cap,
                    has_backup_power=center.has_backup_power,
                    location=CentroidSchema(
                        latitude=float(lat) if lat is not None else 19.0850,
                        longitude=float(lon) if lon is not None else 72.8890
                    ),
                    is_active=center.is_active,
                    distance_meters=float(dist_m) if dist_m is not None else None
                )
            )

        return EvacuationShelterListResponse(
            total_shelters=len(shelters),
            shelters=shelters
        )

    @classmethod
    async def plan_evacuation_route(
        cls,
        db: AsyncSession,
        origin_lat: float,
        origin_lon: float,
        destination_shelter_id: Optional[str] = None,
        avoid_flood_zones: bool = True,
        routing_provider: Optional[BaseRoutingProvider] = None
    ) -> EvacuationRoutePlanResponse:
        """Plans safe evacuation route to designated or nearest available capacity shelter."""
        provider = routing_provider or cls._default_provider

        # 1. Identify target shelter
        target_center = None
        target_lat = None
        target_lon = None

        if destination_shelter_id:
            stmt = select(
                EvacuationCenter,
                func.ST_Y(EvacuationCenter.location).label("lat"),
                func.ST_X(EvacuationCenter.location).label("lon")
            ).where(EvacuationCenter.id == destination_shelter_id)
            res = await db.execute(stmt)
            row = res.first()
            if row:
                target_center, target_lat, target_lon = row
        else:
            # Find nearest active shelter with available capacity > 0
            origin_geom = func.ST_SetSRID(func.ST_MakePoint(origin_lon, origin_lat), 4326)
            stmt = (
                select(
                    EvacuationCenter,
                    func.ST_Y(EvacuationCenter.location).label("lat"),
                    func.ST_X(EvacuationCenter.location).label("lon")
                )
                .where(
                    EvacuationCenter.is_active == True,
                    (EvacuationCenter.max_capacity - EvacuationCenter.current_occupancy) > 0
                )
                .order_by(func.ST_DistanceSphere(EvacuationCenter.location, origin_geom))
                .limit(1)
            )
            res = await db.execute(stmt)
            row = res.first()
            if row:
                target_center, target_lat, target_lon = row

        if not target_center:
            return EvacuationRoutePlanResponse(
                recommended_shelter=None,
                route=None,
                routing_status="ROUTING_UNAVAILABLE",
                message="No operational shelter with available capacity found within operational proximity."
            )

        avail_cap = max(0, target_center.max_capacity - (target_center.current_occupancy or 0))
        shelter_dict = {
            "shelter_id": target_center.id,
            "name": target_center.name,
            "address": target_center.address,
            "available_capacity": avail_cap,
            "location": {
                "latitude": float(target_lat) if target_lat is not None else 19.0850,
                "longitude": float(target_lon) if target_lon is not None else 72.8890
            }
        }

        # 2. Check routing provider availability
        if not provider.is_available:
            return EvacuationRoutePlanResponse(
                recommended_shelter=shelter_dict,
                route=None,
                routing_status="ROUTING_UNAVAILABLE",
                message="Road network routing provider is not configured or offline. Real evacuation route cannot be fabricated without active road network topology."
            )

        # 3. Compute route via provider
        route_details = provider.plan_route(
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            dest_lat=float(target_lat),
            dest_lon=float(target_lon),
            avoid_flood_zones=avoid_flood_zones
        )

        if not route_details:
            return EvacuationRoutePlanResponse(
                recommended_shelter=shelter_dict,
                route=None,
                routing_status="ROUTING_UNAVAILABLE",
                message="No traversable dry path could be established to destination shelter under current flood exclusions."
            )

        return EvacuationRoutePlanResponse(
            recommended_shelter=shelter_dict,
            route=route_details,
            routing_status="AVAILABLE",
            message="Optimal safe evacuation pathway computed successfully."
        )
