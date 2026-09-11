"""
Module 6 AI-10 MCDA Prioritization & Graph Routing Unit Test Suite.

Validates 100% deterministic MCDA ranking across criteria (Doc 04 Table 2, Doc 06 TC-AI-10),
normalization boundaries, weight contributions, and Graph Dijkstra safe routing with flood avoidance.
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.schemas.mcda import MCDAWeightsConfig
from app.services.mcda_service import MCDAPrioritizationService
from app.services.routing.engine import RoutingGraph, GraphRoutingEngine, haversine_distance_km
from app.services.routing.adapter import GraphRoutingProvider, NullRoutingProvider
from app.models.domain import GeographicZone, Location, PredictionRun, ModelVersion, RiskScore, FloodPrediction, InfrastructureAsset


async def seed_mcda_test_data():
    """Seeds 4 distinct geographic zones with varying risk scores and population densities."""
    async with AsyncSessionLocal() as session:
        # Location
        await session.execute(text("""
            INSERT INTO locations (id, name, state_name, country)
            VALUES ('DIST-MUMBAI-01', 'Mumbai Suburbs', 'Maharashtra', 'India')
            ON CONFLICT (id) DO NOTHING;
        """))

        # Model version
        await session.execute(text("""
            INSERT INTO model_versions (id, model_name, algorithm, accuracy_roc_auc, artifact_path, is_active)
            VALUES ('XGB-FLOOD-V1.0', 'XGBoost Flood Probability', 'XGBoost', 0.892, 'ml/artifacts/xgb_baseline.joblib', true)
            ON CONFLICT (id) DO NOTHING;
        """))

        # 4 Monitored Zones
        zones_data = [
            ("ZONE-NORTH-BASIN", "North Basin (High Pop, High Risk)", 4.2, 5.5, 18000.0, 85.0, 0.88, 1.45, "HIGH"),
            ("ZONE-SOUTH-COAST", "South Coast (Extreme Pop, Moderate Risk)", 2.1, 4.0, 24000.0, 50.0, 0.52, 0.60, "MODERATE"),
            ("ZONE-EAST-HILLS", "East Hills (Low Pop, Critical Risk)", 15.0, 8.0, 4000.0, 92.0, 0.95, 2.10, "CRITICAL"),
            ("ZONE-WEST-PLAINS", "West Plains (Low Pop, Low Risk)", 8.5, 7.0, 5000.0, 15.0, 0.12, 0.05, "LOW"),
        ]

        for z_id, z_name, elev, drain, pop, r_score, f_prob, depth, r_level in zones_data:
            await session.execute(text(f"""
                INSERT INTO geographic_zones (
                    id, location_id, name, elevation_mean_m, slope_mean_deg,
                    drainage_capacity_score, soil_permeability_index, population_density,
                    boundary, centroid
                )
                VALUES (
                    '{z_id}', 'DIST-MUMBAI-01', '{z_name}', {elev}, 1.5,
                    {drain}, 0.5, {pop},
                    ST_GeomFromText('POLYGON((72.87 19.07, 72.89 19.07, 72.89 19.09, 72.87 19.09, 72.87 19.07))', 4326),
                    ST_GeomFromText('POINT(72.88 19.08)', 4326)
                )
                ON CONFLICT (id) DO UPDATE SET population_density = {pop};
            """))

            # Create prediction run and risk score
            res = await session.execute(text(f"""
                INSERT INTO prediction_runs (zone_id, model_version_id, forecast_horizon_hours)
                VALUES ('{z_id}', 'XGB-FLOOD-V1.0', 6)
                RETURNING id;
            """))
            run_id = res.scalar()

            await session.execute(text(f"""
                INSERT INTO flood_predictions (prediction_run_id, flood_probability, predicted_depth_m, confidence_score)
                VALUES ('{run_id}', {f_prob}, {depth}, 0.90)
                ON CONFLICT (prediction_run_id) DO NOTHING;
            """))

            await session.execute(text(f"""
                INSERT INTO risk_scores (prediction_run_id, risk_score_numeric, risk_level, recommended_action)
                VALUES ('{run_id}', {r_score}, '{r_level}', 'Test recommended action')
                ON CONFLICT (prediction_run_id) DO NOTHING;
            """))

        await session.commit()


@pytest.mark.asyncio
async def test_mcda_deterministic_ranking():
    """MCDA-TEST-01: AI-10 Multi-Criteria Decision Analysis generates deterministic ranking queue across 4 zones."""
    await seed_mcda_test_data()

    async with AsyncSessionLocal() as session:
        response = await MCDAPrioritizationService.rank_zones(session)

    assert response.total_zones_evaluated >= 4
    ranking = response.ranking
    assert len(ranking) >= 4

    # Verify ranking monotonicity: rank 1 has highest composite score, followed by lower scores
    for i in range(len(ranking) - 1):
        assert ranking[i].rank == i + 1
        assert ranking[i].composite_priority_score >= ranking[i + 1].composite_priority_score

    # Re-running must produce the exact identical 100% deterministic ranking
    async with AsyncSessionLocal() as session:
        response_2 = await MCDAPrioritizationService.rank_zones(session)

    for i in range(len(ranking)):
        assert ranking[i].zone_id == response_2.ranking[i].zone_id
        assert ranking[i].composite_priority_score == response_2.ranking[i].composite_priority_score
        assert ranking[i].priority_tier == response_2.ranking[i].priority_tier


@pytest.mark.asyncio
async def test_mcda_normalization_and_weights_sum():
    """MCDA-TEST-02: Normalization is bounded in [0, 1] and criteria weights sum to 1.0."""
    await seed_mcda_test_data()

    config = MCDAWeightsConfig(
        weight_risk_score=0.60,
        weight_population_density=0.20,
        weight_infrastructure_impact=0.10,
        weight_river_stage=0.10
    )

    async with AsyncSessionLocal() as session:
        response = await MCDAPrioritizationService.rank_zones(session, config=config)

    for item in response.ranking:
        assert 0.0 <= item.composite_priority_score <= 100.0
        assert item.priority_tier in ["CRITICAL_TIER_1", "HIGH_TIER_2", "MEDIUM_TIER_3", "LOW_TIER_4"]
        assert len(item.factors) == 4

        for f in item.factors:
            assert 0.0 <= f.normalized_score <= 1.0
            assert 0.0 <= f.weight <= 1.0
            assert f.weighted_score >= 0.0


def test_mcda_weights_config_validation():
    """MCDA-TEST-03: Invalid weights not summing to 1.0 are rejected by Pydantic validator."""
    with pytest.raises(ValueError, match="must sum to 1.0"):
        MCDAWeightsConfig(
            weight_risk_score=0.80,
            weight_population_density=0.50,
            weight_infrastructure_impact=0.10,
            weight_river_stage=0.10
        )


def test_graph_routing_engine_dijkstra():
    """ROUTE-GRAPH-01: Graph routing engine computes shortest path with flood avoidance."""
    # Build synthetic road network graph fixture
    graph = RoutingGraph()
    # Nodes in grid
    graph.add_node("N1", 19.0700, 72.8700)  # Start
    graph.add_node("N2", 19.0750, 72.8700)  # Flooded junction
    graph.add_node("N3", 19.0750, 72.8800)  # Dry bypass junction
    graph.add_node("N4", 19.0800, 72.8800)  # Destination shelter

    # N1 -> N2 (flooded), N2 -> N4 (flooded)
    graph.add_edge("N1", "N2", distance_km=0.6, is_flooded=True)
    graph.add_edge("N2", "N4", distance_km=0.6, is_flooded=True)

    # N1 -> N3 (dry), N3 -> N4 (dry)
    graph.add_edge("N1", "N3", distance_km=1.0, is_flooded=False)
    graph.add_edge("N3", "N4", distance_km=0.7, is_flooded=False)

    provider = GraphRoutingProvider(graph)
    assert provider.is_available is True

    route = provider.plan_route(
        origin_lat=19.0700,
        origin_lon=72.8700,
        dest_lat=19.0800,
        dest_lon=72.8800,
        avoid_flood_zones=True
    )

    assert route is not None
    assert route.route_status == "SAFE_DRY_PATH"
    assert route.distance_km > 0.0
    assert route.estimated_time_minutes >= 1
    assert route.path_geojson.type == "LineString"
    assert len(route.path_geojson.coordinates) >= 4  # origin, N1, N3, N4, dest


def test_null_routing_provider_unconfigured():
    """ROUTE-GRAPH-02: Null routing provider reports unavailable and does not fabricate routes."""
    provider = NullRoutingProvider()
    assert provider.is_available is False
    result = provider.plan_route(19.0700, 72.8700, 19.0800, 72.8800)
    assert result is None
