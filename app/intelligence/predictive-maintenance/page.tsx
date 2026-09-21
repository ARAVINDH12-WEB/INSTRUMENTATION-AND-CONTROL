"use client";

import { useState, useEffect, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";

interface RulResult {
  sensor_id: string;
  predicted_rul_hours: number;
  degradation_pct: number;
  health_status: "HEALTHY" | "ADVISORY" | "CRITICAL";
  status_color: "verdigris" | "amber" | "crimson";
  confidence_interval: number[];
  health_index: number;
  recommended_action: string;
}

export default function PredictiveMaintenancePage() {
  const [sensorId, setSensorId] = useState<string>("PUMP-P102 / MOTOR-BEARING");
  const [vibrationRms, setVibrationRms] = useState<number>(2.4);
  const [temperatureC, setTemperatureC] = useState<number>(72.0);
  const [operatingHours, setOperatingHours] = useState<number>(3400);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RulResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const calculateRul = useCallback(async () => {
    setLoading(true);
    setBackendError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/predict/rul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensor_id: sensorId,
          vibration_rms: vibrationRms,
          temperature_c: temperatureC,
          operating_hours: operatingHours,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: RulResult = await res.json();
      setResult(data);
    } catch (err) {
      setBackendError("Backend server offline on port 8000. Running local client-side degradation engine.");

      // Local fallback calculation matching backend model
      const nominal_life = 8500.0;
      const vib_ratio = Math.max(0.5, vibrationRms / 2.3);
      const vib_stress = Math.pow(vib_ratio, 2.2);
      const temp_excess = Math.max(0, temperatureC - 65.0);
      const thermal_stress = Math.exp(temp_excess / 28.0);
      const wear_multiplier = 0.5 * vib_stress + 0.5 * thermal_stress;
      const effective_consumed = operatingHours * wear_multiplier;

      const raw_rul = nominal_life - effective_consumed;
      const predicted_rul = Math.max(40.0, Number(raw_rul.toFixed(1)));
      const health_index = Math.max(0.02, Math.min(1.0, Number((predicted_rul / nominal_life).toFixed(3))));
      const degradation_pct = Number(((1.0 - health_index) * 100).toFixed(1));

      let health_status: "HEALTHY" | "ADVISORY" | "CRITICAL" = "HEALTHY";
      let status_color: "verdigris" | "amber" | "crimson" = "verdigris";
      let action = "Equipment operating inside standard envelope. Routine maintenance schedule confirmed.";

      if (predicted_rul < 1000.0) {
        health_status = "CRITICAL";
        status_color = "crimson";
        action = "Elevated mechanical stress. High probability of bearing seizure within 40-100 operating cycles. Immediate intervention required.";
      } else if (predicted_rul < 2500.0) {
        health_status = "ADVISORY";
        status_color = "amber";
        action = "Early degradation detected. Inspect lube oil quality and schedule bearing check during next turnaround.";
      }

      setResult({
        sensor_id: sensorId,
        predicted_rul_hours: predicted_rul,
        degradation_pct,
        health_status,
        status_color,
        confidence_interval: [Number((predicted_rul * 0.88).toFixed(1)), Number((predicted_rul * 1.12).toFixed(1))],
        health_index,
        recommended_action: action,
      });
    } finally {
      setLoading(false);
    }
  }, [sensorId, vibrationRms, temperatureC, operatingHours]);

  useEffect(() => {
    calculateRul();
  }, [calculateRul]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-6 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-2">
            <span>INTELLIGENCE // MOD-02</span>
            <span>·</span>
            <span>RELIABILITY &amp; PROGNOSTICS</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-cf-text mb-3">
            Remaining Useful Life (RUL) Estimation
          </h1>
          <p className="text-cf-text-dim text-sm md:text-base leading-relaxed">
            Physics-informed degradation model combining ISO 10816 vibration velocity RMS and Arrhenius thermal acceleration 
            to forecast equipment lifetime and schedule interventions before catastrophic seizure.
          </p>
        </header>

        <IntelligenceDisclaimer />

        {backendError && (
          <div className="bg-cf-panel-2 border border-cf-amber/40 text-cf-amber text-xs font-mono p-3 rounded mb-6 flex items-center justify-between">
            <span>ℹ {backendError}</span>
            <span className="text-[11px] text-cf-text-faint">CLIENT FALLBACK ACTIVE</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-6">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-6">
                OPERATIONAL STRESS INPUTS // {sensorId}
              </div>

              <div className="space-y-6">
                {/* Vibration Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-cf-text-dim">VIBRATION VELOCITY RMS (ISO 10816):</span>
                    <span className={`font-bold ${vibrationRms > 4.5 ? "text-cf-crimson" : vibrationRms > 2.8 ? "text-cf-amber" : "text-cf-verdigris"}`}>
                      {vibrationRms.toFixed(1)} mm/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={vibrationRms}
                    onChange={(e) => setVibrationRms(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-cf-text-faint">
                    <span>Good (&lt;1.8)</span>
                    <span>Acceptable (1.8–4.5)</span>
                    <span>Severe (&gt;4.5)</span>
                  </div>
                </div>

                {/* Temperature Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-cf-text-dim">BEARING CASING TEMPERATURE:</span>
                    <span className={`font-bold ${temperatureC > 95 ? "text-cf-crimson" : temperatureC > 75 ? "text-cf-amber" : "text-cf-verdigris"}`}>
                      {temperatureC.toFixed(1)}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="130"
                    step="1"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-cf-text-faint">
                    <span>Baseline (30–65°C)</span>
                    <span>Thermal Stress (65–90°C)</span>
                    <span>Overheat (&gt;90°C)</span>
                  </div>
                </div>

                {/* Operating Hours Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-cf-text-dim">ACCUMULATED RUN-TIME SINCE OVERHAUL:</span>
                    <span className="text-cf-amber font-bold font-mono">
                      {operatingHours.toLocaleString()} hrs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(parseInt(e.target.value))}
                    className="w-full accent-cf-amber"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-cf-text-faint">
                    <span>0 hrs (New)</span>
                    <span>4,250 hrs (Half-Life)</span>
                    <span>8,500 hrs (Rated Spec)</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-8 pt-4 border-t border-cf-line-soft">
                <span className="text-xs font-mono text-cf-text-faint block mb-2">FIELD PRESETS:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setVibrationRms(1.4);
                      setTemperatureC(58.0);
                      setOperatingHours(1200);
                    }}
                    className="p-2 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-verdigris hover:border-cf-verdigris"
                  >
                    HEALTHY PUMP
                  </button>
                  <button
                    onClick={() => {
                      setVibrationRms(3.6);
                      setTemperatureC(82.0);
                      setOperatingHours(4100);
                    }}
                    className="p-2 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-amber hover:border-cf-amber"
                  >
                    EARLY WEAR
                  </button>
                  <button
                    onClick={() => {
                      setVibrationRms(7.2);
                      setTemperatureC(112.0);
                      setOperatingHours(6800);
                    }}
                    className="p-2 text-xs font-mono rounded bg-cf-panel-2 border border-cf-line text-cf-crimson hover:border-cf-crimson"
                  >
                    IMMINENT FAILURE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Status & RUL Gauge Card */}
            <div className="bg-cf-panel border border-cf-line rounded p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                    PROGNOSTIC ASSESSMENT
                  </div>

                  {/* Dynamic Status Pill */}
                  {result && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold border uppercase ${
                        result.status_color === "verdigris"
                          ? "bg-cf-verdigris/15 text-cf-verdigris border-cf-verdigris/40"
                          : result.status_color === "amber"
                          ? "bg-cf-amber/15 text-cf-amber border-cf-amber/40"
                          : "bg-cf-crimson/20 text-cf-crimson border-cf-crimson animate-pulse"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          result.status_color === "verdigris"
                            ? "bg-cf-verdigris"
                            : result.status_color === "amber"
                            ? "bg-cf-amber"
                            : "bg-cf-crimson"
                        }`}
                      />
                      {result.health_status} CONDITION
                    </span>
                  )}
                </div>

                {/* Primary Number: Predicted RUL */}
                <div className="my-6 p-5 bg-cf-panel-2 rounded border border-cf-line text-center">
                  <div className="text-xs font-mono text-cf-text-faint tracking-wider uppercase mb-1">
                    ESTIMATED REMAINING USEFUL LIFE (RUL)
                  </div>
                  <div
                    className={`text-4xl md:text-5xl font-mono font-bold tracking-tight ${
                      result?.status_color === "verdigris"
                        ? "text-cf-verdigris"
                        : result?.status_color === "amber"
                        ? "text-cf-amber"
                        : "text-cf-crimson"
                    }`}
                  >
                    {result ? `${result.predicted_rul_hours.toLocaleString()} hrs` : "—"}
                  </div>
                  <div className="text-xs font-mono text-cf-text-dim mt-2">
                    CONFIDENCE INTERVAL (90% CI):{" "}
                    <span className="text-cf-text">
                      {result ? `${result.confidence_interval[0]} hrs – ${result.confidence_interval[1]} hrs` : "—"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Health Band */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cf-text-dim">CUMULATIVE DEGRADATION INDEX:</span>
                    <span className="font-bold text-cf-text">{result?.degradation_pct ?? 0}%</span>
                  </div>
                  <div className="w-full h-3 rounded bg-cf-panel-2 border border-cf-line overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        result?.status_color === "verdigris"
                          ? "bg-cf-verdigris"
                          : result?.status_color === "amber"
                          ? "bg-cf-amber"
                          : "bg-cf-crimson"
                      }`}
                      style={{ width: `${result?.degradation_pct || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-cf-text-faint pt-0.5">
                    <span>0% (New Component)</span>
                    <span>70% (Service Limit)</span>
                    <span>100% (Seizure)</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Recommendation */}
              <div className="border-t border-cf-line-soft pt-4">
                <div className="text-[11px] font-mono text-cf-text-faint uppercase mb-1">
                  RECOMMENDED MAINTENANCE DISPATCH:
                </div>
                <p className="text-xs font-mono text-cf-text leading-relaxed bg-cf-panel-2 p-3 rounded border border-cf-line">
                  {result?.recommended_action || "Calculating diagnostic action plan..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter subtitle="PROGNOSTIC ENGINE // WEIBULL DEGRADATION" />
    </div>
  );
}
