"use client";

import { useState, useEffect, useRef } from "react";
import { queryConsoleChatbot, suggestedChatbotQueries, KnowledgeEntry } from "@/lib/console-chatbot-kb";

export default function CrtChatbotTerminal() {
  const [inputText, setInputText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<KnowledgeEntry | undefined>(undefined);
  const [historyLog, setHistoryLog] = useState<Array<{ q: string; a: string; timestamp: string }>>([
    {
      q: "SYSTEM_BOOT",
      a: "CONTROLFORGE FIELD DIAGNOSTIC TERMINAL // READY\nMemory bank initialized with Notes, PID Lab, Calculators, Intelligence, and Project repositories. Enter a query or select a preset diagnostic question below.",
      timestamp: "00:00:01",
    },
  ]);

  const terminalOutputRef = useRef<HTMLDivElement | null>(null);
  const typeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll output screen to bottom
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [displayedText, historyLog]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, []);

  const handleAsk = (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setIsTyping(true);
    setInputText("");

    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    const result = queryConsoleChatbot(q);
    setCurrentEntry(result.entry);

    const fullResponse = result.answer;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayedText(fullResponse);
      setIsTyping(false);
      setHistoryLog((prev) => [...prev, { q, a: fullResponse, timestamp: ts }]);
      return;
    }

    // Typewriter effect
    let charIdx = 0;
    setDisplayedText("");

    typeTimerRef.current = setInterval(() => {
      charIdx++;
      setDisplayedText(fullResponse.slice(0, charIdx));

      if (charIdx >= fullResponse.length) {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);
        setIsTyping(false);
        setHistoryLog((prev) => [...prev, { q, a: fullResponse, timestamp: ts }]);
      }
    }, 16);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTyping && inputText.trim()) {
      handleAsk(inputText);
    }
  };

  return (
    <div className="w-full bg-[#15130F] border border-cf-line rounded-md p-4 md:p-5 flex flex-col gap-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">
      {/* Bezel Title Strip */}
      <div className="flex items-center justify-between border-b border-cf-line-soft pb-2 font-mono text-xs">
        <div className="flex items-center gap-2 text-cf-amber">
          <span className="w-2 h-2 rounded-full bg-cf-amber animate-pulse shadow-[0_0_8px_rgba(255,176,0,0.8)]" />
          <span className="font-bold tracking-wider uppercase">
            BAY · 04 / CRT DIAGNOSTIC TERMINAL [CF-TERM-90]
          </span>
        </div>
        <span className="text-[10px] font-mono text-cf-text-faint tracking-wider hidden sm:inline">
          MEMORY: 100% LOCAL // SCOPED TO REPOSITORY
        </span>
      </div>

      {/* The Physical Curved CRT Bezel */}
      <div className="relative rounded-lg border-4 border-[#26221B] bg-[#0E0C09] p-3 sm:p-4 shadow-[inset_0_0_24px_rgba(0,0,0,0.9),0_4px_16px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Subtle Scanlines Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Phosphor Glow Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,176,0,0.06) 0%, transparent 80%)",
          }}
        />

        {/* CRT Screen Content Window */}
        <div
          ref={terminalOutputRef}
          className="relative z-0 h-[210px] sm:h-[230px] overflow-y-auto pr-1 font-mono text-xs text-cf-amber leading-relaxed space-y-3 custom-scrollbar"
        >
          {/* History log entries */}
          {historyLog.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-cf-text-dim text-[11px] flex items-center gap-2">
                <span className="text-cf-verdigris font-bold">» [{item.timestamp}]</span>
                <span className="text-cf-text font-semibold">{item.q}</span>
              </div>
              <div className="pl-4 text-cf-amber/90 whitespace-pre-wrap text-[11px] border-l border-cf-amber/30">
                {item.a}
              </div>
            </div>
          ))}

          {/* Active typing response */}
          {isTyping && (
            <div className="space-y-1 animate-fadeIn">
              <div className="text-cf-text-dim text-[11px] flex items-center gap-2">
                <span className="text-cf-verdigris font-bold">» BUS · QUERY:</span>
                <span className="text-cf-amber">TRANSMITTING...</span>
              </div>
              <div className="pl-4 text-cf-amber whitespace-pre-wrap text-[11px] border-l border-cf-amber">
                {displayedText}
                <span className="inline-block w-2 h-3.5 bg-cf-amber ml-1 animate-pulse align-middle" />
              </div>
            </div>
          )}
        </div>

        {/* Target link referral footer if entry has route */}
        {currentEntry?.routeRef && !isTyping && (
          <div className="relative z-20 mt-2 pt-2 border-t border-cf-line-soft/80 flex items-center justify-between text-[10px] font-mono text-cf-text-dim">
            <span>REPOSITORY CROSS-REFERENCE:</span>
            <a
              href={currentEntry.routeRef}
              className="text-cf-verdigris hover:text-cf-amber transition-colors underline font-bold"
            >
              NAVIGATE TO MODULE [{currentEntry.routeRef}] ⟶
            </a>
          </div>
        )}
      </div>

      {/* Terminal Input Form with Keyboard */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative flex items-center rounded border border-cf-line bg-[#100E0A] focus-within:border-cf-amber focus-within:shadow-[0_0_8px_rgba(255,176,0,0.3)] transition-all">
          <span className="pl-3 font-mono text-xs text-cf-amber font-bold">CF:&gt;</span>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Type question or select a diagnostic preset below..."
            className="w-full py-2.5 px-2 bg-transparent font-mono text-xs text-cf-amber placeholder:text-cf-text-faint focus:outline-none"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText("")}
              className="pr-3 font-mono text-xs text-cf-text-faint hover:text-cf-amber"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          className="px-4 py-2.5 rounded bg-cf-amber text-cf-bg font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
        >
          QUERY
        </button>
      </form>

      {/* Suggested Starter Presets */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="font-mono text-[10px] text-cf-text-faint uppercase tracking-wider">
          DIAGNOSTIC PRESET CHIPS // QUICK QUERY BUS:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedChatbotQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(q)}
              disabled={isTyping}
              className="px-2.5 py-1 rounded bg-[#221E17] border border-cf-line hover:border-cf-amber hover:text-cf-amber text-cf-text-dim text-[11px] font-mono transition-colors disabled:opacity-40 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
