"use client";

import { useMemo } from "react";
import { DESState, Item } from "@/lib/des-warehouse";

interface WarehouseDiagramProps {
  state: DESState;
  displayTime: number; // Current playback/display time in simulated seconds
}

export default function WarehouseDiagram({ state, displayTime }: WarehouseDiagramProps) {
  const { stations, itemsInSystem, config } = state;

  // Track items in transit for smooth conveyor interpolation
  const transitItems = useMemo(() => {
    const list: Array<{
      item: Item;
      fromIdx: number;
      toIdx: number;
      progress: number;
    }> = [];

    itemsInSystem.forEach((item) => {
      if (item.state === "TRANSIT") {
        const total = Math.max(0.01, item.transitEndTime - item.transitStartTime);
        const elapsed = displayTime - item.transitStartTime;
        const progress = Math.min(1.0, Math.max(0.0, elapsed / total));
        list.push({
          item,
          fromIdx: item.fromStationIndex,
          toIdx: item.toStationIndex,
          progress,
        });
      }
    });

    return list;
  }, [itemsInSystem, displayTime]);

  // Dimensions of diagram
  const svgWidth = 960;
  const svgHeight = 280;

  // Station physical positions (X coordinates for the 3 stations)
  const stationWidth = 140;
  const stationHeight = 150;
  const stationY = 65;

  const stationPositions = [
    { x: 200, y: stationY }, // Station 0: Inspection
    { x: 470, y: stationY }, // Station 1: Sorting
    { x: 740, y: stationY }, // Station 2: Packing
  ];

  // Infeed position (left) and Outfeed position (right)
  const infeedX = 40;
  const infeedY = stationY + stationHeight / 2;
  const outfeedX = 920;
  const outfeedY = stationY + stationHeight / 2;

  // Helper to get conveyor coordinate for progress 0..1
  const getConveyorCoord = (fromIdx: number, toIdx: number, progress: number) => {
    let startX = 0;
    let endX = 0;
    const y = stationY + stationHeight / 2;

    if (fromIdx === -1 && toIdx === 0) {
      // Entry -> Station 0
      startX = infeedX + 24;
      endX = stationPositions[0].x - 10;
    } else if (fromIdx === 0 && toIdx === 1) {
      // Station 0 -> Station 1
      startX = stationPositions[0].x + stationWidth + 6;
      endX = stationPositions[1].x - 10;
    } else if (fromIdx === 1 && toIdx === 2) {
      // Station 1 -> Station 2
      startX = stationPositions[1].x + stationWidth + 6;
      endX = stationPositions[2].x - 10;
    } else if (fromIdx === 2 && toIdx === 3) {
      // Station 2 -> Exit Palletizer
      startX = stationPositions[2].x + stationWidth + 6;
      endX = outfeedX - 24;
    }

    const currentX = startX + (endX - startX) * progress;
    return { x: currentX, y };
  };

  return (
    <div className="w-full overflow-x-auto bg-panel-2 border border-line rounded p-4 shadow-[inset_0_0_24px_rgba(0,0,0,0.5)]">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[760px] select-none font-mono"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="diag-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#221E17" strokeWidth="0.8" />
          </pattern>

          {/* Gradients */}
          <linearGradient id="conveyor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#302B22" />
            <stop offset="50%" stopColor="#1D1A15" />
            <stop offset="100%" stopColor="#302B22" />
          </linearGradient>

          <linearGradient id="station-bay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18150F" />
            <stop offset="100%" stopColor="#14120D" />
          </linearGradient>

          {/* Amber glow filter */}
          <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Crimson pulse filter */}
          <filter id="crimson-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Engineering Background Grid */}
        <rect width={svgWidth} height={svgHeight} fill="url(#diag-grid)" />

        {/* 1. Conveyor Belts (Tracks) */}
        {/* Entry Belt */}
        <g id="conveyor-entry">
          <rect
            x={infeedX}
            y={infeedY - 14}
            width={stationPositions[0].x - infeedX}
            height={28}
            fill="url(#conveyor-grad)"
            stroke="#302B22"
            strokeWidth="1.5"
            rx="3"
          />
          {/* Rollers / Guide lines */}
          <line x1={infeedX} y1={infeedY} x2={stationPositions[0].x} y2={infeedY} stroke="#FFB000" strokeWidth="1" strokeDasharray="6,8" opacity="0.3" />
        </g>

        {/* Conveyor Belt 0 -> 1 */}
        <g id="conveyor-0-1">
          <rect
            x={stationPositions[0].x + stationWidth}
            y={stationY + stationHeight / 2 - 14}
            width={stationPositions[1].x - (stationPositions[0].x + stationWidth)}
            height={28}
            fill="url(#conveyor-grad)"
            stroke="#302B22"
            strokeWidth="1.5"
            rx="3"
          />
          <line
            x1={stationPositions[0].x + stationWidth}
            y1={stationY + stationHeight / 2}
            x2={stationPositions[1].x}
            y2={stationY + stationHeight / 2}
            stroke="#FFB000"
            strokeWidth="1"
            strokeDasharray="6,8"
            opacity="0.3"
          />
        </g>

        {/* Conveyor Belt 1 -> 2 */}
        <g id="conveyor-1-2">
          <rect
            x={stationPositions[1].x + stationWidth}
            y={stationY + stationHeight / 2 - 14}
            width={stationPositions[2].x - (stationPositions[1].x + stationWidth)}
            height={28}
            fill="url(#conveyor-grad)"
            stroke="#302B22"
            strokeWidth="1.5"
            rx="3"
          />
          <line
            x1={stationPositions[1].x + stationWidth}
            y1={stationY + stationHeight / 2}
            x2={stationPositions[2].x}
            y2={stationY + stationHeight / 2}
            stroke="#FFB000"
            strokeWidth="1"
            strokeDasharray="6,8"
            opacity="0.3"
          />
        </g>

        {/* Exit Conveyor Belt 2 -> Exit */}
        <g id="conveyor-exit">
          <rect
            x={stationPositions[2].x + stationWidth}
            y={stationY + stationHeight / 2 - 14}
            width={outfeedX - (stationPositions[2].x + stationWidth)}
            height={28}
            fill="url(#conveyor-grad)"
            stroke="#302B22"
            strokeWidth="1.5"
            rx="3"
          />
          <line
            x1={stationPositions[2].x + stationWidth}
            y1={stationY + stationHeight / 2}
            x2={outfeedX}
            y2={stationY + stationHeight / 2}
            stroke="#FFB000"
            strokeWidth="1"
            strokeDasharray="6,8"
            opacity="0.3"
          />
        </g>

        {/* 2. Infeed Feeder Unit */}
        <g id="infeed-unit" transform={`translate(${infeedX - 25}, ${infeedY - 32})`}>
          <rect width="45" height="64" rx="4" fill="#1D1A15" stroke="#302B22" strokeWidth="1.5" />
          <path d="M 5 12 L 40 12" stroke="#FFB000" strokeWidth="2" opacity="0.8" />
          <text x="22" y="32" fill="#EDE6DA" fontSize="9" fontWeight="bold" textAnchor="middle">
            INFEED
          </text>
          <text x="22" y="44" fill="#FFB000" fontSize="8" textAnchor="middle">
            λ={(config.arrivalRate * 60).toFixed(0)}/m
          </text>
        </g>

        {/* 3. Outfeed Palletizer Unit */}
        <g id="outfeed-unit" transform={`translate(${outfeedX - 10}, ${outfeedY - 32})`}>
          <rect width="48" height="64" rx="4" fill="#1D1A15" stroke="#302B22" strokeWidth="1.5" />
          <path d="M 8 12 L 40 12" stroke="#4FA98A" strokeWidth="2" opacity="0.8" />
          <text x="24" y="30" fill="#EDE6DA" fontSize="9" fontWeight="bold" textAnchor="middle">
            PALLET
          </text>
          <text x="24" y="42" fill="#4FA98A" fontSize="8" textAnchor="middle">
            DISPATCH
          </text>
          <text x="24" y="54" fill="#A79C8A" fontSize="8" textAnchor="middle">
            ✓ {state.totalDepartures}
          </text>
        </g>

        {/* 4. Station Nodes */}
        {stations.map((st, idx) => {
          const pos = stationPositions[idx];
          const isBusy = st.status === "BUSY";
          const isCongested = st.queue.length >= 4;
          const statusColor = isCongested ? "#D64550" : isBusy ? "#FFB000" : "#4FA98A";

          return (
            <g key={st.config.id} id={`station-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Outer Station Enclosure */}
              <rect
                width={stationWidth}
                height={stationHeight}
                rx="5"
                fill="#1D1A15"
                stroke={isCongested ? "#D64550" : isBusy ? "#FFB000" : "#302B22"}
                strokeWidth={isCongested || isBusy ? "1.8" : "1.2"}
                className="transition-colors duration-200"
              />

              {/* Station Tag & Nameplate Header */}
              <rect x="0" y="0" width={stationWidth} height="26" fill="#18150F" rx="4" />
              <line x1="0" y1="26" x2={stationWidth} y2="26" stroke="#302B22" strokeWidth="1" />

              {/* Status LED Indicator */}
              <circle
                cx="14"
                cy="13"
                r="4.5"
                fill={statusColor}
                filter={isBusy || isCongested ? (isCongested ? "url(#crimson-glow)" : "url(#amber-glow)") : undefined}
              />

              <text x="25" y="17" fill="#EDE6DA" fontSize="10" fontWeight="bold">
                {st.config.tag}
              </text>
              <text x={stationWidth - 8} y="17" fill="#A79C8A" fontSize="9" textAnchor="end">
                {st.config.name.toUpperCase()}
              </text>

              {/* Center Processing Bay */}
              <rect
                x="20"
                y="36"
                width={stationWidth - 40}
                height="48"
                rx="4"
                fill="url(#station-bay-grad)"
                stroke="#302B22"
                strokeWidth="1"
              />

              {isBusy && st.currentItem ? (
                // Active Item in Bay
                <g transform={`translate(${stationWidth / 2}, 60)`}>
                  <rect
                    x="-32"
                    y="-14"
                    width="64"
                    height="28"
                    rx="4"
                    fill="#FFB000"
                    stroke="#FFB000"
                    strokeWidth="1.5"
                    filter="url(#amber-glow)"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#15130F"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ITEM #{st.currentItem.id}
                  </text>
                  <text
                    x="0"
                    y="11"
                    fill="#15130F"
                    fontSize="7"
                    fontWeight="semibold"
                    textAnchor="middle"
                  >
                    PROCESSING
                  </text>
                </g>
              ) : (
                // Empty / Idle Bay
                <g transform={`translate(${stationWidth / 2}, 60)`}>
                  <rect
                    x="-32"
                    y="-14"
                    width="64"
                    height="28"
                    rx="4"
                    fill="none"
                    stroke="#4FA98A"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    opacity="0.6"
                  />
                  <text
                    x="0"
                    y="4"
                    fill="#4FA98A"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    IDLE / READY
                  </text>
                </g>
              )}

              {/* Station Parameters & Stats */}
              <g transform="translate(10, 100)">
                <text x="0" y="0" fill="#6B6255" fontSize="8">
                  MEAN SERVICE TIME:
                </text>
                <text x={stationWidth - 20} y="0" fill="#FFB000" fontSize="8" fontWeight="bold" textAnchor="end">
                  {st.config.meanServiceTime.toFixed(1)}s (±{(st.config.serviceTimeVariance * 100).toFixed(0)}%)
                </text>

                <text x="0" y="14" fill="#6B6255" fontSize="8">
                  STATION UTILIZATION:
                </text>
                <text
                  x={stationWidth - 20}
                  y="14"
                  fill={isCongested ? "#D64550" : "#EDE6DA"}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {state.simTime > 0.1
                    ? `${((st.totalBusyTime / state.simTime) * 100).toFixed(1)}%`
                    : "0.0%"}
                </text>

                <text x="0" y="28" fill="#6B6255" fontSize="8">
                  ITEMS PROCESSED:
                </text>
                <text x={stationWidth - 20} y="28" fill="#EDE6DA" fontSize="8" textAnchor="end">
                  {st.itemsProcessed}
                </text>
              </g>

              {/* FIFO Queue Stacking Indicator (underneath station) */}
              <g transform={`translate(0, ${stationHeight + 12})`}>
                <rect
                  x="0"
                  y="0"
                  width={stationWidth}
                  height="26"
                  rx="3"
                  fill="#18150F"
                  stroke={isCongested ? "#D64550" : st.queue.length > 0 ? "#FFB000" : "#302B22"}
                  strokeWidth="1"
                />

                <text x="8" y="17" fill={isCongested ? "#D64550" : "#A79C8A"} fontSize="9" fontWeight="bold">
                  QUEUE: {st.queue.length}
                </text>

                {/* Waiting item micro-tokens stacked horizontally */}
                <g transform="translate(68, 5)">
                  {st.queue.slice(0, 5).map((item, qIdx) => (
                    <g key={item.id} transform={`translate(${qIdx * 12}, 0)`}>
                      <rect
                        width="10"
                        height="16"
                        rx="2"
                        fill={isCongested ? "#D64550" : "#FFB000"}
                        opacity={0.85 - qIdx * 0.1}
                      />
                      <text x="5" y="11" fill="#15130F" fontSize="6" fontWeight="bold" textAnchor="middle">
                        {item.id}
                      </text>
                    </g>
                  ))}
                  {st.queue.length > 5 && (
                    <text x="64" y="12" fill="#D64550" fontSize="8" fontWeight="bold">
                      +{st.queue.length - 5}
                    </text>
                  )}
                </g>
              </g>
            </g>
          );
        })}

        {/* 5. Items in Transit on Conveyors */}
        {transitItems.map(({ item, fromIdx, toIdx, progress }) => {
          const coord = getConveyorCoord(fromIdx, toIdx, progress);
          return (
            <g
              key={item.id}
              transform={`translate(${coord.x}, ${coord.y})`}
              className="transition-transform duration-75"
            >
              {/* Amber Package Capsule */}
              <rect
                x="-14"
                y="-10"
                width="28"
                height="20"
                rx="3"
                fill="#FFB000"
                stroke="#EDE6DA"
                strokeWidth="1"
                filter="url(#amber-glow)"
              />
              <text
                x="0"
                y="3"
                fill="#15130F"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                #{item.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
