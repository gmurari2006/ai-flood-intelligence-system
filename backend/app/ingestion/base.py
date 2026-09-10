"""
Base Provider Client Abstraction for Data Ingestion.

Defines the interface for external environmental data providers.
"""

from abc import ABC, abstractmethod
from typing import NamedTuple, Optional
from backend.app.schemas.ingestion import (
    WeatherObservationCreate,
    RainfallObservationCreate,
    WaterLevelObservationCreate,
)


class ProviderPayload(NamedTuple):
    weather: Optional[WeatherObservationCreate] = None
    rainfall: Optional[RainfallObservationCreate] = None
    water_level: Optional[WaterLevelObservationCreate] = None


class ProviderIngestionError(Exception):
    """Raised when an external data provider fails to respond or returns invalid data."""
    def __init__(self, provider_id: str, message: str, original_exception: Optional[Exception] = None):
        self.provider_id = provider_id
        self.message = message
        self.original_exception = original_exception
        super().__init__(f"[{provider_id}] {message}")


class BaseProvider(ABC):
    """Abstract Base Class for all external environmental data source providers."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique data source ID matching data_sources.id (e.g. 'SRC-OPEN-METEO')."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name (e.g. 'Open-Meteo REST API')."""
        pass

    @property
    @abstractmethod
    def source_type(self) -> str:
        """Source type identifier ('API', 'RIVER_GAUGE_SENSOR', 'DEM_SATELLITE')."""
        pass

    @abstractmethod
    async def fetch_observations(
        self,
        zone_id: str,
        latitude: float,
        longitude: float
    ) -> ProviderPayload:
        """
        Fetches environmental data from external source and converts to normalized schemas.
        Must isolate provider response parsing from database persistence logic.
        """
        pass
