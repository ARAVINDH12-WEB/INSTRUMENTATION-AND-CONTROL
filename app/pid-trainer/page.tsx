"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TagQuizMode from "@/components/pid-trainer/TagQuizMode";
import LoopBuilderMode from "@/components/pid-trainer/LoopBuilderMode";
import DiagramConversionMode from "@/components/pid-trainer/DiagramConversionMode";

type TrainerMode = "quiz" | "builder" | "conversion";

export default function PidTrainerPage() {
  const [activeMode, setActiveMode] = useState<TrainerMode>("quiz");

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Intro Header */}
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-3">
            <span>STAGE 3B // INTERACTIVE WORKBENCH</span>
            <span>·</span>
            <span>ISA-5.1 P&amp;ID TRAINING ENGINE</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-cf-text mb-4">
            P&amp;ID &amp; Control Loop Diagram Trainer
          </h1>
          <p className="text-cf-text-dim text-base leading-relaxed">
            Master industrial Piping &amp; Instrumentation Diagram (P&amp;ID) syntax and control loop design. 
            Decode instrument bubble tags, build valid feedback loops from scratch, and map real-world process requirements to standardized schematics.
          </p>
        </header>

        {/* How To Use Guidance Box */}
        <div className="bg-cf-panel border border-cf-line rounded p-4 md:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cf-verdigris shrink-0" />
            <div>
              <span className="text-cf-verdigris font-bold mr-2">TRAINING CURRICULUM:</span>
              <span className="text-cf-text-dim">
                Mode 1 teaches ISA-5.1 tag syntax · Mode 2 tests topology wiring &amp; validation · Mode 3 challenges process narrative conversion.
              </span>
            </div>
          </div>
          <span className="text-cf-text-faint shrink-0">STANDARD: ISA-5.1-2009</span>
        </div>

        {/* Mode Switcher Navigation Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-cf-line pb-4">
          <button
            onClick={() => setActiveMode("quiz")}
            className={`px-4 py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-colors flex items-center gap-2 ${
              activeMode === "quiz"
                ? "bg-cf-amber text-cf-bg border border-cf-amber"
                : "bg-cf-panel border border-cf-line text-cf-text-dim hover:text-cf-amber hover:border-cf-amber-dim"
            }`}
          >
            <span>MODE 1: TAG IDENTIFICATION QUIZ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">18 QUESTIONS</span>
          </button>

          <button
            onClick={() => setActiveMode("builder")}
            className={`px-4 py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-colors flex items-center gap-2 ${
              activeMode === "builder"
                ? "bg-cf-amber text-cf-bg border border-cf-amber"
                : "bg-cf-panel border border-cf-line text-cf-text-dim hover:text-cf-amber hover:border-cf-amber-dim"
            }`}
          >
            <span>MODE 2: DRAG &amp; DROP LOOP BUILDER</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">TOPOLOGY VALIDATOR</span>
          </button>

          <button
            onClick={() => setActiveMode("conversion")}
            className={`px-4 py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-colors flex items-center gap-2 ${
              activeMode === "conversion"
                ? "bg-cf-amber text-cf-bg border border-cf-amber"
                : "bg-cf-panel border border-cf-line text-cf-text-dim hover:text-cf-amber hover:border-cf-amber-dim"
            }`}
          >
            <span>MODE 3: PROCESS-TO-DIAGRAM CONVERSION</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">DIAGRAM MATCHING</span>
          </button>
        </div>

        {/* Active Mode Render */}
        <div>
          {activeMode === "quiz" && <TagQuizMode />}
          {activeMode === "builder" && <LoopBuilderMode />}
          {activeMode === "conversion" && <DiagramConversionMode />}
        </div>
      </main>

      <SiteFooter subtitle="P&ID TRAINER // ISA-5.1 STANDARD" />
    </div>
  );
}
