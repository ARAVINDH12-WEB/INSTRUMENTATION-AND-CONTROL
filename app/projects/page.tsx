"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

interface CaseStudy {
  id: string;
  tag: string;
  title: string;
  category: string;
  ref: string;
  overview: string;
  metadata: { label: string; value: string; status?: boolean }[];
  problem: string;
  process: string;
  specs: { device: string; tag: string; model: string; signal: string }[];
  model: string;
  strategy: string;
  results: string[];
  lessons: string;
  link?: string;
}

export default function ProjectsPage() {
  const [expandedId, setExpandedId] = useState<string | null>("cs-1");

  const caseStudies: CaseStudy[] = [
    {
      id: "cs-1",
      tag: "TAG: LIC-101",
      category: "CASE-01 · PROCESS CONTROL",
      title: "PID Tank-Level Control System",
      ref: "CF-PRJ-001",
      overview:
        "Closed-loop liquid level regulation under non-linear gravity outflow disturbance, featuring anti-windup integration, deadband filtering, and pneumatic control valve positioning.",
      metadata: [
        { label: "CONTROL SCHEME", value: "Feedback PID + Anti-Windup" },
        { label: "SETPOINT TARGET", value: "0–100% (Nominal 65%)" },
        { label: "CONTROLLER HARDWARE", value: "Siemens S7-1200 PLC" },
        { label: "STATUS", value: "BENCH TESTED", status: true },
      ],
      problem:
        "A chemical surge tank subject to stochastic batch upstream demand experienced severe overflow risks during step feed changes. Manual throttling resulted in cyclic level oscillations (±18% of span) and premature packing wear on the supply valve.",
      process:
        "Atmospheric vertical cylindrical vessel (H = 2.4 m, D = 1.2 m) receiving aqueous process solution. Inflow is modulated via a linear pneumatic globe valve, while bottom gravity outflow discharges to downstream reactors governed by Torricelli's orifice discharge law.",
      specs: [
        { device: "Level Transmitter", tag: "LT-101", model: "Differential Pressure (Diaphragm Seal)", signal: "4–20 mA HART (0–2400 mmWC)" },
        { device: "Control Valve", tag: "LV-101", model: "Globe Valve, Equal Percentage Trim", signal: "3–15 PSI (via I/P FY-101)" },
        { device: "Valve Controller", tag: "DVC-101", model: "Smart Electro-Pneumatic Positioner", signal: "4–20 mA Loop-Powered" },
      ],
      model: "A · dh/dt = Qin(t) - Cv · √(2 · g · h(t))  ⟹  Linearized transfer function: G(s) = 1.42 / (48.6s + 1)",
      strategy:
        "Parallel Form PID algorithm with derivative filter coefficient (N=10). Integrated dynamic conditional integration (anti-windup clamping) preventing integral accumulation during valve saturation. Tuning: Kp = 2.10, Ki = 0.35 s⁻¹, Kd = 0.10 s.",
      results: [
        "Step response overshoot: < 2.8% (optimal verdigris threshold).",
        "Rise time (tr to 90%): 9.7 seconds.",
        "Settling time (ts within ±5%): 36.6 seconds.",
        "Steady-state error: 0.00% with zero limit cycling.",
      ],
      lessons:
        "Without anti-windup clamping, large step setpoint jumps drove integral accumulation into massive saturation, inducing a 24% overshoot. Derivative action was calculated strictly on PV rather than error to eliminate derivative kick.",
    },
    {
      id: "cs-2",
      tag: "TAG: TT-201A/B",
      category: "CASE-02 · FAULT TOLERANT DCS",
      title: "Sensor Fault Detection & Drift Isolation (ML)",
      ref: "CF-PRJ-002",
      overview:
        "Dual-redundant temperature telemetry in shell-and-tube heat exchangers with statistical residual tracking, CUSUM change-point isolation, and automated fail-safe sensor voting.",
      metadata: [
        { label: "ALGORITHM", value: "Autoencoder + CUSUM Drift" },
        { label: "DETECTION LATENCY", value: "< 4.2 seconds" },
        { label: "TARGET PROCESS", value: "Superheated Steam Exchanger" },
        { label: "FALSE ALARM RATE", value: "< 0.04%", status: true },
      ],
      problem:
        "Gradual sensor calibration drift in RTD probes (aging and insulation degradation) escaped traditional high/low threshold alarms, driving heating loops into thermal stress before manual calibration intervals caught the error.",
      process:
        "Dual Pt100 4-wire RTD transmitters monitoring outlet steam temperature (180°C to 350°C) on high-pressure steam distribution headers with fluctuating flow rates.",
      specs: [
        { device: "Primary RTD", tag: "TT-201A", model: "Pt100 4-Wire, Class A (-50 to 400°C)", signal: "4–20 mA + HART 7" },
        { device: "Redundant RTD", tag: "TT-201B", model: "Pt100 4-Wire, Class A (-50 to 400°C)", signal: "4–20 mA + HART 7" },
        { device: "Steam Valve", tag: "TV-201", model: "ANSI Class 600, Pneumatic Modulating", signal: "Profibus PA" },
      ],
      model: "Residual: r(t) = T_measured(t) - T_model(Flow, Inlet, Valve)  |  CUSUM: S_k = max(0, S_{k-1} + (r_k - μ)/σ - k)",
      strategy:
        "Triple Modular Redundancy (TMR) voting logic augmented with predictive ML residual tracking. When cumulative drift exceeds threshold h = 4.5σ, PLC auto-sheds the degraded transmitter and shifts to the healthy sensor without bump.",
      results: [
        "Flagged slow drift (0.15°C/hr) within 4.2 minutes of onset.",
        "Conventional dual-deviation alarms required 4.8 hours to trip.",
        "Saved an estimated 14.2 MWh of annual fuel gas.",
      ],
      lessons:
        "Process noise during flow transients caused high false alarm rates until a 2-second median filter and adaptive thresholding tied to steam mass flow were introduced into the edge runtime.",
    },
    {
      id: "cs-3",
      tag: "TAG: SIC-301",
      category: "CASE-03 · MOTION & DRIVES",
      title: "Conveyor-Belt Speed Regulation",
      ref: "CF-PRJ-003",
      overview:
        "Variable Frequency Drive (VFD) tachometer feedback loop with load disturbance feedforward, S-curve acceleration profiles, and slip compensation for bulk material handling.",
      metadata: [
        { label: "DRIVE ARCHITECTURE", value: "Field Oriented Control VFD" },
        { label: "SPEED ACCURACY", value: "±0.15% at Rated Torque" },
        { label: "MOTOR POWER", value: "45 kW Induction Motor" },
        { label: "CYCLE TIME", value: "10 ms Fast Scan", status: true },
      ],
      problem:
        "Sudden bulk gravel dump-loads onto an inclined feeder belt caused motor slip, speed dips (>12%), and belt stalling. Downstream mixing chutes choked due to unsteady volumetric discharge rates.",
      process:
        "120-meter heavy-duty rubber troughed conveyor driven by a 45 kW AC induction motor coupled to a helical bevel reduction gearbox (25:1 ratio).",
      specs: [
        { device: "Optical Encoder", tag: "ST-301", model: "1024 PPR, HTL Push-Pull", signal: "High-Speed Counter (24V)" },
        { device: "Belt Weigher", tag: "WT-301", model: "Strain Gauge Load Cell (0–250 kg/m)", signal: "4–20 mA Transmitter" },
        { device: "Inverter Drive", tag: "VFD-301", model: "45 kW Vector Inverter", signal: "EtherNet/IP" },
      ],
      model: "J_total · dω/dt = T_motor(t) - T_load(t) - B · ω(t)  |  T_load = (m_belt + m_cargo)·g·(sin θ + μ·cos θ)·r",
      strategy:
        "Cascaded outer speed PI controller driving inner torque current loop (iq), combined with feedforward compensation from upstream belt weighometer WT-301 to inject instantaneous torque before cargo reaches drive pulley.",
      results: [
        "Dynamic load steps of 150 kg/m produced speed dips < 0.8%.",
        "Speed recovery time reduced from 4.2s to under 320 ms.",
        "Mechanical belt stretch and pulley slip completely eliminated.",
      ],
      lessons:
        "Direct step setpoint changes caused belt snap-whip and gearbox tooth fatigue. Implementing an S-curve jerk-limited acceleration profile reduced motor peak torque demands by 31%.",
    },
    {
      id: "cs-4",
      tag: "TAG: RIC-401",
      category: "CASE-04 · ROBOTICS & SERVOS",
      title: "Robotic Arm Multi-Axis Position Control",
      ref: "CF-PRJ-004",
      overview:
        "6-DOF articulating manipulator arm with computed-torque feedforward, multi-variable decoupled PID joint servos, and trajectory quintic polynomial interpolation.",
      metadata: [
        { label: "ARM PAYLOAD", value: "10 kg at Full Reach (1.4m)" },
        { label: "REPEATABILITY", value: "±0.025 mm Pose Repeat" },
        { label: "INTERPOLATION", value: "Quintic Jerk-Continuous" },
        { label: "BUS CYCLE", value: "1 ms EtherCAT DC", status: true },
      ],
      problem:
        "Centrifugal and Coriolis coupling torques during high-speed pick-and-place trajectories caused endpoint positional jitter and joint overshoot, violating tight electronic component insertion tolerances.",
      process:
        "High-speed 6-axis industrial articulated robot deploying AC brushless synchronous servomotors with 24-bit absolute multi-turn optical encoders.",
      specs: [
        { device: "Joint Servo", tag: "SM-401", model: "Permanent Magnet Synchronous AC", signal: "EtherCAT CiA 402 Drive" },
        { device: "Joint Encoder", tag: "ENC-401", model: "24-Bit Optical Multi-Turn Absolute", signal: "BiSS-C Serial Bus" },
        { device: "Motion Master", tag: "RMC-401", model: "Real-Time Embedded Linux / Xenomai", signal: "1 kHz Deterministic Bus" },
      ],
      model: "M(q)·q̈ + C(q, q̇)·q̇ + G(q) = τ_joint  ⟹  Decoupled computed torque: u = M(q)·(q̈_des + Kp·e + Kd·ė)",
      strategy:
        "Dynamic feedforward computed-torque architecture calculating real-time inverse dynamics combined with decentralized joint PID feedback to reject gear backlash and payload mass variation.",
      results: [
        "Path tracking error reduced from ±1.8 mm to under ±0.04 mm.",
        "Pick-and-place cycle time accelerated by 24% without payload slip.",
        "Vibration settling time upon arrival dropped below 45 ms.",
      ],
      lessons:
        "Coriolis decoupling matrices required precise gravity vector initialization. Adding an on-line payload inertia auto-tuner prevented tracking degradation when changing gripper tooling.",
    },
    {
      id: "cs-5",
      tag: "TAG: WMS-501",
      category: "CASE-05 · LOGISTICS AUTOMATION",
      title: "Warehouse Automation & Cross-Belt Sorter",
      ref: "CF-PRJ-005",
      overview:
        "High-throughput cross-belt parcel induction sorter coordinating photoelectric tracking arrays, linear synchronous motor propulsion, and deterministic PLC parcel destination tracking.",
      metadata: [
        { label: "THROUGHPUT", value: "12,000 Parcels / Hour" },
        { label: "SORTER SPEED", value: "2.5 m/s Continuous" },
        { label: "EJECTION ACCURACY", value: "99.98% Correct Chute" },
        { label: "NETWORK", value: "PROFINET IRT Ring", status: true },
      ],
      problem:
        "Parcel mis-tracking and late chute ejections during surge volumes led to package recirculations, bin jams, and optical scanner barcode read failures.",
      process:
        "Closed-loop oval track linear induction cross-belt sorting system with 240 carrier carriages receiving parcels from 4 high-speed dynamic induction belts.",
      specs: [
        { device: "Induction Eye", tag: "PE-501", model: "Time-of-Flight Laser Array", signal: "IO-Link Class A" },
        { device: "Barcode Scanner", tag: "BCR-501", model: "Omnidirectional 5-Sided Camera Tunnel", signal: "Gigabit Ethernet IP" },
        { device: "Cart Actuator", tag: "CA-501", model: "Brushless DC Motor Ejector", signal: "Wireless Optical Coupler" },
      ],
      model: "Chute Ejection Window: Δt = (X_chute - X_cart) / V_sorter  |  Tolerable window: ±18 ms at 2.5 m/s",
      strategy:
        "FIFO shift register tracking synchronized to main drive pulse resolver, combined with variable-speed parcel induction spacing algorithms ensuring exact 600 mm gaps between successive packages.",
      results: [
        "Chute miss rate plummeted from 1.4% to under 0.02%.",
        "Sorter sustained 12,000 items/hour peak continuous throughput.",
        "Zero parcel collisions inside induction merging funnels.",
      ],
      lessons:
        "Varying parcel friction coefficients (polybags vs cardboard) affected ejection speed. Adding dual dynamic top-speed compensation to the cross-belt discharge pulse eliminated polybag chute misses.",
    },
    {
      id: "cs-6",
      tag: "TAG: ML-601",
      category: "CASE-06 · PREDICTIVE ANALYTICS",
      title: "LSTM-Based Industrial Time-Series Forecasting",
      ref: "CF-PRJ-006",
      overview:
        "Long Short-Term Memory (LSTM) deep learning network forecasting multi-variable catalytic reactor temperature runaways and heat exchanger fouling 4 hours ahead of occurrence.",
      metadata: [
        { label: "FORECAST HORIZON", value: "4 Hours Advance Warning" },
        { label: "MODEL ARCHITECTURE", value: "Bi-directional LSTM (3-Layer)" },
        { label: "EDGE INFERENCE", value: "ONNX Runtime (85 ms Scan)" },
        { label: "ACCURACY (R²)", value: "0.962 on Field Telemetry", status: true },
      ],
      problem:
        "Exothermic batch reactors experienced sudden thermal runaways triggered by catalyst deactivation and cooling jacket fouling, leaving operators insufficient time to inject quench inhibitors.",
      process:
        "Pressurized exothermic stirred batch reactor (10,000 L) monitored by 16 process transmitters (core temperatures, jacket coolant flows, agitator current, feed pressures).",
      specs: [
        { device: "Multi-Point RTD", tag: "TT-601", model: "12-Point Radial Thermocouple Lance", signal: "Foundation Fieldbus" },
        { device: "Coolant Flowmeter", tag: "FT-601", model: "Coriolis Mass Flowmeter (0–50 t/h)", signal: "4–20 mA + HART" },
        { device: "Edge IPC", tag: "IPC-601", model: "Fanless Industrial PC (Intel Core i7)", signal: "OPC UA Client / Server" },
      ],
      model: "h_t = σ(W_f · [h_{t-1}, x_t] + b_f) ⊙ c_{t-1} + i_t ⊙ c̃_t  ⟹  Loss: MSE + λ·Penalty(T > 185°C)",
      strategy:
        "Recurrent neural network trained on 3 years of SCADA history running inferencing every 10 seconds via OPC UA, feeding predictive thermal trend alerts into the operator DCS alarm console.",
      results: [
        "Successfully predicted runaway thermal excursions with 4.1 hours lead time.",
        "Zero false emergency quench shutdowns across 18-month trial.",
        "Heat exchanger cleaning cycles optimized, saving $180,000/year.",
      ],
      lessons:
        "Pure data-driven LSTMs occasionally output physically impossible negative temperatures during feed step disruptions. Enforcing thermodynamic conservation constraints directly into the loss function solved extrapolation instability.",
    },
    {
      id: "cs-7",
      tag: "TAG: LIC/FIC-301",
      category: "CAPSTONE · DISTURBANCE REJECTION",
      title: "Robustness & Disturbance-Rejection Capstone",
      ref: "CF-PRJ-007",
      link: "/projects/disturbance-rejection-capstone",
      overview:
        "Rigorous comparative benchmark of Single-Loop PID, Cascade, and Feedforward architectures subjected to nominal outflow steps, inner-loop flow sensor noise, and feedforward model mismatch.",
      metadata: [
        { label: "ARCHITECTURES", value: "Single-Loop vs Cascade vs FF" },
        { label: "DISTURBANCE STEP", value: "+15 L/min (+75% Outflow)" },
        { label: "TIME-SCALE RATIO", value: "5:1 (Outer/Inner)" },
        { label: "STATUS", value: "BENCHMARKED", status: true },
      ],
      problem:
        "Large step outflow demand increases in surge tanks cause deep level slumps (7.8%) under single-loop feedback due to hydraulic capacitance lag. This capstone stress-tests cascade and feedforward under ideal vs real-world noisy conditions.",
      process:
        "Atmospheric cylindrical surge tank (A = 4.0 m², nominal level 50%) receiving flow modulated by equal-percentage globe valve LV-301 (τ = 1.2s), discharging to downstream batch extraction.",
      specs: [
        { device: "Level Transmitter", tag: "LT-301", model: "Guided Wave Radar (0–100%)", signal: "4–20 mA HART" },
        { device: "Inflow Transmitter", tag: "FT-301", model: "Electromagnetic (0–100 L/min)", signal: "4–20 mA (100ms)" },
        { device: "Disturbance Meter", tag: "FT-302", model: "Coriolis Mass Flowmeter", signal: "PROFINET IRT" },
      ],
      model: "A · dh/dt = Qin(t) - Qout(t)  |  τ_flow · dQin/dt + Qin = u_valve(t)  |  u_valve ∈ [0, 100%]",
      strategy:
        "Master LIC-301 (Kp=1.8, Ki=0.25, Kd=0.4, Ts=0.5s) driving slave FIC-301 (Kp=3.0, Ki=3.0, Ts=0.1s) with feedforward summation Kff · ΔQout. Compared against confirmed-fair single-loop baseline.",
      results: [
        "Nominal: FF reduces max level deviation from 7.78% to 0.83% (-89.3%) and IAE by 95.0%.",
        "Sensor Noise (±2.0 L/min): Cascade valve travel explodes by 28.5x (2935% vs 25.7% in single-loop).",
        "Actuator wear proves Single-Loop PID is vastly superior in noisy environments without heavy filtering.",
        "Feedforward mistuning (±40% gain) increases IAE 8x but still outperforms feedback-only cascade.",
      ],
      lessons:
        "Cascade does not win on every metric: inner-loop noise induces massive valve chatter. Inner loops must have analog low-pass filtering. Under-compensated feedforward (Kff=0.7) is safer than over-compensating.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen engineering-grid-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-amber">
            <span>ARCHIVE // CASE STUDIES</span>
            <span>·</span>
            <span>7 VALIDATED ENGINEERING BLUEPRINTS</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Control Systems Engineering Projects
          </h1>
          <p className="mt-2 max-w-3xl text-base text-text-dim">
            Field-engineered control loops, instrument selection matrices, mathematical models, 
            and automation architectures structured for industrial deployment.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded overflow-hidden">
          {caseStudies.map((cs) => {
            const isExpanded = expandedId === cs.id;

            return (
              <article key={cs.id} className="flex flex-col bg-panel p-6 hover:bg-[#211E18] transition-colors">
                <header className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="rounded border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber inline-block mb-1.5">
                      {cs.category}
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-text">{cs.title}</h2>
                  </div>
                  <span className="font-mono text-xs text-text-faint whitespace-nowrap">{cs.tag}</span>
                </header>

                <p className="font-sans text-xs text-text-dim leading-relaxed mb-4">
                  {cs.overview}
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 rounded border border-line-soft bg-panel-2 p-3 font-mono text-[11px] mb-4">
                  {cs.metadata.map((m) => (
                    <div key={m.label} className="flex flex-col">
                      <span className="text-[9px] text-text-faint">{m.label}</span>
                      <span className={m.status ? "text-verdigris font-semibold" : "text-text"}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : cs.id)}
                  className="flex items-center justify-between rounded border border-line bg-panel-2 px-3 py-2 font-mono text-xs text-amber hover:border-amber transition-colors mb-4"
                >
                  <span>{isExpanded ? "COLLAPSE SPECIFICATION" : "EXPAND FULL SPECIFICATION"}</span>
                  <span>{isExpanded ? "▴" : "▾"}</span>
                </button>

                {/* Expandable Technical Details */}
                {isExpanded && (
                  <div className="flex flex-col gap-4 border-t border-line-soft pt-4 font-sans text-xs text-text-dim leading-relaxed mb-4">
                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        1. ENGINEERING PROBLEM
                      </div>
                      <p>{cs.problem}</p>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        2. PROCESS DESCRIPTION
                      </div>
                      <p>{cs.process}</p>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        3. SENSORS &amp; ACTUATORS
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full font-mono text-[10px] border-collapse">
                          <thead>
                            <tr className="border-b border-line bg-panel-2 text-text-faint text-left">
                              <th className="p-1.5">DEVICE</th>
                              <th className="p-1.5">TAG</th>
                              <th className="p-1.5">SIGNAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cs.specs.map((s) => (
                              <tr key={s.tag} className="border-b border-line-soft">
                                <td className="p-1.5 text-text font-semibold">{s.device}</td>
                                <td className="p-1.5 text-amber">{s.tag}</td>
                                <td className="p-1.5 text-text-dim">{s.signal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        4. MATHEMATICAL MODEL
                      </div>
                      <div className="rounded border border-line-soft bg-panel-2 p-2 font-mono text-[11px] text-text">
                        {cs.model}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        5. CONTROL STRATEGY
                      </div>
                      <p>{cs.strategy}</p>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        6. SIMULATION RESULTS
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        {cs.results.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-mono text-[11px] font-semibold text-amber mb-1">
                        7. LESSONS LEARNED
                      </div>
                      <p>{cs.lessons}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3 font-mono text-xs">
                  <Link
                    href={cs.link ?? "/pid-lab"}
                    className="text-amber hover:text-text transition-colors font-semibold"
                  >
                    {cs.link ? "VIEW FULL CASE STUDY ⟶" : "OPEN IN PID LAB ⟶"}
                  </Link>
                  <span className="text-text-faint">{cs.ref}</span>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
