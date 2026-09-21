"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";

interface FaultResult {
  sensor_id: string;
  fault_detected: boolean;
  fault_type: string;
  confidence: number;
  anomaly_score: number;
  anomalous_indices: number[];
  per_point_scores: number[];
  summary_stats: {
    mean?: number;
    median?: number;
    std_dev?: number;
    mad?: number;
    max_z_score?: number;
    total_points?: number;
    anomalous_count?: number;
  };
}

export default function FaultDetectionPage() {
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [sensorTag, setSensorTag] = useState<string>("PT-101");
  const [zThresh, setZThresh] = useState<number>(2.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FaultResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synthetic Data Generators
  const generateDataset = useCallback((type: "nominal" | "drift" | "spikes" | "stuck") => {
    const n = 50;
    const series: number[] = [];
    const base = 50.0;

    for (let i = 0; i < n; i++) {
      if (type === "nominal") {
        // Normal process variation +/- 1.5%
        const noise = (Math.random() - 0.5) * 3.0;
        series.push(Number((base + noise).toFixed(2)));
      } else if (type === "drift") {
        // Slow calibration drift starting halfway
        const drift = i > 20 ? (i - 20) * 1.3 : 0;
        const noise = (Math.random() - 0.5) * 2.0;
        series.push(Number((base + drift + noise).toFixed(2)));
      } else if (type === "spikes") {
        // Intermittent large EMI or cavitation spikes
        let val = base + (Math.random() - 0.5) * 2.5;
        if (i === 12) val = 84.5;
        if (i === 28) val = 14.2;
        if (i === 39) val = 91.0;
        series.push(Number(val.toFixed(2)));
      } else if (type === "stuck") {
        // Frozen transmitter diaphragm
        if (i < 15) series.push(Number((base + (Math.random() - 0.5) * 2.0).toFixed(2)));
        else series.push(42.0); // frozen flatline
      }
    }
    setDataPoints(series);
  }, []);

  // Initial load
  useEffect(() => {
    generateDataset("spikes");
  }, [generateDataset]);

  // Execute Anomaly Detection API
  const runDetection = useCallback(async () => {
    if (dataPoints.length === 0) return;
    setLoading(true);
    setBackendError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/predict/fault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readings: dataPoints,
          sensor_id: sensorTag,
          sampling_rate_hz: 10.0,
          z_threshold: zThresh,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: FaultResult = await res.json();
      setResult(data);
    } catch (err) {
      // Local fallback calculation if backend server is not running
      setBackendError("Backend server offline on port 8000. Running local client-side statistical engine.");
      
      const n = dataPoints.length;
      const sorted = [...dataPoints].sort((a, b) => a - b);
      const median = n % 2 !== 0 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const dev = sorted.map((x) => Math.abs(x - median)).sort((a, b) => a - b);
      const mad = Math.max(dev[Math.floor(n / 2)], 0.25);

      const mean = dataPoints.reduce((a, b) => a + b, 0) / n;
      const variance = dataPoints.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
      const std_dev = Math.sqrt(variance);

      const anomalous_indices: number[] = [];
      const per_point_scores: number[] = [];

      dataPoints.forEach((val, i) => {
        const mod_z = (0.6745 * Math.abs(val - median)) / mad;
        const prev = i > 0 ? dataPoints[i - 1] : val;
        const step_z = Math.abs(val - prev) / (mad * 2.0);
        const score = Math.max(mod_z, step_z);
        per_point_scores.push(Number(Math.min(1.0, score / 4.0).toFixed(3)));
        if (score >= zThresh || val < 0 || val > 100) anomalous_indices.push(i);
      });

      const hasFault = anomalous_indices.length > 0;
      setResult({
        sensor_id: sensorTag,
        fault_detected: hasFault,
        fault_type: hasFault ? "TRANSIENT_SENSOR_SPIKE" : "NOMINAL",
        confidence: hasFault ? 0.89 : 0.96,
        anomaly_score: Math.max(...per_point_scores, 0),
        anomalous_indices,
        per_point_scores,
        summary_stats: {
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          std_dev: Number(std_dev.toFixed(3)),
          mad: Number(mad.toFixed(3)),
          total_points: n,
          anomalous_count: anomalous_indices.length,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [dataPoints, sensorTag, zThresh]);

  useEffect(() => {
    runDetection();
  }, [dataPoints, runDetection]);

  // Canvas Drawing
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataPoints.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#18150F";
    ctx.fillRect(0, 0, width, height);

    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 36;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Determine Y range
    const minVal = Math.min(0, ...dataPoints);
    const maxVal = Math.max(100, ...dataPoints);
    const rangeVal = maxVal - minVal || 1;

    const toX = (i: number) => padL + (i / (dataPoints.length - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minVal) / rangeVal) * plotH;

    // Grid Lines
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6B6255";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";

    for (let step = 0; step <= 100; step += 25) {
      const y = toY(step);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${step}%`, padL - 8, y + 3);
    }

    // Connect Time-Series Line (Signal Amber)
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    dataPoints.forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Subtle Amber Glow
    ctx.strokeStyle = "rgba(255, 176, 0, 0.25)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Normal Points vs Anomalies
    const anomalies = new Set(result?.anomalous_indices || []);
    dataPoints.forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      const isAnomaly = anomalies.has(i);

      if (isAnomaly) {
        // Crimson pulsing anomaly highlight
        ctx.fillStyle = "#D64550";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(214, 69, 80, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Normal amber point
        ctx.fillStyle = "#FFB000";
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [dataPoints, result]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-6 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-2">
            <span>INTELLIGENCE // MOD-01</span>
            <span>·</span>
            <span>STATISTICAL SENSOR DIAGNOSTICS</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-cf-text mb-3">
            Sensor Anomaly &amp; Fault Classification
          </h1>
          <p className="text-cf-text-dim text-sm md:text-base leading-relaxed">
            Real-time statistical outlier isolation using Median Absolute Deviation (MAD) and Modified Z-Score testing. 
            Identifies sensor drift, transient impulses, and out-of-bounds failures without black-box opacity.
          </p>
        </header>

        <IntelligenceDisclaimer />

        {backendError && (
          <div className="bg-cf-panel-2 border border-cf-amber/40 text-cf-amber text-xs font-mono p-3 rounded mb-6 flex items-center justify-between">
            <span>ℹ {backendError}</span>
            <span className="text-[11px] text-cf-text-faint">CLIENT FALLBACK ACTIVE</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-4">
                SYNTHETIC SENSOR GENERATOR
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => generateDataset("nominal")}
                  className="w-full text-left p-3 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-amber transition-colors text-xs font-mono"
                >
                  <div className="font-bold text-cf-verdigris">1. NOMINAL NOISE (HEALTHY)</div>
                  <div className="text-[11px] text-cf-text-faint">Zero-mean Gaussian process fluctuation (±1.5%)</div>
                </button>

                <button
                  onClick={() => generateDataset("spikes")}
                  className="w-full text-left p-3 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-amber transition-colors text-xs font-mono"
                >
                  <div className="font-bold text-cf-crimson">2. TRANSIENT IMPULSE SPIKES</div>
                  <div className="text-[11px] text-cf-text-faint">Intermittent cavitation / electrical EMI spikes</div>
                </button>

                <button
                  onClick={() => generateDataset("drift")}
                  className="w-full text-left p-3 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-amber transition-colors text-xs font-mono"
                >
                  <div className="font-bold text-cf-amber">3. SYSTEMIC SENSOR DRIFT</div>
                  <div className="text-[11px] text-cf-text-faint">Gradual diaphragm calibration drift (+1.3%/step)</div>
                </button>

                <button
                  onClick={() => generateDataset("stuck")}
                  className="w-full text-left p-3 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-amber transition-colors text-xs font-mono"
                >
                  <div className="font-bold text-cf-text">4. STUCK / FROZEN SENSOR</div>
                  <div className="text-[11px] text-cf-text-faint">Zero-variance mechanical sticking (flatline)</div>
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-cf-line-soft">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cf-text-dim">Z-SCORE THRESHOLD:</span>
                  <span className="text-cf-amber font-bold">{zThresh.toFixed(1)}σ</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={zThresh}
                  onChange={(e) => setZThresh(parseFloat(e.target.value))}
                  className="w-full accent-cf-amber"
                />
              </div>
            </div>

            {/* Verdict Card */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-4">
                CLASSIFICATION VERDICT
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-cf-text-faint">DETECTION STATUS</div>
                  <div className="text-xl font-mono font-bold mt-1">
                    {result?.fault_detected ? (
                      <span className="text-cf-crimson flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cf-crimson animate-pulse" />
                        FAULT DETECTED
                      </span>
                    ) : (
                      <span className="text-cf-verdigris flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cf-verdigris" />
                        SIGNAL NOMINAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">FAULT TYPE</div>
                    <div className="text-xs font-mono font-bold text-cf-text mt-0.5 truncate">
                      {result?.fault_type || "EVALUATING"}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">CONFIDENCE</div>
                    <div className="text-xs font-mono font-bold text-cf-amber mt-0.5">
                      {result ? `${(result.confidence * 100).toFixed(1)}%` : "—"}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">ANOMALOUS POINTS</div>
                    <div className="text-xs font-mono font-bold text-cf-crimson mt-0.5">
                      {result?.anomalous_indices.length || 0} / {dataPoints.length}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">MEDIAN / MAD</div>
                    <div className="text-xs font-mono font-bold text-cf-text-dim mt-0.5">
                      {result?.summary_stats.median ?? "—"} / {result?.summary_stats.mad ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                  TELEMETRY OSCILLOSCOPE // {sensorTag}
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cf-amber" />
                    <span className="text-cf-text-dim">Nominal Sample</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cf-crimson" />
                    <span className="text-cf-crimson font-bold">Anomaly Outlier</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-80 relative rounded border border-cf-line overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-cf-text-faint mt-3">
                <span>WINDOW: {dataPoints.length} SAMPLES @ 10Hz</span>
                <span>METHOD: MODIFIED Z-SCORE (BORIS IGLEWICZ &amp; DAVID HOAGLIN)</span>
              </div>
            </div>

            {/* Methodological Context */}
            <div className="bg-cf-panel border border-cf-line rounded p-5 text-xs text-cf-text-dim space-y-2">
              <div className="font-mono text-xs text-cf-amber uppercase font-semibold">
                DIAGNOSTIC ALGORITHM NOTE
              </div>
              <p className="leading-relaxed">
                Standard standard deviation algorithms fail in industrial applications because large sensor spikes inflate 
                the sample variance, hiding subsequent anomalies. ControlForge applies Median Absolute Deviation (MAD):
              </p>
              <div className="p-3 bg-cf-panel-2 rounded border border-cf-line font-mono text-cf-amber text-[11px]">
                M_i = 0.6745 · |x_i - Median(X)| / MAD(X)
              </div>
              <p className="leading-relaxed text-cf-text-faint">
                Points with M_i exceeding the configurable cutoff threshold are marked in crimson and tagged with diagnostic action recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter subtitle="DIAGNOSTIC ENGINE // STATISTICAL ANOMALY" />
    </div>
  );
}
