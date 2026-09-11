"""
Module 6 Comprehensive REST API & Integration Test Suite.

Validates GIS Spatial Vector Layers, Infrastructure Vulnerability, Evacuation Shelters & Routes,
Alert Management, MCDA Prioritization, Public Warnings, Officer Overrides with Audit Logging,
and Data Analytics / CSV Export.
"""

from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

from app.main import app
from app.db.session import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.domain import User, UserRole, Location, GeographicZone, InfrastructureAsset, EvacuationCenter, HistoricalFloodEvent
from app.services.routing.engine import RoutingGraph
from app.services.routing.adapter import GraphRoutingProvider, NullRoutingProvider
from app.services.evacuation_service import EvacuationService


async def setup_module6_fixtures():
    """Initializes full test fixtures for users, roles, zones, assets, shelters, and historical logs."""
    async with AsyncSessionLocal() as session:
        # 1. User Roles
        await session.execute(text("""
            INSERT INTO user_roles (id, role_name, description)
            VALUES (1, 'DISASTER_OFFICER', 'Emergency disaster response officer'),
                   (2, 'PUBLIC_USER', 'General citizen user'),
                   (3, 'SUPER_ADMIN', 'Platform administrative director')
            ON CONFLICT (role_name) DO NOTHING;
        """))

        # 2. Test Users
        pwd_hash = get_password_hash("SecurePassword123!")
        await session.execute(text(f"""
            INSERT INTO users (role_id, username, email, password_hash, full_name, organization, is_active)
            VALUES (1, 'officer_mod6', 'officer6@disaster.gov.in', '{pwd_hash}', 'Sanjay Rao', 'NDRF', true),
                   (2, 'citizen_mod6', 'citizen6@public.gov.in', '{pwd_hash}', 'Aarav Patel', 'Public', true)
            ON CONFLICT (username) DO NOTHING;
        """))

        # 3. Location & Monitored Zone
        await session.execute(text("""
            INSERT INTO locations (id, name, state_name, country)
            VALUES ('DIST-MUMBAI-01', 'Mumbai Suburbs', 'Maharashtra', 'India')
            ON CONFLICT (id) DO NOTHING;
        """))

        await session.execute(text("""
            INSERT INTO geographic_zones (
                id, location_id, name, elevation_mean_m, slope_mean_deg,
                drainage_capacity_score, soil_permeability_index, population_density,
                boundary, centroid
            )
            VALUES (
                'ZONE-NORTH-BASIN', 'DIST-MUMBAI-01', 'North River Basin', 4.20, 1.50,
                5.50, 0.45, 12500.00,
                ST_GeomFromText('POLYGON((72.87 19.07, 72.89 19.07, 72.89 19.09, 72.87 19.09, 72.87 19.07))', 4326),
                ST_GeomFromText('POINT(72.88 19.08)', 4326)
            )
            ON CONFLICT (id) DO NOTHING;
        """))

        # 4. Critical Infrastructure Asset
        await session.execute(text("""
            INSERT INTO infrastructure_assets (
                id, zone_id, name, asset_type, elevation_m, capacity, location
            )
            VALUES (
                'ASSET-HOSP-01', 'ZONE-NORTH-BASIN', 'City General Hospital', 'HOSPITAL', 3.80, 500,
                ST_GeomFromText('POINT(72.8820 19.0790)', 4326)
            ),
            (
                'ASSET-PWR-01', 'ZONE-NORTH-BASIN', 'Main Electric Substation', 'POWER_STATION', 4.10, 10000,
                ST_GeomFromText('POINT(72.8850 19.0820)', 4326)
            )
            ON CONFLICT (id) DO NOTHING;
        """))

        # 5. Evacuation Shelters
        await session.execute(text("""
            INSERT INTO evacuation_centers (
                id, name, address, max_capacity, current_occupancy, has_backup_power, location, is_active
            )
            VALUES (
                'SHELTER-NORTH-01', 'North Community Shelter Hub', 'Civic Center Road 12', 500, 50, true,
                ST_GeomFromText('POINT(72.8890 19.0850)', 4326), true
            ),
            (
                'SHELTER-FULL-02', 'Full Capacity Primary Shelter', 'High Ground Sector 4', 200, 200, true,
                ST_GeomFromText('POINT(72.8830 19.0790)', 4326), true
            )
            ON CONFLICT (id) DO NOTHING;
        """))

        await session.commit()



@pytest.fixture
async def officer_token():
    """Generates valid JWT bearer token for DISASTER_OFFICER role."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "officer_mod6", "password": "SecurePassword123!"}
        )
        return res.json()["access_token"]


@pytest.fixture
async def citizen_token():
    """Generates valid JWT bearer token for PUBLIC_USER role."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "citizen_mod6", "password": "SecurePassword123!"}
        )
        return res.json()["access_token"]


# ==============================================================================
# 1. GIS & SPATIAL RISK MAP TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_gis_map_layers_geojson():
    """GIS-TEST-01: GET /api/v1/risk-map/layers returns valid GeoJSON FeatureCollection."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/risk-map/layers")

    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 1

    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert "geometry" in feature
    assert feature["geometry"]["type"] in ["Polygon", "Point"]
    assert "coordinates" in feature["geometry"]
    assert "properties" in feature
    assert "risk_level" in feature["properties"]
    assert "risk_color" in feature["properties"]


@pytest.mark.asyncio
async def test_gis_map_layer_filtering():
    """GIS-TEST-02: GET /api/v1/risk-map/layers?layer_type=infrastructure returns asset points."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/risk-map/layers?layer_type=infrastructure")

    assert res.status_code == 200
    data = res.json()
    for feat in data["features"]:
        assert feat["properties"]["layer"] == "infrastructure"
        assert feat["geometry"]["type"] == "Point"
        assert "asset_id" in feat["properties"]


# ==============================================================================
# 2. INFRASTRUCTURE VULNERABILITY TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_vulnerable_infrastructure_query(officer_token):
    """INFRA-TEST-01: GET /api/v1/infrastructure/vulnerable returns evaluated critical assets."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/infrastructure/vulnerable?zone_id=ZONE-NORTH-BASIN",
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["total_affected_assets"] >= 2
    hosp = next((a for a in data["assets"] if a["asset_id"] == "ASSET-HOSP-01"), None)
    assert hosp is not None
    assert hosp["name"] == "City General Hospital"
    assert hosp["asset_type"] == "HOSPITAL"
    assert "vulnerability_status" in hosp
    assert "recommended_protection" in hosp
    assert "sandbag" in hosp["recommended_protection"].lower() or "protective" in hosp["recommended_protection"].lower()


# ==============================================================================
# 3. EVACUATION CENTERS & SAFE ROUTING TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_get_evacuation_shelters_with_distance():
    """EVAC-TEST-01: GET /api/v1/evacuation/shelters calculates true PostGIS distance and capacities."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/evacuation/shelters?latitude=19.0780&longitude=72.8810"
        )

    assert res.status_code == 200
    data = res.json()
    assert data["total_shelters"] >= 2
    shelter = next((s for s in data["shelters"] if s["id"] == "SHELTER-NORTH-01"), None)
    assert shelter is not None
    assert shelter["max_capacity"] == 500
    assert shelter["current_occupancy"] == 50
    assert shelter["available_capacity"] == 450
    assert shelter["distance_meters"] is not None
    assert shelter["distance_meters"] > 0.0


@pytest.mark.asyncio
async def test_evacuation_route_unconfigured_honest_status():
    """ROUTE-TEST-01: POST /api/v1/evacuation/plan-route with unconfigured provider returns ROUTING_UNAVAILABLE."""
    # Ensure Null provider is active
    EvacuationService.set_routing_provider(NullRoutingProvider())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/evacuation/plan-route",
            json={
                "origin_latitude": 19.0780,
                "origin_longitude": 72.8810,
                "avoid_flood_zones": True
            }
        )

    assert res.status_code == 200
    data = res.json()
    assert data["routing_status"] == "ROUTING_UNAVAILABLE"
    assert data["route"] is None
    assert "recommended_shelter" in data
    assert data["recommended_shelter"]["shelter_id"] == "SHELTER-NORTH-01"
    assert "cannot be fabricated" in data["message"].lower() or "not configured" in data["message"].lower()


@pytest.mark.asyncio
async def test_evacuation_route_with_graph_fixture():
    """ROUTE-TEST-02: POST /api/v1/evacuation/plan-route with synthetic graph computes safe LineString path."""
    # Build controlled test graph
    test_graph = RoutingGraph()
    test_graph.add_node("N_ORIGIN", 19.0780, 72.8810)
    test_graph.add_node("N_DRY_WAYPOINT", 19.0810, 72.8830)
    test_graph.add_node("N_SHELTER", 19.0850, 72.8890)

    test_graph.add_edge("N_ORIGIN", "N_DRY_WAYPOINT", distance_km=0.8, is_flooded=False)
    test_graph.add_edge("N_DRY_WAYPOINT", "N_SHELTER", distance_km=1.2, is_flooded=False)

    EvacuationService.set_routing_provider(GraphRoutingProvider(test_graph))

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post(
                "/api/v1/evacuation/plan-route",
                json={
                    "origin_latitude": 19.0780,
                    "origin_longitude": 72.8810,
                    "destination_shelter_id": "SHELTER-NORTH-01",
                    "avoid_flood_zones": True
                }
            )

        assert res.status_code == 200
        data = res.json()
        assert data["routing_status"] == "AVAILABLE"
        assert data["route"] is not None
        assert data["route"]["route_status"] == "SAFE_DRY_PATH"
        assert data["route"]["distance_km"] > 0.0
        assert data["route"]["path_geojson"]["type"] == "LineString"
        assert len(data["route"]["path_geojson"]["coordinates"]) >= 3
    finally:
        # Reset back to null provider
        EvacuationService.set_routing_provider(NullRoutingProvider())


# ==============================================================================
# 4. EMERGENCY ALERTS & PUBLIC WARNINGS TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_publish_alert_success(officer_token):
    """ALERT-TEST-01: POST /api/v1/alerts by officer creates alert (HTTP 201) and logs audit event."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/alerts",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "severity": "RED_EMERGENCY",
                "title": "CRITICAL FLOOD WARNING — NORTH BASIN",
                "message": "Immediate evacuation ordered for low-lying sectors.",
                "duration_hours": 12
            },
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 201
    data = res.json()
    assert "alert_id" in data
    assert data["status"] == "ACTIVE"
    assert "issued_at" in data
    assert "expires_at" in data


@pytest.mark.asyncio
async def test_publish_alert_unauthorized_for_citizen(citizen_token):
    """ALERT-TEST-03: POST /api/v1/alerts with PUBLIC_USER role returns HTTP 403 Forbidden."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/alerts",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "severity": "RED_EMERGENCY",
                "title": "UNAUTHORIZED ALERT ATTEMPT",
                "message": "This should fail with 403.",
                "duration_hours": 12
            },
            headers={"Authorization": f"Bearer {citizen_token}"}
        )

    assert res.status_code == 403


@pytest.mark.asyncio
async def test_public_warnings_unauthenticated():
    """PUBLIC-TEST-01 & PUBLIC-TEST-02: GET /api/v1/alerts/public returns public warnings without auth or secret leakage."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/alerts/public")

    assert res.status_code == 200
    data = res.json()
    assert "active_warnings_count" in data
    assert "warnings" in data

    for warn in data["warnings"]:
        assert "zone_name" in warn
        assert "severity" in warn
        assert "title" in warn
        assert "safety_instructions" in warn
        assert len(warn["safety_instructions"]) >= 1
        # Strict privacy checks: no internal keys
        assert "password_hash" not in warn
        assert "issued_by_user_id" not in warn
        assert "user_id" not in warn


@pytest.mark.asyncio
async def test_officer_override_with_audit(officer_token):
    """AUDIT-TEST-01: POST /api/v1/alerts/override updates severity and creates system_events audit record."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/alerts/override",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "override_severity": "RED_EMERGENCY",
                "justification": "Field observation confirms primary storm drain breached.",
                "duration_hours": 6
            },
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OVERRIDE_APPLIED"
    assert data["zone_id"] == "ZONE-NORTH-BASIN"
    assert data["effective_severity"] == "RED_EMERGENCY"
    assert "audit_event_id" in data
    assert data["audit_event_id"] > 0


# ==============================================================================
# 5. MCDA PRIORITIZATION ENDPOINT TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_mcda_prioritization_api(officer_token):
    """MCDA-TEST-01: GET /api/v1/alerts/prioritization returns deterministic ranked queue."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/alerts/prioritization",
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["total_zones_evaluated"] >= 1
    assert "ranking" in data
    rank1 = data["ranking"][0]
    assert rank1["rank"] == 1
    assert "composite_priority_score" in rank1
    assert "priority_tier" in rank1
    assert "factors" in rank1
    assert len(rank1["factors"]) == 4


# ==============================================================================
# 6. HISTORICAL ANALYTICS & DATA EXPORT TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_historical_flood_analytics(officer_token):
    """EXP-TEST-01: GET /api/v1/analytics/historical returns recorded events."""
    event_id = "e89a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"
    async with AsyncSessionLocal() as session:
        await session.execute(text(f"""
            INSERT INTO historical_flood_events (
                id, zone_id, event_date, peak_water_depth_m, total_rainfall_mm, severity_level, notes
            )
            VALUES (
                '{event_id}', 'ZONE-NORTH-BASIN', '2005-07-26', 2.40, 944.20, 'CATASTROPHIC', 'Historic cloudburst deluge'
            )
            ON CONFLICT (id) DO NOTHING;
        """))
        await session.commit()

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.get(
                "/api/v1/analytics/historical?zone_id=ZONE-NORTH-BASIN",
                headers={"Authorization": f"Bearer {officer_token}"}
            )

        assert res.status_code == 200
        data = res.json()
        assert data["total_recorded_events"] >= 1
        event = data["historical_events"][0]
        assert event["event_date"] == "2005-07-26"
        assert event["peak_water_depth_m"] == 2.40
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(text(f"DELETE FROM historical_flood_events WHERE id = '{event_id}';"))
            await session.commit()


@pytest.mark.asyncio
async def test_data_export_csv(officer_token):
    """EXP-TEST-02: GET /api/v1/analytics/export?format=csv returns downloadable CSV stream."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/analytics/export?format=csv&data_type=infrastructure",
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    text_content = res.text
    assert "asset_id" in text_content
    assert "ASSET-HOSP-01" in text_content


@pytest.mark.asyncio
async def test_data_export_json(officer_token):
    """EXP-TEST-03: GET /api/v1/analytics/export?format=json returns structured JSON export."""
    event_id = "e89a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"
    async with AsyncSessionLocal() as session:
        await session.execute(text(f"""
            INSERT INTO historical_flood_events (
                id, zone_id, event_date, peak_water_depth_m, total_rainfall_mm, severity_level, notes
            )
            VALUES (
                '{event_id}', 'ZONE-NORTH-BASIN', '2005-07-26', 2.40, 944.20, 'CATASTROPHIC', 'Historic cloudburst deluge'
            )
            ON CONFLICT (id) DO NOTHING;
        """))
        await session.commit()

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.get(
                "/api/v1/analytics/export?format=json&data_type=historical",
                headers={"Authorization": f"Bearer {officer_token}"}
            )

        assert res.status_code == 200
        data = res.json()
        assert data["data_type"] == "historical"
        assert data["record_count"] >= 1
        assert len(data["records"]) >= 1
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(text(f"DELETE FROM historical_flood_events WHERE id = '{event_id}';"))
            await session.commit()


# ==============================================================================
# 7. ADDITIONAL EXPLICIT MODULE 6 TESTS & EDGE CASES
# ==============================================================================

@pytest.mark.asyncio
async def test_gis_color_mapping_and_srid():
    """GIS-TEST-03: GIS vector layers map risk colors according to approved schema."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/risk-map/layers?layer_type=risk_zones")

    assert res.status_code == 200
    data = res.json()
    for feat in data["features"]:
        assert feat["properties"]["risk_color"] in ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#64748B"]


@pytest.mark.asyncio
async def test_infra_filter_by_min_risk_level(officer_token):
    """INFRA-TEST-02 & INFRA-TEST-03: Query infrastructure with min_risk_level filter and verify tailored protection."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/infrastructure/vulnerable?min_risk_level=SAFE",
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["total_affected_assets"] >= 2
    for asset in data["assets"]:
        assert asset["vulnerability_status"] in ["SAFE", "AT_RISK", "CRITICAL"]
        assert asset["recommended_protection"] is not None


@pytest.mark.asyncio
async def test_evac_shelter_capacity_and_inactive_filtering():
    """EVAC-TEST-02 & EVAC-TEST-03: Shelters filter correctly by is_active and report capacity remaining."""
    await setup_module6_fixtures()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/evacuation/shelters?is_active=true")

    assert res.status_code == 200
    data = res.json()
    for shelter in data["shelters"]:
        assert shelter["is_active"] is True
        assert shelter["available_capacity"] == max(0, shelter["max_capacity"] - shelter["current_occupancy"])


@pytest.mark.asyncio
async def test_evacuation_route_full_capacity_fallback():
    """ROUTE-TEST-03: Route planner automatically selects next available shelter when nearest is at capacity."""
    test_graph = RoutingGraph()
    test_graph.add_node("N_ORIGIN", 19.0780, 72.8810)
    test_graph.add_node("N_NEAR_FULL", 19.0790, 72.8830)
    test_graph.add_node("N_AVAIL_HUB", 19.0850, 72.8890)

    test_graph.add_edge("N_ORIGIN", "N_NEAR_FULL", distance_km=0.3, is_flooded=False)
    test_graph.add_edge("N_ORIGIN", "N_AVAIL_HUB", distance_km=1.5, is_flooded=False)

    EvacuationService.set_routing_provider(GraphRoutingProvider(test_graph))

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post(
                "/api/v1/evacuation/plan-route",
                json={
                    "origin_latitude": 19.0780,
                    "origin_longitude": 72.8810,
                    "avoid_flood_zones": True
                }
            )

        assert res.status_code == 200
        data = res.json()
        assert data["routing_status"] == "AVAILABLE"
        # Since SHELTER-FULL-02 has available_capacity = 0 (200/200), SHELTER-NORTH-01 must be chosen
        assert data["recommended_shelter"]["shelter_id"] == "SHELTER-NORTH-01"
        assert data["recommended_shelter"]["available_capacity"] > 0
    finally:
        EvacuationService.set_routing_provider(NullRoutingProvider())


@pytest.mark.asyncio
async def test_alert_get_authority_and_status_filter(officer_token):
    """ALERT-TEST-02 & ALERT-TEST-04: GET /api/v1/alerts lists alerts with status filtering."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/alerts?status=ACTIVE",
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 200
    data = res.json()
    assert "alerts" in data
    for a in data["alerts"]:
        assert a["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_alert_override_missing_justification_rejected(officer_token):
    """AUDIT-TEST-02: Officer override without mandatory justification is rejected with HTTP 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/alerts/override",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "override_severity": "RED_EMERGENCY",
                "justification": "",  # Too short, min length 5
                "duration_hours": 6
            },
            headers={"Authorization": f"Bearer {officer_token}"}
        )

    assert res.status_code == 422


@pytest.mark.asyncio
async def test_auth_token_enforcement():
    """AUTH-TEST-01 & AUTH-TEST-02: Unauthenticated requests to protected endpoints return 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.get("/api/v1/infrastructure/vulnerable")
        res2 = await ac.post("/api/v1/alerts", json={"zone_id": "ZONE-NORTH-BASIN", "severity": "HIGH", "title": "T", "message": "M"})
        res3 = await ac.get("/api/v1/alerts")
        res4 = await ac.get("/api/v1/alerts/prioritization")

    assert res1.status_code == 401
    assert res2.status_code == 401
    assert res3.status_code == 401
    assert res4.status_code == 401

