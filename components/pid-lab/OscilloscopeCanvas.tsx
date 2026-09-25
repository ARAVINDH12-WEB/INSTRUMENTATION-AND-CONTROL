"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface OscilloscopeCanvasProps {
  data: number[];
  setpoint?: number;
  minY?: number;
  maxY?: number;
  unit?: string;
  totalTime?: number;
  dt?: number;
  color?: string;
  secondaryData?: number[];
  secondarySetpoint?: number;
  secondaryColor?: string;
  showPrimary?: boolean;
  showSecondary?: boolean;
  height?: number;
}

interface HoverState {
  x: number;
  y: number;
  stepIdx: number;
  timeSec: number;
  valA: number | null;
  valB: number | null;
  spA: number | null;
  spB: number | null;
}

export default function OscilloscopeCanvas({
  data,
  setpoint = 50,
  minY = 0,
  maxY = 100,
  unit = "%",
  totalTime = 60,
  dt = 0.1,
  color = "#FFB000",
  secondaryData,
  secondarySetpoint = 50,
  secondaryColor = "#4FA98A",
  showPrimary = true,
  showSecondary = true,
  height = 420,
}: OscilloscopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const frameCountRef = useRef(0);

  // Setup redraw with phosphor decay
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const canvasHeight = rect.height || height;

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(canvasHeight * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(canvasHeight * dpr);
      // Clean background on resize
      ctx.fillStyle = "#090E0C";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // PHOSPHOR DECAY EFFECT:
    // Paint a translucent dark rectangle over previous frame to produce fading phosphor decay trails
    ctx.fillStyle = "rgba(9, 14, 12, 0.32)";
    ctx.fillRect(0, 0, width, canvasHeight);

    const padL = 52;
    const padR = 24;
    const padT = 32;
    const padB = 40;
    const plotW = Math.max(10, width - padL - padR);
    const plotH = Math.max(10, canvasHeight - padT - padB);

    const steps = Math.max(
      showPrimary && data ? data.length : 0,
      showSecondary && secondaryData ? secondaryData.length : 0,
      1
    );

    const rangeY = maxY - minY || 1;
    const toX = (idx: number) => padL + (idx / Math.max(1, steps - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minY) / rangeY) * plotH;

    // --- OSCILLOSCOPE RETICLE GRID (10 divs horizontal, 8 divs vertical) ---
    ctx.lineWidth = 1;
    const hDivs = 10;
    const vDivs = 8;

    // Grid lines
    ctx.strokeStyle = "rgba(42, 70, 55, 0.35)";
    for (let i = 0; i <= hDivs; i++) {
      const gx = padL + (i / hDivs) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();
    }
    for (let j = 0; j <= vDivs; j++) {
      const gy = padT + (j / vDivs) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();
    }

    // Center Crosshair major axes with sub-ticks
    const midX = padL + plotW / 2;
    const midY = padT + plotH / 2;
    ctx.strokeStyle = "rgba(75, 128, 98, 0.55)";
    ctx.beginPath();
    ctx.moveTo(midX, padT);
    ctx.lineTo(midX, padT + plotH);
    ctx.moveTo(padL, midY);
    ctx.lineTo(padL + plotW, midY);
    ctx.stroke();

    // Sub-ticks along center axes (5 per major div = 0.2 div ticks)
    ctx.strokeStyle = "rgba(75, 128, 98, 0.7)";
    const totalSubH = hDivs * 5;
    for (let k = 0; k <= totalSubH; k++) {
      const sx = padL + (k / totalSubH) * plotW;
      ctx.beginPath();
      ctx.moveTo(sx, midY - 3);
      ctx.lineTo(sx, midY + 3);
      ctx.stroke();
    }
    const totalSubV = vDivs * 5;
    for (let m = 0; m <= totalSubV; m++) {
      const sy = padT + (m / totalSubV) * plotH;
      ctx.beginPath();
      ctx.moveTo(midX - 3, sy);
      ctx.lineTo(midX + 3, sy);
      ctx.stroke();
    }

    // Outer border of CRT graticule
    ctx.strokeStyle = "rgba(75, 128, 98, 0.6)";
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Y Axis labels
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(167, 156, 138, 0.75)";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let j = 0; j <= vDivs; j += 2) {
      const val = minY + (1 - j / vDivs) * rangeY;
      const yPos = padT + (j / vDivs) * plotH;
      ctx.fillText(`${val.toFixed(0)}${unit}`, padL - 8, yPos);
    }

    // X Axis labels (Time in seconds)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= hDivs; i += 2) {
      const tSec = (i / hDivs) * totalTime;
      const xPos = padL + (i / hDivs) * plotW;
      ctx.fillText(`${tSec.toFixed(0)}s`, xPos, padT + plotH + 8);
    }

    // --- DASHED SETPOINT LINES ---
    if (setpoint !== undefined) {
      ctx.save();
      ctx.strokeStyle = "rgba(237, 230, 218, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      const spY = toY(setpoint);
      ctx.beginPath();
      ctx.moveTo(padL, spY);
      ctx.lineTo(padL + plotW, spY);
      ctx.stroke();
      ctx.restore();
    }
    if (secondarySetpoint !== undefined && secondarySetpoint !== setpoint) {
      ctx.save();
      ctx.strokeStyle = "rgba(79, 169, 138, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      const secSpY = toY(secondarySetpoint);
      ctx.beginPath();
      ctx.moveTo(padL, secSpY);
      ctx.lineTo(padL + plotW, secSpY);
      ctx.stroke();
      ctx.restore();
    }

    // --- OSCILLOSCOPE TRACE RENDERING (with CRT beam glow) ---
    // Helper to draw a glowing trace
    const drawTrace = (traceData: number[], strokeColor: string, glowRgba: string) => {
      if (!traceData || traceData.length < 2) return;

      // Pass 1: Wide Phosphor Halo (Outer glow)
      ctx.save();
      ctx.strokeStyle = glowRgba;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = strokeColor;
      ctx.beginPath();
      for (let i = 0; i < traceData.length; i++) {
        const x = toX(i);
        const y = toY(traceData[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Pass 2: High-intensity Core Electron Beam
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#FFF";
      ctx.beginPath();
      for (let i = 0; i < traceData.length; i++) {
        const x = toX(i);
        const y = toY(traceData[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Draw Controller B first (underneath)
    if (showSecondary && secondaryData && secondaryData.length > 0) {
      drawTrace(secondaryData, secondaryColor, "rgba(79, 169, 138, 0.35)");
    }

    // Draw Controller A on top
    if (showPrimary && data && data.length > 0) {
      drawTrace(data, color, "rgba(255, 176, 0, 0.4)");
    }

    // --- CROSSHAIR RETICLE (When hovered) ---
    if (hover && hover.stepIdx >= 0 && hover.stepIdx < steps) {
      const hx = toX(hover.stepIdx);

      // Vertical crosshair sweep line
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, padT);
      ctx.lineTo(hx, padT + plotH);
      ctx.stroke();

      // Controller A cursor point
      if (showPrimary && hover.valA !== null) {
        const hyA = toY(hover.valA);
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(hx, hyA, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Controller B cursor point
      if (showSecondary && hover.valB !== null) {
        const hyB = toY(hover.valB);
        ctx.fillStyle = secondaryColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = secondaryColor;
        ctx.beginPath();
        ctx.arc(hx, hyB, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [data, setpoint, minY, maxY, unit, totalTime, dt, color, secondaryData, secondarySetpoint, secondaryColor, showPrimary, showSecondary, height, hover]);

  // Request continuous decay animation when updating
  useEffect(() => {
    let animId: number;
    // Render several frames for smooth phosphor integration
    let count = 0;
    const loop = () => {
      renderFrame();
      count++;
      if (count < 8) {
        animId = requestAnimationFrame(loop);
      }
    };
    loop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [renderFrame]);

  // Handle Mouse Hover / Crosshair HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const padL = 52;
    const padR = 24;
    const plotW = Math.max(10, rect.width - padL - padR);

    if (clientX < padL || clientX > rect.width - padR) {
      setHover(null);
      return;
    }

    const steps = Math.max(
      showPrimary && data ? data.length : 0,
      showSecondary && secondaryData ? secondaryData.length : 0,
      1
    );

    const relX = (clientX - padL) / plotW;
    const stepIdx = Math.min(Math.max(0, Math.round(relX * (steps - 1))), steps - 1);
    const timeSec = stepIdx * dt;

    const valA = showPrimary && data && stepIdx < data.length ? data[stepIdx] : null;
    const valB = showSecondary && secondaryData && stepIdx < secondaryData.length ? secondaryData[stepIdx] : null;

    setHover({
      x: clientX,
      y: clientY,
      stepIdx,
      timeSec,
      valA,
      valB,
      spA: setpoint,
      spB: secondarySetpoint,
    });
  };

  const handleMouseLeave = () => {
    setHover(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded border border-[#23352B] overflow-hidden select-none bg-[#090E0C] shadow-[inset_0_0_28px_rgba(0,0,0,0.95)]"
      style={{ height: `${height}px` }}
    >
      {/* Scope Calibration Header */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono tracking-wider pointer-events-none z-20">
        <div className="flex items-center gap-3 text-[#588A6E]">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#4FA98A] shadow-[0_0_6px_#4FA98A] animate-pulse" />
            CH A + CH B OSCILLOSCOPE
          </span>
          <span className="text-[#3A5D4A]">|</span>
          <span>TIME/DIV: {(totalTime / 10).toFixed(1)}s</span>
          <span className="text-[#3A5D4A]">|</span>
          <span>VERT/DIV: {((maxY - minY) / 8).toFixed(1)}{unit}</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-[#FFB000]">CH A: 100mV/DIV (T:{totalTime}s)</span>
          <span className="text-[#4FA98A]">CH B: 100mV/DIV</span>
        </div>
      </div>

      {/* Main CRT Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />

      {/* CRT Scanline Overlay (~30% opacity) */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0px, rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* CRT Radial Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at center, transparent 60%, rgba(4, 8, 6, 0.75) 100%)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.85)",
        }}
      />

      {/* Live Crosshair HUD Overlay */}
      {hover && (
        <div
          className="absolute z-30 pointer-events-none font-mono text-[11px] rounded border border-[#3A5D4A] bg-[#0C1411]/90 backdrop-blur-sm p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
          style={{
            left: `${Math.min(hover.x + 14, (containerRef.current?.clientWidth || 600) - 220)}px`,
            top: `${Math.min(Math.max(hover.y - 40, 36), height - 120)}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-[#23382D] pb-1 mb-1 text-text-dim">
            <span className="font-semibold text-text">T = {hover.timeSec.toFixed(2)}s</span>
            <span className="text-[10px] text-text-faint">STEP #{hover.stepIdx}</span>
          </div>

          <div className="space-y-1">
            {showPrimary && hover.valA !== null && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-amber font-semibold">CTRL A (Amber):</span>
                <span className="text-amber font-bold">
                  {hover.valA.toFixed(2)}{unit}
                  {hover.spA !== null && (
                    <span className="text-[10px] text-text-dim ml-1 font-normal">
                      (err: {(hover.spA - hover.valA).toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            )}

            {showSecondary && hover.valB !== null && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-verdigris font-semibold">CTRL B (Verdigris):</span>
                <span className="text-verdigris font-bold">
                  {hover.valB.toFixed(2)}{unit}
                  {hover.spB !== null && (
                    <span className="text-[10px] text-text-dim ml-1 font-normal">
                      (err: {(hover.spB - hover.valB).toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-[10px] text-text-faint border-t border-[#1C2C24] pt-1">
              <span>TARGET SP:</span>
              <span>
                {hover.spA === hover.spB
                  ? `${hover.spA?.toFixed(1)}${unit}`
                  : `A:${hover.spA?.toFixed(1)}${unit} / B:${hover.spB?.toFixed(1)}${unit}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
