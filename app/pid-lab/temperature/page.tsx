"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
import { simulateTemperature } from "@/lib/pid-math";

export default function TemperaturePage() {
  const [sp, setSp] = useState(80);
  const [amb, setAmb] = useState(25);
  const [kp, setKp] = useState(4.0);
  const [ki, setKi] = useState(0.2);
  const [kd, setKd] = useState(1.5);

  const simulationData = useMemo(() => {
    return simulateTemperature(kp, ki, kd, sp, amb);
  }, [kp, ki, kd, sp, amb]);

  const maxTemp = Math.max(...simulationData);

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
            <span>THERMODYNAMICS</span>
            <span>·</span>
            <span>ASYMMETRIC HEATING</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Temperature Control Process Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Observe thermal inertia and non-linear asymmetric cooling dynamics. 
            Because an electric element can only inject heat (P &ge; 0) and relies purely on ambient dissipation to cool down, 
            recovery from overshoot is inherently slower than symmetric processes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Controller &amp; Chamber Parameters
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>TARGET TEMPERATURE (SP)</span>
                <span className="font-semibold text-amber">{sp}°C</span>
              </div>
              <input
                type="range"
                min="30"
                max="150"
                step="1"
                value={sp}
                onChange={(e) => setSp(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>AMBIENT TEMPERATURE (Tamb)</span>
                <span className="font-semibold text-amber">{amb}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={amb}
                onChange={(e) => setAmb(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>HEATER PROPORTIONAL (Kp)</span>
                <span className="font-semibold text-amber">{kp.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={kp}
                onChange={(e) => setKp(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>HEATER INTEGRAL (Ki)</span>
                <span className="font-semibold text-amber">{ki.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.02"
                value={ki}
                onChange={(e) => setKi(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>HEATER DERIVATIVE (Kd)</span>
                <span className="font-semibold text-amber">{kd.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={kd}
                onChange={(e) => setKd(parseFloat(e.target.value))}
              />
            </div>
          </aside>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <div className="flex justify-between items-baseline">
              <h2 className="font-heading text-lg font-semibold text-text">
                Chamber Temperature Response
              </h2>
              <span className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                PEAK TEMP: {maxTemp.toFixed(1)}°C
              </span>
            </div>

            <ProcessCanvas
              data={simulationData}
              setpoint={sp}
              minY={Math.floor(amb - 5)}
              maxY={Math.ceil(Math.max(sp * 1.25, maxTemp + 5))}
              unit="°C"
              totalTime={80}
              dt={0.1}
              color="#FFB000"
              glowColor="rgba(255, 176, 0, 0.25)"
            />

            <div className="rounded border border-amber-dim bg-amber/10 p-3.5 font-mono text-xs text-amber leading-relaxed">
              <strong>PHYSICAL PROCESS ASYMMETRY:</strong> The heating element can only add heat (P &ge; 0). 
              If excessive gain overshoots setpoint, the heater drops to 0%, and cooling occurs strictly via 
              passive ambient dissipation: (T - Tamb)·h. Notice the slower downward settling slope compared to the heating ramp!
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
