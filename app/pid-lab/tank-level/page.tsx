"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import { simulateTankStandalone } from "@/lib/pid-math";

export default function TankLevelPage() {
  const [inflow, setInflow] = useState(50);
  const [outflowBase, setOutflowBase] = useState(0.6);
  const [gain, setGain] = useState(0.02);
  const [initialLevel, setInitialLevel] = useState(20);

  const simulationData = useMemo(() => {
    return simulateTankStandalone(inflow, outflowBase, gain, { initialLevel });
  }, [inflow, outflowBase, gain, initialLevel]);

  const finalLevel = simulationData[simulationData.length - 1] ?? initialLevel;

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
              <span>PROCESS DYNAMICS</span>
              <span>·</span>
              <span>GRAVITY DRAINAGE</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Standalone Tank-Level Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Explore open-loop mass balance equilibrium. Manipulate upstream supply flow, 
              gravity drainage resistance, and control valve sizing gain to observe self-regulating level dynamics.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Inflow &amp; Drainage Controls
                </h2>
                <span className="font-mono text-[10px] text-text-faint">CLICK-TO-TYPE KNOBS</span>
              </div>

              <div className="grid grid-cols-2 gap-4 justify-items-center py-2">
                <RotaryKnob
                  label="SUPPLY (Qin)"
                  value={inflow}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={setInflow}
                  accentColor="#FFB000"
                />

                <RotaryKnob
                  label="DRAIN COEFF"
                  value={outflowBase}
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  precision={2}
                  onChange={setOutflowBase}
                  accentColor="#FFB000"
                />

                <RotaryKnob
                  label="VALVE GAIN (Cv)"
                  value={gain}
                  min={0.005}
                  max={0.05}
                  step={0.005}
                  precision={3}
                  onChange={setGain}
                  accentColor="#FFB000"
                />

                <RotaryKnob
                  label="INITIAL LEVEL"
                  value={initialLevel}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={setInitialLevel}
                  accentColor="#FFB000"
                />
              </div>

              <div className="mt-5 rounded border border-[#2B251D] bg-[#100E0B] p-3 font-mono text-xs text-text-dim shadow-inner">
                <div className="text-amber mb-1 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  MASS BALANCE ODE
                </div>
                <div className="text-[11px] leading-relaxed">
                  dh/dt = 2 · [ (Inflow · ValveGain) - (OutflowBase · h / 100) ]
                </div>
              </div>
            </aside>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex justify-between items-center border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-lg font-semibold text-text">
                  Liquid Level Trajectory
                </h2>
                <span className="rounded border border-amber/40 bg-amber/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber shadow-[0_0_6px_rgba(255,176,0,0.2)]">
                  FINAL LEVEL: {finalLevel.toFixed(1)}%
                </span>
              </div>

              <OscilloscopeCanvas
                data={simulationData}
                minY={0}
                maxY={100}
                unit="%"
                totalTime={60}
                dt={0.1}
                color="#FFB000"
                showSecondary={false}
                height={380}
              />

              <div className="flex items-center justify-between font-mono text-xs text-text-faint border-t border-[#221D16] pt-3">
                <span>SIMULATION HORIZON: 60.0s (600 STEPS @ 100ms)</span>
                <span className="text-amber font-semibold">PHOSPHOR BEAM: ACTIVE</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
