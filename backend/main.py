"""ControlForge Industrial Intelligence — ML Support Engine (FastAPI)

Phase 3, Stage 2: Minimal backend service supporting Stage 3 ML tasks.
Existing client-side simulation and calculator math remains in lib/pid-math.ts.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ControlForge Industrial Intelligence Engine",
    description="Machine learning and predictive analytics backend for ControlForge instrumentation and control platform.",
    version="1.0.0",
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


# --- Request & Response Schemas ---

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str


class FaultPredictionRequest(BaseModel):
    readings: List[float] = Field(..., min_length=1, description="Time-series array of process variable measurements.")
    sensor_id: Optional[str] = Field("PT-101", description="Instrumentation tag identifier.")
    sampling_rate_hz: Optional[float] = Field(10.0, description="Sampling rate in Hz.")


class FaultPredictionResponse(BaseModel):
    sensor_id: str
    fault_detected: bool
    fault_type: str
    confidence: float
    anomaly_score: float
    timestamp: str


class RulPredictionRequest(BaseModel):
    sensor_id: str = Field("TT-201A", description="Sensor or equipment asset tag.")
    vibration_rms: float = Field(2.4, ge=0, description="Vibration root-mean-square in mm/s.")
    temperature_c: float = Field(74.2, description="Bearing or casing temperature in degrees Celsius.")
    operating_hours: float = Field(3420.0, ge=0, description="Total accumulated operating hours since overhaul.")


class RulPredictionResponse(BaseModel):
    sensor_id: str
    predicted_rul_hours: float
    confidence_interval: List[float]
    health_index: float
    recommended_action: str
    timestamp: str


class TemperatureForecastRequest(BaseModel):
    historical_temperatures: List[float] = Field(..., min_length=1, description="Sequential historical temperature observations.")
    horizon_steps: Optional[int] = Field(10, ge=1, le=100, description="Number of future timesteps to project.")
    step_seconds: Optional[float] = Field(1.0, gt=0, description="Time delta per forecast step.")


class TemperatureForecastResponse(BaseModel):
    forecast: List[float]
    horizon_steps: int
    step_seconds: float
    model_type: str
    timestamp: str


# --- Endpoints ---

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="ControlForge ML Engine",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/predict/fault", response_model=FaultPredictionResponse)
def predict_fault(req: FaultPredictionRequest):
    """Stub endpoint for sensor fault detection and classification (placeholder for Stage 3)."""
    if not req.readings:
        raise HTTPException(status_code=400, detail="Readings array cannot be empty.")

    # Placeholder logic: detect high-variance or extreme values as sample anomaly
    avg_val = sum(req.readings) / len(req.readings)
    variance = sum((x - avg_val) ** 2 for x in req.readings) / len(req.readings)
    std_dev = variance ** 0.5

    is_anomaly = std_dev > 15.0 or any(x < 0 or x > 100 for x in req.readings)
    fault_type = "SENSOR_DRIFT_OR_SPIKE" if is_anomaly else "NOMINAL"
    confidence = 0.94 if not is_anomaly else 0.88
    anomaly_score = round(min(1.0, std_dev / 25.0), 3)

    return FaultPredictionResponse(
        sensor_id=req.sensor_id or "UNKNOWN",
        fault_detected=is_anomaly,
        fault_type=fault_type,
        confidence=confidence,
        anomaly_score=anomaly_score,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/predict/rul", response_model=RulPredictionResponse)
def predict_rul(req: RulPredictionRequest):
    """Stub endpoint for Remaining Useful Life (RUL) estimation (placeholder for Stage 3)."""
    # Placeholder rule-based degradation model
    base_life = 8000.0  # nominal bearing/sensor life in hours
    wear_factor = (req.vibration_rms / 4.5) * 0.4 + (max(0, req.temperature_c - 60) / 40.0) * 0.4
    effective_hours = req.operating_hours * (1.0 + max(0.0, wear_factor))
    remaining = max(50.0, round(base_life - effective_hours, 1))

    health_index = round(max(0.05, min(1.0, remaining / base_life)), 2)
    ci_lower = round(max(0.0, remaining * 0.9), 1)
    ci_upper = round(remaining * 1.1, 1)

    if health_index > 0.7:
        action = "Normal operation. Routine inspection scheduled."
    elif health_index > 0.3:
        action = "Condition degraded. Schedule lubrication & bearing check during next turnaround."
    else:
        action = "Critical degradation. Immediate replacement recommended before next batch run."

    return RulPredictionResponse(
        sensor_id=req.sensor_id,
        predicted_rul_hours=remaining,
        confidence_interval=[ci_lower, ci_upper],
        health_index=health_index,
        recommended_action=action,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/forecast/temperature", response_model=TemperatureForecastResponse)
def forecast_temperature(req: TemperatureForecastRequest):
    """Stub endpoint for autoregressive temperature forecasting (placeholder for Stage 3 LSTM)."""
    if not req.historical_temperatures:
        raise HTTPException(status_code=400, detail="Historical temperature array cannot be empty.")

    last_val = req.historical_temperatures[-1]
    # Simple autoregressive slope projection for placeholder
    if len(req.historical_temperatures) >= 2:
        slope = (req.historical_temperatures[-1] - req.historical_temperatures[0]) / len(req.historical_temperatures)
    else:
        slope = 0.0

    forecast = []
    curr = last_val
    for step in range(1, req.horizon_steps + 1):
        # Dampened trend projection
        curr += slope * (0.85 ** step)
        forecast.append(round(curr, 2))

    return TemperatureForecastResponse(
        forecast=forecast,
        horizon_steps=req.horizon_steps,
        step_seconds=req.step_seconds,
        model_type="LSTM_AUTOREGRESSIVE_STUB",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
