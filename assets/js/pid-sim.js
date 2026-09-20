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

// Export for Node/testing if applicable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulateTankPID, computeMetrics, drawPIDCanvas };
}
