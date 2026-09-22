/**
 * ControlForge Mathematical Kernel
 * Derived strictly from controlforge-pid-simulation skill.
 * Pure, client-side functions for process simulations, signal scaling, and disturbance models.
 */

// --- Discrete PID + Tank Level Simulation ---

export interface SimOpts {
  dt?: number;
  steps?: number;
  outflowBase?: number;
  valveGain?: number;
  noiseAmplitude?: number;
  initialLevel?: number;
  thermalMass?: number;
  lossCoeff?: number;
  inertia?: number;
  friction?: number;
}

/**
 * Simulates a PID-controlled tank-level process.
 * @param Kp - proportional gain
 * @param Ki - integral gain
 * @param Kd - derivative gain
 * @param setpoint - target level, 0-100 (%)
 * @param opts - optional overrides
 * @returns level at each timestep
 */
export function simulateTankPID(
  Kp: number,
  Ki: number,
  Kd: number,
  setpoint: number,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 600;
  const outflowBase = opts.outflowBase ?? 0.6;
  const valveGain = opts.valveGain ?? 0.02;
  const noiseAmplitude = opts.noiseAmplitude ?? 0;

  let level = opts.initialLevel ?? 20;
  let integral = 0;
  let prevErr = 0;
  const data: number[] = [];

  for (let i = 0; i < steps; i++) {
    const measuredLevel =
      noiseAmplitude > 0
        ? level + (Math.random() - 0.5) * 2 * noiseAmplitude
        : level;

    const err = setpoint - measuredLevel;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;

    let out = Kp * err + Ki * integral + Kd * deriv;
    out = Math.max(0, Math.min(100, out)); // clamp controller output 0-100%

    const inflow = out * valveGain;
    const outflow = outflowBase * (level / 100);
    level += (inflow - outflow) * dt * 2;
    level = Math.max(0, Math.min(100, level)); // clamp physical level 0-100%

    prevErr = err;
    data.push(level);
  }
  return data;
}

export interface MetricsResult {
  overshootPct: number;
  riseTimeSec: number | null;
  settlingTimeSec: number;
}

/**
 * Computes performance metrics (rise time, overshoot, settling time).
 */
export function computeMetrics(data: number[], setpoint: number): MetricsResult {
  const max = Math.max(...data);
  const overshootPct = Math.max(0, ((max - setpoint) / setpoint) * 100);

  const riseIdx = data.findIndex((v) => v >= setpoint * 0.9);
  const riseTimeSec = riseIdx >= 0 ? riseIdx * 0.1 : null;

  let settleIdx = data.length - 1;
  for (let i = data.length - 1; i > 0; i--) {
    if (Math.abs(data[i] - setpoint) > setpoint * 0.05) {
      settleIdx = i;
      break;
    }
  }
  const settlingTimeSec = settleIdx * 0.1;

  return { overshootPct, riseTimeSec, settlingTimeSec };
}

// --- Cascade & Feedforward Control Kernel ---

export interface CascadeSimOpts extends SimOpts {
  feedforwardGain?: number;
  feedforwardEnabled?: boolean;
  disturbanceType?: "none" | "supply_drop" | "demand_surge" | "combined";
  disturbanceTimeSec?: number;
}

export interface DetailedMetrics extends MetricsResult {
  maxDisturbanceError: number;
  iae: number; // Integrated Absolute Error
}

export interface CascadeSimulationResult {
  timeSec: number[];
  cascade: {
    level: number[];
    flow: number[];
    flowSetpoint: number[];
    valveOutput: number[];
    metrics: DetailedMetrics;
  };
  singleLoop: {
    level: number[];
    flow: number[];
    valveOutput: number[];
    metrics: DetailedMetrics;
  };
  disturbance: {
    supplyFactor: number[];
    demandSurge: number[];
  };
}

/**
 * Simulates a two-loop industrial Cascade + Feedforward tank-level process
 * alongside a single-loop PID baseline subjected to identical disturbances.
 *
 * Outer Loop (Master): Level Controller LIC-301 -> generates dynamic flow setpoint
 * Inner Loop (Slave):  Flow Controller FIC-301 -> fast valve actuator MV modulation
 * Feedforward:         Injected on demand surge disturbance D(t)
 */
export function simulateCascadeTankPID(
  outerGains: { kp: number; ki: number; kd: number },
  innerGains: { kp: number; ki: number; kd?: number },
  setpoint: number,
  opts: CascadeSimOpts = {}
): CascadeSimulationResult {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 600;
  const outflowBase = opts.outflowBase ?? 0.6;
  const valveGain = opts.valveGain ?? 0.02;
  const noiseAmplitude = opts.noiseAmplitude ?? 0;
  const initialLevel = opts.initialLevel ?? 20;

  const ffGain = opts.feedforwardGain ?? 1.0;
  const ffEnabled = opts.feedforwardEnabled ?? false;
  const distType = opts.disturbanceType ?? "none";
  const distTimeSec = opts.disturbanceTimeSec ?? 20;
  const distStepIdx = Math.round(distTimeSec / dt);

  // Time arrays
  const timeSec: number[] = [];
  const cascLevel: number[] = [];
  const cascFlow: number[] = [];
  const cascFlowSp: number[] = [];
  const cascValve: number[] = [];

  const singleLevel: number[] = [];
  const singleFlow: number[] = [];
  const singleValve: number[] = [];

  const distSupply: number[] = [];
  const distDemand: number[] = [];

  // State variables - Cascade
  let hCasc = initialLevel;
  let intOuter = 0;
  let prevErrOuter = 0;
  let intInner = 0;
  let prevErrInner = 0;

  // State variables - Single Loop Baseline
  let hSingle = initialLevel;
  let intSingle = 0;
  let prevErrSingle = 0;

  // If initialLevel is at setpoint, initialize integrators to maintain steady state
  const reqFlowSteady = (outflowBase * (initialLevel / 100)) / valveGain;
  let qCasc = reqFlowSteady;
  let qSingle = reqFlowSteady;

  const isSteadyStart = Math.abs(initialLevel - setpoint) < 0.1;
  if (isSteadyStart) {
    intOuter = outerGains.ki > 0 ? reqFlowSteady / outerGains.ki : 0;
    intInner = innerGains.ki > 0 ? reqFlowSteady / innerGains.ki : 0;
    intSingle = outerGains.ki > 0 ? reqFlowSteady / outerGains.ki : 0;
  }

  const tauFlow = 0.3; // fast valve/fluid time constant (seconds)

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    timeSec.push(Number(t.toFixed(1)));

    // Disturbance profiles
    // 1. Upstream supply pressure drop at t >= 20s
    let supplyFactor = 1.0;
    if ((distType === "supply_drop" || distType === "combined") && i >= distStepIdx) {
      supplyFactor = 0.62; // 38% pressure loss
    }
    distSupply.push(supplyFactor);

    // 2. Downstream demand surge (extra outflow)
    let demandSurge = 0;
    const demandStepIdx = distType === "combined" ? Math.round(35 / dt) : distStepIdx;
    if ((distType === "demand_surge" || distType === "combined") && i >= demandStepIdx) {
      demandSurge = 20; // 20% surge in flow demand
    }
    distDemand.push(demandSurge);

    // Sensor noise
    const noiseCasc = noiseAmplitude > 0 ? (Math.random() - 0.5) * 2 * noiseAmplitude : 0;
    const noiseSingle = noiseAmplitude > 0 ? (Math.random() - 0.5) * 2 * noiseAmplitude : 0;

    // --- 1. CASCADE CONTROLLER ---
    // Outer Loop: Master Level LIC-301
    const errOuter = setpoint - (hCasc + noiseCasc);
    intOuter += errOuter * dt;
    const derivOuter = (errOuter - prevErrOuter) / dt;

    // Feedforward contribution (direct feedforward compensation on demand disturbance)
    const ffCorrection = ffEnabled ? ffGain * demandSurge : 0;

    // Outer controller sets remote setpoint for inner flow controller (0 - 100%)
    let flowSp = outerGains.kp * errOuter + outerGains.ki * intOuter + outerGains.kd * derivOuter + ffCorrection;
    flowSp = Math.max(0, Math.min(100, flowSp));
    cascFlowSp.push(flowSp);

    // Inner Loop: Slave Flow FIC-301 (runs fast PI on flow)
    const errInner = flowSp - qCasc;
    intInner += errInner * dt;
    const kdInner = innerGains.kd ?? 0;
    const derivInner = (errInner - prevErrInner) / dt;

    let valveCasc = innerGains.kp * errInner + innerGains.ki * intInner + kdInner * derivInner;
    valveCasc = Math.max(0, Math.min(100, valveCasc));
    cascValve.push(valveCasc);

    // Actuator/flow dynamics: valve movement + upstream supply pressure affects flow
    const targetFlowCasc = valveCasc * supplyFactor;
    qCasc += ((targetFlowCasc - qCasc) / tauFlow) * dt;
    qCasc = Math.max(0, Math.min(100, qCasc));
    cascFlow.push(qCasc);

    // Tank Level accumulation
    const inflowCasc = qCasc * valveGain;
    const outflowCasc = outflowBase * (hCasc / 100) + demandSurge * (valveGain * 0.7);
    hCasc += (inflowCasc - outflowCasc) * dt * 2;
    hCasc = Math.max(0, Math.min(100, hCasc));
    cascLevel.push(hCasc);

    prevErrOuter = errOuter;
    prevErrInner = errInner;

    // --- 2. SINGLE-LOOP PID BASELINE ---
    const errSingle = setpoint - (hSingle + noiseSingle);
    intSingle += errSingle * dt;
    const derivSingle = (errSingle - prevErrSingle) / dt;

    let valveSingle = outerGains.kp * errSingle + outerGains.ki * intSingle + outerGains.kd * derivSingle;
    valveSingle = Math.max(0, Math.min(100, valveSingle));
    singleValve.push(valveSingle);

    // Actuator/flow dynamics for single loop
    const targetFlowSingle = valveSingle * supplyFactor;
    qSingle += ((targetFlowSingle - qSingle) / tauFlow) * dt;
    qSingle = Math.max(0, Math.min(100, qSingle));
    singleFlow.push(qSingle);

    const inflowSingle = qSingle * valveGain;
    const outflowSingle = outflowBase * (hSingle / 100) + demandSurge * (valveGain * 0.7);
    hSingle += (inflowSingle - outflowSingle) * dt * 2;
    hSingle = Math.max(0, Math.min(100, hSingle));
    singleLevel.push(hSingle);

    prevErrSingle = errSingle;
  }

  // Calculate detailed performance metrics
  const computeDetailed = (data: number[]): DetailedMetrics => {
    const base = computeMetrics(data, setpoint);
    let maxDistErr = 0;
    let iae = 0;

    for (let i = 0; i < data.length; i++) {
      const err = Math.abs(data[i] - setpoint);
      iae += err * dt;
      if (i >= distStepIdx) {
        if (err > maxDistErr) maxDistErr = err;
      }
    }

    return {
      ...base,
      maxDisturbanceError: Number(maxDistErr.toFixed(2)),
      iae: Number(iae.toFixed(1)),
    };
  };

  return {
    timeSec,
    cascade: {
      level: cascLevel,
      flow: cascFlow,
      flowSetpoint: cascFlowSp,
      valveOutput: cascValve,
      metrics: computeDetailed(cascLevel),
    },
    singleLoop: {
      level: singleLevel,
      flow: singleFlow,
      valveOutput: singleValve,
      metrics: computeDetailed(singleLevel),
    },
    disturbance: {
      supplyFactor: distSupply,
      demandSurge: distDemand,
    },
  };
}

// --- Process Simulations (Phase 2) ---

/**
 * First-order process (generic step response)
 */
export function simulateFirstOrder(
  gain: number,
  timeConstant: number,
  stepSize = 1,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 300;
  let y = 0;
  const data: number[] = [];
  for (let i = 0; i < steps; i++) {
    const dydt = (gain * stepSize - y) / timeConstant;
    y += dydt * dt;
    data.push(y);
  }
  return data;
}

/**
 * Second-order process (damping ratio + natural frequency)
 * zeta < 1: underdamped (oscillates). zeta = 1: critically damped. zeta > 1: overdamped.
 */
export function simulateSecondOrder(
  zeta: number,
  wn: number,
  stepSize = 1,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.05;
  const steps = opts.steps ?? 400;
  let y = 0;
  let v = 0;
  const data: number[] = [];
  for (let i = 0; i < steps; i++) {
    const a = wn * wn * (stepSize - y) - 2 * zeta * wn * v;
    v += a * dt;
    y += v * dt;
    data.push(y);
  }
  return data;
}

/**
 * Temperature control (heater + ambient loss)
 * Heater cannot cool — only add heat (heaterPower >= 0).
 */
export function simulateTemperature(
  Kp: number,
  Ki: number,
  Kd: number,
  setpoint: number,
  ambientTemp = 25,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 800;
  const thermalMass = opts.thermalMass ?? 50;
  const lossCoeff = opts.lossCoeff ?? 0.05;
  let temp = ambientTemp;
  let integral = 0;
  let prevErr = 0;
  const data: number[] = [];
  for (let i = 0; i < steps; i++) {
    const err = setpoint - temp;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let heaterPower = Math.max(0, Math.min(100, Kp * err + Ki * integral + Kd * deriv));
    const heatIn = heaterPower * 0.3;
    const heatLoss = (temp - ambientTemp) * lossCoeff;
    temp += ((heatIn - heatLoss) * dt) / thermalMass;
    prevErr = err;
    data.push(temp);
  }
  return data;
}

/**
 * DC motor speed control (simplified first-order electrical + mechanical)
 */
export function simulateMotorSpeed(
  Kp: number,
  Ki: number,
  targetSpeed: number,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.01;
  const steps = opts.steps ?? 500;
  const inertia = opts.inertia ?? 0.02;
  const friction = opts.friction ?? 0.1;
  let speed = 0;
  let integral = 0;
  const data: number[] = [];
  for (let i = 0; i < steps; i++) {
    const err = targetSpeed - speed;
    integral += err * dt;
    const torque = Kp * err + Ki * integral;
    const accel = (torque - friction * speed) / inertia;
    speed += accel * dt;
    data.push(speed);
  }
  return data;
}

/**
 * Standalone tank level simulation without PID feedback
 */
export function simulateTankStandalone(
  inletFlow: number,
  outflowBase = 0.6,
  valveGain = 0.02,
  opts: SimOpts = {}
): number[] {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 600;
  let level = opts.initialLevel ?? 20;
  const data: number[] = [];

  for (let i = 0; i < steps; i++) {
    const inflow = inletFlow * valveGain;
    const outflow = outflowBase * (level / 100);
    level += (inflow - outflow) * dt * 2;
    level = Math.max(0, Math.min(100, level));
    data.push(level);
  }
  return data;
}

// --- Calculator Formulas ---

/**
 * Converts a 4-20mA transmitter signal to an engineering process value.
 */
export function currentToProcessValue(I: number, LRV: number, URV: number): number {
  const fraction = (I - 4) / 16;
  const span = URV - LRV;
  return LRV + fraction * span;
}

/**
 * Percentage error / accuracy
 */
export function percentError(measured: number, actual: number): number | null {
  if (actual === 0) return null;
  return ((measured - actual) / actual) * 100;
}

/**
 * Range and span calculation
 */
export function rangeAndSpan(LRV: number, URV: number): { span: number; midpoint: number } {
  return { span: URV - LRV, midpoint: (URV + LRV) / 2 };
}

/**
 * Thermocouple (Type K approx., linear segment 0-500°C, µV/°C ~ 41)
 */
export function thermocoupleTypeK_mV(tempC: number): string {
  return (tempC * 0.041).toFixed(3);
}

/**
 * RTD (Pt100, alpha = 0.00385 /°C)
 */
export function rtdResistance(tempC: number, R0 = 100, alpha = 0.00385): number {
  return R0 * (1 + alpha * tempC);
}

/**
 * Orifice plate flow (simplified, incompressible)
 */
export function orificeFlow(Cd: number, area: number, dP: number, density: number): number {
  if (density <= 0 || dP < 0) return 0;
  return Cd * area * Math.sqrt((2 * dP) / density);
}

/**
 * Ziegler-Nichols PID tuning from ultimate gain/period
 */
export function zieglerNichols(Ku: number, Tu: number): { Kp: number; Ki: number; Kd: number } {
  return {
    Kp: 0.6 * Ku,
    Ki: (1.2 * Ku) / Tu,
    Kd: 0.075 * Ku * Tu,
  };
}

/**
 * Dashboard disturbance model
 */
export function applyDisturbance(level: number, type: string): number | null | undefined {
  switch (type) {
    case "noise":
      return level + (Math.random() - 0.5) * 3;
    case "outlet-spike":
      return level - 15;
    case "valve-stiction":
      return level;
    case "transmitter-fail":
      return null;
    case "comms-loss":
      return undefined;
    default:
      return level;
  }
}
