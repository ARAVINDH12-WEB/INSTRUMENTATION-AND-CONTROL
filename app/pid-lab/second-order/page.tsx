"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
import { simulateSecondOrder } from "@/lib/pid-math";

export default function SecondOrderPage() {
  const [zeta, setZeta] = useState(0.35);
  const [wn, setWn] = useState(1.8);
  const [step, setStep] = useState(1.0);

  const simulationData = useMemo(() => {
    return simulateSecondOrder(zeta, wn, step);
  }, [zeta, wn, step]);

  const maxVal = Math.max(...simulationData);

  // Classification logic per skill
  let regimeName = "UNDERDAMPED";
  let regimeColorClass = "text-amber";
  let regimeTagClass = "border-amber-dim bg-amber/10 text-amber";
  let curveColor = "#FFB000";

  if (zeta < 1.0) {
    regimeName = "UNDERDAMPED (ζ < 1)";
    regimeColorClass = "text-amber";
    regimeTagClass = "border-amber-dim bg-amber/10 text-amber";
    curveColor = "#FFB000";
  } else if (Math.abs(zeta - 1.0) < 0.04) {
    regimeName = "CRITICALLY DAMPED (ζ = 1)";
    regimeColorClass = "text-verdigris";
    regimeTagClass = "border-verdigris/40 bg-verdigris/15 text-verdigris";
    curveColor = "#4FA98A";
  } else {
    regimeName = "OVERDAMPED (ζ > 1)";
    regimeColorClass = "text-text-dim";
    regimeTagClass = "border-line bg-panel-2 text-text-dim";
    curveColor = "#A79C8A";
  }

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/pid-lab" className="text-amber hover:underline">
              SIMULATION SUITE
            </Link>
            <span>/</span>
            <span>RESONANCE &amp; DAMPING</span>
            <span>·</span>
            <span>SECOND-ORDER DYNAMICS</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Second-Order Harmonic System Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Investigate harmonic oscillation, peak overshoot, and decay envelopes across the three damping regimes: 
            underdamped (&zeta; &lt; 1), critically damped (&zeta; = 1), and overdamped (&zeta; &gt; 1).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Damping &amp; Frequency
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>DAMPING RATIO (&zeta;)</span>
                <span className={`font-semibold ${regimeColorClass}`}>{zeta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="2.5"
                step="0.05"
                value={zeta}
                onChange={(e) => setZeta(parseFloat(e.target.value))}
              />
            </div>

            {/* Regime Card */}
            <div className="rounded border border-line bg-panel-2 p-3 font-mono text-xs mb-5">
              <div className="text-text-faint text-[10px] uppercase tracking-wider mb-1">CURRENT REGIME</div>
              <div className={`font-bold text-sm ${regimeColorClass}`}>{regimeName}</div>
              <p className="text-[11px] text-text-dim mt-1 leading-normal">
                {zeta < 1.0
                  ? "Complex conjugate poles. Oscillatory transient response decaying at rate exp(-ζ·ωn·t)."
                  : Math.abs(zeta - 1.0) < 0.04
                  ? "Repeated real poles. Fastest rise to setpoint without overshoot."
                  : "Distinct real poles. Sluggish, non-oscillatory monotonic rise."}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>NATURAL FREQUENCY (&omega;n)</span>
                <span className="font-semibold text-amber">{wn.toFixed(1)} rad/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={wn}
                onChange={(e) => setWn(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>STEP AMPLITUDE (&Delta;u)</span>
                <span className="font-semibold text-amber">{step.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={step}
                onChange={(e) => setStep(parseFloat(e.target.value))}
              />
            </div>
          </aside>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <div className="flex justify-between items-baseline">
              <h2 className="font-heading text-lg font-semibold text-text">Harmonic Trajectory y(t)</h2>
              <span className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${regimeTagClass}`}>
                {regimeName}
              </span>
            </div>

            <ProcessCanvas
              data={simulationData}
              setpoint={step}
              minY={0}
              maxY={Math.max(step * 1.25, maxVal * 1.15)}
              totalTime={20}
              dt={0.05}
              color={curveColor}
              glowColor={curveColor === "#4FA98A" ? "rgba(79, 169, 138, 0.3)" : "rgba(255, 176, 0, 0.25)"}
            />

            <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs">
              <div className="border-b border-dashed border-line-soft pb-2 mb-2">
                <span className="text-text-faint mr-2">[TRANSFER]</span>
                <span className="text-text">
                  G(s) = &omega;n² / (s² + 2&zeta;&omega;n·s + &omega;n²)
                </span>
              </div>
              <div>
                <span className="text-text-faint mr-2">[REGIMES]</span>
                <span className="text-text">
                  &zeta; &lt; 1: Underdamped | &zeta; = 1: Critically Damped | &zeta; &gt; 1: Overdamped
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
