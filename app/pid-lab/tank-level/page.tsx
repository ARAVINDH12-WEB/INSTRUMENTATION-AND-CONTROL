"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/pid-lab" className="text-amber hover:underline">
              SIMULATION SUITE
            </Link>
            <span>/</span>
            <span>PROCESS DYNAMICS</span>
            <span>·</span>
            <span>GRAVITY DRAINAGE</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Standalone Tank-Level Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Explore open-loop mass balance equilibrium. Manipulate upstream supply flow, 
            gravity drainage resistance, and control valve sizing gain to observe self-regulating level dynamics.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Inflow &amp; Drainage Controls
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>INLET SUPPLY FLOW (Qin)</span>
                <span className="font-semibold text-amber">{inflow.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={inflow}
                onChange={(e) => setInflow(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>OUTFLOW COEFFICIENT</span>
                <span className="font-semibold text-amber">{outflowBase.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={outflowBase}
                onChange={(e) => setOutflowBase(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>VALVE GAIN (Cv)</span>
                <span className="font-semibold text-amber">{gain.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>INITIAL LEVEL (h0)</span>
                <span className="font-semibold text-amber">{initialLevel.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={initialLevel}
                onChange={(e) => setInitialLevel(parseFloat(e.target.value))}
              />
            </div>
          </aside>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <div className="flex justify-between items-baseline">
              <h2 className="font-heading text-lg font-semibold text-text">Liquid Level Trajectory</h2>
              <span className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                FINAL LEVEL: {finalLevel.toFixed(1)}%
              </span>
            </div>

            <ProcessCanvas
              data={simulationData}
              minY={0}
              maxY={100}
              unit="%"
              totalTime={60}
              dt={0.1}
              color="#4FA98A"
              glowColor="rgba(79, 169, 138, 0.3)"
            />

            <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs">
              <span className="text-text-faint mr-2">[MODEL]</span>
              <span className="text-text">
                dh/dt = 2 · [ (Inflow · ValveGain) - (OutflowBase · h / 100) ]
              </span>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
