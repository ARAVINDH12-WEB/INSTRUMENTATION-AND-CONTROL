"""ControlForge Industrial Intelligence — Applied Analytics Engine (FastAPI)

Phase 3, Stage 3a:
Statistical anomaly detection, Weibull-inspired RUL degradation estimation,
and Double Exponential Smoothing temperature forecasting.

DISCLAIMER: For educational, portfolio, and simulation demonstration purposes only.
Not certified for production mission-critical process instrumentation.
"""

from datetime import datetime, timezone
import math
import random
from typing import List, Optional, Dict, Tuple
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
    expected_baseline_mean: Optional[float] = Field(50.0, description="Nominal calibration process mean.")
    expected_baseline_std: Optional[float] = Field(1.8, description="Nominal calibration process standard deviation.")
    ground_truth_labels: Optional[List[str]] = Field(None, description="Optional ground truth labels for computing confusion matrix.")


class FaultClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int


class FaultPredictionResponse(BaseModel):
    sensor_id: str
    fault_detected: bool
    fault_type: str
    confidence: float
    anomaly_score: float
    anomalous_indices: List[int]
    per_point_scores: List[float]
    per_point_classifications: List[str]
    fault_counts: Dict[str, int]
    summary_stats: dict
    confusion_matrix: Optional[Dict[str, Dict[str, int]]] = None
    per_class_metrics: Optional[Dict[str, FaultClassMetric]] = None
    overall_accuracy: Optional[float] = None
    disambiguation_note: Optional[str] = None
    timestamp: str


class FaultBenchmarkResponse(BaseModel):
    readings: List[float]
    ground_truth: List[str]
    classifications: List[str]
    confusion_matrix: Dict[str, Dict[str, int]]
    per_class_metrics: Dict[str, FaultClassMetric]
    overall_accuracy: float
    classes: List[str]
    disambiguation_note: str
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


class EnergyForecastRequest(BaseModel):
    historical_energy: Optional[List[float]] = Field(None, description="Optional custom historical energy load array (kW).")
    horizon_steps: Optional[int] = Field(24, ge=4, le=72, description="Projection steps into future (hours).")
    sample_interval_hours: Optional[float] = Field(1.0, gt=0, description="Hours per sample.")
    baseline_kw: Optional[float] = Field(450.0, ge=50.0, le=2000.0, description="Baseline load in kW.")
    noise_std: Optional[float] = Field(6.0, ge=0.0, le=50.0, description="Standard deviation of noise.")
    alpha: Optional[float] = Field(0.20, ge=0.01, le=0.99, description="Level smoothing parameter.")
    beta: Optional[float] = Field(0.001, ge=0.0, le=0.50, description="Trend smoothing parameter.")
    gamma: Optional[float] = Field(0.15, ge=0.01, le=0.99, description="Seasonal smoothing parameter.")
    phi: Optional[float] = Field(0.90, ge=0.50, le=1.0, description="Trend damping factor.")


class ForecastMethodResult(BaseModel):
    name: str
    key: str
    forecast: List[float]
    mae: float
    rmse: float
    mape: float
    description: str


class EnergyForecastResponse(BaseModel):
    history: List[float]
    actual_test: List[float]
    methods: List[ForecastMethodResult]
    best_method: str
    horizon_steps: int
    sample_interval_hours: float
    model_type: str
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


# --- Fault Classification Logic & Helpers ---

FAULT_CLASSES = ["NORMAL", "STUCK", "DRIFT", "NOISE", "SPIKE", "DROPOUT"]
DISAMBIGUATION_NOTE = (
    "STUCK vs DROPOUT Disambiguation: In 4-20 mA current loops, an open-circuit / dead transmitter "
    "fault drops the signal to 0.0 mA (or < 3.6 mA under NAMUR NE43), whereas a mechanically seized "
    "diaphragm or frozen ADC freezes at the operating process value (e.g. 52.4%). If a digital DCS/SCADA "
    "system implements dropout as 'sample-and-hold last known good' without out-of-band communication flags, "
    "the resulting time-series is mathematically indistinguishable from a stuck sensor. Our statistical "
    "classifier distinguishes physical dropout (near-zero/rail) from stuck (constant non-zero reading with "
    "zero rolling variance), but flags that digital sample-and-hold dropout requires telemetry packet-loss "
    "health flags for complete separation."
)


def generate_synthetic_fault_stream(n_per_class: int = 50, seed: int = 42) -> Tuple[List[float], List[str]]:
    """
    Generates a balanced synthetic test dataset containing roughly equal representation
    of all 5 fault types + normal.
    """
    rnd = random.Random(seed)
    base = 50.0
    normal_sigma = 1.8
    readings = []
    labels = []

    # 1. NORMAL section
    for _ in range(n_per_class):
        readings.append(round(base + rnd.gauss(0, normal_sigma), 2))
        labels.append("NORMAL")

    # 2. STUCK section - sensor freezes at a constant non-zero operating value
    stuck_val = round(base + rnd.gauss(0, normal_sigma), 2)
    for _ in range(n_per_class):
        readings.append(stuck_val)
        labels.append("STUCK")

    # 3. DRIFT section - sustained, slowly increasing bias
    for i in range(n_per_class):
        drift_bias = 4.0 + (i * 0.45)
        readings.append(round(base + drift_bias + rnd.gauss(0, normal_sigma), 2))
        labels.append("DRIFT")

    # 4. NOISE section - 4x elevated standard deviation around base
    noisy_sigma = normal_sigma * 4.0
    for _ in range(n_per_class):
        readings.append(round(base + rnd.gauss(0, noisy_sigma), 2))
        labels.append("NOISE")

    # 5. SPIKE section: isolated spikes with baseline buffer
    for _ in range(n_per_class):
        for _ in range(5):
            readings.append(round(base + rnd.gauss(0, normal_sigma), 2))
            labels.append("NORMAL")
        spike_dir = 1 if rnd.random() > 0.5 else -1
        mag = rnd.uniform(28.0, 45.0)
        readings.append(round(base + spike_dir * mag, 2))
        labels.append("SPIKE")

    # 6. DROPOUT section - 0.0 mA open-circuit loop disconnect / deadband
    for _ in range(n_per_class):
        readings.append(0.0)
        labels.append("DROPOUT")

    return readings, labels


def classify_sensor_faults(
    readings: List[float],
    z_threshold: float = 2.5,
    baseline_mean: float = 50.0,
    baseline_std: float = 1.8,
) -> List[str]:
    """
    Two-stage interpretable rule-based fault classifier:
    Stage 1: Statistical MAD / Modified Z-Score & Rolling Variance anomaly gating
    Stage 2: Diagnostic feature decision tree (STUCK, DRIFT, NOISE, SPIKE, DROPOUT, NORMAL)
    """
    n = len(readings)
    if n == 0:
        return []

    med = baseline_mean
    mad = max(0.25, baseline_std * 0.6745)

    # Diagnostic rolling features (window = 5)
    w = 5
    roll_means = []
    roll_stds = []
    diffs = [0.0] * n

    for i in range(n):
        if i > 0:
            diffs[i] = abs(readings[i] - readings[i - 1])

        start_idx = max(0, i - w + 1)
        window = readings[start_idx : i + 1]

        m_val = sum(window) / len(window)
        roll_means.append(m_val)

        if len(window) > 1:
            var = sum((x - m_val) ** 2 for x in window) / (len(window) - 1)
            roll_stds.append(math.sqrt(var))
        else:
            roll_stds.append(baseline_std)

    classifications = ["NORMAL"] * n

    for i in range(n):
        x = readings[i]

        # 1. DROPOUT signature:
        # Physical loop disconnect, 0.0 current loop rail, or NaN/None
        if x is None or (isinstance(x, float) and math.isnan(x)) or x <= 1.0:
            classifications[i] = "DROPOUT"
            continue

        # 2. STUCK signature:
        # Zero variance: sensor reading is identical across multiple consecutive samples
        # at an operating level (> 1.0) where expected process variance > 0
        is_stuck = False
        if i >= 2 and abs(readings[i] - readings[i-1]) < 1e-4 and abs(readings[i-1] - readings[i-2]) < 1e-4:
            is_stuck = True
        elif i + 2 < n and abs(readings[i] - readings[i+1]) < 1e-4 and abs(readings[i+1] - readings[i+2]) < 1e-4:
            is_stuck = True
        elif roll_stds[i] < 0.02 and i >= 3:
            is_stuck = True

        if is_stuck:
            classifications[i] = "STUCK"
            continue

        dev = abs(x - baseline_mean)
        mod_z = 0.6745 * abs(x - med) / mad
        var_ratio = roll_stds[i] / baseline_std

        left_dev = abs(readings[i - 1] - baseline_mean) if i > 0 else 0.0
        right_dev = abs(readings[i + 1] - baseline_mean) if i + 1 < n else 0.0

        is_noisy_regime = var_ratio >= 2.0 and (roll_stds[max(0, i-2)] >= 1.8 * baseline_std or roll_stds[min(n-1, i+2)] >= 1.8 * baseline_std)

        # 3. NOISE signature:
        # High rolling variance across consecutive samples while mean remains close to baseline
        if is_noisy_regime and abs(roll_means[i] - baseline_mean) < 2.5 * baseline_std:
            classifications[i] = "NOISE"
            continue

        # 4. SPIKE signature:
        # Isolated extreme jump occurring in an otherwise relatively stable regime
        is_isolated_spike = False
        if dev >= 3.2 * baseline_std or mod_z >= 3.2:
            if (diffs[i] >= 3.0 * baseline_std or (i + 1 < n and abs(readings[i] - readings[i + 1]) >= 3.0 * baseline_std)):
                if not is_noisy_regime and (left_dev <= 2.8 * baseline_std or right_dev <= 2.8 * baseline_std):
                    is_isolated_spike = True

        if is_isolated_spike:
            classifications[i] = "SPIKE"
            continue

        # 5. DRIFT signature:
        # Sustained shift away from baseline with moderate point-to-point variance
        if dev >= 2.0 * baseline_std and diffs[i] < 3.0 * baseline_std:
            classifications[i] = "DRIFT"
            continue

        # Stage 1 Anomaly check
        if mod_z >= z_threshold or dev >= 2.5 * baseline_std:
            if dev >= 3.0 * baseline_std:
                classifications[i] = "DRIFT" if (left_dev > 2.0 * baseline_std and right_dev > 2.0 * baseline_std) else "SPIKE"
            else:
                classifications[i] = "NORMAL"
        else:
            classifications[i] = "NORMAL"

    return classifications


def compute_confusion_matrix_and_metrics(y_true: List[str], y_pred: List[str]):
    matrix = {act: {pred: 0 for pred in FAULT_CLASSES} for act in FAULT_CLASSES}
    for act, pred in zip(y_true, y_pred):
        if act in matrix and pred in matrix[act]:
            matrix[act][pred] += 1

    per_class = {}
    total_correct = 0
    total_samples = len(y_true)

    for cls in FAULT_CLASSES:
        tp = matrix[cls][cls]
        fn = sum(matrix[cls][p] for p in FAULT_CLASSES if p != cls)
        fp = sum(matrix[a][cls] for a in FAULT_CLASSES if a != cls)

        prec = round((tp / (tp + fp)) * 100.0, 2) if (tp + fp) > 0 else 0.0
        rec = round((tp / (tp + fn)) * 100.0, 2) if (tp + fn) > 0 else 0.0
        f1 = round((2 * prec * rec) / (prec + rec), 2) if (prec + rec) > 0 else 0.0

        total_correct += tp
        per_class[cls] = FaultClassMetric(
            precision=prec,
            recall=rec,
            f1_score=f1,
            support=tp + fn,
        )

    overall_acc = round((total_correct / total_samples) * 100.0, 2) if total_samples > 0 else 0.0
    return matrix, per_class, overall_acc


@app.post("/api/predict/fault", response_model=FaultPredictionResponse)
def predict_fault(req: FaultPredictionRequest):
    """
    Two-stage Sensor Fault Classifier:
    Stage 1: Statistical Median Absolute Deviation (MAD) & Modified Z-Score outlier detection.
    Stage 2: Multi-class rule-based decision tree labeling (STUCK, DRIFT, NOISE, SPIKE, DROPOUT, NORMAL).
    """
    data = req.readings
    n = len(data)
    if n < 5:
        raise HTTPException(status_code=400, detail="At least 5 time-series data points required.")

    base_mean = req.expected_baseline_mean if req.expected_baseline_mean is not None else 50.0
    base_std = req.expected_baseline_std if req.expected_baseline_std is not None else 1.8
    z_thresh = req.z_threshold if req.z_threshold and req.z_threshold > 0 else 2.5

    # 1. Stage 1: Robust MAD & Modified Z-score calculation
    sorted_data = sorted(data)
    median = sorted_data[n // 2] if n % 2 != 0 else (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2.0
    abs_deviations = sorted([abs(x - median) for x in data])
    mad = abs_deviations[n // 2] if n % 2 != 0 else (abs_deviations[n // 2 - 1] + abs_deviations[n // 2]) / 2.0
    mad = max(mad, 0.25)

    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / max(1, n - 1)
    std_dev = math.sqrt(variance) if variance > 1e-6 else 1e-3

    per_point_scores: List[float] = []
    anomalous_indices: List[int] = []

    for i in range(n):
        mod_z = 0.6745 * abs(data[i] - median) / mad
        prev_val = data[i - 1] if i > 0 else data[i]
        step_diff = abs(data[i] - prev_val)
        step_z = step_diff / (mad * 2.0)

        score = max(mod_z, step_z)
        norm_score = round(min(1.0, score / 4.0), 3)
        per_point_scores.append(norm_score)

        if score >= z_thresh or data[i] <= 1.0 or data[i] > 100:
            anomalous_indices.append(i)

    # 2. Stage 2: Multi-class statistical decision tree classification
    per_point_classifications = classify_sensor_faults(
        data,
        z_threshold=z_thresh,
        baseline_mean=base_mean,
        baseline_std=base_std,
    )

    fault_counts = {c: 0 for c in FAULT_CLASSES}
    for c in per_point_classifications:
        if c in fault_counts:
            fault_counts[c] += 1

    # Dominant fault class (excluding NORMAL)
    fault_candidates = {k: v for k, v in fault_counts.items() if k != "NORMAL" and v > 0}
    if fault_candidates:
        dominant_fault = max(fault_candidates.items(), key=lambda kv: kv[1])[0]
        has_fault = True
        confidence = round(min(0.98, 0.85 + (fault_candidates[dominant_fault] / n) * 0.15), 2)
    else:
        dominant_fault = "NOMINAL"
        has_fault = False
        confidence = 0.96

    # Confusion matrix and per-class metrics if ground truth is supplied
    conf_matrix = None
    per_class_metrics = None
    overall_acc = None

    if req.ground_truth_labels and len(req.ground_truth_labels) == n:
        conf_matrix, per_class_metrics, overall_acc = compute_confusion_matrix_and_metrics(
            req.ground_truth_labels, per_point_classifications
        )

    max_score = max(per_point_scores) if per_point_scores else 0.0

    return FaultPredictionResponse(
        sensor_id=req.sensor_id or "PT-101",
        fault_detected=has_fault,
        fault_type=dominant_fault,
        confidence=confidence,
        anomaly_score=max_score,
        anomalous_indices=anomalous_indices,
        per_point_scores=per_point_scores,
        per_point_classifications=per_point_classifications,
        fault_counts=fault_counts,
        summary_stats={
            "mean": round(mean, 2),
            "median": round(median, 2),
            "std_dev": round(std_dev, 3),
            "mad": round(mad, 3),
            "max_z_score": round(max_score * 4.0, 2),
            "total_points": n,
            "anomalous_count": len(anomalous_indices),
        },
        confusion_matrix=conf_matrix,
        per_class_metrics=per_class_metrics,
        overall_accuracy=overall_acc,
        disambiguation_note=DISAMBIGUATION_NOTE,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/predict/fault/benchmark", response_model=FaultBenchmarkResponse)
def predict_fault_benchmark(seed: int = 42, count_per_class: int = 50):
    """
    Executes an honest benchmark evaluation of the sensor fault classifier
    on a balanced synthetic test dataset containing all 5 fault classes + normal.
    Returns 6x6 confusion matrix and per-class precision/recall metrics.
    """
    readings, ground_truth = generate_synthetic_fault_stream(n_per_class=count_per_class, seed=seed)
    classifications = classify_sensor_faults(readings)
    matrix, per_class, overall_acc = compute_confusion_matrix_and_metrics(ground_truth, classifications)

    return FaultBenchmarkResponse(
        readings=readings,
        ground_truth=ground_truth,
        classifications=classifications,
        confusion_matrix=matrix,
        per_class_metrics=per_class,
        overall_accuracy=overall_acc,
        classes=FAULT_CLASSES,
        disambiguation_note=DISAMBIGUATION_NOTE,
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


# --- Energy Forecasting Helpers & Endpoint ---

def generate_energy_synthetic_series(days: int = 12, baseline: float = 450.0, noise_std: float = 6.0, seed: int = 42) -> List[float]:
    rnd = random.Random(seed)
    series = []
    for t in range(days * 24):
        h = t % 24
        day = (t // 24) % 7 # 0..4 weekday, 5..6 weekend
        
        # Diurnal two-peak pattern (morning peak ~10:00, evening peak ~18:00)
        daily = -65.0 * math.cos(2.0 * math.pi * h / 24.0) + 25.0 * math.sin(4.0 * math.pi * h / 24.0) - 15.0 * math.cos(4.0 * math.pi * h / 24.0)
        
        # Weekend industrial plant load reduction
        weekend_factor = -90.0 if day in (5, 6) else 0.0
        
        noise = rnd.gauss(0.0, noise_std)
        load = max(10.0, baseline + daily + weekend_factor + noise)
        series.append(round(load, 2))
    return series


def compute_forecast_accuracy(actual: List[float], predicted: List[float]):
    n = len(actual)
    if n == 0:
        return 0.0, 0.0, 0.0
    mae = sum(abs(a - p) for a, p in zip(actual, predicted)) / n
    rmse = math.sqrt(sum((a - p) ** 2 for a, p in zip(actual, predicted)) / n)
    mape = (sum(abs((a - p) / a) for a, p in zip(actual, predicted) if abs(a) > 1e-4) / n) * 100.0
    return round(mae, 2), round(rmse, 2), round(mape, 2)


def run_naive_forecast(train: List[float], horizon: int) -> List[float]:
    return [round(train[-1], 2)] * horizon


def run_seasonal_naive_forecast(train: List[float], horizon: int, m: int = 24) -> List[float]:
    forecast = []
    for h in range(horizon):
        idx = len(train) - m + (h % m)
        forecast.append(round(train[idx], 2))
    return forecast


def run_holt_linear_forecast(train: List[float], horizon: int, alpha: float = 0.35, beta: float = 0.15) -> List[float]:
    n = len(train)
    level = train[0]
    trend = train[1] - train[0] if n > 1 else 0.0
    
    for i in range(1, n):
        val = train[i]
        prev_level = level
        prev_trend = trend
        level = alpha * val + (1.0 - alpha) * (prev_level + prev_trend)
        trend = beta * (level - prev_level) + (1.0 - beta) * prev_trend
        
    forecast = []
    for h in range(1, horizon + 1):
        damped = sum(0.98 ** k for k in range(h))
        forecast.append(round(level + damped * trend, 2))
    return forecast


def run_holt_winters_forecast(
    train: List[float],
    horizon: int,
    m: int = 24,
    alpha: float = 0.20,
    beta: float = 0.001,
    gamma: float = 0.15,
    phi: float = 0.90,
) -> List[float]:
    n = len(train)
    if n < 2 * m:
        raise HTTPException(status_code=400, detail=f"Holt-Winters requires at least {2 * m} historical observations.")
        
    # Initial level & trend across first 2 cycles
    l0 = sum(train[:m]) / m
    b0 = sum((train[i + m] - train[i]) / m for i in range(m)) / m
    
    # Initial seasonal indices
    s_init = []
    for i in range(m):
        d1 = train[i] - (l0 + (i - m / 2.0) * b0)
        d2 = train[i + m] - (l0 + (i + m / 2.0) * b0)
        s_init.append((d1 + d2) / 2.0)
        
    mean_s = sum(s_init) / m
    seasonals = [s - mean_s for s in s_init] # S_{-m} ... S_{-1}
    
    level = l0
    trend = b0
    
    for t in range(n):
        val = train[t]
        s_prev = seasonals[t]
        prev_level = level
        prev_trend = trend
        
        level = alpha * (val - s_prev) + (1.0 - alpha) * (prev_level + phi * prev_trend)
        trend = beta * (level - prev_level) + (1.0 - beta) * (phi * prev_trend)
        s_new = gamma * (val - level) + (1.0 - gamma) * s_prev
        seasonals.append(s_new)
        
    forecast = []
    for h in range(1, horizon + 1):
        s_val = seasonals[-m + ((h - 1) % m)]
        damped_trend = sum(phi ** k for k in range(1, h + 1)) * trend
        y_hat = level + damped_trend + s_val
        forecast.append(round(y_hat, 2))
        
    return forecast


@app.post("/api/forecast/energy", response_model=EnergyForecastResponse)
def forecast_energy(req: EnergyForecastRequest):
    """
    Multi-Method Energy Consumption Forecaster.
    Compares Naive, Seasonal-Naive, Holt's Linear, and Holt-Winters Triple Exponential Smoothing
    against held-out actuals, calculating MAE, RMSE, and MAPE.
    """
    horizon = req.horizon_steps or 24
    m = 24
    
    if req.historical_energy and len(req.historical_energy) >= 2 * m + horizon:
        series = req.historical_energy
        train = series[:-horizon]
        actual_test = series[-horizon:]
    else:
        # Default high-fidelity synthetic energy generation (12 days = 288 hours)
        baseline = req.baseline_kw if req.baseline_kw is not None else 450.0
        noise_std = req.noise_std if req.noise_std is not None else 6.0
        series = generate_energy_synthetic_series(days=12, baseline=baseline, noise_std=noise_std, seed=42)
        train = series[: 288 - horizon]
        actual_test = series[288 - horizon : 288]
        
    alpha = req.alpha if req.alpha is not None else 0.20
    beta = req.beta if req.beta is not None else 0.001
    gamma = req.gamma if req.gamma is not None else 0.15
    phi = req.phi if req.phi is not None else 0.90
    
    # 1. Naive (last-value)
    naive_pred = run_naive_forecast(train, horizon)
    n_mae, n_rmse, n_mape = compute_forecast_accuracy(actual_test, naive_pred)
    
    # 2. Seasonal-Naive (24h period)
    snaive_pred = run_seasonal_naive_forecast(train, horizon, m=m)
    sn_mae, sn_rmse, sn_mape = compute_forecast_accuracy(actual_test, snaive_pred)
    
    # 3. Holt Linear
    holt_pred = run_holt_linear_forecast(train, horizon, alpha=0.35, beta=0.15)
    h_mae, h_rmse, h_mape = compute_forecast_accuracy(actual_test, holt_pred)
    
    # 4. Holt-Winters (Triple Exponential Smoothing)
    hw_pred = run_holt_winters_forecast(train, horizon, m=m, alpha=alpha, beta=beta, gamma=gamma, phi=phi)
    hw_mae, hw_rmse, hw_mape = compute_forecast_accuracy(actual_test, hw_pred)
    
    methods = [
        ForecastMethodResult(
            name="Holt-Winters (Triple Exp)",
            key="holt_winters",
            forecast=hw_pred,
            mae=hw_mae,
            rmse=hw_rmse,
            mape=hw_mape,
            description="Triple exponential smoothing with additive diurnal seasonality and damped trend.",
        ),
        ForecastMethodResult(
            name="Seasonal-Naive (24h)",
            key="seasonal_naive",
            forecast=snaive_pred,
            mae=sn_mae,
            rmse=sn_rmse,
            mape=sn_mape,
            description="Repeats telemetry from the exact same hour of the preceding 24-hour cycle.",
        ),
        ForecastMethodResult(
            name="Holt Linear Trend",
            key="holt_linear",
            forecast=holt_pred,
            mae=h_mae,
            rmse=h_rmse,
            mape=h_mape,
            description="Double exponential smoothing with level and trend; lacks cyclical seasonal awareness.",
        ),
        ForecastMethodResult(
            name="Naive (Last-Value)",
            key="naive",
            forecast=naive_pred,
            mae=n_mae,
            rmse=n_rmse,
            mape=n_mape,
            description="Flat projection repeating the most recently recorded telemetry sample.",
        ),
    ]
    
    # Best method is lowest MAPE
    best_method = min(methods, key=lambda x: x.mape).name
    
    # Return last 72 hours of training history for clear visual context
    history_display = train[-72:] if len(train) >= 72 else train
    
    return EnergyForecastResponse(
        history=history_display,
        actual_test=actual_test,
        methods=methods,
        best_method=best_method,
        horizon_steps=horizon,
        sample_interval_hours=req.sample_interval_hours or 1.0,
        model_type="SEASONAL_TIME_SERIES_BENCHMARK",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
