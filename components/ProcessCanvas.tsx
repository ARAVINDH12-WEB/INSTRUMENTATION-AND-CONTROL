"use client";

import { useEffect, useRef } from "react";

export interface ProcessCanvasProps {
  data: number[];
  setpoint?: number;
  minY?: number;
  maxY?: number;
  unit?: string;
  totalTime?: number;
  dt?: number;
  color?: string;
  glowColor?: string;
  height?: number;
  toleranceBandPct?: number; // e.g. 5 for +/- 5%
}

export default function ProcessCanvas({
  data,
  setpoint,
  minY: propMinY,
  maxY: propMaxY,
  unit = "%",
  totalTime,
  dt = 0.1,
  color = "#FFB000",
  glowColor = "rgba(255, 176, 0, 0.25)",
  height = 380,
  toleranceBandPct,
}: ProcessCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const canvasHeight = rect.height || height;

    if (canvas.width !== width * dpr || canvas.height !== canvasHeight * dpr) {
      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#18150F";
    ctx.fillRect(0, 0, width, canvasHeight);

    const padL = 52;
    const padR = 24;
    const padT = 24;
    const padB = 36;
    const plotW = Math.max(10, width - padL - padR);
    const plotH = Math.max(10, canvasHeight - padT - padB);

    const steps = data.length;
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    const minY = propMinY !== undefined ? propMinY : Math.floor(Math.min(0, dataMin));
    const maxY = propMaxY !== undefined ? propMaxY : Math.ceil(Math.max(10, dataMax * 1.15));
    const rangeY = maxY - minY || 1;

    const toX = (idx: number) => padL + (idx / Math.max(1, steps - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minY) / rangeY) * plotH;

    // Grid lines & ticks
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6B6255";
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    // 5 Y Ticks
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const val = minY + frac * rangeY;
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      const label = val.toFixed(val >= 10 ? 0 : 1) + (unit ? ` ${unit}` : "");
      ctx.fillText(label, padL - 8, y);
    }

    // X Time Ticks
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const duration = totalTime ?? (steps - 1) * dt;
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const x = padL + frac * plotW;
      const sec = (frac * duration).toFixed(duration > 10 ? 0 : 1);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText(`${sec}s`, x, padT + plotH + 8);
    }

    // Optional Tolerance Band around setpoint
    if (setpoint !== undefined && toleranceBandPct) {
      const yUp = toY(setpoint * (1 + toleranceBandPct / 100));
      const yDown = toY(setpoint * (1 - toleranceBandPct / 100));
      ctx.fillStyle = "rgba(255, 176, 0, 0.04)";
      ctx.fillRect(padL, Math.min(yUp, yDown), plotW, Math.abs(yDown - yUp));
    }

    // Setpoint Line
    if (setpoint !== undefined) {
      const ySp = toY(setpoint);
      ctx.strokeStyle = "#FFB000";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, ySp);
      ctx.lineTo(padL + plotW, ySp);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#FFB000";
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText(`TARGET: ${setpoint.toFixed(1)}${unit}`, padL + plotW, ySp - 10);
    }

    // Response Curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, idx) => {
      const x = toX(idx);
      const y = toY(val);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Signal Glow
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 5;
    ctx.stroke();

    // End Point Marker
    if (steps > 0) {
      const lastVal = data[steps - 1];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toX(steps - 1), toY(lastVal), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [data, setpoint, propMinY, propMaxY, unit, totalTime, dt, color, glowColor, height, toleranceBandPct]);

  return (
    <div className="relative w-full overflow-hidden rounded border border-line bg-panel-2" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
