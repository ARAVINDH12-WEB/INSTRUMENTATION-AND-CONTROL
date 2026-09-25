"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
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
  let regimeColorClass = "text-violet";
  let regimeTagClass = "border-violet/40 bg-violet/10 text-violet";
  let curveColor = "#9D7FE8";

  if (zeta < 1.0) {
    regimeName = "UNDERDAMPED (ζ < 1)";
    regimeColorClass = "text-violet";
    regimeTagClass = "border-violet/40 bg-violet/15 text-violet shadow-[0_0_6px_rgba(157,127,232,0.25)]";
    curveColor = "#9D7FE8";
  } else if (Math.abs(zeta - 1.0) < 0.04) {
    regimeName = "CRITICALLY DAMPED (ζ = 1)";
    regimeColorClass = "text-verdigris";
    regimeTagClass = "border-verdigris/40 bg-verdigris/15 text-verdigris shadow-[0_0_6px_rgba(79,169,138,0.25)]";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-violet">
              <span className="inline-block w-2 h-2 rounded-full bg-violet shadow-[0_0_6px_#9D7FE8] animate-pulse" />
              <Link href="/pid-lab" className="text-violet hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>RESONANCE &amp; DAMPING</span>
              <span>·</span>
              <span>SECOND-ORDER DYNAMICS</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Second-Order Harmonic System Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Investigate harmonic oscillation, peak overshoot, and decay envelopes across the three damping regimes: 
              underdamped (&zeta; &lt; 1), critically damped (&zeta; = 1), and overdamped (&zeta; &gt; 1).
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Damping &amp; Frequency
                </h2>
                <span className="font-mono text-[10px] text-text-faint">CLICK-TO-TYPE KNOBS</span>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                <RotaryKnob
                  label="DAMPING RATIO (ζ)"
                  value={zeta}
                  min={0.05}
                  max={2.5}
                  step={0.05}
                  precision={2}
                  onChange={setZeta}
                  accentColor="#9D7FE8"
                />

                <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
                  <RotaryKnob
                    label="NATURAL FREQ (ωn)"
                    value={wn}
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    precision={1}
                    unit="rad/s"
                    onChange={setWn}
                    accentColor="#9D7FE8"
                  />

                  <RotaryKnob
                    label="STEP INPUT (Δu)"
                    value={step}
                    min={0.5}
                    max={5.0}
                    step={0.5}
                    precision={1}
                    onChange={setStep}
                    accentColor="#9D7FE8"
                  />
                </div>
              </div>

              {/* Dynamic Regime Badge */}
              <div className="mt-4 rounded border border-[#2B251D] bg-[#100E0B] p-3.5 font-mono text-xs shadow-inner">
                <div className="text-text-faint text-[10px] uppercase tracking-wider mb-1">
                  CURRENT SYSTEM REGIME
                </div>
                <div className={`font-bold text-sm ${regimeColorClass}`}>{regimeName}</div>
                <p className="text-[11px] text-text-dim mt-1.5 leading-normal">
                  {zeta < 1.0
                    ? "Complex conjugate poles. Oscillatory transient response decaying at rate exp(-ζ·ωn·t)."
                    : Math.abs(zeta - 1.0) < 0.04
                    ? "Repeated real poles. Fastest monotonic rise to setpoint without overshoot."
                    : "Distinct real poles. Heavily sluggish, non-oscillatory monotonic rise."}
                </p>
              </div>
            </aside>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex justify-between items-center border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-lg font-semibold text-text">
                  Harmonic Trajectory y(t)
                </h2>
                <span className={`rounded border px-2.5 py-1 font-mono text-xs font-semibold ${regimeTagClass}`}>
                  {regimeName}
                </span>
              </div>

              <OscilloscopeCanvas
                data={simulationData}
                setpoint={step}
                minY={0}
                maxY={Math.ceil(Math.max(step * 1.4, maxVal * 1.15))}
                unit="mm"
                totalTime={20}
                dt={0.05}
                color={curveColor}
                showSecondary={false}
                height={380}
              />

              <div className="flex items-center justify-between font-mono text-xs text-text-faint border-t border-[#221D16] pt-3">
                <span>PEAK AMPLITUDE: {maxVal.toFixed(3)} mm</span>
                <span className="text-violet font-semibold">PHOSPHOR BEAM: VIOLET</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
