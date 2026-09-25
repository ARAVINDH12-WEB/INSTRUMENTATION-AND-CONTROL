"use client";

import React, { useRef, useEffect, useState } from "react";

export interface SimulatorJack {
  id: string;
  name: string;
  shortName: string;
  accent: string;
  path: string;
  description: string;
}

export const SIMULATORS: SimulatorJack[] = [
  {
    id: "tank-level",
    name: "Tank Level",
    shortName: "TANK",
    accent: "#FFB000", // --amber
    path: "/pid-lab",
    description: "Discrete Gravity Tank Process (Primary Benchmark)",
  },
  {
    id: "temperature",
    name: "Temperature",
    shortName: "TEMP",
    accent: "#FF6B4A", // --ember
    path: "/pid-lab/temperature",
    description: "Thermal Heat Exchanger System with Delay",
  },
  {
    id: "motor",
    name: "DC Motor",
    shortName: "MOTOR",
    accent: "#5B9BD5", // --steel
    path: "/pid-lab/motor",
    description: "Rotational Speed & Velocity Servo Control",
  },
  {
    id: "second-order",
    name: "Second-Order",
    shortName: "2ND-ORD",
    accent: "#9D7FE8", // --violet
    path: "/pid-lab/second-order",
    description: "Mass-Spring-Damper Underdamped Dynamics",
  },
];

interface PatchCableSelectorProps {
  activeSimId?: string;
  onSelectSim?: (simId: string) => void;
  className?: string;
}

export default function PatchCableSelector({
  activeSimId = "tank-level",
  onSelectSim,
  className = "",
}: PatchCableSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jackRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const destRef = useRef<HTMLDivElement>(null);

  const [cableCoords, setCableCoords] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Update coords when mounted or resized or when activeSimId changes
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentBtn = jackRefs.current[activeSimId];
    const destEl = destRef.current;

    if (currentBtn && destEl) {
      const btnRect = currentBtn.getBoundingClientRect();
      const destRect = destEl.getBoundingClientRect();

      setCableCoords({
        x1: btnRect.left + btnRect.width / 2 - containerRect.left,
        y1: btnRect.top + btnRect.height / 2 - containerRect.top,
        x2: destRect.left + destRect.width / 2 - containerRect.left,
        y2: destRect.top + destRect.height / 2 - containerRect.top,
      });
    }
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener("resize", updateCoords);
    return () => window.removeEventListener("resize", updateCoords);
  }, [activeSimId]);

  const handleJackClick = (sim: SimulatorJack) => {
    if (onSelectSim) {
      onSelectSim(sim.id);
    }
  };

  const activeSim = SIMULATORS.find((s) => s.id === activeSimId) || SIMULATORS[0];

  return (
    <div
      ref={containerRef}
      className={`relative rounded border border-[#302B22] bg-[#14120E] p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#241F18] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_6px]"
            style={{
              backgroundColor: activeSim.accent,
              boxShadow: `0 0 8px ${activeSim.accent}`,
            }}
          />
          <h4 className="font-panel-heading text-xs font-bold tracking-wider text-text uppercase">
            SIMULATOR BUS ROUTING MATRIX
          </h4>
          <span className="font-mono text-[10px] text-text-faint px-1.5 py-0.5 rounded bg-[#1B1813] border border-[#2B251D]">
            LIVE MODEL SWAP
          </span>
        </div>
        <div className="font-mono text-[10px] text-text-dim flex items-center gap-2">
          <span>ACTIVE PROCESS:</span>
          <span
            className="font-bold px-2 py-0.5 rounded border transition-colors duration-200"
            style={{
              color: activeSim.accent,
              borderColor: `${activeSim.accent}40`,
              backgroundColor: `${activeSim.accent}15`,
            }}
          >
            {activeSim.name.toUpperCase()} MODEL
          </span>
        </div>
      </div>

      {/* Jack Sockets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
        {SIMULATORS.map((sim) => {
          const isSelected = activeSimId === sim.id;
          return (
            <div
              key={sim.id}
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all ${
                isSelected
                  ? "bg-[#1E1B15] border-[#453D30] shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                  : "bg-[#12100C] border-[#221D16] hover:border-[#383125] opacity-80 hover:opacity-100"
              }`}
            >
              <div className="text-[10px] font-mono font-medium text-text-dim mb-1 text-center truncate max-w-full">
                {sim.name}
              </div>

              {/* 1/4" Hardware Jack */}
              <button
                ref={(el) => {
                  jackRefs.current[sim.id] = el;
                }}
                type="button"
                onClick={() => handleJackClick(sim)}
                title={`Click to route signal cable to ${sim.name} (swaps process model in-place)`}
                className="relative group w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, #443B30 0%, #201C16 70%, #100E0B 100%)",
                  boxShadow: `
                    0 2px 6px rgba(0,0,0,0.8),
                    inset 0 1px 1px rgba(255,255,255,0.15),
                    0 0 0 2px ${isSelected ? sim.accent : "#2C261E"}
                  `,
                }}
              >
                {/* Metallic Knurled Hex Nut */}
                <div
                  className="absolute inset-1 rounded-full border border-dashed border-[#554A3B] opacity-50 pointer-events-none"
                />

                {/* Inner Socket Hole */}
                <div
                  className="w-5 h-5 rounded-full bg-[#080706] flex items-center justify-center pointer-events-none"
                  style={{
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.95)",
                    border: `1.5px solid ${isSelected ? sim.accent : "#3A3328"}`,
                  }}
                >
                  {/* Pin center contact */}
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? sim.accent : "#1A1713",
                      boxShadow: isSelected ? `0 0 6px ${sim.accent}` : "none",
                    }}
                  />
                </div>

                {/* Plug Inserted State Indicator */}
                {isSelected && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#14120E] animate-pulse"
                    style={{
                      backgroundColor: sim.accent,
                      boxShadow: `0 0 6px ${sim.accent}`,
                    }}
                  />
                )}
              </button>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center gap-1 font-mono text-[9px]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? sim.accent : "#3A3225",
                  }}
                />
                <span style={{ color: isSelected ? sim.accent : "#6A6052" }}>
                  {isSelected ? "PLUGGED" : "UNPATCHED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Knob Bank Input Patch Point */}
      <div className="mt-3 pt-2.5 border-t border-[#221D16] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            ref={destRef}
            className="w-6 h-6 rounded-full bg-[#181510] border border-[#3C3428] flex items-center justify-center shadow-inner"
            title="Knob Bank Signal Input"
          >
            <div
              className="w-2.5 h-2.5 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: activeSim.accent,
                boxShadow: `0 0 6px ${activeSim.accent}`,
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-text-dim">
            KNOB BANK CONTROL BUS INPUT (TERMINAL A &amp; B)
          </span>
        </div>

        <span className="font-mono text-[10px] text-text-faint">
          Click any jack to re-route plant physics without losing gains
        </span>
      </div>

      {/* SVG Patch Cable Overlay */}
      {cableCoords && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
          <defs>
            <filter id="cableShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Natural Catenary Sag Curve */}
          {(() => {
            const { x1, y1, x2, y2 } = cableCoords;
            const midX = (x1 + x2) / 2;
            const sagY = Math.max(y1, y2) + 26; // Sag downward

            const pathD = `M ${x1} ${y1} Q ${midX} ${sagY} ${x2} ${y2}`;

            return (
              <g filter="url(#cableShadow)" className="transition-all duration-300">
                {/* Cable outer jacket */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#100E0B"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {/* Cable colored silicone jacket */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeSim.accent}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 4px ${activeSim.accent}90)`,
                  }}
                />
                {/* Cable highlight core */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                {/* Plug 1 Strain Relief */}
                <circle cx={x1} cy={y1} r="5" fill="#201C16" stroke={activeSim.accent} strokeWidth="1.5" />
                {/* Plug 2 Strain Relief */}
                <circle cx={x2} cy={y2} r="5" fill="#201C16" stroke={activeSim.accent} strokeWidth="1.5" />
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  );
}
