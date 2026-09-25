"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";

type FailureRateUnit = "per_hour" | "fit" | "per_year";
type IntervalUnit = "years" | "months" | "hours";

interface SilRange {
  sil: string;
  lowDemandRange: string;
  minPfd: number;
  maxPfd: number;
  minRrf: number;
  maxRrf: number;
  description: string;
}

const SIL_BANDS: SilRange[] = [
  {
    sil: "SIL 4",
    lowDemandRange: "≥ 10⁻⁵ to < 10⁻⁴",
    minPfd: 1e-5,
    maxPfd: 1e-4,
    minRrf: 10000,
    maxRrf: 100000,
    description: "Catastrophic community risk mitigation (extremely rare in process industry)",
  },
  {
    sil: "SIL 3",
    lowDemandRange: "≥ 10⁻⁴ to < 10⁻³",
    minPfd: 1e-4,
    maxPfd: 1e-3,
    minRrf: 1000,
    maxRrf: 10000,
    description: "High-consequence hazardous event (toxic release, major explosion)",
  },
  {
    sil: "SIL 2",
    lowDemandRange: "≥ 10⁻³ to < 10⁻²",
    minPfd: 1e-3,
    maxPfd: 1e-2,
    minRrf: 100,
    maxRrf: 1000,
    description: "Significant commercial/personnel hazard (typical refinery ESD & HIPPS)",
  },
  {
    sil: "SIL 1",
    lowDemandRange: "≥ 10⁻² to < 10⁻¹",
    minPfd: 1e-2,
    maxPfd: 1e-1,
    minRrf: 10,
    maxRrf: 100,
    description: "Moderate equipment protection / localized containment safety loop",
  },
];

export default function SilPfdCalculatorPage() {
  // Inputs
  const [lambdaDInput, setLambdaDInput] = useState<string>("5e-7");
  const [lambdaUnit, setLambdaUnit] = useState<FailureRateUnit>("per_hour");
  const [tInput, setTInput] = useState<string>("1");
  const [tUnit, setTUnit] = useState<IntervalUnit>("years");

  // Parse raw inputs
  const rawLambda = parseFloat(lambdaDInput);
  const rawT = parseFloat(tInput);

  // Conversion to normalized SI units (failures per hour, hours of interval)
  let lambdaPerHour = 0;
  if (!isNaN(rawLambda)) {
    if (lambdaUnit === "per_hour") {
      lambdaPerHour = rawLambda;
    } else if (lambdaUnit === "fit") {
      lambdaPerHour = rawLambda * 1e-9;
    } else if (lambdaUnit === "per_year") {
      lambdaPerHour = rawLambda / 8760;
    }
  }

  let tHours = 0;
  if (!isNaN(rawT)) {
    if (tUnit === "years") {
      tHours = rawT * 8760;
    } else if (tUnit === "months") {
      tHours = rawT * 730;
    } else if (tUnit === "hours") {
      tHours = rawT;
    }
  }

  // Edge cases
  const isInvalidLambda = isNaN(rawLambda) || rawLambda < 0;
  const isZeroOrNegativeT = isNaN(rawT) || rawT <= 0;
  const isZeroLambda = rawLambda === 0;

  // PFD_avg calculation: PFD_avg ≈ (lambda_D * T) / 2
  const pfdAvg = !isInvalidLambda && !isZeroOrNegativeT ? (lambdaPerHour * tHours) / 2 : NaN;
  const isNonPhysical = !isNaN(pfdAvg) && pfdAvg > 1.0;
  const rrf = !isNaN(pfdAvg) && pfdAvg > 0 ? 1 / pfdAvg : NaN;

  // Determine SIL Band
  const getSilBand = (val: number): { label: string; color: string; badge: string } => {
    if (isNaN(val) || isNonPhysical) return { label: "N/A", color: "text-text-faint", badge: "INVALID" };
    if (val < 1e-5) return { label: "Exceeds SIL 4", color: "text-cyan-400", badge: "PFD < 10⁻⁵" };
    if (val < 1e-4) return { label: "SIL 4", color: "text-verdigris", badge: "LOW DEMAND" };
    if (val < 1e-3) return { label: "SIL 3", color: "text-verdigris", badge: "LOW DEMAND" };
    if (val < 1e-2) return { label: "SIL 2", color: "text-amber", badge: "LOW DEMAND" };
    if (val < 1e-1) return { label: "SIL 1", color: "text-amber-dim", badge: "LOW DEMAND" };
    return { label: "No SIL (< SIL 1)", color: "text-crimson", badge: "PFD ≥ 0.1" };
  };

  const currentSil = getSilBand(pfdAvg);

  // Preset Handler
  const applyPreset = (lambdaVal: string, lUnit: FailureRateUnit, tVal: string, tU: IntervalUnit) => {
    setLambdaDInput(lambdaVal);
    setLambdaUnit(lUnit);
    setTInput(tVal);
    setTUnit(tU);
  };

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          {/* Breadcrumb & Header */}
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
              <span className="inline-block w-2 h-2 rounded-full bg-amber shadow-[0_0_6px_#FFB000] animate-pulse" />
              <Link href="/calculators" className="text-amber hover:underline">
                CALCULATORS
              </Link>
              <span>/</span>
              <span>FUNCTIONAL SAFETY (IEC 61508 / 61511)</span>
              <span>·</span>
              <span>PFDavg &amp; SIL ESTIMATION</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              SIL PFD<sub>avg</sub> &amp; Risk Reduction Calculator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Calculate the average Probability of Failure on Demand (PFD<sub>avg</sub>) and corresponding Risk Reduction 
              Factor (RRF) for low-demand safety instrumented functions. Features live 3-step worked derivations, 
              unit normalizations, and low-demand SIL 1–4 compliance mapping.
            </p>
          </header>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
            {/* Inputs Column */}
            <section className="rounded border border-[#302B22] bg-[#16130F] p-6 space-y-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Safety Function Parameters
                </h2>
                <p className="font-mono text-xs text-text-faint mt-0.5">
                  Enter equipment dangerous failure rate &amp; proof-test schedule
                </p>
              </div>

            {/* Presets */}
            <div>
              <label className="block font-mono text-xs text-text-dim mb-2 uppercase tracking-wider">
                Industrial Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("5e-7", "per_hour", "1", "years")}
                  className="rounded border border-line bg-panel-2 p-2 text-left hover:border-amber transition-colors"
                >
                  <div className="font-mono text-xs text-text font-semibold">Pressure Transmitter</div>
                  <div className="font-mono text-[10px] text-text-faint">500 FIT · T = 1 yr (SIL 2)</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("1.2e-6", "per_hour", "6", "months")}
                  className="rounded border border-line bg-panel-2 p-2 text-left hover:border-amber transition-colors"
                >
                  <div className="font-mono text-xs text-text font-semibold">ESD Trip Valve</div>
                  <div className="font-mono text-[10px] text-text-faint">1,200 FIT · T = 6 mo (SIL 2)</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("1e-8", "per_hour", "2", "years")}
                  className="rounded border border-line bg-panel-2 p-2 text-left hover:border-amber transition-colors"
                >
                  <div className="font-mono text-xs text-text font-semibold">Safety Logic Solver</div>
                  <div className="font-mono text-[10px] text-text-faint">10 FIT · T = 2 yr (SIL 4)</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("5e-5", "per_hour", "1", "years")}
                  className="rounded border border-line bg-panel-2 p-2 text-left hover:border-crimson transition-colors"
                >
                  <div className="font-mono text-xs text-text font-semibold">High-Failure Device</div>
                  <div className="font-mono text-[10px] text-crimson">50,000 FIT · T = 1 yr (No SIL)</div>
                </button>
              </div>
            </div>

            {/* Dangerous Failure Rate (λ_D) */}
            <div>
              <div className="flex justify-between items-baseline font-mono text-xs text-text-dim mb-1">
                <span>DANGEROUS FAILURE RATE (λ<sub>D</sub>)</span>
                <span className="text-amber font-semibold">
                  {!isInvalidLambda ? `${rawLambda.toExponential(3)}` : "INVALID"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lambdaDInput}
                  onChange={(e) => setLambdaDInput(e.target.value)}
                  placeholder="e.g. 5e-7 or 0.0000005"
                  className="flex-1 rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
                />
                <select
                  value={lambdaUnit}
                  onChange={(e) => setLambdaUnit(e.target.value as FailureRateUnit)}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 font-mono text-xs text-text focus:border-amber focus:outline-none"
                >
                  <option value="per_hour">failures / hour (h⁻¹)</option>
                  <option value="fit">FIT (failures / 10⁹ h)</option>
                  <option value="per_year">failures / year (yr⁻¹)</option>
                </select>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-text-faint">
                Normalized: <span className="text-text">{lambdaPerHour.toExponential(4)} failures/hr</span>
              </p>
            </div>

            {/* Proof-Test Interval (T) */}
            <div>
              <div className="flex justify-between items-baseline font-mono text-xs text-text-dim mb-1">
                <span>PROOF-TEST INTERVAL (T)</span>
                <span className="text-amber font-semibold">
                  {!isZeroOrNegativeT ? `${rawT} ${tUnit}` : "INVALID (T ≤ 0)"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={tInput}
                  onChange={(e) => setTInput(e.target.value)}
                  placeholder="e.g. 1"
                  className="flex-1 rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
                />
                <select
                  value={tUnit}
                  onChange={(e) => setTUnit(e.target.value as IntervalUnit)}
                  className="rounded border border-line bg-panel-2 px-2.5 py-2 font-mono text-xs text-text focus:border-amber focus:outline-none"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              <div className="flex justify-between items-center mt-1.5 font-mono text-[11px] text-text-faint">
                <span>Equivalent operating hours:</span>
                <span className="text-text font-semibold">{tHours.toLocaleString()} hours</span>
              </div>

              {/* Quick interval buttons */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {[
                  { label: "6 mo", val: "6", u: "months" as IntervalUnit },
                  { label: "1 yr", val: "1", u: "years" as IntervalUnit },
                  { label: "2 yr", val: "2", u: "years" as IntervalUnit },
                  { label: "5 yr", val: "5", u: "years" as IntervalUnit },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => {
                      setTInput(btn.val);
                      setTUnit(btn.u);
                    }}
                    className={`rounded border px-2 py-1 font-mono text-xs text-center transition-colors ${
                      tInput === btn.val && tUnit === btn.u
                        ? "border-amber bg-amber/15 text-amber"
                        : "border-line bg-panel-2 text-text-dim hover:border-amber hover:text-text"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Architectural Mode Banner */}
            <div className="rounded border border-line-soft bg-panel-2 p-3 font-mono text-xs space-y-1">
              <div className="text-text font-semibold flex items-center justify-between">
                <span>SIF OPERATING MODE:</span>
                <span className="text-verdigris">LOW DEMAND (&lt; 1 / yr)</span>
              </div>
              <div className="text-text-faint text-[11px]">
                Approximation standard: IEC 61508-6 Table B.2 / IEC 61511 1oo1 Simplex model.
              </div>
            </div>
          </section>

          {/* Outputs Column */}
          <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
            <div className="border-b border-[#26211A] pb-2.5 flex items-center justify-between">
              <h2 className="font-panel-heading text-base font-semibold text-text">
                Computed Functional Safety Integrity
              </h2>
              <span className="font-mono text-xs text-text-faint">LOW-DEMAND MODE</span>
            </div>

            {/* Hero Result Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* PFD_avg Display */}
              <OscilloscopeReadout
                label="AVG PFD (PFDavg)"
                statusBadge="IEC 61508"
                variant={isInvalidLambda || isZeroOrNegativeT || isNonPhysical ? "crimson" : "amber"}
                size="md"
                value={
                  isInvalidLambda || isZeroOrNegativeT
                    ? "ERROR"
                    : isNonPhysical
                    ? "> 1.0 (INVALID)"
                    : pfdAvg.toExponential(3)
                }
                subtext={
                  !isInvalidLambda && !isZeroOrNegativeT && !isNonPhysical
                    ? `≈ ${(pfdAvg * 100).toFixed(4)}% probability`
                    : "Out of bounds"
                }
              />

              {/* RRF Display */}
              <OscilloscopeReadout
                label="RISK REDUCTION (RRF)"
                statusBadge="1 / PFD"
                variant={isInvalidLambda || isZeroOrNegativeT || isNonPhysical ? "crimson" : "amber"}
                size="md"
                value={
                  isInvalidLambda || isZeroOrNegativeT
                    ? "ERROR"
                    : isNonPhysical
                    ? "< 1"
                    : isZeroLambda
                    ? "∞ (THEORETICAL)"
                    : rrf >= 1000
                    ? rrf.toFixed(0)
                    : rrf.toFixed(1)
                }
                subtext={
                  !isInvalidLambda && !isZeroOrNegativeT && !isNonPhysical && !isZeroLambda
                    ? `1 in ${Math.round(rrf)} demand failures`
                    : "1 / PFD_avg"
                }
              />

              {/* SIL Band Display */}
              <OscilloscopeReadout
                label="INTEGRITY BAND"
                statusBadge="SAFETY LEVEL"
                variant={
                  currentSil.color.includes("verdigris")
                    ? "verdigris"
                    : currentSil.color.includes("crimson")
                    ? "crimson"
                    : "amber"
                }
                size="md"
                value={currentSil.label}
                subtext={currentSil.badge}
              />
            </div>

            {/* Edge-Case Guards / Diagnostic Alerts */}
            {isZeroOrNegativeT ? (
              <div className="rounded border border-crimson bg-crimson/15 p-4 font-mono text-xs text-crimson">
                <strong>[GUARD TRIGGERED — INVALID INTERVAL]</strong> Proof-test interval (T) must be strictly 
                positive (T &gt; 0). A proof-test interval of zero or negative time cannot establish a periodic 
                inspection cycle, resulting in an undefined or physically impossible safety availability.
              </div>
            ) : isInvalidLambda ? (
              <div className="rounded border border-crimson bg-crimson/15 p-4 font-mono text-xs text-crimson">
                <strong>[GUARD TRIGGERED — NEGATIVE FAILURE RATE]</strong> Dangerous failure rate (λ<sub>D</sub>) 
                cannot be negative. Random hardware failures are non-negative stochastic arrival processes.
              </div>
            ) : isNonPhysical ? (
              <div className="rounded border border-crimson bg-crimson/15 p-4 font-mono text-xs text-crimson space-y-1">
                <div>
                  <strong>[GUARD TRIGGERED — NON-PHYSICAL PROBABILITY (PFD<sub>avg</sub> &gt; 1.0)]</strong>
                </div>
                <p>
                  At current inputs, the calculated PFD<sub>avg</sub> is <strong>{pfdAvg.toFixed(3)}</strong>, which 
                  exceeds 1.0 (100% probability). Failure probability cannot physically exceed 1.0. At λ<sub>D</sub> · T &gt; 2, 
                  the linear approximation breaks down completely because the instrument is virtually guaranteed to fail 
                  well before the proof-test inspection arrives. Shorten the proof-test interval or specify a higher-reliability element.
                </p>
              </div>
            ) : isZeroLambda ? (
              <div className="rounded border border-amber bg-amber/10 p-3.5 font-mono text-xs text-amber">
                <strong>[THEORETICAL NOTICE]</strong> With λ<sub>D</sub> = 0, PFD<sub>avg</sub> is 0.0 (RRF = ∞). 
                In industrial process instrumentation, no real physical sensor, logic solver, or mechanical valve has a 
                zero failure rate.
              </div>
            ) : null}

            {/* Live Step-by-Step Worked Derivation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-text-dim uppercase tracking-wider">
                  LIVE STEP-BY-STEP WORKED DERIVATION
                </h3>
                <span className="font-mono text-[10px] text-text-faint">SIMPLEX 1oo1 MODEL</span>
              </div>
              <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs space-y-3">
                {/* Step 1 */}
                <div className="border-b border-dashed border-line-soft pb-2.5">
                  <div className="text-text-faint text-[10px] mb-1">
                    STEP 1: LOW-DEMAND SIMPLEX PFD FORMULA
                  </div>
                  <div className="text-text flex flex-wrap items-center gap-2">
                    <span className="bg-panel px-2 py-0.5 rounded border border-line text-amber">
                      PFD<sub>avg</sub> ≈ (λ<sub>D</sub> × T) / 2
                    </span>
                    <span className="text-text-faint text-[11px]">
                      where λ<sub>D</sub> is dangerous failure rate &amp; T is proof-test interval in hours
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-b border-dashed border-line-soft pb-2.5">
                  <div className="text-text-faint text-[10px] mb-1">
                    STEP 2: PARAMETER SUBSTITUTION (NORMALIZED TO HOURS)
                  </div>
                  <div className="text-text">
                    PFD<sub>avg</sub> ≈ (
                    <span className="text-amber font-semibold">{lambdaPerHour.toExponential(3)} h⁻¹</span> ×{" "}
                    <span className="text-amber font-semibold">{tHours.toLocaleString()} h</span>
                    ) / 2
                  </div>
                  <div className="text-text-faint text-[11px] mt-1">
                    Total accumulated failure product (λ<sub>D</sub> × T) ={" "}
                    <strong className="text-text">
                      {!isInvalidLambda && !isZeroOrNegativeT ? (lambdaPerHour * tHours).toExponential(4) : "—"}
                    </strong>
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <div className="text-text-faint text-[10px] mb-1">
                    STEP 3: COMPUTED PROBABILITY &amp; RISK REDUCTION FACTOR
                  </div>
                  <div className="text-text flex flex-wrap items-baseline gap-4">
                    <span>
                      PFD<sub>avg</sub> ={" "}
                      <strong className="text-amber">
                        {!isInvalidLambda && !isZeroOrNegativeT && !isNonPhysical
                          ? pfdAvg.toExponential(4)
                          : isNonPhysical
                          ? "NON-PHYSICAL (> 1.0)"
                          : "NaN"}
                      </strong>
                    </span>
                    <span>
                      RRF = 1 / PFD<sub>avg</sub> ={" "}
                      <strong className="text-amber">
                        {!isInvalidLambda && !isZeroOrNegativeT && !isNonPhysical && !isZeroLambda
                          ? rrf.toFixed(2)
                          : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard SIL 1-4 Reference Band Mapping Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-text-dim uppercase tracking-wider">
                  IEC 61508 / 61511 LOW-DEMAND SIL BANDS
                </h3>
                <span className="font-mono text-[10px] text-text-faint">ACTIVE BAND HIGHLIGHTED</span>
              </div>
              <div className="overflow-x-auto rounded border border-line">
                <table className="w-full font-mono text-xs text-left">
                  <thead className="bg-panel-2 text-text-faint border-b border-line text-[11px]">
                    <tr>
                      <th className="p-2.5">SAFETY INTEGRITY LEVEL</th>
                      <th className="p-2.5">LOW DEMAND PFD<sub>avg</sub> RANGE</th>
                      <th className="p-2.5">RISK REDUCTION FACTOR</th>
                      <th className="p-2.5 hidden sm:table-cell">APPLICATION CONTEXT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {SIL_BANDS.map((b) => {
                      const isActive =
                        !isNaN(pfdAvg) && !isNonPhysical && pfdAvg >= b.minPfd && pfdAvg < b.maxPfd;
                      return (
                        <tr
                          key={b.sil}
                          className={`transition-colors ${
                            isActive
                              ? "bg-amber/15 text-text font-semibold border-l-4 border-amber"
                              : "bg-panel text-text-dim hover:bg-panel-2"
                          }`}
                        >
                          <td className="p-2.5 flex items-center gap-2">
                            <span className={isActive ? "text-amber font-bold" : "text-text"}>
                              {b.sil}
                            </span>
                            {isActive && (
                              <span className="rounded bg-amber text-bg font-bold px-1.5 py-0.2 text-[9px] uppercase tracking-wider">
                                CURRENT
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-text">{b.lowDemandRange}</td>
                          <td className="p-2.5">{`${b.minRrf.toLocaleString()} to ${b.maxRrf.toLocaleString()}`}</td>
                          <td className="p-2.5 text-[11px] text-text-faint hidden sm:table-cell">
                            {b.description}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Non-SIL Row */}
                    <tr
                      className={`transition-colors ${
                        !isNaN(pfdAvg) && !isNonPhysical && pfdAvg >= 0.1
                          ? "bg-crimson/15 text-crimson font-semibold border-l-4 border-crimson"
                          : "bg-panel text-text-faint"
                      }`}
                    >
                      <td className="p-2.5">No SIL Claimable</td>
                      <td className="p-2.5">≥ 10⁻¹ (≥ 0.10)</td>
                      <td className="p-2.5">&lt; 10</td>
                      <td className="p-2.5 text-[11px] hidden sm:table-cell">
                        Insufficient risk reduction for safety instrumented function
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRITICAL STANDALONE LIMITATION CAVEAT BANNER */}
            <div className="rounded border border-amber/40 bg-amber/5 p-4 font-mono text-xs text-text space-y-2">
              <div className="flex items-center gap-2 text-amber font-bold tracking-wide">
                <span>⚠️</span>
                <span>APPROXIMATION LIMITATIONS &amp; STANDALONE SAFETY CAVEAT</span>
              </div>
              <p className="text-text-dim text-xs leading-relaxed">
                This calculator uses the simplified low-demand 1oo1 approximation{" "}
                <strong className="text-amber">PFD<sub>avg</sub> ≈ (λ<sub>D</sub> × T) / 2</strong>. 
                This formula is an instructional approximation based on three strict assumptions:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-text-dim text-[11px]">
                <li>
                  <strong className="text-text">Simplex 1oo1 Architecture:</strong> Assumes a single un-voted 
                  channel with zero Hardware Fault Tolerance (HFT = 0). It does not model redundant voting architectures 
                  (1oo2, 2oo3) or common-cause beta (β) factor failures.
                </li>
                <li>
                  <strong className="text-text">100% Proof-Test Coverage (PTC = 1.0):</strong> Assumes that every 
                  proof test is completely comprehensive and restores the instrument to &quot;as-good-as-new&quot; status. Real field 
                  proof tests typically achieve only 60%–90% coverage.
                </li>
                <li>
                  <strong className="text-text">Zero Diagnostic Coverage (DC = 0%):</strong> Assumes no automated online 
                  self-diagnostics are active. Smart HART transmitters partition dangerous failures into detected (λ<sub>DD</sub>) 
                  and undetected (λ<sub>DU</sub>).
                </li>
              </ul>
              <p className="text-text-faint text-[11px] pt-1">
                Real-world SIL verification under IEC 61508 / IEC 61511 requires analyzing the complete SIF loop (sensor + 
                logic solver + final element), Mean Time to Restoration (MTTR), mission time, and systematic safety integrity.
              </p>
            </div>

            {/* Standard Educational Disclaimer */}
            <div className="rounded border border-line bg-panel-2 p-3 font-mono text-[11px] text-text-faint">
              <span className="text-amber font-semibold mr-1">EDUCATIONAL DISCLAIMER:</span>
              <span>
                This educational content is for learning and portfolio purposes. Always consult the current official 
                standards (IEC 61508 / IEC 61511), a certified functional safety expert (CFSE/CFSP), and site safety 
                procedures for production facility applications.
              </span>
            </div>

            {/* Deep-link to Note Article */}
            <div className="flex items-center justify-between border-t border-line-soft pt-4 font-mono text-xs">
              <span className="text-text-dim">Want the complete engineering background?</span>
              <Link
                href="/notes/safety-instrumented-systems"
                className="text-amber hover:underline font-semibold flex items-center gap-1"
              >
                <span>READ SIS &amp; SIL GUIDE</span>
                <span>⟶</span>
              </Link>
            </div>
          </section>
        </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
