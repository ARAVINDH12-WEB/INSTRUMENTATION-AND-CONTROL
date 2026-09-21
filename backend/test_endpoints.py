"""Automated verification script for ControlForge FastAPI backend endpoints (Stage 3a).
"""

import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("Testing ControlForge Stage 3a Backend Endpoints")
    print("==================================================")

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    print("\n[1] GET /api/health ->", data["status"])

    # 2. Fault Prediction (Nominal & Spike)
    nominal_series = [50.1, 49.9, 50.2, 50.0, 49.8, 50.1, 50.3, 49.7, 50.0]
    res = client.post("/api/predict/fault", json={"readings": nominal_series, "sensor_id": "PT-101"})
    assert res.status_code == 200
    data = res.json()
    print("\n[2a] Nominal Fault Test:", data["fault_type"], "Anomalies:", len(data["anomalous_indices"]))
    assert data["fault_detected"] is False
    assert len(data["anomalous_indices"]) == 0

    spike_series = [50.1, 49.9, 50.2, 88.5, 94.0, 50.1, 49.8, 50.0]
    res = client.post("/api/predict/fault", json={"readings": spike_series, "sensor_id": "PT-101"})
    assert res.status_code == 200
    data = res.json()
    print("[2b] Spike Fault Test:", data["fault_type"], "Anomalies:", data["anomalous_indices"])
    assert data["fault_detected"] is True
    assert 3 in data["anomalous_indices"]

    # 3. RUL Prediction (Healthy vs Critical)
    res_healthy = client.post("/api/predict/rul", json={
        "sensor_id": "TT-201A", "vibration_rms": 1.2, "temperature_c": 55.0, "operating_hours": 1000.0
    })
    assert res_healthy.status_code == 200
    data_h = res_healthy.json()
    print("\n[3a] RUL Healthy -> Status:", data_h["health_status"], "Color:", data_h["status_color"], "RUL:", data_h["predicted_rul_hours"])
    assert data_h["health_status"] == "HEALTHY"
    assert data_h["status_color"] == "verdigris"

    res_critical = client.post("/api/predict/rul", json={
        "sensor_id": "TT-201A", "vibration_rms": 7.8, "temperature_c": 115.0, "operating_hours": 6500.0
    })
    assert res_critical.status_code == 200
    data_c = res_critical.json()
    print("[3b] RUL Critical -> Status:", data_c["health_status"], "Color:", data_c["status_color"], "RUL:", data_c["predicted_rul_hours"])
    assert data_c["health_status"] == "CRITICAL"
    assert data_c["status_color"] == "crimson"

    # 4. Temperature Forecasting (Double Exponential Smoothing)
    temp_hist = [62.0, 62.4, 62.9, 63.5, 64.1, 64.8, 65.6]
    res_fc = client.post("/api/forecast/temperature", json={
        "historical_temperatures": temp_hist, "horizon_steps": 10
    })
    assert res_fc.status_code == 200
    data_f = res_fc.json()
    print("\n[4] Forecast Test -> Algorithm:", data_f["algorithm"])
    print("    Forecast Array:", data_f["forecast"])
    print("    Upper Bounds:", data_f["upper_bound"])
    print("    Lower Bounds:", data_f["lower_bound"])
    assert len(data_f["forecast"]) == 10
    assert len(data_f["upper_bound"]) == 10
    assert data_f["forecast"][0] > temp_hist[-1]  # positive trend continuation

    print("\n==================================================")
    print("ALL STAGE 3a ENDPOINTS VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
