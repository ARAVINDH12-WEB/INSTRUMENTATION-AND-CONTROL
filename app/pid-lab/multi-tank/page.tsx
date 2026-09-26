"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import { simulateMultiTank, computeMetrics } from "@/lib/pid-math";

export default function MultiTankPage() {
  const [sp, setSp] = useState(50);
  const [kp, setKp] = useState(2.1);
  const [ki, setKi] = useState(0.35);
  const [kd, setKd] = useState(0.1);
  const [r1, setR1] = useState(1.5);
  const [r2, setR2] = useState(1.5);
  const [showH1, setShowH1] = useState(true);

  // Presets for pedagogical comparison
  const presets = {
    singleTankBaseline: {
      name: "Single-Tank Tuning (Over-aggressive here)",
      kp: 2.1,
      ki: 0.35,
      kd: 0.1,
      sp: 50,
      r1: 1.5,
      r2: 1.5,
      desc: "Same Kp/Ki/Kd as the single-tank well-tuned preset. Demonstrates how intermediate Tank 1 capacitance lag causes massive overshoot (>90%) and prolonged settling.",
    },
    wellTuned: {
      name: "Conservative Well-Tuned (Compensated)",
      kp: 1.6,
      ki: 0.18,
      kd: 0.3,
      sp: 50,
      r1: 1.5,
      r2: 1.5,
      desc: "De-rated proportional and integral gains with added derivative damping to counteract the -180° two-pole phase lag.",
    },
    aggressive: {
      name: "High-Gain Oscillatory Ringing",
      kp: 3.2,
      ki: 0.5,
      kd: 0.0,
      sp: 50,
      r1: 1.5,
      r2: 1.5,
      desc: "High gains drive Tank 1 past 95% head before Tank 2 even crosses 50%, producing violent multi-cycle ringing.",
    },
    highResistance: {
      name: "High Inter-Tank Restriction (R1 = 2.5)",
      kp: 1.6,
      ki: 0.18,
      kd: 0.3,
      sp: 50,
      r1: 2.5,
      r2: 1.5,
      desc: "Narrow inter-tank restriction chokes flow between tanks, increasing lag time and driving Tank 1 to a steep intermediate head.",
    },
  };

  const applyPreset = (presetKey: keyof typeof presets) => {
    const p = presets[presetKey];
    setKp(p.kp);
    setKi(p.ki);
    setKd(p.kd);
    setSp(p.sp);
    setR1(p.r1);
    setR2(p.r2);
  };

  // Run simulation
  const simulationData = useMemo(() => {
    return simulateMultiTank(kp, ki, kd, sp, {
      R1: r1,
      R2: r2,
      steps: 800,
      dt: 0.1,
      initialLevel1: 20,
      initialLevel2: 20,
    });
  }, [kp, ki, kd, sp, r1, r2]);

  const h2Series = useMemo(() => simulationData.map((d) => d.h2), [simulationData]);
  const h1Series = useMemo(() => simulationData.map((d) => d.h1), [simulationData]);

  const metricsH2 = useMemo(() => computeMetrics(h2Series, sp), [h2Series, sp]);
  const maxH1 = Math.max(...h1Series);
  const finalH2 = h2Series[h2Series.length - 1] ?? 0;
  const finalH1 = h1Series[h1Series.length - 1] ?? 0;

  const overshootColor =
    metricsH2.overshootPct > 20
      ? "text-crimson"
      : metricsH2.overshootPct < 5
      ? "text-verdigris"
      : "text-[#2DD4BF]";

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-[#2DD4BF]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#2DD4BF] shadow-[0_0_6px_#2DD4BF] animate-pulse" />
              <Link href="/pid-lab" className="text-[#2DD4BF] hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>HYDRAULIC COUPLING</span>
              <span>·</span>
              <span>TWO-TANK INTERACTING SYSTEM</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Multi-Tank Interacting System Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Explore closed-loop liquid level regulation across two gravity-coupled tanks in series. 
              The controller senses and regulates only the bottom vessel level <span className="font-mono text-[#2DD4BF] font-semibold">h2</span> by modulating inflow into the top vessel <span className="font-mono text-[#588A6E] font-semibold">h1</span>.
              The unmeasured intermediate volume acts as a dynamic lag, making this a genuinely 2nd-order plant prone to severe overshoot.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            {/* Actuators & Controls Column */}
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              {/* Presets Selector */}
              <div className="border-b border-[#26211A] pb-3 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-panel-heading text-sm font-semibold text-text uppercase tracking-wider">
                    Teaching Presets
                  </h2>
                  <span className="font-mono text-[10px] text-text-faint">BENCHMARK TUNINGS</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("singleTankBaseline")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#2DD4BF]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-[#2DD4BF]">SINGLE-TANK PRESET</div>
                    <div className="font-sans text-[10px] text-text-faint">Kp=2.1, Ki=0.35 (Over-aggressive)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("wellTuned")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#2DD4BF]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-verdigris">WELL-TUNED (2ND-ORD)</div>
                    <div className="font-sans text-[10px] text-text-faint">Kp=1.6, Ki=0.18, Kd=0.3</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("aggressive")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#2DD4BF]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-crimson">AGGRESSIVE RINGING</div>
                    <div className="font-sans text-[10px] text-text-faint">Kp=3.2, Ki=0.5, Kd=0.0</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("highResistance")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#2DD4BF]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-amber">CHOKED RESTRICTION</div>
                    <div className="font-sans text-[10px] text-text-faint">R1 = 2.5 (Severe Lag)</div>
                  </button>
                </div>
              </div>

              {/* Rotary Knobs */}
              <div className="flex flex-col items-center gap-4 py-1">
                <RotaryKnob
                  label="SETPOINT TANK 2 (h2)"
                  value={sp}
                  min={10}
                  max={90}
                  step={5}
                  unit="%"
                  onChange={setSp}
                  accentColor="#2DD4BF"
                />

                <div className="grid grid-cols-3 gap-3 w-full justify-items-center border-t border-[#26211A] pt-4">
                  <RotaryKnob
                    label="GAIN (Kp)"
                    value={kp}
                    min={0.2}
                    max={8.0}
                    step={0.1}
                    precision={1}
                    onChange={setKp}
                    accentColor="#2DD4BF"
                  />
                  <RotaryKnob
                    label="INTEGRAL (Ki)"
                    value={ki}
                    min={0.0}
                    max={2.0}
                    step={0.05}
                    precision={2}
                    onChange={setKi}
                    accentColor="#2DD4BF"
                  />
                  <RotaryKnob
                    label="DERIV (Kd)"
                    value={kd}
                    min={0.0}
                    max={2.0}
                    step={0.05}
                    precision={2}
                    onChange={setKd}
                    accentColor="#2DD4BF"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 w-full justify-items-center border-t border-[#26211A] pt-4">
                  <RotaryKnob
                    label="COUPLING RES (R1)"
                    value={r1}
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    precision={1}
                    onChange={setR1}
                    accentColor="#588A6E"
                  />
                  <RotaryKnob
                    label="DRAIN RES (R2)"
                    value={r2}
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    precision={1}
                    onChange={setR2}
                    accentColor="#588A6E"
                  />
                </div>
              </div>

              {/* Physical Constants & Dual Trace Switch */}
              <div className="mt-5 rounded border border-[#2B251D] bg-[#100E0B] p-3.5 font-mono text-xs text-text-dim shadow-inner space-y-2">
                <div className="text-[#2DD4BF] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                    TRACE CONTROLS
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-text hover:text-[#2DD4BF]">
                    <input
                      type="checkbox"
                      checked={showH1}
                      onChange={(e) => setShowH1(e.target.checked)}
                      className="accent-[#2DD4BF] rounded cursor-pointer"
                    />
                    SHOW TANK 1 (h1)
                  </label>
                </div>
                <div className="text-[11px] space-y-1 text-text-faint border-t border-[#1C1813] pt-2">
                  <div>Vessel Areas: Area 1 = Area 2 = 1.0 m²</div>
                  <div>Inlet Valve Gain: Kv = 0.02 m³/s/%</div>
                  <div>Inter-Tank Coupling: Inflow 2 = Outflow 1 (h1/R1)</div>
                </div>
              </div>
            </aside>

            {/* Oscilloscope & Analysis Column */}
            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#26211A] pb-2.5">
                <div>
                  <h2 className="font-panel-heading text-lg font-semibold text-text">
                    Liquid Level Transient Waveforms
                  </h2>
                  <div className="font-mono text-xs text-text-faint flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[#2DD4BF]">
                      <span className="w-2 h-0.5 bg-[#2DD4BF]" />
                      PRIMARY: TANK 2 (h2)
                    </span>
                    {showH1 && (
                      <span className="flex items-center gap-1 text-[#588A6E]">
                        <span className="w-2 h-0.5 bg-[#588A6E]" />
                        SECONDARY: TANK 1 (h1 LAG)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[#2DD4BF]">
                    h2 FINAL: {finalH2.toFixed(1)}%
                  </span>
                  <span className="rounded border border-[#588A6E]/40 bg-[#588A6E]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[#588A6E]">
                    h1 FINAL: {finalH1.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Oscilloscope Canvas */}
              <OscilloscopeCanvas
                data={h2Series}
                setpoint={sp}
                minY={0}
                maxY={100}
                unit="%"
                totalTime={80.0}
                dt={0.1}
                color="#2DD4BF"
                secondaryData={showH1 ? h1Series : undefined}
                secondarySetpoint={sp}
                secondaryColor="#588A6E"
                showPrimary={true}
                showSecondary={showH1}
                labelPrimary="h2 Tank 2 (Controlled)"
                labelSecondary="h1 Tank 1 (Unmeasured Lag)"
                height={390}
              />

              {/* Real-time Metrics Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">h2 Overshoot</div>
                  <div className={`font-mono text-lg font-bold ${overshootColor}`}>
                    {metricsH2.overshootPct.toFixed(1)}%
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">
                    {metricsH2.overshootPct > 20 ? "SEVERE RINGING" : "CONTROLLED"}
                  </div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">h2 Rise Time (90%)</div>
                  <div className="font-mono text-lg font-bold text-text">
                    {metricsH2.riseTimeSec !== null ? `${metricsH2.riseTimeSec.toFixed(1)}s` : "N/A"}
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Single-tank: 9.7s</div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">h2 Settling Time (±5%)</div>
                  <div className="font-mono text-lg font-bold text-text">
                    {metricsH2.settlingTimeSec > 0 ? `${metricsH2.settlingTimeSec.toFixed(1)}s` : ">80s"}
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Band: [{(sp * 0.95).toFixed(0)}%, {(sp * 1.05).toFixed(0)}%]</div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">Tank 1 Peak Head</div>
                  <div className="font-mono text-lg font-bold text-[#588A6E]">
                    {maxH1.toFixed(1)}%
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Unmeasured Surge</div>
                </div>
              </div>

              {/* Teaching Point Section */}
              <div className="rounded border border-[#302B22] bg-[#100E0B] p-4 font-mono text-xs text-text-dim space-y-2">
                <div className="text-[#2DD4BF] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                  PHYSICAL INSIGHT // 2ND-ORDER HYDRAULIC PHASE LAG
                </div>
                <p className="font-sans text-xs text-text-dim leading-relaxed">
                  In a single-tank process, maximum phase lag is strictly 90° (single pole at s = -1/RC). 
                  In this multi-tank system, two gravity vessels in series introduce two cascaded poles, pushing the open-loop phase lag toward <strong>-180°</strong>. 
                  Because the controller observes only Tank 2 (<span className="text-[#2DD4BF]">h2</span>), it continues driving the inlet valve wide open while Tank 1 (<span className="text-[#588A6E]">h1</span>) accumulates a massive surplus of fluid head. 
                  By the time Tank 2 crosses 50%, Tank 1 is already at {maxH1.toFixed(1)}%, guaranteeing severe overshoot before gravity drainage can restore equilibrium.
                </p>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
