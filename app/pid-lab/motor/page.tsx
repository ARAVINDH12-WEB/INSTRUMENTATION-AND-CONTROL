"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";
import OscilloscopeCanvas from "@/components/pid-lab/OscilloscopeCanvas";
import { simulateMotorSpeed } from "@/lib/pid-math";

export default function MotorPage() {
  const [targetSpeed, setTargetSpeed] = useState(150);
  const [kp, setKp] = useState(1.2);
  const [ki, setKi] = useState(4.0);

  const simulationData = useMemo(() => {
    return simulateMotorSpeed(kp, ki, targetSpeed);
  }, [kp, ki, targetSpeed]);

  const finalSpeed = simulationData[simulationData.length - 1] ?? 0;

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          <header className="mb-8 border-b border-[#302B22] pb-6">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-wider text-steel">
              <span className="inline-block w-2 h-2 rounded-full bg-steel shadow-[0_0_6px_#5B9BD5] animate-pulse" />
              <Link href="/pid-lab" className="text-steel hover:underline">
                SIMULATION SUITE
              </Link>
              <span>/</span>
              <span>ELECTROMECHANICAL DRIVES</span>
              <span>·</span>
              <span>VELOCITY CONTROL</span>
            </div>
            <h1 className="font-panel-heading text-2xl md:text-3xl font-bold tracking-tight text-text">
              DC Motor Velocity Control Simulator
            </h1>
            <p className="mt-2 max-w-3xl font-panel-body text-sm text-text-dim leading-relaxed">
              Explore closed-loop speed regulation for a permanent magnet DC motor. 
              Tune PI parameters to counteract rotor inertia (J = 0.02 kg·m²) and viscous friction damping (B = 0.1 N·s).
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            <aside className="rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-5">
                <h2 className="font-panel-heading text-base font-semibold text-text">
                  Drive Actuators
                </h2>
                <span className="font-mono text-[10px] text-text-faint">CLICK-TO-TYPE KNOBS</span>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                <RotaryKnob
                  label="TARGET VELOCITY (ω)"
                  value={targetSpeed}
                  min={20}
                  max={300}
                  step={5}
                  unit="rad/s"
                  onChange={setTargetSpeed}
                  accentColor="#5B9BD5"
                />

                <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
                  <RotaryKnob
                    label="TORQUE GAIN (Kp)"
                    value={kp}
                    min={0.1}
                    max={5.0}
                    step={0.05}
                    precision={2}
                    onChange={setKp}
                    accentColor="#5B9BD5"
                  />

                  <RotaryKnob
                    label="INTEGRAL (Ki)"
                    value={ki}
                    min={0.0}
                    max={15.0}
                    step={0.2}
                    precision={1}
                    onChange={setKi}
                    accentColor="#5B9BD5"
                  />
                </div>
              </div>

              <div className="mt-5 rounded border border-[#2B251D] bg-[#100E0B] p-3.5 font-mono text-xs text-text-dim shadow-inner">
                <div className="text-steel mb-1 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" />
                  ELECTROMECHANICAL CONSTANTS
                </div>
                <div className="text-[11px] space-y-0.5">
                  <div>Rotor Inertia (J): 0.02 kg·m²</div>
                  <div>Viscous Friction (B): 0.10 N·m·s</div>
                  <div>Simulation dt: 0.01 s (High Frequency)</div>
                </div>
              </div>
            </aside>

            <section className="flex flex-col gap-5 rounded border border-[#302B22] bg-[#16130F] p-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div className="flex justify-between items-center border-b border-[#26211A] pb-2.5">
                <h2 className="font-panel-heading text-lg font-semibold text-text">
                  Angular Velocity ω(t)
                </h2>
                <span className="rounded border border-steel/40 bg-steel/10 px-2.5 py-1 font-mono text-xs font-semibold text-steel shadow-[0_0_6px_rgba(91,155,213,0.2)]">
                  FINAL SPEED: {finalSpeed.toFixed(1)} rad/s
                </span>
              </div>

              <OscilloscopeCanvas
                data={simulationData}
                setpoint={targetSpeed}
                minY={0}
                maxY={Math.ceil(Math.max(targetSpeed * 1.3, Math.max(...simulationData) + 10))}
                unit="rad/s"
                totalTime={5.0}
                dt={0.01}
                color="#5B9BD5"
                showSecondary={false}
                height={380}
              />

              <div className="flex items-center justify-between font-mono text-xs text-text-faint border-t border-[#221D16] pt-3">
                <span>5.0s TRANSIENT HORIZON (500 SAMPLES @ 10ms)</span>
                <span className="text-steel font-semibold">PHOSPHOR BEAM: STEEL</span>
              </div>
            </section>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter />
    </div>
  );
}
