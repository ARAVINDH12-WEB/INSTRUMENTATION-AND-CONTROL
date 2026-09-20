"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
import { simulateFirstOrder } from "@/lib/pid-math";

export default function FirstOrderPage() {
  const [gain, setGain] = useState(2.5);
  const [tau, setTau] = useState(4.0);
  const [step, setStep] = useState(1.0);

  const simulationData = useMemo(() => {
    return simulateFirstOrder(gain, tau, step);
  }, [gain, tau, step]);

  const steadyState = gain * step;
  const valAtTau = steadyState * 0.632;

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
            <span>LINEAR TIME-INVARIANT</span>
            <span>·</span>
            <span>STEP RESPONSE</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            First-Order Process Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Analyze classic first-order lag transfer functions: G(s) = K / (&tau;s + 1). 
            Verify that output reaches 63.2% of steady state at t = &tau; and settles within 99.3% at 5&tau;.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Transfer Function
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>STEADY-STATE GAIN (K)</span>
                <span className="font-semibold text-amber">{gain.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>TIME CONSTANT (&tau;)</span>
                <span className="font-semibold text-amber">{tau.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={tau}
                onChange={(e) => setTau(parseFloat(e.target.value))}
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
              <h2 className="font-heading text-lg font-semibold text-text">Output Curve y(t)</h2>
              <span className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                y({tau.toFixed(1)}s) = {valAtTau.toFixed(2)} (63.2%)
              </span>
            </div>

            <ProcessCanvas
              data={simulationData}
              setpoint={steadyState}
              minY={0}
              maxY={Math.ceil(steadyState * 1.25)}
              totalTime={30}
              dt={0.1}
              color="#FFB000"
              glowColor="rgba(255, 176, 0, 0.25)"
            />

            <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs">
              <div className="border-b border-dashed border-line-soft pb-2 mb-2">
                <span className="text-text-faint mr-2">[ODE]</span>
                <span className="text-text">
                  &tau; · dy/dt + y = K · u(t) &ensp;&DoubleLongRightArrow;&ensp; y(t) = K · &Delta;u · (1 - e^(-t/&tau;))
                </span>
              </div>
              <div>
                <span className="text-text-faint mr-2">[BENCH]</span>
                <span className="text-text">
                  At t = &tau;: 63.2% | At t = 3&tau;: 95.0% | At t = 5&tau;: 99.3% (Settled)
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
