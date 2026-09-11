"""
Integration and Unit Tests for Backend Foundation & Health Diagnostics Endpoint.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_system_health_endpoint():
    """Verify that /api/v1/system/health returns valid schema structure."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "timestamp" in data
    assert "database" in data
    assert "ai_engine" in data
    assert "weather_stream" in data
    assert "status" in data["database"]
    assert "status" in data["ai_engine"]
    assert "status" in data["weather_stream"]
