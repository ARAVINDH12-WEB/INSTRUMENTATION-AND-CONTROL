"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import OscilloscopeReadout from "@/components/ui/OscilloscopeReadout";
import { applyDisturbance } from "@/lib/pid-math";

type OperatingMode = "AUTO" | "MANUAL" | "CASCADE" | "ESD";

interface TelemetryPoint {
  time: number;
  level: number;
  setpoint: number;
  valve: number;
}

interface ModeJack {
  id: OperatingMode;
  name: string;
  tag: string;
  accent: string;
  description: string;
}

const MODE_JACKS: ModeJack[] = [
  {
    id: "AUTO",
    name: "Automatic",
    tag: "AUTO / PID",
    accent: "#FFB000",
    description: "Closed-loop feedback regulation",
  },
  {
    id: "MANUAL",
    name: "Manual",
    tag: "MAN / DIR",
    accent: "#4FA98A",
    description: "Direct operator valve output",
  },
  {
    id: "CASCADE",
    name: "Cascade",
    tag: "CASC / EXT",
    accent: "#5B9BD5",
    description: "Master supervisory loop bus",
  },
  {
    id: "ESD",
    name: "Emergency Trip",
    tag: "ESD / TRIP",
    accent: "#D64550",
    description: "Fail-safe valve shutdown to 0%",
  },
];

export default function DashboardPage() {
  // Operating States
  const [mode, setMode] = useState<OperatingMode>("AUTO");
  const [setpoint, setSetpoint] = useState<number>(55.0);
  const [manualValve, setManualValve] = useState<number>(50.0);
  const [kp, setKp] = useState<number>(2.1);
  const [ki, setKi] = useState<number>(0.35);
  const [kd, setKd] = useState<number>(0.1);

  // Live Plant Telemetry
  const [actualLevel, setActualLevel] = useState<number>(50.0);
  const [displayedLevel, setDisplayedLevel] = useState<number>(50.0);
  const [valvePos, setValvePos] = useState<number>(50.0);
  const [inletFlow, setInletFlow] = useState<number>(1.0);
  const [outflow, setOutflow] = useState<number>(0.3);
  const [sensorStatus, setSensorStatus] = useState<"OK" | "BAD" | "NOISY">("OK");

  // Disturbance State
  const [activeFault, setActiveFault] = useState<string | null>(null);
  const [stictionRemaining, setStictionRemaining] = useState<number>(0);

  // Internal Loop Refs for steady 10Hz simulation
  const stateRef = useRef({
    actualLevel: 50.0,
    lastGoodReading: 50.0,
    integral: 0,
    prevErr: 0,
    valvePos: 50.0,
    stictionRemainingMs: 0,
    activeFault: null as string | null,
    mode: "AUTO" as OperatingMode,
    setpoint: 55.0,
    manualValve: 50.0,
    kp: 2.1,
    ki: 0.35,
    kd: 0.1,
    history: [] as TelemetryPoint[],
  });

  // Keep stateRef synced with React state
  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.setpoint = setpoint;
    stateRef.current.manualValve = manualValve;
    stateRef.current.kp = kp;
    stateRef.current.ki = ki;
    stateRef.current.kd = kd;
  }, [mode, setpoint, manualValve, kp, ki, kd]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger Disturbances
  const triggerDisturbance = (type: "noise" | "outlet-spike" | "valve-stiction" | "transmitter-fail") => {
    if (type === "valve-stiction") {
      stateRef.current.stictionRemainingMs = 5000;
      setStictionRemaining(5);
      setActiveFault("Valve Stiction (~5s)");
      stateRef.current.activeFault = "valve-stiction";
    } else if (type === "outlet-spike") {
      stateRef.current.actualLevel = Math.max(0, applyDisturbance(stateRef.current.actualLevel, "outlet-spike") as number);
      setActiveFault("Outlet Flow Surge (-15%)");
      stateRef.current.activeFault = "outlet-spike";
      setTimeout(() => {
        setActiveFault(null);
        stateRef.current.activeFault = null;
      }, 3000);
    } else if (type === "transmitter-fail") {
      setActiveFault("Transmitter Quality Fail");
      setSensorStatus("BAD");
      stateRef.current.activeFault = "transmitter-fail";
    } else if (type === "noise") {
      setActiveFault("Sensor Noise Active");
      setSensorStatus("NOISY");
      stateRef.current.activeFault = "noise";
      setTimeout(() => {
        if (stateRef.current.activeFault === "noise") {
          setActiveFault(null);
          setSensorStatus("OK");
          stateRef.current.activeFault = null;
        }
      }, 6000);
    }
  };

  const resetPlant = () => {
    stateRef.current.actualLevel = 50.0;
    stateRef.current.lastGoodReading = 50.0;
    stateRef.current.integral = 0;
    stateRef.current.prevErr = 0;
    stateRef.current.valvePos = 50.0;
    stateRef.current.stictionRemainingMs = 0;
    stateRef.current.activeFault = null;
    setActiveFault(null);
    setSensorStatus("OK");
    setStictionRemaining(0);
    setMode("AUTO");
  };

  // Main Simulation Loop (100ms dt)
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      const s = stateRef.current;
      const dt = 0.1;
      t += dt;

      // Decrement stiction if active
      if (s.stictionRemainingMs > 0) {
        s.stictionRemainingMs -= 100;
        setStictionRemaining(Math.ceil(s.stictionRemainingMs / 1000));
        if (s.stictionRemainingMs <= 0) {
          s.activeFault = null;
          setActiveFault(null);
        }
      }

      // 1. Measure Process Variable
      let measured = s.actualLevel;
      if (s.activeFault === "noise") {
        measured = applyDisturbance(s.actualLevel, "noise") as number;
      } else if (s.activeFault === "transmitter-fail") {
        measured = s.lastGoodReading;
      } else {
        s.lastGoodReading = s.actualLevel;
      }

      // 2. Controller Output Calculation
      let commandedValve = s.valvePos;

      if (s.mode === "ESD") {
        commandedValve = 0;
      } else if (s.mode === "MANUAL") {
        commandedValve = s.manualValve;
      } else {
        // AUTOMATIC or CASCADE
        const err = s.setpoint - measured;
        s.integral += err * dt;
        // Anti-windup clamping
        s.integral = Math.max(-50, Math.min(50, s.integral));
        const deriv = (err - s.prevErr) / dt;
        s.prevErr = err;

        let out = s.kp * err + s.ki * s.integral + s.kd * deriv;
        commandedValve = Math.max(0, Math.min(100, out));
      }

      // 3. Apply Valve Stiction if active
      if (s.stictionRemainingMs <= 0) {
        s.valvePos = commandedValve;
      }

      // 4. Physical Plant Integration
      const valveGain = 0.02;
      const inflowRate = s.valvePos * valveGain;
      const outflowBase = 0.6;
      const outflowRate = outflowBase * (s.actualLevel / 100);

      s.actualLevel += (inflowRate - outflowRate) * dt * 2;
      s.actualLevel = Math.max(0, Math.min(100, s.actualLevel));

      // Push telemetry (keep rolling 200 cycles @ 10Hz = 20s horizon)
      s.history.push({
        time: t,
        level: s.activeFault === "transmitter-fail" ? measured : s.actualLevel,
        setpoint: s.setpoint,
        valve: s.valvePos,
      });
      if (s.history.length > 200) {
        s.history.shift();
      }

      // Update React UI states
      setActualLevel(s.actualLevel);
      setDisplayedLevel(measured);
      setValvePos(s.valvePos);
      setInletFlow(inflowRate * 50);
      setOutflow(outflowRate * 50);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Oscilloscope CRT Trend Rendering with Phosphor Decay
  const renderTrend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      // Clean background on resize
      ctx.fillStyle = "#090E0C";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // PHOSPHOR DECAY:
    // Translucent dark fill over previous frame produces authentic CRT persistence trails
    ctx.fillStyle = "rgba(9, 14, 12, 0.28)";
    ctx.fillRect(0, 0, width, height);

    const padL = 48;
    const padR = 20;
    const padT = 24;
    const padB = 30;
    const plotW = Math.max(10, width - padL - padR);
    const plotH = Math.max(10, height - padT - padB);

    // --- OSCILLOSCOPE RETICLE GRID (10 divs horizontal, 8 divs vertical) ---
    ctx.lineWidth = 1;
    const hDivs = 10;
    const vDivs = 8;

    // Faint grid lines
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

    // Center Crosshair axes with sub-ticks
    const midX = padL + plotW / 2;
    const midY = padT + plotH / 2;
    ctx.strokeStyle = "rgba(75, 128, 98, 0.55)";
    ctx.beginPath();
    ctx.moveTo(midX, padT);
    ctx.lineTo(midX, padT + plotH);
    ctx.moveTo(padL, midY);
    ctx.lineTo(padL + plotW, midY);
    ctx.stroke();

    // Border of graticule
    ctx.strokeStyle = "rgba(75, 128, 98, 0.65)";
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Y Axis calibration labels
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(167, 156, 138, 0.75)";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let j = 0; j <= vDivs; j += 2) {
      const p = 100 - (j / vDivs) * 100;
      const yPos = padT + (j / vDivs) * plotH;
      ctx.fillText(`${p.toFixed(0)}%`, padL - 8, yPos);
    }

    // X Axis labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= hDivs; i += 2) {
      const tRel = -20 + (i / hDivs) * 20;
      const xPos = padL + (i / hDivs) * plotW;
      ctx.fillText(`${tRel === 0 ? "NOW" : `${tRel}s`}`, xPos, padT + plotH + 6);
    }

    const history = stateRef.current.history;
    if (history.length < 2) {
      ctx.restore();
      return;
    }

    const toX = (i: number) => padL + (i / (history.length - 1)) * plotW;
    const toY = (v: number) => padT + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;

    // --- 1. SETPOINT LINE (Dashed Amber Glow) ---
    ctx.save();
    ctx.strokeStyle = "rgba(255, 176, 0, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(255, 176, 0, 0.5)";
    const spY = toY(setpoint);
    ctx.beginPath();
    ctx.moveTo(padL, spY);
    ctx.lineTo(padL + plotW, spY);
    ctx.stroke();
    ctx.restore();

    // --- 2. VALVE COMMAND TRACE (MV - Amber Dim Trace) ---
    ctx.save();
    ctx.strokeStyle = "rgba(255, 176, 0, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = toX(i);
      const y = toY(pt.valve);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // --- 3. PROCESS VARIABLE TRACE (PV - High-Glow Phosphor Beam) ---
    const traceColor = sensorStatus === "BAD" ? "#D64550" : "#4FA98A";
    const haloColor = sensorStatus === "BAD" ? "rgba(214, 69, 80, 0.45)" : "rgba(79, 169, 138, 0.45)";

    // Pass 1: Wide Phosphor Halo
    ctx.save();
    ctx.strokeStyle = haloColor;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = traceColor;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = toX(i);
      const y = toY(pt.level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Pass 2: High-Intensity Electron Core Beam
    ctx.save();
    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#FFF";
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = toX(i);
      const y = toY(pt.level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // End-point beam cursor dot
    const lastIdx = history.length - 1;
    const lastX = toX(lastIdx);
    const lastY = toY(history[lastIdx].level);
    ctx.fillStyle = traceColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = traceColor;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }, [setpoint, sensorStatus]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderTrend();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderTrend]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-text">
      <SiteHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 py-8 md:px-6">
        <InstrumentPanel className="mb-6">
          {/* Plant Overview Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#302B22] pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-amber tracking-widest uppercase mb-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_8px_#FFB000] animate-pulse" />
                <span>DCS CENTRAL CONTROLLER // UNIT 01</span>
                <span>·</span>
                <span>BUFFER TANK TK-104</span>
              </div>
              <h1 className="font-panel-heading text-2xl md:text-3xl font-bold text-text">
                Process Control Supervisory Console
              </h1>
              <p className="font-panel-body text-xs text-text-dim mt-1 max-w-2xl leading-relaxed">
                Supervisory distributed control system interface with real-time hardware patch-jack mode selection, 
                oscilloscope phosphor persistence trending, and live fault matrix injection.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-faint">SENSOR STATUS:</span>
              {sensorStatus === "OK" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-verdigris/15 text-verdigris border border-verdigris/40 font-mono text-xs font-semibold shadow-[0_0_8px_rgba(79,169,138,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-verdigris animate-pulse" />
                  NORMAL · GOOD
                </span>
              )}
              {sensorStatus === "BAD" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-crimson/20 text-crimson border border-crimson font-mono text-xs font-bold animate-pulse shadow-[0_0_8px_rgba(214,69,80,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-crimson" />
                  BAD QUALITY · FAIL
                </span>
              )}
              {sensorStatus === "NOISY" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber/20 text-amber border border-amber font-mono text-xs font-bold shadow-[0_0_8px_rgba(255,176,0,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                  NOISE ANOMALY
                </span>
              )}
            </div>
          </div>

          {/* Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Plant Annunciator & Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Hardware Patch-Jack Mode Selector */}
              <div className="rounded border border-[#302B22] bg-[#14120E] p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between border-b border-[#241F18] pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: MODE_JACKS.find((j) => j.id === mode)?.accent || "#FFB000",
                        boxShadow: `0 0 8px ${MODE_JACKS.find((j) => j.id === mode)?.accent || "#FFB000"}`,
                      }}
                    />
                    <h3 className="font-panel-heading text-xs font-bold tracking-wider text-text uppercase">
                      OPERATING MODE PATCH MATRIX
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-text-faint px-1.5 py-0.5 rounded bg-[#1B1813] border border-[#2B251D]">
                    1/4&quot; HARDWARE JACKS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
                  {MODE_JACKS.map((jack) => {
                    const isSelected = mode === jack.id;
                    return (
                      <div
                        key={jack.id}
                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${
                          isSelected
                            ? "bg-[#1E1B15] border-[#453D30] shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                            : "bg-[#12100C] border-[#221D16] hover:border-[#383125] opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="text-[10px] font-mono font-medium text-text-dim mb-1 text-center truncate max-w-full">
                          {jack.tag}
                        </div>

                        {/* Physical Hardware 1/4" Jack Button */}
                        <button
                          type="button"
                          onClick={() => setMode(jack.id)}
                          title={`Click to route control loop into ${jack.name} mode`}
                          className="relative group w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none"
                          style={{
                            background:
                              "radial-gradient(circle at 35% 35%, #443B30 0%, #201C16 70%, #100E0B 100%)",
                            boxShadow: `
                              0 2px 6px rgba(0,0,0,0.8),
                              inset 0 1px 1px rgba(255,255,255,0.15),
                              0 0 0 2px ${isSelected ? jack.accent : "#2C261E"}
                            `,
                          }}
                        >
                          {/* Knurled Hex Nut */}
                          <div className="absolute inset-1 rounded-full border border-dashed border-[#554A3B] opacity-50 pointer-events-none" />

                          {/* Inner Socket */}
                          <div
                            className="w-4 h-4 rounded-full bg-[#080706] flex items-center justify-center pointer-events-none"
                            style={{
                              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.95)",
                              border: `1.5px solid ${isSelected ? jack.accent : "#3A3328"}`,
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: isSelected ? jack.accent : "#1A1713",
                                boxShadow: isSelected ? `0 0 6px ${jack.accent}` : "none",
                              }}
                            />
                          </div>

                          {/* Plug Inserted State Indicator */}
                          {isSelected && (
                            <div
                              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#14120E] animate-pulse"
                              style={{
                                backgroundColor: jack.accent,
                                boxShadow: `0 0 6px ${jack.accent}`,
                              }}
                            />
                          )}
                        </button>

                        <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? jack.accent : "#3A3225" }}
                          />
                          <span style={{ color: isSelected ? jack.accent : "#6A6052" }}>
                            {isSelected ? "PATCHED" : "OPEN"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {mode === "ESD" && (
                  <div className="mt-3 p-2.5 bg-crimson/20 border border-crimson rounded text-xs font-mono text-crimson text-center font-bold animate-pulse">
                    ⚠ EMERGENCY SHUTDOWN ACTIVE: INLET VALVE FORCED SHUT (0%)
                  </div>
                )}
              </div>

              {/* Vessel Status & Key Metrics with Oscilloscope Phosphor Readouts */}
              <div className="rounded border border-[#302B22] bg-[#16130F] p-5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-4">
                  <div className="font-mono text-xs text-amber tracking-wider uppercase font-semibold">
                    PROCESS TELEMETRY // LT-104
                  </div>
                  <span className="font-mono text-[10px] text-text-faint">ISA-5.1 LOOP</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <OscilloscopeReadout
                    label="LEVEL (PV)"
                    statusBadge="TANK TK-104"
                    variant={sensorStatus === "BAD" ? "crimson" : "amber"}
                    size="md"
                    value={sensorStatus === "BAD" ? "PEGGED" : `${displayedLevel.toFixed(1)}%`}
                    subtext={`PHYSICAL: ${actualLevel.toFixed(1)}%`}
                  />

                  <OscilloscopeReadout
                    label="SETPOINT (SP)"
                    statusBadge="TARGET REF"
                    variant="amber"
                    size="md"
                    value={`${setpoint.toFixed(1)}%`}
                    subtext={`ERR: ${(setpoint - displayedLevel).toFixed(1)}%`}
                  />

                  <OscilloscopeReadout
                    label="VALVE (MV)"
                    statusBadge="ACTUATOR"
                    variant="verdigris"
                    size="md"
                    value={`${valvePos.toFixed(1)}%`}
                    subtext={`INFLOW: ${inletFlow.toFixed(2)} m³/h`}
                  />

                  <OscilloscopeReadout
                    label="DISCHARGE"
                    statusBadge="OUTLET FLOW"
                    variant="verdigris"
                    size="md"
                    value={`${outflow.toFixed(2)}`}
                    unit="m³/h"
                    subtext="GRAVITY DRAIN"
                  />
                </div>

                {/* Setpoint / Manual Slider */}
                <div className="mt-5 space-y-4 border-t border-[#26211A] pt-4">
                  {mode === "AUTO" || mode === "CASCADE" ? (
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-text-dim">SETPOINT ADJUST (10–90%):</span>
                        <span className="text-amber font-bold">{setpoint}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={setpoint}
                        onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                        className="w-full accent-amber"
                      />
                    </div>
                  ) : mode === "MANUAL" ? (
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-text-dim">MANUAL VALVE COMMAND (0–100%):</span>
                        <span className="text-verdigris font-bold">{manualValve}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={manualValve}
                        onChange={(e) => setManualValve(parseFloat(e.target.value))}
                        className="w-full accent-verdigris"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Disturbance Fault Injection Matrix */}
              <div className="rounded border border-[#302B22] bg-[#16130F] p-5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-3">
                  <div className="font-mono text-xs text-amber uppercase tracking-wider font-semibold">
                    FAULT INJECTION &amp; DISTURBANCE MATRIX
                  </div>
                  {activeFault && (
                    <span className="text-[11px] font-mono text-crimson font-bold uppercase animate-pulse">
                      [{activeFault}]
                    </span>
                  )}
                </div>

                <p className="font-panel-body text-xs text-text-dim mb-4 leading-relaxed">
                  Stress-test the control loop in real time. Inject sensor anomalies, hydraulic surge shocks, or valve mechanical freezing.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerDisturbance("noise")}
                    className="p-2.5 text-xs font-mono rounded bg-[#100E0B] border border-[#2C261E] text-text hover:border-amber hover:text-amber text-left transition-colors shadow-inner"
                  >
                    <div className="font-bold text-amber">1. SENSOR NOISE</div>
                    <div className="text-[10px] text-text-faint">±3% measurement jitter</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDisturbance("outlet-spike")}
                    className="p-2.5 text-xs font-mono rounded bg-[#100E0B] border border-[#2C261E] text-text hover:border-amber hover:text-amber text-left transition-colors shadow-inner"
                  >
                    <div className="font-bold text-amber">2. OUTLET SPIKE</div>
                    <div className="text-[10px] text-text-faint">-15% surge demand</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDisturbance("valve-stiction")}
                    className="p-2.5 text-xs font-mono rounded bg-[#100E0B] border border-[#2C261E] text-text hover:border-amber hover:text-amber text-left transition-colors shadow-inner"
                  >
                    <div className="font-bold text-amber">3. VALVE STICTION</div>
                    <div className="text-[10px] text-text-faint">
                      {stictionRemaining > 0 ? `FREEZE: ${stictionRemaining}s` : "Freezes valve ~5s"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDisturbance("transmitter-fail")}
                    className="p-2.5 text-xs font-mono rounded bg-[#100E0B] border border-[#2C261E] text-text hover:border-crimson hover:text-crimson text-left transition-colors shadow-inner"
                  >
                    <div className="font-bold text-crimson">4. XMTR FAILURE</div>
                    <div className="text-[10px] text-text-faint">Pegs &amp; sets BAD quality</div>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#241F18] flex justify-end">
                  <button
                    type="button"
                    onClick={resetPlant}
                    className="px-3 py-1.5 text-xs font-mono text-text-dim hover:text-amber border border-[#2B251D] bg-[#12100C] rounded hover:border-amber transition-colors"
                  >
                    ↺ RESET LOOP TO NOMINAL
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Oscilloscope Trend Strip Chart & Loop Parameters */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Oscilloscope Phosphor Live Trend Container */}
              <div className="rounded border border-[#302B22] bg-[#14120E] p-5 flex flex-col shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#241F18] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-verdigris shadow-[0_0_6px_#4FA98A] animate-pulse" />
                    <span className="font-panel-heading text-xs font-bold text-text uppercase tracking-wider">
                      CRT OSCILLOSCOPE RECORDER // 20-SEC ROLLING WINDOW
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-verdigris rounded-sm shadow-[0_0_4px_#4FA98A] inline-block" />
                      <span className="text-text-dim text-[11px]">PV (Level)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-b border-dashed border-amber inline-block" />
                      <span className="text-text-dim text-[11px]">SP (Target)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-amber/60 inline-block" />
                      <span className="text-text-dim text-[11px]">MV (Valve)</span>
                    </div>
                  </div>
                </div>

                {/* CRT Oscilloscope Bezel */}
                <div className="w-full h-80 relative rounded border border-[#23352B] bg-[#090E0C] shadow-[inset_0_0_28px_rgba(0,0,0,0.95)] overflow-hidden select-none">
                  {/* Scope Calibration Header */}
                  <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono tracking-wider pointer-events-none z-20">
                    <div className="flex items-center gap-3 text-[#588A6E]">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4FA98A] shadow-[0_0_4px_#4FA98A]" />
                        CH A: PV (10%/DIV)
                      </span>
                      <span className="text-[#3A5D4A]">|</span>
                      <span>TIME/DIV: 2.0s</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-amber">SP: {setpoint.toFixed(0)}%</span>
                      <span className="text-[#3A5D4A]">|</span>
                      <span className="text-verdigris">PV: {displayedLevel.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Main CRT Canvas with Phosphor Decay */}
                  <canvas ref={canvasRef} className="w-full h-full block" />

                  {/* CRT Scanline Overlay (~25% opacity) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-25"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)",
                    }}
                  />

                  {/* CRT Radial Vignette Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background:
                        "radial-gradient(ellipse 95% 85% at center, transparent 60%, rgba(4, 8, 6, 0.75) 100%)",
                      boxShadow: "inset 0 0 32px rgba(0,0,0,0.85)",
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-text-faint mt-3 border-t border-[#201B15] pt-2">
                  <span>CIRCULAR BUFFER: 200 SAMPLES @ 10Hz</span>
                  <span>PHOSPHOR PERSISTENCE DECAY ACTIVE</span>
                </div>
              </div>

              {/* PID Tuning Strip */}
              <div className="rounded border border-[#302B22] bg-[#16130F] p-5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-[#26211A] pb-2.5 mb-3">
                  <div className="font-mono text-xs text-amber tracking-wider uppercase font-semibold">
                    LOOP TUNING COEFFICIENTS (ACTIVE ALGORITHM)
                  </div>
                  <span className="font-mono text-[10px] text-text-faint">PARALLEL FORM</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-text-dim">GAIN (Kp):</span>
                      <span className="text-amber font-bold">{kp}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="6.0"
                      step="0.1"
                      value={kp}
                      onChange={(e) => setKp(parseFloat(e.target.value))}
                      className="w-full accent-amber"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-text-dim">RESET (Ki):</span>
                      <span className="text-amber font-bold">{ki}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={ki}
                      onChange={(e) => setKi(parseFloat(e.target.value))}
                      className="w-full accent-amber"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-text-dim">RATE (Kd):</span>
                      <span className="text-amber font-bold">{kd}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.02"
                      value={kd}
                      onChange={(e) => setKd(parseFloat(e.target.value))}
                      className="w-full accent-amber"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-[#241F18] pt-3 mt-4 text-xs font-mono">
                  <span className="text-text-faint">PRESET TUNING:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setKp(2.1);
                        setKi(0.35);
                        setKd(0.1);
                      }}
                      className="px-2.5 py-1 rounded bg-[#100E0B] border border-[#2B251D] text-verdigris hover:border-verdigris text-[11px] transition-colors"
                    >
                      WELL-TUNED (NOMINAL)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKp(5.2);
                        setKi(0.9);
                        setKd(0.0);
                      }}
                      className="px-2.5 py-1 rounded bg-[#100E0B] border border-[#2B251D] text-crimson hover:border-crimson text-[11px] transition-colors"
                    >
                      AGGRESSIVE (RINGING)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter subtitle="SUPERVISORY DCS INTERFACE // REV 2.0" />
    </div>
  );
}
