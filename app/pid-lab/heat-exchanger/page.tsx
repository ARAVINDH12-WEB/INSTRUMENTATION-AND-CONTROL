"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import { simulateHeatExchanger, computeMetrics } from "@/lib/pid-math";

export default function HeatExchangerPage() {
  const [sp, setSp] = useState(60);
  const [kp, setKp] = useState(2.1);
  const [ki, setKi] = useState(0.35);
  const [kd, setKd] = useState(0.1);
  const [deadTime, setDeadTime] = useState(3.0);
  const [thermalMass, setThermalMass] = useState(40);
  const [uaCoeff, setUaCoeff] = useState(0.8);

  // Curated comparison presets
  const presets = {
    zeroDelay: {
      name: "Zero Dead Time (0.0s Baseline)",
      kp: 2.1,
      ki: 0.35,
      kd: 0.1,
      sp: 60,
      deadTime: 0.0,
      desc: "Instantaneous thermal valve response. Controller feedback loop responds immediately with no phase delay.",
    },
    nominalDelay: {
      name: "Nominal Transport Delay (3.0s)",
      kp: 2.1,
      ki: 0.35,
      kd: 0.1,
      sp: 60,
      deadTime: 3.0,
      desc: "Standard 3-second piping dead time. The same PID gains now exhibit higher overshoot and prolonged settling.",
    },
    severeDelay: {
      name: "Severe Transport Delay (6.0s)",
      kp: 2.1,
      ki: 0.35,
      kd: 0.1,
      sp: 60,
      deadTime: 6.0,
      desc: "Long pipe run causes 6s lag. The loop phase margin is severely eroded, driving the system toward continuous oscillation.",
    },
    retunedConservative: {
      name: "Conservative Retuned for Delay",
      kp: 1.2,
      ki: 0.15,
      kd: 0.3,
      sp: 60,
      deadTime: 3.0,
      desc: "De-rated proportional and integral gains with added derivative advance to restore stable phase margin under 3s delay.",
    },
  };

  const applyPreset = (presetKey: keyof typeof presets) => {
    const p = presets[presetKey];
    setKp(p.kp);
    setKi(p.ki);
    setKd(p.kd);
    setSp(p.sp);
    setDeadTime(p.deadTime);
  };

  // Run simulation
  const simulationData = useMemo(() => {
    return simulateHeatExchanger(kp, ki, kd, sp, {
      deadTimeSeconds: deadTime,
      thermalMass,
      uaCoeff,
      steps: 800,
      dt: 0.1,
      coldInletTemp: 20,
      hotSourceTemp: 95,
    });
  }, [kp, ki, kd, sp, deadTime, thermalMass, uaCoeff]);

  const metrics = useMemo(() => computeMetrics(simulationData, sp), [simulationData, sp]);
  const finalTemp = simulationData[simulationData.length - 1] ?? 0;
  const maxTemp = Math.max(...simulationData);

  const overshootColor =
    metrics.overshootPct > 35
      ? "text-crimson"
      : metrics.overshootPct < 15
      ? "text-verdigris"
      : "text-[#FF6B4A]";

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-[#FF6B4A]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FF6B4A] shadow-[0_0_6px_#FF6B4A] animate-pulse" />
              <Link href="/pid-lab" className="text-[#FF6B4A] hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>THERMODYNAMICS &amp; TRANSPORT LAG</span>
              <span>·</span>
              <span>SHELL-AND-TUBE HEAT EXCHANGER</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Counter-Current Heat Exchanger Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Model a shell-and-tube heat exchanger regulating the cold stream outlet temperature by modulating hot-fluid steam flow. 
              Features an <span className="font-mono text-[#FF6B4A] font-semibold">adjustable transport dead time knob</span> to explore directly how physical fluid pipe delay introduces phase lag, degrades stability margins, and forces conservative controller tuning.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            {/* Actuators Column */}
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              {/* Presets Selector */}
              <div className="border-b border-[#26211A] pb-3 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-panel-heading text-sm font-semibold text-text uppercase tracking-wider">
                    Dead Time Benchmarks
                  </h2>
                  <span className="font-mono text-[10px] text-text-faint">PRESET SCENARIOS</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("zeroDelay")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#FF6B4A]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-verdigris">ZERO DEAD TIME (0s)</div>
                    <div className="font-sans text-[10px] text-text-faint">Instantaneous feedback baseline</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("nominalDelay")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#FF6B4A]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-[#FF6B4A]">NOMINAL DELAY (3s)</div>
                    <div className="font-sans text-[10px] text-text-faint">Standard piping transport lag</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("severeDelay")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#FF6B4A]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-crimson">SEVERE DELAY (6s)</div>
                    <div className="font-sans text-[10px] text-text-faint">Degraded loop stability margin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("retunedConservative")}
                    className="p-2 text-left rounded border border-[#2B251D] bg-[#12100C] hover:border-[#FF6B4A]/50 hover:bg-[#1A1713] transition-colors"
                  >
                    <div className="font-mono text-[11px] font-semibold text-amber">RETUNED PID (3s)</div>
                    <div className="font-sans text-[10px] text-text-faint">Conservative gains + damping</div>
                  </button>
                </div>
              </div>

              {/* Rotary Knobs */}
              <div className="flex flex-col items-center gap-4 py-1">
                {/* Dead Time Knob: Highlighted as Primary Interactive Element */}
                <div className="w-full rounded border border-[#FF6B4A]/40 bg-[#1E1712] p-3 flex flex-col items-center shadow-[0_0_12px_rgba(255,107,74,0.15)]">
                  <div className="font-mono text-[10px] font-bold text-[#FF6B4A] tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B4A] animate-pulse" />
                    KEY TEACHING CONTROL: TRANSPORT DELAY
                  </div>
                  <RotaryKnob
                    label="DEAD TIME (θd)"
                    value={deadTime}
                    min={0.0}
                    max={10.0}
                    step={0.5}
                    precision={1}
                    unit="s"
                    onChange={setDeadTime}
                    accentColor="#FF6B4A"
                  />
                  <div className="font-sans text-[10px] text-text-faint mt-1 text-center">
                    Set to 0.0s to compare instantaneous vs delayed loop behavior directly
                  </div>
                </div>

                <RotaryKnob
                  label="TARGET OUTLET TEMP (Tsp)"
                  value={sp}
                  min={30}
                  max={85}
                  step={5}
                  unit="°C"
                  onChange={setSp}
                  accentColor="#FF6B4A"
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
                    accentColor="#FF6B4A"
                  />
                  <RotaryKnob
                    label="INTEGRAL (Ki)"
                    value={ki}
                    min={0.0}
                    max={2.0}
                    step={0.05}
                    precision={2}
                    onChange={setKi}
                    accentColor="#FF6B4A"
                  />
                  <RotaryKnob
                    label="DERIV (Kd)"
                    value={kd}
                    min={0.0}
                    max={2.0}
                    step={0.05}
                    precision={2}
                    onChange={setKd}
                    accentColor="#FF6B4A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 w-full justify-items-center border-t border-[#26211A] pt-4">
                  <RotaryKnob
                    label="THERMAL MASS (Cth)"
                    value={thermalMass}
                    min={15}
                    max={80}
                    step={5}
                    precision={0}
                    onChange={setThermalMass}
                    accentColor="#FF8C42"
                  />
                  <RotaryKnob
                    label="HEAT COEFF (UA)"
                    value={uaCoeff}
                    min={0.2}
                    max={1.8}
                    step={0.1}
                    precision={1}
                    onChange={setUaCoeff}
                    accentColor="#FF8C42"
                  />
                </div>
              </div>

              {/* Physical Constants Card */}
              <div className="mt-5 rounded border border-[#2B251D] bg-[#100E0B] p-3.5 font-mono text-xs text-text-dim shadow-inner space-y-1">
                <div className="text-[#FF6B4A] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
                  EXCHANGER PARAMETERS
                </div>
                <div className="text-[11px] space-y-0.5 text-text-faint">
                  <div>Cold Fluid Inlet: T_cold = 20.0 °C</div>
                  <div>Hot Fluid Source: T_hot = 95.0 °C</div>
                  <div>Delay Buffer: {Math.round(deadTime / 0.1)} discrete steps (@ 100ms dt)</div>
                </div>
              </div>
            </aside>

            {/* Scope Column */}
            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#26211A] pb-2.5">
                <div>
                  <h2 className="font-panel-heading text-lg font-semibold text-text">
                    Outlet Temperature Tout(t)
                  </h2>
                  <div className="font-mono text-xs text-text-faint mt-0.5">
                    COUNTER-CURRENT HEAT EXCHANGER · TRANSPORT DEAD TIME: {deadTime.toFixed(1)}s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded border border-[#FF6B4A]/40 bg-[#FF6B4A]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[#FF6B4A]">
                    FINAL TOUT: {finalTemp.toFixed(1)} °C
                  </span>
                  <span className="rounded border border-[#2B251D] bg-[#100E0B] px-2.5 py-1 font-mono text-xs text-text-dim">
                    PEAK: {maxTemp.toFixed(1)} °C
                  </span>
                </div>
              </div>

              {/* Oscilloscope Canvas */}
              <OscilloscopeCanvas
                data={simulationData}
                setpoint={sp}
                minY={20}
                maxY={100}
                unit="°C"
                totalTime={80.0}
                dt={0.1}
                color="#FF6B4A"
                labelPrimary="Outlet Temp Tout"
                showSecondary={false}
                height={390}
              />

              {/* Real-time Metrics Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">Overshoot</div>
                  <div className={`font-mono text-lg font-bold ${overshootColor}`}>
                    {metrics.overshootPct.toFixed(1)}%
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">
                    {deadTime > 0 ? `+${(metrics.overshootPct - 31.27 > 0 ? (metrics.overshootPct - 31.27).toFixed(1) : "0.0")}% vs 0s delay` : "Zero delay ref"}
                  </div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">Rise Time (90%)</div>
                  <div className="font-mono text-lg font-bold text-text">
                    {metrics.riseTimeSec !== null ? `${metrics.riseTimeSec.toFixed(1)}s` : "N/A"}
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Initial delay: {deadTime.toFixed(1)}s</div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">Settling Time (±5%)</div>
                  <div className="font-mono text-lg font-bold text-text">
                    {metrics.settlingTimeSec > 0 ? `${metrics.settlingTimeSec.toFixed(1)}s` : ">80s"}
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Band: [{(sp * 0.95).toFixed(0)}°C, {(sp * 1.05).toFixed(0)}°C]</div>
                </div>

                <div className="rounded border border-[#26211A] bg-[#12100C] p-3">
                  <div className="font-mono text-[10px] text-text-faint uppercase">Transport Dead Time</div>
                  <div className="font-mono text-lg font-bold text-[#FF6B4A]">
                    {deadTime.toFixed(1)}s
                  </div>
                  <div className="font-mono text-[9px] text-text-faint">Delay buffer length: {Math.round(deadTime / 0.1)}</div>
                </div>
              </div>

              {/* Physical Insight Card */}
              <div className="rounded border border-[#302B22] bg-[#100E0B] p-4 font-mono text-xs text-text-dim space-y-2">
                <div className="text-[#FF6B4A] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
                  CONTROL THEORY // PHASE LAG OF PURE DEAD TIME
                </div>
                <p className="font-sans text-xs text-text-dim leading-relaxed">
                  Transport dead time (&theta;d) represents the physical travel duration of steam through piping before heat enters the process. 
                  In Laplace domain, delay is modeled as <strong className="text-text">e^(-s &theta;d)</strong>. 
                  Unlike dynamic poles which attenuate high-frequency amplitude (|G(j&omega;)| &lt; 1), pure delay has <strong className="text-text">gain = 1.0 at all frequencies</strong> while introducing continuous negative phase lag <strong className="text-text">&Delta;&phi; = -&omega; &theta;d</strong>. 
                  This direct phase erosion eats up loop phase margin, causing aggressive Kp/Ki gains that were stable under instantaneous feedback (&theta;d = 0s) to exhibit elevated overshoot and slow decay envelopes.
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
