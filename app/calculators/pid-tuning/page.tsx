"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";
import { zieglerNichols } from "@/lib/pid-math";

export default function PidTuningPage() {
  const [ku, setKu] = useState(4.5); // Ultimate Gain
  const [tu, setTu] = useState(12.0); // Ultimate Period (seconds)

  const isInvalidTu = tu <= 0;
  const isInvalidKu = ku <= 0;
  const tuning = isInvalidTu || isInvalidKu ? { Kp: 0, Ki: 0, Kd: 0 } : zieglerNichols(ku, tu);

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
              <span>LOOP OPTIMIZATION</span>
              <span>·</span>
              <span>ZIEGLER-NICHOLS TUNING</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Ziegler-Nichols Closed-Loop Tuning
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Derive recommended parallel PID controller gains ($K_p, K_i, K_d$) from the system&apos;s critical 
              ultimate gain ($K_u$) and sustained oscillation period ($T_u$).
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
            <section className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5 mb-4">
                Ultimate Sustained Oscillation
              </h2>

              <div className="mb-5">
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>ULTIMATE GAIN (Ku)</span>
                  <span className="font-semibold text-amber">{ku.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={ku}
                  onChange={(e) => setKu(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
                <p className="font-mono text-[11px] text-text-faint mt-1.5">
                  Proportional gain that drives loop into stable continuous oscillation.
                </p>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                  <span>ULTIMATE PERIOD Tu (seconds)</span>
                  <span className="font-semibold text-amber">{tu.toFixed(1)}s</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={tu}
                  onChange={(e) => setTu(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-[#302B22] bg-[#100E0B] px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none shadow-inner"
                />
                <p className="font-mono text-[11px] text-text-faint mt-1.5">
                  Time elapsed between consecutive oscillation peaks at $K_u$.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <h2 className="font-panel-heading text-base font-semibold text-text border-b border-[#26211A] pb-2.5">
                Recommended PID Parameters
              </h2>

              {/* CRT Scanline Multi-Parameter Bank */}
              <OscilloscopeReadout
                label="CLASSICAL ZIEGLER-NICHOLS PID SYNTHESIS"
                statusBadge="CLOSED LOOP ULTIMATE OSCILLATION"
                variant="amber"
              >
                <div className="grid grid-cols-3 gap-3 py-1">
                  <div className="bg-[#121914] border border-[#23382D] rounded p-3 text-center shadow-inner">
                    <div className="font-mono text-[11px] text-[#588A6E] mb-1 font-semibold">Kp (PROP)</div>
                    <div className="font-mono text-2xl md:text-3xl font-bold text-amber drop-shadow-[0_0_10px_rgba(255,176,0,0.6)]">
                      {tuning.Kp.toFixed(3)}
                    </div>
                    <div className="font-mono text-[10px] text-text-faint mt-1">0.60 × Ku</div>
                  </div>

                  <div className="bg-[#121914] border border-[#23382D] rounded p-3 text-center shadow-inner">
                    <div className="font-mono text-[11px] text-[#588A6E] mb-1 font-semibold">Ki (INTEG)</div>
                    <div className="font-mono text-2xl md:text-3xl font-bold text-amber drop-shadow-[0_0_10px_rgba(255,176,0,0.6)]">
                      {tuning.Ki.toFixed(3)}
                    </div>
                    <div className="font-mono text-[10px] text-text-faint mt-1">1.20 × Ku / Tu</div>
                  </div>

                  <div className="bg-[#121914] border border-[#23382D] rounded p-3 text-center shadow-inner">
                    <div className="font-mono text-[11px] text-[#588A6E] mb-1 font-semibold">Kd (DERIV)</div>
                    <div className="font-mono text-2xl md:text-3xl font-bold text-amber drop-shadow-[0_0_10px_rgba(255,176,0,0.6)]">
                      {tuning.Kd.toFixed(3)}
                    </div>
                    <div className="font-mono text-[10px] text-text-faint mt-1">0.075 × Ku × Tu</div>
                  </div>
                </div>
              </OscilloscopeReadout>

              {/* Worked Steps */}
              <div>
                <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                  LIVE STEP-BY-STEP CALCULATION FORMULAS
                </h3>
                <div className="rounded border-l-4 border-amber border-t border-r border-b border-[#2C261E] bg-[#100E0B] p-4 font-mono text-xs space-y-2 shadow-inner">
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 1: Proportional Gain Kp</span>
                    <span className="text-text">
                      0.60 × {ku} = <strong className="text-amber">{tuning.Kp.toFixed(3)}</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-dashed border-[#241F18] pb-2">
                    <span className="text-text-faint">STEP 2: Integral Gain Ki</span>
                    <span className="text-text">
                      (1.20 × {ku}) / {tu} = <strong className="text-amber">{tuning.Ki.toFixed(3)}</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-text-faint">STEP 3: Derivative Gain Kd</span>
                    <span className="text-text">
                      0.075 × {ku} × {tu} = <strong className="text-amber">{tuning.Kd.toFixed(3)}</strong>
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
