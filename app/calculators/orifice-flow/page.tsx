"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { orificeFlow } from "@/lib/pid-math";

export default function OrificeFlowPage() {
  const [cd, setCd] = useState(0.62); // discharge coeff
  const [area, setArea] = useState(0.00785); // 100mm dia bore = pi/4 * 0.1^2 ~ 0.00785 m^2
  const [dp, setDp] = useState(25000); // 25 kPa = 25,000 Pa
  const [density, setDensity] = useState(1000); // 1000 kg/m^3 (water)

  const isInvalidDensity = density <= 0;
  const isInvalidDp = dp < 0;
  const flow = isInvalidDensity || isInvalidDp ? 0 : orificeFlow(cd, area, dp, density);
  const velocityHead = isInvalidDensity || isInvalidDp ? 0 : Math.sqrt((2 * dp) / density);
  const flowLps = flow * 1000;

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
            <span>DIFFERENTIAL PRESSURE FLOW</span>
            <span>·</span>
            <span>ORIFICE PLATE (ISO 5167)</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Orifice Plate Flow Rate Calculator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Evaluate volumetric discharge rate through a thin, concentric square-edged orifice plate 
            from differential pressure (&Delta;P) and fluid density (&rho;).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          <section className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Fluid &amp; Plate Parameters
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>DISCHARGE COEFFICIENT (Cd)</span>
                <span className="font-semibold text-amber">{cd.toFixed(3)}</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={cd}
                onChange={(e) => setCd(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>ORIFICE BORE AREA (m²)</span>
                <span className="font-semibold text-amber">{area.toFixed(5)} m²</span>
              </div>
              <input
                type="number"
                step="0.0001"
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>DIFFERENTIAL PRESSURE &Delta;P (Pa)</span>
                <span className="font-semibold text-amber">{dp.toFixed(0)} Pa</span>
              </div>
              <input
                type="number"
                step="500"
                value={dp}
                onChange={(e) => setDp(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>FLUID DENSITY &rho; (kg/m³)</span>
                <span className="font-semibold text-amber">{density.toFixed(1)} kg/m³</span>
              </div>
              <input
                type="number"
                step="10"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2">
              Volumetric Discharge
            </h2>

            <div className="rounded border border-line bg-panel-2 p-6 text-center">
              <div className="font-mono text-xs tracking-wider text-text-faint mb-1">
                VOLUMETRIC FLOW RATE (Q)
              </div>
              <div className="font-mono text-4xl font-bold text-amber drop-shadow-[0_0_12px_rgba(255,176,0,0.35)]">
                {flow.toFixed(4)} m³/s
              </div>
              <div className="font-mono text-xs text-text-dim mt-1">
                EQUIVALENT: {flowLps.toFixed(2)} L/s · {(flow * 3600).toFixed(1)} m³/h
              </div>
            </div>

            {/* Error alerts */}
            {isInvalidDensity && (
              <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                <strong>[INVALID DENSITY]:</strong> Fluid density must be greater than zero.
              </div>
            )}
            {isInvalidDp && (
              <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                <strong>[INVALID PRESSURE]:</strong> Differential pressure &Delta;P cannot be negative.
              </div>
            )}

            {/* 3 Worked Steps */}
            <div>
              <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                LIVE STEP-BY-STEP WORKED CALCULATION
              </h3>
              <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs space-y-2">
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 1: Velocity Head √(2·ΔP / ρ)</span>
                  <span className="text-text">
                    √( (2 × {dp}) / {density} ) ={" "}
                    <strong className="text-amber">{velocityHead.toFixed(3)} m/s</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 2: Discharge Bore Area</span>
                  <span className="text-text">
                    Cd × Area = {cd} × {area} ={" "}
                    <strong className="text-amber">{(cd * area).toFixed(5)} m²</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-faint">STEP 3: Volumetric Rate Q</span>
                  <span className="text-text">
                    {(cd * area).toFixed(5)} × {velocityHead.toFixed(3)} ={" "}
                    <strong className="text-amber">{flow.toFixed(4)} m³/s</strong>
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
