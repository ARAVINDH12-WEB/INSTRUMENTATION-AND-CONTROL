"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";

// ============================================================================
// MULTIVARIATE ANOMALY DETECTION KERNEL
// Rolling-window Mahalanobis distance from the expected joint sensor distribution
// ============================================================================

interface SensorSample {
  temperature: number;
  pressure: number;
  flow: number;
  level: number;
  vibration: number;
}

interface AnomalyResult {
  time: number[];
  sensors: {
    temperature: number[];
    pressure: number[];
    flow: number[];
    level: number[];
    vibration: number[];
  };
  mahalanobisScores: number[];
  anomalyFlags: boolean[];
  perSensorZScores: {
    temperature: number[];
    pressure: number[];
    flow: number[];
    level: number[];
    vibration: number[];
  };
  stats: {
    totalPoints: number;
    anomalyCount: number;
    maxMahalanobis: number;
    meanMahalanobis: number;
    scenarioDetected: boolean;
    firstDetectionIdx: number | null;
  };
}

const SENSOR_NAMES = ["temperature", "pressure", "flow", "level", "vibration"] as const;
type SensorName = typeof SENSOR_NAMES[number];

/**
 * Generates correlated multi-sensor process data with realistic physical relationships:
 * - Pressure and flow: inversely related (orifice equation: flow ∝ √ΔP, so as upstream
 *   pressure rises the ΔP and flow both change, but in this simplified model higher
 *   pressure correlates with lower flow through a restriction)
 * - Level tracks flow integral (tank accumulation)
 * - Temperature is thermally stable (slow dynamics)
 * - Vibration is mechanically independent under normal conditions
 */
function createPRNG(seed: number = 42) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const randn = () => {
    const u1 = Math.max(1e-10, rand());
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  return { rand, randn };
}

function generateNormalData(n: number, seed: number = 42): SensorSample[] {
  const { randn } = createPRNG(seed);
  const data: SensorSample[] = [];
  let level = 50;

  for (let i = 0; i < n; i++) {
    // Base process state
    const pressure = 100 + randn() * 3; // ~100 kPa ± 3
    // Flow inversely related to pressure via orifice-like relationship
    const flowBase = 200 - 0.8 * (pressure - 100); // inverse coupling
    const flow = flowBase + randn() * 4; // ~200 L/min ± noise

    // Level tracks net flow accumulation (slow integrator)
    level += (flow - 200) * 0.01 + randn() * 0.3;
    level = Math.max(20, Math.min(80, level));

    // Temperature: thermally slow, uncorrelated to mechanical
    const temperature = 65 + randn() * 1.5 + Math.sin(i * 0.02) * 2;

    // Vibration: mechanically independent under normal conditions
    const vibration = 2.5 + Math.abs(randn()) * 0.8;

    data.push({ temperature, pressure, flow, level, vibration });
  }
  return data;
}

type ScenarioType =
  | "normal"
  | "pressure_flow_mismatch"
  | "temp_vibration_fault"
  | "gradual_drift"
  | "simultaneous_moderate";

/**
 * Injects specific abnormal patterns into the sensor data.
 */
function injectAnomaly(data: SensorSample[], scenario: ScenarioType): SensorSample[] {
  if (scenario === "normal") return data;

  const result = data.map((d) => ({ ...d }));
  const n = result.length;
  const injectionStart = Math.floor(n * 0.4); // anomalies begin at 40% of the data
  const { randn } = createPRNG(99);

  if (scenario === "pressure_flow_mismatch") {
    // Scenario 1: High pressure but unexpectedly LOW flow
    // Violates the normal inverse P-F relationship
    for (let i = injectionStart; i < injectionStart + 30 && i < n; i++) {
      result[i].pressure += 12; // pressure rises significantly
      result[i].flow += 15;     // flow ALSO rises (should drop under normal relationship)
    }
  } else if (scenario === "temp_vibration_fault") {
    // Scenario 2: Temperature normal, vibration abnormal
    // Bearing degradation signature — invisible on temp-only or vibration-only threshold
    // because vibration stays within its own range but becomes correlated with temperature
    for (let i = injectionStart; i < injectionStart + 40 && i < n; i++) {
      result[i].vibration += 3.5 + Math.sin((i - injectionStart) * 0.3) * 1.5;
      // Temperature stays normal — this is a mechanical fault, not thermal
    }
  } else if (scenario === "gradual_drift") {
    // Scenario 3: Slowly drifting pressure-flow relationship
    // Not a sudden jump — a progressive degradation (e.g., valve wear, fouling)
    for (let i = injectionStart; i < n; i++) {
      const progress = (i - injectionStart) / (n - injectionStart);
      // Pressure-flow coupling gradually inverts
      result[i].flow += progress * 18; // flow drifts up while pressure stays same
      result[i].level += progress * 3;  // level rises as excess flow accumulates
    }
  } else if (scenario === "simultaneous_moderate") {
    // Scenario 4: CRITICAL TEST — multiple sensors deviate moderately
    // None individually exceeds a 2σ single-sensor threshold,
    // but the JOINT deviation breaks process correlation and is statistically significant
    for (let i = injectionStart; i < injectionStart + 35 && i < n; i++) {
      result[i].temperature = 65 + 1.6 + (randn() * 0.3); // z ≈ 1.0-1.3σ
      result[i].pressure = 100 + 3.8 + (randn() * 0.5);   // z ≈ 1.1-1.5σ
      result[i].flow = 200 + 6.0 + (randn() * 0.8);       // z ≈ 1.1-1.6σ (violates inverse P-F coupling!)
      result[i].level = 47.8 + 1.5 + (randn() * 0.2);     // z ≈ 1.0-1.4σ
      result[i].vibration = 3.0 + 0.55 + (Math.abs(randn()) * 0.1); // z ≈ 1.1-1.6σ
    }
  }

  return result;
}

/**
 * Computes the inverse of a symmetric positive-definite matrix using Cholesky decomposition.
 * Returns null if matrix is singular or not positive-definite.
 */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Cholesky decomposition: A = L * L^T
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const diag = matrix[i][i] - sum;
        if (diag <= 1e-10) return null; // Not positive definite
        L[i][j] = Math.sqrt(diag);
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  // Invert L (lower triangular)
  const Linv: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    Linv[i][i] = 1 / L[i][i];
    for (let j = i + 1; j < n; j++) {
      let sum = 0;
      for (let k = i; k < j; k++) sum += L[j][k] * Linv[k][i];
      Linv[j][i] = -sum / L[j][j];
    }
  }

  // A^-1 = (L^T)^-1 * L^-1
  const inv: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = Math.max(i, j); k < n; k++) sum += Linv[k][i] * Linv[k][j];
      inv[i][j] = sum;
    }
  }
  return inv;
}

/**
 * Computes rolling-window Mahalanobis distance for multivariate anomaly detection.
 *
 * For each timestep, uses a TRAINING window (first 30% of data) to establish
 * the baseline covariance structure, then scores every point against that baseline.
 * This avoids the problem of the anomalous points corrupting the covariance estimate.
 */
function computeMultivariateAnomalyScores(
  data: SensorSample[],
  sensitivityThreshold: number
): AnomalyResult {
  const n = data.length;
  const d = SENSOR_NAMES.length; // 5 dimensions
  const trainEnd = Math.floor(n * 0.3); // first 30% is training/baseline

  // Extract sensor values into columns
  const columns: Record<SensorName, number[]> = {
    temperature: data.map((s) => s.temperature),
    pressure: data.map((s) => s.pressure),
    flow: data.map((s) => s.flow),
    level: data.map((s) => s.level),
    vibration: data.map((s) => s.vibration),
  };

  // Compute training-window mean and covariance
  const means: number[] = SENSOR_NAMES.map((name) => {
    const col = columns[name].slice(0, trainEnd);
    return col.reduce((a, b) => a + b, 0) / col.length;
  });

  // Covariance matrix from training window
  const cov: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0;
      for (let t = 0; t < trainEnd; t++) {
        const xi = columns[SENSOR_NAMES[i]][t] - means[i];
        const xj = columns[SENSOR_NAMES[j]][t] - means[j];
        sum += xi * xj;
      }
      cov[i][j] = sum / (trainEnd - 1);
      cov[j][i] = cov[i][j]; // symmetric
    }
  }

  // Add small regularization to diagonal for numerical stability
  for (let i = 0; i < d; i++) cov[i][i] += 1e-6;

  const covInv = invertMatrix(cov);
  if (!covInv) {
    // Fallback: use diagonal-only (independent sensors)
    const diagInv: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
    for (let i = 0; i < d; i++) diagInv[i][i] = 1 / Math.max(cov[i][i], 1e-6);
    return computeWithInverse(data, columns, means, diagInv, cov, sensitivityThreshold);
  }

  return computeWithInverse(data, columns, means, covInv, cov, sensitivityThreshold);
}

function computeWithInverse(
  data: SensorSample[],
  columns: Record<SensorName, number[]>,
  means: number[],
  covInv: number[][],
  cov: number[][],
  sensitivityThreshold: number
): AnomalyResult {
  const n = data.length;
  const d = SENSOR_NAMES.length;

  const mahalanobisScores: number[] = [];
  const anomalyFlags: boolean[] = [];
  const perSensorZScores: Record<SensorName, number[]> = {
    temperature: [],
    pressure: [],
    flow: [],
    level: [],
    vibration: [],
  };

  // Per-sensor standard deviations for individual z-score comparison
  const sensorStds = SENSOR_NAMES.map((_, i) => Math.sqrt(Math.max(cov[i][i], 1e-6)));

  for (let t = 0; t < n; t++) {
    // Deviation vector from training mean
    const delta: number[] = SENSOR_NAMES.map(
      (name, i) => columns[name][t] - means[i]
    );

    // Mahalanobis distance: sqrt(δ^T * Σ^-1 * δ)
    let mahal = 0;
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        mahal += delta[i] * covInv[i][j] * delta[j];
      }
    }
    mahal = Math.sqrt(Math.max(0, mahal));
    mahalanobisScores.push(Number(mahal.toFixed(3)));

    // Per-sensor z-scores (for proving scenario 4 doesn't trip individual thresholds)
    SENSOR_NAMES.forEach((name, i) => {
      const z = Math.abs(delta[i]) / sensorStds[i];
      perSensorZScores[name].push(Number(z.toFixed(3)));
    });

    anomalyFlags.push(mahal > sensitivityThreshold);
  }

  const anomalyCount = anomalyFlags.filter(Boolean).length;
  const firstDetection = anomalyFlags.findIndex(Boolean);

  return {
    time: Array.from({ length: n }, (_, i) => i),
    sensors: {
      temperature: columns.temperature,
      pressure: columns.pressure,
      flow: columns.flow,
      level: columns.level,
      vibration: columns.vibration,
    },
    mahalanobisScores,
    anomalyFlags,
    perSensorZScores,
    stats: {
      totalPoints: n,
      anomalyCount,
      maxMahalanobis: Math.max(...mahalanobisScores),
      meanMahalanobis: Number(
        (mahalanobisScores.reduce((a, b) => a + b, 0) / n).toFixed(3)
      ),
      scenarioDetected: anomalyCount > 0,
      firstDetectionIdx: firstDetection >= 0 ? firstDetection : null,
    },
  };
}

// ============================================================================
// UI COMPONENT
// ============================================================================

const SCENARIOS: { id: ScenarioType; label: string; desc: string; color: string }[] = [
  {
    id: "normal",
    label: "1. NOMINAL BASELINE (HEALTHY)",
    desc: "Correlated multi-sensor process under normal operating conditions",
    color: "text-verdigris",
  },
  {
    id: "pressure_flow_mismatch",
    label: "2. PRESSURE–FLOW RELATIONSHIP VIOLATION",
    desc: "High pressure with unexpectedly high flow — orifice correlation breaks",
    color: "text-crimson",
  },
  {
    id: "temp_vibration_fault",
    label: "3. VIBRATION FAULT (TEMP NORMAL)",
    desc: "Bearing degradation: abnormal vibration while temperature stays nominal",
    color: "text-crimson",
  },
  {
    id: "gradual_drift",
    label: "4. GRADUAL RELATIONSHIP DRIFT",
    desc: "Slowly developing fouling/wear shifts pressure-flow coupling over time",
    color: "text-amber",
  },
  {
    id: "simultaneous_moderate",
    label: "5. SIMULTANEOUS MODERATE DEVIATIONS",
    desc: "No single sensor crosses its own threshold — only detectable jointly",
    color: "text-crimson",
  },
];

export default function AnomalyDetectionPage() {
  const [scenario, setScenario] = useState<ScenarioType>("pressure_flow_mismatch");
  const [sensitivity, setSensitivity] = useState(3.5);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const mahalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate and analyze data
  const analysisResult = useMemo(() => {
    const baseData = generateNormalData(150, 42);
    const injectedData = injectAnomaly(baseData, scenario);
    return computeMultivariateAnomalyScores(injectedData, sensitivity);
  }, [scenario, sensitivity]);

  // Per-sensor individual threshold (2.0σ) — for demonstrating scenario 4
  const INDIVIDUAL_THRESHOLD = 2.0;

  // Drawing function for individual sensor panels
  const drawSensorPanel = useCallback(
    (canvas: HTMLCanvasElement, sensorName: SensorName, sensorIdx: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = "#18150F";
      ctx.fillRect(0, 0, w, h);

      const padL = 8;
      const padR = 4;
      const padT = 4;
      const padB = 4;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      const values = analysisResult.sensors[sensorName];
      const n = values.length;
      const minV = Math.min(...values) - 1;
      const maxV = Math.max(...values) + 1;
      const range = maxV - minV || 1;

      const toX = (i: number) => padL + (i / (n - 1)) * plotW;
      const toY = (v: number) => padT + plotH - ((v - minV) / range) * plotH;

      // Anomalous region background bands
      for (let i = 0; i < n; i++) {
        if (analysisResult.anomalyFlags[i]) {
          const x = toX(i);
          ctx.fillStyle = "rgba(214, 69, 80, 0.08)";
          ctx.fillRect(x - plotW / n / 2, padT, plotW / n, plotH);
        }
      }

      // Signal line
      ctx.beginPath();
      ctx.strokeStyle = "#4FA98A";
      ctx.lineWidth = 1.5;
      values.forEach((v, i) => {
        const x = toX(i);
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Anomaly highlights — crimson dots on flagged timesteps
      for (let i = 0; i < n; i++) {
        if (analysisResult.anomalyFlags[i]) {
          const x = toX(i);
          const y = toY(values[i]);
          ctx.fillStyle = "#D64550";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [analysisResult]
  );

  // Draw Mahalanobis score panel
  const drawMahalPanel = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#18150F";
      ctx.fillRect(0, 0, w, h);

      const padL = 40;
      const padR = 8;
      const padT = 8;
      const padB = 4;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      const scores = analysisResult.mahalanobisScores;
      const n = scores.length;
      const maxScore = Math.max(...scores, sensitivity + 1);

      const toX = (i: number) => padL + (i / (n - 1)) * plotW;
      const toY = (v: number) => padT + plotH - (v / maxScore) * plotH;

      // Grid
      ctx.strokeStyle = "#221E17";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#6B6255";
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const gridSteps = [0, Math.round(maxScore * 0.33), Math.round(maxScore * 0.66), Math.round(maxScore)];
      gridSteps.forEach((v) => {
        const y = toY(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        ctx.fillText(`${v.toFixed(0)}`, padL - 4, y);
      });

      // Threshold line
      const threshY = toY(sensitivity);
      ctx.strokeStyle = "#D64550";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, threshY);
      ctx.lineTo(padL + plotW, threshY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Score bars
      for (let i = 0; i < n; i++) {
        const x = toX(i);
        const y = toY(scores[i]);
        const barW = Math.max(1.5, plotW / n - 0.5);
        const isAnomaly = analysisResult.anomalyFlags[i];

        ctx.fillStyle = isAnomaly ? "#D64550" : "#4FA98A44";
        ctx.fillRect(x - barW / 2, y, barW, toY(0) - y);
      }
    },
    [analysisResult, sensitivity]
  );

  // Trigger drawing on data changes
  useEffect(() => {
    SENSOR_NAMES.forEach((name, idx) => {
      const canvas = canvasRefs.current[idx];
      if (canvas) drawSensorPanel(canvas, name, idx);
    });
    const mahalCanvas = mahalCanvasRef.current;
    if (mahalCanvas) drawMahalPanel(mahalCanvas);
  }, [drawSensorPanel, drawMahalPanel]);

  const st = analysisResult.stats;

  // Check if any single sensor crosses 2σ during anomaly window
  const injectionStart = Math.floor(150 * 0.4);
  const injectionEnd = Math.min(injectionStart + 40, 150);
  const singleSensorTriggered = scenario === "simultaneous_moderate"
    ? SENSOR_NAMES.some((name) => {
        for (let i = injectionStart; i < injectionEnd; i++) {
          if (analysisResult.perSensorZScores[name][i] > INDIVIDUAL_THRESHOLD) return true;
        }
        return false;
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-6 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-amber tracking-widest uppercase mb-2">
            <span>INTELLIGENCE // MOD-04</span>
            <span>·</span>
            <span>MULTIVARIATE STATISTICAL PROCESS CONTROL</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text mb-3">
            Multi-Sensor Anomaly Detection
          </h1>
          <p className="text-text-dim text-sm md:text-base leading-relaxed">
            Unsupervised multivariate anomaly detection using rolling Mahalanobis distance 
            from the expected joint sensor distribution. Identifies abnormal <em>relationships</em> between 
            correlated process sensors — not just individual outliers.
          </p>
        </header>

        <IntelligenceDisclaimer />

        {/* Distinction from single-sensor fault detection */}
        <div className="bg-panel border border-line rounded px-4 py-3 mb-6 text-xs font-mono text-text-dim space-y-1">
          <div className="text-amber font-bold uppercase tracking-wider text-[11px]">
            How This Differs From MOD-01 (Fault Detection)
          </div>
          <p className="font-sans leading-relaxed">
            The existing <span className="text-amber">Sensor Fault Detection</span> module evaluates each sensor 
            independently using Modified Z-Scores. This module detects anomalies in the <span className="text-text">joint 
            statistical relationship</span> between multiple correlated sensors — catching faults where no single 
            sensor crosses its own threshold, but the combination of readings is physically implausible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Scenario Selector */}
            <div className="bg-panel border border-line rounded p-5">
              <div className="font-mono text-xs text-amber uppercase tracking-wider mb-4">
                ANOMALY SCENARIO SELECTOR
              </div>
              <div className="space-y-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id)}
                    className={`w-full text-left p-3 rounded bg-panel-2 border transition-colors text-xs font-mono ${
                      scenario === s.id
                        ? "border-amber bg-[#201D17]"
                        : "border-line hover:border-amber"
                    }`}
                  >
                    <div className={`font-bold ${s.color}`}>{s.label}</div>
                    <div className="text-[11px] text-text-faint mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>

              {/* Sensitivity Slider */}
              <div className="mt-5 pt-4 border-t border-line-soft">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-text-dim">MAHALANOBIS THRESHOLD:</span>
                  <span className="text-amber font-bold">{sensitivity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="6.0"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
                <div className="flex justify-between text-[10px] font-mono text-text-faint mt-1">
                  <span>MORE SENSITIVE</span>
                  <span>LESS SENSITIVE</span>
                </div>
              </div>
            </div>

            {/* Detection Verdict */}
            <div className="bg-panel border border-line rounded p-5">
              <div className="font-mono text-xs text-amber uppercase tracking-wider mb-4">
                MULTIVARIATE DETECTION VERDICT
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-text-faint">DETECTION STATUS</div>
                  <div className="text-xl font-mono font-bold mt-1">
                    {st.anomalyCount > 0 ? (
                      <span className="text-crimson flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-crimson animate-pulse" />
                        ANOMALY DETECTED
                      </span>
                    ) : (
                      <span className="text-verdigris flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-verdigris" />
                        PROCESS NOMINAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-panel-2 p-2.5 rounded border border-line">
                    <div className="text-[10px] font-mono text-text-faint">ANOMALOUS POINTS</div>
                    <div className="text-xs font-mono font-bold text-crimson mt-0.5">
                      {st.anomalyCount} / {st.totalPoints}
                    </div>
                  </div>
                  <div className="bg-panel-2 p-2.5 rounded border border-line">
                    <div className="text-[10px] font-mono text-text-faint">MAX MAHALANOBIS</div>
                    <div className="text-xs font-mono font-bold text-amber mt-0.5">
                      {st.maxMahalanobis.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-panel-2 p-2.5 rounded border border-line">
                    <div className="text-[10px] font-mono text-text-faint">MEAN DISTANCE</div>
                    <div className="text-xs font-mono font-bold text-text-dim mt-0.5">
                      {st.meanMahalanobis}
                    </div>
                  </div>
                  <div className="bg-panel-2 p-2.5 rounded border border-line">
                    <div className="text-[10px] font-mono text-text-faint">FIRST DETECTION</div>
                    <div className="text-xs font-mono font-bold text-text-dim mt-0.5">
                      {st.firstDetectionIdx !== null ? `t = ${st.firstDetectionIdx}` : "—"}
                    </div>
                  </div>
                </div>

                {/* Scenario 4 verification callout */}
                {scenario === "simultaneous_moderate" && (
                  <div className={`mt-3 p-3 rounded border text-xs font-mono ${
                    st.anomalyCount > 0 && !singleSensorTriggered
                      ? "border-verdigris/40 bg-verdigris/5 text-verdigris"
                      : st.anomalyCount > 0
                      ? "border-amber/40 bg-amber/5 text-amber"
                      : "border-crimson/40 bg-crimson/5 text-crimson"
                  }`}>
                    {st.anomalyCount > 0 && !singleSensorTriggered ? (
                      <>
                        <div className="font-bold mb-1">✓ MULTIVARIATE-ONLY DETECTION CONFIRMED</div>
                        <div className="text-[11px] opacity-80">
                          {st.anomalyCount} points flagged by joint Mahalanobis distance while no individual 
                          sensor exceeds {INDIVIDUAL_THRESHOLD}σ. This anomaly is invisible to single-variable detectors.
                        </div>
                      </>
                    ) : st.anomalyCount > 0 ? (
                      <>
                        <div className="font-bold mb-1">⚠ DETECTED — but some individual sensors also triggered</div>
                        <div className="text-[11px] opacity-80">
                          Lower sensitivity threshold to isolate the multivariate-only detection zone.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold mb-1">✗ NOT DETECTED — threshold too high</div>
                        <div className="text-[11px] opacity-80">
                          Lower the Mahalanobis threshold to detect this subtle joint anomaly.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Multi-panel sensor charts */}
            <div className="bg-panel border border-line rounded p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-xs text-amber uppercase tracking-wider">
                  MULTI-SENSOR TELEMETRY // 5-CHANNEL MONITOR
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-verdigris" />
                    <span className="text-text-dim">Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-crimson" />
                    <span className="text-crimson font-bold">Anomaly</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {SENSOR_NAMES.map((name, idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-right">
                      <div className="font-mono text-[10px] text-text-faint uppercase tracking-wide">
                        {name === "temperature" ? "TEMP (°C)" :
                         name === "pressure" ? "PRESS (kPa)" :
                         name === "flow" ? "FLOW (L/min)" :
                         name === "level" ? "LEVEL (%)" :
                         "VIB (mm/s)"}
                      </div>
                    </div>
                    <div className="flex-1 h-14 rounded border border-line overflow-hidden">
                      <canvas
                        ref={(el) => { canvasRefs.current[idx] = el; }}
                        className="w-full h-full block"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mahalanobis Distance Chart */}
            <div className="bg-panel border border-line rounded p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-xs text-amber uppercase tracking-wider">
                  MAHALANOBIS DISTANCE SCORE // JOINT DEVIATION
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 border-t border-dashed border-crimson" />
                    <span className="text-crimson">Threshold</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-28 rounded border border-line overflow-hidden">
                <canvas
                  ref={mahalCanvasRef}
                  className="w-full h-full block"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-text-faint mt-2">
                <span>WINDOW: {analysisResult.stats.totalPoints} SAMPLES</span>
                <span>METHOD: MAHALANOBIS DISTANCE (χ² DISTRIBUTED, {SENSOR_NAMES.length} DOF)</span>
              </div>
            </div>

            {/* Algorithm Note */}
            <div className="bg-panel border border-line rounded p-5 text-xs text-text-dim space-y-2">
              <div className="font-mono text-xs text-amber uppercase font-semibold">
                DETECTION ALGORITHM NOTE
              </div>
              <p className="font-sans leading-relaxed">
                The Mahalanobis distance measures how far a multivariate observation falls from the training 
                distribution, accounting for correlations between sensors. Unlike per-sensor z-scores, it captures 
                when the <em className="text-text">relationship</em> between sensors is abnormal — such as 
                pressure rising while flow also rises (violating the expected inverse orifice coupling), or 
                multiple sensors shifting by individually small amounts that are collectively implausible.
              </p>
              <div className="p-3 bg-panel-2 rounded border border-line font-mono text-amber text-[11px]">
                D_M(x) = √[(x - μ)ᵀ · Σ⁻¹ · (x - μ)]
              </div>
              <p className="font-sans leading-relaxed text-text-faint">
                Training baseline computed from the first 30% of the signal window. Points with D_M exceeding 
                the configurable threshold are flagged as anomalous across all sensor panels simultaneously.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter subtitle="INTELLIGENCE ENGINE // MULTIVARIATE ANOMALY DETECTION" />
    </div>
  );
}
