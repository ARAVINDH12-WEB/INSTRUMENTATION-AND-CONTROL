"use client";

import { useState } from "react";
import { conversionScenarios, ConversionScenario } from "@/lib/pid-trainer-data";

export default function DiagramConversionMode() {
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [assignedTags, setAssignedTags] = useState<{ [slotId: string]: string }>({});
  const [validationResult, setValidationResult] = useState<{
    checked: boolean;
    templateCorrect: boolean;
    tagsCorrect: boolean;
    feedback: string[];
  }>({ checked: false, templateCorrect: false, tagsCorrect: false, feedback: [] });

  const scenario: ConversionScenario = conversionScenarios[scenarioIdx];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setValidationResult({ checked: false, templateCorrect: false, tagsCorrect: false, feedback: [] });
  };

  const handleTagChange = (slotId: string, tag: string) => {
    setAssignedTags((prev) => ({ ...prev, [slotId]: tag }));
    setValidationResult({ checked: false, templateCorrect: false, tagsCorrect: false, feedback: [] });
  };

  const handleReset = () => {
    setSelectedTemplateId(null);
    setAssignedTags({});
    setValidationResult({ checked: false, templateCorrect: false, tagsCorrect: false, feedback: [] });
  };

  const handleValidate = () => {
    const feedback: string[] = [];

    if (!selectedTemplateId) {
      setValidationResult({
        checked: true,
        templateCorrect: false,
        tagsCorrect: false,
        feedback: ["Please select a candidate P&ID diagram template first."],
      });
      return;
    }

    const templateCorrect = selectedTemplateId === scenario.correctTemplateId;
    if (!templateCorrect) {
      feedback.push("Incorrect diagram template. Review the fluid mechanics and process boundary in the description.");
    } else {
      feedback.push("✓ Diagram topology template matches the process description correctly.");
    }

    // Check tags
    let tagsCorrect = true;
    const missingSlots = scenario.tagSlots.filter((slot) => !assignedTags[slot.slotId]);

    if (missingSlots.length > 0) {
      tagsCorrect = false;
      feedback.push(`Incomplete tag labeling: ${missingSlots.length} instrument slot(s) unassigned.`);
    } else {
      scenario.tagSlots.forEach((slot) => {
        const assigned = assignedTags[slot.slotId];
        if (assigned !== slot.correctTag) {
          tagsCorrect = false;
          feedback.push(`Tag error on ${slot.role}: Selected '${assigned}', expected '${slot.correctTag}'.`);
        }
      });
    }

    if (templateCorrect && tagsCorrect) {
      feedback.push("EXCELLENT // Full diagram match and ISA-5.1 tag compliance confirmed!");
    }

    setValidationResult({
      checked: true,
      templateCorrect,
      tagsCorrect,
      feedback,
    });
  };

  return (
    <div className="bg-cf-panel border border-cf-line rounded p-5 md:p-7 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header & Scenario Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cf-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cf-amber uppercase mb-1">
            <span>MODE 3: SCENARIO {scenarioIdx + 1} OF {conversionScenarios.length}</span>
            <span>·</span>
            <span className="text-cf-verdigris font-semibold">PROCESS-TO-DIAGRAM</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-cf-text">
            {scenario.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {conversionScenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setScenarioIdx(idx);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs font-semibold border transition-colors ${
                scenarioIdx === idx
                  ? "bg-cf-amber text-cf-bg border-cf-amber"
                  : "bg-cf-panel-2 text-cf-text-dim border-cf-line hover:border-cf-amber-dim"
              }`}
            >
              CHALLENGE {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Process Narrative Prompt */}
      <div className="bg-cf-panel-2 border border-cf-line-soft p-5 rounded">
        <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-2 font-semibold">
          PROCESS OPERATIONAL NARRATIVE:
        </div>
        <p className="text-cf-text text-sm sm:text-base leading-relaxed font-sans">
          &ldquo;{scenario.processDescription}&rdquo;
        </p>
      </div>

      {/* Step 1: Template Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-cf-amber uppercase font-bold tracking-wider">
            STEP 1: SELECT MATCHING P&amp;ID SCHEMATIC TEMPLATE
          </span>
          <span className="text-[11px] font-mono text-cf-text-faint">3 CANDIDATES AVAILABLE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenario.templates.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-cf-panel-2 border-cf-amber shadow-[0_0_12px_rgba(255,176,0,0.2)]"
                    : "bg-cf-panel-2 border-cf-line hover:border-cf-line-soft"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cf-panel border border-cf-line text-cf-text-dim">
                      {tmpl.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-cf-amber">
                      {isSelected ? "◉ SELECTED" : "○"}
                    </span>
                  </div>

                  {/* Simplified Schematic Preview Icon */}
                  <div className="h-24 my-2 rounded bg-[#18150F] border border-cf-line flex items-center justify-center font-mono text-xs text-cf-text-faint text-center p-2">
                    {tmpl.svgType === "pressure_vent" && "DOME VENT [PV] ⟵ [PIC] ⟵ [PT]"}
                    {tmpl.svgType === "level_drawoff" && "SUMP DRAIN [LV] ⟵ [LIC] ⟵ [LT]"}
                    {tmpl.svgType === "temp_furnace" && "BURNER FUEL [TV] ⟵ [TIC] ⟵ [TT]"}
                    {tmpl.svgType === "flow_bypass" && "RECYCLE BYPASS [FV] ⟵ [FIC] ⟵ [FT]"}
                  </div>

                  <h3 className="font-heading text-sm font-semibold text-cf-text mt-2">
                    {tmpl.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Tag Assignment Slot Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-cf-amber uppercase font-bold tracking-wider">
            STEP 2: ASSIGN ISA-5.1 INSTRUMENT TAGS TO DIAGRAM SLOTS
          </span>
          <span className="text-[11px] font-mono text-cf-text-faint">
            {Object.keys(assignedTags).length} of {scenario.tagSlots.length} SLOTS TAGGED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenario.tagSlots.map((slot) => (
            <div key={slot.slotId} className="bg-cf-panel-2 p-4 rounded border border-cf-line flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cf-text-faint uppercase block mb-1">
                  SLOT ASSIGNMENT:
                </span>
                <span className="text-xs font-sans font-bold text-cf-text block mb-3 leading-snug">
                  {slot.role}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-mono text-cf-text-dim block mb-1">
                  SELECT ISA TAG:
                </label>
                <select
                  value={assignedTags[slot.slotId] || ""}
                  onChange={(e) => handleTagChange(slot.slotId, e.target.value)}
                  className="w-full bg-cf-panel border border-cf-line text-cf-amber font-mono text-xs p-2 rounded focus:border-cf-amber outline-none"
                >
                  <option value="">-- UNASSIGNED --</option>
                  {slot.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar & Validation Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-cf-panel-2 p-4 rounded border border-cf-line">
        <div className="text-xs font-mono text-cf-text-dim">
          <span>SELECTED TEMPLATE: </span>
          <span className="text-cf-amber font-bold">
            {selectedTemplateId
              ? scenario.templates.find((t) => t.id === selectedTemplateId)?.name
              : "NONE"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded bg-cf-panel border border-cf-line text-xs font-mono text-cf-text-dim hover:text-cf-amber"
          >
            ↺ RESET CHOICES
          </button>
          <button
            onClick={handleValidate}
            className="px-6 py-2.5 rounded bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm"
          >
            ✓ VALIDATE DIAGRAM &amp; TAGS
          </button>
        </div>
      </div>

      {/* Validation Result Box */}
      {validationResult.checked && (
        <div
          className={`p-5 rounded border animate-fadeIn ${
            validationResult.templateCorrect && validationResult.tagsCorrect
              ? "bg-cf-verdigris/15 border-cf-verdigris text-cf-text"
              : "bg-cf-crimson/15 border-cf-crimson text-cf-text"
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-xs font-bold mb-2">
            {validationResult.templateCorrect && validationResult.tagsCorrect ? (
              <span className="text-cf-verdigris flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cf-verdigris" />
                STATUS: DIAGRAM SPECIFICATION ACCEPTED
              </span>
            ) : (
              <span className="text-cf-crimson flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cf-crimson" />
                STATUS: DISCREPANCIES DETECTED
              </span>
            )}
          </div>

          <ul className="space-y-1 text-xs font-mono mb-3">
            {validationResult.feedback.map((msg, i) => (
              <li
                key={i}
                className={
                  msg.startsWith("✓") || msg.startsWith("EXCELLENT")
                    ? "text-cf-verdigris font-semibold"
                    : "text-cf-text-dim"
                }
              >
                {msg}
              </li>
            ))}
          </ul>

          {validationResult.templateCorrect && validationResult.tagsCorrect && (
            <div className="border-t border-cf-verdigris/30 pt-3 mt-3">
              <p className="text-xs font-sans text-cf-text leading-relaxed mb-3">
                <strong className="font-mono text-cf-amber">ENGINEERING RATIONALE: </strong>
                {scenario.explanation}
              </p>

              {scenarioIdx + 1 < conversionScenarios.length && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setScenarioIdx((prev) => prev + 1);
                      handleReset();
                    }}
                    className="px-4 py-2 rounded bg-cf-verdigris text-cf-bg font-mono font-bold text-xs uppercase tracking-wider"
                  >
                    PROCEED TO CHALLENGE {scenarioIdx + 2} ⟶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
