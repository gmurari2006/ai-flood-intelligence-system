"""
Data Ingestion Layer Package.
"""

from app.ingestion.base import BaseProvider, ProviderPayload, ProviderIngestionError
from app.ingestion.clients import OpenMeteoClient, RiverGaugeClient

__all__ = [
    "BaseProvider",
    "ProviderPayload",
    "ProviderIngestionError",
    "OpenMeteoClient",
    "RiverGaugeClient",
]
