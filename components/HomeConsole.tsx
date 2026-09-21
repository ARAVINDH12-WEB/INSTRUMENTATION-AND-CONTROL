"use client";

import { useEffect, useRef, useState } from "react";
import PhysicalControls from "@/components/home/PhysicalControls";
import CrtChatbotTerminal from "@/components/home/CrtChatbotTerminal";

export default function HomeConsole() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const gaugeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tankLevel, setTankLevel] = useState(65.0);
  const [valvePercent, setValvePercent] = useState(48);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 1. Check prefers-reduced-motion and setup cursor parallax
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    const panel = panelRef.current;
    if (!panel || mediaQuery.matches) {
      if (panel) panel.style.transform = "perspective(1200px) rotateX(1.5deg) rotateY(0deg)";
      return;
    }

    let targetRotateX = 1.5;
    let targetRotateY = 0;
    let currentRotateX = 1.5;
    let currentRotateY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      // Controlled, subtle tilt (max ~3.5 to 4.5 degrees)
      targetRotateY = nx * 4.0;
      targetRotateX = 1.5 - ny * 3.5;
    };

    const handleMouseLeave = () => {
      targetRotateX = 1.5;
      targetRotateY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const updateParallax = () => {
      currentRotateX += (targetRotateX - currentRotateX) * 0.07;
      currentRotateY += (targetRotateY - currentRotateY) * 0.07;

      if (panel) {
        panel.style.transform = `perspective(1200px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      }
      animId = requestAnimationFrame(updateParallax);
    };

    animId = requestAnimationFrame(updateParallax);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
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
    canvas.width = 220 * dpr;
    canvas.height = 220 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 110;
    const cy = 110;
    const radius = 86;

    let targetPSI = 62.5;
    let currentPSI = 62.5;
    let simTime = 0;
    let animId: number;

    const renderGauge = () => {
      if (!reducedMotion) {
        simTime += 0.025;
        targetPSI = 62.5 + Math.sin(simTime * 0.9) * 3.8 + Math.cos(simTime * 2.1) * 1.5;
        currentPSI += (targetPSI - currentPSI) * 0.05;
      } else {
        currentPSI = 62.5;
      }

      ctx.clearRect(0, 0, 220, 220);

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
      ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
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

        const tickInner = isMajor ? radius - 20 : isMid ? radius - 15 : radius - 12;
        const tickOuter = radius - 8;

        const x1 = cx + Math.cos(angle) * tickInner;
        const y1 = cy + Math.sin(angle) * tickInner;
        const x2 = cx + Math.cos(angle) * tickOuter;
        const y2 = cy + Math.sin(angle) * tickOuter;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? "#EDE6DA" : isMid ? "#A79C8A" : "#302B22";
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.stroke();

        if (isMajor) {
          const numR = radius - 29;
          const nx = cx + Math.cos(angle) * numR;
          const ny = cy + Math.sin(angle) * numR;
          ctx.fillStyle = "#A79C8A";
          ctx.font = '500 9px "IBM Plex Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(psi.toString(), nx, ny);
        }
      }

      // Dial labels
      ctx.fillStyle = "#FFB000";
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("PT-101", cx, cy - 30);

      ctx.fillStyle = "#6B6255";
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.fillText("PSI · STEAM", cx, cy + 28);

      // Digital readout box
      ctx.fillStyle = "#1D1A15";
      ctx.strokeStyle = "#302B22";
      ctx.lineWidth = 1;
      ctx.fillRect(cx - 28, cy + 39, 56, 16);
      ctx.strokeRect(cx - 28, cy + 39, 56, 16);

      ctx.fillStyle = "#FFB000";
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(`${currentPSI.toFixed(1)}`, cx, cy + 47);

      // Needle
      const needleAngle = startAngle + (currentPSI / 100) * totalSweep;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(needleAngle);

      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(0, -2);
      ctx.lineTo(radius - 14, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fillStyle = "#D64550";
      ctx.fill();

      // Center rivet
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#8C6318";
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#FFB000";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#15130F";
      ctx.fill();

      ctx.restore();
      ctx.restore();

      if (!reducedMotion) {
        animId = requestAnimationFrame(renderGauge);
      }
    };

    renderGauge();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  // 3. Tank Fluid Loop Oscillation
  useEffect(() => {
    if (reducedMotion) {
      setTankLevel(65.0);
      setValvePercent(48);
      return;
    }

    let loopTime = 0;
    let animId: number;

    const updateTank = () => {
      loopTime += 0.03;
      const lvl = 65 + Math.sin(loopTime * 0.7) * 7.5;
      const vlv = 48 + Math.cos(loopTime * 0.7) * 10.0;
      setTankLevel(lvl);
      setValvePercent(Math.round(vlv));
      animId = requestAnimationFrame(updateTank);
    };

    animId = requestAnimationFrame(updateTank);
    return () => cancelAnimationFrame(animId);
  }, [reducedMotion]);

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 md:p-6 select-none overflow-x-hidden">
      {/* 3D Perspective Stage */}
      <div
        ref={panelRef}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[1260px] bg-[#14120E] border-2 border-[#383226] rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.08)] transition-transform duration-100 ease-out"
      >
        {/* Corner Hex Fasteners */}
        <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full border border-black bg-[#40392C] shadow-inner" />
        <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full border border-black bg-[#40392C] shadow-inner" />
        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full border border-black bg-[#40392C] shadow-inner" />
        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full border border-black bg-[#40392C] shadow-inner" />

        {/* Master Bezel Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#302B22] bg-[#1C1813] px-5 sm:px-7 py-4 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded border border-cf-amber bg-[#14120E] font-mono text-sm font-bold text-cf-amber shadow-[inset_0_0_8px_rgba(255,176,0,0.25)]">
              CF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg sm:text-xl font-bold tracking-wider text-cf-text">
                  CONTROLFORGE INSTRUMENT CONSOLE
                </h1>
                <span className="hidden md:inline font-mono text-[10px] text-cf-amber border border-cf-amber/40 bg-cf-amber/10 px-1.5 py-0.5 rounded">
                  REV 3.0 // PRIMARY WORKSTATION
                </span>
              </div>
              <div className="font-mono text-[11px] tracking-widest text-cf-text-dim">
                MEASURE · MODEL · CONTROL · AUTOMATE
              </div>
            </div>
          </div>

          {/* Idle Breathing Indicators */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-cf-text-dim">
              <span
                className={`w-2.5 h-2.5 rounded-full bg-cf-verdigris ${
                  !reducedMotion ? "animate-pulse shadow-[0_0_8px_rgba(79,169,138,0.8)]" : ""
                }`}
              />
              <span className="text-[11px]">SYS · ONLINE</span>
            </div>
            <div className="flex items-center gap-2 text-cf-text-dim">
              <span
                className={`w-2.5 h-2.5 rounded-full bg-cf-amber ${
                  !reducedMotion ? "animate-pulse shadow-[0_0_8px_rgba(255,176,0,0.6)]" : ""
                }`}
              />
              <span className="text-[11px]">LOOP · CLOSED</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded border border-cf-line bg-[#14120E] px-2.5 py-1 text-[10px] text-cf-text-faint">
              <span>TILT:</span>
              <span className="text-cf-amber">{reducedMotion ? "OFF (REDUCED MOTION)" : "ACTIVE 3D PARALLAX"}</span>
            </div>
          </div>
        </header>

        {/* Console Bay Grid */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Upper Section: Gauges + Diagnostic Chatbot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Ambient Instruments (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Bay 1: Analog Pressure Gauge */}
              <div className="bg-[#18150F] border border-cf-line rounded p-4 flex flex-col items-center justify-between">
                <div className="w-full flex items-center justify-between border-b border-cf-line-soft pb-2 font-mono text-[11px] text-cf-text-faint">
                  <span className="text-cf-amber uppercase font-semibold">BAY · 01 / ANALOG GAUGE</span>
                  <span>[PT-101]</span>
                </div>
                <div className="my-2 flex items-center justify-center">
                  <canvas
                    ref={gaugeCanvasRef}
                    style={{ width: "180px", height: "180px" }}
                    aria-label="Analog steam pressure gauge"
                  />
                </div>
                <div className="w-full grid grid-cols-3 gap-2 text-center font-mono text-[10px] text-cf-text-dim bg-[#12100C] p-2 rounded border border-cf-line-soft">
                  <div>CALIB: 0-100 PSI</div>
                  <div>HART 7.0</div>
                  <div>±0.075% SPAN</div>
                </div>
              </div>

              {/* Bay 2: Process Fluid Loop */}
              <div className="bg-[#18150F] border border-cf-line rounded p-4 flex flex-col justify-between">
                <div className="w-full flex items-center justify-between border-b border-cf-line-soft pb-2 font-mono text-[11px] text-cf-text-faint mb-3">
                  <span className="text-cf-amber uppercase font-semibold">BAY · 02 / CLOSED PROCESS LOOP</span>
                  <span>[TK-101 / LIC-101]</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Tank Container */}
                  <div className="relative flex h-[120px] w-[95px] flex-col-reverse overflow-hidden rounded-b border-2 border-t-0 border-cf-line bg-[#100E0A] shrink-0">
                    <div
                      className="relative w-full border-t-2 border-cf-verdigris bg-gradient-to-b from-cf-verdigris/40 to-cf-verdigris/15 transition-all duration-300"
                      style={{ height: `${tankLevel.toFixed(1)}%` }}
                    >
                      <div className="absolute -top-[3px] left-0 right-0 h-1 bg-cf-verdigris shadow-[0_0_6px_rgba(79,169,138,0.8)]" />
                    </div>
                    <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-1 font-mono text-[8px] text-cf-text-faint">
                      <span>100%</span>
                      <span>50%</span>
                      <span>0%</span>
                    </div>
                  </div>

                  {/* Readout telemetry */}
                  <div className="flex-1 flex flex-col gap-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-cf-panel border border-cf-line-soft">
                      <span className="text-cf-amber font-bold">LT-101</span>
                      <span className="text-cf-text">{tankLevel.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cf-panel border border-cf-line-soft">
                      <span className="text-cf-amber font-bold">LIC-101</span>
                      <span className="text-cf-text">SP: 65.0%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cf-panel border border-cf-line-soft">
                      <span className="text-cf-amber font-bold">LV-101</span>
                      <span className="text-cf-text">{valvePercent}% (TRIM)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Diagnostic Chatbot Terminal (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <CrtChatbotTerminal />
            </div>
          </div>

          {/* Lower Section: Physical Station Selectors (Full Width) */}
          <div className="w-full">
            <PhysicalControls />
          </div>
        </div>

        {/* Master Console Chassis Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#302B22] bg-[#16130F] px-5 sm:px-7 py-3 rounded-b-xl font-mono text-[11px] text-cf-text-faint">
          <div>CHASSIS: CF-PANEL-3000 // GRAPHITE &amp; PHOSPHOR EDITION</div>
          <div className="flex items-center gap-3">
            <span>ISOLATION: 1500V RMS</span>
            <span>·</span>
            <span>BUS PROTOCOL: MODBUS / TCP / REST</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
