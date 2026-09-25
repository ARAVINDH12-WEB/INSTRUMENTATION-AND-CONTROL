"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";

export default function CalculatorsPage() {
  const calcs = [
    {
      title: "4–20 mA Signal Converter",
      badge: "LIVE // INTERACTIVE",
      badgeColor: "border-verdigris/40 bg-verdigris/10 text-verdigris",
      tag: "CALC-01",
      desc: "Convert loop current to physical process values and vice versa. Live 3-step worked breakdown (fraction, span, result) with zero-span and NAMUR NE43 guards.",
      formula: "PV = LRV + ((I - 4) / 16) · (URV - LRV)",
      href: "/calculators/ma-converter",
      standard: "ISA-50.1 / NAMUR NE43",
    },
    {
      title: "Thermocouple Voltage Output",
      badge: "TYPE K LINEAR",
      badgeColor: "border-amber-dim bg-amber/10 text-amber",
      tag: "CALC-02",
      desc: "Approximate millivolt output for chromel-alumel (Type K) junctions across 0–500°C linear sensitivity zone (41 µV/°C). Note: labeled as linear approximation.",
      formula: "V_out = Temp (°C) · 0.041 mV/°C",
      href: "/calculators/thermocouple-mv",
      standard: "IEC 60584 APPROX",
    },
    {
      title: "Pt100 RTD Resistance Scaler",
      badge: "CALLENDAR-VAN DUSEN",
      badgeColor: "border-amber-dim bg-amber/10 text-amber",
      tag: "CALC-03",
      desc: "Precision resistance calculation for 100Ω Platinum Resistance Thermometers (Pt100, alpha = 0.00385 /°C) with temperature linear conversion.",
      formula: "R(T) = R0 · [ 1 + α · T ]",
      href: "/calculators/rtd-resistance",
      standard: "DIN EN 60751 (ITS-90)",
    },
    {
      title: "Orifice Plate Flow Rate",
      badge: "BERNOULLI / DP",
      badgeColor: "border-amber-dim bg-amber/10 text-amber",
      tag: "CALC-04",
      desc: "Differential pressure fluid flow calculation for concentric square-edged orifice plates under incompressible turbulent conditions.",
      formula: "Q = Cd · Area · √( (2 · ΔP) / ρ )",
      href: "/calculators/orifice-flow",
      standard: "ISO 5167 / ASME MFC-3M",
    },
    {
      title: "Ziegler-Nichols PID Tuning",
      badge: "FREQUENCY RESPONSE",
      badgeColor: "border-amber-dim bg-amber/10 text-amber",
      tag: "CALC-05",
      desc: "Calculate classical closed-loop ultimate oscillation PID parameters (Kp, Ki, Kd) from ultimate gain (Ku) and period (Tu).",
      formula: "Kp = 0.6·Ku | Ki = 1.2·Ku/Tu | Kd = 0.075·Ku·Tu",
      href: "/calculators/pid-tuning",
      standard: "Z-N CLASSICAL CLOSED-LOOP",
    },
    {
      title: "SIL PFDavg & Risk Reduction Factor",
      badge: "IEC 61508 / 61511",
      badgeColor: "border-verdigris/40 bg-verdigris/10 text-verdigris",
      tag: "CALC-06",
      desc: "Calculate average Probability of Failure on Demand (PFDavg) and Risk Reduction Factor (RRF) for low-demand safety instrumented functions with SIL 1–4 band mapping and edge-case guards.",
      formula: "PFD_avg ≈ (λ_D · T) / 2 | RRF = 1 / PFD_avg",
      href: "/calculators/sil-pfd",
      standard: "IEC 61508 / 61511 LOW DEMAND",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
              <span className="inline-block w-2 h-2 rounded-full bg-amber shadow-[0_0_6px_#FFB000] animate-pulse" />
              <span>SUITE // INSTRUMENTATION TOOLS</span>
              <span>·</span>
              <span>STANDARDIZED SCALING &amp; CALIBRATION</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Engineering Calculators
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Field-verified calculation utilities for process instrumentation, signal conditioning, 
              sensor scaling, orifice differential flow, and loop tuning.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#26211A] border border-[#302B22] rounded overflow-hidden">
            {calcs.map((calc) => (
              <article key={calc.tag} className="flex flex-col bg-[#16130F] p-6 hover:bg-[#1E1A14] transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-mono text-[11px] text-text-faint mb-1">{calc.tag}</div>
                    <h2 className="font-panel-heading text-lg font-semibold text-text group-hover:text-amber transition-colors">
                      {calc.title}
                    </h2>
                  </div>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap ${calc.badgeColor}`}>
                    {calc.badge}
                  </span>
                </div>

                <p className="flex-1 font-panel-body text-xs text-text-dim mb-4 leading-relaxed">
                  {calc.desc}
                </p>

                <div className="rounded border border-[#2B251D] bg-[#100E0B] p-2.5 font-mono text-[11px] text-amber mb-4 truncate shadow-inner">
                  {calc.formula}
                </div>

                <div className="flex items-center justify-between border-t border-[#241F18] pt-3 font-mono text-xs">
                  <Link href={calc.href} className="text-amber hover:text-text transition-colors font-semibold flex items-center gap-1">
                    <span>LAUNCH TOOL</span>
                    <span className="transition-transform group-hover:translate-x-1">⟶</span>
                  </Link>
                  <span className="text-[10px] text-text-faint">{calc.standard}</span>
                </div>
              </article>
            ))}
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
