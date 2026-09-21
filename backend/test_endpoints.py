"""Automated verification script for ControlForge FastAPI backend endpoints.
"""

import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("Testing ControlForge FastAPI Backend Endpoints")
    print("==================================================")

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print("\n[1] GET /api/health:")
    print(json.dumps(data, indent=2))
    assert data["status"] == "healthy"
    assert data["service"] == "ControlForge ML Engine"

    # 2. CORS Verification
    res_cors = client.options(
        "/api/predict/fault",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    print("\n[2] CORS Options Preflight Status:", res_cors.status_code)
    print("Access-Control-Allow-Origin:", res_cors.headers.get("access-control-allow-origin"))
    assert res_cors.headers.get("access-control-allow-origin") == "http://localhost:3000"

    # 3. Fault Prediction Stub
    fault_payload = {
        "readings": [49.8, 50.1, 49.9, 50.4, 50.2, 49.7, 50.0],
        "sensor_id": "PT-101",
        "sampling_rate_hz": 10.0,
    }
    res = client.post("/api/predict/fault", json=fault_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print("\n[3] POST /api/predict/fault (Nominal):")
    print(json.dumps(data, indent=2))
    assert data["sensor_id"] == "PT-101"
    assert "fault_detected" in data
    assert "confidence" in data

    # Fault Prediction with anomaly
    fault_payload_anomaly = {
        "readings": [50.0, 52.0, 75.0, 98.0, 110.0],
        "sensor_id": "PT-101",
    }
    res = client.post("/api/predict/fault", json=fault_payload_anomaly)
    assert res.status_code == 200
    data = res.json()
    print("\n[3b] POST /api/predict/fault (Anomaly):")
    print(json.dumps(data, indent=2))
    assert data["fault_detected"] is True

    # 4. RUL Prediction Stub
    rul_payload = {
        "sensor_id": "TT-201A",
        "vibration_rms": 2.8,
        "temperature_c": 72.5,
        "operating_hours": 3200.0,
    }
    res = client.post("/api/predict/rul", json=rul_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print("\n[4] POST /api/predict/rul:")
    print(json.dumps(data, indent=2))
    assert data["sensor_id"] == "TT-201A"
    assert "predicted_rul_hours" in data
    assert "health_index" in data

    # 5. Temperature Forecast Stub
    forecast_payload = {
        "historical_temperatures": [62.5, 63.1, 63.8, 64.2, 64.9, 65.4],
        "horizon_steps": 10,
        "step_seconds": 1.0,
    }
    res = client.post("/api/forecast/temperature", json=forecast_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print("\n[5] POST /api/forecast/temperature:")
    print(json.dumps(data, indent=2))
    assert len(data["forecast"]) == 10
    assert data["model_type"] == "LSTM_AUTOREGRESSIVE_STUB"

    print("\n==================================================")
    print("ALL 4 ENDPOINTS RETURNED VALID DATA & PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
