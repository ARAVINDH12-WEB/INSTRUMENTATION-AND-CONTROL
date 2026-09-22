import { simulateCascadeTank, simulateSingleLoopTank } from "../lib/pid-math";

console.log("=== Testing Single-Loop vs Cascade under Outlet Disturbance ===");

const commonGains = {
  levelSetpoint: 50,
  outerKp: 1.8,
  outerKi: 0.25,
  outerKd: 0.4,
  innerKp: 3.5,
  innerKi: 3.0,
  outerStepsPerInnerStep: 5,
  disturbanceMagnitude: 15,
  disturbanceStartTime: 15,
  steps: 600,
};

const resSingle = simulateSingleLoopTank(commonGains);
const resCasc = simulateCascadeTank({ ...commonGains, architecture: "cascade" });
const resFF = simulateCascadeTank({ ...commonGains, architecture: "cascade_feedforward", feedforwardGain: 1.0 });

console.log(`Single-Loop: IAE = ${resSingle.metrics.iae} | ISE = ${resSingle.metrics.ise} | ITAE = ${resSingle.metrics.itae} | Settle = ${resSingle.metrics.settlingTimeSec}s`);
console.log(`Cascade:     IAE = ${resCasc.metrics.iae} | ISE = ${resCasc.metrics.ise} | ITAE = ${resCasc.metrics.itae} | Settle = ${resCasc.metrics.settlingTimeSec}s`);
console.log(`Cascade+FF:  IAE = ${resFF.metrics.iae} | ISE = ${resFF.metrics.ise} | ITAE = ${resFF.metrics.itae} | Settle = ${resFF.metrics.settlingTimeSec}s`);

const iseReduction = Math.round(((resSingle.metrics.ise - resCasc.metrics.ise) / resSingle.metrics.ise) * 100);
console.log(`\nCascade achieves a ${iseReduction}% reduction in squared error (ISE) compared to Single-Loop.`);

if (resCasc.metrics.ise >= resSingle.metrics.ise) {
  console.error("FAIL: Cascade should show lower ISE than Single-Loop.");
  process.exit(1);
}

console.log("\n[SUCCESS] Single-Loop vs Cascade comparison successfully validated.");
