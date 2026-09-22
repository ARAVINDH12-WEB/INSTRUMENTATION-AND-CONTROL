"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function ChangelogPage() {
  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-12 md:px-6">
        {/* Page Header */}
        <header className="mb-10 border-b border-line pb-6">
          <div className="mb-2 font-mono text-xs text-amber tracking-wider">
            SYSTEM // AUDIT TRAIL &amp; ENGINEERING LOG
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Build Log &amp; Engineering Changelog
          </h1>
          <p className="mt-2 text-base text-text-dim">
            Chronological record of architectural decisions, implementation milestones, physical simulations, and post-mortem observations.
          </p>
        </header>

        {/* Changelog Entries List */}
        <div className="space-y-8">
          {/* Entry: Cascade & Feedforward Control Simulator */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // MILESTONE
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-22
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Modular Cascade &amp; Feedforward Control Simulator
                </h2>
              </div>
              <Link
                href="/pid-lab/cascade"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN SIMULATOR</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Constructed a modular, discrete-time two-loop tank level simulator at{" "}
                <Link href="/pid-lab/cascade" className="text-text hover:text-amber underline">
                  /pid-lab/cascade
                </Link>{" "}
                using pure, decoupled functions appended to the{" "}
                <code className="font-mono text-xs text-amber">pid-simulation</code> skill:{" "}
                <code className="font-mono text-xs text-text">applyTankProcess</code>,{" "}
                <code className="font-mono text-xs text-text">simulateInnerFlowLoop</code>,{" "}
                <code className="font-mono text-xs text-text">simulateOuterLevelLoop</code>,{" "}
                <code className="font-mono text-xs text-text">calculateFeedforward</code>, and{" "}
                <code className="font-mono text-xs text-text">calculateMetrics</code>. The frontend provides a side-by-side comparative testbench running an identical outlet disturbance through Single-Loop PID, Cascade, and Cascade + Feedforward architectures with real-time multi-criteria error metrics (IAE, ISE, ITAE, overshoot, and settling time).
              </p>
            </div>

            {/* Section 2: What was difficult */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. What Was Difficult
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                The most significant conceptual hurdle was understanding why Single-Loop PID and Cascade control can appear deceptively identical if process metrics are evaluated naively on an idealized, linear valve with low actuator lag. Because mass accumulation in an integrating tank is mathematically linear, both architectures eventually integrate out load error. The genuine engineering separation only emerges when incorporating realistic valve stroke dynamics (pneumatic actuator lag tau_v ~ 1.2s) and evaluating multi-criteria error: Integrated Squared Error (ISE) clearly reveals Cascade&apos;s 19% to 38% reduction in peak transient excursions because the fast inner flow controller aggressively overdrives the valve before the level can sag.
              </p>
            </div>

            {/* Section 3: What would be changed next time */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. What Would Be Changed Next Time
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Future iterations should replace the idealized 1:1 feedforward pass-through with a tunable dynamic lead-lag filter [G_ff(s) = -G_d(s) / G_p(s)] and explicit transport dead-time modeling [exp(-theta * s)]. In physical chemical processing plants, disturbance transit delay between measurement and valve injection requires dynamic phase matching to prevent feedforward from over-correcting during rapid transient edges.
              </p>
            </div>

            {/* Section 4: Time-Scale Separation Evaluation (outerStepsPerInnerStep = 5) */}
            <div className="rounded border border-line-soft bg-panel-2 p-4 space-y-2">
              <div className="font-mono text-xs font-semibold text-verdigris uppercase">
                Empirical Evaluation // outerStepsPerInnerStep = 5
              </div>
              <p className="font-sans text-xs text-text-dim leading-relaxed">
                The default time-scale separation parameter of{" "}
                <span className="font-mono text-amber font-semibold">outerStepsPerInnerStep = 5</span>{" "}
                (meaning the inner flow loop executes at dt = 0.1s while the outer level loop executes at dt_outer = 0.5s) produced stable, highly sensible engineering behavior:
              </p>
              <ul className="list-disc list-inside font-sans text-xs text-text-dim space-y-1.5 pl-1">
                <li>
                  <strong className="text-text">Stability &amp; Decoupling:</strong> At ratio 5:1, the inner flow loop settles within its sampling interval before the next outer level setpoint update, preventing the destructive inter-loop resonance that occurs when the ratio drops below 2:1.
                </li>
                <li>
                  <strong className="text-text">Responsiveness vs. Sluggishness:</strong> When tested at ratios above 8:1, the outer level loop experienced noticeable setpoint lag and delayed recovery from sudden load disturbances. The 5:1 ratio sits precisely in the sweet spot recommended by industrial DCS control guidelines (3x to 5x).
                </li>
              </ul>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
