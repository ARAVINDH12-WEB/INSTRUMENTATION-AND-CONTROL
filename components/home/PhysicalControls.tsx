"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ControlConfig {
  id: string;
  label: string;
  type: "toggle" | "dial" | "lever" | "pushbutton";
  route: string;
  sublabel: string;
}

const CONTROLS: ControlConfig[] = [
  { id: "ctrl-projects", label: "PROJECTS", type: "toggle", route: "/projects", sublabel: "CASE REPOSITORY" },
  { id: "ctrl-calculators", label: "CALCULATORS", type: "dial", route: "/calculators", sublabel: "METROLOGY SUITE" },
  { id: "ctrl-pidlab", label: "PID LAB", type: "lever", route: "/pid-lab", sublabel: "LOOP BENCH" },
  { id: "ctrl-notes", label: "NOTES", type: "pushbutton", route: "/notes", sublabel: "FIELD MONOGRAPHS" },
  { id: "ctrl-dashboard", label: "DASHBOARD", type: "toggle", route: "/dashboard", sublabel: "PLANT DCS" },
  { id: "ctrl-intelligence", label: "INTELLIGENCE", type: "toggle", route: "/intelligence", sublabel: "EDGE ML SUITE" },
  { id: "ctrl-pidtrainer", label: "PID TRAINER", type: "toggle", route: "/pid-trainer", sublabel: "ISA-5.1 WORKBENCH" },
];

export default function PhysicalControls() {
  const router = useRouter();
  const [actuatingId, setActuatingId] = useState<string | null>(null);

  const handleActuate = (control: ControlConfig) => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      router.push(control.route);
      return;
    }

    setActuatingId(control.id);
    setTimeout(() => {
      router.push(control.route);
    }, 320);
  };

  return (
    <div className="w-full bg-[#18150F] border border-cf-line rounded p-4 md:p-5 flex flex-col gap-4 select-none">
      {/* Module Title Bar */}
      <div className="flex items-center justify-between border-b border-cf-line-soft pb-2 font-mono text-xs">
        <div className="flex items-center gap-2 text-cf-amber uppercase tracking-wider font-semibold">
          <span className="w-2 h-2 rounded-full bg-cf-amber shadow-[0_0_6px_rgba(255,176,0,0.8)]" />
          <span>STATION SELECT BUS // PHYSICAL ROUTE BUS</span>
        </div>
        <span className="text-[10px] text-cf-text-faint font-mono tracking-widest hidden sm:inline">
          ACTUATION: LOW-VOLTAGE RELAY
        </span>
      </div>

      {/* Grid of Mounted Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        {CONTROLS.map((ctrl) => {
          const isActuating = actuatingId === ctrl.id;

          return (
            <div
              key={ctrl.id}
              onClick={() => handleActuate(ctrl)}
              className="group relative flex flex-col items-center justify-between p-3 rounded bg-cf-panel-2 border border-cf-line cursor-pointer transition-all duration-150 hover:border-cf-amber hover:shadow-[0_0_14px_rgba(255,176,0,0.25)] hover:bg-[#221E17]"
              style={{ minHeight: "140px" }}
              aria-label={`Physical control to navigate to ${ctrl.label}`}
              role="button"
            >
              {/* Top Status Pip */}
              <div className="w-full flex items-center justify-between font-mono text-[9px] text-cf-text-faint">
                <span className="text-[8px] uppercase">{ctrl.type}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActuating
                      ? "bg-cf-amber shadow-[0_0_8px_rgba(255,176,0,1)]"
                      : "bg-[#383226] group-hover:bg-cf-amber-dim"
                  }`}
                />
              </div>

              {/* Physical Interactive Centerpiece */}
              <div className="my-auto flex items-center justify-center py-2">
                {/* 1. TOGGLE SWITCH */}
                {ctrl.type === "toggle" && (
                  <div className="relative flex flex-col items-center justify-center">
                    {/* Switch Bezel Ring */}
                    <div className="w-10 h-10 rounded-full border border-cf-line bg-[#15130F] flex items-center justify-center shadow-inner group-hover:border-cf-amber-dim transition-colors">
                      {/* Lever Arm */}
                      <div
                        className={`w-3.5 h-7 rounded-sm border border-black bg-gradient-to-b from-[#A79C8A] via-[#EDE6DA] to-[#6B6255] shadow-md transition-transform duration-200 origin-bottom ${
                          isActuating ? "rotate-x-45 scale-y-75 translate-y-1.5 brightness-125" : "-rotate-x-12"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* 2. ROTARY DIAL */}
                {ctrl.type === "dial" && (
                  <div className="relative flex items-center justify-center">
                    {/* Knurled Outer Ring */}
                    <div className="w-11 h-11 rounded-full border-2 border-[#383226] bg-[#15130F] flex items-center justify-center p-0.5 group-hover:border-cf-amber transition-colors shadow-inner">
                      {/* Rotating Knob Body */}
                      <div
                        className={`w-full h-full rounded-full border border-cf-line bg-gradient-to-tr from-[#221E17] via-[#2A251D] to-[#18150F] flex items-center justify-center transition-transform duration-300 ${
                          isActuating ? "rotate-[65deg]" : "group-hover:rotate-12"
                        }`}
                      >
                        {/* Radial Indicator Line */}
                        <div className="w-1 h-3.5 bg-cf-amber rounded-full shadow-[0_0_4px_rgba(255,176,0,0.8)] -translate-y-2" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SLOTTED LEVER */}
                {ctrl.type === "lever" && (
                  <div className="relative flex flex-col items-center justify-center">
                    {/* Vertical Slot Track */}
                    <div className="w-3.5 h-12 rounded-full bg-[#12100C] border border-cf-line flex items-center justify-center relative shadow-inner">
                      {/* Moving Lever Handle */}
                      <div
                        className={`absolute w-7 h-3 rounded border border-black bg-gradient-to-r from-cf-amber via-[#FFC84D] to-cf-amber-dim shadow-md transition-transform duration-200 ${
                          isActuating ? "translate-y-3.5 brightness-125" : "-translate-y-3 group-hover:-translate-y-1.5"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* 4. MOMENTARY PUSHBUTTON */}
                {ctrl.type === "pushbutton" && (
                  <div className="relative flex items-center justify-center">
                    {/* Button Bezel Housing */}
                    <div className="w-10 h-10 rounded border border-cf-line bg-[#15130F] flex items-center justify-center p-1 group-hover:border-cf-amber transition-colors shadow-inner">
                      {/* Square Lens Cap */}
                      <div
                        className={`w-full h-full rounded-sm border border-[#443C2E] flex items-center justify-center font-mono text-[9px] font-bold transition-all duration-150 ${
                          isActuating
                            ? "bg-cf-amber text-cf-bg scale-90 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]"
                            : "bg-[#252018] text-cf-amber group-hover:bg-[#30281C]"
                        }`}
                      >
                        PRESS
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Text Labels */}
              <div className="w-full text-center flex flex-col items-center mt-1">
                <span className="font-heading text-xs font-bold tracking-wider text-cf-text group-hover:text-cf-amber transition-colors">
                  {ctrl.label}
                </span>
                <span className="font-mono text-[9px] text-cf-text-faint truncate max-w-full">
                  {ctrl.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
