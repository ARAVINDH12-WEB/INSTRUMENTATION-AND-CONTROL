export default function IntelligenceDisclaimer() {
  return (
    <div className="bg-cf-panel-2 border border-cf-line-soft rounded px-4 py-2.5 flex items-center gap-3 text-xs font-mono text-cf-text-dim mb-6">
      <span className="w-2 h-2 rounded-full bg-cf-amber animate-pulse shrink-0" />
      <div>
        <span className="text-cf-amber font-bold mr-2">[DEMONSTRATION SYSTEM]</span>
        <span>
          Educational &amp; portfolio demonstration utilizing statistical algorithms and simulated process telemetry. 
          Not certified for mission-critical industrial process monitoring or life-safety applications.
        </span>
      </div>
    </div>
  );
}
