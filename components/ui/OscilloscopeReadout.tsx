"use client";

import React from "react";

export interface OscilloscopeReadoutProps {
  label?: string;
  value?: React.ReactNode;
  unit?: string;
  subtext?: React.ReactNode;
  statusBadge?: string;
  variant?: "amber" | "verdigris" | "crimson";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}

export default function OscilloscopeReadout({
  label,
  value,
  unit,
  subtext,
  statusBadge = "CRT PHOSPHOR // METROLOGY GRADE",
  variant = "amber",
  size = "lg",
  children,
  className = "",
}: OscilloscopeReadoutProps) {
  const glowStyles = {
    amber: "text-amber drop-shadow-[0_0_12px_rgba(255,176,0,0.7)]",
    verdigris: "text-verdigris drop-shadow-[0_0_12px_rgba(79,169,138,0.7)]",
    crimson: "text-crimson drop-shadow-[0_0_12px_rgba(214,69,80,0.7)]",
  };

  const dotColors = {
    amber: "bg-amber shadow-[0_0_5px_#FFB000]",
    verdigris: "bg-verdigris shadow-[0_0_5px_#4FA98A]",
    crimson: "bg-crimson shadow-[0_0_5px_#D64550]",
  };

  const textSizes = {
    sm: "text-xl sm:text-2xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  return (
    <div
      className={`relative rounded border border-[#23352B] bg-[#090E0C] p-5 md:p-6 text-center shadow-[inset_0_0_28px_rgba(0,0,0,0.95)] overflow-hidden select-none ${className}`}
    >
      {/* Scope Calibration Header */}
      {(label || statusBadge) && (
        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#588A6E] mb-2.5 pointer-events-none z-20 relative">
          {label && (
            <span className="flex items-center gap-1.5 uppercase font-medium">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`}
              />
              {label}
            </span>
          )}
          {statusBadge && (
            <span className="text-[9px] text-[#3A5D4A] font-mono uppercase tracking-wider">
              {statusBadge}
            </span>
          )}
        </div>
      )}

      {/* Main Readout Content */}
      <div className="relative z-20">
        {children ? (
          children
        ) : (
          <>
            <div className={`font-mono font-bold tracking-tight ${textSizes[size]} ${glowStyles[variant]}`}>
              {value}
              {unit && <span className="text-sm sm:text-base font-normal ml-1.5 opacity-85 text-text-dim">{unit}</span>}
            </div>
            {subtext && (
              <div className="font-mono text-xs text-text-dim mt-2 opacity-90">
                {subtext}
              </div>
            )}
          </>
        )}
      </div>

      {/* CRT Scanline Overlay (~25% opacity) */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* CRT Radial Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at center, transparent 55%, rgba(4, 8, 6, 0.75) 100%)",
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.9)",
        }}
      />
    </div>
  );
}
