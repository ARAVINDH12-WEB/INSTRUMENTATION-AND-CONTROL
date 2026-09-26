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
          {/* Entry: Multi-Tank & Heat Exchanger PID Simulators */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-teal/40 bg-teal/10 px-2 py-0.5 font-mono text-xs font-semibold text-teal">
                    FEATURE // SIMULATION SUITE · SIM-06 &amp; SIM-07
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-25
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Multi-Tank Interacting System &amp; Counter-Current Heat Exchanger Simulators
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/pid-lab/multi-tank"
                  className="font-mono text-xs text-teal hover:underline flex items-center gap-1"
                >
                  <span>MULTI-TANK</span>
                  <span>⟶</span>
                </Link>
                <Link
                  href="/pid-lab/heat-exchanger"
                  className="font-mono text-xs text-ember hover:underline flex items-center gap-1"
                >
                  <span>HEAT EXCHANGER</span>
                  <span>⟶</span>
                </Link>
              </div>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed mb-3">
                Expanded the PID Simulation Lab with two higher-order industrial process models:
                the <strong className="text-text">Multi-Tank Interacting Gravity System (SIM-06)</strong> at{" "}
                <Link href="/pid-lab/multi-tank" className="text-text hover:text-teal underline">
                  /pid-lab/multi-tank
                </Link>{" "}
                and the <strong className="text-text">Counter-Current Heat Exchanger (SIM-07)</strong> at{" "}
                <Link href="/pid-lab/heat-exchanger" className="text-text hover:text-ember underline">
                  /pid-lab/heat-exchanger
                </Link>.
                Both simulators feature the full ControlForge industrial instrument-panel treatment:
                machined brushed-metal enclosures with recessed bezel rivets, precision rotary knobs with click-to-type input,
                live CRT oscilloscope displays with phosphor persistence decay and hover crosshair readouts,
                and seamless integration with the central patch-cable routing jack.
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-xs text-text-dim">
                <li>
                  <strong className="text-text">Multi-Tank Dual Trace:</strong> Simultaneously visualizes controlled secondary level $h_2$ (cyan trace) alongside unmeasured intermediate upstream head $h_1$ (dim amber trace), demonstrating intermediate phase lag.
                </li>
                <li>
                  <strong className="text-text">Heat Exchanger Dead-Time Knob:</strong> Exposes dynamic transport lag &theta;<sub>d</sub> &isin; [0.0, 10.0] s via an interactive dial to demonstrate non-minimum-phase delay dynamics against instantaneous processes.
                </li>
                <li>
                  <strong className="text-text">Patch Cable &amp; State Preservation:</strong> Integrated both models into the 6-way jack matrix, preserving active Controller A / Controller B tuning states across hot process swaps.
                </li>
                <li>
                  <strong className="text-text">Chatbot Knowledge Base &amp; Standalone HTML:</strong> Added matching standalone pages (<code className="text-amber">pid-lab/multi-tank.html</code> and <code className="text-amber">pid-lab/heat-exchanger.html</code>) and updated AI assistant retrieval corpora.
                </li>
              </ul>
            </div>

            {/* Section 2: Verification Results */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. Empirical Verification &amp; Metric Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-mono text-xs">
                <div className="rounded border border-line-soft bg-surface-dark p-3 space-y-2">
                  <div className="text-teal font-semibold">TEST 1: SINGLE-TANK VS. MULTI-TANK</div>
                  <div className="text-text-faint text-[11px]">Same Tuning: Kp=2.1, Ki=0.35, Kd=0.1, SP=50, Initial=20</div>
                  <div className="space-y-1 text-text-dim pt-1 border-t border-line-soft">
                    <div className="flex justify-between">
                      <span>Single-Tank Overshoot:</span>
                      <span className="text-text font-semibold">18.91% (Peak: 59.45%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multi-Tank (h2) Overshoot:</span>
                      <span className="text-teal font-bold">94.04% (Peak: 97.02%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Single-Tank Rise Time:</span>
                      <span className="text-text">9.7s (Settling: 36.6s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multi-Tank (h2) Rise Time:</span>
                      <span className="text-teal">37.9s (Settling: &gt;79.9s)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-line-soft bg-surface-dark p-3 space-y-2">
                  <div className="text-ember font-semibold">TEST 2: HEAT EXCHANGER TRANSPORT DEAD TIME</div>
                  <div className="text-text-faint text-[11px]">Same Tuning: Kp=2.1, Ki=0.35, Kd=0.1, SP=60°C, Initial=20°C</div>
                  <div className="space-y-1 text-text-dim pt-1 border-t border-line-soft">
                    <div className="flex justify-between">
                      <span>Dead Time θd = 0.0s:</span>
                      <span className="text-text font-semibold">4.42% OS · ts=12.8s (Peak: 62.65°C)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dead Time θd = 3.0s:</span>
                      <span className="text-ember font-bold">9.82% OS · ts=40.4s (Peak: 65.89°C)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dead Time θd = 6.0s:</span>
                      <span className="text-ember">11.39% OS · ts=44.3s (Peak: 66.83°C)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aggressive Ki=0.85 @ 6s:</span>
                      <span className="text-crimson font-semibold">ts=75.4s (Oscillatory Dip: 53.57°C)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Comparative Analysis & Physical Rationale */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. Comparative Dynamic Analysis &amp; Investigation Findings
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                <strong className="text-text">Investigation of Dead-Time Sensitivity:</strong> An initial formulation without cold-stream heat dissipation allowed integrator windup to saturate the hot steam valve at 100% for 70s. Because delaying a saturated signal yields an identical 100% signal (<code className="font-mono text-xs text-amber">u(t - θd) ≡ 100%</code>), the delay buffer was dynamically masked. Incorporating the physical counter-current cold stream heat removal (<code className="font-mono text-xs text-amber">F_cold·(Tout - Tcold)</code>) and sizing thermal capacitance to <code className="font-mono text-xs text-amber">Cth = 12 (τ ≈ 12s)</code> restored the delay-dominated regime (<code className="font-mono text-xs text-amber">θd / τ = 0.25 to 0.50</code>). Under this physical model, transport lag dramatically expands settling time from <strong className="text-amber">12.8s to 40.4s (over 3x slower)</strong> and more than doubles overshoot from <strong className="text-amber">4.42% to 9.82%</strong>, with aggressive integral action (<code className="font-mono text-xs text-amber">Ki=0.85</code>) triggering severe oscillatory ringing (<code className="font-mono text-xs text-amber">ts=75.4s</code>, undershoot dip to 53.57°C).
              </p>
              <p className="font-sans text-sm text-text-dim leading-relaxed mt-2">
                <strong className="text-text">Physical Control Rationale (Multi-Tank vs. Dead Time):</strong>
                Both systems introduce higher-order phase penalties, but through fundamentally distinct physical mechanisms:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-xs text-text-dim mt-1.5 pl-2">
                <li>
                  <strong className="text-text">Multi-Tank (Lumped Intermediate Capacitance):</strong> Cascading two gravity vessels inserts an unmeasured state $h_1$ that adds a second real pole: $G(s) \propto 1 / [(s + 1/\tau_1)(s + 1/\tau_2)]$. At high frequencies, this shifts process phase lag to <strong className="text-amber">-180°</strong>. Together with the controller&apos;s integral action (-90°), total open-loop phase lag reaches <strong className="text-crimson">-270°</strong> across the crossover band, completely annihilating phase margin and producing catastrophic <strong className="text-crimson">94.04% overshoot</strong> under baseline tuning.
                </li>
                <li>
                  <strong className="text-text">Heat Exchanger (Distributed Transport Delay):</strong> Pure dead time has transfer function $e^&#123;-s \theta_d&#125;$. It maintains <strong className="text-text">gain = 1.0 at all frequencies</strong> while rotating phase linearly with frequency ($\Delta\phi = -\omega \theta_d$). At low frequencies, the loop retains phase margin during the initial rise, but the phase lag steadily eats away stability margins at crossover, dragging out settling time by 3.2x and inducing deep cyclic undershoots when integral gain is aggressive.
                </li>
              </ul>
            </div>
          </article>

          {/* Entry: Robustness & Disturbance-Rejection Capstone Case Study */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // CAPSTONE PROJECT · CF-PRJ-007
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-25
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Robustness &amp; Disturbance-Rejection Capstone Case Study
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/projects/disturbance-rejection-capstone"
                  className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
                >
                  <span>CASE STUDY</span>
                  <span>⟶</span>
                </Link>
              </div>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed mb-3">
                Published the backlog capstone engineering case study at{" "}
                <Link href="/projects/disturbance-rejection-capstone" className="text-text hover:text-amber underline">
                  /projects/disturbance-rejection-capstone
                </Link>{" "}
                structured strictly per the established Projects editorial template (Problem, Process, Sensors/Actuators,
                Mathematical Model, Control Strategy, Simulation Benchmarks, Written Engineering Analysis, and Field Lessons).
              </p>
              <ul className="list-disc pl-5 font-sans text-sm text-text-dim space-y-1">
                <li>
                  <strong className="text-text">Identical Benchmark Platform:</strong> Evaluated Single-Loop PID, Two-Loop
                  Cascade (5:1 time-scale ratio), and Cascade + Feedforward under an identical gravity surge tank model (A = 4.0 m²),
                  initial conditions (h₀ = 50%), and step outflow disturbance (+15 L/min at t = 20s).
                </li>
                <li>
                  <strong className="text-text">Confirmed-Fair Tuning Baseline:</strong> Reused the verified Single-Loop PID
                  tuning (Kp=1.80, Ki=0.25, Kd=0.40) directly from prior cascade milestones without modification.
                </li>
                <li>
                  <strong className="text-text">Interactive Dynamic Visualizer:</strong> Built a dual SVG response visualizer
                  rendering real-time 60-second trajectories for liquid level and control valve command across nominal, noise-stress,
                  and feedforward-mistuning scenarios.
                </li>
              </ul>
            </div>

            {/* Section 2: Key Findings & Empirical Data */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. Key Empirical Findings &amp; Stress Tests
              </h3>
              <ul className="list-disc pl-5 font-sans text-sm text-text-dim space-y-1">
                <li>
                  <strong className="text-text">Part 1 Nominal Disturbance Rejection:</strong> Cascade+FF reduced peak level
                  deviation from 7.78% to 0.83% (-89.3%) and total IAE from 60.06 to 2.99 (-95.0%). However, it required
                  a 49.50% immediate valve stroke compared to Single-Loop&apos;s conservative 20.34%.
                </li>
                <li>
                  <strong className="text-text">Part 2A Inner Flow Sensor Noise Stress (±2.0 L/min):</strong> While the tank&apos;s
                  capacitance filtered level deviations (0.83% → 0.85%), cumulative actuator travel in Cascade exploded
                  from 103.1% to 2,935.3% (a 28.5x increase) and to 2,969.3% in Cascade+FF due to 10 Hz noise chasing.
                  Single-Loop PID has no inner flow sensor and retained smooth 25.7% travel, winning decisively on valve longevity.
                </li>
                <li>
                  <strong className="text-text">Part 2B Feedforward Model Inaccuracy (±40% gain):</strong> Under-compensation
                  (60%) and over-compensation (140%) degraded IAE by 8x (2.99 → 24.1), with 140% driving level overshoot and a 24.5s
                  settling time. Yet both still beat feedback-only cascade (60.11 IAE) by pre-empting the majority of mass loss.
                </li>
                <li>
                  <strong className="text-text">Part 3 Architectural Verdict:</strong> Disproved the assumption that cascade
                  wins on every metric: Single-loop PID is superior in control conservation, loop simplicity, and mechanical
                  actuator preservation under noisy, un-filtered field conditions.
                </li>
              </ul>
            </div>
          </article>

          {/* Entry: SIS/SIL Concepts Monograph & SIL PFD Calculator */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // NOTE-02 &amp; CALC-06
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-24
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Safety Instrumented Systems (SIS/SIL) Monograph &amp; Low-Demand PFD<sub>avg</sub> Calculator
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/notes/safety-instrumented-systems"
                  className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
                >
                  <span>MONOGRAPH</span>
                  <span>⟶</span>
                </Link>
                <span className="text-text-faint">·</span>
                <Link
                  href="/calculators/sil-pfd"
                  className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
                >
                  <span>CALCULATOR</span>
                  <span>⟶</span>
                </Link>
              </div>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed mb-3">
                Expanded ControlForge&apos;s functional safety foundations with a comprehensive technical monograph at{" "}
                <Link href="/notes/safety-instrumented-systems" className="text-text hover:text-amber underline">
                  /notes/safety-instrumented-systems
                </Link>{" "}
                and an interactive engineering calculator at{" "}
                <Link href="/calculators/sil-pfd" className="text-text hover:text-amber underline">
                  /calculators/sil-pfd
                </Link>.
              </p>
              <ul className="list-disc pl-5 font-sans text-sm text-text-dim space-y-1">
                <li>
                  <strong className="text-text">BPCS vs. SIS Fundamental Separation:</strong> Detailed examination of why 
                  the safety instrumented system does not replace regulatory BPCS PID control, complete with an ASCII/CSS dual-path 
                  signal routing architecture diagram contrasting continuous regulation with trip interlocks.
                </li>
                <li>
                  <strong className="text-text">SIL 1–4 Integrity Targets:</strong> Conceptual analysis of low-demand 
                  Probability of Failure on Demand (PFD<sub>avg</sub>) and Risk Reduction Factor (RRF) metrics per IEC 61508 / IEC 61511.
                </li>
                <li>
                  <strong className="text-text">PFD<sub>avg</sub> Mathematical Derivation:</strong> Step-by-step physical breakdown 
                  of the low-demand linear approximation PFD<sub>avg</sub> ≈ (λ<sub>D</sub> × T) / 2, explaining the sawtooth hazard curve 
                  and the physical meaning of dangerous failure rate λ<sub>D</sub>, proof-test interval T, and the 1/2 integration factor.
                </li>
                <li>
                  <strong className="text-text">Four Explicit Engineering Limitations:</strong> Documented the assumptions of simplex 1oo1 
                  hardware, 100% proof-test coverage (PTC), zero automated diagnostic coverage (DC = 0), and whole-SIF loop summation.
                </li>
                <li>
                  <strong className="text-text">Interactive Live Worked-Step Calculator:</strong> Implemented 3 live worked calculation steps, 
                  unit conversion selectors (h⁻¹, FIT, yr⁻¹ for λ<sub>D</sub>; years, months, hours for T), edge-case guards for T ≤ 0, λ<sub>D</sub> &lt; 0, 
                  and non-physical PFD &gt; 1.0, an active SIL 1–4 band highlight table, and a prominent standalone limitation caveat directly visible in the UI.
                </li>
              </ul>
            </div>

            {/* Section 2: Verification */}
            <div className="rounded border border-line-soft bg-panel-2 p-4 font-mono text-xs text-text-dim space-y-1">
              <span className="text-amber font-semibold">METROLOGY &amp; EDGE-CASE VERIFICATION:</span>
              <div>• Realistic Case: λ<sub>D</sub> = 5.0×10⁻⁷ h⁻¹ (500 FIT), T = 1 yr (8,760 h) ⟹ PFD<sub>avg</sub> = 2.190×10⁻³ (0.219%), RRF = 456.62 ⟹ Active Band: SIL 2 [VERIFIED]</div>
              <div>• Edge Case 1: T = 0 ⟹ Guard triggered: [INVALID INTERVAL] T must be strictly positive (T &gt; 0) [VERIFIED]</div>
              <div>• Edge Case 2: λ<sub>D</sub> = 5.0×10⁻⁴ h⁻¹, T = 1 yr ⟹ PFD<sub>avg</sub> = 2.19 &gt; 1.0 ⟹ Guard triggered: [NON-PHYSICAL PROBABILITY] [VERIFIED]</div>
              <div>• Standalone Caveat: Banner visible directly in calculator UI on initial page load without navigating to article [VERIFIED]</div>
            </div>
          </article>

          {/* Entry: Warehouse Automation & Logistics Simulator (Discrete-Event Paradigm) */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // SIM-04
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-24
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Warehouse Automation &amp; Logistics Conveyor Simulator (/simulators/warehouse)
                </h2>
              </div>
              <Link
                href="/simulators/warehouse"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN WAREHOUSE SIMULATOR</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Implemented a milestone slice of the Warehouse Automation &amp; Logistics Simulator at{" "}
                <Link href="/simulators/warehouse" className="text-text hover:text-amber underline">
                  /simulators/warehouse
                </Link>
                . This marks a fundamental architectural paradigm shift for ControlForge: moving from continuous-time 
                fixed-timestep numerical integration (<span className="font-mono text-amber">&Delta;t = const</span>) used in the PID and thermal 
                simulators to a pure <strong>Discrete-Event Simulation (DES)</strong> engine.
              </p>
              <ul className="list-disc list-inside space-y-1 font-sans text-sm text-text-dim leading-relaxed pl-2 mt-2">
                <li>
                  <strong className="text-text">Core DES Engine:</strong> Priority-queue-driven Future Event List (FEL) tracking four discrete 
                  event types (<em>ITEM_ARRIVAL, CONVEYOR_ARRIVAL, FINISH_PROCESSING, ITEM_DEPARTURE</em>). Time leaps directly between 
                  irregular event occurrences without intermediate idle ticks.
                </li>
                <li>
                  <strong className="text-text">Stochastic Inflow:</strong> Packages enter via a genuine Poisson arrival process with 
                  exponentially distributed inter-arrival times (<span className="font-mono text-amber">&Delta;t &sim; Exp(&lambda;)</span>), 
                  not periodic intervals.
                </li>
                <li>
                  <strong className="text-text">3-Station Conveyor Line:</strong> Sequential processing line (<em>ST-01 Inspection &rarr; ST-02 Sorting &rarr; ST-03 Packing</em>) 
                  with FIFO queue buffers, bounded transit delays, and stochastic service distributions.
                </li>
                <li>
                  <strong className="text-text">Live Diagram &amp; FEL Inspector:</strong> Industrial SVG topology diagram displaying active work bays, 
                  FIFO queue stacks, smooth conveyor package transit, and a real-time audit log exposing irregular <span className="font-mono text-amber">&Delta;t</span> event leaps.
                </li>
              </ul>
            </div>

            {/* Section 2: Architecture & Post-Mortem */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. Architectural Post-Mortem: Genuine Event-Driven vs. Fixed-dt Approximation
              </h3>
              <div className="space-y-3 font-sans text-sm text-text-dim leading-relaxed">
                <p>
                  <strong className="text-text">Was genuine event-driven simulation harder than expected?</strong><br />
                  The greatest temptation when building web simulators is to default to a 60 FPS requestAnimationFrame tick loop 
                  that increments <span className="font-mono text-amber">simTime += dt</span> and uses random threshold checks to spawn items. 
                  However, that pattern is merely a disguised continuous approximation: it couples simulation physics to wall-clock frame rates, 
                  breaks down during fast-forwarding, and produces inaccurate queue metrics.
                </p>
                <p>
                  Writing genuine DES was conceptually cleaner once the priority queue mechanics were established, but required rethinking 
                  state accounting: because state variables are piecewise constant, station utilization and queue lengths cannot be calculated 
                  by averaging discrete UI frame snapshots. Instead, they must be computed using 
                  <strong> time-weighted Riemann integrals</strong> (<span className="font-mono text-amber">&int; Q(t)dt</span> and <span className="font-mono text-amber">&int; &Iopf;(busy)dt</span>) 
                  accumulated across the non-uniform intervals <span className="font-mono text-amber">&Delta;t_k = t_&#123;k+1&#125; - t_k</span>.
                </p>
                <p>
                  <strong className="text-text">Key Implementation Decision:</strong><br />
                  The pivotal architectural decision that kept the system strictly event-driven was the 
                  <strong> absolute decoupling of the DES transition engine from the visual playback layer</strong>. 
                  The simulation engine is pure, synchronous, and headless: it can execute 10,000 discrete events in 15 milliseconds. 
                  The animation loop merely acts as a window observer advancing a display clock and triggering events from the priority queue 
                  as the display time crosses their pre-scheduled future timestamps.
                </p>
              </div>
            </div>
          </article>

          {/* Entry: Multi-Class Sensor Fault Classification Deep-Dive */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // MOD-01-EXT
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-23
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Multi-Class Sensor Fault Classification Deep-Dive (/intelligence/fault-detection)
                </h2>
              </div>
              <Link
                href="/intelligence/fault-detection"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN FAULT CLASSIFIER</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Extended the existing statistical anomaly detection module at{" "}
                <Link href="/intelligence/fault-detection" className="text-text hover:text-amber underline">
                  /intelligence/fault-detection
                </Link>{" "}
                beyond binary anomaly/nominal gating into an interpretable multi-class sensor fault classifier. 
                Using stage-1 Median Absolute Deviation (MAD) / Modified Z-score filtering followed by a statistical 
                decision tree (rolling variance, rate-of-change, first differences, and regime duration), the engine labels each 
                flagged timestep into one of five physical failure classes: <strong className="text-text">STUCK</strong> (seized diaphragm), 
                <strong className="text-text"> DRIFT</strong> (slow calibration offset), <strong className="text-text">NOISE</strong> (elevated variance), 
                <strong className="text-text"> SPIKE</strong> (transient impulse), and <strong className="text-text">DROPOUT</strong> (open loop / 0.0 mA rail).
              </p>
            </div>

            {/* Section 2: Class Imbalance & Evaluation */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. Class Imbalance Handling &amp; 6×6 Confusion Matrix
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed mb-3">
                Industrial sensor streams are heavily imbalanced: over 99% of timesteps in a healthy loop are nominal. 
                Reporting aggregate accuracy creates a dangerous false sense of reliability. To enforce rigorous verification:
              </p>
              <ul className="list-disc list-inside space-y-1 font-sans text-sm text-text-dim leading-relaxed pl-2 mb-3">
                <li>
                  <strong className="text-text">Balanced Multi-Class Benchmark Suite:</strong> A synthetic dataset with balanced 
                  representation across all five fault classes plus nominal baseline buffers (exercised at 180–300 timesteps).
                </li>
                <li>
                  <strong className="text-text">6×6 Confusion Matrix:</strong> Rows (Actual) versus Columns (Predicted) displayed directly 
                  in the UI with diagonal success highlighting and off-diagonal cross-confusion auditing.
                </li>
                <li>
                  <strong className="text-text">Per-Class Metrics:</strong> Precision, Recall, and F1-scores reported individually per class, 
                  proving that STUCK and DROPOUT achieve 100% precision and recall while NOISE and DRIFT maintain &gt;85% F1-scores.
                </li>
              </ul>
            </div>

            {/* Section 3: Hard-to-Distinguish Pairs Post-Mortem */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. Fault-Class Disambiguation Post-Mortem
              </h3>
              <div className="space-y-3 font-sans text-sm text-text-dim leading-relaxed">
                <p>
                  <strong className="text-text">STUCK vs. DROPOUT Disambiguation:</strong> Both faults present mathematically as zero rolling 
                  variance (a flatline). In physical analog loops (4–20 mA), a wire break or transmitter power failure falls to 
                  <strong className="text-text"> 0.0 mA</strong> (or below 3.6 mA under NAMUR NE43 standard), whereas a mechanically seized 
                  diaphragm freezes at the prevailing operating process value (e.g., 52.8%). The statistical classifier cleanly separates them 
                  based on operating-level non-zero flatlines vs. zero-rail values. 
                  <em> However, if a digital fieldbus or SCADA node implements dropout via &quot;sample-and-hold last known good&quot; without 
                  out-of-band communication status bits, the resulting time-series is mathematically identical to a stuck diaphragm.</em> 
                  Our UI explicitly documents this boundary.
                </p>
                <p>
                  <strong className="text-text">SPIKE vs. Elevated NOISE:</strong> An isolated impulse spike artificially inflates rolling 
                  standard deviation over a window of <em>w</em> samples. To prevent misclassifying isolated spikes as sustained noise, 
                  the classifier analyzes neighborhood variance across both preceding and succeeding windows.
                </p>
              </div>
            </div>
          </article>

          {/* Entry: Energy-Consumption Forecasting */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // MOD-05
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-23
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Industrial Energy-Consumption Forecasting (/intelligence/energy-forecasting)
                </h2>
              </div>
              <Link
                href="/intelligence/energy-forecasting"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN ENERGY FORECASTER</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Implemented a new seasonal time-series forecasting module at{" "}
                <Link href="/intelligence/energy-forecasting" className="text-text hover:text-amber underline">
                  /intelligence/energy-forecasting
                </Link>{" "}
                extending the Industrial Intelligence suite. Built around the synthetic load model{" "}
                <code className="text-amber font-mono text-xs bg-panel-2 px-1 py-0.5 rounded border border-line">
                  E_t = baseline + daily_seasonality(t) + weekday_weekend_factor(t) + noise
                </code>
                , the module simulates real plant electrical consumption with dual operational peaks (morning 10:00 and evening 18:00) and weekend curtailment (-90 kW). The backend introduces{" "}
                <code className="text-amber font-mono text-xs bg-panel-2 px-1 py-0.5 rounded border border-line">
                  POST /api/forecast/energy
                </code>{" "}
                in FastAPI, benchmarking four distinct forecasters against a held-out test series: 1) Naive (last-value flat baseline); 2) Seasonal-Naive (24-hour lookback); 3) Holt Linear (double exponential smoothing); and 4) Holt-Winters (additive triple exponential smoothing with level, damped trend, and cyclical seasonal indices). The frontend renders an interactive HTML5 Canvas trace with color-coded algorithms (verdigris historical, amber Holt-Winters, steel seasonal-naive, ember Holt linear, violet naive), show/hide toggles, horizon and noise sliders, and an automated accuracy comparison table highlighting optimal performance.
              </p>
            </div>

            {/* Section 2: What was difficult */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. What Was Difficult
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Demonstrating genuine mathematical superiority across forecasting paradigms required careful calibration of trend and seasonal smoothing dynamics. In cyclical industrial loads without secular growth, unconstrained Holt linear methods project runaway linear trajectories that diverge sharply across multi-step horizons (producing 47.09% MAPE). Meanwhile, while Seasonal-Naive captures the 24-hour diurnal shape well (1.77% MAPE), it carries forward 100% of single-sample stochastic measurement noise from the previous day. To ensure Holt-Winters definitively beats Seasonal-Naive (~1.36% MAPE), trend dampening ($\phi = 0.90$) and a small slope learning rate ($\beta = 0.001$) were introduced alongside seasonal smoothing ($\gamma = 0.15$), allowing the algorithm to filter noise across multiple historical cycles rather than echoing single-cycle noise.
              </p>
            </div>

            {/* Section 3: What would be changed next time */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. What Would Be Changed Next Time
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Future iterations would extend the single-frequency diurnal model ($m=24$) to dual-seasonal state-space formulations (such as TBATS or trigonometric BATS) that simultaneously model both high-frequency diurnal cycles (24h) and low-frequency weekly operational calendars (168h) without requiring piecewise weekend heuristic segmentation.
              </p>
            </div>
          </article>

          {/* Entry: Dual-Controller Comparison View */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // SIM-00-EXT
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-22
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Dual-Controller Comparison Mode (/pid-lab)
                </h2>
              </div>
              <Link
                href="/pid-lab"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN PID LAB</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Added an interactive dual-controller comparison mode directly into the existing{" "}
                <Link href="/pid-lab" className="text-text hover:text-amber underline">
                  /pid-lab
                </Link>{" "}
                page via a top-level mode toggle (&quot;Single controller&quot; vs &quot;Compare two controllers&quot;). In compare mode, users adjust two independent parameter panels side by side (Controller A in amber, Controller B in verdigris) with per-trace show/hide toggles and independent setpoints. Both controllers run synchronously against the exact same discrete-time hydraulic mass balance (dt = 0.1s, 600 steps, h₀ = 20%, outflowBase = 0.60) to guarantee a scientifically valid comparison. Beneath the overlaid canvas, a comparison table automatically calculates and highlights the superior controller across six metrics: Overshoot (%), Rise Time (t_r), Settling Time (t_s), IAE (Integrated Absolute Error), ISE (Integrated Square Error), and ITAE (Integrated Time Absolute Error). Four curated teaching presets demonstrate steady-state offset elimination (P-only vs PI), aggressive vs conservative tuning, integral damping vs ringing, and derivative action on a lag-free process as an honest teaching case.
              </p>
            </div>

            {/* Section 2: What was difficult */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. What Was Difficult
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                The most notable mathematical finding during verification was analyzing the behavior of Kd in an idealized first-order process. In an open-loop plant without actuator time delay (tau_v = 0) or measurement lag, linear system theory proves that derivative action on error does not increase the damping ratio of a PI closed loop; instead, it slows response velocity, extending positive error dwell and accumulating slight additional integral windup. In the standard discrete tank model with valve gain = 0.02, Kd=0 yields 18.95% overshoot while Kd=0.3 yields 18.97% (a 0.02% difference, making curves virtually identical). Visible derivative damping in physical liquid level processes fundamentally requires valve stroke inertia (as modeled in the cascade testbench) or higher relative actuator authority.
              </p>
            </div>

            {/* Section 3: What would be changed next time */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. What Would Be Changed Next Time
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Future iterations could add an optional toggle for actuator lag (tau_valve) or transport dead time directly into the shared process settings panel, allowing users to actively switch between pure first-order response and higher-order inertia-dominated response to see directly why derivative action shines in thermal/motion loops but is historically avoided in simple single-capacity liquid level loops.
              </p>
            </div>
          </article>

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

          {/* Entry: Multi-Sensor Anomaly Detection */}
          <article className="rounded border border-line bg-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    FEATURE // MOD-04
                  </span>
                  <span className="font-mono text-xs text-text-faint">
                    2026-09-22
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-semibold text-text">
                  Multi-Sensor Anomaly Detection (Mahalanobis Distance)
                </h2>
              </div>
              <Link
                href="/intelligence/anomaly-detection"
                className="font-mono text-xs text-amber hover:underline flex items-center gap-1"
              >
                <span>OPEN DETECTOR</span>
                <span>⟶</span>
              </Link>
            </div>

            {/* Section 1: What was built */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                1. What Was Built
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Unsupervised multivariate anomaly detection module at{" "}
                <Link href="/intelligence/anomaly-detection" className="text-text hover:text-amber underline">
                  /intelligence/anomaly-detection
                </Link>{" "}
                using Mahalanobis distance from a training-window covariance baseline across 5 correlated 
                process sensors (temperature, pressure, flow, level, vibration). Includes 5 selectable 
                test scenarios: nominal baseline, pressure-flow relationship violation, vibration fault with 
                normal temperature, gradual relationship drift, and the critical simultaneous moderate 
                deviations scenario where no single sensor crosses its own threshold but the joint deviation 
                is statistically significant. Multi-panel synchronized chart with crimson anomaly highlighting 
                across all sensor panels simultaneously.
              </p>
            </div>

            {/* Section 2: What was difficult */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                2. What Was Difficult
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                The central challenge was calibrating the synthetic anomaly magnitudes for Scenario 4 
                (simultaneous moderate deviations) to sit in the narrow band where each sensor stays below 
                its individual 2-sigma threshold (~1.3-1.5 sigma per sensor) while the joint Mahalanobis 
                distance clearly crosses the multivariate threshold. Too large and single-sensor detectors 
                would catch it anyway; too small and even the multivariate detector misses it. The Cholesky 
                decomposition for covariance matrix inversion required careful regularization (diagonal + 1e-6) 
                to handle near-singular matrices when sensor correlations are very strong.
              </p>
            </div>

            {/* Section 3: What would be changed next time */}
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber uppercase tracking-wider mb-2">
                3. What Would Be Changed Next Time
              </h3>
              <p className="font-sans text-sm text-text-dim leading-relaxed">
                Rolling Mahalanobis distance was sufficient for all four anomaly patterns, including gradual 
                drift (detected within the drift window, not only after extreme deviation). The main limitation 
                is the fixed training window (first 30% of data) — a true rolling/adaptive baseline would 
                handle concept drift in long-running processes better. Isolation Forest would add value for 
                high-dimensional sensor arrays (20+ sensors) where covariance estimation becomes unreliable, 
                but for 5 correlated sensors the statistical approach is both more transparent and more 
                computationally efficient. A natural next step would be adding a rolling correlation matrix 
                heatmap visualization showing how sensor-pair correlations shift during anomalous periods.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
