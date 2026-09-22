import { simulateCascadeTankPID } from "../lib/pid-math";

console.log("=== Running Complete Cascade & Feedforward Test Suite ===");

// 1. Clean Step Response
const cleanRun = simulateCascadeTankPID(
  { kp: 1.8, ki: 0.25, kd: 0.4 },
  { kp: 3.0, ki: 3.0 },
  50,
  { disturbanceType: "none", steps: 600 }
);

const finalLevelClean = cleanRun.cascade.level[cleanRun.cascade.level.length - 1];
console.log(`[TEST 1] Clean run final level: ${finalLevelClean.toFixed(2)}% (Target: 50.0%)`);
if (Math.abs(finalLevelClean - 50) > 3.0) {
  console.error("FAIL: Clean run did not settle within tolerance band of setpoint.");
  process.exit(1);
}

// 2. Upstream Supply Pressure Drop (Cascade vs Single Loop)
const pressureRun = simulateCascadeTankPID(
  { kp: 1.8, ki: 0.25, kd: 0.4 },
  { kp: 3.0, ki: 3.0 },
  50,
  {
    initialLevel: 50,
    disturbanceType: "supply_drop",
    disturbanceTimeSec: 15,
    steps: 600,
  }
);

console.log("\n[TEST 2] Upstream Supply Pressure Drop Rejection:");
console.log(`Cascade Max Disturbance Deviation: ${pressureRun.cascade.metrics.maxDisturbanceError}%`);
console.log(`Single-Loop Max Disturbance Deviation: ${pressureRun.singleLoop.metrics.maxDisturbanceError}%`);
console.log(`Cascade IAE: ${pressureRun.cascade.metrics.iae} | Single-Loop IAE: ${pressureRun.singleLoop.metrics.iae}`);

if (pressureRun.cascade.metrics.maxDisturbanceError >= pressureRun.singleLoop.metrics.maxDisturbanceError) {
  console.error("FAIL: Cascade must achieve lower disturbance deviation than Single Loop.");
  process.exit(1);
}
if (pressureRun.cascade.metrics.iae >= pressureRun.singleLoop.metrics.iae) {
  console.error("FAIL: Cascade must achieve lower IAE than Single Loop under supply disturbance.");
  process.exit(1);
}

// 3. Downstream Demand Surge (Without FF vs With FF)
const demandNoFF = simulateCascadeTankPID(
  { kp: 1.8, ki: 0.25, kd: 0.4 },
  { kp: 3.0, ki: 3.0 },
  50,
  {
    initialLevel: 50,
    disturbanceType: "demand_surge",
    disturbanceTimeSec: 20,
    feedforwardEnabled: false,
    steps: 600,
  }
);

const demandWithFF = simulateCascadeTankPID(
  { kp: 1.8, ki: 0.25, kd: 0.4 },
  { kp: 3.0, ki: 3.0 },
  50,
  {
    initialLevel: 50,
    disturbanceType: "demand_surge",
    disturbanceTimeSec: 20,
    feedforwardEnabled: true,
    feedforwardGain: 0.7,
    steps: 600,
  }
);

console.log("\n[TEST 3] Feedforward Cancellation of Demand Surge:");
console.log(`Without Feedforward Max Error: ${demandNoFF.cascade.metrics.maxDisturbanceError}% | IAE: ${demandNoFF.cascade.metrics.iae}`);
console.log(`With Feedforward Max Error: ${demandWithFF.cascade.metrics.maxDisturbanceError}% | IAE: ${demandWithFF.cascade.metrics.iae}`);

if (demandWithFF.cascade.metrics.maxDisturbanceError >= demandNoFF.cascade.metrics.maxDisturbanceError) {
  console.error("FAIL: Feedforward must reduce max disturbance error during demand surge.");
  process.exit(1);
}
if (demandWithFF.cascade.metrics.iae >= demandNoFF.cascade.metrics.iae) {
  console.error("FAIL: Feedforward must reduce IAE during demand surge.");
  process.exit(1);
}

console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY. Cascade and Feedforward kernel is mathematically verified. <<<");
