"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/calculators" className="text-amber hover:underline">
              CALCULATORS
            </Link>
            <span>/</span>
            <span>LOOP OPTIMIZATION</span>
            <span>·</span>
            <span>ZIEGLER-NICHOLS TUNING</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Ziegler-Nichols Closed-Loop Tuning
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Derive recommended parallel PID controller gains ($K_p, K_i, K_d$) from the system&apos;s critical 
            ultimate gain ($K_u$) and sustained oscillation period ($T_u$).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          <section className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
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
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
              <p className="font-mono text-[11px] text-text-faint mt-1">
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
                className="w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-text focus:border-amber focus:outline-none"
              />
              <p className="font-mono text-[11px] text-text-faint mt-1">
                Time elapsed between consecutive oscillation peaks at $K_u$.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2">
              Recommended PID Parameters
            </h2>

            <div className="grid grid-cols-3 gap-px bg-line border border-line rounded overflow-hidden">
              <div className="bg-panel-2 p-5 text-center">
                <div className="font-mono text-xs text-text-faint mb-1">Kp (PROPORTIONAL)</div>
                <div className="font-mono text-2xl font-bold text-amber">
                  {tuning.Kp.toFixed(3)}
                </div>
                <div className="font-mono text-[10px] text-text-dim mt-1">0.60 × Ku</div>
              </div>

              <div className="bg-panel-2 p-5 text-center">
                <div className="font-mono text-xs text-text-faint mb-1">Ki (INTEGRAL)</div>
                <div className="font-mono text-2xl font-bold text-amber">
                  {tuning.Ki.toFixed(3)}
                </div>
                <div className="font-mono text-[10px] text-text-dim mt-1">1.20 × Ku / Tu</div>
              </div>

              <div className="bg-panel-2 p-5 text-center">
                <div className="font-mono text-xs text-text-faint mb-1">Kd (DERIVATIVE)</div>
                <div className="font-mono text-2xl font-bold text-amber">
                  {tuning.Kd.toFixed(3)}
                </div>
                <div className="font-mono text-[10px] text-text-dim mt-1">0.075 × Ku × Tu</div>
              </div>
            </div>

            {/* Error alerts */}
            {isInvalidTu && (
              <div className="rounded border border-crimson bg-crimson/15 p-3.5 font-mono text-xs text-crimson">
                <strong>[INVALID PERIOD]:</strong> Ultimate period Tu must be greater than zero.
              </div>
            )}

            {/* 3 Worked Steps */}
            <div>
              <h3 className="font-mono text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                LIVE STEP-BY-STEP CALCULATION
              </h3>
              <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs space-y-2">
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 1: Kp = 0.6 · Ku</span>
                  <span className="text-text">
                    0.6 × {ku.toFixed(2)} ={" "}
                    <strong className="text-amber">{tuning.Kp.toFixed(3)}</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-dashed border-line-soft pb-2">
                  <span className="text-text-faint">STEP 2: Ki = 1.2 · Ku / Tu</span>
                  <span className="text-text">
                    (1.2 × {ku.toFixed(2)}) / {tu.toFixed(2)} ={" "}
                    <strong className="text-amber">{tuning.Ki.toFixed(3)}</strong>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-text-faint">STEP 3: Kd = 0.075 · Ku · Tu</span>
                  <span className="text-text">
                    0.075 × {ku.toFixed(2)} × {tu.toFixed(2)} ={" "}
                    <strong className="text-amber">{tuning.Kd.toFixed(3)}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line-soft pt-3 font-mono text-xs">
              <Link href="/pid-lab" className="text-amber hover:text-text transition-colors">
                TEST GAINS IN PID LAB ⟶
              </Link>
              <span className="text-text-faint">QUARTER DECAY RATIO (1/4)</span>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
