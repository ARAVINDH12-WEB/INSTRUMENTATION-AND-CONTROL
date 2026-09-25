"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  accentColor?: string;
  size?: number;
  precision?: number;
  disabled?: boolean;
  className?: string;
}

export default function RotaryKnob({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  unit = "",
  accentColor = "#FFB000",
  size = 84,
  precision,
  disabled = false,
  className = "",
}: RotaryKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartValueRef = useRef<number>(0);

  // Compute decimal precision if not explicitly provided
  const resolvedPrecision =
    precision !== undefined
      ? precision
      : step < 0.01
      ? 3
      : step < 0.1
      ? 2
      : step < 1
      ? 1
      : 0;

  // Clamp value to [min, max]
  const clampedValue = Math.min(Math.max(value, min), max);

  // Map value to 280° arc (-140° to +140°)
  const range = max - min;
  const pct = range > 0 ? (clampedValue - min) / range : 0;
  const rotationAngle = -140 + pct * 280;

  // Handle click-to-type activation
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setEditInput(clampedValue.toFixed(resolvedPrecision));
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    const parsed = parseFloat(editInput.trim());
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), max);
      const rounded = Math.round(clamped / step) * step;
      // Fix floating point issues
      const finalVal = parseFloat(rounded.toFixed(resolvedPrecision));
      onChange(finalVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // Keyboard accessibility for knob itself
  const handleKnobKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || isEditing) return;
    let nextVal = clampedValue;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      nextVal = Math.min(max, clampedValue + step);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextVal = Math.max(min, clampedValue - step);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      nextVal = Math.min(max, clampedValue + step * 10);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      nextVal = Math.max(min, clampedValue - step * 10);
    } else if (e.key === "Home") {
      e.preventDefault();
      nextVal = min;
    } else if (e.key === "End") {
      e.preventDefault();
      nextVal = max;
    }
    if (nextVal !== clampedValue) {
      onChange(parseFloat(nextVal.toFixed(resolvedPrecision)));
    }
  };

  // Drag interaction with Pointer Events (unifies Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isEditing) return;
    if (e.button !== 0) return; // Primary button only

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartValueRef.current = clampedValue;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;

    // 160 pixels vertical drag traverses entire range
    const sensitivityPx = 160;
    const deltaY = dragStartYRef.current - e.clientY; // Upwards = positive
    const deltaValue = (deltaY / sensitivityPx) * range;
    const rawVal = dragStartValueRef.current + deltaValue;
    const clamped = Math.min(Math.max(rawVal, min), max);
    const rounded = Math.round(clamped / step) * step;
    const finalVal = parseFloat(rounded.toFixed(resolvedPrecision));

    if (finalVal !== clampedValue) {
      onChange(finalVal);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer might already be released
      }
      setIsDragging(false);
    }
  };

  // Arc ticks generation
  const tickCount = 19;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const tickPct = i / (tickCount - 1);
    const tickAngle = -140 + tickPct * 280;
    const isLit = tickAngle <= rotationAngle + 2;
    const isMajor = i === 0 || i === Math.floor(tickCount / 2) || i === tickCount - 1;
    return { tickAngle, isLit, isMajor };
  });

  return (
    <div
      className={`flex flex-col items-center select-none font-mono ${className}`}
      style={{ width: `${size + 24}px` }}
    >
      {/* Label */}
      <span className="text-[10px] tracking-wider text-text-dim uppercase font-semibold mb-1 text-center truncate max-w-full">
        {label}
      </span>

      {/* Rotary Knob Bezel & Wheel */}
      <div
        ref={knobRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clampedValue}
        aria-valuetext={`${clampedValue.toFixed(resolvedPrecision)}${unit}`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKnobKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          touchAction: "none",
        }}
        className={`relative rounded-full flex items-center justify-center cursor-ns-resize transition-all duration-150 ${
          isDragging
            ? "scale-[1.03] shadow-[0_6px_20px_rgba(0,0,0,0.65)]"
            : "hover:scale-[1.02] hover:shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {/* Outer Circular Bezel with Ticks */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Subtle Outer Track Arc */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#26211A"
            strokeWidth="1.5"
            strokeDasharray="215 100"
            strokeDashoffset="128"
            className="opacity-70"
          />

          {/* Tick Marks around 280 deg arc */}
          {ticks.map((t, idx) => {
            const rad = ((t.tickAngle - 90) * Math.PI) / 180;
            const rOuter = 46;
            const rInner = t.isMajor ? 38 : 41;
            const x1 = 50 + rOuter * Math.cos(rad);
            const y1 = 50 + rOuter * Math.sin(rad);
            const x2 = 50 + rInner * Math.cos(rad);
            const y2 = 50 + rInner * Math.sin(rad);

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={t.isLit ? accentColor : "#383126"}
                strokeWidth={t.isMajor ? "1.8" : "1.2"}
                strokeLinecap="round"
                className="transition-colors duration-75"
                style={{
                  filter: t.isLit ? `drop-shadow(0 0 1.5px ${accentColor})` : "none",
                }}
              />
            );
          })}
        </svg>

        {/* Physical Turning Knob Body */}
        <div
          className="relative rounded-full flex items-center justify-center transition-transform duration-75"
          style={{
            width: `${size - 18}px`,
            height: `${size - 18}px`,
            background:
              "radial-gradient(circle at 35% 30%, #302A22 0%, #1A1713 65%, #0F0E0B 100%)",
            boxShadow: `
              inset 0 1px 1px rgba(255, 255, 255, 0.15),
              inset 0 -2px 4px rgba(0, 0, 0, 0.8),
              0 3px 8px rgba(0, 0, 0, 0.7),
              0 0 0 1px #3A3226
            `,
            transform: `rotate(${rotationAngle}deg)`,
          }}
        >
          {/* Subtle Anodized Aluminum Machined Ring */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: "4px",
              border: "1px dashed rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
            }}
          />

          {/* Recessed Center Cap */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: "10px",
              background:
                "radial-gradient(circle at 40% 40%, #26211A 0%, #14120F 70%, #0A0907 100%)",
              boxShadow: "inset 0 1.5px 3px rgba(0, 0, 0, 0.9)",
              border: "1px solid #231E18",
            }}
          />

          {/* Pointer Indicator Line */}
          <div
            className="absolute top-1 pointer-events-none rounded-full"
            style={{
              width: "3px",
              height: `${(size - 18) * 0.32}px`,
              backgroundColor: accentColor,
              boxShadow: `0 0 6px ${accentColor}, 0 1px 2px rgba(0,0,0,0.8)`,
            }}
          />
        </div>
      </div>

      {/* Real-time Numeric Readout with Click-to-Type Fallback */}
      <div className="mt-1.5 flex items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-16 px-1 py-0.5 text-center text-xs font-mono font-semibold bg-[#110F0C] border rounded outline-none transition-colors"
            style={{
              borderColor: accentColor,
              color: accentColor,
              boxShadow: `0 0 6px ${accentColor}40`,
            }}
          />
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            title="Click to type exact value"
            disabled={disabled}
            className="group px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-[#252019] transition-colors cursor-text border border-transparent hover:border-line-soft"
          >
            <span
              className="text-xs font-semibold font-mono tracking-tight transition-colors"
              style={{ color: accentColor }}
            >
              {clampedValue.toFixed(resolvedPrecision)}
            </span>
            {unit && (
              <span className="text-[10px] text-text-dim font-mono">
                {unit}
              </span>
            )}
            <span className="opacity-0 group-hover:opacity-60 text-[9px] text-text-faint ml-0.5">
              ✎
            </span>
          </button>
        )}
      </div>

      {/* Min / Max bounds indication */}
      <div className="w-full flex justify-between px-1 text-[9px] text-text-faint font-mono mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
