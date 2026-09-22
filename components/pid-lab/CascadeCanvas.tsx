"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CascadeSimulationResult } from "@/lib/pid-math";

export interface CascadeCanvasProps {
  result: CascadeSimulationResult;
  setpoint: number;
  showSingleLoop: boolean;
  disturbanceType: string;
  disturbanceTimeSec?: number;
  height?: number;
}

export default function CascadeCanvas({
  result,
  setpoint,
  showSingleLoop,
  disturbanceType,
  disturbanceTimeSec = 20,
  height = 520,
}: CascadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result || result.timeSec.length === 0) return;

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

    const padL = 54;
    const padR = 24;
    const padT = 24;
    const padB = 30;
    const gap = 34; // gap between top and bottom plots

    const plotW = Math.max(10, width - padL - padR);
    const totalPlotH = Math.max(10, canvasHeight - padT - padB - gap);
    const topPlotH = totalPlotH * 0.58; // 58% height for primary level
    const btmPlotH = totalPlotH * 0.42; // 42% height for inner flow/valve
    const btmPlotY0 = padT + topPlotH + gap;

    const steps = result.timeSec.length;
    const maxTime = result.timeSec[steps - 1] || 60;

    // Coordinate transforms
    const toX = (idx: number) => padL + (idx / Math.max(1, steps - 1)) * plotW;

    // Top plot Y range: 0 to 100% (level)
    const topMinY = 0;
    const topMaxY = 100;
    const toTopY = (val: number) =>
      padT + topPlotH - ((val - topMinY) / (topMaxY - topMinY)) * topPlotH;

    // Bottom plot Y range: 0 to 100% (flow / valve)
    const btmMinY = 0;
    const btmMaxY = 100;
    const toBtmY = (val: number) =>
      btmPlotY0 + btmPlotH - ((val - btmMinY) / (btmMaxY - btmMinY)) * btmPlotH;

    // 1. Grid & Ticks for Top Plot (Level)
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6B6255";
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    // Top Pane Title
    ctx.fillStyle = "#A79C8A";
    ctx.textAlign = "left";
    ctx.fillText("PRIMARY PROCESS VARIABLE // TANK LIQUID LEVEL h(t) [%]", padL + 4, padT - 10);

    const topTicks = [0, 25, 50, 75, 100];
    for (const val of topTicks) {
      const y = toTopY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = "#6B6255";
      ctx.textAlign = "right";
      ctx.fillText(`${val}%`, padL - 8, y);
    }

    // Setpoint dashed line
    const spY = toTopY(setpoint);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255, 176, 0, 0.4)";
    ctx.beginPath();
    ctx.moveTo(padL, spY);
    ctx.lineTo(padL + plotW, spY);
    ctx.stroke();
    ctx.restore();

    // 2. Grid & Ticks for Bottom Plot (Flow / Valve)
    ctx.strokeStyle = "#221E17";
    ctx.fillStyle = "#A79C8A";
    ctx.textAlign = "left";
    ctx.fillText("INNER SLAVE VARIABLE // INFLOW Q(t) & VALVE POSITION MV(t) [%]", padL + 4, btmPlotY0 - 10);

    const btmTicks = [0, 50, 100];
    for (const val of btmTicks) {
      const y = toBtmY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = "#6B6255";
      ctx.textAlign = "right";
      ctx.fillText(`${val}%`, padL - 8, y);
    }

    // X-Axis Time Ticks (shared bottom)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const frac = i / xTicks;
      const x = padL + frac * plotW;
      const sec = Math.round(frac * maxTime);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + topPlotH);
      ctx.moveTo(x, btmPlotY0);
      ctx.lineTo(x, btmPlotY0 + btmPlotH);
      ctx.stroke();
      ctx.fillStyle = "#6B6255";
      ctx.fillText(`${sec}s`, x, btmPlotY0 + btmPlotH + 6);
    }

    // Disturbance Marker Line
    if (disturbanceType !== "none") {
      const distIdx = Math.round((disturbanceTimeSec / maxTime) * (steps - 1));
      const distDistX = toX(Math.min(steps - 1, Math.max(0, distIdx)));

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#D64550";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(distDistX, padT - 4);
      ctx.lineTo(distDistX, btmPlotY0 + btmPlotH);
      ctx.stroke();
      ctx.restore();

      // Disturbance Badge
      ctx.fillStyle = "#D64550";
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = "left";
      const distLabel =
        disturbanceType === "supply_drop"
          ? "⚡ DISTURBANCE: SUPPLY PRESSURE DROP (-38%)"
          : disturbanceType === "demand_surge"
          ? "⚡ DISTURBANCE: DEMAND SURGE (+20% OUTFLOW)"
          : "⚡ DISTURBANCE: COMBINED LOAD & PRESSURE";
      ctx.fillText(distLabel, distDistX + 6, padT + 8);
    }

    // --- CURVES DRAWING ---

    // 1. Single-Loop Baseline (if enabled)
    if (showSingleLoop) {
      // Top: Single Loop Level (Crimson dashed)
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#D64550";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = toX(i);
        const y = toTopY(result.singleLoop.level[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bottom: Single Loop Flow (Muted Crimson)
      ctx.strokeStyle = "rgba(214, 69, 80, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = toX(i);
        const y = toBtmY(result.singleLoop.flow[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Cascade Flow Setpoint RSP (Bottom plot - Amber dashed)
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(255, 176, 0, 0.6)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = toX(i);
      const y = toBtmY(result.cascade.flowSetpoint[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Cascade Valve Command MV (Bottom plot - Text dim)
    ctx.save();
    ctx.strokeStyle = "#6B6255";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = toX(i);
      const y = toBtmY(result.cascade.valveOutput[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Cascade Inner Flow Q(t) (Bottom plot - Verdigris)
    ctx.save();
    ctx.strokeStyle = "#4FA98A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = toX(i);
      const y = toBtmY(result.cascade.flow[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 5. Cascade Primary Level h(t) (Top plot - Bright Amber with Glow)
    ctx.save();
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(255, 176, 0, 0.35)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = toX(i);
      const y = toTopY(result.cascade.level[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Hover crosshair and inspection tooltip
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < steps) {
      const hx = toX(hoverIndex);
      const hyTop = toTopY(result.cascade.level[hoverIndex]);
      const hyBtm = toBtmY(result.cascade.flow[hoverIndex]);

      ctx.save();
      ctx.strokeStyle = "rgba(255, 176, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, padT);
      ctx.lineTo(hx, btmPlotY0 + btmPlotH);
      ctx.stroke();

      // Top dot
      ctx.fillStyle = "#FFB000";
      ctx.beginPath();
      ctx.arc(hx, hyTop, 4, 0, Math.PI * 2);
      ctx.fill();

      // Bottom dot
      ctx.fillStyle = "#4FA98A";
      ctx.beginPath();
      ctx.arc(hx, hyBtm, 4, 0, Math.PI * 2);
      ctx.fill();

      // Hover Tooltip box
      const tSec = result.timeSec[hoverIndex];
      const cascLevelVal = result.cascade.level[hoverIndex].toFixed(1);
      const singleLevelVal = result.singleLoop.level[hoverIndex].toFixed(1);
      const cascFlowVal = result.cascade.flow[hoverIndex].toFixed(1);
      const flowSpVal = result.cascade.flowSetpoint[hoverIndex].toFixed(1);

      const tipText = [
        `T = ${tSec.toFixed(1)}s`,
        `CASC LEVEL: ${cascLevelVal}%`,
        showSingleLoop ? `SINGLE LEVEL: ${singleLevelVal}%` : null,
        `FLOW Q: ${cascFlowVal}% (SP: ${flowSpVal}%)`,
      ].filter(Boolean) as string[];

      const boxW = 150;
      const boxH = tipText.length * 15 + 10;
      let boxX = hx + 12;
      if (boxX + boxW > width - 10) boxX = hx - boxW - 12;
      let boxY = padT + 20;

      ctx.fillStyle = "rgba(29, 26, 21, 0.94)";
      ctx.strokeStyle = "#302B22";
      ctx.lineWidth = 1;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      tipText.forEach((line, idx) => {
        if (idx === 0) ctx.fillStyle = "#A79C8A";
        else if (line.startsWith("CASC LEVEL")) ctx.fillStyle = "#FFB000";
        else if (line.startsWith("SINGLE LEVEL")) ctx.fillStyle = "#D64550";
        else ctx.fillStyle = "#4FA98A";
        ctx.fillText(line, boxX + 8, boxY + 12 + idx * 15);
      });

      ctx.restore();
    }

    ctx.restore();
  }, [result, setpoint, showSingleLoop, disturbanceType, disturbanceTimeSec, height, hoverIndex]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !result || result.timeSec.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 54;
    const padR = 24;
    const plotW = rect.width - padL - padR;

    if (x < padL || x > rect.width - padR) {
      setHoverIndex(null);
      return;
    }

    const frac = (x - padL) / plotW;
    const idx = Math.round(frac * (result.timeSec.length - 1));
    setHoverIndex(Math.max(0, Math.min(result.timeSec.length - 1, idx)));
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="relative w-full rounded border border-line bg-panel-2 overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair block"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
