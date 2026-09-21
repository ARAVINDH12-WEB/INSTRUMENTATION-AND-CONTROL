"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";

interface ForecastResult {
  forecast: number[];
  upper_bound: number[];
  lower_bound: number[];
  horizon_steps: number;
  step_seconds: number;
  model_type: string;
  algorithm: string;
}

const datasets = {
  exotherm: {
    name: "Reactor Exotherm Surge (TK-201)",
    unit: "°C",
    data: [58.2, 59.0, 60.1, 61.5, 63.2, 65.4, 68.0, 71.2, 74.8, 79.0],
  },
  heat_exchanger: {
    name: "Counterflow Shell-and-Tube (HX-104)",
    unit: "°C",
    data: [82.5, 82.2, 81.8, 81.5, 81.1, 80.9, 80.6, 80.4, 80.1, 79.9],
  },
  ambient_cooling: {
    name: "Holding Vessel Decay (V-305)",
    unit: "°C",
    data: [94.0, 91.2, 88.8, 86.6, 84.7, 83.0, 81.5, 80.2, 79.0, 78.0],
  },
};

export default function ForecastingPage() {
  const [selectedKey, setSelectedKey] = useState<keyof typeof datasets>("exotherm");
  const [horizon, setHorizon] = useState<number>(12);
  const [alpha, setAlpha] = useState<number>(0.35);
  const [beta, setBeta] = useState<number>(0.15);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeDataset = datasets[selectedKey];

  const runForecast = useCallback(async () => {
    setLoading(true);
    setBackendError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/forecast/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historical_temperatures: activeDataset.data,
          horizon_steps: horizon,
          step_seconds: 1.0,
          alpha,
          beta,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: ForecastResult = await res.json();
      setResult(data);
    } catch (err) {
      setBackendError("Backend server offline on port 8000. Running local client-side Holt forecaster.");

      // Local fallback implementation matching backend Holt linear trend
      const series = activeDataset.data;
      const n = series.length;
      let level = series[0];
      let trend = series[1] - series[0];
      const residuals: number[] = [];

      for (let i = 1; i < n; i++) {
        const val = series[i];
        const prev_l = level;
        const prev_t = trend;
        residuals.push(val - (prev_l + prev_t));
        level = alpha * val + (1 - alpha) * (prev_l + prev_t);
        trend = beta * (level - prev_l) + (1 - beta) * prev_t;
      }

      const res_var = residuals.reduce((a, b) => a + b * b, 0) / Math.max(1, residuals.length);
      const res_std = Math.sqrt(res_var) || 0.4;

      const forecast: number[] = [];
      const upper: number[] = [];
      const lower: number[] = [];

      for (let m = 1; m <= horizon; m++) {
        const damped_m = Array.from({ length: m }, (_, k) => Math.pow(0.96, k)).reduce((a, b) => a + b, 0);
        const y_hat = Number((level + damped_m * trend).toFixed(2));
        forecast.push(y_hat);
        const margin = Number((1.645 * res_std * Math.sqrt(m)).toFixed(2));
        upper.push(Number((y_hat + margin).toFixed(2)));
        lower.push(Number((y_hat - margin).toFixed(2)));
      }

      setResult({
        forecast,
        upper_bound: upper,
        lower_bound: lower,
        horizon_steps: horizon,
        step_seconds: 1.0,
        model_type: "DOUBLE_EXPONENTIAL_SMOOTHING",
        algorithm: "Holt's Linear Trend with 90% Prediction Intervals (Client Fallback)",
      });
    } finally {
      setLoading(false);
    }
  }, [activeDataset, horizon, alpha, beta]);

  useEffect(() => {
    runForecast();
  }, [runForecast]);

  // Chart Rendering
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
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

    const padL = 52;
    const padR = 30;
    const padT = 24;
    const padB = 36;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const hist = activeDataset.data;
    const fc = result.forecast;
    const upper = result.upper_bound;
    const lower = result.lower_bound;
    const totalPoints = hist.length + fc.length;

    // Determine Y Bounds
    const allVals = [...hist, ...fc, ...upper, ...lower];
    const minY = Math.floor(Math.min(...allVals) - 2);
    const maxY = Math.ceil(Math.max(...allVals) + 2);
    const rangeY = maxY - minY || 1;

    const toX = (idx: number) => padL + (idx / (totalPoints - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minY) / rangeY) * plotH;

    // Horizontal Grid Ticks
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6B6255";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";

    const tickStep = (maxY - minY) / 4;
    for (let i = 0; i <= 4; i++) {
      const val = minY + i * tickStep;
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${val.toFixed(1)}°C`, padL - 8, y + 3);
    }

    // Historical / Forecast Divider Line
    const splitX = toX(hist.length - 1);
    ctx.strokeStyle = "rgba(255, 176, 0, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, padT);
    ctx.lineTo(splitX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#A79C8A";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText("HISTORICAL OBSERVATION", splitX - 8, padT + 12);
    ctx.textAlign = "left";
    ctx.fillText("PROJECTED HORIZON ⟶", splitX + 8, padT + 12);

    // 1. Shaded 90% Confidence Interval Band
    ctx.fillStyle = "rgba(255, 176, 0, 0.08)";
    ctx.beginPath();
    // Top boundary
    ctx.moveTo(splitX, toY(hist[hist.length - 1]));
    fc.forEach((_, i) => {
      ctx.lineTo(toX(hist.length + i), toY(upper[i]));
    });
    // Bottom boundary (in reverse)
    for (let i = fc.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(hist.length + i), toY(lower[i]));
    }
    ctx.lineTo(splitX, toY(hist[hist.length - 1]));
    ctx.closePath();
    ctx.fill();

    // 2. Historical Trace (Continuous Verdigris/Teal Signal)
    ctx.strokeStyle = "#4FA98A";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    hist.forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Historical Points
    ctx.fillStyle = "#4FA98A";
    hist.forEach((val, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(val), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Forecast Trace (Dashed Phosphor Amber)
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, toY(hist[hist.length - 1]));
    fc.forEach((val, i) => {
      ctx.lineTo(toX(hist.length + i), toY(val));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Forecast Points
    ctx.fillStyle = "#FFB000";
    fc.forEach((val, i) => {
      ctx.beginPath();
      ctx.arc(toX(hist.length + i), toY(val), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [activeDataset, result]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-6 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-2">
            <span>INTELLIGENCE // MOD-03</span>
            <span>·</span>
            <span>TIME-SERIES FORECASTING</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-cf-text mb-3">
            Process Variable Trend Forecasting
          </h1>
          <p className="text-cf-text-dim text-sm md:text-base leading-relaxed">
            Double Exponential Smoothing (Holt-Linear) projection of future thermal behavior with 90% confidence 
            prediction envelopes, enabling feedforward action before threshold alarm breaches.
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
                PROCESS THERMAL DATASET
              </div>
              <div className="space-y-2">
                {(Object.keys(datasets) as (keyof typeof datasets)[]).map((key) => {
                  const ds = datasets[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={`w-full text-left p-3 rounded border text-xs font-mono transition-colors ${
                        selectedKey === key
                          ? "bg-cf-panel-2 border-cf-amber text-cf-amber"
                          : "bg-cf-panel-2 border-cf-line text-cf-text-dim hover:text-cf-text hover:border-cf-line-soft"
                      }`}
                    >
                      <div className="font-bold">{ds.name}</div>
                      <div className="text-[11px] text-cf-text-faint mt-0.5">
                        Baseline: {ds.data[0]}°C ⟶ Last: {ds.data[ds.data.length - 1]}°C
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tuning Parameters */}
              <div className="mt-6 pt-4 border-t border-cf-line-soft space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">FORECAST HORIZON:</span>
                    <span className="text-cf-amber font-bold">{horizon} steps ahead</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={horizon}
                    onChange={(e) => setHorizon(parseInt(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">LEVEL COEFFICIENT (α):</span>
                    <span className="text-cf-amber font-bold">{alpha}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">TREND COEFFICIENT (β):</span>
                    <span className="text-cf-amber font-bold">{beta}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.02"
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>
              </div>
            </div>

            {/* Model Metadata Card */}
            <div className="bg-cf-panel border border-cf-line rounded p-5 text-xs font-mono space-y-3">
              <div className="text-cf-amber font-semibold uppercase tracking-wider">
                ALGORITHM ARCHITECTURE
              </div>
              <div>
                <span className="text-cf-text-faint">MODEL TYPE:</span>
                <div className="text-cf-text font-bold mt-0.5">
                  DOUBLE EXPONENTIAL SMOOTHING (HOLT)
                </div>
              </div>
              <div>
                <span className="text-cf-text-faint">ESTIMATED ENDPOINT (+{horizon}s):</span>
                <div className="text-lg font-bold text-cf-amber mt-0.5">
                  {result ? `${result.forecast[result.forecast.length - 1]}°C` : "—"}
                </div>
                <div className="text-[11px] text-cf-text-dim">
                  90% CI: {result ? `${result.lower_bound[result.lower_bound.length - 1]}°C – ${result.upper_bound[result.upper_bound.length - 1]}°C` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                  TIME-SERIES HORIZON RECORDER // {activeDataset.name}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cf-verdigris inline-block" />
                    <span className="text-cf-text-dim">Observed Historical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-cf-amber inline-block" />
                    <span className="text-cf-amber font-bold">Projected Forecast</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-cf-amber/15 inline-block rounded-xs" />
                    <span className="text-cf-text-faint">90% CI Envelope</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-80 relative rounded border border-cf-line overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-cf-text-faint mt-3">
                <span>OBSERVED: {activeDataset.data.length} SAMPLES</span>
                <span>PROJECTED: +{horizon} TIMESTEPS (1.0s / STEP)</span>
              </div>
            </div>

            {/* Projection Data Table */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-3">
                STEP-BY-STEP PROJECTION HORIZON MATRIX
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-cf-panel-2 border-b border-cf-line text-cf-text-faint">
                    <tr>
                      <th className="p-2">STEP (t+m)</th>
                      <th className="p-2">FORECAST (Ŷ)</th>
                      <th className="p-2">LOWER (90% CI)</th>
                      <th className="p-2">UPPER (90% CI)</th>
                      <th className="p-2">DELTA (Δ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cf-line-soft">
                    {result?.forecast.slice(0, 6).map((val, i) => {
                      const prev = i === 0 ? activeDataset.data[activeDataset.data.length - 1] : result.forecast[i - 1];
                      const delta = (val - prev).toFixed(2);
                      return (
                        <tr key={i} className="hover:bg-cf-panel-2">
                          <td className="p-2 text-cf-text-dim">+{i + 1}s</td>
                          <td className="p-2 text-cf-amber font-bold">{val}°C</td>
                          <td className="p-2 text-cf-text-faint">{result.lower_bound[i]}°C</td>
                          <td className="p-2 text-cf-text-faint">{result.upper_bound[i]}°C</td>
                          <td className={`p-2 font-bold ${Number(delta) >= 0 ? "text-cf-verdigris" : "text-cf-crimson"}`}>
                            {Number(delta) > 0 ? `+${delta}` : delta}°C
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter subtitle="FORECASTING ENGINE // EXPONENTIAL SMOOTHING" />
    </div>
  );
}
