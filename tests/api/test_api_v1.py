"""
Module 5 Core REST API & AI Inference / Decision Support Serving Test Suite.

Validates Authentication, RBAC, Zones, Environmental Data, Predictions (Heuristic Fallback),
XAI Explanations, and System Health.
"""

from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

from app.main import app
from app.db.session import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.domain import User, UserRole, Location, GeographicZone


async def setup_test_environment():
    """Sets up test roles, users, and geographic zones in the test database."""
    async with AsyncSessionLocal() as session:
        # 1. User Role
        role = await session.execute(text("SELECT id FROM user_roles WHERE role_name = 'DISASTER_OFFICER'"))
        role_id = role.scalar()
        if not role_id:
            res = await session.execute(text("""
                INSERT INTO user_roles (role_name, description)
                VALUES ('DISASTER_OFFICER', 'Operational disaster management officer')
                RETURNING id;
            """))
            role_id = res.scalar()
            await session.commit()

        # 2. Test User
        user = await session.execute(text("SELECT id FROM users WHERE username = 'officer_rajesh'"))
        user_id = user.scalar()
        if not user_id:
            pwd_hash = get_password_hash("SecurePassword123!")
            await session.execute(text(f"""
                INSERT INTO users (role_id, username, email, password_hash, full_name, organization, is_active)
                VALUES ({role_id}, 'officer_rajesh', 'rajesh@disaster.gov.in', '{pwd_hash}', 'Rajesh Verma', 'SDRF Maharashtra', true)
                ON CONFLICT (username) DO NOTHING;
            """))
            await session.commit()

        # 3. Location & Zone
        loc = await session.get(Location, "DIST-MUMBAI-01")
        if not loc:
            await session.execute(text("""
                INSERT INTO locations (id, name, state_name, country)
                VALUES ('DIST-MUMBAI-01', 'Mumbai Suburbs', 'Maharashtra', 'India')
                ON CONFLICT (id) DO NOTHING;
            """))
            await session.commit()

        zone = await session.get(GeographicZone, "ZONE-NORTH-BASIN")
        if not zone:
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
            await session.commit()


@pytest.mark.asyncio
async def test_auth_login_success():
    """TC-AUTH-01: Valid user credentials issue a signed JWT bearer access token."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={
                "username": "officer_rajesh",
                "password": "SecurePassword123!"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "officer_rajesh"
    assert data["user"]["role"] == "DISASTER_OFFICER"


@pytest.mark.asyncio
async def test_auth_login_invalid_password():
    """TC-AUTH-02: Invalid password returns HTTP 401 Unauthorized."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={
                "username": "officer_rajesh",
                "password": "WrongPassword999!"
            }
        )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_monitored_zones():
    """TC-ZONE-01: GET /api/v1/zones returns active monitored zones with centroids."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 1
    zone = next((z for z in data["zones"] if z["id"] == "ZONE-NORTH-BASIN"), None)
    assert zone is not None
    assert zone["id"] == "ZONE-NORTH-BASIN"
    assert "centroid" in zone
    assert "latitude" in zone["centroid"]
    assert "longitude" in zone["centroid"]


@pytest.mark.asyncio
async def test_get_zone_weather_valid():
    """TC-WEATHER-01: GET /api/v1/weather/{zone_id} returns weather & rainfall breakdown."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/weather/ZONE-NORTH-BASIN")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-NORTH-BASIN"
    assert "rainfall" in data
    assert "1h_mm" in data["rainfall"]


@pytest.mark.asyncio
async def test_get_zone_weather_unknown_zone():
    """TC-WEATHER-02: GET /api/v1/weather/{zone_id} returns 404 for unknown zone."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/weather/ZONE-NON-EXISTENT")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_zone_water_levels_valid():
    """TC-WATER-01: GET /api/v1/water-levels/{zone_id} returns river gauge observation."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/water-levels/ZONE-NORTH-BASIN")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-NORTH-BASIN"
    assert "water_level_m" in data
    assert "status" in data


@pytest.mark.asyncio
async def test_get_zone_water_levels_unknown_zone():
    """TC-WATER-02: GET /api/v1/water-levels/{zone_id} returns 404 for unknown zone."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/water-levels/ZONE-NON-EXISTENT")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_trigger_prediction_success():
    """TC-PRED-01: POST /api/v1/predictions computes risk and returns heuristic fallback response."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Obtain auth token
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "officer_rajesh", "password": "SecurePassword123!"}
        )
        token = login_res.json()["access_token"]

        response = await ac.post(
            "/api/v1/predictions",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "forecast_horizon_hours": 6
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "prediction_run_id" in data
        assert data["zone_id"] == "ZONE-NORTH-BASIN"
        assert data["forecast_horizon_hours"] == 6
        assert 0.0 <= data["flood_probability"] <= 1.0
        assert 0.0 <= data["risk_score_numeric"] <= 100.0
        assert data["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert data["inference_mode"] == "heuristic_fallback"
        assert "recommended_action" in data


@pytest.mark.asyncio
async def test_trigger_prediction_unauthorized():
    """TC-PRED-02: POST /api/v1/predictions without token returns HTTP 401."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/predictions",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "forecast_horizon_hours": 6
            }
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_trigger_prediction_invalid_horizon():
    """TC-PRED-03: POST /api/v1/predictions with horizon > 24 returns HTTP 400."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "officer_rajesh", "password": "SecurePassword123!"}
        )
        token = login_res.json()["access_token"]

        response = await ac.post(
            "/api/v1/predictions",
            json={
                "zone_id": "ZONE-NORTH-BASIN",
                "forecast_horizon_hours": 72
            },
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 422 or response.status_code == 400


@pytest.mark.asyncio
async def test_trigger_prediction_unknown_zone():
    """TC-PRED-04: POST /api/v1/predictions for unknown zone returns HTTP 404."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "officer_rajesh", "password": "SecurePassword123!"}
        )
        token = login_res.json()["access_token"]

        response = await ac.post(
            "/api/v1/predictions",
            json={
                "zone_id": "ZONE-NON-EXISTENT",
                "forecast_horizon_hours": 6
            },
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_explain_prediction_success():
    """TC-PRED-05: GET /api/v1/predictions/{id}/explain returns transparent factor contributions."""
    await setup_test_environment()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"username": "officer_rajesh", "password": "SecurePassword123!"}
        )
        token = login_res.json()["access_token"]

        # 1. Run prediction
        pred_res = await ac.post(
            "/api/v1/predictions",
            json={"zone_id": "ZONE-NORTH-BASIN", "forecast_horizon_hours": 6},
            headers={"Authorization": f"Bearer {token}"}
        )
        run_id = pred_res.json()["prediction_run_id"]

        # 2. Query explanation
        explain_res = await ac.get(
            f"/api/v1/predictions/{run_id}/explain",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert explain_res.status_code == 200
    data = explain_res.json()
    assert data["prediction_run_id"] == run_id
    assert data["explanation_method"] == "heuristic_factor_attribution"
    assert len(data["factors"]) >= 1
    factor = data["factors"][0]
    assert "feature_name" in factor
    assert "shap_contribution" in factor
    assert factor["impact_direction"] in ["INCREASES_RISK", "DECREASES_RISK"]
