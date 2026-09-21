"use client";

import { useState, useRef } from "react";
import { loopScenarios, LoopScenario } from "@/lib/pid-trainer-data";

type InstrumentType = "sensor" | "transmitter" | "controller" | "valve" | "indicator";

interface PlacedNode {
  id: string;
  type: InstrumentType;
  tag: string;
  x: number;
  y: number;
}

interface Connection {
  fromId: string;
  toId: string;
  status?: "valid" | "invalid" | "unverified";
}

const paletteItems: Array<{ type: InstrumentType; label: string; defaultTag: string }> = [
  { type: "sensor", label: "PRIMARY SENSOR", defaultTag: "TE / LE / FE" },
  { type: "transmitter", label: "TRANSMITTER", defaultTag: "TT / LT / FT" },
  { type: "controller", label: "CONTROLLER", defaultTag: "TIC / LIC / FIC" },
  { type: "valve", label: "CONTROL VALVE", defaultTag: "TV / LV / FV" },
  { type: "indicator", label: "INDICATOR GAUGE", defaultTag: "TI / LI / FI" },
];

export default function LoopBuilderMode() {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [nodes, setNodes] = useState<PlacedNode[]>([
    // Sensible starting configuration
    { id: "node-1", type: "sensor", tag: "LE-101 (Sensor)", x: 120, y: 180 },
    { id: "node-2", type: "transmitter", tag: "LT-101 (Transmitter)", x: 280, y: 100 },
    { id: "node-3", type: "controller", tag: "LIC-101 (Controller)", x: 440, y: 180 },
    { id: "node-4", type: "valve", tag: "LV-101 (Valve)", x: 280, y: 260 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    checked: boolean;
    allCorrect: boolean;
    messages: string[];
  }>({ checked: false, allCorrect: false, messages: [] });

  const scenario: LoopScenario = loopScenarios[selectedScenarioIdx];
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Add instrument from palette
  const handleAddFromPalette = (type: InstrumentType, label: string) => {
    const newId = `node-${Date.now()}`;
    const defaultTag = `${label.slice(0, 3)}-${nodes.length + 101}`;
    // Position staggered in center
    const x = 200 + (nodes.length % 4) * 60;
    const y = 140 + (nodes.length % 3) * 50;

    setNodes((prev) => [...prev, { id: newId, type, tag: defaultTag, x, y }]);
    setValidationResult({ checked: false, allCorrect: false, messages: [] });
  };

  // Node Selection for Connecting
  const handleNodeClick = (nodeId: string) => {
    if (!selectedNodeId) {
      setSelectedNodeId(nodeId);
      return;
    }

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      return;
    }

    // Check if connection already exists between these two
    const exists = connections.some(
      (c) =>
        (c.fromId === selectedNodeId && c.toId === nodeId) ||
        (c.fromId === nodeId && c.toId === selectedNodeId)
    );

    if (!exists) {
      setConnections((prev) => [...prev, { fromId: selectedNodeId, toId: nodeId, status: "unverified" }]);
      setValidationResult({ checked: false, allCorrect: false, messages: [] });
    }

    setSelectedNodeId(null);
  };

  const removeConnection = (index: number) => {
    setConnections((prev) => prev.filter((_, i) => i !== index));
    setValidationResult({ checked: false, allCorrect: false, messages: [] });
  };

  const removeNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.fromId !== nodeId && c.toId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setValidationResult({ checked: false, allCorrect: false, messages: [] });
  };

  const clearWorkspace = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setValidationResult({ checked: false, allCorrect: false, messages: [] });
  };

  const resetToPreset = () => {
    setNodes([
      { id: "node-1", type: "sensor", tag: "Sensor", x: 120, y: 180 },
      { id: "node-2", type: "transmitter", tag: "Transmitter", x: 280, y: 100 },
      { id: "node-3", type: "controller", tag: "Controller", x: 440, y: 180 },
      { id: "node-4", type: "valve", tag: "Control Valve", x: 280, y: 260 },
    ]);
    setConnections([]);
    setSelectedNodeId(null);
    setValidationResult({ checked: false, allCorrect: false, messages: [] });
  };

  // Topology Validation
  const validateLoop = () => {
    const messages: string[] = [];
    let allValid = true;

    if (connections.length === 0) {
      setValidationResult({
        checked: true,
        allCorrect: false,
        messages: ["No connections drawn. Connect instruments to form a closed signal feedback loop."],
      });
      return;
    }

    // Check each connection against scenario requirements
    const updatedConns = connections.map((c) => {
      const fromNode = nodes.find((n) => n.id === c.fromId);
      const toNode = nodes.find((n) => n.id === c.toId);

      if (!fromNode || !toNode) {
        return { ...c, status: "invalid" as const };
      }

      // Check direct or reverse match against scenario's validConnections
      const isValid = scenario.validConnections.some(
        (v) =>
          (v.from === fromNode.type && v.to === toNode.type) ||
          (v.from === toNode.type && v.to === fromNode.type)
      );

      if (isValid) {
        return { ...c, status: "valid" as const };
      } else {
        allValid = false;
        messages.push(`Invalid connection between ${fromNode.type.toUpperCase()} and ${toNode.type.toUpperCase()}.`);
        return { ...c, status: "invalid" as const };
      }
    });

    setConnections(updatedConns);

    // Check if loop is complete (has all required stages)
    const presentTypes = new Set(nodes.map((n) => n.type));
    const missingTypes = scenario.requiredTypes.filter((t) => !presentTypes.has(t));

    if (missingTypes.length > 0) {
      allValid = false;
      messages.push(`Missing mandatory components: ${missingTypes.map((t) => t.toUpperCase()).join(", ")}.`);
    }

    if (connections.length < scenario.validConnections.length) {
      allValid = false;
      messages.push(
        `Incomplete loop topology: ${connections.length} of ${scenario.validConnections.length} required segments connected.`
      );
    }

    if (allValid && messages.length === 0) {
      messages.push("EXCELLENT // Valid closed-loop feedback topology verified according to ISA-5.1 standards!");
    }

    setValidationResult({
      checked: true,
      allCorrect: allValid && messages.length === 1,
      messages,
    });
  };

  return (
    <div className="bg-cf-panel border border-cf-line rounded p-5 md:p-7 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Scenario Selector & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cf-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cf-amber uppercase mb-1">
            <span>SCENARIO {selectedScenarioIdx + 1} OF {loopScenarios.length}</span>
            <span>·</span>
            <span className="text-cf-verdigris font-semibold">{scenario.complexity}</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-cf-text">
            {scenario.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {loopScenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenarioIdx(idx);
                resetToPreset();
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs font-semibold border transition-colors ${
                selectedScenarioIdx === idx
                  ? "bg-cf-amber text-cf-bg border-cf-amber"
                  : "bg-cf-panel-2 text-cf-text-dim border-cf-line hover:border-cf-amber-dim"
              }`}
            >
              LOOP {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Description & Goal */}
      <div className="bg-cf-panel-2 border border-cf-line-soft p-4 rounded text-xs font-mono">
        <div className="text-cf-amber font-bold mb-1">OBJECTIVE:</div>
        <p className="text-cf-text leading-relaxed mb-2 font-sans text-sm">
          {scenario.description}
        </p>
        <div className="text-cf-text-faint">
          <strong className="text-cf-amber font-mono">HINT:</strong> {scenario.hint}
        </div>
      </div>

      {/* Workspace Area: Left Palette + Center Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Symbol Palette */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-1">
            INSTRUMENT PALETTE
          </div>
          <p className="text-[11px] text-cf-text-faint font-mono mb-2">
            Click to spawn an instrument into the diagram workspace:
          </p>

          <div className="space-y-2">
            {paletteItems.map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddFromPalette(item.type, item.label)}
                className="w-full text-left p-3 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-amber text-cf-text transition-colors group flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs font-bold group-hover:text-cf-amber transition-colors">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-cf-text-faint">{item.defaultTag}</div>
                </div>
                <span className="text-cf-amber font-mono font-bold">+</span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-cf-line-soft space-y-2">
            <button
              onClick={resetToPreset}
              className="w-full py-2 rounded bg-cf-panel-2 border border-cf-line hover:border-cf-line-soft text-cf-text-dim text-xs font-mono"
            >
              ↺ RESET POSITIONS
            </button>
            <button
              onClick={clearWorkspace}
              className="w-full py-2 rounded bg-cf-panel-2 border border-cf-crimson/30 hover:border-cf-crimson text-cf-crimson text-xs font-mono"
            >
              CLEAR ALL
            </button>
          </div>
        </div>

        {/* Center SVG Interactive Canvas */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="relative w-full h-[380px] bg-[#18150F] rounded border border-cf-line overflow-hidden select-none">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-30 engineering-grid-bg" />

            {/* Instruction Overlay */}
            <div className="absolute top-3 left-4 z-10 font-mono text-[11px] text-cf-text-faint bg-cf-panel/90 px-2.5 py-1 rounded border border-cf-line-soft">
              {selectedNodeId ? (
                <span className="text-cf-amber font-bold animate-pulse">
                  » CLICK SECOND INSTRUMENT TO CONNECT WIRE
                </span>
              ) : (
                <span>CLICK AN INSTRUMENT TO INITIATE CONNECTION WIRE</span>
              )}
            </div>

            {/* SVG Connecting Lines Layer */}
            <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker id="arrow-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#FFB000" />
                </marker>
                <marker id="arrow-verdigris" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#4FA98A" />
                </marker>
                <marker id="arrow-crimson" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#D64550" />
                </marker>
              </defs>

              {connections.map((c, i) => {
                const fromNode = nodes.find((n) => n.id === c.fromId);
                const toNode = nodes.find((n) => n.id === c.toId);
                if (!fromNode || !toNode) return null;

                const color =
                  c.status === "valid" ? "#4FA98A" : c.status === "invalid" ? "#D64550" : "#FFB000";
                const marker =
                  c.status === "valid"
                    ? "url(#arrow-verdigris)"
                    : c.status === "invalid"
                    ? "url(#arrow-crimson)"
                    : "url(#arrow-amber)";

                return (
                  <g key={i}>
                    {/* Glow outline */}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={color}
                      strokeWidth="5"
                      strokeOpacity="0.2"
                    />
                    {/* Primary wire line */}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray={c.status === "invalid" ? "4 3" : "none"}
                      markerEnd={marker}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Placed Interactive Instrument Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              let icon = "⭕";
              let badge = "INS";

              if (node.type === "sensor") {
                icon = "⨁";
                badge = "PRIMARY ELEMENT";
              } else if (node.type === "transmitter") {
                icon = "⟲";
                badge = "TRANSMITTER";
              } else if (node.type === "controller") {
                icon = "⚙";
                badge = "CONTROLLER";
              } else if (node.type === "valve") {
                icon = "⧓";
                badge = "CONTROL VALVE";
              } else if (node.type === "indicator") {
                icon = "⏱";
                badge = "INDICATOR";
              }

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  style={{ left: node.x - 45, top: node.y - 45 }}
                  className={`absolute w-[90px] h-[90px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-100 z-10 group ${
                    isSelected
                      ? "ring-2 ring-cf-amber scale-105 shadow-[0_0_15px_rgba(255,176,0,0.35)]"
                      : "hover:scale-105"
                  }`}
                >
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => removeNode(node.id, e)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cf-crimson text-white text-[10px] font-mono flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove instrument"
                  >
                    ✕
                  </button>

                  {/* SVG Glyph Bubble */}
                  <div className="w-16 h-16 rounded-full bg-cf-panel border-2 border-cf-amber flex flex-col items-center justify-center shadow-md">
                    <span className="text-base">{icon}</span>
                    <span className="font-mono text-[9px] font-bold text-cf-amber uppercase truncate max-w-[55px]">
                      {node.type}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-cf-text font-bold mt-1 bg-cf-panel-2 px-1.5 py-0.5 rounded border border-cf-line-soft">
                    {node.tag}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Bar & Validation Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-cf-panel-2 p-4 rounded border border-cf-line">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cf-text-faint">PLACED:</span>
              <span className="text-cf-text font-bold">{nodes.length} INSTRUMENTS</span>
              <span className="text-cf-text-faint">·</span>
              <span className="text-cf-text font-bold">{connections.length} WIRES</span>
            </div>

            <button
              onClick={validateLoop}
              className="px-6 py-2.5 rounded bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm"
            >
              ✓ CHECK MY LOOP TOPOLOGY
            </button>
          </div>

          {/* Validation Feedback Display */}
          {validationResult.checked && (
            <div
              className={`p-5 rounded border animate-fadeIn ${
                validationResult.allCorrect
                  ? "bg-cf-verdigris/15 border-cf-verdigris text-cf-text"
                  : "bg-cf-crimson/15 border-cf-crimson text-cf-text"
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold mb-2">
                {validationResult.allCorrect ? (
                  <span className="text-cf-verdigris flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cf-verdigris" />
                    STATUS: TOPOLOGY VERIFIED &amp; ACCEPTED
                  </span>
                ) : (
                  <span className="text-cf-crimson flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cf-crimson" />
                    STATUS: TOPOLOGY DEFECT DETECTED
                  </span>
                )}
              </div>

              <ul className="space-y-1 text-xs font-mono">
                {validationResult.messages.map((msg, i) => (
                  <li
                    key={i}
                    className={
                      validationResult.allCorrect
                        ? "text-cf-verdigris font-semibold"
                        : "text-cf-text-dim"
                    }
                  >
                    » {msg}
                  </li>
                ))}
              </ul>

              {validationResult.allCorrect && selectedScenarioIdx + 1 < loopScenarios.length && (
                <div className="mt-4 pt-3 border-t border-cf-verdigris/30 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedScenarioIdx((prev) => prev + 1);
                      resetToPreset();
                    }}
                    className="px-4 py-1.5 rounded bg-cf-verdigris text-cf-bg font-mono font-bold text-xs uppercase tracking-wider"
                  >
                    PROCEED TO SCENARIO {selectedScenarioIdx + 2} ⟶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
