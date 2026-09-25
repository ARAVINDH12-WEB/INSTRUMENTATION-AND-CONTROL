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

    # 5. Energy Consumption Forecasting (Multi-Method Benchmark)
    res_energy = client.post("/api/forecast/energy", json={
        "horizon_steps": 24,
        "baseline_kw": 450.0,
        "noise_std": 6.0,
    })
    assert res_energy.status_code == 200
    data_e = res_energy.json()
    print("\n[5] Energy Forecast Test -> Horizon:", data_e["horizon_steps"], "Best Method:", data_e["best_method"])
    print("    History Points:", len(data_e["history"]), "Actual Test Points:", len(data_e["actual_test"]))
    assert len(data_e["actual_test"]) == 24
    assert len(data_e["methods"]) == 4

    # Extract metrics per method
    metrics_by_key = {m["key"]: m for m in data_e["methods"]}
    m_hw = metrics_by_key["holt_winters"]
    m_sn = metrics_by_key["seasonal_naive"]
    m_hl = metrics_by_key["holt_linear"]
    m_nv = metrics_by_key["naive"]

    print(f"    1. Naive:          MAE={m_nv['mae']:<6} RMSE={m_nv['rmse']:<6} MAPE={m_nv['mape']}%")
    print(f"    2. Holt Linear:    MAE={m_hl['mae']:<6} RMSE={m_hl['rmse']:<6} MAPE={m_hl['mape']}%")
    print(f"    3. Seasonal-Naive: MAE={m_sn['mae']:<6} RMSE={m_sn['rmse']:<6} MAPE={m_sn['mape']}%")
    print(f"    4. Holt-Winters:   MAE={m_hw['mae']:<6} RMSE={m_hw['rmse']:<6} MAPE={m_hw['mape']}%")

    # Assertions required by user specification:
    # 1. Holt-Winters actually outperforms naive and seasonal-naive (lower MAPE)
    # 2. Seasonal-naive beats plain naive
    assert m_sn["mape"] < m_nv["mape"], f"Seasonal Naive ({m_sn['mape']}%) must beat Naive ({m_nv['mape']}%)"
    assert m_hw["mape"] < m_sn["mape"], f"Holt-Winters ({m_hw['mape']}%) must beat Seasonal Naive ({m_sn['mape']}%)"
    assert m_hw["mape"] < m_nv["mape"], f"Holt-Winters ({m_hw['mape']}%) must beat Naive ({m_nv['mape']}%)"

    # 6. Multi-Class Sensor Fault Classification & Confusion Matrix Benchmark
    res_bench = client.post("/api/predict/fault/benchmark?seed=42&count_per_class=50")
    assert res_bench.status_code == 200
    data_b = res_bench.json()
    print("\n[6] Fault Classification Benchmark -> Overall Accuracy:", data_b["overall_accuracy"], "%")
    print("    Classes:", data_b["classes"])
    assert data_b["overall_accuracy"] >= 90.0
    assert len(data_b["classes"]) == 6

    # Verify confusion matrix
    cm = data_b["confusion_matrix"]
    pcm = data_b["per_class_metrics"]
    print("\n    Confusion Matrix (Actual Rows vs Predicted Cols):")
    header = f"    {'Actual \\ Pred':<14} | " + " | ".join(f"{c:<7}" for c in data_b["classes"])
    print(header)
    print("    " + "-" * 65)
    for act in data_b["classes"]:
        row_str = f"    {act:<14} | " + " | ".join(f"{cm[act][p]:<7}" for p in data_b["classes"])
        print(row_str)

    print("\n    Per-Class Precision / Recall / F1:")
    print(f"    {'Class':<12} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("    " + "-" * 55)
    for c in data_b["classes"]:
        m = pcm[c]
        print(f"    {c:<12} | {m['precision']:>8.2f}% | {m['recall']:>8.2f}% | {m['f1_score']:>8.2f}% | {m['support']:>8}")

    # Check STUCK vs DROPOUT disambiguation
    print("\n    STUCK vs DROPOUT Cross-Confusion Check:")
    print("    - Actual STUCK predicted as DROPOUT:", cm["STUCK"]["DROPOUT"])
    print("    - Actual DROPOUT predicted as STUCK:", cm["DROPOUT"]["STUCK"])
    assert cm["STUCK"]["DROPOUT"] == 0, "STUCK should not be confused with DROPOUT when non-zero"
    assert cm["DROPOUT"]["STUCK"] == 0, "DROPOUT should not be confused with STUCK when zero-rail"

    print("\n==================================================")
    print("ALL STAGE 3a + FAULT CLASSIFIER ENDPOINTS VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
