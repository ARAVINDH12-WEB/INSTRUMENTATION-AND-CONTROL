/**
 * ControlForge PID Simulation Engine
 * Derived strictly from controlforge-pid-simulation skill
 */

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

/**
 * Computes rise time, overshoot, and settling time.
 * @param {number[]} data - level array
 * @param {number} setpoint - target level
 * @returns {{ overshootPct: number, riseTimeSec: number|null, settlingTimeSec: number }}
 */
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

/**
 * Draws the PID response graph directly on a high-DPI <canvas>.
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} data - time-series level data
 * @param {number} setpoint - target setpoint
 * @param {object} metrics - computed performance metrics
 */
function drawPIDCanvas(canvas, data, setpoint, metrics) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Handle high-DPI scaling
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#18150F'; // --panel-2 recessed
  ctx.fillRect(0, 0, width, height);

  // Margins
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Coordinate mappers (x: 0..600 steps, y: 0..100 level)
  const steps = data.length;
  const toX = (idx) => padL + (idx / (steps - 1)) * plotW;
  const toY = (val) => padT + plotH - (val / 100) * plotH;

  // Grid Lines & Axis Ticks
  ctx.strokeStyle = '#221E17'; // --line-soft
  ctx.lineWidth = 1;
  ctx.fillStyle = '#6B6255';  // --text-faint
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Y-axis ticks (0%, 25%, 50%, 75%, 100%)
  for (let lvl = 0; lvl <= 100; lvl += 25) {
    const y = toY(lvl);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.fillText(`${lvl}%`, padL - 8, y);
  }

  // X-axis ticks (0s, 15s, 30s, 45s, 60s)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let sec = 0; sec <= 60; sec += 15) {
    const idx = (sec / 60) * (steps - 1);
    const x = toX(idx);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
    ctx.fillText(`${sec}s`, x, padT + plotH + 8);
  }

  // +/- 5% Settling Band behind curve
  const yUpper = toY(Math.min(100, setpoint * 1.05));
  const yLower = toY(Math.max(0, setpoint * 0.95));
  ctx.fillStyle = 'rgba(255, 176, 0, 0.04)';
  ctx.fillRect(padL, yUpper, plotW, yLower - yUpper);

  // Setpoint line (dashed phosphor amber)
  const ySp = toY(setpoint);
  ctx.strokeStyle = '#FFB000';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, ySp);
  ctx.lineTo(padL + plotW, ySp);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Setpoint label
  ctx.fillStyle = '#FFB000';
  ctx.font = '11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`SP: ${setpoint}%`, padL + plotW, ySp - 12);

  // Curve Color determined by tuning quality thresholds
  let curveColor = '#FFB000'; // neutral amber
  if (metrics.overshootPct > 15) {
    curveColor = '#D64550'; // crimson (poor tuning)
  } else if (metrics.overshootPct < 3 && metrics.settlingTimeSec < 45) {
    curveColor = '#4FA98A'; // verdigris (good tuning)
  }

  // Plot Response Curve
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((val, idx) => {
    const x = toX(idx);
    const y = toY(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Subtle Glow effect for signal line
  ctx.strokeStyle = curveColor === '#D64550' 
    ? 'rgba(214, 69, 80, 0.3)' 
    : (curveColor === '#4FA98A' ? 'rgba(79, 169, 138, 0.3)' : 'rgba(255, 176, 0, 0.25)');
  ctx.lineWidth = 5;
  ctx.stroke();

  // Highlight Current Final Value Point
  const lastVal = data[data.length - 1];
  const lastX = toX(steps - 1);
  const lastY = toY(lastVal);
  ctx.fillStyle = curveColor;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * First-order process (generic step response)
 * y(t) with gain K and time constant tau
 */
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

/**
 * Second-order process (damping ratio zeta + natural frequency wn)
 * zeta < 1: underdamped (oscillates). zeta = 1: critically damped. zeta > 1: overdamped.
 */
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

/**
 * Temperature control (heater + ambient loss)
 * Asymmetric cooling: heater can only add heat (heaterPower >= 0).
 */
function simulateTemperature(Kp, Ki, Kd, setpoint, ambientTemp = 25, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const thermalMass = opts.thermalMass ?? 50, lossCoeff = opts.lossCoeff ?? 0.05;
  let temp = ambientTemp, integral = 0, prevErr = 0; const data = [];
  for (let i = 0; i < steps; i++) {
    const err = setpoint - temp;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let heaterPower = Math.max(0, Math.min(100, Kp * err + Ki * integral + Kd * deriv));
    const heatIn = heaterPower * 0.3;
    const heatLoss = (temp - ambientTemp) * lossCoeff;
    temp += (heatIn - heatLoss) * dt / thermalMass;
    prevErr = err;
    data.push(temp);
  }
  return data;
}

/**
 * DC motor speed control (simplified first-order electrical + mechanical)
 */
function simulateMotorSpeed(Kp, Ki, targetSpeed, opts = {}) {
  const dt = opts.dt ?? 0.01, steps = opts.steps ?? 500;
  const inertia = opts.inertia ?? 0.02, friction = opts.friction ?? 0.1;
  let speed = 0, integral = 0; const data = [];
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
 * Standalone tank-level process without PID (manual valve/inflow control)
 * @param {number} inletFlow - 0 to 100%
 * @param {number} outflowBase - gravity drainage coefficient
 * @param {number} valveGain - inlet valve multiplier
 */
function simulateTankStandalone(inletFlow, outflowBase = 0.6, valveGain = 0.02, opts = {}) {
  const dt = opts.dt ?? 0.1;
  const steps = opts.steps ?? 600;
  let level = opts.initialLevel ?? 20;
  const data = [];

  for (let i = 0; i < steps; i++) {
    const inflow = inletFlow * valveGain;
    const outflow = outflowBase * (level / 100);
    level += (inflow - outflow) * dt * 2;
    level = Math.max(0, Math.min(100, level));
    data.push(level);
  }
  return data;
}

/**
 * Generic high-DPI canvas curve drawer for general process dynamics
 */
function drawProcessCanvas(canvas, data, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#18150F';
  ctx.fillRect(0, 0, width, height);

  const padL = opts.padL ?? 56;
  const padR = opts.padR ?? 24;
  const padT = opts.padT ?? 24;
  const padB = opts.padB ?? 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const steps = data.length;
  const minY = opts.minY ?? Math.min(0, ...data);
  const maxY = opts.maxY ?? Math.max(1, ...data);
  const rangeY = (maxY - minY) || 1;

  const toX = (idx) => padL + (idx / Math.max(1, steps - 1)) * plotW;
  const toY = (val) => padT + plotH - ((val - minY) / rangeY) * plotH;

  // Grid
  ctx.strokeStyle = '#221E17';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#6B6255';
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // 5 horizontal ticks
  for (let i = 0; i <= 4; i++) {
    const frac = i / 4;
    const val = minY + frac * rangeY;
    const y = toY(val);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    const label = val.toFixed(val >= 10 ? 0 : 1) + (opts.unit ? ` ${opts.unit}` : '');
    ctx.fillText(label, padL - 8, y);
  }

  // Time ticks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const totalTime = opts.totalTime ?? ((steps - 1) * (opts.dt ?? 0.1));
  for (let i = 0; i <= 4; i++) {
    const frac = i / 4;
    const x = padL + frac * plotW;
    const sec = (frac * totalTime).toFixed(totalTime > 10 ? 0 : 1);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
    ctx.fillText(`${sec}s`, x, padT + plotH + 8);
  }

  // Optional Setpoint / Target Line
  if (opts.setpoint !== undefined && opts.setpoint !== null) {
    const ySp = toY(opts.setpoint);
    ctx.strokeStyle = '#FFB000';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, ySp);
    ctx.lineTo(padL + plotW, ySp);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#FFB000';
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`TARGET: ${opts.setpoint}${opts.unit ?? ''}`, padL + plotW, ySp - 12);
  }

  // Curve
  const color = opts.color || '#FFB000';
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

  // Glow
  ctx.strokeStyle = opts.glowColor || 'rgba(255, 176, 0, 0.25)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Final Point
  if (steps > 0) {
    const lastVal = data[steps - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toX(steps - 1), toY(lastVal), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Simulates a two-tank interacting system in series.
 */
function simulateMultiTank(Kp, Ki, Kd, setpoint, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const area1 = opts.area1 ?? 1.0, area2 = opts.area2 ?? 1.0;
  const R1 = opts.R1 ?? 1.5;
  const R2 = opts.R2 ?? 1.5;
  const valveGain = opts.valveGain ?? 0.02;

  let h1 = opts.initialLevel1 ?? 20, h2 = opts.initialLevel2 ?? 20;
  let integral = 0, prevErr = 0;
  const data = [];

  const scaleHead = (h1 > 3 && R1 < 10) ? 100 : 1;

  for (let i = 0; i < steps; i++) {
    const err = setpoint - h2;
    integral += err * dt;
    const deriv = (err - prevErr) / dt;
    let out = Math.max(0, Math.min(100, Kp * err + Ki * integral + Kd * deriv));
    const inflow1 = out * valveGain;

    const outflow1 = (h1 / scaleHead) / R1;
    const inflow2 = outflow1;
    const outflow2 = (h2 / scaleHead) / R2;

    h1 = Math.max(0, h1 + ((inflow1 - outflow1) / area1) * dt * (scaleHead > 1 ? 2 : 1));
    h2 = Math.max(0, h2 + ((inflow2 - outflow2) / area2) * dt * (scaleHead > 1 ? 2 : 1));

    prevErr = err;
    data.push({ h1, h2 });
  }
  return data;
}

/**
 * Simulates a counter-current heat exchanger with transport delay.
 */
function simulateHeatExchanger(Kp, Ki, Kd, setpoint, opts = {}) {
  const dt = opts.dt ?? 0.1, steps = opts.steps ?? 800;
  const thermalMass = opts.thermalMass ?? 12;
  const uaCoeff = opts.uaCoeff ?? 1.0;
  const coldInletTemp = opts.coldInletTemp ?? 20;
  const hotSourceTemp = opts.hotSourceTemp ?? 95;
  const coldFlowRate = opts.coldFlowRate ?? 0.5;
  const deadTimeSteps = Math.round((opts.deadTimeSeconds ?? 3.0) / dt);
  const initialFlow = opts.initialFlow ?? 0;

  let outletTemp = opts.initialTemp ?? coldInletTemp, integral = 0, prevErr = 0;
  const outputHistory = [];
  const data = [];

  for (let i = 0; i < steps; i++) {
    const err = setpoint - outletTemp;
    integral += err * dt;
    integral = Math.max(-100 / (Ki || 1), Math.min(100 / (Ki || 1), integral));
    const deriv = (err - prevErr) / dt;
    let hotFlowPct = Math.max(0, Math.min(100, Kp * err + Ki * integral + Kd * deriv));

    outputHistory.push(hotFlowPct);
    const delayedFlow = i < deadTimeSteps ? initialFlow : outputHistory[i - deadTimeSteps];

    const heatInput = (delayedFlow / 100) * uaCoeff * (hotSourceTemp - outletTemp);
    const heatLoss = coldFlowRate * (outletTemp - coldInletTemp);

    outletTemp += ((heatInput - heatLoss) / thermalMass) * dt;

    prevErr = err;
    data.push(outletTemp);
  }
  return data;
}

// Export for Node/testing if applicable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simulateTankPID,
    computeMetrics,
    drawPIDCanvas,
    simulateFirstOrder,
    simulateSecondOrder,
    simulateTemperature,
    simulateMotorSpeed,
    simulateTankStandalone,
    drawProcessCanvas,
    simulateMultiTank,
    simulateHeatExchanger
  };
}
