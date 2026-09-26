---
name: controlforge-pid-simulation
description: Provides the correct PID controller and tank-level process simulation math, plus core instrumentation formulas (4-20mA scaling, error/accuracy, range/span), for ControlForge. Use whenever building or editing the PID Lab, any simulator, the control-system dashboard, or any engineering calculator, to avoid re-deriving or subtly breaking the control-loop math.
---

# ControlForge PID & Instrumentation Math

This skill is the single source of truth for the control-loop and instrumentation formulas used across ControlForge (PID Lab, simulators, dashboard, calculators). Reuse this exact math rather than re-deriving it per page, so results stay consistent everywhere it appears.

## Discrete PID controller + first-order tank simulation

This is the core loop used in the Home hero animation, the PID Lab, and the tank-level case study. Keep it a **pure, dependency-free function** so it can run identically in vanilla JS, a React component, or a Python backend port.

```javascript
/**
 * Simulates a PID-controlled tank-level process.
 * @param {number} Kp - proportional gain
 * @param {number} Ki - integral gain
 * @param {number} Kd - derivative gain
 * @param {number} setpoint - target level, 0-100 (%)
 * @param {object} [opts] - optional overrides
 * @returns {number[]} level at each timestep
 */
function simulateTankPID(Kp, Ki, Kd, setpoint, opts = {}) {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 600;
  const outflowBase = opts.outflowBase ?? 0.6;
  const valveGain = opts.valveGain ?? 0.02;
  const noiseAmplitude = opts.noiseAmplitude ?? 0; // set >0 to enable sensor noise

  let level = opts.initialLevel ?? 20;
  let integral = 0;
  let prevErr = 0;
  const data = [];

  for (let i = 0; i < steps; i++) {
    const measuredLevel = noiseAmplitude > 0
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
```

**Do not change** the clamp ranges (0-100), the `dt * 2` scaling factor, or the order of operations without re-validating against the "well-tuned" preset (Kp=2.1, Ki=0.35, Kd=0.1), which should settle near setpoint with minimal overshoot. If a change causes that preset to oscillate or fail to settle, the change is wrong, not the preset.

## Performance metrics (rise time, overshoot, settling time)

```javascript
function computeMetrics(data, setpoint) {
  const max = Math.max(...data);
  const overshootPct = Math.max(0, ((max - setpoint) / setpoint) * 100);

  const riseIdx = data.findIndex(v => v >= setpoint * 0.9);
  const riseTimeSec = riseIdx >= 0 ? riseIdx * 0.1 : null; // null = never reached 90%

  let settleIdx = data.length - 1;
  for (let i = data.length - 1; i > 0; i--) {
    if (Math.abs(data[i] - setpoint) > setpoint * 0.05) { settleIdx = i; break; }
  }
  const settlingTimeSec = settleIdx * 0.1;

  return { overshootPct, riseTimeSec, settlingTimeSec };
}
```

**Tuning-quality thresholds** (used for UI feedback, e.g. coloring a metric crimson/verdigris):
- `overshootPct > 15` → poor tuning (flag crimson)
- `overshootPct < 3` → good tuning (flag verdigris)
- Anything between → neutral/default color

## 4–20 mA signal conversion

```javascript
/**
 * Converts a 4-20mA transmitter signal to an engineering process value.
 * @param {number} I - measured current, mA (valid range 4-20)
 * @param {number} LRV - lower range value
 * @param {number} URV - upper range value
 * @returns {number} process value in the transmitter's engineering units
 */
function currentToProcessValue(I, LRV, URV) {
  const fraction = (I - 4) / 16;
  const span = URV - LRV;
  return LRV + fraction * span;
}
```

Always show the three intermediate steps in the UI when this formula is used in a calculator (this is a documented product requirement, not optional):
1. `fraction = (I - 4) / 16`
2. `span = URV - LRV`
3. `PV = LRV + fraction * span`

Reference check: `currentToProcessValue(12, 0, 10)` must equal exactly `5`.

## Percentage error / accuracy

```javascript
function percentError(measured, actual) {
  if (actual === 0) return null; // guard: undefined for a true-zero reference
  return ((measured - actual) / actual) * 100;
}
```

## Range and span

```javascript
function rangeAndSpan(LRV, URV) {
  return { span: URV - LRV, midpoint: (URV + LRV) / 2 };
}
```

## Edge cases every calculator must guard against

- Division by zero when `URV === LRV` (span = 0) — show a validation message, do not silently output `Infinity` or `NaN`.
- Current input outside 4–20 mA — either clamp with a visible warning, or explicitly allow it and label the result as "outside normal operating range" rather than extrapolating silently.
- `actual === 0` in percent-error calculations — return `null`/undefined behavior explicitly, never divide by zero silently.
- Negative or non-numeric slider/input values — clamp sliders at the HTML level (`min`/`max`) but also validate on the JS side for any calculator taking free-text numeric input.

## When porting this to a Python/FastAPI backend

Keep the same clamp order and constants (`dt`, `valveGain`, `outflowBase`) so results match the client-side JS version exactly — the site's credibility depends on the Home animation, PID Lab, and any backend-simulated case study all agreeing numerically for the same inputs.

## Additional process simulations (Phase 2)

### First-order process (generic step response)
```javascript
function simulateFirstOrder(gain, timeConstant, stepSize = 1, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 300;
  let y = 0; const data = [];
  for (let i = 0; i < steps; i++) {
    const dydt = (gain * stepSize - y) / timeConstant;
    y += dydt * dt;
    data.push(y);
  }
  return data;
}
```

### Second-order process (damping ratio + natural frequency)
```javascript
function simulateSecondOrder(zeta, wn, stepSize = 1, opts = {}) {
  const dt = opts.dt ?? 0.05, steps = opts.steps ?? 400;
  let y = 0, v = 0; const data = [];
  for (let i = 0; i < steps; i++) {
    const a = wn * wn * (stepSize - y) - 2 * zeta * wn * v;
    v += a * dt;
    y += v * dt;
    data.push(y);
  }
  return data;
}
// zeta < 1: underdamped (oscillates). zeta = 1: critically damped. zeta > 1: overdamped.
```

### Temperature control (heater + ambient loss)
```javascript
function simulateTemperature(Kp, Ki, Kd, setpoint, ambientTemp = 25, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const thermalMass = opts.thermalMass ?? 50, lossCoeff = opts.lossCoeff ?? 0.05;
  let temp = ambientTemp, integral = 0, prevErr = 0; const data = [];
  for (let i = 0; i < steps; i++) {
    const err = setpoint - temp;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let heaterPower = Math.max(0, Math.min(100, Kp*err + Ki*integral + Kd*deriv));
    const heatIn = heaterPower * 0.3;
    const heatLoss = (temp - ambientTemp) * lossCoeff;
    temp += (heatIn - heatLoss) * dt / thermalMass;
    prevErr = err; data.push(temp);
  }
  return data;
}
// Heater cannot cool — only add heat (heaterPower >= 0). This asymmetry is intentional
// and must be preserved: it makes overshoot recovery slower than in the tank model,
// which is physically correct and a good teaching point on the page.
```

### DC motor speed control (simplified first-order electrical + mechanical)
```javascript
function simulateMotorSpeed(Kp, Ki, targetSpeed, opts = {}) {
  const dt = opts.dt ?? 0.01, steps = opts.steps ?? 500;
  const inertia = opts.inertia ?? 0.02, friction = opts.friction ?? 0.1;
  let speed = 0, integral = 0; const data = [];
  for (let i = 0; i < steps; i++) {
    const err = targetSpeed - speed;
    integral += err * dt;
    const torque = Kp*err + Ki*integral;
    const accel = (torque - friction*speed) / inertia;
    speed += accel * dt;
    data.push(speed);
  }
  return data;
}
```

## Additional calculator formulas (Phase 2)

```javascript
// Thermocouple (Type K approx., linear segment 0-500°C, µV/°C ~ 41)
function thermocoupleTypeK_mV(tempC) { return (tempC * 0.041).toFixed(3); } // simplified linear approx — label as "approximate" in UI, real curves are non-linear

// RTD (Pt100, alpha = 0.00385 /°C)
function rtdResistance(tempC, R0 = 100, alpha = 0.00385) { return R0 * (1 + alpha * tempC); }

// Orifice plate flow (simplified, incompressible)
function orificeFlow(Cd, area, dP, density) {
  return Cd * area * Math.sqrt((2 * dP) / density);
}

// Ziegler-Nichols PID tuning from ultimate gain/period
function zieglerNichols(Ku, Tu) {
  return { Kp: 0.6*Ku, Ki: 1.2*Ku/Tu, Kd: 0.075*Ku*Tu };
}
```

## Dashboard disturbance model

```javascript
function applyDisturbance(level, type) {
  switch(type) {
    case 'noise': return level + (Math.random()-0.5)*3;
    case 'outlet-spike': return level - 15; // sudden demand increase
    case 'valve-stiction': return level; // valve output frozen — handle by NOT updating valve output for N steps upstream, not here
    case 'transmitter-fail': return null; // signals UI to show "BAD" quality flag, freeze last good reading
    case 'comms-loss': return undefined; // signals UI to show stale/greyed-out readout, no new data
    default: return level;
  }
}
```

## Modular Cascade & Feedforward Control Architecture (Milestone Slice)

This modular architecture separates the process state, inner fast flow loop, outer slow level loop, and feedforward blocks into pure, reusable functions:

```javascript
// Process state: tank level under q_in / q_out
function applyTankProcess(level, qIn, qOut, area, dt) {
  const dh = (qIn - qOut) / area;
  return Math.max(0, Math.min(100, level + dh * dt));
}

// Inner loop: fast flow control, runs every simulation step
function simulateInnerFlowLoop(flowSetpoint, currentFlow, pidState, Kp, Ki, Kd, dt) {
  const err = flowSetpoint - currentFlow;
  pidState.integral += err * dt;
  const deriv = (err - pidState.prevErr) / dt;
  let valveCommand = Kp*err + Ki*pidState.integral + Kd*deriv;
  pidState.prevErr = err;
  return { valveCommand, pidState };
}

// Outer loop: slow level control, runs every N inner-loop steps
// outerStepsPerInnerStep is the EXPLICIT time-scale separation parameter
// (default 5, matching standard cascade-control guidance of 3-5x+ 
// separation — make this a UI-adjustable input, not a hidden constant)
function simulateOuterLevelLoop(levelSetpoint, currentLevel, pidState, Kp, Ki, Kd, dt) {
  const err = levelSetpoint - currentLevel;
  pidState.integral += err * dt;
  const deriv = (err - pidState.prevErr) / dt;
  let flowSetpoint = Kp*err + Ki*pidState.integral + Kd*deriv;
  pidState.prevErr = err;
  return { flowSetpoint, pidState };
}

// Feedforward: measured outlet flow feeds forward to inlet flow setpoint.
// NOTE: this is a simplified 1:1 pass-through (q_in,ff ≈ q_out) that 
// assumes instantaneous, perfect compensation with no transport delay or 
// process dynamics between the feedforward action and its effect on 
// level. This is a KNOWN LIMITATION, not a bug — document it visibly in 
// the UI (a labeled caveat near the feedforward gain slider), not just 
// in a code comment.
function calculateFeedforward(measuredOutlet, feedforwardGain) {
  return measuredOutlet * feedforwardGain;
}

function applyValveLimits(command, minPct = 0, maxPct = 100) {
  return Math.max(minPct, Math.min(maxPct, command));
}

function applySensorNoise(value, noiseAmplitude) {
  return noiseAmplitude > 0 ? value + (Math.random()-0.5)*2*noiseAmplitude : value;
}

// Metrics: report IAE, ISE, AND ITAE together, not IAE alone — IAE 
// weights all error equally, ISE penalizes large transient deviations 
// more heavily, ITAE penalizes long-duration error more heavily. Having 
// only one metric risks architectures looking artificially similar; 
// report all three so differences actually show up.
function calculateMetrics(errorSeries, dt) {
  let iae = 0, ise = 0, itae = 0;
  errorSeries.forEach((e, i) => {
    const t = i * dt;
    iae += Math.abs(e) * dt;
    ise += e*e * dt;
    itae += t * Math.abs(e) * dt;
  });
  return { iae, ise, itae };
}

function simulateCascadeTank(config) {
  // orchestrates the above: runs inner loop every step, outer loop every
  // outerStepsPerInnerStep steps, applies valve limits and sensor noise,
  // applies a step disturbance to qOut at config.disturbanceStartTime,
  // returns full time-series (level, setpoint, qIn, qOut, valveCommand,
  // innerError, outerError) plus final calculateMetrics() output
}
```

## Multi-tank interacting system (two tanks in series, gravity-coupled)

Two tanks where Tank 1's outflow feeds Tank 2's inflow, and a controller 
regulates Tank 2's level by adjusting the inlet valve to Tank 1. This is 
a genuinely higher-order system (2nd order overall) compared to every 
single-tank simulator built so far.

```javascript
function simulateMultiTank(Kp, Ki, Kd, setpoint, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const area1 = opts.area1 ?? 1.0, area2 = opts.area2 ?? 1.0;
  const R1 = opts.R1 ?? 1.5; // outflow resistance tank1 -> tank2
  const R2 = opts.R2 ?? 1.5; // outflow resistance tank2 -> drain
  const valveGain = opts.valveGain ?? 0.02;

  let h1 = opts.initialLevel1 ?? 20, h2 = opts.initialLevel2 ?? 20;
  let integral = 0, prevErr = 0;
  const data = []; // { h1, h2 } per step, chart plots h2 (the controlled variable)

  for (let i = 0; i < steps; i++) {
    const err = setpoint - h2;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let out = Math.max(0, Math.min(100, Kp*err + Ki*integral + Kd*deriv));
    const inflow1 = out * valveGain;

    const outflow1 = h1 / R1; // gravity-driven, proportional to head
    const inflow2 = outflow1; // tank1's outflow IS tank2's inflow -- the coupling
    const outflow2 = h2 / R2;

    h1 = Math.max(0, h1 + ((inflow1 - outflow1) / area1) * dt);
    h2 = Math.max(0, h2 + ((inflow2 - outflow2) / area2) * dt);

    prevErr = err;
    data.push({ h1, h2 });
  }
  return data;
}
// Teaching point: the controller only measures/acts on h2, but must 
// contend with Tank 1's dynamics as an unmeasured intermediate lag -- 
// this is why interacting tank systems are slower to control and more 
// prone to overshoot than an equivalent single tank at the same gains.
```

## Heat exchanger (counter-current, with transport delay)

Models a shell-and-tube heat exchanger where a controller adjusts hot-
fluid flow to regulate outlet temperature of the cold stream. Introduces 
explicit transport delay (dead time) -- not present in any simulator 
built so far -- which is a distinct and important control challenge 
(a delayed measurement makes any feedback loop harder to tune stably).

```javascript
function simulateHeatExchanger(Kp, Ki, Kd, setpoint, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const thermalMass = opts.thermalMass ?? 40;
  const uaCoeff = opts.uaCoeff ?? 0.8; // overall heat transfer coefficient
  const coldInletTemp = opts.coldInletTemp ?? 20;
  const hotSourceTemp = opts.hotSourceTemp ?? 95;
  const deadTimeSteps = Math.round((opts.deadTimeSeconds ?? 3.0) / dt);

  let outletTemp = coldInletTemp, integral = 0, prevErr = 0;
  const outputHistory = []; // for dead-time delay buffer
  const data = [];

  for (let i = 0; i < steps; i++) {
    const err = setpoint - outletTemp;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let hotFlowPct = Math.max(0, Math.min(100, Kp*err + Ki*integral + Kd*deriv));

    outputHistory.push(hotFlowPct);
    // apply dead time: the flow change from `deadTimeSteps` ago is what 
    // actually affects the exchanger right now
    const delayedFlow = outputHistory[Math.max(0, i - deadTimeSteps)];

    const heatInput = (delayedFlow / 100) * uaCoeff * (hotSourceTemp - outletTemp);
    outletTemp += (heatInput / thermalMass) * dt;

    prevErr = err;
    data.push(outletTemp);
  }
  return data;
}
// Teaching point: with dead time present, aggressive Kp/Ki that would be 
// stable on an instantaneous process (like the plain tank model) will 
// oscillate or become unstable here -- this simulator is the right place 
// to demonstrate why dead time forces more conservative tuning.
```

