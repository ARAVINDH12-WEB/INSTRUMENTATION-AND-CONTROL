/**
 * ControlForge Mathematical Correctness Regression Gate
 * Strict pass/fail assertion suite locking in reference equations,
 * critical tuning presets, and historical bug fixes.
 */

import {
  currentToProcessValue,
  percentError,
  rangeAndSpan,
  simulateTankPID,
  computeMetrics,
  simulateSingleLoopTank,
  simulateCascadeTank,
  calculateMetrics,
} from "../lib/pid-math";

console.log("===============================================================================");
console.log("CONTROLFORGE MATHEMATICAL REGRESSION GATE");
console.log("===============================================================================\n");

let failures = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (!condition) {
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    failures++;
  } else {
    console.log(`[PASS] ${testName}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Core Metrology & Signal Scaling Formulas
// -----------------------------------------------------------------------------
console.log("--- 1. METROLOGY & SIGNAL SCALING ---");

// Reference check from controlforge-pid-simulation skill:
// currentToProcessValue(12, 0, 10) MUST equal exactly 5.
const pvMid = currentToProcessValue(12, 0, 10);
assert(pvMid === 5, "currentToProcessValue(12, 0, 10) === 5 (exact midpoint)", `Got ${pvMid}`);

const pvZero = currentToProcessValue(4, 0, 100);
assert(pvZero === 0, "currentToProcessValue(4, 0, 100) === 0 (LRV)", `Got ${pvZero}`);

const pvFull = currentToProcessValue(20, 0, 100);
assert(pvFull === 100, "currentToProcessValue(20, 0, 100) === 100 (URV)", `Got ${pvFull}`);

const pErr = percentError(102, 100);
assert(pErr === 2, "percentError(102, 100) === 2.0%", `Got ${pErr}`);

const zeroDivGuard = percentError(10, 0);
assert(zeroDivGuard === null, "percentError with actual === 0 returns null guard", `Got ${zeroDivGuard}`);

const rs = rangeAndSpan(0, 100);
assert(rs.span === 100 && rs.midpoint === 50, "rangeAndSpan(0, 100) === { span: 100, midpoint: 50 }");

// -----------------------------------------------------------------------------
// 2. Discrete PID Controller & Tank-Level Well-Tuned Preset
// -----------------------------------------------------------------------------
console.log("\n--- 2. TANK-LEVEL PID WELL-TUNED PRESET ---");

// Well-tuned preset per skill and Case 1 benchmark: Kp=2.1, Ki=0.35, Kd=0.1, setpoint=50%
const wellTunedSim = simulateTankPID(2.1, 0.35, 0.1, 50, { steps: 600, dt: 0.1 });
const wellTunedMetrics = computeMetrics(wellTunedSim, 50);

const finalLevel = wellTunedSim[wellTunedSim.length - 1];
assert(
  Math.abs(finalLevel - 50) <= 2.5,
  "Well-tuned PID settles within 5% tolerance band of setpoint 50%",
  `Final level = ${finalLevel.toFixed(2)}%`
);

assert(
  wellTunedMetrics.riseTimeSec !== null && Math.abs(wellTunedMetrics.riseTimeSec - 9.7) < 0.5,
  "Well-tuned PID rise time matches reference (9.7s)",
  `Rise time = ${wellTunedMetrics.riseTimeSec}s`
);

assert(
  Math.abs(wellTunedMetrics.settlingTimeSec - 36.6) < 0.5,
  "Well-tuned PID settling time matches reference (36.6s)",
  `Settling time = ${wellTunedMetrics.settlingTimeSec}s`
);

// -----------------------------------------------------------------------------
// 3. Settling Time Bug Regression (Runs That Never Exit Tolerance Band)
// -----------------------------------------------------------------------------
console.log("\n--- 3. SETTLING-TIME TOLERANCE BAND BUG REGRESSION ---");

// When level never departs the +-5% band (e.g., initial level = setpoint, deviation < 2.5%),
// computeMetrics must return 0.0s, NOT the full simulation length (59.9s).
const flatSim = new Array(600).fill(50.0);
const flatMetrics = computeMetrics(flatSim, 50.0);
assert(
  flatMetrics.settlingTimeSec === 0,
  "Flat simulation (never leaves 5% band) returns settlingTimeSec = 0s",
  `Got ${flatMetrics.settlingTimeSec}s`
);

// Small perturbation staying inside 5% tolerance (e.g. max dev = 1.0% < 2.5%)
const smallPerturbSim = flatSim.map((v, i) => (i >= 200 ? v - 0.8 : v));
const smallPerturbMetrics = computeMetrics(smallPerturbSim, 50.0);
assert(
  smallPerturbMetrics.settlingTimeSec === 0,
  "Small disturbance (< 2.5% deviation) never exits band, returns settlingTimeSec = 0s",
  `Got ${smallPerturbMetrics.settlingTimeSec}s`
);

// -----------------------------------------------------------------------------
// 4. Confirmed-Fair Baseline Single-Loop Tank Tuning
// -----------------------------------------------------------------------------
console.log("\n--- 4. CONFIRMED-FAIR SINGLE-LOOP BASELINE INVARIANTS ---");

const baselineSingle = simulateSingleLoopTank({
  levelSetpoint: 50,
  initialLevel: 50,
  outerKp: 1.8,
  outerKi: 0.25,
  outerKd: 0.4,
  outerStepsPerInnerStep: 5,
  disturbanceMagnitude: 15,
  disturbanceStartTime: 20,
  dt: 0.1,
  steps: 600,
});

const maxDevSingle = Math.max(...baselineSingle.level.map((l) => Math.abs(l - 50)));
assert(
  maxDevSingle >= 7.5 && maxDevSingle <= 8.0,
  "Single-loop baseline max level deviation in range [7.5%, 8.0%] (nominal 7.78%)",
  `Got ${maxDevSingle.toFixed(2)}%`
);

assert(
  baselineSingle.metrics.settlingTimeSec >= 28.0 && baselineSingle.metrics.settlingTimeSec <= 31.0,
  "Single-loop baseline settling time in range [28.0s, 31.0s] (nominal 29.4s)",
  `Got ${baselineSingle.metrics.settlingTimeSec}s`
);

// -----------------------------------------------------------------------------
// 5. Cascade & Feedforward Rejection Invariants
// -----------------------------------------------------------------------------
console.log("\n--- 5. CASCADE & FEEDFORWARD DISTURBANCE REJECTION INVARIANTS ---");

const nomCascade = simulateCascadeTank({
  architecture: "cascade",
  levelSetpoint: 50,
  initialLevel: 50,
  outerKp: 1.8,
  outerKi: 0.25,
  outerKd: 0.4,
  innerKp: 3.0,
  innerKi: 3.0,
  innerKd: 0.0,
  outerStepsPerInnerStep: 5,
  disturbanceMagnitude: 15,
  disturbanceStartTime: 20,
  dt: 0.1,
  steps: 600,
});

const nomCascadeFF = simulateCascadeTank({
  architecture: "cascade_feedforward",
  levelSetpoint: 50,
  initialLevel: 50,
  outerKp: 1.8,
  outerKi: 0.25,
  outerKd: 0.4,
  innerKp: 3.0,
  innerKi: 3.0,
  innerKd: 0.0,
  outerStepsPerInnerStep: 5,
  feedforwardGain: 1.0,
  disturbanceMagnitude: 15,
  disturbanceStartTime: 20,
  dt: 0.1,
  steps: 600,
});

// Cascade must show lower ISE than Single-Loop under identical conditions
assert(
  nomCascade.metrics.ise < baselineSingle.metrics.ise,
  "Cascade ISE must be strictly lower than Single-Loop ISE (258.94 < 318.43)",
  `Cascade ISE: ${nomCascade.metrics.ise} vs Single-Loop ISE: ${baselineSingle.metrics.ise}`
);

// Cascade + Feedforward must crush level deviation to < 1.0% (nominal 0.83%)
const maxDevFF = Math.max(...nomCascadeFF.level.map((l) => Math.abs(l - 50)));
assert(
  maxDevFF < 1.0,
  "Cascade + Feedforward max level deviation < 1.0% (nominal 0.83%)",
  `Got ${maxDevFF.toFixed(2)}%`
);

// Cascade + Feedforward IAE must be < 5.0 (nominal 2.99 vs 60.06)
assert(
  nomCascadeFF.metrics.iae < 5.0,
  "Cascade + Feedforward IAE < 5.0 (nominal 2.99)",
  `Got ${nomCascadeFF.metrics.iae}`
);

// -----------------------------------------------------------------------------
// 6. Actuator Longevity Reversal Invariant (Inner Flow Sensor Noise)
// -----------------------------------------------------------------------------
console.log("\n--- 6. ACTUATOR WEAR & SENSOR NOISE INVARIANTS ---");

// Compute total valve travel for baseline single-loop
let travelSingle = 0;
for (let i = 1; i < baselineSingle.valveCommand.length; i++) {
  travelSingle += Math.abs(baselineSingle.valveCommand[i] - baselineSingle.valveCommand[i - 1]);
}
assert(
  travelSingle < 30.0,
  "Single-loop valve travel is smooth and well-behaved (< 30% stroke travel)",
  `Got ${travelSingle.toFixed(2)}%`
);

// Noisy inner loop flow measurement
const noisyCascade = simulateCascadeTank({
  architecture: "cascade",
  levelSetpoint: 50,
  initialLevel: 50,
  outerKp: 1.8,
  outerKi: 0.25,
  outerKd: 0.4,
  innerKp: 3.0,
  innerKi: 3.0,
  innerKd: 0.0,
  outerStepsPerInnerStep: 5,
  disturbanceMagnitude: 15,
  disturbanceStartTime: 20,
  dt: 0.1,
  steps: 600,
  noiseAmplitude: 0,
  innerNoiseAmplitude: 2.0,
});

let travelNoisyCascade = 0;
for (let i = 1; i < noisyCascade.valveCommand.length; i++) {
  travelNoisyCascade += Math.abs(noisyCascade.valveCommand[i] - noisyCascade.valveCommand[i - 1]);
}

assert(
  travelNoisyCascade > 1000.0,
  "Noisy inner loop causes high valve travel (> 1000% stroke travel) verifying actuator wear trade-off",
  `Got ${travelNoisyCascade.toFixed(2)}%`
);

// -----------------------------------------------------------------------------
// Final Verdict
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
if (failures > 0) {
  console.error(`>>> REGRESSION GATE FAILED: ${failures} mathematical assertion(s) failed. <<<`);
  process.exit(1);
} else {
  console.log(">>> ALL MATHEMATICAL REGRESSION ASSERTIONS PASSED CLEANLY. <<<");
  console.log("===============================================================================");
}
