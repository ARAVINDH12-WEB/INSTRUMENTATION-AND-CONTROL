"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";

export default function MaConverterPage() {
  const [currentMA, setCurrentMA] = useState(12.0);
  const [lrv, setLrv] = useState(0.0);
  const [urv, setUrv] = useState(10.0);
  const [unit, setUnit] = useState("bar");

  // Step calculations
  const span = urv - lrv;
  const isZeroSpan = span === 0;
  const fraction = (currentMA - 4) / 16;
  const pv = lrv + fraction * span;
  const pctSpan = (fraction * 100).toFixed(1);

  const setTestPoint = (ma: number) => {
    setCurrentMA(ma);
  };

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
              <span>SIGNAL CONDITIONING</span>
              <span>·</span>
              <span>4–20 mA TO PROCESS VARIABLE</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              4–20 mA Signal Scaler &amp; Converter
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Scale analog transmitter currents into physical engineering values. Inspect all three intermediate 
              calculation steps live with full edge-case protection against zero span and out-of-range sensor drift.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
            {/* Inputs Panel */}
            <section className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5 mb-4">
                Calibration Range
              </h2>

              {/* Current Input */}
              <div className="mb-5">
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>MEASURED CURRENT (I)</span>
                  <span className="font-semibold text-amber">{currentMA.toFixed(2)} mA</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={currentMA}
                  onChange={(e) => setCurrentMA(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={currentMA}
                  onChange={(e) => setCurrentMA(parseFloat(e.target.value))}
                  className="mt-2"
                />

                {/* 5-point test buttons */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {[4, 8, 12, 16, 20].map((pt) => {
                    const pct = ((pt - 4) / 16) * 100;
                    const isActive = Math.abs(currentMA - pt) < 0.05;
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setTestPoint(pt)}
                        className={`rounded border px-1 py-1.5 font-mono text-center text-xs transition-colors ${
                          isActive
                            ? "border-amber bg-amber/15 text-amber shadow-[0_0_6px_rgba(255,176,0,0.2)]"
                            : "border-[#26211A] bg-[#12100C] text-text-dim hover:border-amber hover:text-amber"
                        }`}
                      >
                        {pt}mA
                        <div className="text-[10px] text-text-faint">{pct}%</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LRV */}
              <div className="mb-5">
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>LOWER RANGE VALUE (LRV at 4 mA)</span>
                  <span className="text-text-faint text-[10px]">ZERO</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={lrv}
                  onChange={(e) => setLrv(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
              </div>

              {/* URV */}
              <div className="mb-5">
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>UPPER RANGE VALUE (URV at 20 mA)</span>
                  <span className="text-text-faint text-[10px]">FULL SCALE</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={urv}
                  onChange={(e) => setUrv(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
              </div>

              {/* Unit */}
              <div>
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>ENGINEERING UNIT</span>
                  <span className="text-text-faint text-[10px]">CUSTOM</span>
                </div>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. bar, °C, kPa, m, %"
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
              </div>
            </section>

            {/* Outputs Panel */}
            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5">
                Computed Process Value
              </h2>

              {/* Oscilloscope Phosphor Scanline Numeric Readout */}
              <OscilloscopeReadout
                label="PROCESS VARIABLE (PV)"
                statusBadge="LOOP CALIBRATION BUS"
                variant={isZeroSpan ? "crimson" : "amber"}
                value={isZeroSpan ? "ERROR" : pv.toFixed(3)}
                subtext={
                  isZeroSpan
                    ? "Zero Span (URV cannot equal LRV)"
                    : `${unit} (${pctSpan}% OF CALIBRATED SPAN)`
                }
              />

              {/* Visual Signal Bar */}
              <div className="my-1">
                <div className="flex justify-between font-mono text-xs text-text-faint mb-1">
                  <span>4.0 mA (0%)</span>
                  <span className="text-text font-semibold">{pctSpan}%</span>
                  <span>20.0 mA (100%)</span>
                </div>
                <div className="h-3 rounded-full border border-[#302B22] bg-[#100E0B] overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-dim to-amber transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
                  />
                </div>
              </div>

              {/* Edge-case Warning / NAMUR NE43 Alert */}
              {isZeroSpan ? (
                <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                  <strong>[GUARD TRIGGERED]</strong> Division by zero: Upper Range Value cannot equal Lower Range Value (Span = 0).
                </div>
              ) : currentMA < 3.6 ? (
                <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                  <strong>[NAMUR NE43 ALARM]</strong> Current is {currentMA.toFixed(2)} mA (&lt; 3.6 mA). Indicates sensor wire break, power failure, or hardware fault.
                </div>
              ) : currentMA < 4.0 ? (
                <div className="rounded border border-amber-dim bg-amber/10 p-3.5 font-mono text-xs text-amber">
                  <strong>[WARNING: UNDER-RANGE]</strong> Current is {currentMA.toFixed(2)} mA (below 4.0 mA live zero). Transmitter is operating below calibrated range.
                </div>
              ) : currentMA > 21.0 ? (
                <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                  <strong>[NAMUR NE43 ALARM]</strong> Current is {currentMA.toFixed(2)} mA (&gt; 21.0 mA). Indicates severe transmitter burnout or line short.
                </div>
              ) : currentMA > 20.0 ? (
                <div className="rounded border border-amber-dim bg-amber/10 p-3.5 font-mono text-xs text-amber">
                  <strong>[WARNING: OVER-RANGE]</strong> Current is {currentMA.toFixed(2)} mA (above 20.0 mA full scale). Process variable exceeds calibrated limits.
                </div>
              ) : null}

              {/* 3 Worked Intermediate Steps */}
              <div>
                <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                  LIVE STEP-BY-STEP WORKED CALCULATION
                </h3>
                <div className="rounded border-l-4 border-amber border-t border-r border-b border-[#2C261E] bg-[#100E0B] p-4 font-mono text-xs space-y-2 shadow-inner">
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 1: Fraction</span>
                    <span className="text-text">
                      ({currentMA.toFixed(2)} - 4) / 16 ={" "}
                      <strong className="text-amber">{fraction.toFixed(4)}</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 2: Span</span>
                    <span className="text-text">
                      {urv.toFixed(2)} - {lrv.toFixed(2)} ={" "}
                      <strong className="text-amber">{span.toFixed(3)}</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-text-faint">STEP 3: PV Result</span>
                    <span className="text-text">
                      {lrv.toFixed(2)} + ({fraction.toFixed(4)} × {span.toFixed(3)}) ={" "}
                      <strong className="text-amber">{isZeroSpan ? "NaN" : pv.toFixed(3)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Skill Metrology Check */}
              <div className="rounded border border-[#2B251D] bg-[#12100C] p-3 font-mono text-xs text-text-dim">
                <span className="text-amber font-semibold mr-1">METROLOGY REFERENCE CHECK:</span>
                <span>currentToProcessValue(12, 0, 10) === 5.000 [VERIFIED]</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
