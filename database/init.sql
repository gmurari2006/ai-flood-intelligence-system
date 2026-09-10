-- ==============================================================================
-- AI-Powered Flood Prediction & Early Warning System
-- PostgreSQL 16 + PostGIS 3.4 Spatial Database Initialization Script
-- ==============================================================================

-- 1. Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. user_roles
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT NOT NULL REFERENCES user_roles(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    organization VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. locations
CREATE TABLE locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    bounding_box GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. geographic_zones
CREATE TABLE geographic_zones (
    id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL REFERENCES locations(id),
    name VARCHAR(150) NOT NULL,
    elevation_mean_m DECIMAL(6,2) NOT NULL,
    slope_mean_deg DECIMAL(4,2),
    drainage_capacity_score DECIMAL(4,2) CHECK (drainage_capacity_score BETWEEN 0 AND 10),
    soil_permeability_index DECIMAL(4,2),
    population_density DECIMAL(8,2),
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. data_sources
CREATE TABLE data_sources (
    id VARCHAR(50) PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    update_frequency_minutes INT DEFAULT 15,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 7. weather_observations
CREATE TABLE weather_observations (
    id BIGSERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    source_id VARCHAR(50) REFERENCES data_sources(id),
    temperature_c DECIMAL(4,1),
    humidity_pct DECIMAL(4,1),
    wind_speed_kmh DECIMAL(5,1),
    observed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. rainfall_observations
CREATE TABLE rainfall_observations (
    id BIGSERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    source_id VARCHAR(50) REFERENCES data_sources(id),
    rainfall_1h_mm DECIMAL(6,2) NOT NULL CHECK (rainfall_1h_mm >= 0),
    rainfall_6h_mm DECIMAL(6,2) NOT NULL CHECK (rainfall_6h_mm >= 0),
    rainfall_24h_mm DECIMAL(6,2) NOT NULL CHECK (rainfall_24h_mm >= 0),
    rainfall_72h_mm DECIMAL(6,2) NOT NULL CHECK (rainfall_72h_mm >= 0),
    observed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. water_level_observations
CREATE TABLE water_level_observations (
    id BIGSERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    river_name VARCHAR(100) NOT NULL,
    gauge_station_id VARCHAR(50) NOT NULL,
    water_level_m DECIMAL(5,2) NOT NULL,
    warning_level_m DECIMAL(5,2) NOT NULL,
    danger_level_m DECIMAL(5,2) NOT NULL,
    discharge_rate_m3s DECIMAL(8,2),
    observed_at TIMESTAMP NOT NULL
);

-- 10. historical_flood_events
CREATE TABLE historical_flood_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    event_date DATE NOT NULL,
    peak_water_depth_m DECIMAL(4,2),
    total_rainfall_mm DECIMAL(6,2),
    severity_level VARCHAR(20),
    notes TEXT
);

-- 11. model_versions
CREATE TABLE model_versions (
    id VARCHAR(50) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    accuracy_roc_auc DECIMAL(4,3),
    artifact_path VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. prediction_runs
CREATE TABLE prediction_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    model_version_id VARCHAR(50) NOT NULL REFERENCES model_versions(id),
    forecast_horizon_hours INT NOT NULL CHECK (forecast_horizon_hours > 0),
    run_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. flood_predictions
CREATE TABLE flood_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_run_id UUID UNIQUE NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
    flood_probability DECIMAL(4,3) NOT NULL CHECK (flood_probability BETWEEN 0.000 AND 1.000),
    predicted_depth_m DECIMAL(4,2) NOT NULL CHECK (predicted_depth_m >= 0.00),
    confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score BETWEEN 0.000 AND 1.000),
    is_demo_data BOOLEAN DEFAULT FALSE
);

-- 14. risk_scores
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_run_id UUID UNIQUE NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
    risk_score_numeric DECIMAL(5,2) NOT NULL CHECK (risk_score_numeric BETWEEN 0.00 AND 100.00),
    risk_level VARCHAR(20) NOT NULL,
    recommended_action TEXT NOT NULL
);

-- 15. risk_factors
CREATE TABLE risk_factors (
    id BIGSERIAL PRIMARY KEY,
    prediction_run_id UUID NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DECIMAL(10,2) NOT NULL,
    shap_contribution DECIMAL(6,3) NOT NULL,
    impact_direction VARCHAR(20) NOT NULL
);

-- 16. infrastructure_assets
CREATE TABLE infrastructure_assets (
    id VARCHAR(50) PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    name VARCHAR(150) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    elevation_m DECIMAL(6,2) NOT NULL,
    capacity INT,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. infrastructure_risk
CREATE TABLE infrastructure_risk (
    id BIGSERIAL PRIMARY KEY,
    prediction_run_id UUID NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
    asset_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id),
    vulnerability_status VARCHAR(20) NOT NULL,
    estimated_water_depth_m DECIMAL(4,2) DEFAULT 0.00,
    recommended_protection TEXT
);

-- 18. evacuation_centers
CREATE TABLE evacuation_centers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    current_occupancy INT DEFAULT 0 CHECK (current_occupancy >= 0),
    has_backup_power BOOLEAN DEFAULT TRUE,
    location GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 19. alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(50) NOT NULL REFERENCES geographic_zones(id),
    issued_by_user_id UUID NOT NULL REFERENCES users(id),
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- 20. alert_recipients
CREATE TABLE alert_recipients (
    id BIGSERIAL PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    recipient_group VARCHAR(50) NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'DELIVERED',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. system_events
CREATE TABLE system_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Spatial & Relational Indexes
-- ==============================================================================

-- PostGIS GIST Spatial Indexes
CREATE INDEX idx_locations_bbox ON locations USING GIST (bounding_box);
CREATE INDEX idx_geographic_zones_boundary ON geographic_zones USING GIST (boundary);
CREATE INDEX idx_geographic_zones_centroid ON geographic_zones USING GIST (centroid);
CREATE INDEX idx_infrastructure_assets_loc ON infrastructure_assets USING GIST (location);
CREATE INDEX idx_evacuation_centers_loc ON evacuation_centers USING GIST (location);

-- B-Tree Performance Indexes
CREATE INDEX idx_weather_zone_time ON weather_observations(zone_id, observed_at DESC);
CREATE INDEX idx_rainfall_zone_time ON rainfall_observations(zone_id, observed_at DESC);
CREATE INDEX idx_water_level_zone_time ON water_level_observations(zone_id, observed_at DESC);
CREATE INDEX idx_prediction_runs_zone ON prediction_runs(zone_id, run_timestamp DESC);
CREATE INDEX idx_alerts_zone_status ON alerts(zone_id, status);
CREATE INDEX idx_system_events_time ON system_events(event_timestamp DESC);
