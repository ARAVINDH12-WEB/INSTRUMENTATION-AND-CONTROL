"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HomeConsole() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const gaugeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tankLevel, setTankLevel] = useState(65.0);
  const [valvePercent, setValvePercent] = useState(48);

  // 1. Cursor-driven 3D Parallax Tilt
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion) return;

    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      targetRotateY = nx * 5.5;
      targetRotateX = -ny * 4.5;
    };

    const handleMouseLeave = () => {
      targetRotateX = 0;
      targetRotateY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const updateParallax = () => {
      currentRotateX += (targetRotateX - currentRotateX) * 0.08;
      currentRotateY += (targetRotateY - currentRotateY) * 0.08;

      if (panel) {
        panel.style.transform = `perspective(1100px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      }
      animId = requestAnimationFrame(updateParallax);
    };

    animId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 2. Analog Needle Gauge Animation (PT-101)
  useEffect(() => {
    const canvas = gaugeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 120;
    const cy = 120;
    const radius = 95;

    let targetPSI = 62.5;
    let currentPSI = 58.0;
    let simTime = 0;
    let animId: number;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderGauge = () => {
      simTime += 0.025;
      if (!prefersReducedMotion) {
        targetPSI = 62.5 + Math.sin(simTime * 0.9) * 4.2 + Math.cos(simTime * 2.1) * 1.8;
      }
      currentPSI += (targetPSI - currentPSI) * 0.05;

      ctx.clearRect(0, 0, 240, 240);

      // Outer bezel ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#18150F";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#302B22";
      ctx.stroke();

      // Inner hairline ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#221E17";
      ctx.stroke();

      // Gauge scale ticks (135 to 405 deg)
      const startAngle = (135 * Math.PI) / 180;
      const endAngle = (405 * Math.PI) / 180;
      const totalSweep = endAngle - startAngle;

      for (let psi = 0; psi <= 100; psi += 5) {
        const isMajor = psi % 20 === 0;
        const isMid = psi % 10 === 0 && !isMajor;
        const angle = startAngle + (psi / 100) * totalSweep;

        const tickInner = isMajor ? radius - 24 : isMid ? radius - 18 : radius - 14;
        const tickOuter = radius - 10;

        const x1 = cx + Math.cos(angle) * tickInner;
        const y1 = cy + Math.sin(angle) * tickInner;
        const x2 = cx + Math.cos(angle) * tickOuter;
        const y2 = cy + Math.sin(angle) * tickOuter;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? "#EDE6DA" : isMid ? "#A79C8A" : "#302B22";
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();

        if (isMajor) {
          const numR = radius - 34;
          const nx = cx + Math.cos(angle) * numR;
          const ny = cy + Math.sin(angle) * numR;
          ctx.fillStyle = "#A79C8A";
          ctx.font = '500 10px "IBM Plex Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(psi.toString(), nx, ny);
        }
      }

      // Dial labels
      ctx.fillStyle = "#FFB000";
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("PT-101", cx, cy - 36);

      ctx.fillStyle = "#6B6255";
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillText("PSI · STEAM", cx, cy + 32);

      // Digital readout box
      ctx.fillStyle = "#1D1A15";
      ctx.strokeStyle = "#302B22";
      ctx.lineWidth = 1;
      ctx.fillRect(cx - 32, cy + 45, 64, 18);
      ctx.strokeRect(cx - 32, cy + 45, 64, 18);

      ctx.fillStyle = "#FFB000";
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText(`${currentPSI.toFixed(1)}`, cx, cy + 54);

      // Needle
      const needleAngle = startAngle + (currentPSI / 100) * totalSweep;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(needleAngle);

      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(0, -2.5);
      ctx.lineTo(radius - 16, 0);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fillStyle = "#D64550";
      ctx.fill();

      // Center rivet
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#8C6318";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#FFB000";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#15130F";
      ctx.fill();

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(renderGauge);
    };

    animId = requestAnimationFrame(renderGauge);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3. Tank Loop Fluid Oscillation
  useEffect(() => {
    let loopTime = 0;
    let animId: number;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateTank = () => {
      loopTime += 0.03;
      if (!prefersReducedMotion) {
        const lvl = 65 + Math.sin(loopTime * 0.7) * 8.5;
        const vlv = 48 + Math.cos(loopTime * 0.7) * 12.0;
        setTankLevel(lvl);
        setValvePercent(Math.round(vlv));
      }
      animId = requestAnimationFrame(updateTank);
    };

    animId = requestAnimationFrame(updateTank);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full max-w-[1180px]" style={{ perspective: "1100px" }}>
      <div
        ref={panelRef}
        className="relative rounded border border-line bg-panel shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-150 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Corner Rivets */}
        <div className="absolute top-2 left-2 h-2 w-2 rounded-full border border-black bg-[#383226] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]" />
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full border border-black bg-[#383226] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]" />

        {/* Console Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-panel-2 px-7 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded border border-amber bg-panel font-mono text-sm font-semibold text-amber shadow-[inset_0_0_8px_rgba(255,176,0,0.15)]">
              CF
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-wide text-text">
                ControlForge
              </h1>
              <div className="font-mono text-[11px] tracking-wider text-text-dim">
                MEASURE · MODEL · CONTROL · AUTOMATE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-text-dim">
              <span className="h-2 w-2 rounded-full bg-verdigris shadow-[0_0_6px_rgba(79,169,138,0.6)]" />
              <span>SYS · ONLINE</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-dim">
              <span className="h-2 w-2 rounded-full bg-amber shadow-[0_0_6px_rgba(255,176,0,0.35)]" />
              <span>LOOP · CLOSED</span>
            </div>
            <div className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 text-[11px] tracking-wider text-amber">
              PANEL #01 · ACTIVE
            </div>
          </div>
        </div>

        {/* Main 3-Bay Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_340px] gap-px bg-line">
          {/* Bay 1: Analog Gauge */}
          <section className="flex flex-col bg-panel p-6" aria-label="Analog Pressure Transmitter">
            <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-2 font-mono text-xs tracking-wider text-text-faint">
              <span>BAY · 01 / ANALOG GAUGE</span>
              <span>[PT-101]</span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center">
              <canvas
                ref={gaugeCanvasRef}
                style={{ width: "200px", height: "200px" }}
                aria-label="Simulated analog pressure gauge needle rotating in real time"
              />
            </div>

            <div className="mt-4 flex flex-col gap-1 rounded border border-line-soft bg-panel-2 p-3 font-mono text-xs text-text-dim">
              <div className="flex justify-between">
                <span>TAG</span>
                <span className="text-text">PT-101</span>
              </div>
              <div className="flex justify-between">
                <span>CALIBRATION</span>
                <span className="text-text">0 – 100 PSI</span>
              </div>
              <div className="flex justify-between">
                <span>SIGNAL</span>
                <span className="text-text">4–20 mA · HART</span>
              </div>
              <div className="flex justify-between">
                <span>ACCURACY</span>
                <span className="text-text">±0.075% SPAN</span>
              </div>
            </div>
          </section>

          {/* Bay 2: Process Loop */}
          <section className="flex flex-col bg-panel p-6" aria-label="Process Loop Schematic">
            <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-2 font-mono text-xs tracking-wider text-text-faint">
              <span>BAY · 02 / CLOSED PROCESS LOOP</span>
              <span>[TANK-101]</span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center">
              <div className="flex w-full max-w-[380px] flex-col gap-5 rounded border border-line bg-panel-2 p-6">
                <div className="flex items-center justify-between gap-6">
                  {/* Tank Graphic */}
                  <div className="relative flex h-[150px] w-[110px] flex-col-reverse overflow-hidden rounded-b border-2 border-t-0 border-line bg-[#12100C]">
                    <div
                      className="relative w-full border-t-2 border-verdigris bg-gradient-to-b from-verdigris/45 to-verdigris/20 transition-all duration-300"
                      style={{ height: `${tankLevel.toFixed(1)}%` }}
                    >
                      <div className="absolute -top-[3px] left-0 right-0 h-1 bg-verdigris shadow-[0_0_8px_rgba(79,169,138,0.8)]" />
                    </div>
                    <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-1.5 font-mono text-[9px] text-text-faint">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                  </div>

                  {/* Instruments */}
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center justify-between rounded border border-line bg-panel px-2.5 py-2 font-mono text-xs">
                      <span className="font-semibold text-amber">LT-101</span>
                      <span className="text-text">{tankLevel.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-line bg-panel px-2.5 py-2 font-mono text-xs">
                      <span className="font-semibold text-amber">LIC-101</span>
                      <span className="text-text">SP: 65.0%</span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-line bg-panel px-2.5 py-2 font-mono text-xs">
                      <span className="font-semibold text-amber">LV-101</span>
                      <span className="text-text">{valvePercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 border-t border-dashed border-line-soft pt-2 font-mono text-[11px] text-text-faint">
                  <span>FEEDBACK: 4–20mA</span>
                  <span>⟶</span>
                  <span>PID (Kp=2.1, Ki=0.35)</span>
                  <span>⟶</span>
                  <span>TRIM: 3–15 PSI</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bay 3: Physical Station Selectors */}
          <section className="flex flex-col bg-panel p-6" aria-label="Physical Station Selectors">
            <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-2 font-mono text-xs tracking-wider text-text-faint">
              <span>BAY · 03 / STATION SELECTOR</span>
              <span>[BUS-SWITCHES]</span>
            </div>

            <nav className="my-auto flex flex-col gap-2.5" aria-label="Console Navigation">
              {[
                {
                  id: "01",
                  title: "Projects",
                  desc: "Case studies & industrial architectures",
                  href: "/projects",
                },
                {
                  id: "02",
                  title: "PID Lab",
                  desc: "Real-time loop tuning simulator",
                  href: "/pid-lab",
                },
                {
                  id: "03",
                  title: "Calculators",
                  desc: "4–20 mA conversion & metrology tools",
                  href: "/calculators",
                },
                {
                  id: "04",
                  title: "Field Notes",
                  desc: "Transmitter theory & loop engineering",
                  href: "/notes",
                },
                {
                  id: "05",
                  title: "Plant Dashboard",
                  desc: "Virtual DCS plant & fault injection",
                  href: "/dashboard",
                },
              ].map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-center gap-3.5 rounded border border-line bg-panel-2 p-3 text-text transition-all duration-200 hover:border-amber hover:bg-[#221E17] hover:translate-x-1"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded border border-line bg-panel font-mono text-xs font-semibold text-amber transition-all group-hover:border-amber group-hover:bg-amber group-hover:text-bg group-hover:shadow-[0_0_10px_rgba(255,176,0,0.35)]">
                    {item.id}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-heading text-[15px] font-semibold tracking-wide text-text transition-colors group-hover:text-amber">
                      {item.title}
                    </span>
                    <span className="truncate font-mono text-[11px] text-text-dim">
                      {item.desc}
                    </span>
                  </div>
                  <span className="ml-auto font-mono text-[10px] text-text-faint group-hover:text-amber">
                    ENTER ⟶
                  </span>
                </Link>
              ))}
            </nav>
          </section>
        </div>

        {/* Footer Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-panel-2 px-7 py-3 font-mono text-xs text-text-faint">
          <div>CORE STATION: CF-CR-MAIN-01 · REVISION 2.0.0 (NEXT.JS)</div>
          <div className="flex gap-2.5">
            <span>PARALLAX: CURSOR-LINKED</span>
            <span>·</span>
            <span>SIMULATION: CLIENT-SIDE REACT ENGINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
