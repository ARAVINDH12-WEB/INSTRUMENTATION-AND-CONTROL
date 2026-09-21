/**
 * ControlForge P&ID & Loop Diagram Trainer Data
 * Standards: ISA-5.1 (Instrumentation Symbols and Identification)
 */

export interface TagQuizQuestion {
  id: string;
  tag: string;
  question: string;
  options: string[];
  correctIndex: number;
  breakdown: {
    firstLetter: string;
    firstLetterMeaning: string;
    succeedingLetters: string;
    succeedingLettersMeaning: string;
    loopNumber: string;
  };
  explanation: string;
}

export const tagQuizBank: TagQuizQuestion[] = [
  {
    id: "Q01",
    tag: "PT-101",
    question: "What industrial instrument does the tag PT-101 designate according to ISA-5.1?",
    options: [
      "Pressure Transmitter",
      "Pneumatic Timer",
      "Proportional Temperature Controller",
      "Pressure Totalizer",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "P",
      firstLetterMeaning: "Pressure (Measured Variable)",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter (Readout/Output Function)",
      loopNumber: "101",
    },
    explanation: "Per ISA-5.1 Table 1: First letter 'P' denotes Pressure. Succeeding letter 'T' denotes a Transmitter converting physical force into 4-20mA or digital bus signal.",
  },
  {
    id: "Q02",
    tag: "TIC-330",
    question: "What function and variable does the tag TIC-330 represent?",
    options: [
      "Temperature Indicating Controller",
      "Totalizer with Integral Counter",
      "Thermal Insulation Calibrator",
      "Temperature Indicator with Continuous Chart",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "T",
      firstLetterMeaning: "Temperature (Measured Variable)",
      succeedingLetters: "IC",
      succeedingLettersMeaning: "Indicating Controller (Dual Function)",
      loopNumber: "330",
    },
    explanation: "First letter 'T' indicates Temperature. 'I' provides a visual indication (display/readout), and 'C' performs automatic closed-loop control computation.",
  },
  {
    id: "Q03",
    tag: "FV-204",
    question: "How is an instrument tagged FV-204 classified in a piping & instrumentation diagram?",
    options: [
      "Flow Venturi",
      "Flow Control Valve",
      "Frequency Variator",
      "Float Vacuum Breaker",
    ],
    correctIndex: 1,
    breakdown: {
      firstLetter: "F",
      firstLetterMeaning: "Flow Rate (Measured Variable)",
      succeedingLetters: "V",
      succeedingLettersMeaning: "Valve / Final Control Element",
      loopNumber: "204",
    },
    explanation: "First letter 'F' designates Flow. Succeeding letter 'V' indicates a Valve (typically a globe, ball, or butterfly valve with pneumatic or electric actuator).",
  },
  {
    id: "Q04",
    tag: "LT-105",
    question: "What is the primary role of instrument LT-105 in a process vessel?",
    options: [
      "Level Transmitter",
      "Light Thermostat",
      "Low Torque Transducer",
      "Line Tension Meter",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "L",
      firstLetterMeaning: "Level (Liquid or Solid Height)",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter",
      loopNumber: "105",
    },
    explanation: "First letter 'L' is Level. 'T' is Transmitter (e.g. differential pressure cell, guided wave radar, or ultrasonic sensor measuring liquid elevation).",
  },
  {
    id: "Q05",
    tag: "PIC-112",
    question: "What is the complete identity of instrument PIC-112?",
    options: [
      "Pressure Indicating Controller",
      "Process Interface Card",
      "Pneumatic Ignition Circuit",
      "Phase Impedance Checker",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "P",
      firstLetterMeaning: "Pressure",
      succeedingLetters: "IC",
      succeedingLettersMeaning: "Indicating Controller",
      loopNumber: "112",
    },
    explanation: "First letter 'P' = Pressure. Succeeding letters 'I' = Indicator and 'C' = Controller, typically executing a PID loop on a DCS or standalone faceplate.",
  },
  {
    id: "Q06",
    tag: "TT-201A",
    question: "In tag TT-201A, what does the suffix 'A' designate?",
    options: [
      "Alarm state",
      "Parallel or redundant sensor in loop 201",
      "Analog signal type",
      "Area 01 classification",
    ],
    correctIndex: 1,
    breakdown: {
      firstLetter: "T",
      firstLetterMeaning: "Temperature",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter",
      loopNumber: "201A (Redundant Instrument)",
    },
    explanation: "A letter suffix (A, B, C) added to a loop number designates redundant, paired, or voting instruments measuring the identical process location (e.g. dual Pt100 RTDs).",
  },
  {
    id: "Q07",
    tag: "LIC-101",
    question: "Identify the device marked LIC-101 on a distillation column reboiler:",
    options: [
      "Level Indicating Controller",
      "Loop Interlock Component",
      "Liquid Injection Calibrator",
      "Low Inductance Coil",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "L",
      firstLetterMeaning: "Level",
      succeedingLetters: "IC",
      succeedingLettersMeaning: "Indicating Controller",
      loopNumber: "101",
    },
    explanation: "First letter 'L' = Level. 'IC' = Indicating Controller. In reboilers and buffer vessels, LIC maintains level setpoint by modulating draw-off or feed valves.",
  },
  {
    id: "Q08",
    tag: "TE-302",
    question: "How does TE-302 differ from TT-302 in an ISA-5.1 loop diagram?",
    options: [
      "TE is the raw primary sensing element (e.g. bare RTD/thermocouple), whereas TT contains the signal conditioning transmitter.",
      "TE indicates an Emergency Transmitter.",
      "TE is for electrical resistance only, TT is for thermowells.",
      "There is no difference; the tags are completely interchangeable.",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "T",
      firstLetterMeaning: "Temperature",
      succeedingLetters: "E",
      succeedingLettersMeaning: "Element (Primary Sensing Element)",
      loopNumber: "302",
    },
    explanation: "ISA-5.1 uses letter 'E' for the primary Element (the physical thermocouple wire or RTD crystal) and 'T' for the Transmitter that amplifies the millivolt/ohm signal to 4-20mA.",
  },
  {
    id: "Q09",
    tag: "PSH-501",
    question: "What operation does PSH-501 perform when process pressure escalates?",
    options: [
      "Trips a discrete electrical switch contact when pressure reaches a High threshold",
      "Controls a pneumatic safety head",
      "Proportionally sounds a high-frequency alarm",
      "Supplies hydraulic pressure to loop 501",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "P",
      firstLetterMeaning: "Pressure",
      succeedingLetters: "S",
      succeedingLettersMeaning: "Switch (Discrete On/Off)",
      loopNumber: "501 (Modifier H = High threshold)",
    },
    explanation: "First letter 'P' = Pressure. 'S' = Switch (discrete contact closure, not a continuous 4-20mA signal). 'H' modifier = High trip threshold.",
  },
  {
    id: "Q10",
    tag: "LSL-102",
    question: "A float switch inside a sump pump pit is tagged LSL-102. What does LSL denote?",
    options: [
      "Level Switch Low",
      "Liquid Suction Line",
      "Linear Stroke Limit",
      "Level Safety Lock",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "L",
      firstLetterMeaning: "Level",
      succeedingLetters: "S",
      succeedingLettersMeaning: "Switch",
      loopNumber: "102 (Modifier L = Low)",
    },
    explanation: "First letter 'L' = Level. 'S' = Switch. 'L' modifier = Low level trip point (often wired to prevent pump cavitation/dry running).",
  },
  {
    id: "Q11",
    tag: "AT-601",
    question: "An instrument tagged AT-601 on an effluent line measures which process property?",
    options: [
      "Analytical property (e.g. pH, conductivity, dissolved oxygen, or turbidity)",
      "Ambient Temperature",
      "Air Tightness",
      "Acoustic Transmission",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "A",
      firstLetterMeaning: "Analysis (Chemical/Physical Composition)",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter",
      loopNumber: "601",
    },
    explanation: "First letter 'A' is reserved in ISA-5.1 for Analysis instruments (spectrometers, gas chromatographs, pH probes, conductivity transmitters).",
  },
  {
    id: "Q12",
    tag: "FIC-205",
    question: "What equipment interacts directly with an operator setpoint input on FIC-205?",
    options: [
      "Flow Indicating Controller",
      "Feedwater Injection Cylinder",
      "Flow Interlock Circuit",
      "Frequency Isolator",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "F",
      firstLetterMeaning: "Flow Rate",
      succeedingLetters: "IC",
      succeedingLettersMeaning: "Indicating Controller",
      loopNumber: "205",
    },
    explanation: "First letter 'F' = Flow. 'IC' = Indicating Controller. Displays instantaneous flow rate and modulates an actuator (FV) to maintain target flow.",
  },
  {
    id: "Q13",
    tag: "TV-301",
    question: "What physical component does TV-301 identify on a steam injection line?",
    options: [
      "Temperature Control Valve",
      "Thermal Vent",
      "Turbine Vane",
      "Time Variable Positioner",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "T",
      firstLetterMeaning: "Temperature",
      succeedingLetters: "V",
      succeedingLettersMeaning: "Valve",
      loopNumber: "301",
    },
    explanation: "'T' = Temperature, 'V' = Valve. A control valve modulated by a temperature controller (TIC) to throttle steam, hot oil, or coolant.",
  },
  {
    id: "Q14",
    tag: "DPT-108",
    question: "DPT-108 (or PDT-108) is connected across an orifice plate. What is its exact function?",
    options: [
      "Differential Pressure Transmitter",
      "Digital Pulse Tachometer",
      "Direct Pipeline Thermometer",
      "Discharge Pneumatic Throttle",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "DP / PD",
      firstLetterMeaning: "Differential Pressure",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter",
      loopNumber: "108",
    },
    explanation: "Letter 'D' modifies 'P' to denote Differential Pressure. 'T' transmits the measured head loss (delta P) for flow or hydrostatic level calculations.",
  },
  {
    id: "Q15",
    tag: "ZT-701",
    question: "In ISA-5.1, what variable does letter 'Z' represent in tag ZT-701?",
    options: [
      "Position, Dimension, or Valve Stem Travel",
      "Zero Drift Correction",
      "Zone Thermal Classification",
      "Zinc Concentration",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "Z",
      firstLetterMeaning: "Position / Dimension / Travel",
      succeedingLetters: "T",
      succeedingLettersMeaning: "Transmitter",
      loopNumber: "701",
    },
    explanation: "Letter 'Z' is designated by ISA-5.1 for Position, Dimension, or Travel. ZT-701 transmits physical stem displacement (0-100% stroke) back to DCS.",
  },
  {
    id: "Q16",
    tag: "LAH-104",
    question: "An annunciator horn triggers on LAH-104. What condition does this signify?",
    options: [
      "Level Alarm High",
      "Low Airflow Hazard",
      "Liquid Acid Heater",
      "Level Accumulator Header",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "L",
      firstLetterMeaning: "Level",
      succeedingLetters: "A",
      succeedingLettersMeaning: "Alarm",
      loopNumber: "104 (Modifier H = High)",
    },
    explanation: "'L' = Level, 'A' = Alarm, 'H' = High modifier. Alerts operations that tank liquid level has breached the upper safety advisory limit.",
  },
  {
    id: "Q17",
    tag: "FCV-401",
    question: "How does FCV-401 differ conceptually from FV-401?",
    options: [
      "FCV explicitly specifies 'Flow Control Valve', though under ISA-5.1 both tags are widely used to designate the identical final control element.",
      "FCV indicates a check valve, while FV is a globe valve.",
      "FCV is purely manual; FV is automatic.",
      "FCV is installed on vapor lines, FV on liquid lines.",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "F",
      firstLetterMeaning: "Flow",
      succeedingLetters: "CV / V",
      succeedingLettersMeaning: "Control Valve",
      loopNumber: "401",
    },
    explanation: "Both FV (Flow Valve) and FCV (Flow Control Valve) represent modulated control valves. ISA-5.1 prefers FV for brevity, but FCV is standard across EPC contract drawings.",
  },
  {
    id: "Q18",
    tag: "PDIC-220",
    question: "What instrument monitors and controls filter bed clogs using tag PDIC-220?",
    options: [
      "Differential Pressure Indicating Controller",
      "Proportional Derivative Integral Circuit",
      "Positive Displacement Inlet Compressor",
      "Pneumatic Diaphragm Isolator Clamp",
    ],
    correctIndex: 0,
    breakdown: {
      firstLetter: "PD",
      firstLetterMeaning: "Differential Pressure",
      succeedingLetters: "IC",
      succeedingLettersMeaning: "Indicating Controller",
      loopNumber: "220",
    },
    explanation: "'PD' = Differential Pressure, 'I' = Indicator, 'C' = Controller. PDIC modulates backwash valves based on delta-P across strainers and filter banks.",
  },
];

// --- Mode 2: Loop Builder Scenarios ---

export interface LoopScenario {
  id: string;
  title: string;
  complexity: "Basic Single-Loop" | "Standard Feedback" | "Advanced Cascade";
  description: string;
  requiredTypes: Array<"sensor" | "transmitter" | "controller" | "valve" | "indicator">;
  validConnections: Array<{ from: string; to: string; description: string }>;
  forbiddenConnections?: Array<{ from: string; to: string; reason: string }>;
  hint: string;
}

export const loopScenarios: LoopScenario[] = [
  {
    id: "SCEN-01",
    title: "Tank Level Feedback Control Loop (LIC-101)",
    complexity: "Basic Single-Loop",
    description: "Measure liquid level inside buffer tank TK-101 using a level sensor (LE-101) & transmitter (LT-101), send 4-20mA current to indicating controller (LIC-101), which throttles pneumatic inlet valve (LV-101) to maintain level setpoint.",
    requiredTypes: ["sensor", "transmitter", "controller", "valve"],
    validConnections: [
      { from: "sensor", to: "transmitter", description: "Primary sensor deflection mV/capacitance to transmitter" },
      { from: "transmitter", to: "controller", description: "4–20 mA PV signal to LIC-101 controller" },
      { from: "controller", to: "valve", description: "Controller output (MV / 3–15 psi or 4–20 mA) to LV-101 valve" },
      { from: "valve", to: "sensor", description: "Inflow from valve physically alters vessel level measured by sensor" },
    ],
    hint: "Signal flow follows a closed loop: Sensor (LE) ⟶ Transmitter (LT) ⟶ Controller (LIC) ⟶ Control Valve (LV) ⟶ Process Feedback.",
  },
  {
    id: "SCEN-02",
    title: "Orifice Reflux Flow Control Loop (FIC-201)",
    complexity: "Standard Feedback",
    description: "Measure orifice differential pressure across reflux line with primary element (FE-201) and transmitter (FT-201), compute PID response in flow controller (FIC-201), and modulate control valve (FV-201) with fluid feedback.",
    requiredTypes: ["sensor", "transmitter", "controller", "valve"],
    validConnections: [
      { from: "sensor", to: "transmitter", description: "Differential pressure impulses to FT-201" },
      { from: "transmitter", to: "controller", description: "4-20mA Flow rate signal to FIC-201" },
      { from: "controller", to: "valve", description: "Controller command to FV-201 actuator" },
      { from: "valve", to: "sensor", description: "Valve throttling directly alters orifice flow rate (process feedback)" },
    ],
    hint: "Remember: Controllers cannot command transmitters directly; controllers command final control elements (valves) which alter the physical process.",
  },
  {
    id: "SCEN-03",
    title: "Cascade Control: Tank Level Master to Flow Slave (LIC/FIC-301)",
    complexity: "Advanced Cascade",
    description: "Construct a high-performance cascade loop: Master Level Controller (LIC-301) receives level from (LT-301) and dynamically computes the Remote Setpoint (RSP) for Slave Flow Controller (FIC-301). Flow transmitter (FT-301) feeds the inner loop, and FIC-301 directly commands valve (FV-301).",
    requiredTypes: ["sensor", "transmitter", "controller", "valve"],
    validConnections: [
      { from: "sensor", to: "transmitter", description: "Level sensing to LT-301" },
      { from: "transmitter", to: "controller", description: "LT-301 feeds Master Level Controller (LIC-301)" },
      { from: "controller", to: "valve", description: "Controller command path to final actuator" },
      { from: "valve", to: "sensor", description: "Flow updates tank inventory (physical feedback)" },
    ],
    hint: "In cascade control, the primary master controller output becomes the remote setpoint for the inner slave controller.",
  },
];

// --- Mode 3: Process-to-Diagram Conversion Data ---

export interface DiagramTemplate {
  id: string;
  name: string;
  category: string;
  svgType: "pressure_vent" | "level_drawoff" | "temp_furnace" | "flow_bypass";
}

export interface TagSlot {
  slotId: string;
  role: string;
  correctTag: string;
  options: string[];
}

export interface ConversionScenario {
  id: string;
  title: string;
  processDescription: string;
  correctTemplateId: string;
  templates: DiagramTemplate[];
  tagSlots: TagSlot[];
  explanation: string;
}

export const conversionScenarios: ConversionScenario[] = [
  {
    id: "CONV-01",
    title: "Exothermic Reactor Vapor Pressure Venting",
    processDescription:
      "An exothermic batch reactor operates under pressurized nitrogen blanket. Rising vapor pressure must be sensed at the vessel dome, monitored by an indicating controller on the DCS, and modulated by an automated vapor vent valve discharging to the flare header. An independent high-pressure switch trips an emergency vent interlock if pressure exceeds safety margins.",
    correctTemplateId: "TMPL-PRESS-VENT",
    templates: [
      {
        id: "TMPL-PRESS-VENT",
        name: "Vapor Pressure Relief & Throttle Control (Dome Tap)",
        category: "Pressure Regulation",
        svgType: "pressure_vent",
      },
      {
        id: "TMPL-LEVEL-DRAWOFF",
        name: "Condensate Boot Liquid Level Drawoff Control",
        category: "Level Regulation",
        svgType: "level_drawoff",
      },
      {
        id: "TMPL-FLOW-BYPASS",
        name: "Centrifugal Pump Minimum Flow Recycle Bypass",
        category: "Flow Regulation",
        svgType: "flow_bypass",
      },
    ],
    tagSlots: [
      {
        slotId: "slot-transmitter",
        role: "Primary Pressure Transmitter (Dome Tap)",
        correctTag: "PT-202",
        options: ["PT-202", "LT-202", "TT-202", "FT-202"],
      },
      {
        slotId: "slot-controller",
        role: "DCS Pressure Indicating Controller",
        correctTag: "PIC-202",
        options: ["PIC-202", "LIC-202", "TIC-202", "FIC-202"],
      },
      {
        slotId: "slot-valve",
        role: "Vapor Vent Flare Control Valve",
        correctTag: "PV-202",
        options: ["PV-202", "LV-202", "TV-202", "FV-202"],
      },
      {
        slotId: "slot-switch",
        role: "High-Pressure Emergency Trip Switch",
        correctTag: "PSH-202",
        options: ["PSH-202", "LSL-202", "TSH-202", "FSL-202"],
      },
    ],
    explanation:
      "Correct template selection represents top-of-vessel vapor pressure relief. Tags adhere to 'P' for pressure: PT (transmitter), PIC (controller), PV (vent valve), and PSH (pressure switch high).",
  },
  {
    id: "CONV-02",
    title: "Reboiler Condensate Seal Level Control",
    processDescription:
      "A shell-and-tube reboiler produces hot condensate that pools in a bottom receiver boot. Liquid height must be maintained above the discharge nozzle to prevent live steam blow-by into the low-pressure condensate header. A hydrostatic transmitter senses column height, a level controller calculates valve command, and a pneumatic control valve drains liquid to the sewer. A low-level interlock switch protects against dry-out.",
    correctTemplateId: "TMPL-LEVEL-DRAWOFF",
    templates: [
      {
        id: "TMPL-LEVEL-DRAWOFF",
        name: "Condensate Boot Liquid Level Drawoff Control",
        category: "Level Regulation",
        svgType: "level_drawoff",
      },
      {
        id: "TMPL-PRESS-VENT",
        name: "Vapor Pressure Relief & Throttle Control",
        category: "Pressure Regulation",
        svgType: "pressure_vent",
      },
      {
        id: "TMPL-FURNACE",
        name: "Fired Heater Fuel Gas Temperature Control",
        category: "Thermal Regulation",
        svgType: "temp_furnace",
      },
    ],
    tagSlots: [
      {
        slotId: "slot-transmitter",
        role: "Hydrostatic Level Transmitter",
        correctTag: "LT-305",
        options: ["LT-305", "PT-305", "FT-305", "TT-305"],
      },
      {
        slotId: "slot-controller",
        role: "Level Indicating Controller (LIC)",
        correctTag: "LIC-305",
        options: ["LIC-305", "PIC-305", "FIC-305", "TIC-305"],
      },
      {
        slotId: "slot-valve",
        role: "Condensate Drain Control Valve",
        correctTag: "LV-305",
        options: ["LV-305", "PV-305", "FV-305", "TV-305"],
      },
      {
        slotId: "slot-switch",
        role: "Low-Level Seal Failure Switch",
        correctTag: "LSL-305",
        options: ["LSL-305", "PSH-305", "TSH-305", "FSH-305"],
      },
    ],
    explanation:
      "Correct template selection represents bottom vessel liquid drainage. Tags strictly utilize 'L' for level: LT (transmitter), LIC (controller), LV (drain valve), and LSL (level switch low).",
  },
  {
    id: "CONV-03",
    title: "Cracking Furnace Process Temperature Control",
    processDescription:
      "A radiant cracking furnace heats petroleum hydrocarbons. Process exit temperature is measured by a thermowell-mounted sensor and transmitter, sending data to a temperature indicating controller. The controller throttles a fuel gas control valve on the burner fuel manifold. An independent high-temperature switch cuts fuel gas on excessive stack temperatures.",
    correctTemplateId: "TMPL-FURNACE",
    templates: [
      {
        id: "TMPL-FURNACE",
        name: "Fired Heater Fuel Gas Temperature Control",
        category: "Thermal Regulation",
        svgType: "temp_furnace",
      },
      {
        id: "TMPL-LEVEL-DRAWOFF",
        name: "Condensate Boot Liquid Level Drawoff Control",
        category: "Level Regulation",
        svgType: "level_drawoff",
      },
      {
        id: "TMPL-FLOW-BYPASS",
        name: "Centrifugal Pump Minimum Flow Bypass",
        category: "Flow Regulation",
        svgType: "flow_bypass",
      },
    ],
    tagSlots: [
      {
        slotId: "slot-transmitter",
        role: "Process Exit Temperature Transmitter",
        correctTag: "TT-410",
        options: ["TT-410", "PT-410", "FT-410", "LT-410"],
      },
      {
        slotId: "slot-controller",
        role: "Temperature Indicating Controller",
        correctTag: "TIC-410",
        options: ["TIC-410", "PIC-410", "FIC-410", "LIC-410"],
      },
      {
        slotId: "slot-valve",
        role: "Fuel Gas Burner Throttle Valve",
        correctTag: "TV-410",
        options: ["TV-410", "PV-410", "FV-410", "LV-410"],
      },
      {
        slotId: "slot-switch",
        role: "High Stack Temperature Safety Switch",
        correctTag: "TSH-410",
        options: ["TSH-410", "PSH-410", "LSL-410", "FSH-410"],
      },
    ],
    explanation:
      "Correct template selection represents furnace burner firing with thermal feedback. Tags utilize 'T' for temperature: TT (transmitter), TIC (controller), TV (fuel valve), and TSH (temperature switch high).",
  },
];


