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
