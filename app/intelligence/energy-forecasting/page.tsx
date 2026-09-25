"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";

interface ForecastMethodResult {
  name: string;
  key: string;
  forecast: number[];
  mae: number;
  rmse: number;
  mape: number;
  description: string;
}

interface EnergyForecastResponse {
  history: number[];
  actual_test: number[];
  methods: ForecastMethodResult[];
  best_method: string;
  horizon_steps: number;
  sample_interval_hours: number;
  model_type: string;
  timestamp: string;
}

export default function EnergyForecastingPage() {
  const [horizon, setHorizon] = useState<number>(24);
  const [baselineKw, setBaselineKw] = useState<number>(450);
  const [noiseStd, setNoiseStd] = useState<number>(6.0);
  const [visibleMethods, setVisibleMethods] = useState<Record<string, boolean>>({
    holt_winters: true,
    seasonal_naive: true,
    holt_linear: true,
    naive: true,
    actual_test: true,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EnergyForecastResponse | null>(null);
  const [backendStatus, setBackendStatus] = useState<"connected" | "fallback">("connected");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Client-side fallback calculation matching backend equations
  const runClientFallback = useCallback(
    (hSteps: number, base: number, noise: number): EnergyForecastResponse => {
      // 1. Synthetic series generator
      const days = 12;
      const totalHours = days * 24;
      const fullSeries: number[] = [];

      for (let t = 0; t < totalHours; t++) {
        const h = t % 24;
        const day = Math.floor(t / 24) % 7; // 0..4 Mon..Fri, 5..6 Sat..Sun
        const daily =
          -65.0 * Math.cos((2.0 * Math.PI * h) / 24.0) +
          25.0 * Math.sin((4.0 * Math.PI * h) / 24.0) -
          15.0 * Math.cos((4.0 * Math.PI * h) / 24.0);
        const weekendFactor = day === 5 || day === 6 ? -90.0 : 0.0;
        // Pseudo-random Gaussian using Box-Muller transform
        const u1 = Math.max(1e-6, ((t * 9301 + 49297) % 233280) / 233280.0);
        const u2 = ((t * 49297 + 9301) % 233280) / 233280.0;
        const gNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * noise;
        const val = Math.max(10.0, Number((base + daily + weekendFactor + gNoise).toFixed(2)));
        fullSeries.push(val);
      }

      const train = fullSeries.slice(0, totalHours - hSteps);
      const actualTest = fullSeries.slice(totalHours - hSteps);
      const m = 24;

      // Accuracy helper
      const computeAccuracy = (actual: number[], pred: number[]) => {
        const n = actual.length;
        const mae = actual.reduce((sum, a, i) => sum + Math.abs(a - pred[i]), 0) / n;
        const rmse = Math.sqrt(actual.reduce((sum, a, i) => sum + Math.pow(a - pred[i], 2), 0) / n);
        const mape =
          (actual.reduce((sum, a, i) => sum + Math.abs((a - pred[i]) / (a || 1)), 0) / n) * 100.0;
        return {
          mae: Number(mae.toFixed(2)),
          rmse: Number(rmse.toFixed(2)),
          mape: Number(mape.toFixed(2)),
        };
      };

      // 1. Naive
      const naivePred = Array(hSteps).fill(Number(train[train.length - 1].toFixed(2)));
      const naiveMetrics = computeAccuracy(actualTest, naivePred);

      // 2. Seasonal-Naive
      const snaivePred: number[] = [];
      for (let i = 0; i < hSteps; i++) {
        const idx = train.length - m + (i % m);
        snaivePred.push(Number(train[idx].toFixed(2)));
      }
      const snaiveMetrics = computeAccuracy(actualTest, snaivePred);

      // 3. Holt Linear
      let l = train[0];
      let b = train[1] - train[0];
      const alphaH = 0.35;
      const betaH = 0.15;
      for (let i = 1; i < train.length; i++) {
        const v = train[i];
        const prevL = l;
        const prevB = b;
        l = alphaH * v + (1 - alphaH) * (prevL + prevB);
        b = betaH * (l - prevL) + (1 - betaH) * prevB;
      }
      const holtPred: number[] = [];
      for (let i = 1; i <= hSteps; i++) {
        const damped = Array.from({ length: i }, (_, k) => Math.pow(0.98, k)).reduce((x, y) => x + y, 0);
        holtPred.push(Number((l + damped * b).toFixed(2)));
      }
      const holtMetrics = computeAccuracy(actualTest, holtPred);

      // 4. Holt-Winters
      const l0 = train.slice(0, m).reduce((a, b) => a + b, 0) / m;
      let b0Sum = 0;
      for (let i = 0; i < m; i++) {
        b0Sum += (train[i + m] - train[i]) / m;
      }
      const b0 = b0Sum / m;
      const sInit: number[] = [];
      for (let i = 0; i < m; i++) {
        const d1 = train[i] - (l0 + (i - m / 2.0) * b0);
        const d2 = train[i + m] - (l0 + (i + m / 2.0) * b0);
        sInit.push((d1 + d2) / 2.0);
      }
      const meanS = sInit.reduce((a, b) => a + b, 0) / m;
      const seasonals = sInit.map((s) => s - meanS);

      let hwL = l0;
      let hwB = b0;
      const alphaHW = 0.2;
      const betaHW = 0.001;
      const gammaHW = 0.15;
      const phiHW = 0.9;

      for (let t = 0; t < train.length; t++) {
        const v = train[t];
        const sPrev = seasonals[t];
        const prevL = hwL;
        const prevB = hwB;
        hwL = alphaHW * (v - sPrev) + (1.0 - alphaHW) * (prevL + phiHW * prevB);
        hwB = betaHW * (hwL - prevL) + (1.0 - betaHW) * (phiHW * prevB);
        const sNew = gammaHW * (v - hwL) + (1.0 - gammaHW) * sPrev;
        seasonals.push(sNew);
      }

      const hwPred: number[] = [];
      for (let i = 1; i <= hSteps; i++) {
        const sVal = seasonals[seasonals.length - m + ((i - 1) % m)];
        const dampedB = Array.from({ length: i }, (_, k) => Math.pow(phiHW, k + 1)).reduce((x, y) => x + y, 0) * hwB;
        hwPred.push(Number((hwL + dampedB + sVal).toFixed(2)));
      }
      const hwMetrics = computeAccuracy(actualTest, hwPred);

      const methods: ForecastMethodResult[] = [
        {
          name: "Holt-Winters (Triple Exp)",
          key: "holt_winters",
          forecast: hwPred,
          mae: hwMetrics.mae,
          rmse: hwMetrics.rmse,
          mape: hwMetrics.mape,
          description: "Triple exponential smoothing with additive diurnal seasonality and damped trend.",
        },
        {
          name: "Seasonal-Naive (24h)",
          key: "seasonal_naive",
          forecast: snaivePred,
          mae: snaiveMetrics.mae,
          rmse: snaiveMetrics.rmse,
          mape: snaiveMetrics.mape,
          description: "Repeats telemetry from the exact same hour of the preceding 24-hour cycle.",
        },
        {
          name: "Holt Linear Trend",
          key: "holt_linear",
          forecast: holtPred,
          mae: holtMetrics.mae,
          rmse: holtMetrics.rmse,
          mape: holtMetrics.mape,
          description: "Double exponential smoothing with level and trend; lacks cyclical seasonal awareness.",
        },
        {
          name: "Naive (Last-Value)",
          key: "naive",
          forecast: naivePred,
          mae: naiveMetrics.mae,
          rmse: naiveMetrics.rmse,
          mape: naiveMetrics.mape,
          description: "Flat projection repeating the most recently recorded telemetry sample.",
        },
      ];

      const best = [...methods].sort((a, b) => a.mape - b.mape)[0].name;

      return {
        history: train.slice(-72),
        actual_test: actualTest,
        methods,
        best_method: best,
        horizon_steps: hSteps,
        sample_interval_hours: 1.0,
        model_type: "SEASONAL_TIME_SERIES_BENCHMARK",
        timestamp: new Date().toISOString(),
      };
    },
    []
  );

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/forecast/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horizon_steps: horizon,
          baseline_kw: baselineKw,
          noise_std: noiseStd,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: EnergyForecastResponse = await res.json();
      setResult(data);
      setBackendStatus("connected");
    } catch {
      const fallback = runClientFallback(horizon, baselineKw, noiseStd);
      setResult(fallback);
      setBackendStatus("fallback");
    } finally {
      setLoading(false);
    }
  }, [horizon, baselineKw, noiseStd, runClientFallback]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Canvas drawing
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

    // CRT Phosphor Background
    ctx.fillStyle = "#090E0C";
    ctx.fillRect(0, 0, width, height);

    const padL = 58;
    const padR = 24;
    const padT = 28;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const hist = result.history;
    const testActual = result.actual_test;
    const totalPoints = hist.length + testActual.length;

    // Gather all active values for Y auto-scaling
    let allVals = [...hist, ...testActual];
    result.methods.forEach((m) => {
      if (visibleMethods[m.key]) {
        allVals = allVals.concat(m.forecast);
      }
    });

    const minY = Math.floor(Math.min(...allVals) - 20);
    const maxY = Math.ceil(Math.max(...allVals) + 20);
    const rangeY = maxY - minY || 1;

    const toX = (idx: number) => padL + (idx / (totalPoints - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minY) / rangeY) * plotH;

    // CRT Graticule Grid Ticks & Labels
    ctx.strokeStyle = "rgba(79, 169, 138, 0.12)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(79, 169, 138, 0.65)";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";

    const tickSteps = 5;
    for (let i = 0; i <= tickSteps; i++) {
      const val = minY + (i * (maxY - minY)) / tickSteps;
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(val)} kW`, padL - 8, y + 3);
    }

    // Historical / Forecast Divider
    const splitX = toX(hist.length - 1);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, padT);
    ctx.lineTo(splitX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#A79C8A";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`HISTORICAL (${hist.length}h)`, splitX - 10, padT + 12);
    ctx.textAlign = "left";
    ctx.fillText(`TEST HORIZON (+${testActual.length}h) ⟶`, splitX + 10, padT + 12);

    // 1. Draw Historical Load (Verdigris continuous signal)
    ctx.strokeStyle = "#2DD4BF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    hist.forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Draw Ground Truth Test Actuals (Neutral dashed white)
    if (visibleMethods.actual_test) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 2.0;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(splitX, toY(hist[hist.length - 1]));
      testActual.forEach((val, i) => {
        ctx.lineTo(toX(hist.length + i), toY(val));
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw subtle dots on actual test points
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      testActual.forEach((val, i) => {
        ctx.beginPath();
        ctx.arc(toX(hist.length + i), toY(val), 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Color definitions for methods
    const methodStyles: Record<string, { stroke: string; width: number; dash: number[] }> = {
      holt_winters: { stroke: "#F59E0B", width: 2.8, dash: [6, 4] }, // Amber primary
      seasonal_naive: { stroke: "#5B9BD5", width: 2.2, dash: [4, 4] }, // Steel
      holt_linear: { stroke: "#FF6B4A", width: 2.0, dash: [3, 3] }, // Ember
      naive: { stroke: "#9D7FE8", width: 1.8, dash: [2, 4] }, // Violet
    };

    // Draw Comparative Forecasts
    result.methods.forEach((m) => {
      if (!visibleMethods[m.key]) return;
      const style = methodStyles[m.key] || { stroke: "#CCCCCC", width: 1.5, dash: [] };

      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.width;
      ctx.setLineDash(style.dash);
      ctx.beginPath();
      ctx.moveTo(splitX, toY(hist[hist.length - 1]));
      m.forecast.forEach((val, i) => {
        ctx.lineTo(toX(hist.length + i), toY(val));
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots on forecast points
      ctx.fillStyle = style.stroke;
      m.forecast.forEach((val, i) => {
        ctx.beginPath();
        ctx.arc(toX(hist.length + i), toY(val), 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Time Axis Marks
    ctx.fillStyle = "#6B6255";
    ctx.textAlign = "center";
    ctx.font = "9px IBM Plex Mono, monospace";
    const xInterval = Math.max(12, Math.floor(totalPoints / 8));
    for (let i = 0; i < totalPoints; i += xInterval) {
      const relHour = i - hist.length;
      const label = relHour < 0 ? `${relHour}h` : `+${relHour}h`;
      ctx.fillText(label, toX(i), padT + plotH + 16);
    }
  }, [result, visibleMethods]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const toggleMethod = (key: string) => {
    setVisibleMethods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <InstrumentPanel className="flex flex-col gap-6">
          {/* Page Header */}
          <header className="mb-2 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs text-amber tracking-widest uppercase mb-2">
              <span>STAGE 3 // APPLIED INTELLIGENCE</span>
              <span>·</span>
              <span>MOD-05 · MULTI-ALGORITHM LOAD FORECASTING</span>
            </div>
            <h1 className="font-panel-heading text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
              Industrial Energy-Consumption Forecasting
            </h1>
            <p className="font-panel-body text-sm md:text-base text-text-dim leading-relaxed">
              Multi-method seasonal time-series benchmark evaluating Holt-Winters triple exponential smoothing 
              against seasonal-naive, Holt linear, and baseline last-value projections on industrial power load curves.
            </p>
          </header>

        {/* Disclaimer Banner */}
        <IntelligenceDisclaimer />

        {/* Status indicator */}
        <div className="mb-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                backendStatus === "connected" ? "bg-cf-verdigris animate-pulse" : "bg-cf-amber"
              }`}
            />
            <span className="text-cf-text-dim">
              ENGINE STATUS:{" "}
              <strong className="text-cf-text">
                {backendStatus === "connected" ? "FASTAPI SERVER (PORT 8000)" : "LOCAL CLIENT-SIDE ENGINE (FALLBACK)"}
              </strong>
            </span>
          </div>
          <div className="text-cf-text-faint">
            HORIZON: {horizon}H · INTERVAL: 1.0H · BASELINE: {baselineKw} kW
          </div>
        </div>

        {/* Interactive Canvas Chart */}
        <section className="bg-cf-panel border border-cf-line rounded-lg p-4 md:p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-cf-line">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-cf-panel-2 border border-cf-line text-cf-amber">
                TELEMETRY &amp; PROJECTION TRACE
              </span>
              <span className="font-mono text-xs text-cf-text-faint">
                UNITS: kW (ELECTRIC ACTIVE POWER)
              </span>
            </div>

            {/* Trace Visibility Toggles */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => toggleMethod("actual_test")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  visibleMethods.actual_test
                    ? "border-white/40 bg-white/10 text-white"
                    : "border-cf-line bg-cf-panel text-cf-text-faint"
                }`}
              >
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-white inline-block" />
                <span>ACTUAL TEST</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMethod("holt_winters")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  visibleMethods.holt_winters
                    ? "border-cf-amber/60 bg-cf-amber/15 text-cf-amber font-semibold"
                    : "border-cf-line bg-cf-panel text-cf-text-faint"
                }`}
              >
                <span className="w-2.5 h-0.5 bg-cf-amber inline-block" />
                <span>HOLT-WINTERS</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMethod("seasonal_naive")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  visibleMethods.seasonal_naive
                    ? "border-[#5B9BD5]/60 bg-[#5B9BD5]/15 text-[#5B9BD5]"
                    : "border-cf-line bg-cf-panel text-cf-text-faint"
                }`}
              >
                <span className="w-2.5 h-0.5 bg-[#5B9BD5] inline-block" />
                <span>SEASONAL-NAIVE</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMethod("holt_linear")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  visibleMethods.holt_linear
                    ? "border-[#FF6B4A]/60 bg-[#FF6B4A]/15 text-[#FF6B4A]"
                    : "border-cf-line bg-cf-panel text-cf-text-faint"
                }`}
              >
                <span className="w-2.5 h-0.5 bg-[#FF6B4A] inline-block" />
                <span>HOLT LINEAR</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMethod("naive")}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  visibleMethods.naive
                    ? "border-[#9D7FE8]/60 bg-[#9D7FE8]/15 text-[#9D7FE8]"
                    : "border-cf-line bg-cf-panel text-cf-text-faint"
                }`}
              >
                <span className="w-2.5 h-0.5 bg-[#9D7FE8] inline-block" />
                <span>NAIVE</span>
              </button>
            </div>
          </div>

          <div className="relative w-full h-[380px] md:h-[440px] bg-[#090E0C] rounded-lg border-2 border-[#2E3B33] overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.85)]">
            {/* CRT Reticle & scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-30"
              style={{
                backgroundImage: "linear-gradient(rgba(18, 24, 20, 0) 50%, rgba(0, 0, 0, 0.6) 50%)",
                backgroundSize: "100% 4px",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.65) 100%)",
              }}
            />
            <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 font-mono text-[9px] text-verdigris/80 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-verdigris animate-pulse shadow-[0_0_6px_#4FA98A]" />
              <span>OSC // ENERGY LOAD TELEMETRY</span>
            </div>
            <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
            {loading && (
              <div className="absolute inset-0 z-30 bg-[#090E0C]/80 flex items-center justify-center font-mono text-sm text-amber">
                RECOMPUTING FORECAST MODELS...
              </div>
            )}
          </div>
        </section>

        {/* Algorithm Comparison Table */}
        <section className="bg-cf-panel border border-cf-line rounded-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="font-mono text-xs text-cf-amber tracking-wider uppercase block">
                BENCHMARK RESULTS // HELD-OUT TEST EVALUATION
              </span>
              <h2 className="font-heading text-xl font-semibold text-cf-text mt-1">
                Comparative Forecast Accuracy
              </h2>
            </div>
            {result?.best_method && (
              <div className="font-mono text-xs px-3 py-1 rounded border border-cf-amber/40 bg-cf-amber/10 text-cf-amber">
                OPTIMAL MODEL: <strong>{result.best_method}</strong>
              </div>
            )}
          </div>

          <p className="text-sm text-cf-text-dim mb-6 leading-relaxed">
            All accuracy metrics are evaluated against the held-out test series (not training data). 
            Lowest error scores represent superior trajectory tracking across multi-step load oscillations.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-cf-line text-cf-text-faint uppercase">
                  <th className="py-2.5 px-3">Forecast Method</th>
                  <th className="py-2.5 px-3">MAE (kW)</th>
                  <th className="py-2.5 px-3">RMSE (kW)</th>
                  <th className="py-2.5 px-3">MAPE (%)</th>
                  <th className="py-2.5 px-3">Characteristics</th>
                  <th className="py-2.5 px-3 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cf-line/50">
                {result?.methods.map((m) => {
                  const isBest = result.best_method === m.name;
                  const colorClass =
                    m.key === "holt_winters"
                      ? "text-cf-amber font-semibold"
                      : m.key === "seasonal_naive"
                      ? "text-[#5B9BD5]"
                      : m.key === "holt_linear"
                      ? "text-[#FF6B4A]"
                      : "text-[#9D7FE8]";

                  return (
                    <tr
                      key={m.key}
                      className={`hover:bg-cf-panel-2 transition-colors ${
                        isBest ? "bg-cf-amber/5" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${colorClass.split(" ")[0]}`} />
                          <span className={colorClass}>{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-cf-text">{m.mae.toFixed(2)}</td>
                      <td className="py-3 px-3 text-cf-text">{m.rmse.toFixed(2)}</td>
                      <td className="py-3 px-3 font-semibold text-cf-text">
                        {m.mape.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-cf-text-dim text-[11px] max-w-xs">
                        {m.description}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isBest ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-cf-amber/20 border border-cf-amber text-cf-amber font-semibold text-[10px]">
                            ★ BEST PERFORMER
                          </span>
                        ) : (
                          <span className="text-cf-text-faint text-[11px]">
                            {m.key === "seasonal_naive"
                              ? "Cyclic Baseline"
                              : m.key === "holt_linear"
                              ? "Divergent Trend"
                              : "Heuristic"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-cf-line text-xs font-mono text-cf-text-dim space-y-1">
            <p>
              • <strong>Why Holt-Winters Outperforms Seasonal-Naive:</strong> While Seasonal-Naive directly repeats 
              the noisy raw readings from 24 hours prior (doubling measurement error variance: $\sigma_e^2 \approx 2\sigma^2$), 
              Holt-Winters smooths the seasonal factors ($\gamma$) across multiple daily cycles, effectively filtering stochastic noise.
            </p>
            <p>
              • <strong>Why Non-Seasonal Models Fail:</strong> Plain Naive and Holt Linear lack diurnal cycle 
              decomposition, treating harmonic 24-hour demand shifts as non-existent or linear drifts, yielding 
              dramatically inflated MAPE error rates.
            </p>
          </div>
        </section>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-cf-panel border border-cf-line rounded-lg p-5">
            <label className="block font-mono text-xs text-cf-amber uppercase mb-2">
              Forecast Horizon: {horizon} Hours
            </label>
            <input
              type="range"
              min={12}
              max={48}
              step={12}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full accent-cf-amber cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-cf-text-faint mt-1">
              <span>12h</span>
              <span>24h (1 Day)</span>
              <span>36h</span>
              <span>48h (2 Days)</span>
            </div>
            <p className="text-xs text-cf-text-dim mt-3 leading-relaxed">
              Adjusts the forward prediction horizon evaluated against held-out ground truth data.
            </p>
          </div>

          <div className="bg-cf-panel border border-cf-line rounded-lg p-5">
            <label className="block font-mono text-xs text-cf-amber uppercase mb-2">
              Mean Baseline Load: {baselineKw} kW
            </label>
            <input
              type="range"
              min={250}
              max={800}
              step={25}
              value={baselineKw}
              onChange={(e) => setBaselineKw(Number(e.target.value))}
              className="w-full accent-cf-amber cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-cf-text-faint mt-1">
              <span>250 kW</span>
              <span>450 kW</span>
              <span>800 kW</span>
            </div>
            <p className="text-xs text-cf-text-dim mt-3 leading-relaxed">
              Base continuous electrical consumption of the manufacturing plant facility.
            </p>
          </div>

          <div className="bg-cf-panel border border-cf-line rounded-lg p-5">
            <label className="block font-mono text-xs text-cf-amber uppercase mb-2">
              Sensor Noise ($\sigma$): {noiseStd.toFixed(1)} kW
            </label>
            <input
              type="range"
              min={2.0}
              max={15.0}
              step={1.0}
              value={noiseStd}
              onChange={(e) => setNoiseStd(Number(e.target.value))}
              className="w-full accent-cf-amber cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-cf-text-faint mt-1">
              <span>2.0 kW (Clean)</span>
              <span>6.0 kW</span>
              <span>15.0 kW (Noisy)</span>
            </div>
            <p className="text-xs text-cf-text-dim mt-3 leading-relaxed">
              Additive stochastic process fluctuations from motor inrush and load step transients.
            </p>
          </div>
        </div>

        {/* Technical Architecture Monograph */}
        <section className="bg-cf-panel border border-cf-line rounded-lg p-6">
          <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-2">
            MATHEMATICAL SPECIFICATION // TIME-SERIES DECOMPOSITION
          </div>
          <h2 className="font-heading text-xl font-semibold text-cf-text mb-4">
            Synthetic Load Model &amp; Tri-Factor Smoothing Formulations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-cf-text-dim leading-relaxed">
            <div>
              <h3 className="font-semibold text-cf-text mb-2">Plant Load Generative Formulation</h3>
              <p className="mb-3">
                Power consumption in industrial plants follows cyclical diurnal rhythms driven by two daily operational 
                peaks (morning shift ramp at 10:00 and afternoon production peak at 18:00), combined with weekend curtailment:
              </p>
              <div className="bg-[#18150F] p-3 rounded font-mono text-xs text-cf-amber border border-cf-line mb-3">
                E(t) = Baseline + S_daily(t) + W_weekend(t) + ε_t
              </div>
              <p>
                Where $S_&#123;daily&#125;(t)$ represents the harmonic diurnal wave ($m=24$), $W_&#123;weekend&#125;$ models a -90 kW 
                load drop on Saturday/Sunday, and $\epsilon_t \sim \mathcal&#123;N&#125;(0, \sigma^2)$ is Gaussian telemetry noise.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-cf-text mb-2">Holt-Winters Additive Formulation</h3>
              <p className="mb-3">
                Triple exponential smoothing isolates three distinct process components at each hourly timestep $t$:
              </p>
              <div className="bg-[#18150F] p-3 rounded font-mono text-xs text-cf-amber border border-cf-line mb-3 space-y-1">
                <div>L_t = α·(y_t - S_&#123;t-m&#125;) + (1-α)·(L_&#123;t-1&#125; + φ·B_&#123;t-1&#125;)</div>
                <div>B_t = β·(L_t - L_&#123;t-1&#125;) + (1-β)·(φ·B_&#123;t-1&#125;)</div>
                <div>S_t = γ·(y_t - L_t) + (1-γ)·S_&#123;t-m&#125;</div>
                <div>ŷ_&#123;t+h&#125; = L_t + (∑_&#123;k=1&#125;^h φ^k)·B_t + S_&#123;t+h-m·k&#125;</div>
              </div>
              <p>
                Trend damping factor $\phi = 0.90$ prevents multi-step linear runaway, while seasonal factor $\gamma = 0.15$ 
                averages out stochastic load transients across multiple 24-hour cycles.
              </p>
            </div>
          </div>
        </section>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
