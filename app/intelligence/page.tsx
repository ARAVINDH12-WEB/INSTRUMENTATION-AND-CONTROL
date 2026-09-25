import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";

export const metadata = {
  title: "Industrial Intelligence — Machine Learning & Process Analytics — ControlForge",
  description:
    "Applied statistical diagnostics, predictive maintenance, and time-series process forecasting for industrial automation and instrumentation systems.",
};

const modules = [
  {
    id: "MOD-01",
    tag: "STATISTICAL ANOMALY DETECTION",
    tagColor: "tag-amber",
    title: "Sensor Anomaly & Fault Classification",
    desc: "Sequential time-series evaluation using robust Modified Z-Score and Median Absolute Deviation (MAD). Automatically tags sensor drift, line noise, and transient spikes.",
    href: "/intelligence/fault-detection",
    metrics: ["Z-SCORE EVALUATION", "SPIKE ISOLATION", "CUSUM DRIFT"],
    cta: "LAUNCH FAULT DETECTOR ⟶",
  },
  {
    id: "MOD-02",
    tag: "PREDICTIVE MAINTENANCE",
    tagColor: "tag-verdigris",
    title: "Remaining Useful Life (RUL) Estimation",
    desc: "Degradation curve estimation integrating ISO 10816 vibration velocity RMS, casing temperature, and cumulative operational run-hours into dynamic health bands.",
    href: "/intelligence/predictive-maintenance",
    metrics: ["ISO 10816 VIBRATION", "THERMAL STRESS", "HEALTH INDEX BAND"],
    cta: "LAUNCH RUL ESTIMATOR ⟶",
  },
  {
    id: "MOD-03",
    tag: "TIME-SERIES PROJECTION",
    tagColor: "tag-amber",
    title: "Process Variable Trend Forecasting",
    desc: "Double Exponential Smoothing (Holt's Linear Trend) projection projecting multi-step future temperature trajectories with 90% confidence uncertainty envelopes.",
    href: "/intelligence/forecasting",
    metrics: ["HOLT LINEAR TREND", "LEVEL & SLOPE SMOOTHING", "90% CONFIDENCE BAND"],
    cta: "LAUNCH FORECASTER ⟶",
  },
  {
    id: "MOD-04",
    tag: "MULTIVARIATE PROCESS CONTROL",
    tagColor: "tag-crimson",
    title: "Multi-Sensor Anomaly Detection",
    desc: "Unsupervised multivariate anomaly detection using rolling Mahalanobis distance from the expected joint sensor distribution. Identifies abnormal inter-sensor relationships invisible to single-variable detectors.",
    href: "/intelligence/anomaly-detection",
    metrics: ["MAHALANOBIS DISTANCE", "COVARIANCE MATRIX", "JOINT DEVIATION SCORE"],
    cta: "LAUNCH ANOMALY DETECTOR ⟶",
  },
  {
    id: "MOD-05",
    tag: "SEASONAL LOAD FORECASTING",
    tagColor: "tag-amber",
    title: "Industrial Energy-Consumption Forecasting",
    desc: "Multi-method seasonal time-series benchmarking comparing Holt-Winters triple exponential smoothing against seasonal-naive, Holt linear, and naive projections on industrial power load curves.",
    href: "/intelligence/energy-forecasting",
    metrics: ["HOLT-WINTERS (TRIPLE EXP)", "DIURNAL & WEEKLY SEASONALITY", "HELD-OUT MAPE/RMSE"],
    cta: "LAUNCH LOAD FORECASTER ⟶",
  },
];

export default function IntelligenceLandingPage() {
  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <InstrumentPanel className="flex flex-col gap-6">
          <header className="mb-2 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs text-amber tracking-widest uppercase mb-3">
              <span>STAGE 3 // APPLIED INTELLIGENCE</span>
              <span>·</span>
              <span>STATISTICAL &amp; PREDICTIVE ANALYTICS</span>
            </div>
            <h1 className="font-panel-heading text-3xl md:text-4xl font-bold tracking-tight text-text mb-4">
              Industrial Intelligence Suite
            </h1>
            <p className="font-panel-body text-text-dim text-base leading-relaxed">
              Data-driven intelligence layer for instrumentation loops. Combines statistical signal processing, 
              machine health physics, and time-series trend algorithms to diagnose faults before hardware failure.
            </p>
          </header>

          <IntelligenceDisclaimer />

          {/* 3-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <article
                key={m.id}
                className="bg-[#16130F] border border-[#302B22] rounded p-6 flex flex-col justify-between transition-all hover:border-amber hover:bg-[#201D17] group shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#100E0B] border border-[#302B22] text-amber font-semibold">
                      {m.tag}
                    </span>
                    <span className="font-mono text-xs text-text-faint">{m.id}</span>
                  </div>

                  <h2 className="font-panel-heading text-xl font-bold text-text mb-3 group-hover:text-amber transition-colors">
                    <Link href={m.href}>{m.title}</Link>
                  </h2>

                  <p className="font-panel-body text-text-dim text-sm leading-relaxed mb-6">
                    {m.desc}
                  </p>

                  <div className="space-y-1.5 mb-6 border-t border-[#26221B] pt-4">
                    {m.metrics.map((metric) => (
                      <div key={metric} className="flex items-center gap-2 text-xs font-mono text-text-faint">
                        <span className="text-amber font-bold">»</span>
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#302B22] pt-4">
                  <Link
                    href={m.href}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#100E0B] border border-[#302B22] hover:border-amber text-text hover:text-amber font-mono font-bold text-xs uppercase py-2.5 rounded tracking-wider transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  >
                    {m.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </InstrumentPanel>
      </main>

      <SiteFooter subtitle="INTELLIGENCE ENGINE // STATISTICAL MODELS" />
    </div>
  );
}
