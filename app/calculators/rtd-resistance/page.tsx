"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { rtdResistance } from "@/lib/pid-math";

export default function RtdResistancePage() {
  const [tempC, setTempC] = useState(100.0);
  const [r0, setR0] = useState(100.0);
  const [alpha, setAlpha] = useState(0.00385);

  const resistance = rtdResistance(tempC, r0, alpha);
  const thermalFactor = 1 + alpha * tempC;

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/calculators" className="text-amber hover:underline">
              CALCULATORS
            </Link>
            <span>/</span>
            <span>RESISTANCE THERMOMETRY</span>
            <span>·</span>
            <span>PT100 RTD</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Pt100 RTD Resistance Scaler
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Calculate platinum resistance thermometer characteristics using Callendar-Van Dusen alpha coefficients (DIN/IEC 60751).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          <section className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Temperature &amp; Sensor Constants
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>PROCESS TEMPERATURE (T)</span>
                <span className="font-semibold text-amber">{tempC.toFixed(1)}°C</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={tempC}
                onChange={(e) => setTempC(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
              <input
                type="range"
                min="-50"
                max="400"
                step="1"
                value={tempC}
                onChange={(e) => setTempC(parseFloat(e.target.value))}
                className="mt-2"
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>BASE RESISTANCE AT 0°C (R0)</span>
                <span className="text-text-faint text-[10px]">100Ω NOMINAL</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={r0}
                onChange={(e) => setR0(parseFloat(e.target.value) || 100)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>TEMPERATURE COEFFICIENT (α)</span>
                <span className="text-text-faint text-[10px]">DIN STANDARD</span>
              </div>
              <input
                type="number"
                step="0.00001"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.00385)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2">
              Sensor Element Resistance
            </h2>

            <div className="rounded border border-line bg-panel-2 p-6 text-center">
              <div className="font-mono text-xs tracking-wider text-text-faint mb-1">
                MEASURED RESISTANCE R(T)
              </div>
              <div className="font-mono text-4xl font-bold text-amber drop-shadow-[0_0_12px_rgba(255,176,0,0.35)]">
                {resistance.toFixed(3)} Ω
              </div>
              <div className="font-mono text-xs text-text-dim mt-1">
                {tempC === 0
                  ? "EXACT BASELINE: 100.000 Ω AT 0°C (ICE POINT)"
                  : tempC === 100
                  ? "EXACT REFERENCE: 138.500 Ω AT 100°C (STEAM POINT)"
                  : `TEMPERATURE: ${tempC.toFixed(2)} °C`}
              </div>
            </div>

            {/* 3 Worked Steps */}
            <div>
              <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                LIVE STEP-BY-STEP CALCULATION
              </h3>
              <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs space-y-2">
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 1: Nominal Base</span>
                  <span className="text-text">
                    R0 = <strong className="text-amber">{r0.toFixed(2)} Ω</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 2: Thermal Factor [1 + α·T]</span>
                  <span className="text-text">
                    1 + ({alpha} × {tempC.toFixed(2)}) ={" "}
                    <strong className="text-amber">{thermalFactor.toFixed(5)}</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-faint">STEP 3: Total Resistance</span>
                  <span className="text-text">
                    R(T) = {r0.toFixed(2)} × {thermalFactor.toFixed(5)} ={" "}
                    <strong className="text-amber">{resistance.toFixed(3)} Ω</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
