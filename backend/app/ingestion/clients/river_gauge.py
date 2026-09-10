"""
River Gauge Sensor Data Provider Client.

Fetches/parses hydrodynamic river gauge observations.
"""

from datetime import datetime, timezone
from typing import Optional
from backend.app.core.logging import logger
from backend.app.ingestion.base import BaseProvider, ProviderPayload, ProviderIngestionError
from backend.app.schemas.ingestion import WaterLevelObservationCreate


class RiverGaugeClient(BaseProvider):
    """Client for river gauge telemetry and water level monitoring stations."""

    @property
    def provider_id(self) -> str:
        return "SRC-RIVER-GAUGE"

    @property
    def provider_name(self) -> str:
        return "River Gauge Sensor Network"

    @property
    def source_type(self) -> str:
        return "RIVER_GAUGE_SENSOR"

    async def fetch_observations(
        self,
        zone_id: str,
        latitude: float,
        longitude: float
    ) -> ProviderPayload:
        """
        Synthesizes / fetches gauge telemetry for the zone.
        Isolated from database persistence logic.
        """
        now_utc = datetime.now(timezone.utc).replace(microsecond=0)
        
        # Base schema validation
        obs = WaterLevelObservationCreate(
            zone_id=zone_id,
            river_name="Mithi River",
            gauge_station_id=f"GAUGE-{zone_id}",
            water_level_m=4.85,
            warning_level_m=3.50,
            danger_level_m=4.20,
            discharge_rate_m3s=120.5,
            observed_at=now_utc
        )
        return ProviderPayload(water_level=obs)
