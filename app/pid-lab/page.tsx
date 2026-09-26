"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import PatchCableSelector from "@/components/pid-lab/PatchCableSelector";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import {
  simulateTankPID,
  simulateTemperature,
  simulateMotorPID,
  simulateSecondOrderPID,
  simulateMultiTank,
  simulateHeatExchanger,
  computeMetrics,
  calculateMetrics,
} from "@/lib/pid-math";

type LabMode = "single" | "compare";

export default function PidLabPage() {
  const [mode, setMode] = useState<LabMode>("single");

  // Single Controller State
  const [kp, setKp] = useState(2.1);
  const [ki, setKi] = useState(0.35);
  const [kd, setKd] = useState(0.1);
  const [sp, setSp] = useState(50);
  const [noise, setNoise] = useState(0);

  // Compare Mode State (Default: P-only vs PI Steady-State Offset demonstration)
  const [kpA, setKpA] = useState(3.0);
  const [kiA, setKiA] = useState(0.0);
  const [kdA, setKdA] = useState(0.0);
  const [spA, setSpA] = useState(50);
  const [showA, setShowA] = useState(true);

  const [kpB, setKpB] = useState(3.0);
  const [kiB, setKiB] = useState(0.35);
  const [kdB, setKdB] = useState(0.0);
  const [spB, setSpB] = useState(50);
  const [showB, setShowB] = useState(true);

  const [noiseCompare, setNoiseCompare] = useState(0);
  const [activeSimId, setActiveSimId] = useState<string>("tank-level");

  // Single Controller Presets
  const presets = {
    sluggish: { kp: 1.0, ki: 0.1, kd: 0.0, sp: 50 },
    aggressive: { kp: 6.0, ki: 1.2, kd: 0.0, sp: 50 },
    welltuned: { kp: 2.1, ki: 0.35, kd: 0.1, sp: 50 },
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    const p = presets[presetName];
    setKp(p.kp);
    setKi(p.ki);
    setKd(p.kd);
    setSp(p.sp);
  };

  // Compare Mode Preset Pairs
  interface ComparePreset {
    id: string;
    label: string;
    explanation: string;
    ctrlA: { kp: number; ki: number; kd: number; sp: number };
    ctrlB: { kp: number; ki: number; kd: number; sp: number };
  }

  const comparePresets: ComparePreset[] = [
    {
      id: "offset-elimination",
      label: "Steady-State Offset: P-only vs PI",
      explanation:
        "Controller A runs P-only (Ki=0), leaving a permanent -4.55% droop (final level 45.45%) because proportional action alone cannot overcome continuous gravity drainage. Controller B adds integral action (Ki=0.35), successfully eliminating steady-state offset and converging to 50.0%.",
      ctrlA: { kp: 3.0, ki: 0.0, kd: 0.0, sp: 50 },
      ctrlB: { kp: 3.0, ki: 0.35, kd: 0.0, sp: 50 },
    },
    {
      id: "aggressive-vs-conservative",
      label: "Aggressive vs Conservative Tuning",
      explanation:
        "Pairs sluggish conservative tuning (A: Kp=1.0, Ki=0.1) against high-gain aggressive control (B: Kp=6.0, Ki=1.2). Controller B achieves 3x faster rise time (6.9s vs 20.4s) and 55% lower ISE, but suffers a 25.0% overshoot penalty and prolonged ringing.",
      ctrlA: { kp: 1.0, ki: 0.1, kd: 0.0, sp: 50 },
      ctrlB: { kp: 6.0, ki: 1.2, kd: 0.0, sp: 50 },
    },
    {
      id: "ki-effect",
      label: "Effect of Ki: Damped vs Oscillatory Ringing",
      explanation:
        "Same Kp=2.5 and Kd=0.05, comparing low Ki=0.08 against high Ki=0.70. Controller A settles monotonically within 20s with only 3.1% overshoot, whereas Controller B produces 23.9% overshoot and rings for over 56s before entering the ±5% band.",
      ctrlA: { kp: 2.5, ki: 0.08, kd: 0.05, sp: 50 },
      ctrlB: { kp: 2.5, ki: 0.70, kd: 0.05, sp: 50 },
    },
    {
      id: "kd-lag-free-teaching",
      label: "Kd on Lag-Free Plant (Teaching Case)",
      explanation:
        "Sets Kd=0 vs Kd=0.3 on identical Kp=2.1, Ki=0.35. In an ideal first-order tank without actuator delay (tau_v=0), open-loop phase lag is strictly 90°, so derivative action cannot increase damping. Overshoot remains virtually identical (18.95% vs 18.97%). See /pid-lab/cascade where actuator lag allows Kd to reduce overshoot by 3.54%.",
      ctrlA: { kp: 2.1, ki: 0.35, kd: 0.0, sp: 50 },
      ctrlB: { kp: 2.1, ki: 0.35, kd: 0.3, sp: 50 },
    },
  ];

  const applyComparePreset = (preset: ComparePreset) => {
    setKpA(preset.ctrlA.kp);
    setKiA(preset.ctrlA.ki);
    setKdA(preset.ctrlA.kd);
    setSpA(preset.ctrlA.sp);

    setKpB(preset.ctrlB.kp);
    setKiB(preset.ctrlB.ki);
    setKdB(preset.ctrlB.kd);
    setSpB(preset.ctrlB.sp);
  };

  // Single Controller Simulation Math
  const simulationData = useMemo(() => {
    return simulateTankPID(kp, ki, kd, sp, { noiseAmplitude: noise });
  }, [kp, ki, kd, sp, noise]);

  const metrics = useMemo(() => {
    return computeMetrics(simulationData, sp);
  }, [simulationData, sp]);

  const finalLevel = simulationData[simulationData.length - 1] ?? sp;

  const overshootColor =
    metrics.overshootPct > 15
      ? "text-crimson"
      : metrics.overshootPct < 3
      ? "text-verdigris"
      : "text-amber";

  const curveColor =
    metrics.overshootPct > 15
      ? "#D64550"
      : metrics.overshootPct < 3 && metrics.settlingTimeSec < 45
      ? "#4FA98A"
      : "#FFB000";

  // Multi-Process Model Specification Dictionary for Compare Mode
  const PROCESS_MODELS: Record<
    string,
    {
      id: string;
      name: string;
      accent: string;
      unit: string;
      minY: number;
      maxY: number;
      totalTime: number;
      dt: number;
      conditionsTitle: string;
      conditionsDesc: string;
      simulate: (kp: number, ki: number, kd: number, sp: number, noise: number) => number[];
    }
  > = {
    "tank-level": {
      id: "tank-level",
      name: "Tank Level",
      accent: "#FFB000",
      unit: "%",
      minY: 0,
      maxY: 100,
      totalTime: 60,
      dt: 0.1,
      conditionsTitle: "DISCRETE GRAVITY TANK DYNAMICS",
      conditionsDesc:
        "Model: Discrete Gravity Tank · dt = 0.1s · 600 Steps (60.0s Horizon) · Initial Level = 20.0% · Outflow Base = 0.60 · Valve Gain = 0.02",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateTankPID(kp, ki, kd, sp, { noiseAmplitude: noise, steps: 600, dt: 0.1 }),
    },
    temperature: {
      id: "temperature",
      name: "Temperature Chamber",
      accent: "#FF6B4A",
      unit: "°C",
      minY: 20,
      maxY: 120,
      totalTime: 60,
      dt: 0.1,
      conditionsTitle: "THERMAL CHAMBER ASYMMETRIC DISSIPATION",
      conditionsDesc:
        "Model: Asymmetric Electric Heating & Ambient Dissipation · Tamb = 25.0°C · dt = 0.1s · 600 Steps (60.0s Horizon) · Thermal Mass = 50 · Loss Coeff = 0.05",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateTemperature(kp, ki, kd, sp, 25, { noiseAmplitude: noise, steps: 600, dt: 0.1 }),
    },
    motor: {
      id: "motor",
      name: "DC Motor Velocity",
      accent: "#5B9BD5",
      unit: "rad/s",
      minY: 0,
      maxY: 120,
      totalTime: 60,
      dt: 0.1,
      conditionsTitle: "DC MOTOR ELECTROMECHANICAL SERVO",
      conditionsDesc:
        "Model: Permanent Magnet DC Rotor Servo · dt = 0.1s · 600 Steps (60.0s Horizon) · Rotor Inertia J = 0.025 kg·m² · Friction B = 0.08 N·s",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateMotorPID(kp, ki, kd, sp, { noiseAmplitude: noise, steps: 600, dt: 0.1 }),
    },
    "second-order": {
      id: "second-order",
      name: "Second-Order Resonant Plant",
      accent: "#9D7FE8",
      unit: "mm",
      minY: 0,
      maxY: 100,
      totalTime: 60,
      dt: 0.1,
      conditionsTitle: "UNDERDAMPED HARMONIC RESONANCE PLANT",
      conditionsDesc:
        "Model: Closed-Loop Second-Order Plant · dt = 0.1s · 600 Steps (60.0s Horizon) · Natural Freq ωn = 1.5 rad/s · Plant Damping ζ = 0.28",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateSecondOrderPID(kp, ki, kd, sp, { noiseAmplitude: noise, steps: 600, dt: 0.1 }),
    },
    "multi-tank": {
      id: "multi-tank",
      name: "Multi-Tank Interacting",
      accent: "#2DD4BF",
      unit: "%",
      minY: 0,
      maxY: 100,
      totalTime: 80,
      dt: 0.1,
      conditionsTitle: "TWO-TANK INTERACTING GRAVITY COUPLING",
      conditionsDesc:
        "Model: Two Tanks in Series with Gravity Head Coupling · Area1 = Area2 = 1.0 m² · R1 = R2 = 1.5 · dt = 0.1s · 800 Steps (80.0s Horizon) · Initial Level = 20.0%",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateMultiTank(kp, ki, kd, sp, { steps: 800, dt: 0.1, noiseAmplitude: noise } as any).map((d) => d.h2),
    },
    "heat-exchanger": {
      id: "heat-exchanger",
      name: "Heat Exchanger (Delay)",
      accent: "#FF6B4A",
      unit: "°C",
      minY: 20,
      maxY: 100,
      totalTime: 80,
      dt: 0.1,
      conditionsTitle: "COUNTER-CURRENT HEAT EXCHANGER WITH TRANSPORT DELAY",
      conditionsDesc:
        "Model: Shell-and-Tube Exchanger with 3.0s Dead Time · dt = 0.1s · 800 Steps (80.0s Horizon) · Cold In = 20.0°C · Hot Source = 95.0°C · UA = 1.0 · Cth = 12 · Cold Flow = 0.50",
      simulate: (kp, ki, kd, sp, noise) =>
        simulateHeatExchanger(kp, ki, kd, sp, { steps: 800, dt: 0.1, deadTimeSeconds: 3.0 }),
    },
  };

  const currentModel = PROCESS_MODELS[activeSimId] || PROCESS_MODELS["tank-level"];

  // Compare Mode Simulation Math (Dynamically re-evaluated against the active process model)
  const simDataA = useMemo(() => {
    return currentModel.simulate(kpA, kiA, kdA, spA, noiseCompare);
  }, [currentModel, kpA, kiA, kdA, spA, noiseCompare]);

  const simDataB = useMemo(() => {
    return currentModel.simulate(kpB, kiB, kdB, spB, noiseCompare);
  }, [currentModel, kpB, kiB, kdB, spB, noiseCompare]);

  const metricsA = useMemo(() => computeMetrics(simDataA, spA), [simDataA, spA]);
  const metricsB = useMemo(() => computeMetrics(simDataB, spB), [simDataB, spB]);

  const integralMetricsA = useMemo(() => {
    const errorSeries = simDataA.map((v) => spA - v);
    return calculateMetrics(errorSeries, currentModel.dt);
  }, [simDataA, spA, currentModel.dt]);

  const integralMetricsB = useMemo(() => {
    const errorSeries = simDataB.map((v) => spB - v);
    return calculateMetrics(errorSeries, currentModel.dt);
  }, [simDataB, spB, currentModel.dt]);

  // Comparison helper: determine which controller is superior per metric
  const evaluateWinner = (valA: number | null, valB: number | null, lowerIsBetter = true) => {
    if (valA === null && valB === null) return "tied";
    if (valA === null) return "B";
    if (valB === null) return "A";
    const diff = valA - valB;
    if (Math.abs(diff) < 0.05) return "tied";
    if (lowerIsBetter) {
      return diff < 0 ? "A" : "B";
    }
    return diff > 0 ? "A" : "B";
  };

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <header className="mb-6 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 font-semibold text-amber">
              <span className="h-2 w-2 rounded-full bg-amber" />
              <span>SIMULATOR // ACTIVE LOOP</span>
            </span>
            <span className="text-text-faint">·</span>
            <span className="text-text-dim">DISCRETE TANK-LEVEL PROCESS</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            PID Controller Simulation Testbench
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Tune proportional (Kp), integral (Ki), and derivative (Kd) gains in real-time. 
            Observe step response dynamics, rise time, overshoot penalties, settling time, and 
            integral error metrics over a 60-second horizon.
          </p>

          {/* Sub-nav switcher */}
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Simulator Switcher">
            <Link
              href="/pid-lab"
              className="rounded border border-amber bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-amber shadow-[0_0_8px_rgba(255,176,0,0.2)]"
            >
              ★ CLOSED-LOOP PID
            </Link>
            <Link
              href="/pid-lab/cascade"
              className="rounded border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
            >
              CASCADE &amp; FEEDFORWARD
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

        {/* Mode Switcher */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-panel p-3">
          <div className="flex items-center gap-2 font-mono text-xs text-text-dim">
            <span className="text-amber font-semibold">TESTBENCH MODE //</span>
            <span>Select single-controller tuning or dual-controller comparison:</span>
          </div>
          <div className="inline-flex rounded border border-line bg-panel-2 p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`rounded px-3.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                mode === "single"
                  ? "border border-amber bg-amber/15 text-amber shadow-[0_0_8px_rgba(255,176,0,0.25)]"
                  : "text-text-dim hover:text-text border border-transparent"
              }`}
            >
              SINGLE CONTROLLER
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={`rounded px-3.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                mode === "compare"
                  ? "border border-verdigris bg-verdigris/15 text-verdigris shadow-[0_0_8px_rgba(79,169,138,0.25)]"
                  : "text-text-dim hover:text-text border border-transparent"
              }`}
            >
              COMPARE TWO CONTROLLERS (A vs B)
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MODE 1: SINGLE CONTROLLER (BENCHMARK INSTRUMENT PANEL)               */}
        {/* ==================================================================== */}
        {mode === "single" && (
          <InstrumentPanel className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#302B22] pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_8px_#FFB000] animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-amber uppercase tracking-wider">
                    SINGLE CONTROLLER TESTBENCH // TANK PROCESS
                  </span>
                </div>
                <h2 className="font-panel-heading text-xl md:text-2xl font-bold text-text tracking-tight">
                  Single Loop PID Synthesis &amp; Response Tuning
                </h2>
                <p className="font-panel-body text-xs text-text-dim mt-1 max-w-2xl leading-relaxed">
                  Tactile rotary actuators with click-to-type precision override, authentic phosphor CRT persistence decay, and comprehensive transient metrics.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end font-mono text-[10px] text-text-faint">
                  <span>LOOP: FEEDBACK CLOSED</span>
                  <span>PLANT: GRAVITY TANK</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-amber shadow-[0_0_8px_#FFB000]" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
              {/* Left Controls */}
              <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
                {/* Presets */}
                <div className="mb-6 border-b border-[#26211A] pb-4">
                  <label className="flex items-center justify-between font-mono text-xs text-text-dim mb-2.5">
                    <span>TUNING PRESETS</span>
                    <span className="rounded border border-[#302B22] bg-[#100E0B] px-1.5 py-0.5 text-[10px]">SELECT</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("sluggish")}
                      className="rounded border border-[#2B251D] bg-[#12100C] px-2 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                    >
                      SLUGGISH
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("aggressive")}
                      className="rounded border border-[#2B251D] bg-[#12100C] px-2 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                    >
                      AGGRESSIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("welltuned")}
                      className="rounded border border-amber/60 bg-amber/10 px-2 py-1.5 font-mono text-xs font-semibold text-amber shadow-[0_0_8px_rgba(255,176,0,0.2)]"
                    >
                      WELL-TUNED
                    </button>
                  </div>
                </div>

                {/* Rotary Knob Bank */}
                <div className="grid grid-cols-2 gap-4 justify-items-center py-1">
                  <RotaryKnob
                    label="PROP GAIN (Kp)"
                    value={kp}
                    min={0}
                    max={10}
                    step={0.1}
                    precision={1}
                    onChange={setKp}
                    accentColor="#FFB000"
                  />

                  <RotaryKnob
                    label="INTEGRAL (Ki)"
                    value={ki}
                    min={0}
                    max={3}
                    step={0.05}
                    precision={2}
                    onChange={setKi}
                    accentColor="#FFB000"
                  />

                  <RotaryKnob
                    label="DERIVATIVE (Kd)"
                    value={kd}
                    min={0}
                    max={1}
                    step={0.01}
                    precision={2}
                    onChange={setKd}
                    accentColor="#FFB000"
                  />

                  <RotaryKnob
                    label="SETPOINT (SP)"
                    value={sp}
                    min={10}
                    max={90}
                    step={1}
                    precision={0}
                    unit="%"
                    onChange={setSp}
                    accentColor="#FFB000"
                  />
                </div>

                {/* Sensor Noise Knob */}
                <div className="border-t border-[#26211A] pt-4 mt-4 flex flex-col items-center">
                  <RotaryKnob
                    label="SENSOR NOISE"
                    value={noise}
                    min={0}
                    max={1.5}
                    step={0.25}
                    precision={2}
                    unit="%"
                    onChange={setNoise}
                    accentColor="#FFB000"
                  />
                </div>
              </aside>

              {/* Right Main Chart & Readouts */}
              <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#26211A] pb-3">
                  <div>
                    <h3 className="font-panel-heading text-lg font-bold text-text">
                      Process Response Dynamics
                    </h3>
                    <div className="font-mono text-[11px] text-text-faint">
                      SOLVER: EULER DISCRETE (dt = 0.1s, 600 STEPS = 60s)
                    </div>
                  </div>
                  <div className="flex gap-4 font-mono text-xs">
                    <span className="text-text-dim">--- SETPOINT ({sp}%)</span>
                    <span style={{ color: curveColor }} className="font-semibold">
                      — PV (LEVEL: {finalLevel.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <OscilloscopeCanvas
                  data={simulationData}
                  setpoint={sp}
                  minY={0}
                  maxY={100}
                  unit="%"
                  totalTime={60}
                  dt={0.1}
                  color={curveColor}
                  showSecondary={false}
                  height={380}
                />

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#26211A] border border-[#302B22] rounded overflow-hidden">
                  <div className="bg-[#100E0B] p-4 flex flex-col gap-1 shadow-inner">
                    <span className="font-mono text-[11px] text-text-faint">OVERSHOOT (OS%)</span>
                    <span className={`font-mono text-2xl font-bold ${overshootColor}`}>
                      {metrics.overshootPct.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[10px]">
                      {metrics.overshootPct > 15 ? (
                        <span className="text-crimson">POOR TUNING</span>
                      ) : metrics.overshootPct < 3 ? (
                        <span className="text-verdigris">OPTIMAL TUNING</span>
                      ) : (
                        <span className="text-amber">ACCEPTABLE</span>
                      )}
                    </span>
                  </div>

                  <div className="bg-[#100E0B] p-4 flex flex-col gap-1 shadow-inner">
                    <span className="font-mono text-[11px] text-text-faint">RISE TIME (tr to 90%)</span>
                    <span className="font-mono text-2xl font-bold text-text">
                      {metrics.riseTimeSec !== null ? `${metrics.riseTimeSec.toFixed(1)}s` : "N/A"}
                    </span>
                    <span className="font-mono text-[10px] text-text-faint">TARGET SPEED</span>
                  </div>

                  <div className="bg-[#100E0B] p-4 flex flex-col gap-1 shadow-inner">
                    <span className="font-mono text-[11px] text-text-faint">SETTLING TIME (ts)</span>
                    <span className="font-mono text-2xl font-bold text-text">
                      {metrics.settlingTimeSec.toFixed(1)}s
                    </span>
                    <span className="font-mono text-[10px] text-text-faint">BAND: ±5% SP</span>
                  </div>

                  <div className="bg-[#100E0B] p-4 flex flex-col gap-1 shadow-inner">
                    <span className="font-mono text-[11px] text-text-faint">FINAL LEVEL (60s)</span>
                    <span className="font-mono text-2xl font-bold text-text">
                      {finalLevel.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[10px] text-text-faint">STEADY STATE</span>
                  </div>
                </div>

                {/* Formula Block */}
                <div className="rounded border-l-4 border-amber border-t border-r border-b border-[#2B251D] bg-[#100E0B] p-4 font-mono text-xs shadow-inner">
                  <div className="border-b border-dashed border-[#241F18] pb-2 mb-2">
                    <span className="text-text-faint mr-2">[1]</span>
                    <span className="text-text">Error: e[k] = Setpoint - Level[k]</span>
                  </div>
                  <div className="border-b border-dashed border-[#241F18] pb-2 mb-2">
                    <span className="text-text-faint mr-2">[2]</span>
                    <span className="text-text">
                      PID Controller: u[k] = clamp(Kp·e + Ki·∫e·dt + Kd·de/dt, 0, 100)%
                    </span>
                  </div>
                  <div>
                    <span className="text-text-faint mr-2">[3]</span>
                    <span className="text-text">
                      Mass Balance: Level[k+1] = clamp(Level[k] + (Inflow - Outflow)·dt·2, 0, 100)%
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </InstrumentPanel>
        )}

        {/* ==================================================================== */}
        {/* MODE 2: COMPARE TWO CONTROLLERS (A vs B) - INSTRUMENT PANEL           */}
        {/* ==================================================================== */}
        {mode === "compare" && (
          <InstrumentPanel className="flex flex-col gap-6">
            {/* Top Instrument Console Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#302B22] pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_8px_#FFB000] animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-amber uppercase tracking-wider">
                    DUAL-CONTROLLER INSTRUMENT CONSOLE // BENCHMARK BAY
                  </span>
                </div>
                <h2 className="font-panel-heading text-xl md:text-2xl font-bold text-text tracking-tight">
                  Parallel Process Control &amp; Dynamic Benchmark
                </h2>
                <p className="font-panel-body text-xs text-text-dim mt-1 max-w-2xl leading-relaxed">
                  Tactile rotary actuators with click-to-type precision override, authentic phosphor CRT persistence decay, and signal-bus routing matrix across the simulation suite.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end font-mono text-[10px] text-text-faint">
                  <span>STATUS: ARMED // ONLINE</span>
                  <span>CHASSIS: ANODIZED GRAPHITE</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-verdigris shadow-[0_0_8px_#4FA98A]" />
              </div>
            </div>

            {/* Patch-Cable Simulator Routing Matrix */}
            <PatchCableSelector
              activeSimId={activeSimId}
              onSelectSim={(simId) => setActiveSimId(simId)}
            />

            {/* Presets Bar */}
            <div className="rounded border border-[#302B22] bg-[#16130F] p-5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-amber">
                    PRESET COMPARISONS //
                  </span>
                  <h3 className="font-panel-heading text-base font-semibold text-text">
                    Curated Dual-Controller Tuning Scenarios
                  </h3>
                </div>
                <span className="rounded border border-[#332C22] bg-[#100E0B] px-2 py-0.5 font-mono text-[10px] text-text-dim">
                  ONE-CLICK LOAD
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {comparePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyComparePreset(preset)}
                    className="flex flex-col items-start justify-between rounded border border-[#2D261D] bg-[#12100C] p-3 text-left hover:border-amber transition-colors group"
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-panel-heading text-xs font-semibold text-text group-hover:text-amber transition-colors">
                          {preset.label}
                        </span>
                        <span className="font-mono text-[10px] text-text-faint">
                          LOAD ↵
                        </span>
                      </div>
                      <p className="font-panel-body text-xs text-text-dim leading-relaxed">
                        {preset.explanation}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-text-faint border-t border-[#221D16] pt-2 w-full">
                      <span className="text-amber">
                        A: Kp={preset.ctrlA.kp} Ki={preset.ctrlA.ki} Kd={preset.ctrlA.kd}
                      </span>
                      <span>·</span>
                      <span className="text-verdigris">
                        B: Kp={preset.ctrlB.kp} Ki={preset.ctrlB.ki} Kd={preset.ctrlB.kd}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Rotary Knob Parameter Banks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controller A Panel (Amber) */}
              <div className="rounded border border-amber/40 bg-[#161410] p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_16px_rgba(255,176,0,0.06)] relative overflow-hidden">
                {/* Corner Rivets */}
                <div className="absolute top-2 left-2 panel-rivet pointer-events-none" />
                <div className="absolute top-2 right-2 panel-rivet pointer-events-none" />
                <div className="absolute bottom-2 left-2 panel-rivet pointer-events-none" />
                <div className="absolute bottom-2 right-2 panel-rivet pointer-events-none" />

                <div className="flex items-center justify-between border-b border-[#2C261E] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-amber shadow-[0_0_6px_#FFB000]" />
                    <h3 className="font-panel-heading text-sm font-bold text-amber tracking-wide">
                      CONTROLLER BANK A
                    </h3>
                  </div>
                  <label className="flex items-center gap-2 font-mono text-xs text-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showA}
                      onChange={(e) => setShowA(e.target.checked)}
                      className="accent-amber"
                    />
                    <span>SHOW TRACE A</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center py-2">
                  <RotaryKnob
                    label="PROP GAIN (Kp)"
                    value={kpA}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={setKpA}
                    accentColor="#FFB000"
                  />
                  <RotaryKnob
                    label="INTEG GAIN (Ki)"
                    value={kiA}
                    min={0}
                    max={3}
                    step={0.05}
                    onChange={setKiA}
                    accentColor="#FFB000"
                  />
                  <RotaryKnob
                    label="DERIV GAIN (Kd)"
                    value={kdA}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setKdA}
                    accentColor="#FFB000"
                  />
                  <RotaryKnob
                    label="SETPOINT (SP)"
                    value={spA}
                    min={10}
                    max={90}
                    step={1}
                    unit={currentModel.unit}
                    onChange={setSpA}
                    accentColor="#FFB000"
                  />
                </div>
              </div>

              {/* Controller B Panel (Verdigris) */}
              <div className="rounded border border-verdigris/40 bg-[#161410] p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_16px_rgba(79,169,138,0.06)] relative overflow-hidden">
                {/* Corner Rivets */}
                <div className="absolute top-2 left-2 panel-rivet pointer-events-none" />
                <div className="absolute top-2 right-2 panel-rivet pointer-events-none" />
                <div className="absolute bottom-2 left-2 panel-rivet pointer-events-none" />
                <div className="absolute bottom-2 right-2 panel-rivet pointer-events-none" />

                <div className="flex items-center justify-between border-b border-[#2C261E] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-verdigris shadow-[0_0_6px_#4FA98A]" />
                    <h3 className="font-panel-heading text-sm font-bold text-verdigris tracking-wide">
                      CONTROLLER BANK B
                    </h3>
                  </div>
                  <label className="flex items-center gap-2 font-mono text-xs text-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showB}
                      onChange={(e) => setShowB(e.target.checked)}
                      className="accent-verdigris"
                    />
                    <span>SHOW TRACE B</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center py-2">
                  <RotaryKnob
                    label="PROP GAIN (Kp)"
                    value={kpB}
                    min={0}
                    max={10}
                    step={0.1}
                    onChange={setKpB}
                    accentColor="#4FA98A"
                  />
                  <RotaryKnob
                    label="INTEG GAIN (Ki)"
                    value={kiB}
                    min={0}
                    max={3}
                    step={0.05}
                    onChange={setKiB}
                    accentColor="#4FA98A"
                  />
                  <RotaryKnob
                    label="DERIV GAIN (Kd)"
                    value={kdB}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setKdB}
                    accentColor="#4FA98A"
                  />
                  <RotaryKnob
                    label="SETPOINT (SP)"
                    value={spB}
                    min={10}
                    max={90}
                    step={1}
                    unit={currentModel.unit}
                    onChange={setSpB}
                    accentColor="#4FA98A"
                  />
                </div>
              </div>
            </div>

            {/* Shared Process Model & Disturbance Conditions */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-[#302B22] bg-[#14120E] p-4 shadow-inner">
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-text uppercase">
                  SHARED PROCESS CONDITIONS // {currentModel.conditionsTitle}
                </span>
                <span className="font-mono text-[11px] text-text-faint">
                  {currentModel.conditionsDesc}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <RotaryKnob
                  label="SENSOR NOISE"
                  value={noiseCompare}
                  min={0}
                  max={1.5}
                  step={0.25}
                  unit={currentModel.unit}
                  onChange={setNoiseCompare}
                  accentColor="#FFB000"
                  size={58}
                />
              </div>
            </div>

            {/* Oscilloscope Dual Response Display */}
            <section className="flex flex-col gap-4 rounded border border-[#302B22] bg-[#12100C] p-6 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] relative">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#241F18] pb-3">
                <div>
                  <h2 className="font-panel-heading text-lg font-semibold text-text flex items-center gap-2">
                    Dual Response Oscilloscope Display
                    <span className="font-mono text-[10px] text-[#4FA98A] px-2 py-0.5 rounded bg-[#4FA98A]/10 border border-[#4FA98A]/30 font-normal">
                      PHOSPHOR PERSISTENCE ACTIVE
                    </span>
                  </h2>
                  <div className="font-mono text-[11px] text-text-faint">
                    REAL-TIME CRT ELECTRON BEAM TRACE WITH HUD CROSSHAIR INTERROGATION
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                  {/* Trace A Legend */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-4 rounded-sm bg-amber shadow-[0_0_4px_#FFB000]" />
                    <span className="text-amber font-semibold">
                      CTRL A ({spA === spB ? "Amber" : `SP ${spA}${currentModel.unit}`})
                    </span>
                    {!showA && <span className="text-text-faint text-[10px]">(MUTED)</span>}
                  </div>

                  {/* Trace B Legend */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-4 rounded-sm bg-verdigris shadow-[0_0_4px_#4FA98A]" />
                    <span className="text-verdigris font-semibold">
                      CTRL B ({spA === spB ? "Verdigris" : `SP ${spB}${currentModel.unit}`})
                    </span>
                    {!showB && <span className="text-text-faint text-[10px]">(MUTED)</span>}
                  </div>

                  {/* Target SP Indicator */}
                  <div className="text-text-faint text-[11px]">
                    {spA === spB ? (
                      <span>--- TARGET: {spA}{currentModel.unit}</span>
                    ) : (
                      <span>--- TARGETS: {spA}{currentModel.unit} (A) / {spB}{currentModel.unit} (B)</span>
                    )}
                  </div>
                </div>
              </div>

              <OscilloscopeCanvas
                data={simDataA}
                setpoint={spA}
                secondaryData={simDataB}
                secondarySetpoint={spB}
                showPrimary={showA}
                showSecondary={showB}
                color="#FFB000"
                secondaryColor="#4FA98A"
                minY={currentModel.minY}
                maxY={currentModel.maxY}
                unit={currentModel.unit}
                totalTime={currentModel.totalTime}
                dt={currentModel.dt}
                height={420}
              />

              {/* Metrics Comparison Table */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-panel-heading text-sm font-semibold text-text">
                    Quantitative Performance Benchmark
                  </h3>
                  <span className="font-mono text-[11px] text-text-faint">
                    * HIGHLIGHTS INDICATE SUPERIOR CONTROL ACTION PER SPECIFICATION
                  </span>
                </div>

                <div className="overflow-x-auto rounded border border-[#302B22]">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#302B22] bg-[#16130E] text-text-dim">
                        <th className="py-2.5 px-4 font-medium">CONTROL METRIC</th>
                        <th className="py-2.5 px-4 font-medium text-amber">
                          CONTROLLER A
                        </th>
                        <th className="py-2.5 px-4 font-medium text-verdigris">
                          CONTROLLER B
                        </th>
                        <th className="py-2.5 px-4 font-medium text-text-faint">
                          CRITERIA &amp; COMPARISON SUMMARY
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#221D16] bg-[#12100C]">
                      {/* Overshoot */}
                      {(() => {
                        const win = evaluateWinner(metricsA.overshootPct, metricsB.overshootPct, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              Overshoot (OS%)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {metricsA.overshootPct.toFixed(2)}%
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ BETTER DAMPING
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {metricsB.overshootPct.toFixed(2)}%
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ BETTER DAMPING
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              {win === "tied"
                                ? "Equivalent peak overshoot (within 0.05%)"
                                : win === "A"
                                ? `Controller A restrains peak by ${(metricsB.overshootPct - metricsA.overshootPct).toFixed(2)}%`
                                : `Controller B restrains peak by ${(metricsA.overshootPct - metricsB.overshootPct).toFixed(2)}%`}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* Rise Time */}
                      {(() => {
                        const win = evaluateWinner(metricsA.riseTimeSec, metricsB.riseTimeSec, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              Rise Time (tr to 90% SP)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {metricsA.riseTimeSec !== null ? `${metricsA.riseTimeSec.toFixed(1)}s` : "N/A"}
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ FASTER
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {metricsB.riseTimeSec !== null ? `${metricsB.riseTimeSec.toFixed(1)}s` : "N/A"}
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ FASTER
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              {win === "tied"
                                ? "Identical initial speed of response"
                                : win === "A"
                                ? "Controller A reaches command threshold earlier"
                                : "Controller B reaches command threshold earlier"}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* Settling Time */}
                      {(() => {
                        const win = evaluateWinner(metricsA.settlingTimeSec, metricsB.settlingTimeSec, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              Settling Time (ts ±5% Band)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {metricsA.settlingTimeSec.toFixed(1)}s
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ FASTER SETTLE
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {metricsB.settlingTimeSec.toFixed(1)}s
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ FASTER SETTLE
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              {win === "tied"
                                ? "Equal duration to remain bounded within ±5%"
                                : win === "A"
                                ? `Controller A settles ${(metricsB.settlingTimeSec - metricsA.settlingTimeSec).toFixed(1)}s sooner`
                                : `Controller B settles ${(metricsA.settlingTimeSec - metricsB.settlingTimeSec).toFixed(1)}s sooner`}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* IAE */}
                      {(() => {
                        const win = evaluateWinner(integralMetricsA.iae, integralMetricsB.iae, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              IAE (∫|e| dt)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {integralMetricsA.iae.toFixed(2)}
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ LOWER ERROR
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {integralMetricsB.iae.toFixed(2)}
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ LOWER ERROR
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              Total cumulative deviation evenly weighted across horizon
                            </td>
                          </tr>
                        );
                      })()}

                      {/* ISE */}
                      {(() => {
                        const win = evaluateWinner(integralMetricsA.ise, integralMetricsB.ise, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              ISE (∫e² dt)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {integralMetricsA.ise.toFixed(2)}
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ FEWER PEAKS
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {integralMetricsB.ise.toFixed(2)}
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ FEWER PEAKS
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              Quadratic penalty suppressing large transient excursions
                            </td>
                          </tr>
                        );
                      })()}

                      {/* ITAE */}
                      {(() => {
                        const win = evaluateWinner(integralMetricsA.itae, integralMetricsB.itae, true);
                        return (
                          <tr className="hover:bg-[#1A1611]/50 transition-colors">
                            <td className="py-3 px-4 text-text font-medium">
                              ITAE (∫t|e| dt)
                            </td>
                            <td className={`py-3 px-4 ${win === "A" ? "font-bold text-amber" : "text-text-dim"}`}>
                              {integralMetricsA.itae.toFixed(2)}
                              {win === "A" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-amber/15 text-amber border border-amber/30">
                                  ★ MINIMAL TAIL
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 ${win === "B" ? "font-bold text-verdigris" : "text-text-dim"}`}>
                              {integralMetricsB.itae.toFixed(2)}
                              {win === "B" && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] bg-verdigris/15 text-verdigris border border-verdigris/30">
                                  ★ MINIMAL TAIL
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-text-faint">
                              Time-multiplied error penalizing persistent tail offset
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teaching Takeaway Box */}
              <div className="rounded border-l-4 border-verdigris border-t border-r border-b border-[#302B22] bg-[#16130E] p-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-verdigris font-semibold mb-1.5 font-panel-heading">
                  <span>ENGINEERING INSIGHT // SCIENTIFIC BENCHMARKING</span>
                </div>
                <p className="font-panel-body text-text-dim leading-relaxed">
                  Both controllers execute against the exact same {currentModel.name.toLowerCase()} dynamics ({currentModel.conditionsDesc.split("·")[1]?.trim() || "dt = 0.1s"}). 
                  All Controller A and B parameters persist across plant swaps via the patch-bay, enabling direct side-by-side diagnosis of how identical tuning reacts across gravity tanks, asymmetric thermal chambers, motor drives, or resonant systems without losing your session.
                </p>
              </div>
            </section>
          </InstrumentPanel>
        )}

        {/* Directory Grid of All 5 Additional Simulators */}
        <section className="mt-12 border-t border-line pt-8">
          <div className="mb-6">
            <div className="inline-block rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-[11px] text-amber mb-2">
              SUITE CATALOG
            </div>
            <h2 className="font-heading text-xl font-bold text-text">
              Complete Process Simulation Suite
            </h2>
            <p className="font-sans text-sm text-text-dim">
              Explore open-loop drainage, asymmetric thermal inertia, electromechanical velocity, 
              and classic linear system response models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded overflow-hidden">
            {[
              {
                title: "Cascade & Feedforward Control",
                badge: "MULTI-LOOP",
                desc: "Nested master level controller (LIC-301) driving slave flow loop (FIC-301) with feedforward disturbance cancellation.",
                href: "/pid-lab/cascade",
                tag: "SIM-00",
              },
              {
                title: "Standalone Tank Level",
                badge: "OPEN LOOP",
                desc: "Manual valve throttling and gravity drainage equilibrium modeling mass balance without feedback.",
                href: "/pid-lab/tank-level",
                tag: "SIM-01",
              },
              {
                title: "Temperature Control",
                badge: "ASYMMETRIC",
                desc: "Heater power regulation with thermal mass. Note: heating can only add heat, making overshoot recovery slower.",
                href: "/pid-lab/temperature",
                tag: "SIM-02",
              },
              {
                title: "DC Motor Velocity",
                badge: "PI CONTROL",
                desc: "Speed regulation counteracting rotational inertia and viscous friction drag with torque modeling.",
                href: "/pid-lab/motor",
                tag: "SIM-03",
              },
              {
                title: "First-Order Lag",
                badge: "STEP RESPONSE",
                desc: "Generic first-order transfer function step response with process gain K and time constant tau inspection.",
                href: "/pid-lab/first-order",
                tag: "SIM-04",
              },
              {
                title: "Second-Order System",
                badge: "RESONANCE",
                desc: "Harmonic response with damping ratio zeta and natural frequency wn, dynamically classifying damping regimes.",
                href: "/pid-lab/second-order",
                tag: "SIM-05",
              },
              {
                title: "Multi-Tank Interacting System",
                badge: "2ND-ORDER LAG",
                desc: "Two gravity-coupled tanks in series. Controlling Tank 2 via Tank 1 inlet introduces an unmeasured intermediate lag.",
                href: "/pid-lab/multi-tank",
                tag: "SIM-06",
              },
              {
                title: "Counter-Current Heat Exchanger",
                badge: "DEAD TIME",
                desc: "Shell-and-tube thermal process with adjustable transport delay. Demonstrates how dead time erodes stability margins.",
                href: "/pid-lab/heat-exchanger",
                tag: "SIM-07",
              },
            ].map((sim) => (
              <article key={sim.title} className="flex flex-col bg-panel p-6 hover:bg-[#211E18] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-heading text-base font-semibold text-text">{sim.title}</h3>
                  <span className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-text-dim">
                    {sim.badge}
                  </span>
                </div>
                <p className="flex-1 font-sans text-xs text-text-dim mb-4 leading-relaxed">
                  {sim.desc}
                </p>
                <div className="flex items-center justify-between border-t border-line-soft pt-3 font-mono text-xs">
                  <Link href={sim.href} className="text-amber hover:text-text transition-colors">
                    LAUNCH SIMULATOR ⟶
                  </Link>
                  <span className="text-text-faint">{sim.tag}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
