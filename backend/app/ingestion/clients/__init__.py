"""
Ingestion Provider Clients Package.
"""

from app.ingestion.clients.open_meteo import OpenMeteoClient
from app.ingestion.clients.river_gauge import RiverGaugeClient

__all__ = ["OpenMeteoClient", "RiverGaugeClient"]
