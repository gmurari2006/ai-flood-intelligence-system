"""
Open-Meteo REST API Data Provider Client.

Fetches real meteorological observations (weather, rainfall) from Open-Meteo REST API.
"""

from datetime import datetime, timezone
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.ingestion.base import BaseProvider, ProviderPayload, ProviderIngestionError
from backend.app.schemas.ingestion import WeatherObservationCreate, RainfallObservationCreate


class OpenMeteoClient(BaseProvider):
    """Client for Open-Meteo weather and precipitation forecast API."""

    @property
    def provider_id(self) -> str:
        return "SRC-OPEN-METEO"

    @property
    def provider_name(self) -> str:
        return "Open-Meteo REST API"

    @property
    def source_type(self) -> str:
        return "API"

    async def fetch_observations(
        self,
        zone_id: str,
        latitude: float,
        longitude: float
    ) -> ProviderPayload:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
            "hourly": "precipitation",
            "forecast_days": 3,
            "timezone": "UTC"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(settings.OPEN_METEO_API_URL, params=params)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.error(f"Open-Meteo API request failed for zone '{zone_id}': {exc}")
            raise ProviderIngestionError(self.provider_id, f"Network or HTTP error during API call", exc)
        except Exception as exc:
            logger.error(f"Unexpected error parsing Open-Meteo response for zone '{zone_id}': {exc}")
            raise ProviderIngestionError(self.provider_id, "Malformed provider response payload", exc)

        try:
            current = data.get("current", {})
            hourly = data.get("hourly", {})
            precip_list = hourly.get("precipitation", [])

            now_utc = datetime.now(timezone.utc).replace(microsecond=0)

            # Weather metrics
            temp_c = current.get("temperature_2m")
            humidity_pct = current.get("relative_humidity_2m")
            wind_speed = current.get("wind_speed_10m")

            weather_obs = WeatherObservationCreate(
                zone_id=zone_id,
                source_id=self.provider_id,
                temperature_c=float(temp_c) if temp_c is not None else None,
                humidity_pct=float(humidity_pct) if humidity_pct is not None else None,
                wind_speed_kmh=float(wind_speed) if wind_speed is not None else None,
                observed_at=now_utc
            )

            # Rainfall metrics from hourly precipitation list
            rain_1h = float(precip_list[0]) if precip_list else 0.0
            rain_6h = float(sum(precip_list[:6])) if len(precip_list) >= 6 else rain_1h * 6
            rain_24h = float(sum(precip_list[:24])) if len(precip_list) >= 24 else rain_6h * 4
            rain_72h = float(sum(precip_list[:72])) if len(precip_list) >= 72 else rain_24h * 3

            rainfall_obs = RainfallObservationCreate(
                zone_id=zone_id,
                source_id=self.provider_id,
                rainfall_1h_mm=max(0.0, rain_1h),
                rainfall_6h_mm=max(0.0, rain_6h),
                rainfall_24h_mm=max(0.0, rain_24h),
                rainfall_72h_mm=max(0.0, rain_72h),
                observed_at=now_utc
            )

            return ProviderPayload(weather=weather_obs, rainfall=rainfall_obs)

        except Exception as exc:
            logger.error(f"Failed to normalize Open-Meteo payload for zone '{zone_id}': {exc}")
            raise ProviderIngestionError(self.provider_id, "Validation failure parsing provider payload", exc)
