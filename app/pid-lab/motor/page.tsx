"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProcessCanvas from "@/components/ProcessCanvas";
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

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <Link href="/pid-lab" className="text-amber hover:underline">
              SIMULATION SUITE
            </Link>
            <span>/</span>
            <span>ELECTROMECHANICAL DRIVES</span>
            <span>·</span>
            <span>VELOCITY CONTROL</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            DC Motor Velocity Control Simulator
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Explore closed-loop speed regulation for a permanent magnet DC motor. 
            Tune PI parameters to counteract rotor inertia (J = 0.02 kg·m²) and viscous friction damping (B = 0.1 N·s).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="rounded border border-line bg-panel p-6">
            <h2 className="font-heading text-base font-semibold text-text border-b border-line-soft pb-2 mb-4">
              Drive Parameters
            </h2>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>TARGET SPEED (rad/s)</span>
                <span className="font-semibold text-amber">{targetSpeed.toFixed(0)} rad/s</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={targetSpeed}
                onChange={(e) => setTargetSpeed(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>PROPORTIONAL TORQUE (Kp)</span>
                <span className="font-semibold text-amber">{kp.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.05"
                value={kp}
                onChange={(e) => setKp(parseFloat(e.target.value))}
              />
            </div>

            <div className="mb-5">
              <div className="flex justify-between font-mono text-xs text-text-dim mb-1">
                <span>INTEGRAL TORQUE (Ki)</span>
                <span className="font-semibold text-amber">{ki.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="15.0"
                step="0.2"
                value={ki}
                onChange={(e) => setKi(parseFloat(e.target.value))}
              />
            </div>

            <div className="rounded border border-line-soft bg-panel-2 p-3 font-mono text-xs text-text-dim">
              <div className="text-amber mb-1 font-semibold">MOTOR CONSTANTS</div>
              <div>Inertia (J): 0.02 kg·m²</div>
              <div>Viscous Damping (B): 0.10 N·m·s</div>
              <div>Time Step (dt): 0.01 s</div>
            </div>
          </aside>

          <section className="flex flex-col gap-5 rounded border border-line bg-panel p-6">
            <div className="flex justify-between items-baseline">
              <h2 className="font-heading text-lg font-semibold text-text">Angular Velocity ω(t)</h2>
              <span className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                FINAL SPEED: {finalSpeed.toFixed(1)} rad/s
              </span>
            </div>

            <ProcessCanvas
              data={simulationData}
              setpoint={targetSpeed}
              minY={0}
              maxY={Math.ceil(Math.max(targetSpeed * 1.3, Math.max(...simulationData) + 10))}
              unit="rad/s"
              totalTime={5.0}
              dt={0.01}
              color="#4FA98A"
              glowColor="rgba(79, 169, 138, 0.3)"
            />

            <div className="rounded border-l-4 border-amber border-t border-r border-b border-line bg-panel-2 p-4 font-mono text-xs">
              <span className="text-text-faint mr-2">[TORQUE]</span>
              <span className="text-text">
                T_elect = Kp·(Speed_target - ω) + Ki·∫e·dt &ensp;|&ensp; dω/dt = (T_elect - B·ω) / J
              </span>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
