"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  simulateCascadeTank,
  simulateSingleLoopTank,
  calculateMetrics,
  computeMetrics,
} from "@/lib/pid-math";

export default function DisturbanceRejectionCapstonePage() {
  const [activeScenario, setActiveScenario] = useState<
    "nominal" | "noise" | "ff_under" | "ff_over"
  >("nominal");

  // Dynamic simulation computations for visualization
  const simResults = useMemo(() => {
    const baseOpts = {
      levelSetpoint: 50,
      initialLevel: 50,
      outerKp: 1.8,
      outerKi: 0.25,
      outerKd: 0.4,
      outerStepsPerInnerStep: 5,
      disturbanceMagnitude: 15,
      disturbanceStartTime: 20,
      dt: 0.1,
      steps: 600,
    };

    let innerNoise = 0;
    let ffGain = 1.0;

    if (activeScenario === "noise") {
      innerNoise = 2.0;
    } else if (activeScenario === "ff_under") {
      ffGain = 0.6;
    } else if (activeScenario === "ff_over") {
      ffGain = 1.4;
    }

    const single = simulateSingleLoopTank({
      ...baseOpts,
      noiseAmplitude: 0,
    });

    const cascade = simulateCascadeTank({
      ...baseOpts,
      architecture: "cascade",
      innerKp: 3.0,
      innerKi: 3.0,
      innerKd: 0.0,
      noiseAmplitude: 0,
      innerNoiseAmplitude: innerNoise,
    });

    const cascadeFF = simulateCascadeTank({
      ...baseOpts,
      architecture: "cascade_feedforward",
      innerKp: 3.0,
      innerKi: 3.0,
      innerKd: 0.0,
      feedforwardGain: ffGain,
      noiseAmplitude: 0,
      innerNoiseAmplitude: innerNoise,
    });

    return { single, cascade, cascadeFF };
  }, [activeScenario]);

  // Convert time series to SVG points
  const svgWidth = 800;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getLevelPoints = (data: number[]) => {
    // Level range: 35% to 65%
    const minL = 35;
    const maxL = 65;
    return data
      .map((val, i) => {
        const x = padLeft + (i / (data.length - 1)) * chartW;
        const clamped = Math.max(minL, Math.min(maxL, val));
        const y = padTop + chartH - ((clamped - minL) / (maxL - minL)) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const getValvePoints = (data: number[]) => {
    // Valve range: 0% to 100%
    return data
      .map((val, i) => {
        const x = padLeft + (i / (data.length - 1)) * chartW;
        const clamped = Math.max(0, Math.min(100, val));
        const y = padTop + chartH - (clamped / 100) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg text-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 font-mono text-xs text-text-dim">
          <Link href="/projects" className="hover:text-amber transition-colors">
            ARCHIVE // PROJECTS
          </Link>
          <span>/</span>
          <span className="text-amber">CAPSTONE CASE STUDY · CF-PRJ-007</span>
        </div>

        {/* Hero Header */}
        <header className="mb-10 border-b border-line pb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="rounded border border-amber bg-amber/10 px-2.5 py-1 font-mono text-xs text-amber font-semibold">
              CAPSTONE BENCHMARK // PROCESS CONTROL
            </span>
            <span className="font-mono text-xs text-text-faint">
              TAG: LIC-301 / FIC-301 / FT-302
            </span>
            <span className="rounded border border-verdigris/30 bg-verdigris/10 px-2 py-0.5 font-mono text-[11px] text-verdigris">
              EMPIRICALLY BENCHMARKED
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-text">
            Robustness &amp; Disturbance-Rejection Capstone Case Study
          </h1>

          <p className="mt-3 max-w-4xl font-sans text-base text-text-dim leading-relaxed">
            A rigorous scientific benchmark of Single-Loop PID, Two-Loop Cascade, and Cascade plus
            Feedforward architectures on an identical hydraulic surge-tank process. Evaluates nominal
            disturbance rejection against inner-loop flow sensor noise and severe feedforward model
            mismatch to stress-test real-world control claims.
          </p>

          {/* Metadata Matrix */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded overflow-hidden font-mono text-xs">
            <div className="bg-panel p-3.5 flex flex-col">
              <span className="text-[10px] text-text-faint">PLANT MODEL</span>
              <span className="text-text font-semibold mt-0.5">Gravity Surge Tank (Area = 4.0 m²)</span>
            </div>
            <div className="bg-panel p-3.5 flex flex-col">
              <span className="text-[10px] text-text-faint">DISTURBANCE PROFILE</span>
              <span className="text-amber font-semibold mt-0.5">+15 L/min Outflow Step (+75%)</span>
            </div>
            <div className="bg-panel p-3.5 flex flex-col">
              <span className="text-[10px] text-text-faint">TIME-SCALE SEPARATION</span>
              <span className="text-text font-semibold mt-0.5">5:1 (Outer 0.5s / Inner 0.1s)</span>
            </div>
            <div className="bg-panel p-3.5 flex flex-col">
              <span className="text-[10px] text-text-faint">BASELINE REUSE</span>
              <span className="text-verdigris font-semibold mt-0.5">Kp=1.8, Ki=0.25, Kd=0.4 (Fair)</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex flex-col gap-12">
          {/* Section 1: Problem Statement */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">01 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Engineering Problem</h2>
            </div>
            <div className="space-y-4 font-sans text-sm text-text-dim leading-relaxed">
              <p>
                In high-rate chemical and hydrometallurgical operations, intermediate surge tanks act as
                critical hydraulic buffers between continuous upstream synthesis units and batch downstream
                processing vessels. A major operational risk occurs during batch reactor filling or filter
                backwash cycles, when downstream extraction pumps suddenly induce large, unannounced step
                increases in outflow demand (+75% surge above nominal baseline).
              </p>
              <p>
                Under conventional single-loop level feedback, the controller can only react <em>after</em> the
                mass deficit has accumulated enough to cause a visible decline in liquid level. Due to the
                significant hydraulic capacitance of the vessel, level changes register slowly. By the time
                the level transmitter registers an error large enough to drive the single-loop valve fully open,
                the tank has experienced a substantial liquid slump (exceeding 7.7% of span), threatening pump
                cavitation and triggering low-level interlock trips.
              </p>
              <p>
                While cascade control and feedforward compensation are widely proposed in control textbooks as
                superior alternatives, literature frequently assumes idealized operating conditions where cascade
                is presumed to win on every performance metric. This capstone case study was commissioned to test
                that premise scientifically: benchmarking all three architectures under identical disturbance
                profiles, and subsequently subjecting them to inner-loop flow sensor noise and feedforward model
                inaccuracy to reveal where each architecture excels and where it falters.
              </p>
            </div>
          </section>

          {/* Section 2: Process Description */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">02 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Process Description &amp; Dynamics</h2>
            </div>
            <div className="space-y-4 font-sans text-sm text-text-dim leading-relaxed">
              <p>
                The process consists of an atmospheric, vertical cylindrical surge vessel with cross-sectional
                area <code className="text-amber font-mono font-semibold">A = 4.0 m²</code>. Aqueous process fluid
                enters through an overhead inlet line modulated by a pneumatic globe control valve and discharges
                via a bottom gravity effluent line.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 font-mono text-xs">
                <div className="rounded border border-line-soft bg-panel-2 p-3.5">
                  <div className="text-[10px] text-text-faint">OPERATING POINT</div>
                  <div className="text-text font-bold text-sm mt-1">h₀ = 50.0%</div>
                  <div className="text-text-dim text-[11px] mt-0.5">Nominal operating level setpoint</div>
                </div>
                <div className="rounded border border-line-soft bg-panel-2 p-3.5">
                  <div className="text-[10px] text-text-faint">BASELINE THROUGHPUT</div>
                  <div className="text-text font-bold text-sm mt-1">Q₀ = 20.0 L/min</div>
                  <div className="text-text-dim text-[11px] mt-0.5">Steady-state inflow &amp; outflow equilibrium</div>
                </div>
                <div className="rounded border border-line-soft bg-panel-2 p-3.5">
                  <div className="text-[10px] text-text-faint">ACTUATOR TIME CONSTANT</div>
                  <div className="text-text font-bold text-sm mt-1">τ_flow = 1.20 s</div>
                  <div className="text-text-dim text-[11px] mt-0.5">Pneumatic positioner &amp; fluid inertia lag</div>
                </div>
              </div>
              <p>
                At simulation timestamp <code className="text-amber font-mono">t = 20.0 s</code>, downstream batch
                pumps start up instantaneously, introducing a step disturbance of{" "}
                <code className="text-amber font-mono">+15.0 L/min</code> (increasing total demand to 35.0 L/min).
                The controller must ramp up the inlet valve to restore mass balance and return the liquid level
                to 50.0% within an engineering tolerance band of ±5% (±2.5% level).
              </p>
            </div>
          </section>

          {/* Section 3: Sensors & Actuators */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">03 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Sensors &amp; Actuators</h2>
            </div>
            <p className="font-sans text-sm text-text-dim mb-4">
              To implement and compare the three control strategies, the vessel is outfitted with an industrial
              instrumentation schedule spanning level detection, fast inner flow measurement, and disturbance flow
              telemetry:
            </p>
            <div className="overflow-x-auto rounded border border-line-soft">
              <table className="w-full font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-panel-2 text-text-faint text-left">
                    <th className="p-3">TAG</th>
                    <th className="p-3">EQUIPMENT TYPE</th>
                    <th className="p-3">TECHNOLOGY &amp; TRIM</th>
                    <th className="p-3">CALIBRATED RANGE</th>
                    <th className="p-3">SIGNAL / BUS</th>
                    <th className="p-3">USED IN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  <tr>
                    <td className="p-3 text-amber font-semibold">LT-301</td>
                    <td className="p-3 text-text">Level Transmitter</td>
                    <td className="p-3 text-text-dim">Guided Wave Radar (Rod Probe)</td>
                    <td className="p-3 text-text-dim">0–100% (0–2500 mm)</td>
                    <td className="p-3 text-text-dim">4–20 mA + HART 7</td>
                    <td className="p-3 text-verdigris font-semibold">All 3 Architectures</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">LIC-301</td>
                    <td className="p-3 text-text">Master Level Controller</td>
                    <td className="p-3 text-text-dim">PLC Function Block (Slow Loop)</td>
                    <td className="p-3 text-text-dim">Ts = 0.5 s (5 steps)</td>
                    <td className="p-3 text-text-dim">Internal Memory</td>
                    <td className="p-3 text-verdigris font-semibold">All 3 Architectures</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">FT-301</td>
                    <td className="p-3 text-text">Inflow Transmitter</td>
                    <td className="p-3 text-text-dim">Electromagnetic Flowmeter (PTFE)</td>
                    <td className="p-3 text-text-dim">0–100 L/min</td>
                    <td className="p-3 text-text-dim">4–20 mA (100 ms damping)</td>
                    <td className="p-3 text-amber font-semibold">Cascade &amp; Cascade+FF</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">FIC-301</td>
                    <td className="p-3 text-text">Slave Flow Controller</td>
                    <td className="p-3 text-text-dim">DCS Fast Sub-Routine (Fast Loop)</td>
                    <td className="p-3 text-text-dim">Ts = 0.1 s (1 step)</td>
                    <td className="p-3 text-text-dim">Internal Memory</td>
                    <td className="p-3 text-amber font-semibold">Cascade &amp; Cascade+FF</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">FT-302</td>
                    <td className="p-3 text-text">Disturbance Flowmeter</td>
                    <td className="p-3 text-text-dim">Coriolis Mass Flowmeter</td>
                    <td className="p-3 text-text-dim">0–100 L/min</td>
                    <td className="p-3 text-text-dim">PROFINET IRT</td>
                    <td className="p-3 text-steel font-semibold">Cascade + FF Only</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">LV-301</td>
                    <td className="p-3 text-text">Inflow Control Valve</td>
                    <td className="p-3 text-text-dim">Globe Valve, Equal Percentage</td>
                    <td className="p-3 text-text-dim">0–100% Stroke (Cv = 4.8)</td>
                    <td className="p-3 text-text-dim">Pneumatic Diaphragm</td>
                    <td className="p-3 text-verdigris font-semibold">All 3 Architectures</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-amber font-semibold">FY-301</td>
                    <td className="p-3 text-text">Smart Valve Positioner</td>
                    <td className="p-3 text-text-dim">Electro-Pneumatic Digital Positioner</td>
                    <td className="p-3 text-text-dim">0–100% Demand</td>
                    <td className="p-3 text-text-dim">4–20 mA Loop-Powered</td>
                    <td className="p-3 text-verdigris font-semibold">All 3 Architectures</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Mathematical Process Model */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">04 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Mathematical Process Model</h2>
            </div>
            <div className="space-y-4 font-sans text-sm text-text-dim leading-relaxed">
              <p>
                The plant dynamics follow first-principles mass conservation coupled with first-order actuator
                dynamics. The governing differential equation for liquid level <code className="text-amber font-mono">h(t)</code> is:
              </p>
              <div className="rounded border border-line-soft bg-panel-2 p-4 font-mono text-xs text-text overflow-x-auto">
                <div className="text-amber mb-1">// Hydraulic Continuity Equation</div>
                A · (dh / dt) = Q_in(t) - Q_out(t)
                <div className="text-text-faint mt-2">// In discrete form (Euler integration, dt = 0.1 s):</div>
                h(t + dt) = h(t) + [(Q_in(t) - Q_out(t)) / A] · dt
              </div>
              <p>
                The control valve and liquid feed line exhibit pneumatic actuator response and hydraulic line
                momentum governed by time constant <code className="text-amber font-mono">τ_flow = 1.2 s</code>:
              </p>
              <div className="rounded border border-line-soft bg-panel-2 p-4 font-mono text-xs text-text overflow-x-auto">
                <div className="text-amber mb-1">// Actuator Response Equation</div>
                τ_flow · (dQ_in / dt) + Q_in(t) = u_valve(t)
                <div className="text-text-faint mt-2">// Discrete update:</div>
                Q_in(t + dt) = Q_in(t) + [(u_valve(t) - Q_in(t)) / τ_flow] · dt
              </div>
              <p>
                Valve stem position is constrained to physical saturation limits:{" "}
                <code className="text-amber font-mono">0.0% ≤ u_valve(t) ≤ 100.0%</code>.
              </p>
            </div>
          </section>

          {/* Section 5: Control Architectures */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">05 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Control Strategy &amp; Architectures</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="rounded border border-line-soft bg-panel-2 p-4 flex flex-col">
                <span className="text-[10px] text-amber font-semibold uppercase">Architecture 1</span>
                <span className="text-text font-bold text-sm mt-1">Single-Loop PID Baseline</span>
                <p className="font-sans text-xs text-text-dim mt-2 leading-relaxed">
                  Single feedback loop directly driving control valve LV-301 from level error. Reuses the
                  confirmed-fair tuning from prior cascade milestones:
                </p>
                <div className="mt-3 rounded border border-line bg-panel p-2.5 text-[11px] space-y-1">
                  <div>Kp = 1.80</div>
                  <div>Ki = 0.25 s⁻¹</div>
                  <div>Kd = 0.40 s</div>
                  <div className="text-text-faint text-[10px]">Execution: Ts = 0.5 s (5 steps)</div>
                </div>
              </div>

              <div className="rounded border border-line-soft bg-panel-2 p-4 flex flex-col">
                <span className="text-[10px] text-amber font-semibold uppercase">Architecture 2</span>
                <span className="text-text font-bold text-sm mt-1">Two-Loop Cascade Control</span>
                <p className="font-sans text-xs text-text-dim mt-2 leading-relaxed">
                  Outer master LIC-301 calculates dynamic flow setpoint; inner slave FIC-301 drives valve to
                  isolate supply pressure fluctuations and actuator non-linearities:
                </p>
                <div className="mt-3 rounded border border-line bg-panel p-2.5 text-[11px] space-y-1">
                  <div>Outer: Kp=1.80, Ki=0.25, Kd=0.40 (Ts=0.5s)</div>
                  <div>Inner: Kp=3.00, Ki=3.00, Kd=0.00 (Ts=0.1s)</div>
                  <div className="text-text-faint text-[10px]">Time-scale separation: 5:1 ratio</div>
                </div>
              </div>

              <div className="rounded border border-line-soft bg-panel-2 p-4 flex flex-col">
                <span className="text-[10px] text-amber font-semibold uppercase">Architecture 3</span>
                <span className="text-text font-bold text-sm mt-1">Cascade + Feedforward</span>
                <p className="font-sans text-xs text-text-dim mt-2 leading-relaxed">
                  Augments cascade by measuring outflow disturbance via FT-302 and immediately summing an
                  inlet setpoint correction before tank level drops:
                </p>
                <div className="mt-3 rounded border border-line bg-panel p-2.5 text-[11px] space-y-1">
                  <div>Cascade: Same gains &amp; 5:1 separation</div>
                  <div>Feedforward: Q_sp,ff = K_ff · ΔQ_out</div>
                  <div>Calibrated: K_ff = 1.00 (1:1 mass balance)</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Dynamic Interactive Simulation & Charts */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-amber font-semibold">06 //</span>
                <h2 className="font-heading text-xl font-bold text-text">
                  Dynamic Simulation &amp; Benchmark Waveforms
                </h2>
              </div>

              {/* Scenario Toggle */}
              <div className="flex items-center gap-1.5 rounded border border-line bg-panel-2 p-1 font-mono text-xs">
                <span className="text-[10px] text-text-faint px-2">SCENARIO:</span>
                <button
                  type="button"
                  onClick={() => setActiveScenario("nominal")}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    activeScenario === "nominal"
                      ? "bg-amber text-panel font-semibold"
                      : "text-text-dim hover:text-text"
                  }`}
                >
                  Nominal (Clean)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScenario("noise")}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    activeScenario === "noise"
                      ? "bg-crimson text-text font-semibold"
                      : "text-text-dim hover:text-text"
                  }`}
                >
                  Inner Flow Noise (±2.0)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScenario("ff_under")}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    activeScenario === "ff_under"
                      ? "bg-amber-dim text-text font-semibold"
                      : "text-text-dim hover:text-text"
                  }`}
                >
                  FF Under (60%)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScenario("ff_over")}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    activeScenario === "ff_over"
                      ? "bg-amber-dim text-text font-semibold"
                      : "text-text-dim hover:text-text"
                  }`}
                >
                  FF Over (140%)
                </button>
              </div>
            </div>

            <p className="font-sans text-xs text-text-dim mb-4 leading-relaxed">
              Real-time numerical response over a 60.0-second horizon (dt = 0.1 s). The step outflow disturbance (+15 L/min)
              strikes at <code className="text-amber font-mono font-semibold">t = 20.0 s</code>. Select a scenario above to
              inspect how sensor noise causes extreme valve chatter or how model mismatch creates setpoint overshoots.
            </p>

            {/* SVG Waveform Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart 1: Tank Level */}
              <div className="rounded border border-line-soft bg-panel-2 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2 font-mono text-[11px]">
                  <span className="text-text font-semibold">PV: TANK LIQUID LEVEL (%)</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-text-dim">
                      <span className="inline-block w-2.5 h-0.5 bg-text-dim"></span> Single-Loop
                    </span>
                    <span className="flex items-center gap-1 text-amber">
                      <span className="inline-block w-2.5 h-0.5 bg-amber"></span> Cascade
                    </span>
                    <span className="flex items-center gap-1 text-verdigris">
                      <span className="inline-block w-2.5 h-0.5 bg-verdigris"></span> Cascade+FF
                    </span>
                  </div>
                </div>

                <div className="relative w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto bg-[#110F0B] rounded border border-line/50"
                  >
                    {/* Grid lines */}
                    <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="#221E17" strokeWidth="1" />
                    <line x1={padLeft} y1={padTop + chartH * 0.5} x2={svgWidth - padRight} y2={padTop + chartH * 0.5} stroke="#302B22" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padLeft} y1={padTop + chartH} x2={svgWidth - padRight} y2={padTop + chartH} stroke="#221E17" strokeWidth="1" />
                    
                    {/* Disturbance marker at t=20s (step 200/600) */}
                    <line
                      x1={padLeft + (200 / 599) * chartW}
                      y1={padTop}
                      x2={padLeft + (200 / 599) * chartW}
                      y2={padTop + chartH}
                      stroke="#8C6318"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft + (200 / 599) * chartW + 4}
                      y={padTop + 14}
                      fill="#8C6318"
                      fontSize="9"
                      fontFamily="IBM Plex Mono"
                    >
                      D(t) = +15 L/min @ 20s
                    </text>

                    {/* Y-axis labels */}
                    <text x={padLeft - 6} y={padTop + 4} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">65%</text>
                    <text x={padLeft - 6} y={padTop + chartH * 0.5 + 3} fill="#FFB000" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">50% SP</text>
                    <text x={padLeft - 6} y={padTop + chartH} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">35%</text>

                    {/* X-axis labels */}
                    <text x={padLeft} y={svgHeight - 8} fill="#6B6255" fontSize="9" fontFamily="IBM Plex Mono">0s</text>
                    <text x={padLeft + chartW * 0.333} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="middle" fontFamily="IBM Plex Mono">20s</text>
                    <text x={padLeft + chartW * 0.666} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="middle" fontFamily="IBM Plex Mono">40s</text>
                    <text x={svgWidth - padRight} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">60s</text>

                    {/* Tolerance band (47.5% - 52.5%) */}
                    <rect
                      x={padLeft}
                      y={padTop + chartH * 0.5 - ((2.5) / 30) * chartH}
                      width={chartW}
                      height={((5.0) / 30) * chartH}
                      fill="rgba(79,169,138,0.06)"
                    />

                    {/* Single-Loop Line */}
                    <polyline
                      fill="none"
                      stroke="#A79C8A"
                      strokeWidth="1.5"
                      points={getLevelPoints(simResults.single.level)}
                    />

                    {/* Cascade Line */}
                    <polyline
                      fill="none"
                      stroke="#FFB000"
                      strokeWidth="2.0"
                      points={getLevelPoints(simResults.cascade.level)}
                    />

                    {/* Cascade + FF Line */}
                    <polyline
                      fill="none"
                      stroke="#4FA98A"
                      strokeWidth="2.0"
                      points={getLevelPoints(simResults.cascadeFF.level)}
                    />
                  </svg>
                </div>
              </div>

              {/* Chart 2: Valve Command */}
              <div className="rounded border border-line-soft bg-panel-2 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2 font-mono text-[11px]">
                  <span className="text-text font-semibold">MV: VALVE COMMAND (%)</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-text-dim">
                      <span className="inline-block w-2.5 h-0.5 bg-text-dim"></span> Single-Loop
                    </span>
                    <span className="flex items-center gap-1 text-amber">
                      <span className="inline-block w-2.5 h-0.5 bg-amber"></span> Cascade
                    </span>
                    <span className="flex items-center gap-1 text-verdigris">
                      <span className="inline-block w-2.5 h-0.5 bg-verdigris"></span> Cascade+FF
                    </span>
                  </div>
                </div>

                <div className="relative w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto bg-[#110F0B] rounded border border-line/50"
                  >
                    {/* Grid lines */}
                    <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="#221E17" strokeWidth="1" />
                    <line x1={padLeft} y1={padTop + chartH * 0.5} x2={svgWidth - padRight} y2={padTop + chartH * 0.5} stroke="#302B22" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padLeft} y1={padTop + chartH} x2={svgWidth - padRight} y2={padTop + chartH} stroke="#221E17" strokeWidth="1" />

                    {/* Disturbance marker */}
                    <line
                      x1={padLeft + (200 / 599) * chartW}
                      y1={padTop}
                      x2={padLeft + (200 / 599) * chartW}
                      y2={padTop + chartH}
                      stroke="#8C6318"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Y-axis labels */}
                    <text x={padLeft - 6} y={padTop + 4} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">100%</text>
                    <text x={padLeft - 6} y={padTop + chartH * 0.5 + 3} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">50%</text>
                    <text x={padLeft - 6} y={padTop + chartH} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">0%</text>

                    {/* X-axis labels */}
                    <text x={padLeft} y={svgHeight - 8} fill="#6B6255" fontSize="9" fontFamily="IBM Plex Mono">0s</text>
                    <text x={padLeft + chartW * 0.333} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="middle" fontFamily="IBM Plex Mono">20s</text>
                    <text x={padLeft + chartW * 0.666} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="middle" fontFamily="IBM Plex Mono">40s</text>
                    <text x={svgWidth - padRight} y={svgHeight - 8} fill="#6B6255" fontSize="9" textAnchor="end" fontFamily="IBM Plex Mono">60s</text>

                    {/* Single-Loop Line */}
                    <polyline
                      fill="none"
                      stroke="#A79C8A"
                      strokeWidth="1.5"
                      points={getValvePoints(simResults.single.valveCommand)}
                    />

                    {/* Cascade Line */}
                    <polyline
                      fill="none"
                      stroke="#FFB000"
                      strokeWidth="1.5"
                      points={getValvePoints(simResults.cascade.valveCommand)}
                    />

                    {/* Cascade + FF Line */}
                    <polyline
                      fill="none"
                      stroke="#4FA98A"
                      strokeWidth="1.5"
                      points={getValvePoints(simResults.cascadeFF.valveCommand)}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Simulation Tables (PART 1 & PART 2) */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">07 //</span>
              <h2 className="font-heading text-xl font-bold text-text">
                Benchmark Metric Tables (Part 1 &amp; Part 2)
              </h2>
            </div>
            <p className="font-sans text-sm text-text-dim mb-6 leading-relaxed">
              All three architectures were simulated across 600 discrete timesteps (dt = 0.1 s). Metrics are
              calculated using standard industrial control benchmarks: IAE (all error equally weighted), ISE
              (large peak errors heavily penalized), ITAE (late-settling persistent errors penalized), and
              control effort measured both as peak valve movement span and cumulative valve travel.
            </p>

            {/* PART 1 Table: Nominal */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-amber uppercase tracking-wider">
                  Table 1: Nominal Comparison (Clean Conditions, No Noise, Calibrated Model)
                </h3>
                <span className="font-mono text-[10px] text-verdigris">CONFIRMED-FAIR BASELINE</span>
              </div>
              <div className="overflow-x-auto rounded border border-line-soft">
                <table className="w-full font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-panel-2 text-text-faint text-left">
                      <th className="p-3">METRIC</th>
                      <th className="p-3">SINGLE-LOOP PID</th>
                      <th className="p-3">CASCADE</th>
                      <th className="p-3">CASCADE + FEEDFORWARD</th>
                      <th className="p-3">RELATIVE GAIN (FF vs SL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    <tr>
                      <td className="p-3 text-text font-semibold">Max level deviation (%)</td>
                      <td className="p-3 text-crimson">7.78%</td>
                      <td className="p-3 text-amber">6.17%</td>
                      <td className="p-3 text-verdigris font-semibold">0.83%</td>
                      <td className="p-3 text-verdigris font-semibold">-89.3% reduction</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Settling time (s)</td>
                      <td className="p-3 text-text-dim">29.4 s (9.4s post-dist)</td>
                      <td className="p-3 text-text-dim">30.9 s (10.9s post-dist)</td>
                      <td className="p-3 text-verdigris font-semibold">0.0 s (Never exited band)</td>
                      <td className="p-3 text-verdigris font-semibold">Immune to tolerance exit</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">IAE (Integral Absolute Error)</td>
                      <td className="p-3 text-text-dim">60.06</td>
                      <td className="p-3 text-text-dim">60.11</td>
                      <td className="p-3 text-verdigris font-semibold">2.99</td>
                      <td className="p-3 text-verdigris font-semibold">-95.0% error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ISE (Integral Squared Error)</td>
                      <td className="p-3 text-crimson">318.43</td>
                      <td className="p-3 text-amber">258.94</td>
                      <td className="p-3 text-verdigris font-semibold">1.03</td>
                      <td className="p-3 text-verdigris font-semibold">-99.7% error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ITAE (Time-Weighted Absolute Error)</td>
                      <td className="p-3 text-text-dim">1566.67</td>
                      <td className="p-3 text-text-dim">1622.17</td>
                      <td className="p-3 text-verdigris font-semibold">77.80</td>
                      <td className="p-3 text-verdigris font-semibold">-95.0% error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Max valve movement (control effort span)</td>
                      <td className="p-3 text-verdigris font-semibold">20.34%</td>
                      <td className="p-3 text-amber font-semibold">18.20%</td>
                      <td className="p-3 text-crimson">49.50%</td>
                      <td className="p-3 text-crimson">+143.4% valve action</td>
                    </tr>
                    <tr className="bg-panel-2/50">
                      <td className="p-3 text-text-dim font-mono text-[11px]">
                        <em>Actuator Travel (Cumulative |Δu| %)</em>
                      </td>
                      <td className="p-3 text-verdigris font-semibold">25.68%</td>
                      <td className="p-3 text-amber">103.14%</td>
                      <td className="p-3 text-text-dim">99.24%</td>
                      <td className="p-3 text-text-faint">Single-loop has 4x lower travel</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART 2A Table: Sensor Noise Stress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-crimson uppercase tracking-wider">
                  Table 2A: Stress Test A — Inner Flow Loop Sensor Noise (±2.0 L/min, ~10% Flow Noise)
                </h3>
                <span className="font-mono text-[10px] text-crimson">50-RUN MONTE CARLO AVERAGE</span>
              </div>
              <p className="font-sans text-xs text-text-faint mb-3">
                Single-Loop PID has no inner flow sensor and remains unaffected. Cascade and Cascade+FF
                suffer fast inner-loop chasing of high-frequency flow transmitter noise.
              </p>
              <div className="overflow-x-auto rounded border border-line-soft">
                <table className="w-full font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-panel-2 text-text-faint text-left">
                      <th className="p-3">METRIC</th>
                      <th className="p-3">SINGLE-LOOP PID (NO INNER FT)</th>
                      <th className="p-3">CASCADE (WITH FLOW NOISE)</th>
                      <th className="p-3">CASCADE + FF (WITH FLOW NOISE)</th>
                      <th className="p-3">CASCADE IMPACT vs NOMINAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    <tr>
                      <td className="p-3 text-text font-semibold">Max level deviation (%)</td>
                      <td className="p-3 text-text-dim">7.78%</td>
                      <td className="p-3 text-amber">6.18%</td>
                      <td className="p-3 text-verdigris font-semibold">0.85%</td>
                      <td className="p-3 text-text-faint">Level buffered by tank area</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Settling time (s)</td>
                      <td className="p-3 text-text-dim">29.4 s</td>
                      <td className="p-3 text-text-dim">30.9 s</td>
                      <td className="p-3 text-verdigris font-semibold">0.0 s</td>
                      <td className="p-3 text-text-faint">Unchanged (within tolerance)</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">IAE (Integral Absolute Error)</td>
                      <td className="p-3 text-text-dim">60.06</td>
                      <td className="p-3 text-text-dim">62.60</td>
                      <td className="p-3 text-verdigris">6.42</td>
                      <td className="p-3 text-crimson">+114.7% error growth in FF</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ISE (Integral Squared Error)</td>
                      <td className="p-3 text-text-dim">318.43</td>
                      <td className="p-3 text-amber">258.87</td>
                      <td className="p-3 text-verdigris">1.61</td>
                      <td className="p-3 text-text-dim">+56.3% error growth in FF</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ITAE (Time-Weighted Error)</td>
                      <td className="p-3 text-text-dim">1566.67</td>
                      <td className="p-3 text-text-dim">1692.86</td>
                      <td className="p-3 text-verdigris">181.86</td>
                      <td className="p-3 text-crimson">+133.7% error growth in FF</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Max valve movement (%)</td>
                      <td className="p-3 text-verdigris font-semibold">20.34%</td>
                      <td className="p-3 text-crimson font-semibold">33.73%</td>
                      <td className="p-3 text-crimson font-semibold">58.47%</td>
                      <td className="p-3 text-crimson font-semibold">+85.3% peak valve excursion</td>
                    </tr>
                    <tr className="bg-panel-2/50">
                      <td className="p-3 text-crimson font-bold">Actuator Travel (Cumulative |Δu| %)</td>
                      <td className="p-3 text-verdigris font-bold">25.68%</td>
                      <td className="p-3 text-crimson font-bold">2,935.32%</td>
                      <td className="p-3 text-crimson font-bold">2,969.34%</td>
                      <td className="p-3 text-crimson font-bold">28.5x–29.9x WEAR EXPLOSION</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART 2B Table: Model Inaccuracy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-amber uppercase tracking-wider">
                  Table 2B: Stress Test B — Model Inaccuracy (Feedforward Gain Mistuning)
                </h3>
                <span className="font-mono text-[10px] text-amber">±40% CALIBRATION ERROR</span>
              </div>
              <p className="font-sans text-xs text-text-faint mb-3">
                Simulating imperfect process knowledge where the feedforward gain is under-compensated
                (60% / K_ff = 0.6) or over-compensated (140% / K_ff = 1.4) compared to the calibrated 1:1 pass-through.
              </p>
              <div className="overflow-x-auto rounded border border-line-soft">
                <table className="w-full font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-panel-2 text-text-faint text-left">
                      <th className="p-3">METRIC</th>
                      <th className="p-3">UNDER-COMPENSATED (60% / 0.6)</th>
                      <th className="p-3">CALIBRATED (100% / 1.0)</th>
                      <th className="p-3">OVER-COMPENSATED (140% / 1.4)</th>
                      <th className="p-3">BEHAVIORAL IMPACT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    <tr>
                      <td className="p-3 text-text font-semibold">Max level deviation (%)</td>
                      <td className="p-3 text-amber">2.50% (Slump)</td>
                      <td className="p-3 text-verdigris font-semibold">0.83%</td>
                      <td className="p-3 text-amber">2.50% (Overshoot)</td>
                      <td className="p-3 text-text-dim">Error increases 3x from baseline</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Settling time (s)</td>
                      <td className="p-3 text-verdigris font-semibold">0.0 s (Touches edge)</td>
                      <td className="p-3 text-verdigris font-semibold">0.0 s</td>
                      <td className="p-3 text-crimson">24.5 s (Exits band)</td>
                      <td className="p-3 text-crimson">Over-comp drives positive level trip</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">IAE (Integral Absolute Error)</td>
                      <td className="p-3 text-amber">24.08</td>
                      <td className="p-3 text-verdigris font-semibold">2.99</td>
                      <td className="p-3 text-amber">24.39</td>
                      <td className="p-3 text-crimson font-semibold">8.1x increase in integrated error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ISE (Integral Squared Error)</td>
                      <td className="p-3 text-amber">42.34</td>
                      <td className="p-3 text-verdigris font-semibold">1.03</td>
                      <td className="p-3 text-amber">42.18</td>
                      <td className="p-3 text-crimson font-semibold">41x increase in squared error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">ITAE (Time-Weighted Error)</td>
                      <td className="p-3 text-amber">641.22</td>
                      <td className="p-3 text-verdigris font-semibold">77.80</td>
                      <td className="p-3 text-crimson">675.47</td>
                      <td className="p-3 text-crimson font-semibold">8.7x increase in late-stage error</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text font-semibold">Max valve movement (%)</td>
                      <td className="p-3 text-verdigris font-semibold">29.70%</td>
                      <td className="p-3 text-amber">49.50%</td>
                      <td className="p-3 text-crimson">69.30%</td>
                      <td className="p-3 text-crimson">Aggressive over-stroking on step</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 8: Deep Written Engineering Analysis (PART 3) */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">08 //</span>
              <h2 className="font-heading text-xl font-bold text-text">
                Deep Engineering Analysis &amp; Field Trade-Offs
              </h2>
            </div>
            
            <div className="space-y-6 font-sans text-sm text-text-dim leading-relaxed">
              {/* Point 1: Nominal Findings */}
              <div>
                <h3 className="font-heading text-base font-bold text-text mb-2">
                  1. What the Nominal Table Shows Plainly
                </h3>
                <p>
                  Under clean, idealized simulation conditions, the hierarchy of disturbance rejection appears
                  unequivocal:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5">
                  <li>
                    <strong className="text-text">Single-Loop PID</strong> is hindered by the sluggish hydraulic capacitance
                    of the surge tank (A = 4.0 m²). Because it cannot command valve action until the liquid level
                    itself departs from 50%, it suffers a deep slump of <strong>7.78%</strong> (level drops to 42.22%) and
                    accumulates an ISE of 318.43.
                  </li>
                  <li>
                    <strong className="text-text">Two-Loop Cascade</strong> delivers a moderate improvement in peak level
                    excursion (6.17% deviation, a 20.7% peak error reduction) and reduces ISE to 258.94. However, because
                    the disturbance originates on the <em>outlet</em> rather than the inlet supply pressure, cascade feedback
                    must still wait for LIC-301 to detect level error before commanding the inner loop. Its total IAE (60.11)
                    is virtually identical to single-loop PID (60.06).
                  </li>
                  <li>
                    <strong className="text-text">Cascade + Feedforward</strong> dominates all error metrics under nominal
                    conditions. By measuring the outflow surge directly at FT-302, it instantly ramps the inner flow setpoint
                    at t = 20.0s. Peak level deviation collapses to just <strong>0.83%</strong> (an 89.3% reduction over single
                    loop), and IAE collapses by 95.0% (2.99 vs 60.06).
                  </li>
                </ul>
              </div>

              {/* Point 2: Stress Tests & Ranking Reversal */}
              <div>
                <h3 className="font-heading text-base font-bold text-text mb-2">
                  2. Did the Stress Tests Change the Ranking? (Sensor Noise vs. Actuator Health)
                </h3>
                <p>
                  This is the central finding of the capstone study. If an engineer looks only at the process variable
                  (tank liquid level), cascade and feedforward appear to maintain their advantage. Because the surge tank
                  possesses a large fluid area (4.0 m²), the tank acts as a massive physical low-pass hydraulic filter,
                  smoothing out flow ripples so that level deviation under sensor noise rises only imperceptibly from 0.83%
                  to 0.85%.
                </p>
                <div className="rounded border border-crimson/30 bg-crimson/5 p-4 my-3 text-xs font-sans">
                  <div className="font-mono text-crimson font-bold uppercase tracking-wider mb-1">
                    Actuator Longevity Reversal: The Hidden Cost of Cascade
                  </div>
                  <p className="text-text-dim">
                    While process variable error stayed low, <strong className="text-text">actuator wear and control effort
                    reversed dramatically</strong>. In the presence of realistic flow sensor noise (±2.0 L/min), the fast
                    inner loop (Kp=3.0, Ki=3.0 executing at 10 Hz) relentlessly chases high-frequency measurement noise.
                    Total valve stem travel exploded from <strong className="text-text">103.1% to 2,935.3%</strong> in cascade,
                    and to <strong className="text-text">2,969.3%</strong> in Cascade+FF. Meanwhile, Single-Loop PID—having no
                    inner flow sensor to corrupt its command—retained a completely smooth valve trajectory with total
                    travel of just <strong className="text-verdigris font-semibold">25.7%</strong>.
                  </p>
                </div>
                <p>
                  In a real chemical processing facility, subjecting a pneumatic control valve positioner to 2,900% stroke
                  cycling over 60 seconds translates to continuous 10 Hz valve chatter. Within weeks, this causes mechanical
                  diaphragm rupture, premature stem packing blowout, and positioner relay destruction. Thus, under noisy
                  instrumentation environments without severe signal filtering, <strong className="text-text">Single-Loop
                  PID is vastly superior in actuator reliability and plant operating life</strong>.
                </p>
              </div>

              {/* Point 3: Model Inaccuracy */}
              <div>
                <h3 className="font-heading text-base font-bold text-text mb-2">
                  3. Feedforward Model Inaccuracy &amp; Mistuning
                </h3>
                <p>
                  Feedforward compensation is open-loop by definition: it relies entirely on mathematical process knowledge
                  rather than error feedback. When the feedforward gain is mistuned by ±40%:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5">
                  <li>
                    <strong>Under-Compensation (60% / K_ff = 0.6):</strong> The feedforward element supplies only 9.0 L/min of
                    the needed 15.0 L/min surge. The remaining 6.0 L/min deficit must be made up by feedback. Level slump
                    grows to 2.50% and IAE jumps from 2.99 to 24.08 (an 8.1x degradation).
                  </li>
                  <li>
                    <strong>Over-Compensation (140% / K_ff = 1.4):</strong> The feedforward element over-corrects, pumping
                    21.0 L/min into the tank when only 15.0 L/min is leaving. This forces a setpoint overshoot of +2.50% and
                    drives the level outside the ±5% settling band, requiring 24.5 seconds for the outer level loop integral
                    action to bring the vessel back into compliance.
                  </li>
                  <li>
                    <strong>Comparison to Plain Cascade:</strong> Notably, even with a severe 40% calibration error, Cascade
                    plus Feedforward still maintained a lower peak deviation (2.50%) and lower IAE (24.1) than unassisted
                    cascade (6.17% dev, 60.11 IAE). Why? Because injecting <em>partial</em> feedforward mass balance is still
                    far better than injecting <em>zero</em> feedforward mass balance. However, over-compensation is particularly
                    hazardous because it creates secondary positive overshoot excursions.
                  </li>
                </ul>
              </div>

              {/* Point 4: Lifecycle, Hardware, and Maintenance Burden */}
              <div>
                <h3 className="font-heading text-base font-bold text-text mb-2">
                  4. Sensor Requirements, Commissioning Burden &amp; Maintenance Complexity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs my-3">
                  <div className="rounded border border-line-soft bg-panel-2 p-3">
                    <span className="text-[10px] text-text-faint">INSTRUMENT COUNT</span>
                    <div className="text-text font-bold mt-1">Single: 1 · Cascade: 2 · FF: 3</div>
                    <div className="text-text-dim text-[11px] mt-1">
                      Each added sensor requires process tap, isolation manifold, cabling, DCS I/O channel, and periodic calibration.
                    </div>
                  </div>
                  <div className="rounded border border-line-soft bg-panel-2 p-3">
                    <span className="text-[10px] text-text-faint">TUNING COMPLEXITY</span>
                    <div className="text-amber font-bold mt-1">Strict 3:1 to 5:1 Time Separation</div>
                    <div className="text-text-dim text-[11px] mt-1">
                      Cascade requires tuning inner loop first in manual/cascade-open, verifying stability, then tuning outer loop.
                    </div>
                  </div>
                  <div className="rounded border border-line-soft bg-panel-2 p-3">
                    <span className="text-[10px] text-text-faint">FAILURE MODES</span>
                    <div className="text-crimson font-bold mt-1">Multi-Point Vulnerability</div>
                    <div className="text-text-dim text-[11px] mt-1">
                      If FT-301 drifts or freezes, inner loop drives valve to extreme limits even when tank level is completely normal.
                    </div>
                  </div>
                </div>
              </div>

              {/* Point 5: Explicit Verdict on "Did Cascade Win Every Metric?" */}
              <div className="rounded border border-line bg-panel-2 p-4">
                <h3 className="font-heading text-base font-bold text-text mb-2">
                  5. Explicit Architectural Verdict: Did Cascade/Feedforward Win on Every Metric?
                </h3>
                <p className="text-text leading-relaxed font-sans">
                  <strong>NO. Cascade and Feedforward did NOT win on every metric across every condition.</strong>
                </p>
                <p className="mt-2 text-text-dim leading-relaxed font-sans">
                  The data demonstrates that the textbook claim of cascade superiority is conditional:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1.5 font-sans text-xs text-text-dim">
                  <li>
                    Under <strong className="text-text">Nominal Conditions</strong>, Single-Loop PID demonstrated superior
                    control conservation: requiring a maximum valve swing of only 20.34% compared to Cascade+FF&apos;s 49.50%,
                    and 4x lower cumulative stem travel (25.7% vs 103.1%).
                  </li>
                  <li>
                    Under <strong className="text-text">Flow Sensor Noise</strong>, Single-Loop PID decisively outperformed
                    both Cascade and Cascade+FF on actuator health, control effort, and mechanical stability. Cascade incurred
                    a catastrophic 28.5x increase in valve travel (2,935% vs 25.7%), creating destructive actuator chatter.
                  </li>
                  <li>
                    Under <strong className="text-text">Over-Compensated Feedforward (140%)</strong>, Cascade+FF suffered a
                    prolonged 24.5-second settling time violation and setpoint overshoot, whereas a well-damped single loop
                    settled without overshoot.
                  </li>
                </ol>
                <p className="mt-3 font-sans text-xs text-text-dim italic">
                  Conclusion: Cascade and Feedforward provide superior error rejection if and only if high-quality signal
                  filtering is applied to the inner loop, and the facility is prepared to absorb the capital, tuning, and
                  maintenance burden of multi-instrument loops. For non-critical buffer tanks with adequate residence time,
                  the robust simplicity of Single-Loop PID remains an optimal engineering choice.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Lessons Learned */}
          <section className="rounded border border-line bg-panel p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-amber font-semibold">09 //</span>
              <h2 className="font-heading text-xl font-bold text-text">Lessons Learned &amp; Field Rules</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs text-text-dim leading-relaxed">
              <div className="rounded border border-line-soft bg-panel-2 p-4">
                <span className="font-mono text-amber font-bold text-xs uppercase block mb-1">
                  Rule 1: Always Low-Pass Filter the Inner Loop
                </span>
                <p>
                  Never run a fast inner flow loop directly on raw 4–20 mA or pulse transmitter signals. An analog
                  first-order filter (time constant τ_f ≈ 0.2–0.5 s) or digital moving median filter is mandatory to
                  prevent the inner PI controller from transmitting high-frequency measurement hash into the valve actuator.
                </p>
              </div>

              <div className="rounded border border-line-soft bg-panel-2 p-4">
                <span className="font-mono text-amber font-bold text-xs uppercase block mb-1">
                  Rule 2: Conservative Feedforward Under Uncertainty
                </span>
                <p>
                  When process gains are uncertain or subject to ambient drift, always tune the feedforward gain
                  conservatively (e.g. K_ff = 0.7 to 0.85 rather than 1.0). An under-compensated loop still eliminates
                  70–85% of disturbance energy without the dangerous overshoot and hunting caused by over-compensation.
                </p>
              </div>

              <div className="rounded border border-line-soft bg-panel-2 p-4">
                <span className="font-mono text-amber font-bold text-xs uppercase block mb-1">
                  Rule 3: Enforce Time-Scale Separation
                </span>
                <p>
                  The inner loop must be at least 3 to 5 times faster than the outer loop. If the inner loop is slowed
                  down by sluggish valve mechanics or heavy filtering, the outer loop will interact with the inner loop,
                  destabilizing the entire cascade structure and causing sustained limit cycles.
                </p>
              </div>

              <div className="rounded border border-line-soft bg-panel-2 p-4">
                <span className="font-mono text-amber font-bold text-xs uppercase block mb-1">
                  Rule 4: Sensor Redundancy &amp; Fallback Logic
                </span>
                <p>
                  DCS logic must include automated fallback: if flow transmitter FT-301 reports a fault, out-of-range
                  NaN, or high delta, the system must bump-transfer immediately to direct single-loop level control
                  rather than allowing an open inner loop to saturate the valve.
                </p>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-8 pt-6 border-t border-line-soft flex items-center justify-between font-mono text-xs">
              <Link href="/projects" className="text-amber hover:text-text transition-colors font-semibold">
                ← RETURN TO ALL PROJECTS
              </Link>
              <Link href="/pid-lab" className="text-text-dim hover:text-amber transition-colors">
                EXPLORE IN INTERACTIVE PID LAB →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
