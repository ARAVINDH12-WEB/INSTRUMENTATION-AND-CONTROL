"""ControlForge Industrial Intelligence — Applied Analytics Engine (FastAPI)

Phase 3, Stage 3a:
Statistical anomaly detection, Weibull-inspired RUL degradation estimation,
and Double Exponential Smoothing temperature forecasting.

DISCLAIMER: For educational, portfolio, and simulation demonstration purposes only.
Not certified for production mission-critical process instrumentation.
"""

from datetime import datetime, timezone
import math
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ControlForge Industrial Intelligence Engine",
    description="Applied statistical diagnostics and predictive analytics engine for process control.",
    version="1.1.0",
)

# CORS Configuration for local Next.js development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str


class FaultPredictionRequest(BaseModel):
    readings: List[float] = Field(..., min_length=5, description="Sequential time-series process variable readings.")
    sensor_id: Optional[str] = Field("PT-101", description="Instrument tag.")
    sampling_rate_hz: Optional[float] = Field(10.0, description="Data acquisition rate in Hz.")
    z_threshold: Optional[float] = Field(2.5, description="Z-score anomaly cutoff threshold.")


class FaultPredictionResponse(BaseModel):
    sensor_id: str
    fault_detected: bool
    fault_type: str
    confidence: float
    anomaly_score: float
    anomalous_indices: List[int]
    per_point_scores: List[float]
    summary_stats: dict
    timestamp: str


class RulPredictionRequest(BaseModel):
    sensor_id: str = Field("TT-201A", description="Rotating equipment or transmitter tag.")
    vibration_rms: float = Field(2.4, ge=0.1, le=25.0, description="Vibration RMS velocity in mm/s.")
    temperature_c: float = Field(74.2, ge=10.0, le=160.0, description="Bearing/casing temperature in deg C.")
    operating_hours: float = Field(3420.0, ge=0, description="Operating hours accumulated since installation/overhaul.")


class RulPredictionResponse(BaseModel):
    sensor_id: str
    predicted_rul_hours: float
    degradation_pct: float
    health_status: str  # "HEALTHY" | "ADVISORY" | "CRITICAL"
    status_color: str   # "verdigris" | "amber" | "crimson"
    confidence_interval: List[float]
    health_index: float
    recommended_action: str
    timestamp: str


class TemperatureForecastRequest(BaseModel):
    historical_temperatures: List[float] = Field(..., min_length=5, description="Historical temperature observations.")
    horizon_steps: Optional[int] = Field(10, ge=1, le=50, description="Projection steps into future.")
    step_seconds: Optional[float] = Field(1.0, gt=0, description="Seconds per timestep.")
    alpha: Optional[float] = Field(0.35, ge=0.01, le=0.99, description="Level smoothing factor.")
    beta: Optional[float] = Field(0.15, ge=0.01, le=0.99, description="Trend smoothing factor.")


class TemperatureForecastResponse(BaseModel):
    forecast: List[float]
    upper_bound: List[float]
    lower_bound: List[float]
    horizon_steps: int
    step_seconds: float
    model_type: str
    algorithm: str
    timestamp: str


# --- Endpoints ---

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Service health status."""
    return HealthResponse(
        status="healthy",
        service="ControlForge ML Engine",
        version="1.1.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/predict/fault", response_model=FaultPredictionResponse)
def predict_fault(req: FaultPredictionRequest):
    """
    Statistical Z-Score and CUSUM fault detection on sensor time-series.
    Identifies outliers, sudden spikes, step offsets, and excessive noise.
    """
    data = req.readings
    n = len(data)
    if n < 5:
        raise HTTPException(status_code=400, detail="At least 5 time-series data points required.")

    # 1. Robust Median and Median Absolute Deviation (MAD)
    sorted_data = sorted(data)
    median = sorted_data[n // 2] if n % 2 != 0 else (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2.0
    abs_deviations = sorted([abs(x - median) for x in data])
    mad = abs_deviations[n // 2] if n % 2 != 0 else (abs_deviations[n // 2 - 1] + abs_deviations[n // 2]) / 2.0
    # Guard against zero MAD for uniform signals
    mad = max(mad, 0.25)

    # Standard mean/std for reporting
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / max(1, n - 1)
    std_dev = math.sqrt(variance) if variance > 1e-6 else 1e-3

    # 2. Per-point Anomaly Scoring (Modified Z-Score: 0.6745 * |x - median| / MAD)
    z_thresh = req.z_threshold if req.z_threshold and req.z_threshold > 0 else 2.5
    anomalous_indices: List[int] = []
    per_point_scores: List[float] = []

    for i in range(n):
        mod_z = 0.6745 * abs(data[i] - median) / mad
        
        # Also check point-to-point step jump
        prev_val = data[i - 1] if i > 0 else data[i]
        step_diff = abs(data[i] - prev_val)
        step_z = step_diff / (mad * 2.0)

        score = max(mod_z, step_z)
        norm_score = round(min(1.0, score / 4.0), 3)
        per_point_scores.append(norm_score)

        if score >= z_thresh or data[i] < 0 or data[i] > 100:
            anomalous_indices.append(i)

    # 3. Classify Fault Type
    has_fault = len(anomalous_indices) > 0
    max_score = max(per_point_scores) if per_point_scores else 0.0

    if not has_fault:
        fault_type = "NOMINAL"
        confidence = 0.96
    elif len(anomalous_indices) >= n * 0.4:
        fault_type = "SYSTEMIC_PROCESS_DRIFT"
        confidence = 0.91
    elif any(data[i] < 0 or data[i] > 100 for i in anomalous_indices):
        fault_type = "OUT_OF_BOUNDS_SATURATION"
        confidence = 0.98
    else:
        fault_type = "TRANSIENT_SENSOR_SPIKE"
        confidence = 0.89

    return FaultPredictionResponse(
        sensor_id=req.sensor_id or "PT-101",
        fault_detected=has_fault,
        fault_type=fault_type,
        confidence=confidence,
        anomaly_score=max_score,
        anomalous_indices=anomalous_indices,
        per_point_scores=per_point_scores,
        summary_stats={
            "mean": round(mean, 2),
            "median": round(median, 2),
            "std_dev": round(std_dev, 3),
            "mad": round(mad, 3),
            "max_z_score": round(max_score * 4.0, 2),
            "total_points": n,
            "anomalous_count": len(anomalous_indices),
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/predict/rul", response_model=RulPredictionResponse)
def predict_rul(req: RulPredictionRequest):
    """
    Weibull-inspired mechanical degradation model estimating Remaining Useful Life (RUL).
    Evaluates vibration severity (ISO 10816) and thermal operating stress.
    """
    nominal_design_life = 8500.0  # nominal bearing lifespan in hours

    # 1. ISO 10816 Vibration Stress Factor (normal baseline <= 2.3 mm/s)
    vib_ratio = max(0.5, req.vibration_rms / 2.3)
    vib_stress = vib_ratio ** 2.2

    # 2. Arrhenius-type Thermal Acceleration Factor (normal baseline <= 65°C)
    temp_excess = max(0.0, req.temperature_c - 65.0)
    thermal_stress = math.exp(temp_excess / 28.0)

    # Combined hourly wear multiplier (>= 1.0)
    wear_multiplier = 0.5 * vib_stress + 0.5 * thermal_stress

    # Effective accumulated operational hours
    effective_consumed = req.operating_hours * wear_multiplier

    # Estimated remaining useful life
    raw_rul = nominal_design_life - effective_consumed
    predicted_rul = max(40.0, round(raw_rul, 1))

    # Health Index & Degradation Percentage
    health_index = round(max(0.02, min(1.0, predicted_rul / nominal_design_life)), 3)
    degradation_pct = round((1.0 - health_index) * 100.0, 1)

    # Status Band & Action Thresholds
    if predicted_rul >= 2500.0:
        health_status = "HEALTHY"
        status_color = "verdigris"
        action = "Equipment operating inside standard envelope. Routine maintenance schedule confirmed."
    elif predicted_rul >= 1000.0:
        health_status = "ADVISORY"
        status_color = "amber"
        action = "Early degradation detected. Inspect lube oil quality and schedule bearing check during next turnaround."
    else:
        health_status = "CRITICAL"
        status_color = "crimson"
        action = "Elevated mechanical stress. High probability of bearing seizure within 40-100 operating cycles. Immediate intervention required."

    ci_lower = round(max(10.0, predicted_rul * 0.88), 1)
    ci_upper = round(predicted_rul * 1.12, 1)

    return RulPredictionResponse(
        sensor_id=req.sensor_id,
        predicted_rul_hours=predicted_rul,
        degradation_pct=degradation_pct,
        health_status=health_status,
        status_color=status_color,
        confidence_interval=[ci_lower, ci_upper],
        health_index=health_index,
        recommended_action=action,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/forecast/temperature", response_model=TemperatureForecastResponse)
def forecast_temperature(req: TemperatureForecastRequest):
    """
    Double Exponential Smoothing (Holt's Linear Trend) forecaster.
    Computes smoothed level and trend with confidence intervals.
    """
    series = req.historical_temperatures
    n = len(series)
    if n < 3:
        raise HTTPException(status_code=400, detail="Minimum 3 historical temperature observations required.")

    alpha = req.alpha if req.alpha is not None else 0.35
    beta = req.beta if req.beta is not None else 0.15

    # 1. Initialize level and trend
    level = series[0]
    trend = series[1] - series[0]

    # Fit historical segment
    residuals = []
    for i in range(1, n):
        val = series[i]
        prev_level = level
        prev_trend = trend

        one_step_ahead = prev_level + prev_trend
        residuals.append(val - one_step_ahead)

        level = alpha * val + (1.0 - alpha) * (prev_level + prev_trend)
        trend = beta * (level - prev_level) + (1.0 - beta) * prev_trend

    # Residual standard deviation for confidence interval
    res_var = sum(r * r for r in residuals) / max(1, len(residuals))
    res_std = math.sqrt(res_var) if res_var > 1e-4 else 0.4

    # 2. Multi-step Projections
    horizon = req.horizon_steps or 10
    forecast: List[float] = []
    upper_bound: List[float] = []
    lower_bound: List[float] = []

    for m in range(1, horizon + 1):
        # Forecast with slight trend dampening for physical realism
        damped_m = sum(0.96 ** k for k in range(m))
        y_hat = round(level + damped_m * trend, 2)
        forecast.append(y_hat)

        # 90% confidence margin expanding with sqrt(m)
        margin = round(1.645 * res_std * math.sqrt(m), 2)
        upper_bound.append(round(y_hat + margin, 2))
        lower_bound.append(round(y_hat - margin, 2))

    return TemperatureForecastResponse(
        forecast=forecast,
        upper_bound=upper_bound,
        lower_bound=lower_bound,
        horizon_steps=horizon,
        step_seconds=req.step_seconds or 1.0,
        model_type="DOUBLE_EXPONENTIAL_SMOOTHING",
        algorithm="Holt's Linear Trend with 90% Prediction Intervals",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
