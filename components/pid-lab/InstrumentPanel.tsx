"use client";

import React, { useEffect, useRef, useState } from "react";

interface InstrumentPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function InstrumentPanel({
  children,
  className = "",
}: InstrumentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isTouch = window.matchMedia("(hover: none)").matches || "ontouchstart" in window;

    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    const panel = panelRef.current;
    if (!panel || mediaQuery.matches || isTouch) {
      if (panel) {
        panel.style.transform = "none";
      }
      return;
    }

    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const panelCenterX = rect.left + rect.width / 2;
      const panelCenterY = rect.top + rect.height / 2;

      // Normalized coordinates relative to panel center (-1 to 1)
      const nx = (e.clientX - panelCenterX) / (window.innerWidth / 2);
      const ny = (e.clientY - panelCenterY) / (window.innerHeight / 2);

      // Subtle, restrained industrial tilt (bounded max ~2.5 deg)
      targetRotateY = Math.max(Math.min(nx * 2.5, 2.5), -2.5);
      targetRotateX = Math.max(Math.min(-ny * 2.5, 2.5), -2.5);
    };

    const handleMouseLeave = () => {
      targetRotateX = 0;
      targetRotateY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const updateParallax = () => {
      // Lerp interpolation (smoothing factor 0.07)
      currentRotateX += (targetRotateX - currentRotateX) * 0.07;
      currentRotateY += (targetRotateY - currentRotateY) * 0.07;

      if (panel) {
        panel.style.transform = `perspective(1200px) rotateX(${currentRotateX.toFixed(
          2
        )}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      }
      animId = requestAnimationFrame(updateParallax);
    };

    animId = requestAnimationFrame(updateParallax);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      style={{
        transformStyle: "preserve-3d",
        transition: reducedMotion ? "none" : "box-shadow 0.2s ease",
      }}
      className={`relative rounded-lg border border-[#3E3529] instrument-panel-metal p-6 md:p-8 shadow-[0_12px_48px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08)] ${className}`}
    >
      {/* Corner Heavy Rivets */}
      <div className="absolute top-2.5 left-2.5 panel-rivet pointer-events-none z-20" />
      <div className="absolute top-2.5 right-2.5 panel-rivet pointer-events-none z-20" />
      <div className="absolute bottom-2.5 left-2.5 panel-rivet pointer-events-none z-20" />
      <div className="absolute bottom-2.5 right-2.5 panel-rivet pointer-events-none z-20" />

      {/* Procedural Noise Texture Overlay (SVG feTurbulence, ~5% opacity, overlay blend mode) */}
      <div className="panel-noise-overlay pointer-events-none rounded-lg" />

      {/* Off-center radial warm-light gradient & deep inset vignette */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg z-10"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 30% 20%, rgba(255, 176, 0, 0.04) 0%, transparent 60%), radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      />

      {/* Panel Content (Preserving 3D depth) */}
      <div className="relative z-20 font-panel-body">{children}</div>
    </div>
  );
}
