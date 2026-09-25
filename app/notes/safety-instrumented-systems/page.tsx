import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Safety Instrumented Systems (SIS) & SIL Principles — ControlForge",
  description:
    "Engineering monograph on Safety Instrumented Systems (SIS), functional safety standards (IEC 61508/61511), SIL 1–4, and the low-demand PFD_avg approximation.",
};

export default function SafetyInstrumentedSystemsMonographPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cf-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {/* Article Breadcrumbs & Header */}
        <header className="border-b border-cf-line pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-cf-amber tracking-wider uppercase mb-3">
            <Link href="/notes" className="hover:underline">
              NOTES ARCHIVE
            </Link>
            <span className="text-cf-text-faint">/</span>
            <span>FUNCTIONAL SAFETY &amp; RELIABILITY</span>
            <span className="text-cf-text-faint">/</span>
            <span className="text-cf-text-dim">IEC 61508 · IEC 61511</span>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-cf-text mb-4 leading-tight">
            Safety Instrumented Systems (SIS) &amp; Safety Integrity Level (SIL) Principles
          </h1>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-cf-text-dim">
            <span>AUTHOR: FUNCTIONAL SAFETY PRACTICE</span>
            <span>·</span>
            <span>STANDARDS: IEC 61508 / IEC 61511 / ISA-84</span>
            <span>·</span>
            <span>EST. TIME: 14 MIN READ</span>
          </div>
        </header>

        {/* Standard Educational Disclaimer */}
        <div className="bg-cf-panel-2 border border-cf-amber/40 rounded p-4 mb-8 font-mono text-xs text-cf-amber flex items-start gap-3">
          <span className="text-base select-none">⚠</span>
          <div className="leading-relaxed">
            <span className="font-bold">EDUCATIONAL &amp; PORTFOLIO DISCLAIMER: </span>
            This educational content is for learning and portfolio purposes. Always consult the current official standard 
            (IEC 61508 / IEC 61511), qualified functional safety engineers (FS Eng / CFSE), and site safety management 
            procedures for production applications.
          </div>
        </div>

        {/* Article Prose */}
        <article className="space-y-8 font-serif text-[#E2DBD0] text-base md:text-lg leading-relaxed">
          {/* Section 1: Executive Overview */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-cf-text font-sans">
              1. What is a Safety Instrumented System (SIS)?
            </h2>
            <p>
              In process plants, thermal reactors, and chemical refineries, operating equipment produces inherent thermodynamic 
              and chemical risks. To mitigate these hazards, process automation architectures enforce a strict boundary between 
              two fundamentally distinct control layers: the <strong>Basic Process Control System (BPCS)</strong> and the 
              <strong> Safety Instrumented System (SIS)</strong>.
            </p>
            <p>
              A <strong>Safety Instrumented System (SIS)</strong> is an autonomous, dedicated safety loop composed of specialized 
              sensors, logic solvers, and final control elements. Its sole objective is to take the process to a safe state 
              when predetermined hazardous conditions are violated.
            </p>

            <div className="bg-cf-panel border border-cf-line rounded p-4 font-sans text-sm text-cf-text-dim my-4">
              <div className="font-mono text-xs text-cf-amber font-semibold uppercase mb-1">
                THE CARDINAL RULE OF FUNCTIONAL SAFETY:
              </div>
              <p className="leading-relaxed text-cf-text">
                <strong>An SIS does not replace, optimize, or substitute for the regulatory BPCS control loop.</strong> The BPCS 
                actively throttles process variables (pressure, temperature, level, flow) to maintain steady economic throughput. 
                The SIS remains dormant during normal operation, continuously monitoring for dangerous process excursions, and 
                acts independently to shutdown or isolate equipment when the BPCS fails to contain the process.
              </p>
            </div>
          </section>

          {/* Section 2: Flow Diagram (BPCS vs SIS) */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-cf-text font-sans">
              2. Independent Protection Layers: BPCS vs. SIS Architecture
            </h2>
            <p>
              Under IEC 61511 and ISA-84 standards, the BPCS and SIS must remain physically, electrically, and logically 
              independent. A common failure in the BPCS (such as a seized regulatory control valve or a malfunctioning transmitter) 
              must never compromise the ability of the SIS to trip the process.
            </p>

            {/* Visual Signal Flow Diagram Card */}
            <div className="bg-cf-panel border border-cf-line rounded p-5 md:p-6 my-6 font-sans">
              <div className="font-mono text-xs text-cf-amber tracking-widest text-center mb-5 font-semibold">
                FIGURE 1: INDEPENDENT PROTECTION PATHWAYS (REGULATORY BPCS VS. DEDICATED SIS)
              </div>

              <div className="space-y-6">
                {/* Upper Path: BPCS Regulatory Loop */}
                <div className="bg-cf-panel-2 border border-cf-line rounded p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-cf-verdigris">
                      LAYER 1: BASIC PROCESS CONTROL SYSTEM (BPCS) &mdash; DYNAMIC REGULATION
                    </span>
                    <span className="font-mono text-[10px] text-cf-text-faint">CONTINUOUS ACTIVE CONTROL</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 text-center text-xs font-mono">
                    <div className="bg-cf-panel border border-cf-line rounded p-2 min-w-[100px] shrink-0">
                      <div className="text-cf-verdigris font-semibold">PROCESS</div>
                      <div className="text-[10px] text-cf-text-dim">PV Excursion</div>
                    </div>
                    <span className="text-cf-text-faint">⟶</span>
                    <div className="bg-cf-panel border border-cf-line rounded p-2 min-w-[120px] shrink-0">
                      <div className="text-cf-verdigris font-semibold">BPCS SENSOR</div>
                      <div className="text-[10px] text-cf-text-dim">PT-101 (4–20 mA)</div>
                    </div>
                    <span className="text-cf-text-faint">⟶</span>
                    <div className="bg-cf-panel border border-cf-line rounded p-2 min-w-[130px] shrink-0">
                      <div className="text-cf-verdigris font-semibold">DCS / REGULATORY PLC</div>
                      <div className="text-[10px] text-cf-text-dim">PID Calculation</div>
                    </div>
                    <span className="text-cf-text-faint">⟶</span>
                    <div className="bg-cf-panel border border-cf-line rounded p-2 min-w-[120px] shrink-0">
                      <div className="text-cf-verdigris font-semibold">CONTROL VALVE</div>
                      <div className="text-[10px] text-cf-text-dim">FV-101 Throttling</div>
                    </div>
                  </div>
                </div>

                {/* Lower Path: SIS Safety Trip Loop */}
                <div className="bg-cf-panel-2 border border-cf-crimson/50 rounded p-3.5 shadow-[0_0_12px_rgba(214,69,80,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-cf-crimson">
                      LAYER 2: SAFETY INSTRUMENTED SYSTEM (SIS) &mdash; TRIPPING &amp; MITIGATION
                    </span>
                    <span className="font-mono text-[10px] text-cf-crimson font-bold">INDEPENDENT SHUTDOWN</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 text-center text-xs font-mono">
                    <div className="bg-cf-panel border border-cf-line rounded p-2 min-w-[100px] shrink-0">
                      <div className="text-cf-crimson font-semibold">PROCESS</div>
                      <div className="text-[10px] text-cf-text-dim">Hazardous Limit</div>
                    </div>
                    <span className="text-cf-crimson">⟶</span>
                    <div className="bg-cf-panel border border-cf-crimson/40 rounded p-2 min-w-[120px] shrink-0">
                      <div className="text-cf-crimson font-semibold">SIS SENSOR</div>
                      <div className="text-[10px] text-cf-text-dim">PSHH-101 (Certified)</div>
                    </div>
                    <span className="text-cf-crimson">⟶</span>
                    <div className="bg-cf-panel border border-cf-crimson/40 rounded p-2 min-w-[130px] shrink-0">
                      <div className="text-cf-crimson font-semibold">SAFETY LOGIC SOLVER</div>
                      <div className="text-[10px] text-cf-text-dim">TMR / 1oo2D Safety PLC</div>
                    </div>
                    <span className="text-cf-crimson">⟶</span>
                    <div className="bg-cf-panel border border-cf-crimson/40 rounded p-2 min-w-[120px] shrink-0">
                      <div className="text-cf-crimson font-semibold">FINAL ELEMENT</div>
                      <div className="text-[10px] text-cf-text-dim">XV-101 Emergency Trip</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-cf-text-faint text-center mt-4">
                SEPARATION PRINCIPLE: No shared taps, no shared wiring, no shared logic execution, no shared valve stems.
              </div>
            </div>
          </section>

          {/* Section 3: Understanding SIL Levels */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-cf-text font-sans">
              3. Safety Integrity Levels (SIL 1 to SIL 4)
            </h2>
            <p>
              A <strong>Safety Instrumented Function (SIF)</strong> is assigned a target <strong>Safety Integrity Level (SIL)</strong> 
              based on a Layer of Protection Analysis (LOPA) or risk matrix assessment during the plant design phase.
            </p>
            <p>
              SIL is not a property of an individual transmitter or valve; it is a statistical property of the <em>entire safety 
              function from sensor to valve</em>. Higher SIL levels indicate higher required risk reduction, which translates into 
              exponentially stricter requirements for hardware reliability, redundancy, diagnostics, and proof testing.
            </p>

            <div className="overflow-x-auto my-6 font-sans">
              <table className="w-full text-left text-xs font-mono border-collapse border border-cf-line">
                <thead>
                  <tr className="bg-cf-panel-2 text-cf-text-dim">
                    <th className="p-3 border border-cf-line">SIL LEVEL</th>
                    <th className="p-3 border border-cf-line">LOW-DEMAND PFD_AVG</th>
                    <th className="p-3 border border-cf-line">RISK REDUCTION FACTOR (RRF)</th>
                    <th className="p-3 border border-cf-line">TYPICAL INDUSTRIAL CONTEXT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-cf-line">
                    <td className="p-3 font-bold text-cf-text">SIL 1</td>
                    <td className="p-3 text-cf-amber">10⁻² to 10⁻¹ (0.01 to 0.1)</td>
                    <td className="p-3 text-cf-text">10 to 100</td>
                    <td className="p-3 text-cf-text-dim">Minor economic / asset damage; non-lethal hazards</td>
                  </tr>
                  <tr className="border-b border-cf-line bg-cf-panel-2/30">
                    <td className="p-3 font-bold text-cf-text">SIL 2</td>
                    <td className="p-3 text-cf-amber">10⁻³ to 10⁻² (0.001 to 0.01)</td>
                    <td className="p-3 text-cf-text">100 to 1,000</td>
                    <td className="p-3 text-cf-text-dim">Standard chemical plant hazards; severe local injury risk</td>
                  </tr>
                  <tr className="border-b border-cf-line">
                    <td className="p-3 font-bold text-cf-text">SIL 3</td>
                    <td className="p-3 text-cf-amber">10⁻⁴ to 10⁻³ (0.0001 to 0.001)</td>
                    <td className="p-3 text-cf-text">1,000 to 10,000</td>
                    <td className="p-3 text-cf-text-dim">Severe toxic releases, explosion risks, potential fatality</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-cf-crimson">SIL 4</td>
                    <td className="p-3 text-cf-crimson">&lt; 10⁻⁴ (&lt; 0.0001)</td>
                    <td className="p-3 text-cf-crimson">&gt; 10,000</td>
                    <td className="p-3 text-cf-text-dim">Catastrophic community disaster (Nuclear, defense; rarely in chemicals)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-cf-text-dim italic">
              *Note: This reference table summarizes the low-demand mode of operation (&le; 1 demand per year). Continuous or 
              high-demand modes evaluate Probability of Dangerous Failure per Hour (PFH) rather than PFD_avg.
            </p>
          </section>

          {/* Section 4: Low-Demand PFD Approximation */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-cf-text font-sans">
              4. The Low-Demand PFD_avg Formula
            </h2>
            <p>
              In low-demand applications (where an emergency trip condition occurs less than once per year), an instrumented safety 
              element sits idle for months at a time. The primary danger is that the device suffers an <em>unrevealed dangerous failure</em> 
              (&lambda;<sub>DU</sub>)&mdash;such as a stuck valve seat or plugged sensing port&mdash;that remains completely hidden until a real 
              demand arrives, or until technicians perform a manual proof test.
            </p>
            <p>
              The probability that the device has failed dangerous by time <em>t</em> follows the exponential cumulative distribution 
              F(t) = 1 - e<sup>-&lambda;<sub>D</sub>&middot;t</sup>. For realistic industrial failure rates where &lambda;<sub>D</sub>&middot;t &ll; 1, 
              this is linearized to F(t) &approx; &lambda;<sub>D</sub>&middot;t.
            </p>
            <p>
              Over a proof-test interval <em>T</em>, the probability of failure on demand climbs linearly from 0 immediately after a proof 
              test to &lambda;<sub>D</sub>&middot;T immediately prior to the next test. Taking the mean over the interval yields the classical 
              <strong> sawtooth reliability integral</strong>:
            </p>

            <div className="bg-cf-panel border border-cf-line rounded p-5 my-6 font-mono text-center">
              <div className="text-lg md:text-xl font-bold text-cf-amber mb-2">
                PFD_avg &approx; (&lambda;_D &times; T) / 2
              </div>
              <div className="text-xs text-cf-text-dim">
                Where &lambda;_D is the dangerous failure rate and T is the proof-test interval.
              </div>
            </div>

            <h3 className="font-heading text-lg font-semibold text-cf-text font-sans mt-4">
              Physical Interpretation of Each Term:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-cf-text-dim pl-2">
              <li>
                <strong className="text-cf-text font-mono">&lambda;_D (Dangerous Failure Rate):</strong> The statistical frequency at 
                which the device enters a failure state that prevents the SIF from executing its protective trip (typically measured in 
                failures per hour or FIT [10⁻⁹ h⁻¹]).
              </li>
              <li>
                <strong className="text-cf-text font-mono">T (Proof-Test Interval):</strong> The elapsed time between comprehensive 
                manual testing procedures (e.g. 1 year = 8,760 hours, or 2 years = 17,520 hours).
              </li>
              <li>
                <strong className="text-cf-text font-mono">Factor of 1/2:</strong> Because failures occur randomly at any point during 
                the interval with equal likelihood, on average the device has been in a failed state for exactly half the proof-test interval.
              </li>
            </ul>
          </section>

          {/* Section 5: Crucial Limitations of the Approximation */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-cf-text font-sans">
              5. Crucial Limitations of the Simplified Formula
            </h2>
            <p>
              In academic textbooks and quick back-of-the-envelope engineering, PFD_avg &approx; (&lambda;_D &times; T) / 2 is 
              widely quoted. However, applying this formula uncritically in a production facility creates severe compliance and 
              safety hazards. <strong>This first-order equation makes several idealistic assumptions:</strong>
            </p>

            <div className="space-y-3 font-sans text-sm">
              <div className="bg-cf-panel-2 border border-cf-line rounded p-4">
                <div className="font-mono text-xs font-bold text-cf-amber mb-1">
                  1. ASSUMES A SINGLE 1oo1 CHANNEL (NO REDUNDANCY OR VOTING)
                </div>
                <p className="text-cf-text-dim text-xs leading-relaxed">
                  The formula applies only to a single standalone component. Real high-integrity loops deploy 1oo2, 2oo2, or 2oo3 voting 
                  architectures where PFD depends on common-cause failure factors (&beta;) and quadratic terms (&lambda;<sub>D</sub>&sup2;&middot;T&sup2; / 3).
                </p>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-4">
                <div className="font-mono text-xs font-bold text-cf-amber mb-1">
                  2. ASSUMES 100% PERFECT PROOF TESTING (PTC = 1.0)
                </div>
                <p className="text-cf-text-dim text-xs leading-relaxed">
                  Real proof tests (e.g. partial stroke valve testing or bench calibration) rarely reveal 100% of failure modes. 
                  Unrevealed residual degradation accumulates across the plant lifecycle, raising baseline PFD over time.
                </p>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-4">
                <div className="font-mono text-xs font-bold text-cf-amber mb-1">
                  3. IGNORES AUTOMATED DIAGNOSTIC COVERAGE (DC = 0)
                </div>
                <p className="text-cf-text-dim text-xs leading-relaxed">
                  Modern smart instruments (HART, Foundation Fieldbus) detect over 90% of failures online (&lambda;<sub>DD</sub>). 
                  Detected failures are repaired within hours (Mean Time to Restoration, MTTR), dramatically lowering effective PFD compared 
                  to unrevealed failures (&lambda;<sub>DU</sub>).
                </p>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-4">
                <div className="font-mono text-xs font-bold text-cf-amber mb-1">
                  4. FULL SAFETY FUNCTION (SIF) VS. INDIVIDUAL COMPONENTS
                </div>
                <p className="text-cf-text-dim text-xs leading-relaxed">
                  SIL verification requires summing PFD contributions across the entire loop: PFD_avg(SIF) = PFD_avg(Sensors) + 
                  PFD_avg(Logic Solver) + PFD_avg(Final Elements). A sensor achieving SIL 2 alone does not mean the entire loop achieves SIL 2.
                </p>
              </div>
            </div>
          </section>

          {/* Educational Disclaimer Banner */}
          <div className="bg-cf-panel-2 border border-cf-line rounded p-4 font-mono text-xs text-cf-text-dim my-6">
            <span className="text-cf-amber font-semibold mr-1">EDUCATIONAL DISCLAIMER:</span>
            <span>
              This educational content is for learning and portfolio purposes. Always consult the current official standard 
              (IEC 61508 / IEC 61511), a qualified engineer (CFSE/CFSP), and site safety procedures for production applications.
            </span>
          </div>

          {/* Section 6: Interactive Calculator Link Card */}
          <section className="bg-cf-panel border border-cf-line rounded p-6 my-8 font-sans">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-cf-amber font-semibold uppercase mb-1">
                  INTERACTIVE CALCULATION TOOL
                </div>
                <h3 className="font-heading text-lg font-semibold text-cf-text">
                  SIL &amp; PFD_avg Approximation Calculator
                </h3>
                <p className="text-cf-text-dim text-xs mt-1">
                  Experiment with failure rates, proof-test intervals, and observe live step-by-step mathematical breakdowns 
                  into SIL 1 through SIL 4 bands.
                </p>
              </div>
              <Link
                href="/calculators/sil-pfd"
                className="bg-cf-amber text-cf-bg px-4 py-2 rounded font-mono font-bold text-xs uppercase hover:brightness-110 tracking-wider shrink-0"
              >
                OPEN PFD CALCULATOR ⟶
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter subtitle="MONOGRAPHS // FUNCTIONAL SAFETY & SIS" />
    </div>
  );
}
