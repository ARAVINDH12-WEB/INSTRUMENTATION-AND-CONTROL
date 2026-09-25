"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import { simulateTemperature } from "@/lib/pid-math";

export default function TemperaturePage() {
  const [sp, setSp] = useState(80);
  const [amb, setAmb] = useState(25);
  const [kp, setKp] = useState(4.0);
  const [ki, setKi] = useState(0.2);
  const [kd, setKd] = useState(1.5);

  const simulationData = useMemo(() => {
    return simulateTemperature(kp, ki, kd, sp, amb);
  }, [kp, ki, kd, sp, amb]);

  const maxTemp = Math.max(...simulationData);

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-ember">
              <span className="inline-block w-2 h-2 rounded-full bg-ember shadow-[0_0_6px_#FF6B4A] animate-pulse" />
              <Link href="/pid-lab" className="text-ember hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>THERMODYNAMICS</span>
              <span>·</span>
              <span>ASYMMETRIC HEATING</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              Temperature Control Process Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Observe thermal inertia and non-linear asymmetric cooling dynamics. 
              Because an electric element can only inject heat (P &ge; 0) and relies purely on ambient dissipation to cool down, 
              recovery from overshoot is inherently slower than symmetric processes.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Chamber Actuators
                </h2>
                <span className="font-mono text-[10px] text-text-faint">CLICK-TO-TYPE KNOBS</span>
              </div>

              <div className="grid grid-cols-2 gap-4 justify-items-center py-2">
                <RotaryKnob
                  label="TARGET SP"
                  value={sp}
                  min={30}
                  max={150}
                  step={1}
                  unit="°C"
                  onChange={setSp}
                  accentColor="#FF6B4A"
                />

                <RotaryKnob
                  label="AMBIENT TEMP"
                  value={amb}
                  min={0}
                  max={45}
                  step={1}
                  unit="°C"
                  onChange={setAmb}
                  accentColor="#FF6B4A"
                />

                <RotaryKnob
                  label="GAIN (Kp)"
                  value={kp}
                  min={0.5}
                  max={15}
                  step={0.5}
                  precision={1}
                  onChange={setKp}
                  accentColor="#FF6B4A"
                />

                <RotaryKnob
                  label="INTEGRAL (Ki)"
                  value={ki}
                  min={0}
                  max={1.5}
                  step={0.02}
                  precision={2}
                  onChange={setKi}
                  accentColor="#FF6B4A"
                />

                <div className="col-span-2 flex justify-center w-full">
                  <RotaryKnob
                    label="DERIVATIVE (Kd)"
                    value={kd}
                    min={0}
                    max={5}
                    step={0.1}
                    precision={1}
                    onChange={setKd}
                    accentColor="#FF6B4A"
                  />
                </div>
              </div>

              <div className="mt-4 rounded border border-[#2B251D] bg-[#100E0B] p-3 font-mono text-xs text-text-dim shadow-inner">
                <div className="text-ember mb-1 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember" />
                  ASYMMETRIC DISSIPATION MODEL
                </div>
                <div className="text-[11px] leading-relaxed">
                  dT/dt = (Q_elec - k_loss · (T - Tamb)) / C_thermal
                </div>
              </div>
            </aside>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex justify-between items-center border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-lg font-semibold text-text">
                  Chamber Temperature Response
                </h2>
                <span className="rounded border border-ember/40 bg-ember/10 px-2.5 py-1 font-mono text-xs font-semibold text-ember shadow-[0_0_6px_rgba(255,107,74,0.2)]">
                  PEAK TEMP: {maxTemp.toFixed(1)}°C
                </span>
              </div>

              <OscilloscopeCanvas
                data={simulationData}
                setpoint={sp}
                minY={20}
                maxY={Math.max(120, Math.ceil(maxTemp + 10))}
                unit="°C"
                totalTime={60}
                dt={0.1}
                color="#FF6B4A"
                showSecondary={false}
                height={380}
              />

              <div className="flex items-center justify-between font-mono text-xs text-text-faint border-t border-[#221D16] pt-3">
                <span>SIMULATION HORIZON: 60.0s · dt = 0.1s</span>
                <span className="text-ember font-semibold">PHOSPHOR BEAM: EMBER</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
