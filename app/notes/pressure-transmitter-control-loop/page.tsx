import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "How a Pressure Transmitter Participates in a Control Loop — ControlForge",
  description:
    "Technical guide on industrial pressure transmitters: sensing principle, construction, 4-20mA calibration, loop flow diagram, and failure modes.",
};

export default function PressureTransmitterMonographPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cf-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {/* Article Header */}
        <header className="border-b border-cf-line pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-cf-amber tracking-wider uppercase mb-3">
            <Link href="/notes" className="hover:underline">
              NOTES ARCHIVE
            </Link>
            <span className="text-cf-text-faint">/</span>
            <span>INSTRUMENTATION MONOGRAPHS</span>
            <span className="text-cf-text-faint">/</span>
            <span className="text-cf-text-dim">TAG: PT-101</span>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-cf-text mb-4 leading-tight">
            How a Pressure Transmitter Participates in a Control Loop
          </h1>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-cf-text-dim">
            <span>AUTHOR: CONTROL SYSTEMS GROUP</span>
            <span>·</span>
            <span>STANDARDS: ISA-5.1 / IEC 60770</span>
            <span>·</span>
            <span>EST. TIME: 12 MIN READ</span>
          </div>
        </header>

        {/* Article Prose */}
        <article className="article-prose space-y-8 text-[#E2DBD0]">
          {/* Visual Signal Flow Diagram Card */}
          <div className="bg-cf-panel border border-cf-line rounded p-5 md:p-6 my-8">
            <div className="font-mono text-xs text-cf-amber tracking-widest text-center mb-5 font-semibold">
              FIGURE 1: CLOSED-LOOP INSTRUMENTATION SIGNAL FLOW ARCHITECTURE
            </div>
            
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              <div className="bg-cf-panel-2 border border-cf-line rounded p-3 min-w-[120px] text-center flex flex-col gap-1 shrink-0">
                <span className="font-mono text-[11px] text-cf-amber font-semibold">PROCESS</span>
                <span className="font-sans text-sm font-semibold text-cf-text">Pressure</span>
                <span className="font-mono text-[10px] text-cf-text-dim">Fluid Media (0–10 bar)</span>
              </div>

              <div className="text-cf-text-faint font-mono text-sm shrink-0 flex flex-col items-center">
                <span className="text-[10px] text-cf-amber-dim tracking-wider mb-0.5">FORCE</span>
                <span>⟶</span>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-3 min-w-[120px] text-center flex flex-col gap-1 shrink-0">
                <span className="font-mono text-[11px] text-cf-amber font-semibold">PRIMARY SENSOR</span>
                <span className="font-sans text-sm font-semibold text-cf-text">Diaphragm</span>
                <span className="font-mono text-[10px] text-cf-text-dim">Deflection / ΔC</span>
              </div>

              <div className="text-cf-text-faint font-mono text-sm shrink-0 flex flex-col items-center">
                <span className="text-[10px] text-cf-amber-dim tracking-wider mb-0.5">mV / pF</span>
                <span>⟶</span>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-3 min-w-[120px] text-center flex flex-col gap-1 shrink-0">
                <span className="font-mono text-[11px] text-cf-amber font-semibold">TRANSMITTER [PT-101]</span>
                <span className="font-sans text-sm font-semibold text-cf-text">Transmitter</span>
                <span className="font-mono text-[10px] text-cf-text-dim">4–20 mA + HART</span>
              </div>

              <div className="text-cf-text-faint font-mono text-sm shrink-0 flex flex-col items-center">
                <span className="text-[10px] text-cf-amber-dim tracking-wider mb-0.5">CURRENT</span>
                <span>⟶</span>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-3 min-w-[120px] text-center flex flex-col gap-1 shrink-0">
                <span className="font-mono text-[11px] text-cf-amber font-semibold">CONTROLLER</span>
                <span className="font-sans text-sm font-semibold text-cf-text">PLC / DCS</span>
                <span className="font-mono text-[10px] text-cf-text-dim">PID Computation</span>
              </div>

              <div className="text-cf-text-faint font-mono text-sm shrink-0 flex flex-col items-center">
                <span className="text-[10px] text-cf-amber-dim tracking-wider mb-0.5">3–15 PSI</span>
                <span>⟶</span>
              </div>

              <div className="bg-cf-panel-2 border border-cf-line rounded p-3 min-w-[120px] text-center flex flex-col gap-1 shrink-0">
                <span className="font-mono text-[11px] text-cf-amber font-semibold">ACTUATOR [FV-101]</span>
                <span className="font-sans text-sm font-semibold text-cf-text">Control Valve</span>
                <span className="font-mono text-[10px] text-cf-text-dim">Globe Valve Position</span>
              </div>
            </div>
          </div>

          <p className="font-serif text-lg leading-relaxed text-cf-text">
            In any automated process, control is strictly impossible without measurement. An actuator can throttle 
            a steam line or choke a discharge manifold, but unless the controller receives a reliable, calibrated, 
            and low-noise representation of the physical variable, optimal control degrades into instability.
          </p>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              1. Working Principle
            </h2>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              The pressure transmitter serves as an electro-mechanical transducer that converts a physical fluid 
              pressure (measured in kilopascals, bar, or pounds per square inch) into a standardized industrial 
              analog current signal, typically 4 to 20 milliamperes direct current (mA DC).
            </p>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              Modern industrial transmitters primarily utilize either piezoresistive silicon strain gauges or 
              variable capacitance sensing cells:
            </p>
            <ul className="font-serif text-base md:text-[17px] list-disc pl-6 space-y-3">
              <li>
                <strong className="text-cf-text font-sans">Variable Capacitance Sensing:</strong> A sensing diaphragm is welded between two stationary 
                capacitor plates isolated by high-dielectric silicone oil. As line pressure deflects the isolating 
                diaphragm, oil transfers pressure directly onto the center sensing diaphragm. The resulting physical 
                deflection changes the capacitance differential between the plates inversely and linearly.
              </li>
              <li>
                <strong className="text-cf-text font-sans">Piezoresistive Strain Gauge:</strong> Semiconductor resistors are diffused into a silicon 
                diaphragm arranged in a Wheatstone bridge topology. Applied pressure induces mechanical strain that 
                alters the crystal lattice resistance, generating a millivolt output directly proportional to the strain.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              2. Construction &amp; Wetted Materials
            </h2>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              An industrial transmitter operates in hostile process environments containing corrosive liquids, steam, 
              pulsating flow, and severe ambient thermal swings. Its construction is partitioned into two distinct domains:
            </p>
            <ol className="font-serif text-base md:text-[17px] list-decimal pl-6 space-y-3">
              <li>
                <strong className="text-cf-text font-sans">The Wetted Sensor Capsule:</strong> The process interface flange, process isolating diaphragms, 
                and drain/vent valves. Wetted diaphragms must be metallurgically compatible with the process chemistry; 
                standard options include 316L Stainless Steel for clean air and water, Hastelloy C-276 for chlorinated 
                or acid-rich streams, Monel for hydrofluoric compounds, and Tantalum for high-temperature chlorination.
              </li>
              <li>
                <strong className="text-cf-text font-sans">The Dual-Compartment Electronics Housing:</strong> The electronics are sealed from field 
                wiring connections by a terminal barrier wall. This prevents ambient moisture ingress, sulfur corrosion, 
                and flammable vapor migration from penetrating the micro-controller amplifier board.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              3. Calibration Range, Span, and Turndown
            </h2>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              Configuring a transmitter requires defining three fundamental metrological bounds:
            </p>
            <ul className="font-serif text-base md:text-[17px] list-disc pl-6 space-y-2 mb-4">
              <li><strong className="text-cf-text font-sans">Lower Range Value (LRV):</strong> The physical pressure corresponding strictly to 4.00 mA (0% of span).</li>
              <li><strong className="text-cf-text font-sans">Upper Range Value (URV):</strong> The physical pressure corresponding strictly to 20.00 mA (100% of span).</li>
              <li><strong className="text-cf-text font-sans">Span:</strong> The algebraic difference between URV and LRV (Span = URV - LRV).</li>
            </ul>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              Transmitters feature a rated Upper Range Limit (URL). The ratio between URL and calibrated span is designated 
              as the <em>turndown ratio</em> (e.g., 100:1). Operating at extreme turndown ratios amplifies ambient temperature 
              effects and zero-drift errors relative to calibrated span.
            </p>

            <div className="bg-cf-panel-2 border border-cf-line rounded p-4 font-mono text-xs text-cf-amber space-y-2 my-4">
              <div className="flex items-start gap-2">
                <span className="text-cf-text-faint">[1]</span>
                <span>Signal Scaling: I_out = 4 + 16 · ((P_measured - LRV) / (URV - LRV)) mA</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cf-text-faint">[2]</span>
                <span>Transmitter Turndown Ratio: R_td = URL / (URV - LRV)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cf-text-faint">[3]</span>
                <span>Total Probable Error: TPE = √(Accuracy² + Temp_Effect² + Static_Pressure²)</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              4. Accuracy &amp; Temperature Effects
            </h2>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              Reference accuracy is typically quoted at standard factory conditions (20°C ± 2°C) as ±0.04% 
              to ±0.075% of calibrated span. However, field accuracy depends significantly on external process dynamics:
            </p>
            <ul className="font-serif text-base md:text-[17px] list-disc pl-6 space-y-3">
              <li>
                <strong className="text-cf-text font-sans">Ambient Temperature Effect:</strong> Diaphragm fill fluid expands or contracts with ambient 
                temperature swings between day and night, inducing an artificial offset on the zero point. Modern smart 
                transmitters integrate an on-board RTD sensor directly adjacent to the sensing capsule to compute 
                real-time digital thermal compensation.
              </li>
              <li>
                <strong className="text-cf-text font-sans">Static Line Pressure Effect:</strong> In differential pressure flow measurement, high line static 
                pressures (e.g., 100 bar) distort the sensor body, shifting both the zero reference and span slope.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              5. Common Failure Modes &amp; Troubleshooting
            </h2>
            <div className="overflow-x-auto border border-cf-line rounded my-4">
              <table className="w-full text-left font-sans text-xs sm:text-sm">
                <thead className="bg-cf-panel-2 border-b border-cf-line font-mono text-[11px] text-cf-amber uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Failure Symptom</th>
                    <th className="p-3">Probable Cause</th>
                    <th className="p-3">Diagnostic Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cf-line-soft bg-cf-panel">
                  <tr>
                    <td className="p-3 font-semibold text-cf-crimson">Current pegged at 3.6 mA or 21.5 mA</td>
                    <td className="p-3 text-cf-text-dim">Sensor diaphragm rupture, bridge open circuit, or CPU failure</td>
                    <td className="p-3 text-cf-text-dim">Query HART error status code via handheld communicator; inspect fill oil.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cf-amber">Signal reads flat 4.0 mA despite pressure rise</td>
                    <td className="p-3 text-cf-text-dim">Impulse line isolation valve shut or winter freeze-up</td>
                    <td className="p-3 text-cf-text-dim">Check root valve positions; inspect heat tracing and blow down purge lines.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cf-text">Excessive process noise &gt; ±5% on DCS</td>
                    <td className="p-3 text-cf-text-dim">Cavitation, pump pulsation, or electrical ground loop</td>
                    <td className="p-3 text-cf-text-dim">Increase transmitter internal damping filter (e.g., τ = 0.5s to 2.0s); verify shield grounding at DCS rack only.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cf-text">Zero shift following blowdown or steam cleaning</td>
                    <td className="p-3 text-cf-text-dim">Thermal shock causing diaphragm permanent deformation</td>
                    <td className="p-3 text-cf-text-dim">Allow cool-down; perform digital zero trim via HART communicator.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold text-cf-text border-b border-cf-line-soft pb-2 mb-4">
              6. Selection Criteria &amp; Specification Matrix
            </h2>
            <p className="font-serif text-base md:text-[17px] leading-relaxed mb-4">
              When drafting an instrument specification data sheet (ISA format), control engineers evaluate four crucial factors:
            </p>
            <ol className="font-serif text-base md:text-[17px] list-decimal pl-6 space-y-3">
              <li>
                <strong className="text-cf-text font-sans">Process Operating Envelope:</strong> Maximum allowable working pressure (MAWP) must exceed the 
                piping design pressure by at least 25%, with rupture ratings exceeding hydrostatic test conditions.
              </li>
              <li>
                <strong className="text-cf-text font-sans">Impulse Piping vs. Direct Mount:</strong> Direct coplanar mounting eliminates impulse piping leaks 
                and plugging risks in clean services, whereas remote diaphragm seals with capillary tubes are mandatory 
                for viscous, crystallizing, or high-temperature (&gt;150°C) media.
              </li>
              <li>
                <strong className="text-cf-text font-sans">Safety Integrity Level (SIL):</strong> For emergency shutdown loops (ESD), select SIL 2/3 certified 
                transmitters featuring dangerous undetected failure rates (λDU) documented in an exida FMEDA report.
              </li>
              <li>
                <strong className="text-cf-text font-sans">Communication Protocol:</strong> Ensure whether the plant standard requires 4–20 mA with superimposed 
                HART 7, Foundation Fieldbus H1, or Profibus PA for remote diagnostics and asset management integration.
              </li>
            </ol>

            <div className="bg-cf-panel border border-cf-line rounded p-4 font-mono text-xs text-cf-amber mt-8 flex items-center gap-3">
              <span className="text-cf-text-faint font-bold">[NEXT]</span>
              <span>
                To scale physical transmitter mA readings into process units live, launch our{" "}
                <Link href="/calculators/ma-converter" className="text-cf-amber underline hover:brightness-125">
                  4–20 mA Signal Converter
                </Link>.
              </span>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter subtitle="MONOGRAPH CF-NOTE-001 // ISA-5.1 COMPLIANT" />
    </div>
  );
}
