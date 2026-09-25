"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
              <span className="inline-block w-2 h-2 rounded-full bg-amber shadow-[0_0_6px_#FFB000] animate-pulse" />
              <Link href="/pid-lab" className="text-amber hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>LINEAR TIME-INVARIANT</span>
              <span>·</span>
              <span>STEP RESPONSE</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              First-Order Process Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Analyze classic first-order lag transfer functions: G(s) = K / (&tau;s + 1). 
              Verify that output reaches 63.2% of steady state at t = &tau; and settles within 99.3% at 5&tau;.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Transfer Function
                </h2>
                <span className="font-mono text-[10px] text-text-faint">CLICK-TO-TYPE KNOBS</span>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                <RotaryKnob
                  label="STEADY GAIN (K)"
                  value={gain}
                  min={0.2}
                  max={10.0}
                  step={0.1}
                  precision={1}
                  onChange={setGain}
                  accentColor="#FFB000"
                />

                <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
                  <RotaryKnob
                    label="TIME CONST (τ)"
                    value={tau}
                    min={0.5}
                    max={15.0}
                    step={0.5}
                    precision={1}
                    unit="s"
                    onChange={setTau}
                    accentColor="#FFB000"
                  />

                  <RotaryKnob
                    label="STEP INPUT (Δu)"
                    value={step}
                    min={0.5}
                    max={5.0}
                    step={0.5}
                    precision={1}
                    onChange={setStep}
                    accentColor="#FFB000"
                  />
                </div>
              </div>

              <div className="mt-5 rounded border border-[#2B251D] bg-[#100E0B] p-3.5 font-mono text-xs text-text-dim shadow-inner">
                <div className="text-amber mb-1 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  CLASSIC FIRST-ORDER ODE
                </div>
                <div className="text-[11px] leading-relaxed">
                  τ · dy/dt + y = K · u(t) &DoubleLongRightArrow; y(t) = K·Δu·(1 - e^(-t/τ))
                </div>
              </div>
            </aside>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex justify-between items-center border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-lg font-semibold text-text">
                  Output Curve y(t)
                </h2>
                <span className="rounded border border-amber/40 bg-amber/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber shadow-[0_0_6px_rgba(255,176,0,0.2)]">
                  y({tau.toFixed(1)}s) = {valAtTau.toFixed(2)} (63.2%)
                </span>
              </div>

              <OscilloscopeCanvas
                data={simulationData}
                setpoint={steadyState}
                minY={0}
                maxY={Math.ceil(steadyState * 1.25)}
                unit=""
                totalTime={30}
                dt={0.1}
                color="#FFB000"
                showSecondary={false}
                height={380}
              />

              <div className="flex items-center justify-between font-mono text-xs text-text-faint border-t border-[#221D16] pt-3">
                <span>30.0s HORIZON (300 STEPS @ 100ms)</span>
                <span className="text-amber font-semibold">STEADY STATE: {steadyState.toFixed(2)}</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
