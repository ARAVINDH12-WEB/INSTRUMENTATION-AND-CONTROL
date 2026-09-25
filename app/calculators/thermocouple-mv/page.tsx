"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";
import { thermocoupleTypeK_mV } from "@/lib/pid-math";

export default function ThermocouplePage() {
  const [tempC, setTempC] = useState(250.0);

  const mV = thermocoupleTypeK_mV(tempC);
  const seebeckCoeff = 0.041; // mV/°C

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
              <span>THERMOMETRY</span>
              <span>·</span>
              <span>TYPE K THERMOCOUPLE</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Type K Thermocouple Voltage Scaler
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Calculate approximate thermoelectric EMF output for nickel-chromium / nickel-alumel (Type K) junctions.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
            <section className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5 mb-4">
                Junction Temperature
              </h2>

              <div className="mb-5">
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>HOT JUNCTION TEMPERATURE (T)</span>
                  <span className="font-semibold text-amber">{tempC.toFixed(1)}°C</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={tempC}
                  onChange={(e) => setTempC(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
                <input
                  type="range"
                  min="0"
                  max="800"
                  step="1"
                  value={tempC}
                  onChange={(e) => setTempC(parseFloat(e.target.value))}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono text-xs">
                {[0, 100, 250, 500].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTempC(t)}
                    className={`rounded border px-2 py-1 text-center transition-colors ${
                      tempC === t
                        ? "border-amber bg-amber/15 text-amber shadow-[0_0_6px_rgba(255,176,0,0.2)]"
                        : "border-[#26211A] bg-[#12100C] text-text-dim hover:border-amber hover:text-amber"
                    }`}
                  >
                    {t}°C
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5">
                Thermoelectric EMF Output
              </h2>

              <OscilloscopeReadout
                label="SEEBECK VOLTAGE (ESTIMATED)"
                statusBadge="IEC 60584 CHROMEL-ALUMEL"
                variant="amber"
                value={`${mV}`}
                unit="mV"
                subtext="APPROXIMATE LINEAR SENSITIVITY (41 µV/°C)"
              />

              {/* Approximate Warning */}
              <div className="rounded border border-amber-dim bg-amber/10 p-3.5 font-mono text-xs text-amber leading-relaxed">
                <strong>APPROXIMATION NOTICE:</strong> Output is evaluated using the simplified linear sensitivity segment 
                (0–500°C, ~41 µV/°C). Actual industrial transmitters implement non-linear 9th-order polynomial NIST ITS-90 
                curves and cold junction compensation (CJC).
              </div>

              {/* 3 Worked Steps */}
              <div>
                <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                  LIVE STEP-BY-STEP CALCULATION
                </h3>
                <div className="rounded border-l-4 border-amber border-t border-r border-b border-[#2C261E] bg-[#100E0B] p-4 font-mono text-xs space-y-2 shadow-inner">
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 1: Hot Junction Temp</span>
                    <span className="text-text">
                      T = <strong className="text-amber">{tempC.toFixed(2)} °C</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 2: Seebeck Coefficient</span>
                    <span className="text-text">
                      α_approx = <strong className="text-amber">{seebeckCoeff} mV/°C (41 µV/°C)</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-text-faint">STEP 3: EMF Output</span>
                    <span className="text-text">
                      V = {tempC.toFixed(2)} × {seebeckCoeff} ={" "}
                      <strong className="text-amber">{mV} mV</strong>
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
