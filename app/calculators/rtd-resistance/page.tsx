"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
              <span className="inline-block w-2 h-2 rounded-full bg-amber shadow-[0_0_6px_#FFB000] animate-pulse" />
              <Link href="/calculators" className="text-amber hover:underline">
                CALCULATORS
              </Link>
              <span>/</span>
              <span>RESISTANCE THERMOMETRY</span>
              <span>·</span>
              <span>PT100 RTD</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Pt100 RTD Resistance Scaler
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Calculate platinum resistance thermometer characteristics using Callendar-Van Dusen alpha coefficients (DIN/IEC 60751).
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
            <section className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5 mb-4">
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
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
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
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
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
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
              </div>
            </section>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5">
                Sensor Element Resistance
              </h2>

              <OscilloscopeReadout
                label="MEASURED RESISTANCE R(T)"
                statusBadge="DIN/IEC 60751 PLATINUM BUS"
                variant="amber"
                value={`${resistance.toFixed(3)}`}
                unit="Ω"
                subtext={
                  tempC === 0
                    ? "EXACT BASELINE: 100.000 Ω AT 0°C (ICE POINT)"
                    : tempC === 100
                    ? "EXACT REFERENCE: 138.500 Ω AT 100°C (STEAM POINT)"
                    : `EXACT TEMPERATURE: ${tempC.toFixed(2)} °C`
                }
              />

              {/* 3 Worked Steps */}
              <div>
                <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                  LIVE STEP-BY-STEP CALCULATION
                </h3>
                <div className="rounded border-l-4 border-amber border-t border-r border-b border-[#2C261E] bg-[#100E0B] p-4 font-mono text-xs space-y-2 shadow-inner">
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 1: Nominal Base</span>
                    <span className="text-text">
                      R0 = <strong className="text-amber">{r0.toFixed(2)} Ω</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
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
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
