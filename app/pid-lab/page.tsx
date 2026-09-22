"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
import { simulateTankPID, computeMetrics } from "@/lib/pid-math";

export default function PidLabPage() {
  const [kp, setKp] = useState(2.1);
  const [ki, setKi] = useState(0.35);
  const [kd, setKd] = useState(0.1);
  const [sp, setSp] = useState(50);
  const [noise, setNoise] = useState(0);

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

  const simulationData = useMemo(() => {
    return simulateTankPID(kp, ki, kd, sp, { noiseAmplitude: noise });
  }, [kp, ki, kd, sp, noise]);

  const metrics = useMemo(() => {
    return computeMetrics(simulationData, sp);
  }, [simulationData, sp]);

  const finalLevel = simulationData[simulationData.length - 1] ?? sp;

  // Threshold colors
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

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <span>SIMULATOR // PROCESS CONTROL</span>
            <span>·</span>
            <span>DISCRETE TANK-LEVEL PROCESS</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            PID Controller Simulation Testbench
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Tune proportional (Kp), integral (Ki), and derivative (Kd) gains in real-time. 
            Observe step response dynamics, rise time, overshoot penalties, and settling time over a 60-second horizon.
          </p>

          {/* Sub-nav switcher */}
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Simulator Switcher">
            <Link
              href="/pid-lab"
              className="rounded border border-amber bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-amber shadow-[0_0_8px_rgba(255,176,0,0.25)]"
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

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Left Controls */}
          <aside className="rounded border border-line bg-panel p-6">
            {/* Presets */}
            <div className="mb-6 border-b border-line-soft pb-5">
              <label className="flex items-center justify-between font-mono text-xs text-text-dim mb-2">
                <span>TUNING PRESETS</span>
                <span className="rounded border border-line bg-panel-2 px-1.5 py-0.5 text-[10px]">SELECT</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("sluggish")}
                  className="rounded border border-line bg-panel-2 px-2 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  SLUGGISH
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("aggressive")}
                  className="rounded border border-line bg-panel-2 px-2 py-1.5 font-mono text-xs text-text-dim hover:border-amber hover:text-amber transition-colors"
                >
                  AGGRESSIVE
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("welltuned")}
                  className="rounded border border-amber bg-panel-2 px-2 py-1.5 font-mono text-xs font-semibold text-amber shadow-[0_0_8px_rgba(255,176,0,0.2)]"
                >
                  WELL-TUNED
                </button>
              </div>
            </div>

            {/* Slider Kp */}
            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>PROPORTIONAL GAIN (Kp)</span>
                <span className="font-semibold text-amber">{kp.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={kp}
                onChange={(e) => setKp(parseFloat(e.target.value))}
              />
              <p className="font-mono text-[11px] text-text-faint">
                Corrective effort proportional to error e(t).
              </p>
            </div>

            {/* Slider Ki */}
            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>INTEGRAL GAIN (Ki)</span>
                <span className="font-semibold text-amber">{ki.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.05"
                value={ki}
                onChange={(e) => setKi(parseFloat(e.target.value))}
              />
              <p className="font-mono text-[11px] text-text-faint">
                Eliminates steady-state offset over time.
              </p>
            </div>

            {/* Slider Kd */}
            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>DERIVATIVE GAIN (Kd)</span>
                <span className="font-semibold text-amber">{kd.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={kd}
                onChange={(e) => setKd(parseFloat(e.target.value))}
              />
              <p className="font-mono text-[11px] text-text-faint">
                Damps rate of change de/dt to restrain overshoot.
              </p>
            </div>

            {/* Slider Setpoint */}
            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>TARGET SETPOINT (SP)</span>
                <span className="font-semibold text-amber">{sp}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={sp}
                onChange={(e) => setSp(parseFloat(e.target.value))}
              />
            </div>

            {/* Sensor Noise */}
            <div className="border-t border-line-soft pt-4">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>SIMULATED SENSOR NOISE</span>
                <span className="font-semibold text-amber">
                  {noise === 0 ? "OFF" : `±${noise.toFixed(2)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.25"
                value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))}
              />
            </div>
          </aside>

          {/* Right Main Chart & Readouts */}
          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold text-text">
                  Process Response Dynamics
                </h2>
                <div className="font-mono text-[11px] text-text-faint">
                  SOLVER: EULER DISCRETE (dt = 0.1s, 600 STEPS = 60s)
                </div>
              </div>
              <div className="flex gap-3 font-mono text-xs">
                <span className="text-amber">--- SETPOINT</span>
                <span style={{ color: curveColor }}>— PROCESS VARIABLE</span>
              </div>
            </div>

            <ProcessCanvas
              data={simulationData}
              setpoint={sp}
              minY={0}
              maxY={100}
              unit="%"
              totalTime={60}
              dt={0.1}
              color={curveColor}
              glowColor={
                curveColor === "#D64550"
                  ? "rgba(214, 69, 80, 0.3)"
                  : curveColor === "#4FA98A"
                  ? "rgba(79, 169, 138, 0.3)"
                  : "rgba(255, 176, 0, 0.25)"
              }
              toleranceBandPct={5}
            />

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded overflow-hidden">
              <div className="bg-panel-2 p-4 flex flex-col gap-1">
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

              <div className="bg-panel-2 p-4 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-text-faint">RISE TIME (tr to 90%)</span>
                <span className="font-mono text-2xl font-bold text-text">
                  {metrics.riseTimeSec !== null ? `${metrics.riseTimeSec.toFixed(1)}s` : "N/A"}
                </span>
                <span className="font-mono text-[10px] text-text-faint">TARGET SPEED</span>
              </div>

              <div className="bg-panel-2 p-4 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-text-faint">SETTLING TIME (ts)</span>
                <span className="font-mono text-2xl font-bold text-text">
                  {metrics.settlingTimeSec.toFixed(1)}s
                </span>
                <span className="font-mono text-[10px] text-text-faint">BAND: ±5% SP</span>
              </div>

              <div className="bg-panel-2 p-4 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-text-faint">FINAL LEVEL (60s)</span>
                <span className="font-mono text-2xl font-bold text-text">
                  {finalLevel.toFixed(1)}%
                </span>
                <span className="font-mono text-[10px] text-text-faint">STEADY STATE</span>
              </div>
            </div>

            {/* Formula Block */}
            <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs">
              <div className="border-b border-dashed border-line-soft pb-2 mb-2">
                <span className="text-text-faint mr-2">[1]</span>
                <span className="text-text">Error: e[k] = Setpoint - Level[k]</span>
              </div>
              <div className="border-b border-dashed border-line-soft pb-2 mb-2">
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
