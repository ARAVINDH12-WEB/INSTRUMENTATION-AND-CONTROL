"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { applyDisturbance } from "@/lib/pid-math";

type OperatingMode = "AUTO" | "MANUAL" | "CASCADE" | "ESD";

interface TelemetryPoint {
  time: number;
  level: number;
  setpoint: number;
  valve: number;
}

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
        // Transmitter failure: freeze at last good reading, quality is BAD
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

      // Push telemetry
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
      setInletFlow(inflowRate * 50); // scaled for display
      setOutflow(outflowRate * 50);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Canvas Trend Rendering
  const renderTrend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#18150F";
    ctx.fillRect(0, 0, width, height);

    // Horizontal Grid Ticks
    ctx.strokeStyle = "#221E17";
    ctx.lineWidth = 1;
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.fillStyle = "#6B6255";

    for (let p = 0; p <= 100; p += 25) {
      const y = height - (p / 100) * (height - 30) - 15;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
      ctx.fillText(`${p}%`, 10, y + 3);
    }

    const history = stateRef.current.history;
    if (history.length < 2) return;

    const xStart = 45;
    const xEnd = width - 15;
    const xSpan = xEnd - xStart;
    const yBot = height - 15;
    const yTop = 15;
    const ySpan = yBot - yTop;

    // Draw Setpoint Line (Amber Dashed)
    const spY = yBot - (setpoint / 100) * ySpan;
    ctx.strokeStyle = "#8C6318";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xStart, spY);
    ctx.lineTo(xEnd, spY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Process Variable Trace (Phosphor Green / Amber Glow)
    ctx.strokeStyle = sensorStatus === "BAD" ? "#D64550" : "#4FA98A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = xStart + (i / (history.length - 1)) * xSpan;
      const y = yBot - (pt.level / 100) * ySpan;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Valve Opening (Soft Amber)
    ctx.strokeStyle = "rgba(255, 176, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = xStart + (i / (history.length - 1)) * xSpan;
      const y = yBot - (pt.valve / 100) * ySpan;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [setpoint, sensorStatus]);

  useEffect(() => {
    const handle = requestAnimationFrame(renderTrend);
    return () => cancelAnimationFrame(handle);
  }, [actualLevel, renderTrend]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Plant Overview Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cf-line pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-1">
              <span>DCS CENTRAL CONTROLLER // UNIT 01</span>
              <span>·</span>
              <span>BUFFER TANK TK-104</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-cf-text">
              Process Control Supervisory Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-cf-text-faint">SENSOR STATUS:</span>
            {sensorStatus === "OK" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cf-verdigris/15 text-cf-verdigris border border-cf-verdigris/40 font-mono text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-cf-verdigris animate-pulse" />
                NORMAL · GOOD
              </span>
            )}
            {sensorStatus === "BAD" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cf-crimson/20 text-cf-crimson border border-cf-crimson font-mono text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cf-crimson" />
                BAD QUALITY · FAIL
              </span>
            )}
            {sensorStatus === "NOISY" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cf-amber/20 text-cf-amber border border-cf-amber font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-cf-amber animate-pulse" />
                NOISE ANOMALY
              </span>
            )}
          </div>
        </div>

        {/* Console Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Plant Annunciator & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Operating Mode Bar */}
            <div className="bg-cf-panel border border-cf-line rounded p-4">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-3">
                OPERATING CONTROL MODE
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["AUTO", "MANUAL", "CASCADE", "ESD"] as OperatingMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 px-3 text-xs font-mono font-bold rounded border transition-colors ${
                      mode === m
                        ? m === "ESD"
                          ? "bg-cf-crimson text-cf-text border-cf-crimson shadow-md"
                          : "bg-cf-amber text-cf-bg border-cf-amber"
                        : "bg-cf-panel-2 text-cf-text-dim border-cf-line hover:border-cf-amber-dim"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mode === "ESD" && (
                <div className="mt-3 p-2 bg-cf-crimson/20 border border-cf-crimson rounded text-xs font-mono text-cf-crimson text-center font-semibold">
                  EMERGENCY SHUTDOWN ACTIVE: INLET VALVE FORCED SHUT (0%)
                </div>
              )}
            </div>

            {/* Vessel Status & Key Metrics */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber tracking-wider uppercase mb-4">
                PROCESS READOUTS // LT-104
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cf-panel-2 border border-cf-line p-3 rounded">
                  <div className="text-[11px] font-mono text-cf-text-faint">MEASURED LEVEL (PV)</div>
                  <div className={`text-2xl font-mono font-bold ${sensorStatus === "BAD" ? "text-cf-crimson" : "text-cf-amber"}`}>
                    {sensorStatus === "BAD" ? "PEGGED" : `${displayedLevel.toFixed(1)}%`}
                  </div>
                  <div className="text-[10px] font-mono text-cf-text-dim mt-1">
                    PHYSICAL: {actualLevel.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-cf-panel-2 border border-cf-line p-3 rounded">
                  <div className="text-[11px] font-mono text-cf-text-faint">TARGET SETPOINT (SP)</div>
                  <div className="text-2xl font-mono font-bold text-cf-text">
                    {setpoint.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-cf-text-dim mt-1">
                    ERR: {(setpoint - displayedLevel).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-cf-panel-2 border border-cf-line p-3 rounded">
                  <div className="text-[11px] font-mono text-cf-text-faint">VALVE POSITION (MV)</div>
                  <div className="text-2xl font-mono font-bold text-cf-verdigris">
                    {valvePos.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-cf-text-dim mt-1">
                    INFLOW: {inletFlow.toFixed(2)} m³/h
                  </div>
                </div>

                <div className="bg-cf-panel-2 border border-cf-line p-3 rounded">
                  <div className="text-[11px] font-mono text-cf-text-faint">DEMAND OUTFLOW</div>
                  <div className="text-2xl font-mono font-bold text-cf-text-dim">
                    {outflow.toFixed(2)} m³/h
                  </div>
                  <div className="text-[10px] font-mono text-cf-text-dim mt-1">
                    GRAVITY DISCHARGE
                  </div>
                </div>
              </div>

              {/* Setpoint / Manual Slider */}
              <div className="mt-5 space-y-4 border-t border-cf-line-soft pt-4">
                {mode === "AUTO" || mode === "CASCADE" ? (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-cf-text-dim">SETPOINT ADJUST (0–100%):</span>
                      <span className="text-cf-amber font-bold">{setpoint}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="1"
                      value={setpoint}
                      onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                      className="w-full accent-cf-amber"
                    />
                  </div>
                ) : mode === "MANUAL" ? (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-cf-text-dim">MANUAL VALVE COMMAND:</span>
                      <span className="text-cf-verdigris font-bold">{manualValve}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={manualValve}
                      onChange={(e) => setManualValve(parseFloat(e.target.value))}
                      className="w-full accent-cf-verdigris"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Disturbance Fault Injection Panel */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                  FAULT INJECTION &amp; DISTURBANCE MATRIX
                </div>
                {activeFault && (
                  <span className="text-[11px] font-mono text-cf-crimson font-bold uppercase animate-pulse">
                    [{activeFault}]
                  </span>
                )}
              </div>

              <p className="text-xs text-cf-text-dim mb-4">
                Stress-test the control loop in real time. Inject sensor anomalies, hydraulic surge shocks, or valve mechanical freezing.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerDisturbance("noise")}
                  className="p-2.5 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-text hover:border-cf-amber hover:text-cf-amber text-left transition-colors"
                >
                  <div className="font-bold">1. SENSOR NOISE</div>
                  <div className="text-[10px] text-cf-text-faint">±3% measurement jitter</div>
                </button>

                <button
                  onClick={() => triggerDisturbance("outlet-spike")}
                  className="p-2.5 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-text hover:border-cf-amber hover:text-cf-amber text-left transition-colors"
                >
                  <div className="font-bold">2. OUTLET SPIKE</div>
                  <div className="text-[10px] text-cf-text-faint">-15% surge demand</div>
                </button>

                <button
                  onClick={() => triggerDisturbance("valve-stiction")}
                  className="p-2.5 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-text hover:border-cf-amber hover:text-cf-amber text-left transition-colors"
                >
                  <div className="font-bold">3. VALVE STICTION</div>
                  <div className="text-[10px] text-cf-text-faint">
                    {stictionRemaining > 0 ? `FREEZE: ${stictionRemaining}s` : "Freezes valve ~5s"}
                  </div>
                </button>

                <button
                  onClick={() => triggerDisturbance("transmitter-fail")}
                  className="p-2.5 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-text hover:border-cf-crimson hover:text-cf-crimson text-left transition-colors"
                >
                  <div className="font-bold text-cf-crimson">4. XMTR FAILURE</div>
                  <div className="text-[10px] text-cf-text-faint">Pegs &amp; sets BAD quality</div>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-cf-line-soft flex justify-end">
                <button
                  onClick={resetPlant}
                  className="px-3 py-1.5 text-xs font-mono text-cf-text-dim hover:text-cf-amber border border-cf-line rounded hover:border-cf-amber transition-colors"
                >
                  ↺ RESET LOOP TO NOMINAL
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Trend Strip Chart & Loop Parameters */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Live Chart Container */}
            <div className="bg-cf-panel border border-cf-line rounded p-5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="font-mono text-xs text-cf-amber tracking-wider uppercase">
                  REAL-TIME TREND RECORDER // 60-SEC ROLLING WINDOW
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cf-verdigris inline-block" />
                    <span className="text-cf-text-dim">PV (Level)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-cf-amber inline-block" />
                    <span className="text-cf-text-dim">SP (Target)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cf-amber/40 inline-block" />
                    <span className="text-cf-text-dim">MV (Valve %)</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-80 relative rounded border border-cf-line overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-cf-text-faint mt-3">
                <span>HISTORY: 200 CYCLES @ 10Hz</span>
                <span>TIME BASE: 0.1s / STEP</span>
              </div>
            </div>

            {/* PID Tuning Strip */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber tracking-wider uppercase mb-3">
                LOOP TUNING COEFFICIENTS (ACTIVE ALGORITHM)
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">GAIN (Kp):</span>
                    <span className="text-cf-amber font-bold">{kp}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="6.0"
                    step="0.1"
                    value={kp}
                    onChange={(e) => setKp(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">RESET (Ki):</span>
                    <span className="text-cf-amber font-bold">{ki}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={ki}
                    onChange={(e) => setKi(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cf-text-dim">RATE (Kd):</span>
                    <span className="text-cf-amber font-bold">{kd}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={kd}
                    onChange={(e) => setKd(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-cf-line-soft pt-3 mt-4 text-xs font-mono">
                <span className="text-cf-text-faint">PRESET TUNING:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setKp(2.1);
                      setKi(0.35);
                      setKd(0.1);
                    }}
                    className="px-2.5 py-1 rounded bg-cf-panel-2 border border-cf-line text-cf-verdigris hover:border-cf-verdigris text-[11px]"
                  >
                    WELL-TUNED (PRESET)
                  </button>
                  <button
                    onClick={() => {
                      setKp(5.2);
                      setKi(0.9);
                      setKd(0.0);
                    }}
                    className="px-2.5 py-1 rounded bg-cf-panel-2 border border-cf-line text-cf-crimson hover:border-cf-crimson text-[11px]"
                  >
                    AGGRESSIVE (OSCILLATING)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter subtitle="SUPERVISORY DCS INTERFACE // REV 2.0" />
    </div>
  );
}
