/**
 * ControlForge Console Diagnostic Chatbot - Static Knowledge Base & Scoped Search Engine
 * Grounded strictly in ControlForge's actual content: Notes, Calculators, PID Lab,
 * Intelligence modules, Projects case studies, and Meta platform information.
 */

export interface KnowledgeEntry {
  id: string;
  category: "meta" | "notes" | "calculators" | "pid-lab" | "intelligence" | "projects" | "trainer";
  title: string;
  keywords: string[];
  answer: string;
  routeRef?: string;
}

export const consoleKnowledgeBase: KnowledgeEntry[] = [
  // --- META & PLATFORM ---
  {
    id: "meta-about",
    category: "meta",
    title: "What is ControlForge?",
    keywords: ["what is controlforge", "about", "who is this for", "purpose", "tagline", "platform"],
    answer:
      "ControlForge is an industrial instrumentation and control engineering platform combining an engineering portfolio, interactive dynamic process simulators, an instrumentation knowledge base, and metrology calculators. Tagline: Measure. Model. Control. Automate. It is engineered for students learning control systems, engineers building portfolios, and industrial teams evaluating automation solutions.",
    routeRef: "/",
  },
  {
    id: "meta-tech-stack",
    category: "meta",
    title: "Technology Stack",
    keywords: ["tech stack", "technologies", "architecture", "fastapi", "nextjs", "framework", "how is this built"],
    answer:
      "ControlForge is built with Next.js 14 (App Router) and Tailwind CSS on the frontend, featuring custom HTML5 Canvas for real-time process physics. Advanced analytics in the Industrial Intelligence section interface with a dedicated high-performance Python FastAPI backend for statistical anomaly detection, remaining useful life (RUL) modeling, and time-series forecasting.",
    routeRef: "/",
  },

  // --- FIELD NOTES & MONOGRAPHS ---
  {
    id: "notes-pressure-transmitter",
    category: "notes",
    title: "Pressure Transmitter Working Principle & Control Loops",
    keywords: [
      "pressure transmitter",
      "pt-101",
      "piezoresistive",
      "capacitive",
      "diaphragm",
      "hart",
      "impulse line",
      "how does a pressure transmitter work",
      "field notes",
    ],
    answer:
      "A pressure transmitter (e.g. PT-101) converts physical process pressure into a calibrated 4–20 mA current signal via piezoresistive silicon strain gauges or capacitive differential diaphragms. It connects to process piping via impulse lines with 3-valve or 5-valve manifolds to isolate, equalize, and vent the sensor. In closed loops, the transmitter provides the continuous Process Variable (PV) to a controller (PIC), which throttles a control valve (PV).",
    routeRef: "/notes/pressure-transmitter-control-loop",
  },
  {
    id: "notes-failure-modes",
    category: "notes",
    title: "Pressure Transmitter Common Failure Modes",
    keywords: [
      "failure modes",
      "impulse line plugging",
      "transmitter failure",
      "thermal drift",
      "zero shift",
      "diaphragm rupture",
    ],
    answer:
      "Common industrial failure modes include: 1) Impulse line plugging from suspended solids or paraffin wax, causing a sluggish or frozen signal; 2) Zero elevation/suppression drift caused by thermal expansion of fill fluid; 3) Manifold valve leakage causing false differential pressure readings; and 4) Diaphragm fatigue/rupture due to water hammer or hydraulic overpressure shocks.",
    routeRef: "/notes/pressure-transmitter-control-loop",
  },
  {
    id: "notes-temperature-sensors",
    category: "notes",
    title: "RTDs vs Thermocouples",
    keywords: ["rtd", "thermocouple", "pt100", "seebeck", "temperature sensor", "callendar van dusen"],
    answer:
      "Resistance Temperature Detectors (RTDs, typically Pt100) measure resistance changes in high-purity platinum wire according to the Callendar-Van Dusen equation (100 Ω at 0°C), providing high accuracy (±0.15°C) from -200°C to 600°C. Thermocouples generate a microvolt Seebeck potential between dissimilar metals (e.g., Type K Chromel-Alumel), offering ruggedness and extreme range (-200°C to 1370°C+).",
    routeRef: "/notes",
  },
  {
    id: "notes-safety-instrumented-systems",
    category: "notes",
    title: "Safety Instrumented Systems (SIS) & SIL Concepts",
    keywords: [
      "safety instrumented system",
      "sis",
      "sil",
      "safety integrity level",
      "bpcs",
      "basic process control system",
      "difference between sis and bpcs",
      "pfd",
      "pfdavg",
      "proof test",
      "proof-test interval",
      "dangerous failure rate",
      "lambda d",
      "iec 61508",
      "iec 61511",
      "low demand",
      "risk reduction factor",
      "rrf",
    ],
    answer:
      "A Safety Instrumented System (SIS) is dedicated to detecting dangerous conditions and taking the process to a safe state (e.g. emergency shutdown). It differs fundamentally from the Basic Process Control System (BPCS): BPCS actively regulates process variables (flow, level, pressure) within normal operating bounds, whereas SIS sits dormant until an abnormal hazard exceeds protective thresholds. SIS does not replace or tune BPCS. Safety Integrity Levels (SIL 1–4) define required risk reduction in low-demand mode (SIL 1: PFDavg 10⁻²–10⁻¹, SIL 2: 10⁻³–10⁻², SIL 3: 10⁻⁴–10⁻³, SIL 4: 10⁻⁵–10⁻⁴). The low-demand single-channel approximation is PFDavg ≈ (λ_D × T) / 2.",
    routeRef: "/notes/safety-instrumented-systems",
  },

  // --- CALCULATORS ---
  {
    id: "calc-overview",
    category: "calculators",
    title: "Engineering Calculators Suite",
    keywords: ["calculators", "engineering tools", "converter", "what calculators are available"],
    answer:
      "ControlForge features 6 precision metrology and functional safety calculators: 1) 4–20 mA Process Signal Converter (linear & square-root flow scaling); 2) Orifice Plate Differential Flow Calculator; 3) Ziegler-Nichols Closed-Loop PID Tuning Calculator; 4) RTD Pt100 Resistance-to-Temperature Tool; 5) Thermocouple Type K/J/T mV-to-Temperature Converter; and 6) SIL PFDavg & Risk Reduction Factor Calculator (IEC 61508 / 61511).",
    routeRef: "/calculators",
  },
  {
    id: "calc-ma-converter",
    category: "calculators",
    title: "4–20 mA Signal Converter",
    keywords: [
      "4-20 ma",
      "4-20ma",
      "scale",
      "scaling",
      "current loop",
      "process value",
      "ma converter",
      "linear scaling",
      "how do i scale a 4-20ma signal",
    ],
    answer:
      "The 4–20 mA converter computes process values from current signals using the linear formula: PV = LRV + ((I - 4) / 16) * (URV - LRV). At 4.0 mA, the reading is 0% of span (LRV); at 12.0 mA, exactly 50%; at 20.0 mA, 100% of span (URV). It also supports square-root extraction for differential-pressure flow meters: PV = LRV + √((I - 4) / 16) * (URV - LRV).",
    routeRef: "/calculators/ma-converter",
  },
  {
    id: "calc-orifice-flow",
    category: "calculators",
    title: "Orifice Flow Calculator",
    keywords: ["orifice", "flow calculator", "differential pressure flow", "discharge coefficient", "beta ratio"],
    answer:
      "The Orifice Flow Calculator determines mass and volumetric flow rates through concentric square-edged orifice plates per ISO 5167. Inputs include pipe internal diameter (D), orifice bore diameter (d), fluid density, and differential pressure (ΔP). It computes the beta ratio (d/D) and applies the Reader-Harris/Gallagher discharge coefficient.",
    routeRef: "/calculators/orifice-flow",
  },
  {
    id: "calc-pid-tuning",
    category: "calculators",
    title: "Ziegler-Nichols PID Tuning Calculator",
    keywords: ["ziegler nichols", "pid tuning", "ultimate gain", "ultimate period", "ku", "pu", "how to tune pid"],
    answer:
      "The PID Tuning Calculator applies the classical Ziegler-Nichols frequency response method. By inputting the ultimate gain (Ku) and ultimate oscillation period (Pu) observed at the verge of continuous cycling, it calculates optimal parameters for P, PI, and PID controllers (Classic, Pessen Integral, and Some Overshoot rules).",
    routeRef: "/calculators/pid-tuning",
  },
  {
    id: "calc-sil-pfd",
    category: "calculators",
    title: "SIL PFDavg & Risk Reduction Factor Calculator",
    keywords: [
      "sil calculator",
      "pfd calculator",
      "pfdavg",
      "risk reduction factor",
      "rrf",
      "dangerous failure rate",
      "lambda d",
      "proof test interval",
      "low demand",
      "sil 1",
      "sil 2",
      "sil 3",
      "sil 4",
      "iec 61508",
      "iec 61511",
    ],
    answer:
      "The SIL PFDavg Calculator computes average Probability of Failure on Demand using the simplified low-demand 1oo1 approximation: PFDavg ≈ (λ_D × T) / 2 and RRF = 1 / PFDavg. It accepts failure rate in h⁻¹, FIT, or yr⁻¹, and proof-test interval in years, months, or hours. It features live worked-step derivations, edge-case guards (T ≤ 0, λ_D < 0, non-physical PFD > 1.0), and active IEC 61508 / 61511 SIL 1–4 band highlighting.",
    routeRef: "/calculators/sil-pfd",
  },

  // --- PID LAB ---
  {
    id: "pid-lab-overview",
    category: "pid-lab",
    title: "PID Simulation Lab",
    keywords: ["pid lab", "pid simulator", "how does pid lab work", "tuning presets", "simulation"],
    answer:
      "The PID Lab provides an interactive, client-side control loop workbench. It features 7 distinct dynamic physical process simulators: 1) Tank Level with non-linear gravity outflow; 2) Thermal Process with ambient dissipation; 3) DC Motor Speed with inertia and back-EMF; 4) First-Order Process with step response; 5) Second-Order Process with tunable damping ratio (zeta) and natural frequency (wn); 6) Multi-Tank Interacting System with two coupled gravity vessels in series (2nd-order lag); and 7) Counter-Current Heat Exchanger with transport dead time.",
    routeRef: "/pid-lab",
  },
  {
    id: "pid-tank-simulator",
    category: "pid-lab",
    title: "Tank-Level Process Simulator",
    keywords: ["tank level simulator", "torricelli", "gravity outflow", "well tuned preset", "tank level pid"],
    answer:
      "The Tank Level simulator models fluid height governed by Torricelli's law: dh/dt = (Qin - C_out * √h) / A. Users adjust Kp, Ki, Kd, setpoint, and valve slew limits. A recommended 'well-tuned' preset is Kp = 2.10, Ki = 0.35 s⁻¹, Kd = 0.10 s, which settles cleanly with under 3% overshoot.",
    routeRef: "/pid-lab/tank-level",
  },
  {
    id: "pid-compare-controllers",
    category: "pid-lab",
    title: "Compare Two Controllers View (PID Lab)",
    keywords: [
      "compare two controllers",
      "controller a vs b",
      "compare controllers",
      "dual controller",
      "dual trace",
      "compare pid",
      "controller a",
      "controller b",
      "verdigris trace",
      "iae ise itae comparison",
      "steady state offset",
      "p only vs pi",
      "effect of kd",
      "aggressive vs conservative",
      "effect of ki",
    ],
    answer:
      "The 'Compare two controllers' view in the PID Lab (/pid-lab) enables side-by-side benchmarking of two independent parameter sets (Controller A in amber, Controller B in verdigris) evaluated across the exact same discrete tank process model and disturbance conditions. It features independent Kp, Ki, Kd, and SP sliders, per-trace show/hide toggles, curated teaching preset pairs ('Steady-State Offset: P-only vs PI', 'Aggressive vs Conservative', 'Effect of Ki: Damped vs Ringing', and 'Kd on Lag-Free Plant: Teaching Case'), and an automated comparison table highlighting the superior controller across Overshoot, Rise Time, Settling Time, IAE, ISE, and ITAE.",
    routeRef: "/pid-lab",
  },
  {
    id: "pid-cascade-simulator",
    category: "pid-lab",
    title: "Cascade & Feedforward Control Simulator",
    keywords: [
      "cascade control",
      "feedforward simulator",
      "inner loop",
      "outer loop",
      "master slave controller",
      "lic-301",
      "fic-301",
      "feedforward gain",
      "cascade simulation",
    ],
    answer:
      "The Cascade & Feedforward simulator at /pid-lab/cascade models a dual-loop regulatory system: an outer Level Controller (LIC-301) calculates the remote setpoint for a fast inner Flow Controller (FIC-301) driving control valve FV-301. An additive feedforward block (FF-301) intercepts downstream demand surges and supply pressure drops, reducing peak disturbance error by up to 95% compared to single-loop feedback.",
    routeRef: "/pid-lab/cascade",
  },
  {
    id: "pid-temperature-simulator",
    category: "pid-lab",
    title: "Temperature Control Simulator",
    keywords: ["temperature simulator", "thermal process", "ambient loss", "heater power", "overshoot recovery"],
    answer:
      "The Temperature simulator models an electric heating element with ambient heat dissipation: dT/dt = (P_heater - k_loss * (T - T_ambient)) / C_thermal. Because heating can only add energy (unidirectional actuation), recovery from overshoot relies purely on ambient cooling, mirroring real thermal furnaces.",
    routeRef: "/pid-lab/temperature",
  },
  {
    id: "pid-multi-tank-simulator",
    category: "pid-lab",
    title: "Multi-Tank Interacting System Simulator",
    keywords: [
      "multi tank",
      "multi-tank",
      "two tanks",
      "interacting tanks",
      "coupled tanks",
      "higher order",
      "second order lag",
      "tank 1",
      "tank 2",
      "intermediate lag",
    ],
    answer:
      "The Multi-Tank Interacting System simulator at /pid-lab/multi-tank models two gravity-coupled vessels in series where Tank 1's outflow directly feeds Tank 2's inflow, and a controller regulates Tank 2's level (h2) by modulating inlet valve inflow into Tank 1. This introduces a genuinely 2nd-order hydraulic lag (-180° phase lag) where Tank 1 acts as an unmeasured intermediate capacitance. At gains that are stable on a single tank (Kp=2.1, Ki=0.35), the multi-tank system exhibits severe overshoot (>90%) and prolonged settling time.",
    routeRef: "/pid-lab/multi-tank",
  },
  {
    id: "pid-heat-exchanger-simulator",
    category: "pid-lab",
    title: "Counter-Current Heat Exchanger Simulator (with Transport Delay)",
    keywords: [
      "heat exchanger",
      "transport delay",
      "dead time",
      "shell and tube",
      "counter current",
      "pure delay",
      "phase lag",
      "delay buffer",
      "dead time knob",
    ],
    answer:
      "The Counter-Current Heat Exchanger simulator at /pid-lab/heat-exchanger models a shell-and-tube thermal unit regulating cold stream outlet temperature via hot fluid flow. It features an adjustable transport dead time knob (0.0s to 10.0s) demonstrating how pure dead time introduces linear negative phase shift (Δφ = -ω θd) without gain attenuation. Comparing deadTime = 0s against deadTime = 3.0s reveals how transport delay degrades phase margin, inflates overshoot, and forces more conservative PID tuning.",
    routeRef: "/pid-lab/heat-exchanger",
  },

  // --- INDUSTRIAL INTELLIGENCE ---
  {
    id: "intel-overview",
    category: "intelligence",
    title: "Industrial Intelligence Section Overview",
    keywords: ["intelligence", "machine learning", "ml", "ai", "what is in intelligence", "industrial intelligence"],
    answer:
      "The Industrial Intelligence section demonstrates statistical edge AI and predictive telemetry for plant instrumentation. It houses four modules: 1) Statistical Anomaly & Fault Detection (MAD / Modified Z-Scores); 2) Predictive Maintenance & Remaining Useful Life (Weibull degradation); 3) Thermal Trend Forecasting (Holt's Double Exponential Smoothing); and 4) Multi-Sensor Anomaly Detection (Mahalanobis distance multivariate statistical process control).",
    routeRef: "/intelligence",
  },
  {
    id: "intel-fault-detection",
    category: "intelligence",
    title: "Statistical Sensor Fault Detection",
    keywords: ["fault detection", "anomaly", "z-score", "mad", "median absolute deviation", "stuck sensor"],
    answer:
      "The Fault Detection module isolates sensor defects without requiring massive neural networks. It applies Median Absolute Deviation (MAD) and Boris Iglewicz Modified Z-scores: M_i = 0.6745 * |x_i - x_tilde| / MAD. This classifies faults into transient impulse spikes, systemic calibration drift, or out-of-bounds saturation while resisting outlier variance distortion.",
    routeRef: "/intelligence/fault-detection",
  },
  {
    id: "intel-predictive-maintenance",
    category: "intelligence",
    title: "Predictive Maintenance & RUL Estimation",
    keywords: ["predictive maintenance", "rul", "remaining useful life", "vibration severity", "iso 10816", "bearing"],
    answer:
      "The Predictive Maintenance module estimates remaining operating hours (RUL) on rotating machinery. It combines ISO 10816 vibration severity velocity squared, Arrhenius thermal aging factors (exp(ΔT / 28)), and cumulative operating run-hours into a two-parameter Weibull wear-out model to predict bearing life before catastrophic seizure.",
    routeRef: "/intelligence/predictive-maintenance",
  },
  {
    id: "intel-forecasting",
    category: "intelligence",
    title: "Process Trend Horizon Forecasting",
    keywords: ["forecasting", "temperature forecast", "double exponential smoothing", "holt", "trend projection"],
    answer:
      "The Forecasting module projects process telemetry 5 to 20 steps into the future using Holt's Linear Exponential Smoothing. It decouples baseline level (alpha) from dynamic velocity trend (beta), dampened by phi, and computes expanding 90% prediction confidence envelopes to alert operators of approaching high/low thermal limits.",
    routeRef: "/intelligence/forecasting",
  },
  {
    id: "intel-anomaly-detection",
    category: "intelligence",
    title: "Multi-Sensor Anomaly Detection",
    keywords: [
      "anomaly detection",
      "multivariate",
      "mahalanobis",
      "multi-sensor",
      "correlation",
      "covariance",
      "joint deviation",
      "unsupervised",
      "cross-sensor anomaly",
    ],
    answer:
      "The Multi-Sensor Anomaly Detection module (MOD-04) performs unsupervised multivariate anomaly detection using rolling Mahalanobis distance from the expected joint sensor distribution. Unlike the single-sensor MAD/Z-Score fault detector (MOD-01), it identifies abnormal relationships between correlated process sensors — catching faults where no single sensor crosses its own threshold but the combination of readings is physically implausible. It monitors temperature, pressure, flow, level, and vibration simultaneously.",
    routeRef: "/intelligence/anomaly-detection",
  },
  {
    id: "intel-energy-forecasting",
    category: "intelligence",
    title: "Industrial Energy-Consumption Forecasting & Seasonality",
    keywords: [
      "energy forecasting",
      "power consumption",
      "holt-winters",
      "seasonality",
      "load profile",
      "diurnal",
      "seasonal naive",
      "energy demand",
      "triple exponential smoothing",
      "kilowatt",
      "mod-05",
    ],
    answer:
      "The Industrial Energy Forecasting module (MOD-05 at /intelligence/energy-forecasting) evaluates multi-step plant electrical demand curves. Unlike non-seasonal trend forecasters, it addresses 24-hour diurnal operational peaks and weekend curtailment. It benchmarks four distinct methods against held-out ground truth data: Naive (last-value), Seasonal-Naive (24h lookback), Holt's Linear (trend-only), and Holt-Winters Triple Exponential Smoothing. Holt-Winters consistently achieves the lowest MAPE (~1.3% vs ~1.8% for seasonal-naive and >17% for non-seasonal baselines) by filtering measurement noise across multiple seasonal cycles.",
    routeRef: "/intelligence/energy-forecasting",
  },

  // --- PROJECTS & CASE STUDIES ---
  {
    id: "projects-overview",
    category: "projects",
    title: "Engineering Projects & Industrial Case Studies",
    keywords: ["projects", "case studies", "industrial architectures", "what projects are there"],
    answer:
      "The Projects repository features 6 detailed engineering case studies with full ISA-5.1 specifications, mathematical transfer functions, and tuning rationale: 1) Chemical Surge Tank Level PID Control (LIC-101); 2) Dual-Redundant Sensor Fault & Drift Isolation (TT-201A/B); 3) High-Torque Conveyor VFD Speed Regulation (SIC-301); 4) 6-DOF Robotic Arm Joint Servos (RIC-401); 5) Warehouse Automation & Cross-Belt Sorter (WMS-501); and 6) LSTM-Based Industrial Time-Series Forecasting (ML-601).",
    routeRef: "/projects",
  },
  {
    id: "project-case-1",
    category: "projects",
    title: "Case Study 01: Chemical Surge Tank Level (LIC-101)",
    keywords: ["case 01", "surge tank", "lic-101", "anti-windup", "chemical tank"],
    answer:
      "Case Study 01 explores an atmospheric surge tank subject to non-linear gravity outflow. It details a Siemens S7-1200 PLC implementation using parallel-form PID with anti-windup clamping to eliminate integral saturation during step setpoint changes, achieving <2.8% overshoot and 36.6s settling time.",
    routeRef: "/projects",
  },
  {
    id: "project-case-2",
    category: "projects",
    title: "Case Study 02: Sensor Fault Detection (TT-201A/B)",
    keywords: ["case 02", "sensor drift", "tt-201", "redundant rtd", "cusum"],
    answer:
      "Case Study 02 covers dual-redundant Pt100 RTD transmitters on superheated steam exchangers. By combining CUSUM statistical change-point detection with predictive residual tracking, slow sensor calibration drift (0.15°C/hr) is isolated in under 4.2 minutes, preventing thermal stress and unmeasured energy loss.",
    routeRef: "/projects",
  },
  {
    id: "project-case-3",
    category: "projects",
    title: "Case Study 03: Conveyor-Belt Speed Regulation (SIC-301)",
    keywords: ["case 03", "conveyor", "sic-301", "vfd", "variable frequency drive", "tachometer"],
    answer:
      "Case Study 03 covers speed regulation on a 120-meter heavy-duty bulk conveyor driven by a 45 kW induction motor and vector VFD. It details cascaded speed PI control combined with feedforward load compensation from an upstream weighometer (WT-301), reducing dynamic dump-load speed dips from 12% to under 0.8%.",
    routeRef: "/projects",
  },
  {
    id: "project-case-4",
    category: "projects",
    title: "Case Study 04: Robotic Arm Multi-Axis Position Control (RIC-401)",
    keywords: ["case 04", "robotic arm", "ric-401", "6-dof", "computed torque", "servo"],
    answer:
      "Case Study 04 explores a 6-DOF industrial articulating robot arm with 24-bit optical encoders. It implements a decoupled computed-torque feedforward architecture with decentralized joint PID servos over a 1 kHz EtherCAT bus, reducing trajectory tracking errors from ±1.8 mm to under ±0.04 mm.",
    routeRef: "/projects",
  },
  {
    id: "project-case-5",
    category: "projects",
    title: "Case Study 05: Warehouse Automation & Cross-Belt Sorter (WMS-501)",
    keywords: ["case 05", "warehouse automation", "wms-501", "cross-belt", "sorter", "profinet"],
    answer:
      "Case Study 05 details a high-throughput linear induction cross-belt parcel sorter handling 12,000 parcels/hour over PROFINET IRT. It implements a FIFO shift-register position tracking system with dynamic induction spacing, dropping chute miss rates from 1.4% to under 0.02%.",
    routeRef: "/projects",
  },
  {
    id: "project-case-6",
    category: "projects",
    title: "Case Study 06: LSTM-Based Time-Series Forecasting (ML-601)",
    keywords: ["case 06", "lstm", "ml-601", "catalytic reactor", "time-series forecasting", "runaway"],
    answer:
      "Case Study 06 details a 3-layer bi-directional LSTM neural network monitoring a 10,000 L pressurized catalytic batch reactor. By predicting thermal runaway excursions and heat-exchanger fouling 4.1 hours ahead of occurrence, it achieved zero false emergency shutdowns across an 18-month trial.",
    routeRef: "/projects",
  },

  // --- P&ID TRAINER ---
  {
    id: "trainer-overview",
    category: "trainer",
    title: "P&ID and Loop Diagram Trainer",
    keywords: ["pid trainer", "p&id trainer", "isa-5.1", "loop builder", "tag identification", "quiz"],
    answer:
      "The P&ID Trainer (/pid-trainer) provides 3 interactive training modes grounded in ISA-5.1 standards: Mode 1 (18-question Tag Identification Quiz with bubble diagrams); Mode 2 (Interactive SVG Loop Builder with automated topology and defect validation); and Mode 3 (Process-to-Diagram Conversion with real-world plant narrative matching).",
    routeRef: "/pid-trainer",
  },
  {
    id: "trainer-isa-syntax",
    category: "trainer",
    title: "ISA-5.1 Instrument Tag Syntax Rules",
    keywords: ["isa-5.1 syntax", "tag naming", "first letter", "succeeding letters", "instrument tag meaning"],
    answer:
      "Under ISA-5.1 standards, the first letter represents the measured/initiating variable (P=Pressure, T=Temperature, F=Flow, L=Level, A=Analysis, Z=Position). Succeeding letters designate readout, passive, or output functions (T=Transmitter, I=Indicator, C=Controller, V=Valve, S=Switch, A=Alarm). For example, PT = Pressure Transmitter, LIC = Level Indicating Controller, and FCV = Flow Control Valve.",
    routeRef: "/pid-trainer",
  },
];

/**
 * Normalizes query string into an array of lower-case alphanumeric tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Evaluates match score between query tokens and a knowledge base entry.
 */
function scoreEntry(queryTokens: string[], entry: KnowledgeEntry, rawQuery: string): number {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  const qLower = rawQuery.toLowerCase();

  // Check direct substring matches against keywords
  for (const kw of entry.keywords) {
    const kwLower = kw.toLowerCase();
    if (qLower.includes(kwLower)) {
      score += 1.8 + kwLower.length * 0.05;
    }
  }

  // Token level scoring
  const entryTokens = new Set([
    ...tokenize(entry.title),
    ...entry.keywords.flatMap((k) => tokenize(k)),
  ]);

  let matchedTokens = 0;
  for (const token of queryTokens) {
    if (entryTokens.has(token)) {
      matchedTokens++;
      score += 1.0;
    } else {
      // Check for partial / prefix match
      for (const et of entryTokens) {
        if (et.includes(token) || token.includes(et)) {
          matchedTokens += 0.5;
          score += 0.5;
          break;
        }
      }
    }
  }

  // Normalize by query length
  const coverage = matchedTokens / queryTokens.length;
  return score * (0.4 + coverage * 0.6);
}

/**
 * Searches the knowledge base and returns best match if confidence threshold is met.
 */
export function queryConsoleChatbot(query: string): {
  matched: boolean;
  entry?: KnowledgeEntry;
  answer: string;
  confidence: number;
  rawScore?: number;
} {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      matched: false,
      answer: "INPUT REQUIRED // Enter an instrumentation or control query to inspect system memory.",
      confidence: 0,
    };
  }

  const queryTokens = tokenize(trimmed);
  let bestEntry: KnowledgeEntry | undefined;
  let highestScore = 0;

  for (const entry of consoleKnowledgeBase) {
    const s = scoreEntry(queryTokens, entry, trimmed);
    if (s > highestScore) {
      highestScore = s;
      bestEntry = entry;
    }
  }

  // Reference upper score with headroom based on observed KB query peaks (scores range 4 to 13+)
  const S_REF = 16.0;

  // Log-scaled confidence normalization to prevent early clipping at 1.000 and restore resolution:
  // confidence = ln(1 + rawScore) / ln(1 + S_REF)
  const confidence = Math.min(1.0, Math.max(0, Math.log(1 + highestScore) / Math.log(1 + S_REF)));

  // Match acceptance threshold (raw score 1.10 maps to ~0.262 on log scale)
  const RAW_THRESHOLD = 1.10;
  const CONFIDENCE_THRESHOLD = Math.log(1 + RAW_THRESHOLD) / Math.log(1 + S_REF);

  if (bestEntry && highestScore >= RAW_THRESHOLD) {
    return {
      matched: true,
      entry: bestEntry,
      answer: bestEntry.answer,
      confidence,
      rawScore: highestScore,
    };
  }

  return {
    matched: false,
    answer:
      "QUERY UNRESOLVED // That topic is outside what I have on file in local memory. Try consulting the Notes, Calculators, or Projects sections.",
    confidence,
    rawScore: highestScore,
  };
}

export const suggestedChatbotQueries = [
  "What is a pressure transmitter?",
  "How does the PID Lab work?",
  "What's in the Intelligence section?",
  "How do I scale a 4-20mA signal?",
  "What case studies are in Projects?",
  "What is ControlForge?",
];
