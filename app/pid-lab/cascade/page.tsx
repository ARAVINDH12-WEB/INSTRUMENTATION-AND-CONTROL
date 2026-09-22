"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CascadeCanvas from "@/components/pid-lab/CascadeCanvas";
import { simulateCascadeTankPID } from "@/lib/pid-math";

export default function CascadePidPage() {
  // Outer Loop (LIC-301 Level Master)
  const [kp1, setKp1] = useState(1.8);
  const [ki1, setKi1] = useState(0.25);
  const [kd1, setKd1] = useState(0.4);
  const [sp, setSp] = useState(50);

  // Inner Loop (FIC-301 Flow Slave)
  const [kp2, setKp2] = useState(3.0);
  const [ki2, setKi2] = useState(3.0);

  // Feedforward Block (FF-301)
  const [ffEnabled, setFfEnabled] = useState(true);
  const [ffGain, setFfGain] = useState(0.7);

  // Disturbance & Simulation settings
  const [distType, setDistType] = useState<"none" | "supply_drop" | "demand_surge" | "combined">("supply_drop");
  const [showSingleLoop, setShowSingleLoop] = useState(true);
  const [noise, setNoise] = useState(0);

  // Presets
  const applyPreset = (preset: "welltuned" | "cascade_only" | "sluggish_inner" | "aggressive") => {
    if (preset === "welltuned") {
      setKp1(1.8);
      setKi1(0.25);
      setKd1(0.4);
      setKp2(3.0);
      setKi2(3.0);
      setFfEnabled(true);
      setFfGain(0.7);
      setDistType("supply_drop");
    } else if (preset === "cascade_only") {
      setKp1(1.8);
      setKi1(0.25);
      setKd1(0.4);
      setKp2(3.0);
      setKi2(3.0);
      setFfEnabled(false);
      setFfGain(0.7);
      setDistType("demand_surge");
    } else if (preset === "sluggish_inner") {
      setKp1(1.8);
      setKi1(0.25);
      setKd1(0.4);
      setKp2(0.8);
      setKi2(0.5);
      setFfEnabled(false);
      setDistType("supply_drop");
    } else if (preset === "aggressive") {
      setKp1(3.5);
      setKi1(0.6);
      setKd1(0.1);
      setKp2(5.0);
      setKi2(6.0);
      setFfEnabled(false);
      setDistType("combined");
    }
  };

  // Run simulation
  const simulationResult = useMemo(() => {
    const isStepMode = distType === "none";
    return simulateCascadeTankPID(
      { kp: kp1, ki: ki1, kd: kd1 },
      { kp: kp2, ki: ki2 },
      sp,
      {
        initialLevel: isStepMode ? 20 : sp,
        disturbanceType: distType,
        disturbanceTimeSec: 15,
        feedforwardEnabled: ffEnabled,
        feedforwardGain: ffGain,
        noiseAmplitude: noise,
        steps: 600,
      }
    );
  }, [kp1, ki1, kd1, kp2, ki2, sp, distType, ffEnabled, ffGain, noise]);

  const cascMetrics = simulationResult.cascade.metrics;
  const singleMetrics = simulationResult.singleLoop.metrics;

  const isDisturbanceActive = distType !== "none";
  const errReductionPct =
    singleMetrics.maxDisturbanceError > 0
      ? Math.max(
          0,
          Math.round(
            ((singleMetrics.maxDisturbanceError - cascMetrics.maxDisturbanceError) /
              singleMetrics.maxDisturbanceError) *
              100
          )
        )
      : 0;

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        {/* Breadcrumb & Heading */}
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/pid-lab" className="text-amber hover:underline">
              SIMULATION SUITE
            </Link>
            <span>/</span>
            <span>MULTI-LOOP REGULATION</span>
            <span>·</span>
            <span>CASCADE &amp; FEEDFORWARD ARCHITECTURE</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Cascade &amp; Feedforward Control Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Master-slave regulatory architecture: Primary Level Controller (<span className="font-mono text-xs text-amber">LIC-301</span>) 
            computes dynamic setpoint commands for a fast inner Flow Controller (<span className="font-mono text-xs text-amber">FIC-301</span>). 
            Augmented with Feedforward (<span className="font-mono text-xs text-amber">FF-301</span>) for direct rejection of supply pressure collapse and downstream demand surge.
          </p>

          {/* Sub-nav switcher */}
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Simulator Switcher">
            <Link
              href="/pid-lab"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              CLOSED-LOOP PID
            </Link>
            <Link
              href="/pid-lab/cascade"
              className="rounded border border-amber bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-amber shadow-[0_0_8px_rgba(255,176,0,0.25)]"
            >
              ★ CASCADE &amp; FEEDFORWARD
            </Link>
            <Link
              href="/pid-lab/tank-level"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              TANK LEVEL (OPEN)
            </Link>
            <Link
              href="/pid-lab/temperature"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              TEMPERATURE
            </Link>
            <Link
              href="/pid-lab/motor"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              DC MOTOR
            </Link>
            <Link
              href="/pid-lab/first-order"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              FIRST ORDER
            </Link>
            <Link
              href="/pid-lab/second-order"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              SECOND ORDER
            </Link>
          </nav>
        </header>

        {/* Workbench Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Controls Column */}
          <aside className="rounded border border-line bg-panel p-5 space-y-6">
            {/* Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-text-dim">CONFIGURATION PRESETS</span>
                <span className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-amber">
                  ISA-5.1
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("welltuned")}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  <div className="font-semibold text-text">TUNED CASCADE + FF</div>
                  <div className="text-[10px] text-text-faint">Optimal dual rejection</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("cascade_only")}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  <div className="font-semibold text-text">CASCADE ONLY</div>
                  <div className="text-[10px] text-text-faint">FF Bypassed demo</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("sluggish_inner")}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  <div className="font-semibold text-text">SLUGGISH INNER</div>
                  <div className="text-[10px] text-text-faint">Slow flow slave loop</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("aggressive")}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  <div className="font-semibold text-text">AGGRESSIVE / RING</div>
                  <div className="text-[10px] text-text-faint">High gain oscillation</div>
                </button>
              </div>
            </div>

            {/* Disturbance Injection Modes */}
            <div className="border-t border-line-soft pt-4">
              <label className="block font-mono text-xs text-text-dim mb-2">
                DISTURBANCE SCENARIO (INJECT AT t = 15s)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDistType("supply_drop")}
                  className={`rounded border px-2 py-2 text-left font-mono text-xs transition-colors ${
                    distType === "supply_drop"
                      ? "border-amber bg-amber/10 text-amber font-semibold"
                      : "border-line bg-panel-2 text-text-dim hover:border-amber/60"
                  }`}
                >
                  <div>SUPPLY DROP</div>
                  <div className="text-[10px] opacity-75">-38% Header Pressure</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDistType("demand_surge")}
                  className={`rounded border px-2 py-2 text-left font-mono text-xs transition-colors ${
                    distType === "demand_surge"
                      ? "border-amber bg-amber/10 text-amber font-semibold"
                      : "border-line bg-panel-2 text-text-dim hover:border-amber/60"
                  }`}
                >
                  <div>DEMAND SURGE</div>
                  <div className="text-[10px] opacity-75">+20% Outflow Draw</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDistType("combined")}
                  className={`rounded border px-2 py-2 text-left font-mono text-xs transition-colors ${
                    distType === "combined"
                      ? "border-amber bg-amber/10 text-amber font-semibold"
                      : "border-line bg-panel-2 text-text-dim hover:border-amber/60"
                  }`}
                >
                  <div>COMBINED TEST</div>
                  <div className="text-[10px] opacity-75">Pressure + Demand Surge</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDistType("none")}
                  className={`rounded border px-2 py-2 text-left font-mono text-xs transition-colors ${
                    distType === "none"
                      ? "border-amber bg-amber/10 text-amber font-semibold"
                      : "border-line bg-panel-2 text-text-dim hover:border-amber/60"
                  }`}
                >
                  <div>STEP RESPONSE</div>
                  <div className="text-[10px] opacity-75">20% → 50% Clean Step</div>
                </button>
              </div>
            </div>

            {/* Outer Master Loop Controls */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text">
                  PRIMARY MASTER // LIC-301 (LEVEL)
                </span>
                <span className="font-mono text-[10px] text-amber">SLOWER LOOP</span>
              </div>

              {/* Setpoint Slider */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Level Setpoint (SP)</span>
                  <span className="text-amber font-semibold">{sp.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="1"
                  value={sp}
                  onChange={(e) => setSp(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>

              {/* Kp1 */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Master Gain (Kp1)</span>
                  <span className="text-text">{kp1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="6.0"
                  step="0.05"
                  value={kp1}
                  onChange={(e) => setKp1(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>

              {/* Ki1 */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Master Integral (Ki1)</span>
                  <span className="text-text">{ki1.toFixed(2)} /s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.02"
                  value={ki1}
                  onChange={(e) => setKi1(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>

              {/* Kd1 */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Master Derivative (Kd1)</span>
                  <span className="text-text">{kd1.toFixed(2)} s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.02"
                  value={kd1}
                  onChange={(e) => setKd1(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
            </div>

            {/* Inner Slave Loop Controls */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text">
                  SECONDARY SLAVE // FIC-301 (FLOW)
                </span>
                <span className="font-mono text-[10px] text-verdigris">FAST LOOP (τ = 0.3s)</span>
              </div>

              {/* Kp2 */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Slave Gain (Kp2)</span>
                  <span className="text-text">{kp2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="6.0"
                  step="0.1"
                  value={kp2}
                  onChange={(e) => setKp2(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>

              {/* Ki2 */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Slave Integral (Ki2)</span>
                  <span className="text-text">{ki2.toFixed(2)} /s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="8.0"
                  step="0.1"
                  value={ki2}
                  onChange={(e) => setKi2(parseFloat(e.target.value))}
                  className="w-full accent-amber"
                />
              </div>
            </div>

            {/* Feedforward Compensator */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-text">
                  FEEDFORWARD // FF-301 (DEMAND)
                </span>
                <button
                  type="button"
                  onClick={() => setFfEnabled(!ffEnabled)}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                    ffEnabled
                      ? "border-verdigris bg-verdigris/15 text-verdigris"
                      : "border-line bg-panel-2 text-text-faint"
                  }`}
                >
                  {ffEnabled ? "ENABLED" : "BYPASS"}
                </button>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Feedforward Gain (Kff)</span>
                  <span className={ffEnabled ? "text-verdigris font-semibold" : "text-text-faint"}>
                    {ffGain.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={ffGain}
                  disabled={!ffEnabled}
                  onChange={(e) => setFfGain(parseFloat(e.target.value))}
                  className="w-full accent-verdigris disabled:opacity-30"
                />
              </div>
            </div>

            {/* Comparison & Options */}
            <div className="border-t border-line-soft pt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-text-dim hover:text-text">
                <input
                  type="checkbox"
                  checked={showSingleLoop}
                  onChange={(e) => setShowSingleLoop(e.target.checked)}
                  className="rounded border-line bg-panel-2 accent-crimson"
                />
                <span>Overlay Single-Loop Baseline (LIC-101)</span>
              </label>

              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-text-dim">Sensor Noise</span>
                  <span className="text-text">{noise > 0 ? `±${noise}%` : "OFF"}</span>
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
          </aside>

          {/* Visualization & Analysis Column */}
          <div className="space-y-6">
            {/* Top Comparative KPI Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Max Disturbance Error */}
              <div className="rounded border border-line bg-panel p-3">
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Peak Disturbance Error
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-verdigris">
                    {cascMetrics.maxDisturbanceError.toFixed(2)}%
                  </span>
                  {showSingleLoop && (
                    <span className="font-mono text-xs text-crimson line-through">
                      {singleMetrics.maxDisturbanceError.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-faint">
                  {isDisturbanceActive ? (
                    errReductionPct > 0 ? (
                      <span className="text-verdigris">▼ {errReductionPct}% error reduction</span>
                    ) : (
                      "Tracking disturbance"
                    )
                  ) : (
                    "Clean step transient"
                  )}
                </div>
              </div>

              {/* Integrated Absolute Error (IAE) */}
              <div className="rounded border border-line bg-panel p-3">
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Integrated Error (IAE)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-amber">
                    {cascMetrics.iae.toFixed(1)}
                  </span>
                  {showSingleLoop && (
                    <span className="font-mono text-xs text-text-faint">
                      vs {singleMetrics.iae.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-faint">
                  Lower is tighter tracking
                </div>
              </div>

              {/* Settling Time */}
              <div className="rounded border border-line bg-panel p-3">
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Settling Time (±5%)
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-text">
                  {cascMetrics.settlingTimeSec.toFixed(1)}s
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-faint">
                  Rise: {cascMetrics.riseTimeSec !== null ? `${cascMetrics.riseTimeSec.toFixed(1)}s` : "N/A"}
                </div>
              </div>

              {/* Architecture Status */}
              <div className="rounded border border-line bg-panel p-3">
                <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Active Control Scheme
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-amber flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-verdigris animate-pulse" />
                  <span>CASCADE {ffEnabled ? "+ FF" : ""}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-dim">
                  {ffEnabled ? "Disturbance pre-cancelled" : "Feedback rejection only"}
                </div>
              </div>
            </div>

            {/* Dual High-DPI Canvas */}
            <div className="space-y-2">
              <CascadeCanvas
                result={simulationResult}
                setpoint={sp}
                showSingleLoop={showSingleLoop}
                disturbanceType={distType}
                disturbanceTimeSec={15}
                height={460}
              />

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-amber">
                    <span className="w-3 h-1 bg-amber inline-block" />
                    <span>Cascade Level (LIC-301)</span>
                  </span>
                  {showSingleLoop && (
                    <span className="flex items-center gap-1.5 text-crimson">
                      <span className="w-3 h-1 border-t-2 border-dashed border-crimson inline-block" />
                      <span>Single-Loop Baseline (LIC-101)</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-verdigris">
                    <span className="w-3 h-1 bg-verdigris inline-block" />
                    <span>Inner Inflow Q(t)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-text-faint">
                    <span className="w-3 h-1 border-t border-dashed border-text-faint inline-block" />
                    <span>Flow Setpoint (RSP)</span>
                  </span>
                </div>
                <span className="text-[10px] text-text-faint">
                  Hover canvas to inspect timestamp values
                </span>
              </div>
            </div>

            {/* P&ID System Architecture Diagram */}
            <div className="rounded border border-line bg-panel p-5">
              <div className="flex items-center justify-between border-b border-line-soft pb-3 mb-4">
                <h3 className="font-heading text-lg font-semibold text-text">
                  Industrial Topology &amp; P&amp;ID Signal Flow
                </h3>
                <span className="font-mono text-xs text-amber">ISA-5.1 STANDARD</span>
              </div>

              {/* ASCII/Block Flow Diagram */}
              <div className="rounded border border-line-soft bg-panel-2 p-4 font-mono text-xs overflow-x-auto text-text-dim">
                <pre className="leading-relaxed">
{`   [ Downstream Demand Surge ] ──(Measured Disturbance D)──┐
                                                           │
   [ Primary Setpoint: ${sp}% ]                              ▼
               │                                   ┌──────────────┐
               ▼                                   │ Feedforward  │ (FF-301)
     ┌───────────────────┐                         │  Gain: ${ffGain.toFixed(2)}  │
     │  Level Controller │                         └──────┬───────┘
     │     (LIC-301)     │──[ Level Controller Out ]───►(+) ◄── [ Feedforward Output ]
     └─────────▲─────────┘                                │
               │ (4-20mA Feedback)                        ▼ [ Remote Setpoint: RSP ]
               │                                ┌───────────────────┐
     ┌─────────┴─────────┐                      │  Flow Controller  │
     │ Level Transmitter │                      │     (FIC-301)     │
     │     (LT-301)      │                      └─────────┬─────────┘
     └─────────▲─────────┘                                │ [ 4-20mA Valve MV ]
               │                                          ▼
     ┌─────────┴─────────┐                      ┌───────────────────┐
     │   Process Tank    │◄──[ Fluid Flow Q ]───│   Control Valve   │◄── [ Upstream Supply ]
     │      (TK-301)     │                      │     (FV-301)      │    [ Pressure Dist.  ]
     └───────────────────┘                      └─────────▲─────────┘
                                                          │
                                                ┌─────────┴─────────┐
                                                │ Flow Transmitter  │
                                                │     (FT-301)      │
                                                └───────────────────┘`}
                </pre>
              </div>

              {/* Theory Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-sans text-text-dim leading-relaxed">
                <div>
                  <h4 className="font-heading text-sm font-semibold text-text mb-1">
                    Why Cascade Outperforms Single-Loop
                  </h4>
                  <p>
                    In a single-loop level system, when upstream supply pressure drops or valve non-linearities (like stiction) occur,
                    the controller cannot act until the entire tank liquid level sags. Because large liquid tanks possess significant 
                    capacitance and lag, recovery takes minutes. Cascade control wraps a fast flow slave (<span className="font-mono text-[11px] text-amber">FIC-301</span>) 
                    inside the slower level master (<span className="font-mono text-[11px] text-amber">LIC-301</span>). When header pressure collapses, 
                    the inner loop catches the flow drop in milliseconds and cranks the valve open before the tank level ever notices.
                  </p>
                </div>
                <div>
                  <h4 className="font-heading text-sm font-semibold text-text mb-1">
                    Feedforward: Acting Before the Process Deviates
                  </h4>
                  <p>
                    Feedback control is inherently reactive: an error must occur before the controller can apply corrective action. 
                    Feedforward control (<span className="font-mono text-[11px] text-verdigris">FF-301</span>) measures external load disturbances 
                    (such as downstream pumping demand) and injects an instantaneous offsetting command directly into the flow controller setpoint. 
                    When tuned with gain <span className="font-mono text-[11px] text-verdigris">Kff = 1 / Kp_valve</span>, disturbance cancellation is nearly instantaneous.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
