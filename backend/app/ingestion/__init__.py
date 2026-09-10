"""
Data Ingestion Layer Package.
"""

from backend.app.ingestion.base import BaseProvider, ProviderPayload, ProviderIngestionError
from backend.app.ingestion.clients import OpenMeteoClient, RiverGaugeClient

__all__ = [
    "BaseProvider",
    "ProviderPayload",
    "ProviderIngestionError",
    "OpenMeteoClient",
    "RiverGaugeClient",
]
