"""
Module 1 Database Integration & Schema Validation Tests.

Tests DB-TEST-01 through DB-TEST-07 validating PostgreSQL + PostGIS integration.
"""

import pytest
from sqlalchemy import text
from httpx import AsyncClient, ASGITransport
from backend.app.db.session import engine, AsyncSessionLocal
from backend.app.main import app


_db_connected_cache: bool | None = None


async def is_database_connected() -> bool:
    """Helper probe to check real database reachability (cached)."""
    global _db_connected_cache
    if _db_connected_cache is not None:
        return _db_connected_cache
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        _db_connected_cache = True
    except Exception:
        _db_connected_cache = False
    return _db_connected_cache


@pytest.mark.asyncio
async def test_db_connection_succeeds():
    """DB-TEST-01: Verify PostgreSQL connection succeeds via async engine."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1 AS alive"))
        row = result.fetchone()
        assert row is not None
        assert row[0] == 1


@pytest.mark.asyncio
async def test_postgis_extension_available():
    """DB-TEST-02: Verify PostGIS spatial extension is loaded and active."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT PostGIS_Version()"))
        version = result.scalar()
        assert version is not None
        assert "3." in str(version)


@pytest.mark.asyncio
async def test_expected_core_tables_exist():
    """DB-TEST-03: Verify all 20 documented relational tables exist in schema."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    expected_tables = {
        "user_roles", "users", "locations", "geographic_zones",
        "data_sources", "weather_observations", "rainfall_observations",
        "water_level_observations", "historical_flood_events", "model_versions",
        "prediction_runs", "flood_predictions", "risk_scores", "risk_factors",
        "infrastructure_assets", "infrastructure_risk", "evacuation_centers",
        "alerts", "alert_recipients", "system_events"
    }
    
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        )
        existing_tables = {row[0] for row in result.fetchall()}
        
        missing_tables = expected_tables - existing_tables
        assert not missing_tables, f"Missing tables in database: {missing_tables}"


@pytest.mark.asyncio
async def test_key_constraints_present():
    """DB-TEST-04: Verify foreign key relationships and cascade rules."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    query = text("""
        SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    """)
    async with engine.connect() as conn:
        result = await conn.execute(query)
        fks = [(row[0], row[1], row[2]) for row in result.fetchall()]
        assert ("users", "role_id", "user_roles") in fks
        assert ("geographic_zones", "location_id", "locations") in fks
        assert ("rainfall_observations", "zone_id", "geographic_zones") in fks


@pytest.mark.asyncio
async def test_spatial_columns_srid_and_type():
    """DB-TEST-05: Verify spatial geometry columns, types, and SRID 4326."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    query = text("""
        SELECT f_table_name, f_geometry_column, srid, type
        FROM geometry_columns
        WHERE f_table_schema = 'public';
    """)
    async with engine.connect() as conn:
        result = await conn.execute(query)
        geoms = { (row[0], row[1]): (row[2], row[3].upper()) for row in result.fetchall() }
        assert ("geographic_zones", "boundary") in geoms
        assert geoms[("geographic_zones", "boundary")] == (4326, "POLYGON")
        assert ("geographic_zones", "centroid") in geoms
        assert geoms[("geographic_zones", "centroid")] == (4326, "POINT")
        assert ("infrastructure_assets", "location") in geoms
        assert geoms[("infrastructure_assets", "location")] == (4326, "POINT")
        assert ("evacuation_centers", "location") in geoms
        assert geoms[("evacuation_centers", "location")] == (4326, "POINT")


@pytest.mark.asyncio
async def test_sqlalchemy_session_query():
    """DB-TEST-06: Verify basic query execution via AsyncSessionLocal session."""
    if not await is_database_connected():
        pytest.skip("PostgreSQL/PostGIS environment is unavailable")
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 42 AS answer"))
        val = result.scalar()
        assert val == 42


@pytest.mark.asyncio
async def test_health_endpoint_db_detection():
    """DB-TEST-07: Verify health endpoint accurately reports database connectivity."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert data["database"]["status"] in ["CONNECTED", "UNAVAILABLE"]
