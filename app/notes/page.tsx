import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Engineering Notes & Technical Guides — ControlForge",
  description:
    "Technical monographs and field engineering guides in process instrumentation, industrial control loops, and sensor technologies.",
};

export default function NotesPage() {
  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-10 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-3">
            <span>FIELD MONOGRAPHS // INSTRUMENTATION</span>
            <span>·</span>
            <span>ENGINEERING REPOSITORIES</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-cf-text mb-4">
            Technical Notes &amp; Whitepapers
          </h1>
          <p className="text-cf-text-dim text-base leading-relaxed">
            Rigorous, practical engineering documentation on primary sensing elements, industrial transmitters, 
            loop design standards, and DCS interfacing principles.
          </p>
        </header>

        <div className="flex flex-col gap-6 max-w-4xl">
          {/* Featured Full Article */}
          <article className="bg-cf-panel p-6 md:p-8 border border-cf-line rounded transition-colors hover:bg-[#201D17] hover:border-cf-amber group">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-cf-text-faint mb-3">
              <span className="bg-cf-amber/15 text-cf-amber border border-cf-amber/40 px-2 py-0.5 rounded text-[11px]">
                GUIDE // INSTRUMENTATION
              </span>
              <span>TAG: PT-101</span>
              <span>·</span>
              <span>12 MIN READ</span>
              <span>·</span>
              <span className="text-cf-verdigris font-semibold">COMPLETE MONOGRAPH</span>
            </div>

            <h2 className="font-heading text-xl md:text-2xl font-semibold text-cf-text mb-3 group-hover:text-cf-amber transition-colors">
              <Link href="/notes/pressure-transmitter-control-loop">
                How a Pressure Transmitter Participates in a Control Loop
              </Link>
            </h2>

            <p className="text-cf-text-dim text-sm md:text-base leading-relaxed mb-6">
              A complete engineering examination of industrial pressure measurement: piezoresistive vs. capacitive 
              sensing diaphragms, 4–20 mA HART signal synthesis, impulse line installation, calibration range/span, 
              thermal drift mitigation, and end-to-end signal routing to the final control element.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-cf-line-soft pt-4 gap-4">
              <Link
                href="/notes/pressure-transmitter-control-loop"
                className="inline-flex items-center gap-2 bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase px-4 py-2 rounded hover:brightness-110 tracking-wider"
              >
                READ COMPLETE GUIDE ⟶
              </Link>
              <span className="font-mono text-xs text-cf-text-faint">
                CF-NOTE-001 // ISA-5.1 COMPLIANT
              </span>
            </div>
          </article>

          {/* Placeholder Guides in Archive */}
          <article className="bg-cf-panel/75 p-6 md:p-8 border border-cf-line rounded opacity-80">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-cf-text-faint mb-2">
              <span className="bg-cf-panel-2 text-cf-text-dim border border-cf-line px-2 py-0.5 rounded text-[11px]">
                MONOGRAPH
              </span>
              <span>TAG: TE-201 / RTD</span>
              <span>·</span>
              <span className="text-cf-amber-dim font-mono">COMING IN PHASE 2</span>
            </div>

            <h3 className="font-heading text-lg font-semibold text-cf-text-dim mb-2">
              RTD 2-Wire vs. 3-Wire vs. 4-Wire Lead Resistance Compensation
            </h3>

            <p className="text-cf-text-faint text-sm leading-relaxed">
              Derivation of Wheatstone bridge balancing and current excitation circuits in platinum resistance thermometry.
            </p>
          </article>

          <article className="bg-cf-panel/75 p-6 md:p-8 border border-cf-line rounded opacity-80">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-cf-text-faint mb-2">
              <span className="bg-cf-panel-2 text-cf-text-dim border border-cf-line px-2 py-0.5 rounded text-[11px]">
                STANDARDS
              </span>
              <span>TAG: SIL / IEC-61508</span>
              <span>·</span>
              <span className="text-cf-amber-dim font-mono">COMING IN PHASE 2</span>
            </div>

            <h3 className="font-heading text-lg font-semibold text-cf-text-dim mb-2">
              Safety Instrumented Systems (SIS) &amp; PFDavg Calculations
            </h3>

            <p className="text-cf-text-faint text-sm leading-relaxed">
              Probability of Failure on Demand, Proof Test Intervals, and 1oo2 vs 2oo3 architecture voting reliability.
            </p>
          </article>
        </div>
      </main>

      <SiteFooter subtitle="FIELD MONOGRAPHS // REV 1.0" />
    </div>
  );
}
