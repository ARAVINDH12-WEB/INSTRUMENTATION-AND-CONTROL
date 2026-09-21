"use client";

import { useState } from "react";
import { tagQuizBank, TagQuizQuestion } from "@/lib/pid-trainer-data";

export default function TagQuizMode() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);

  const currentQ: TagQuizQuestion = tagQuizBank[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < tagQuizBank.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizComplete(false);
  };

  const progressPct = ((currentIndex + (isAnswered ? 1 : 0)) / tagQuizBank.length) * 100;

  if (quizComplete) {
    const accuracy = Math.round((score / tagQuizBank.length) * 100);
    return (
      <div className="bg-cf-panel border border-cf-line rounded p-6 md:p-8 max-w-3xl mx-auto">
        <div className="text-center py-6">
          <div className="font-mono text-xs text-cf-amber uppercase tracking-widest mb-2">
            QUIZ COMPLETE // ISA-5.1 EVALUATION
          </div>
          <h2 className="font-heading text-3xl font-bold text-cf-text mb-4">
            Tag Identification Assessment
          </h2>

          <div className="my-8 p-6 bg-cf-panel-2 rounded border border-cf-line inline-block min-w-[260px]">
            <div className="text-xs font-mono text-cf-text-faint uppercase mb-1">YOUR ACCURACY</div>
            <div
              className={`text-5xl font-mono font-bold ${
                accuracy >= 80 ? "text-cf-verdigris" : accuracy >= 60 ? "text-cf-amber" : "text-cf-crimson"
              }`}
            >
              {accuracy}%
            </div>
            <div className="text-xs font-mono text-cf-text-dim mt-2">
              {score} of {tagQuizBank.length} questions correct
            </div>
          </div>

          <p className="text-sm text-cf-text-dim max-w-md mx-auto mb-8 leading-relaxed">
            {accuracy >= 80
              ? "Exceptional mastery of ISA-5.1 tag syntax. You reliably differentiate initiating variables, readouts, modifiers, and final control elements."
              : accuracy >= 60
              ? "Solid understanding of primary process variables, but review modifiers and dual-function control tags."
              : "Review ISA-5.1 Table 1 letter definitions. Focus on the distinction between primary elements (E), transmitters (T), and controllers (C)."}
          </p>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 rounded bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110"
          >
            ↺ RETAKE TAG QUIZ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cf-panel border border-cf-line rounded p-6 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Quiz Header & Progress */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-3">
          <div className="flex items-center gap-2">
            <span className="text-cf-amber font-semibold">QUESTION {currentIndex + 1} OF {tagQuizBank.length}</span>
            <span className="text-cf-text-faint">·</span>
            <span className="text-cf-text-dim">SCORE: {score}/{currentIndex + (isAnswered ? 1 : 0)}</span>
          </div>
          <span className="text-cf-text-faint">ISA-5.1 IDENTIFICATION</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-cf-panel-2 overflow-hidden border border-cf-line-soft">
          <div
            className="h-full bg-cf-amber transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Target Tag Bubble Plate */}
      <div className="p-6 bg-cf-panel-2 rounded border border-cf-line flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-mono text-cf-text-faint uppercase tracking-wider mb-2">
          IDENTIFY INSTRUMENT BUBBLE TAG
        </span>

        {/* P&ID Instrument Bubble Glyphs */}
        <div className="relative my-2">
          <div className="w-28 h-28 rounded-full border-2 border-cf-amber bg-cf-panel flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,176,0,0.15)]">
            <span className="font-mono text-xl font-bold text-cf-amber tracking-wider">
              {currentQ.tag}
            </span>
            <div className="w-full h-px bg-cf-line-soft my-1" />
            <span className="font-mono text-[10px] text-cf-text-faint">DCS / FIELD</span>
          </div>
        </div>

        <h3 className="font-heading text-lg md:text-xl font-semibold text-cf-text mt-4 max-w-xl">
          {currentQ.question}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      <div className="space-y-3">
        {currentQ.options.map((option, idx) => {
          let btnStyle = "bg-cf-panel-2 border-cf-line text-cf-text hover:border-cf-amber hover:text-cf-amber";

          if (isAnswered) {
            if (idx === currentQ.correctIndex) {
              btnStyle = "bg-cf-verdigris/15 border-cf-verdigris text-cf-verdigris font-semibold shadow-[0_0_10px_rgba(79,169,138,0.2)]";
            } else if (idx === selectedOption) {
              btnStyle = "bg-cf-crimson/20 border-cf-crimson text-cf-crimson font-semibold";
            } else {
              btnStyle = "bg-cf-panel-2 border-cf-line text-cf-text-faint opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded border transition-all text-xs sm:text-sm font-sans flex items-center justify-between ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-cf-text-faint w-6">
                  [{String.fromCharCode(65 + idx)}]
                </span>
                <span>{option}</span>
              </div>

              {isAnswered && idx === currentQ.correctIndex && (
                <span className="font-mono text-xs text-cf-verdigris font-bold">✓ CORRECT</span>
              )}
              {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                <span className="font-mono text-xs text-cf-crimson font-bold">✗ INCORRECT</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation & Breakdown Banner (revealed after answer) */}
      {isAnswered && (
        <div className="p-5 rounded bg-cf-panel-2 border border-cf-line space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-cf-line-soft pb-2">
            <span className="font-mono text-xs font-bold text-cf-amber uppercase">
              ISA-5.1 SYNTAX BREAKDOWN // {currentQ.tag}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                selectedOption === currentQ.correctIndex ? "text-cf-verdigris" : "text-cf-crimson"
              }`}
            >
              {selectedOption === currentQ.correctIndex ? "ACCEPTED (+1)" : "MISSED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono py-1">
            <div className="bg-cf-panel p-2 rounded border border-cf-line">
              <span className="text-cf-text-faint block text-[10px]">1ST LETTER (VARIABLE):</span>
              <span className="text-cf-amber font-bold">{currentQ.breakdown.firstLetter}</span>
              <span className="text-cf-text-dim block text-[11px] mt-0.5">{currentQ.breakdown.firstLetterMeaning}</span>
            </div>

            <div className="bg-cf-panel p-2 rounded border border-cf-line">
              <span className="text-cf-text-faint block text-[10px]">SUCCEEDING (FUNCTION):</span>
              <span className="text-cf-amber font-bold">{currentQ.breakdown.succeedingLetters}</span>
              <span className="text-cf-text-dim block text-[11px] mt-0.5">{currentQ.breakdown.succeedingLettersMeaning}</span>
            </div>

            <div className="bg-cf-panel p-2 rounded border border-cf-line">
              <span className="text-cf-text-faint block text-[10px]">LOOP NUMBER:</span>
              <span className="text-cf-amber font-bold">{currentQ.breakdown.loopNumber}</span>
              <span className="text-cf-text-dim block text-[11px] mt-0.5">Control Loop Index</span>
            </div>
          </div>

          <p className="text-xs text-cf-text-dim leading-relaxed pt-1">
            {currentQ.explanation}
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-colors"
            >
              {currentIndex + 1 < tagQuizBank.length ? "NEXT QUESTION ⟶" : "FINISH QUIZ ⟶"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
