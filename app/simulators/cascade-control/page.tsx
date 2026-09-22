"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  simulateCascadeTank,
  simulateSingleLoopTank,
  computeMetrics,
} from "@/lib/pid-math";

export default function CascadeControlSimulatorPage() {
  // Architecture mode
  const [architecture, setArchitecture] = useState<
    "single" | "cascade" | "cascade_feedforward"
  >("cascade");

  // Process & Disturbance parameters
  const [setpoint, setpointSet] = useState(50);
  const [distMag, setDistMag] = useState(15);
  const [distTime, setDistTime] = useState(15);
  const [noise, setNoise] = useState(0);
  const [minValve, setMinValve] = useState(0);
  const [maxValve, setMaxValve] = useState(100);

  // Outer loop tuning
  const [outerKp, setOuterKp] = useState(1.8);
  const [outerKi, setOuterKi] = useState(0.25);
  const [outerKd, setOuterKd] = useState(0.4);

  // Inner loop tuning
  const [innerKp, setInnerKp] = useState(3.5);
  const [innerKi, setInnerKi] = useState(3.0);
  const [innerKd, setInnerKd] = useState(0.0);

  // Time-scale separation & Feedforward
  const [outerSteps, setOuterSteps] = useState(5);
  const [ffGain, setFfGain] = useState(1.0);

  // Visual toggles
  const [showComparison, setShowComparison] = useState(true);
  const [showFlowTrace, setShowFlowTrace] = useState(true);

  // Simulation execution
  const commonConfig = useMemo(() => {
    return {
      levelSetpoint: setpoint,
      initialLevel: setpoint,
      outerKp,
      outerKi,
      outerKd,
      innerKp,
      innerKi,
      innerKd,
      outerStepsPerInnerStep: outerSteps,
      disturbanceMagnitude: distMag,
      disturbanceStartTime: distTime,
      noiseAmplitude: noise,
      minValvePct: minValve,
      maxValvePct: maxValve,
      steps: 600,
      dt: 0.1,
    };
  }, [
    setpoint,
    outerKp,
    outerKi,
    outerKd,
    innerKp,
    innerKi,
    innerKd,
    outerSteps,
    distMag,
    distTime,
    noise,
    minValve,
    maxValve,
  ]);

  // Run the selected architecture
  const activeSim = useMemo(() => {
    if (architecture === "single") {
      return simulateSingleLoopTank(commonConfig);
    }
    return simulateCascadeTank({
      ...commonConfig,
      architecture,
      feedforwardGain: ffGain,
    });
  }, [architecture, commonConfig, ffGain]);

  // Run both architectures for the core comparison table & overlay
  const comparisonData = useMemo(() => {
    const single = simulateSingleLoopTank(commonConfig);
    const cascade = simulateCascadeTank({
      ...commonConfig,
      architecture: "cascade",
    });
    const cascadeFf = simulateCascadeTank({
      ...commonConfig,
      architecture: "cascade_feedforward",
      feedforwardGain: ffGain,
    });
    return { single, cascade, cascadeFf };
  }, [commonConfig, ffGain]);

  // Canvas drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 420;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#18150F";
    ctx.fillRect(0, 0, w, h);

    const padL = 50;
    const padR = 24;
    const padT = 28;
    const padB = 36;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    const steps = activeSim.time.length;
    const toX = (idx: number) => padL + (idx / (steps - 1)) * plotW;
    const toY = (levelVal: number) => padT + plotH - (levelVal / 100) * plotH;

    // Grid lines & labels
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6B6255";
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    [0, 25, 50, 75, 100].forEach((val) => {
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${val}%`, padL - 8, y);
    });

    // Time ticks
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let sec = 0; sec <= 60; sec += 10) {
      const idx = Math.round((sec / 60) * (steps - 1));
      const x = toX(idx);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText(`${sec}s`, x, padT + plotH + 6);
    }

    // Disturbance marker
    const distIdx = Math.round((distTime / 60) * (steps - 1));
    const distX = toX(distIdx);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#D64550";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(distX, padT);
    ctx.lineTo(distX, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#D64550";
    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(`⚡ OUTLET DISTURBANCE (+${distMag})`, distX + 6, padT + 10);
    ctx.restore();

    // Setpoint dashed line
    const spY = toY(setpoint);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255, 176, 0, 0.4)";
    ctx.beginPath();
    ctx.moveTo(padL, spY);
    ctx.lineTo(padL + plotW, spY);
    ctx.stroke();
    ctx.restore();

    // Flow / Disturbance secondary traces (if toggled)
    if (showFlowTrace) {
      // Outflow disturbance (dashed red)
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "rgba(214, 69, 80, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = toX(i);
        const y = toY(activeSim.qOut[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Inlet Flow Q_in (muted verdigris)
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(79, 169, 138, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = toX(i);
        const y = toY(activeSim.qIn[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Comparison overlay: Single-Loop baseline (if in cascade/FF mode and comparison toggled)
    if (showComparison && architecture !== "single") {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#D64550";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = toX(i);
        const y = toY(comparisonData.single.level[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Primary Active Architecture Level Trace (Bright Amber with subtle glow)
    ctx.save();
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(255, 176, 0, 0.35)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = toX(i);
      const y = toY(activeSim.level[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [
    activeSim,
    setpoint,
    distTime,
    distMag,
    showComparison,
    showFlowTrace,
    architecture,
    comparisonData,
  ]);

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        {/* Header */}
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/pid-lab" className="text-amber hover:underline">
              SIMULATION SUITE
            </Link>
            <span>/</span>
            <span>MODULAR ARCHITECTURE</span>
            <span>·</span>
            <span>CASCADE &amp; FEEDFORWARD BENCHMARK</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Cascade &amp; Feedforward Control Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Vertical slice engineering testbench comparing Single-Loop PID against dual-rate Cascade control and Feedforward compensation under identical load disturbances.
          </p>
        </header>

        {/* Workbench Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Controls Column */}
          <aside className="rounded border border-line bg-panel p-5 space-y-6">
            {/* Architecture Selector */}
            <div>
              <label className="block font-mono text-xs text-text-dim mb-2">
                CONTROL ARCHITECTURE
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: "single", label: "Single-Loop" },
                    { id: "cascade", label: "Cascade" },
                    { id: "cascade_feedforward", label: "Cascade+FF" },
                  ] as const
                ).map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setArchitecture(arch.id)}
                    className={`rounded border px-2 py-2 text-center font-mono text-xs transition-colors ${
                      architecture === arch.id
                        ? "border-amber bg-amber/10 text-amber font-semibold"
                        : "border-line bg-panel-2 text-text-dim hover:border-amber/60"
                    }`}
                  >
                    {arch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Setpoint Slider */}
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-text-dim">Tank Level Setpoint (SP)</span>
                <span className="text-amber font-semibold">{setpoint}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={setpoint}
                onChange={(e) => setpointSet(parseFloat(e.target.value))}
                className="w-full accent-amber"
              />
            </div>

            {/* Time-Scale Separation Slider */}
            <div className="border-t border-line-soft pt-4">
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-text-dim">Time-Scale Separation</span>
                <span className="text-verdigris font-semibold">{outerSteps}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={outerSteps}
                disabled={architecture === "single"}
                onChange={(e) => setOuterSteps(parseInt(e.target.value, 10))}
                className="w-full accent-verdigris disabled:opacity-30"
              />
              <p className="mt-1 font-mono text-[10px] text-text-faint leading-relaxed">
                outerStepsPerInnerStep: how much faster the inner flow loop responds than the outer level loop (default: 5).
              </p>
            </div>

            {/* Feedforward Gain Slider with Required Visible Caveat Label */}
            <div className="border-t border-line-soft pt-4">
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-text-dim">Feedforward Gain (Kff)</span>
                <span className={architecture === "cascade_feedforward" ? "text-verdigris font-semibold" : "text-text-faint"}>
                  {ffGain.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={ffGain}
                disabled={architecture !== "cascade_feedforward"}
                onChange={(e) => setFfGain(parseFloat(e.target.value))}
                className="w-full accent-verdigris disabled:opacity-30"
              />
              {/* Labeled Caveat */}
              <div className="mt-2 rounded border border-amber/30 bg-amber/5 p-2 font-mono text-[10px] text-amber leading-snug">
                <span className="font-bold">KNOWN LIMITATION:</span> Simplified 1:1 compensation — assumes no transport delay between disturbance and correction. Real feedforward usually needs lead-lag compensation.
              </div>
            </div>

            {/* Outer Loop Gains */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <div className="font-mono text-xs font-semibold text-text">
                {architecture === "single" ? "PRIMARY LEVEL PID GAINS" : "OUTER LEVEL LOOP (LIC-301)"}
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Outer Kp</span>
                  <span className="text-text">{outerKp.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5.0"
                  step="0.1"
                  value={outerKp}
                  onChange={(e) => setOuterKp(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Outer Ki</span>
                  <span className="text-text">{outerKi.toFixed(2)} /s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={outerKi}
                  onChange={(e) => setOuterKi(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Outer Kd</span>
                  <span className="text-text">{outerKd.toFixed(2)} s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={outerKd}
                  onChange={(e) => setOuterKd(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
            </div>

            {/* Inner Loop Gains */}
            {architecture !== "single" && (
              <div className="border-t border-line-soft pt-4 space-y-3">
                <div className="font-mono text-xs font-semibold text-text">
                  INNER FLOW LOOP (FIC-301)
                </div>
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-text-dim">Inner Kp</span>
                    <span className="text-text">{innerKp.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={innerKp}
                    onChange={(e) => setInnerKp(parseFloat(e.target.value))}
                    className="w-full accent-amber"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-text-dim">Inner Ki</span>
                    <span className="text-text">{innerKi.toFixed(2)} /s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={innerKi}
                    onChange={(e) => setInnerKi(parseFloat(e.target.value))}
                    className="w-full accent-amber"
                  />
                </div>
              </div>
            )}

            {/* Disturbance & Physical Hardware Settings */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <div className="font-mono text-xs font-semibold text-text">
                DISTURBANCE &amp; VALVE LIMITS
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Disturbance Outflow</span>
                  <span className="text-crimson font-semibold">+{distMag}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={distMag}
                  onChange={(e) => setDistMag(parseFloat(e.target.value))}
                  className="w-full accent-crimson"
                />
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Disturbance Start Time</span>
                  <span className="text-text">{distTime}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={distTime}
                  onChange={(e) => setDistTime(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Sensor Noise</span>
                  <span className="text-text">{noise > 0 ? `±${noise}` : "OFF"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={noise}
                  onChange={(e) => setNoise(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
            </div>

            {/* Visual Toggles */}
            <div className="border-t border-line-soft pt-4 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-text-dim hover:text-text">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="rounded border-line bg-panel-2 accent-crimson"
                />
                <span>Overlay Single-Loop Baseline Trace</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-text-dim hover:text-text">
                <input
                  type="checkbox"
                  checked={showFlowTrace}
                  onChange={(e) => setShowFlowTrace(e.target.checked)}
                  className="rounded border-line bg-panel-2 accent-verdigris"
                />
                <span>Show Flow Traces (q_in / q_out)</span>
              </label>
            </div>
          </aside>

          {/* Visualization & Core Comparison Deliverable */}
          <div className="space-y-6">
            {/* Live Chart */}
            <div className="rounded border border-line bg-panel p-4 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-text-dim">
                <span className="font-semibold text-text uppercase">
                  ACTIVE: {architecture.replace("_", " + ").toUpperCase()}
                </span>
                <span className="text-[10px] text-text-faint">
                  Horizon: 60 seconds (dt = 0.1s)
                </span>
              </div>

              <div className="relative w-full rounded border border-line bg-panel-2 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full block"
                  style={{ height: "420px" }}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-amber">
                    <span className="w-3 h-1 bg-amber inline-block" />
                    <span>Active Response ({architecture.toUpperCase()})</span>
                  </span>
                  {showComparison && architecture !== "single" && (
                    <span className="flex items-center gap-1.5 text-crimson">
                      <span className="w-3 h-1 border-t-2 border-dashed border-crimson inline-block" />
                      <span>Single-Loop Baseline</span>
                    </span>
                  )}
                  {showFlowTrace && (
                    <>
                      <span className="flex items-center gap-1.5 text-verdigris">
                        <span className="w-3 h-1 bg-verdigris/50 inline-block" />
                        <span>Inflow (q_in)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-crimson/70">
                        <span className="w-3 h-1 border-t border-dashed border-crimson/50 inline-block" />
                        <span>Outflow (q_out)</span>
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-text-faint">
                  Setpoint: {setpoint}%
                </span>
              </div>
            </div>

            {/* Core Deliverable: Side-by-Side Metrics Table (IAE, ISE, ITAE, Overshoot, Settling) */}
            <div className="rounded border border-line bg-panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line-soft pb-3">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-text">
                    Architectural Performance Comparison
                  </h2>
                  <p className="font-sans text-xs text-text-dim">
                    Evaluation under identical outlet disturbance (+{distMag} at t = {distTime}s).
                  </p>
                </div>
                <span className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs text-amber">
                  MULTI-CRITERIA METRICS
                </span>
              </div>

              {/* Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-line text-text-dim">
                      <th className="py-2.5 px-3">Architecture</th>
                      <th className="py-2.5 px-3" title="Integrated Absolute Error (all errors equally weighted)">IAE</th>
                      <th className="py-2.5 px-3" title="Integrated Squared Error (penalizes large transients heavily)">ISE</th>
                      <th className="py-2.5 px-3" title="Integrated Time-weighted Absolute Error (penalizes long-duration deviations)">ITAE</th>
                      <th className="py-2.5 px-3">Overshoot</th>
                      <th className="py-2.5 px-3">Settling Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft text-text">
                    <tr className={architecture === "single" ? "bg-amber/5 font-semibold" : ""}>
                      <td className="py-2.5 px-3 text-crimson">Single-Loop PID</td>
                      <td className="py-2.5 px-3">{comparisonData.single.metrics.iae}</td>
                      <td className="py-2.5 px-3 font-semibold text-crimson">{comparisonData.single.metrics.ise}</td>
                      <td className="py-2.5 px-3">{comparisonData.single.metrics.itae}</td>
                      <td className="py-2.5 px-3">{comparisonData.single.metrics.overshootPct.toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{comparisonData.single.metrics.settlingTimeSec.toFixed(1)}s</td>
                    </tr>
                    <tr className={architecture === "cascade" ? "bg-amber/5 font-semibold" : ""}>
                      <td className="py-2.5 px-3 text-amber">Cascade (Dual-Loop)</td>
                      <td className="py-2.5 px-3">{comparisonData.cascade.metrics.iae}</td>
                      <td className="py-2.5 px-3 font-semibold text-amber">{comparisonData.cascade.metrics.ise}</td>
                      <td className="py-2.5 px-3">{comparisonData.cascade.metrics.itae}</td>
                      <td className="py-2.5 px-3">{comparisonData.cascade.metrics.overshootPct.toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{comparisonData.cascade.metrics.settlingTimeSec.toFixed(1)}s</td>
                    </tr>
                    <tr className={architecture === "cascade_feedforward" ? "bg-amber/5 font-semibold" : ""}>
                      <td className="py-2.5 px-3 text-verdigris">Cascade + Feedforward</td>
                      <td className="py-2.5 px-3 font-semibold text-verdigris">{comparisonData.cascadeFf.metrics.iae}</td>
                      <td className="py-2.5 px-3 font-semibold text-verdigris">{comparisonData.cascadeFf.metrics.ise}</td>
                      <td className="py-2.5 px-3 font-semibold text-verdigris">{comparisonData.cascadeFf.metrics.itae}</td>
                      <td className="py-2.5 px-3">{comparisonData.cascadeFf.metrics.overshootPct.toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{comparisonData.cascadeFf.metrics.settlingTimeSec.toFixed(1)}s</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Engineering Takeaways */}
              <div className="mt-4 rounded border border-line-soft bg-panel-2 p-3 font-sans text-xs text-text-dim leading-relaxed space-y-2">
                <div className="font-heading font-semibold text-text text-sm">
                  Why Multi-Criteria Metrics Matter (IAE vs ISE vs ITAE)
                </div>
                <p>
                  <strong>IAE (Integrated Absolute Error):</strong> Treats all errors linearly regardless of time or size. Because both single-loop and cascade must accumulate water mass to overcome an outlet step, their raw linear IAE can appear similar if only evaluated over the long settling tail.
                </p>
                <p>
                  <strong>ISE (Integrated Squared Error):</strong> Strongly penalizes large transient excursions ($e^2$). Notice that Cascade achieves a lower ISE because the inner flow loop rapidly accelerates valve opening, preventing the tank level from sagging as deeply as single-loop control.
                </p>
                <p>
                  <strong>ITAE (Time-weighted Error):</strong> Multiplies error by elapsed time ($t \cdot |e|$), heavily penalizing sluggish settling. With Feedforward active, disturbance rejection happens almost instantaneously, dropping ITAE from ~1300 down to under 70.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
