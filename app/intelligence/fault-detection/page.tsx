"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import IntelligenceDisclaimer from "@/components/IntelligenceDisclaimer";
import InstrumentPanel from "@/components/pid-lab/InstrumentPanel";
import RotaryKnob from "@/components/ui/RotaryKnob";

interface FaultClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

interface FaultResult {
  sensor_id: string;
  fault_detected: boolean;
  fault_type: string;
  confidence: number;
  anomaly_score: number;
  anomalous_indices: number[];
  per_point_scores: number[];
  per_point_classifications?: string[];
  fault_counts?: Record<string, number>;
  summary_stats: {
    mean?: number;
    median?: number;
    std_dev?: number;
    mad?: number;
    max_z_score?: number;
    total_points?: number;
    anomalous_count?: number;
  };
  confusion_matrix?: Record<string, Record<string, number>> | null;
  per_class_metrics?: Record<string, FaultClassMetric> | null;
  overall_accuracy?: number | null;
  disambiguation_note?: string | null;
}

type ScenarioType = "nominal" | "spikes" | "drift" | "noise" | "stuck" | "dropout" | "benchmark";

const FAULT_CLASSES = ["NORMAL", "STUCK", "DRIFT", "NOISE", "SPIKE", "DROPOUT"] as const;

// Token palette per fault class
const FAULT_COLORS: Record<string, { stroke: string; fill: string; text: string; bg: string; border: string }> = {
  NORMAL: { stroke: "#4FA98A", fill: "#4FA98A", text: "text-cf-verdigris", bg: "bg-cf-verdigris/10", border: "border-cf-verdigris/40" },
  STUCK: { stroke: "#C5A059", fill: "#C5A059", text: "text-[#C5A059]", bg: "bg-[#C5A059]/10", border: "border-[#C5A059]/40" },
  DRIFT: { stroke: "#FFB000", fill: "#FFB000", text: "text-cf-amber", bg: "bg-cf-amber/10", border: "border-cf-amber/40" },
  NOISE: { stroke: "#9D7FE8", fill: "#9D7FE8", text: "text-[#9D7FE8]", bg: "bg-[#9D7FE8]/10", border: "border-[#9D7FE8]/40" },
  SPIKE: { stroke: "#D64550", fill: "#D64550", text: "text-cf-crimson", bg: "bg-cf-crimson/10", border: "border-cf-crimson/40" },
  DROPOUT: { stroke: "#5B9BD5", fill: "#5B9BD5", text: "text-[#5B9BD5]", bg: "bg-[#5B9BD5]/10", border: "border-[#5B9BD5]/40" },
};

export default function FaultDetectionPage() {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("spikes");
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [groundTruth, setGroundTruth] = useState<string[]>([]);
  const [sensorTag, setSensorTag] = useState<string>("PT-101");
  const [zThresh, setZThresh] = useState<number>(2.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FaultResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synthetic Data Generators
  const generateDataset = useCallback((type: ScenarioType) => {
    setActiveScenario(type);
    const series: number[] = [];
    const labels: string[] = [];
    const base = 50.0;
    const normalSigma = 1.8;

    // Helper random gaussian approximation
    const randG = (mean: number, std: number) => {
      const u = Math.max(1e-6, Math.random());
      const v = Math.random();
      return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    if (type === "nominal") {
      const n = 60;
      for (let i = 0; i < n; i++) {
        series.push(Number(randG(base, normalSigma).toFixed(2)));
        labels.push("NORMAL");
      }
    } else if (type === "spikes") {
      const n = 60;
      for (let i = 0; i < n; i++) {
        if (i === 12) {
          series.push(86.5);
          labels.push("SPIKE");
        } else if (i === 28) {
          series.push(14.2);
          labels.push("SPIKE");
        } else if (i === 44) {
          series.push(91.0);
          labels.push("SPIKE");
        } else {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        }
      }
    } else if (type === "drift") {
      const n = 60;
      for (let i = 0; i < n; i++) {
        if (i < 20) {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        } else {
          const bias = (i - 20) * 0.85 + 4.0;
          series.push(Number((base + bias + randG(0, normalSigma)).toFixed(2)));
          labels.push("DRIFT");
        }
      }
    } else if (type === "noise") {
      const n = 60;
      for (let i = 0; i < n; i++) {
        if (i < 15 || i > 48) {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        } else {
          series.push(Number(randG(base, normalSigma * 4.2).toFixed(2)));
          labels.push("NOISE");
        }
      }
    } else if (type === "stuck") {
      const n = 60;
      const stuckVal = 53.4;
      for (let i = 0; i < n; i++) {
        if (i < 18) {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        } else {
          series.push(stuckVal);
          labels.push("STUCK");
        }
      }
    } else if (type === "dropout") {
      const n = 60;
      for (let i = 0; i < n; i++) {
        if (i >= 22 && i <= 40) {
          series.push(0.0); // 0.0 mA open-circuit loop rail
          labels.push("DROPOUT");
        } else {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        }
      }
    } else if (type === "benchmark") {
      // Balanced test dataset: exactly 30 samples per class + normal buffer
      const nPer = 30;
      // 1. Normal
      for (let i = 0; i < nPer; i++) {
        series.push(Number(randG(base, normalSigma).toFixed(2)));
        labels.push("NORMAL");
      }
      // 2. Stuck
      const stuckVal = 52.8;
      for (let i = 0; i < nPer; i++) {
        series.push(stuckVal);
        labels.push("STUCK");
      }
      // 3. Drift
      for (let i = 0; i < nPer; i++) {
        const driftBias = 4.0 + i * 0.45;
        series.push(Number((base + driftBias + randG(0, normalSigma)).toFixed(2)));
        labels.push("DRIFT");
      }
      // 4. Noise
      for (let i = 0; i < nPer; i++) {
        series.push(Number(randG(base, normalSigma * 4.0).toFixed(2)));
        labels.push("NOISE");
      }
      // 5. Spikes (interspersed with normal buffers)
      for (let i = 0; i < nPer; i++) {
        for (let b = 0; b < 3; b++) {
          series.push(Number(randG(base, normalSigma).toFixed(2)));
          labels.push("NORMAL");
        }
        const dir = Math.random() > 0.5 ? 1 : -1;
        const mag = 30.0 + Math.random() * 15.0;
        series.push(Number((base + dir * mag).toFixed(2)));
        labels.push("SPIKE");
      }
      // 6. Dropout
      for (let i = 0; i < nPer; i++) {
        series.push(0.0);
        labels.push("DROPOUT");
      }
    }

    setDataPoints(series);
    setGroundTruth(labels);
  }, []);

  // Initial load with transient impulse scenario
  useEffect(() => {
    generateDataset("spikes");
  }, [generateDataset]);

  // Client-side statistical classification engine fallback
  const runClientClassification = useCallback(
    (readings: number[], truthLabels: string[]): FaultResult => {
      const n = readings.length;
      const sorted = [...readings].sort((a, b) => a - b);
      const median = n % 2 !== 0 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const dev = sorted.map((x) => Math.abs(x - median)).sort((a, b) => a - b);
      const mad = Math.max(dev[Math.floor(n / 2)], 0.25);

      const mean = readings.reduce((a, b) => a + b, 0) / n;
      const variance = readings.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
      const stdDev = Math.sqrt(variance);

      const baseMean = 50.0;
      const baseStd = 1.8;

      // Diagnostic rolling features (window = 5)
      const w = 5;
      const rollMeans: number[] = [];
      const rollStds: number[] = [];
      const diffs: number[] = new Array(n).fill(0);

      for (let i = 0; i < n; i++) {
        if (i > 0) diffs[i] = Math.abs(readings[i] - readings[i - 1]);
        const start = Math.max(0, i - w + 1);
        const win = readings.slice(start, i + 1);
        const m = win.reduce((a, b) => a + b, 0) / win.length;
        rollMeans.push(m);
        if (win.length > 1) {
          const v = win.reduce((a, b) => a + (b - m) ** 2, 0) / (win.length - 1);
          rollStds.push(Math.sqrt(v));
        } else {
          rollStds.push(baseStd);
        }
      }

      const classifications: string[] = new Array(n).fill("NORMAL");
      const anomalousIndices: number[] = [];
      const perPointScores: number[] = [];

      for (let i = 0; i < n; i++) {
        const x = readings[i];
        const modZ = (0.6745 * Math.abs(x - median)) / mad;
        const prev = i > 0 ? readings[i - 1] : x;
        const stepZ = Math.abs(x - prev) / (mad * 2.0);
        const score = Math.max(modZ, stepZ);
        perPointScores.push(Number(Math.min(1.0, score / 4.0).toFixed(3)));

        if (score >= zThresh || x <= 1.0 || x > 100) {
          anomalousIndices.push(i);
        }

        // Decision Tree Fault Classifier
        // 1. DROPOUT
        if (x === null || isNaN(x) || x <= 1.0) {
          classifications[i] = "DROPOUT";
          continue;
        }

        // 2. STUCK
        let isStuck = false;
        if (i >= 2 && Math.abs(readings[i] - readings[i - 1]) < 1e-4 && Math.abs(readings[i - 1] - readings[i - 2]) < 1e-4) {
          isStuck = true;
        } else if (i + 2 < n && Math.abs(readings[i] - readings[i + 1]) < 1e-4 && Math.abs(readings[i + 1] - readings[i + 2]) < 1e-4) {
          isStuck = true;
        } else if (rollStds[i] < 0.02 && i >= 3) {
          isStuck = true;
        }

        if (isStuck) {
          classifications[i] = "STUCK";
          continue;
        }

        const deviation = Math.abs(x - baseMean);
        const varRatio = rollStds[i] / baseStd;
        const leftDev = i > 0 ? Math.abs(readings[i - 1] - baseMean) : 0;
        const rightDev = i + 1 < n ? Math.abs(readings[i + 1] - baseMean) : 0;

        const isNoisyRegime =
          varRatio >= 2.0 &&
          (rollStds[Math.max(0, i - 2)] >= 1.8 * baseStd || rollStds[Math.min(n - 1, i + 2)] >= 1.8 * baseStd);

        // 3. NOISE
        if (isNoisyRegime && Math.abs(rollMeans[i] - baseMean) < 2.5 * baseStd) {
          classifications[i] = "NOISE";
          continue;
        }

        // 4. SPIKE
        let isIsolatedSpike = false;
        if (deviation >= 3.2 * baseStd || modZ >= 3.2) {
          if (diffs[i] >= 3.0 * baseStd || (i + 1 < n && Math.abs(readings[i] - readings[i + 1]) >= 3.0 * baseStd)) {
            if (!isNoisyRegime && (leftDev <= 2.8 * baseStd || rightDev <= 2.8 * baseStd)) {
              isIsolatedSpike = true;
            }
          }
        }

        if (isIsolatedSpike) {
          classifications[i] = "SPIKE";
          continue;
        }

        // 5. DRIFT
        if (deviation >= 2.0 * baseStd && diffs[i] < 3.0 * baseStd) {
          classifications[i] = "DRIFT";
          continue;
        }

        // Stage 1 Gating
        if (modZ >= zThresh || deviation >= 2.5 * baseStd) {
          if (deviation >= 3.0 * baseStd) {
            classifications[i] = leftDev > 2.0 * baseStd && rightDev > 2.0 * baseStd ? "DRIFT" : "SPIKE";
          } else {
            classifications[i] = "NORMAL";
          }
        } else {
          classifications[i] = "NORMAL";
        }
      }

      // Counts per fault
      const faultCounts: Record<string, number> = {};
      FAULT_CLASSES.forEach((c) => (faultCounts[c] = 0));
      classifications.forEach((c) => {
        if (faultCounts[c] !== undefined) faultCounts[c]++;
      });

      const faultCandidates = Object.entries(faultCounts).filter(([k, v]) => k !== "NORMAL" && v > 0);
      let dominantFault = "NOMINAL";
      let hasFault = false;
      let conf = 0.96;

      if (faultCandidates.length > 0) {
        faultCandidates.sort((a, b) => b[1] - a[1]);
        dominantFault = faultCandidates[0][0];
        hasFault = true;
        conf = Math.min(0.98, 0.85 + (faultCandidates[0][1] / n) * 0.15);
      }

      // Compute Confusion Matrix if ground truth matches
      let confMatrix: Record<string, Record<string, number>> | null = null;
      let perClass: Record<string, FaultClassMetric> | null = null;
      let overallAcc: number | null = null;

      if (truthLabels.length === n) {
        confMatrix = {};
        FAULT_CLASSES.forEach((act) => {
          confMatrix![act] = {};
          FAULT_CLASSES.forEach((pred) => {
            confMatrix![act][pred] = 0;
          });
        });

        for (let i = 0; i < n; i++) {
          const act = truthLabels[i];
          const pred = classifications[i];
          if (confMatrix[act] && confMatrix[act][pred] !== undefined) {
            confMatrix[act][pred]++;
          }
        }

        perClass = {};
        let totalCorrect = 0;

        FAULT_CLASSES.forEach((cls) => {
          const tp = confMatrix![cls][cls];
          let fn = 0;
          FAULT_CLASSES.forEach((p) => {
            if (p !== cls) fn += confMatrix![cls][p];
          });
          let fp = 0;
          FAULT_CLASSES.forEach((a) => {
            if (a !== cls) fp += confMatrix![a][cls];
          });

          const prec = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
          const rec = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
          const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

          totalCorrect += tp;
          perClass![cls] = {
            precision: Number(prec.toFixed(2)),
            recall: Number(rec.toFixed(2)),
            f1_score: Number(f1.toFixed(2)),
            support: tp + fn,
          };
        });

        overallAcc = Number(((totalCorrect / n) * 100).toFixed(2));
      }

      return {
        sensor_id: sensorTag,
        fault_detected: hasFault,
        fault_type: dominantFault,
        confidence: Number(conf.toFixed(2)),
        anomaly_score: Math.max(...perPointScores, 0),
        anomalous_indices: anomalousIndices,
        per_point_scores: perPointScores,
        per_point_classifications: classifications,
        fault_counts: faultCounts,
        summary_stats: {
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          std_dev: Number(stdDev.toFixed(3)),
          mad: Number(mad.toFixed(3)),
          total_points: n,
          anomalous_count: anomalousIndices.length,
        },
        confusion_matrix: confMatrix,
        per_class_metrics: perClass,
        overall_accuracy: overallAcc,
        disambiguation_note:
          "STUCK vs DROPOUT Disambiguation: In 4-20 mA current loops, open-circuit transmitter failure drops to 0.0 mA (or < 3.6 mA under NAMUR NE43), whereas a mechanically stuck diaphragm freezes at the operating level (e.g. 52.8%). If digital systems implement sample-and-hold without out-of-band communication flags, the numerical sequence is identical. Out-of-band status bits are required for complete separation.",
      };
    },
    [sensorTag, zThresh]
  );

  // Execute Anomaly Detection API
  const runDetection = useCallback(async () => {
    if (dataPoints.length === 0) return;
    setLoading(true);
    setBackendError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/predict/fault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readings: dataPoints,
          sensor_id: sensorTag,
          sampling_rate_hz: 10.0,
          z_threshold: zThresh,
          expected_baseline_mean: 50.0,
          expected_baseline_std: 1.8,
          ground_truth_labels: groundTruth.length === dataPoints.length ? groundTruth : undefined,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: FaultResult = await res.json();
      setResult(data);
    } catch {
      // Local client-side statistical engine fallback
      setBackendError("Backend API offline on port 8000. Operating on client-side statistical diagnostic engine.");
      const clientResult = runClientClassification(dataPoints, groundTruth);
      setResult(clientResult);
    } finally {
      setLoading(false);
    }
  }, [dataPoints, groundTruth, sensorTag, zThresh, runClientClassification]);

  useEffect(() => {
    runDetection();
  }, [dataPoints, runDetection]);

  // Canvas Drawing with Multi-Class Labels directly on Chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataPoints.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // CRT Phosphor Background
    ctx.fillStyle = "#090E0C";
    ctx.fillRect(0, 0, width, height);

    const padL = 50;
    const padR = 30;
    const padT = 32;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Determine Y range (including buffer for labels above points)
    const minVal = Math.min(0, ...dataPoints);
    const maxVal = Math.max(100, ...dataPoints);
    const rangeVal = Math.max(1, maxVal - minVal);

    const toX = (i: number) => padL + (i / Math.max(1, dataPoints.length - 1)) * plotW;
    const toY = (val: number) => padT + plotH - ((val - minVal) / rangeVal) * plotH;

    // CRT Graticule / Reticle Grid Lines
    ctx.strokeStyle = "rgba(79, 169, 138, 0.12)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(79, 169, 138, 0.65)";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";

    for (let step = 0; step <= 100; step += 25) {
      const y = toY(step);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${step}%`, padL - 8, y + 3);

      // Sub-ticks on vertical axis
      for (let sub = 1; sub <= 4; sub++) {
        const subY = y - (step < 100 ? (plotH / 4) * (sub / 5) : 0);
        if (subY >= padT && subY <= padT + plotH) {
          ctx.beginPath();
          ctx.moveTo(padL - 3, subY);
          ctx.lineTo(padL, subY);
          ctx.stroke();
        }
      }
    }

    // Baseline Guide (50%)
    const baseY = toY(50.0);
    ctx.strokeStyle = "rgba(255, 176, 0, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, baseY);
    ctx.lineTo(padL + plotW, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Signal Trace - Pass 1: Wide Phosphor Halo
    ctx.strokeStyle = "rgba(255, 176, 0, 0.25)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    dataPoints.forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Signal Trace - Pass 2: Focused Electron Beam
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Render Point Annotations & Multi-Class Badges
    const classifications = result?.per_point_classifications || [];
    const anomalies = new Set(result?.anomalous_indices || []);

    // Track contiguous fault segments to place clean, legible labels without overlap
    const labeledClusters: Array<{ cls: string; x: number; y: number; count: number }> = [];
    let currentCluster: { cls: string; startIdx: number; endIdx: number; minY: number; minX: number } | null = null;

    for (let i = 0; i < dataPoints.length; i++) {
      const val = dataPoints[i];
      const x = toX(i);
      const y = toY(val);
      const cls = classifications[i] || (anomalies.has(i) ? "SPIKE" : "NORMAL");
      const isFault = cls !== "NORMAL";

      // Render point
      if (isFault) {
        const colorCfg = FAULT_COLORS[cls] || FAULT_COLORS.SPIKE;
        ctx.fillStyle = colorCfg.fill;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colorCfg.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.stroke();

        // Cluster tracking for labels
        if (!currentCluster || currentCluster.cls !== cls) {
          if (currentCluster) {
            const midX = (toX(currentCluster.startIdx) + toX(currentCluster.endIdx)) / 2;
            labeledClusters.push({
              cls: currentCluster.cls,
              x: midX,
              y: currentCluster.minY,
              count: currentCluster.endIdx - currentCluster.startIdx + 1,
            });
          }
          currentCluster = { cls, startIdx: i, endIdx: i, minY: y, minX: x };
        } else {
          currentCluster.endIdx = i;
          if (y < currentCluster.minY) currentCluster.minY = y;
        }
      } else {
        if (currentCluster) {
          const midX = (toX(currentCluster.startIdx) + toX(currentCluster.endIdx)) / 2;
          labeledClusters.push({
            cls: currentCluster.cls,
            x: midX,
            y: currentCluster.minY,
            count: currentCluster.endIdx - currentCluster.startIdx + 1,
          });
          currentCluster = null;
        }
        ctx.fillStyle = "#FFB000";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (currentCluster) {
      const cluster: { cls: string; startIdx: number; endIdx: number; minY: number; minX: number } = currentCluster;
      const midX = (toX(cluster.startIdx) + toX(cluster.endIdx)) / 2;
      labeledClusters.push({
        cls: cluster.cls,
        x: midX,
        y: cluster.minY,
        count: cluster.endIdx - cluster.startIdx + 1,
      });
    }

    // Draw Crisp Multi-Class Badges above Fault Points
    labeledClusters.forEach((cluster) => {
      const colorCfg = FAULT_COLORS[cluster.cls] || FAULT_COLORS.SPIKE;
      const labelText = cluster.count > 1 ? `${cluster.cls} (×${cluster.count})` : cluster.cls;

      ctx.font = "bold 9px IBM Plex Mono, monospace";
      const textMetrics = ctx.measureText(labelText);
      const textW = textMetrics.width;
      const badgeW = textW + 12;
      const badgeH = 16;
      let badgeX = cluster.x - badgeW / 2;
      let badgeY = Math.max(8, cluster.y - 24);

      // Clamp inside plot boundary
      if (badgeX < padL) badgeX = padL;
      if (badgeX + badgeW > padL + plotW) badgeX = padL + plotW - badgeW;

      // Small anchor connector line
      ctx.strokeStyle = colorCfg.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cluster.x, cluster.y - 6);
      ctx.lineTo(cluster.x, badgeY + badgeH);
      ctx.stroke();

      // Badge background pill
      ctx.fillStyle = "#18150F";
      ctx.strokeStyle = colorCfg.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill();
      ctx.stroke();

      // Badge label text
      ctx.fillStyle = colorCfg.stroke;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    });
  }, [dataPoints, result]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <InstrumentPanel className="flex flex-col gap-6">
          <header className="mb-2 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs text-amber tracking-widest uppercase mb-2">
              <span>INTELLIGENCE // MOD-01-EXT</span>
              <span>·</span>
              <span>MULTI-CLASS SENSOR FAULT CLASSIFIER</span>
            </div>
            <h1 className="font-panel-heading text-3xl font-bold tracking-tight text-text mb-3">
              Sensor Fault Classification Deep-Dive
            </h1>
            <p className="font-panel-body text-sm md:text-base text-text-dim leading-relaxed">
              Extends statistical MAD / Modified Z-Score outlier gating with an interpretable multi-class decision tree. 
              Labels anomalies into five physical fault modes: <strong className="text-text">STUCK</strong>, <strong className="text-text">DRIFT</strong>, <strong className="text-text">NOISE</strong>, <strong className="text-text">SPIKE</strong>, and <strong className="text-text">DROPOUT</strong>, 
              with full confusion matrix analysis and per-class precision/recall breakdown.
            </p>
          </header>

        <IntelligenceDisclaimer />

        {backendError && (
          <div className="bg-cf-panel-2 border border-cf-amber/40 text-cf-amber text-xs font-mono p-3 rounded mb-6 flex items-center justify-between">
            <span>ℹ {backendError}</span>
            <span className="text-[11px] text-cf-text-faint">FALLBACK RUNNING NATIVELY</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>SCENARIO SELECTOR</span>
                <span className="text-[10px] text-cf-text-faint font-normal">{dataPoints.length} SAMPLES</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => generateDataset("nominal")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "nominal" ? "border-cf-verdigris shadow-[0_0_10px_rgba(79,169,138,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-cf-verdigris flex items-center justify-between">
                    <span>1. NOMINAL HEALTHY</span>
                    {activeScenario === "nominal" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">Baseline Gaussian fluctuation (±1.5%)</div>
                </button>

                <button
                  onClick={() => generateDataset("spikes")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "spikes" ? "border-cf-crimson shadow-[0_0_10px_rgba(214,69,80,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-cf-crimson flex items-center justify-between">
                    <span>2. TRANSIENT SPIKES</span>
                    {activeScenario === "spikes" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">Isolated EMI / cavitation impulse spikes</div>
                </button>

                <button
                  onClick={() => generateDataset("drift")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "drift" ? "border-cf-amber shadow-[0_0_10px_rgba(255,176,0,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-cf-amber flex items-center justify-between">
                    <span>3. SYSTEMIC DRIFT</span>
                    {activeScenario === "drift" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">Gradual calibration offset creeping over time</div>
                </button>

                <button
                  onClick={() => generateDataset("noise")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "noise" ? "border-[#9D7FE8] shadow-[0_0_10px_rgba(157,127,232,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-[#9D7FE8] flex items-center justify-between">
                    <span>4. NOISE ELEVATION</span>
                    {activeScenario === "noise" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">4x elevated standard deviation around base</div>
                </button>

                <button
                  onClick={() => generateDataset("stuck")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "stuck" ? "border-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-[#C5A059] flex items-center justify-between">
                    <span>5. STUCK / FROZEN SENSOR</span>
                    {activeScenario === "stuck" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">Zero variance at operating level (53.4%)</div>
                </button>

                <button
                  onClick={() => generateDataset("dropout")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono ${
                    activeScenario === "dropout" ? "border-[#5B9BD5] shadow-[0_0_10px_rgba(91,155,213,0.2)]" : "border-cf-line hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-[#5B9BD5] flex items-center justify-between">
                    <span>6. DROPOUT / OPEN LOOP</span>
                    {activeScenario === "dropout" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-faint">0.0 mA open-circuit wire break / deadband</div>
                </button>

                {/* Benchmark Suite Option */}
                <button
                  onClick={() => generateDataset("benchmark")}
                  className={`w-full text-left p-3 rounded bg-cf-panel-2 border transition-colors text-xs font-mono mt-3 ${
                    activeScenario === "benchmark" ? "border-cf-amber bg-cf-amber/10 shadow-[0_0_12px_rgba(255,176,0,0.3)]" : "border-cf-amber/40 hover:border-cf-amber"
                  }`}
                >
                  <div className="font-bold text-cf-amber flex items-center justify-between">
                    <span>★ BALANCED BENCHMARK SUITE</span>
                    {activeScenario === "benchmark" && <span className="text-[10px]">● ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-cf-text-dim">Balanced exercise of all 5 fault modes + normal (180 samples)</div>
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-[#302B22] flex flex-col items-center">
                <div className="w-full flex justify-between text-xs font-mono mb-2">
                  <span className="text-text-dim">ANOMALY GATE THRESHOLD:</span>
                  <span className="text-amber font-bold font-mono">{zThresh.toFixed(1)}σ</span>
                </div>
                <RotaryKnob
                  label="Z-Score Gate"
                  value={zThresh}
                  min={1.5}
                  max={4.0}
                  step={0.1}
                  unit="σ"
                  accentColor="#FFB000"
                  size={84}
                  onChange={setZThresh}
                />
                <div className="w-full flex justify-between text-[10px] font-mono text-text-faint mt-2">
                  <span>Aggressive (1.5σ)</span>
                  <span>Balanced (2.5σ)</span>
                  <span>Conservative (4.0σ)</span>
                </div>
              </div>
            </div>

            {/* Classification Summary Card */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-4">
                CLASSIFICATION VERDICT
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-cf-text-faint">DETECTION STATUS</div>
                  <div className="text-xl font-mono font-bold mt-1">
                    {result?.fault_detected ? (
                      <span className="text-cf-crimson flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cf-crimson animate-pulse" />
                        ANOMALOUS FAULT DETECTED
                      </span>
                    ) : (
                      <span className="text-cf-verdigris flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cf-verdigris" />
                        PROCESS SIGNAL NOMINAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">PRIMARY FAULT</div>
                    <div className="text-xs font-mono font-bold text-cf-text mt-0.5 truncate">
                      {result?.fault_type || "EVALUATING"}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">CONFIDENCE</div>
                    <div className="text-xs font-mono font-bold text-cf-amber mt-0.5">
                      {result ? `${(result.confidence * 100).toFixed(1)}%` : "—"}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">ANOMALOUS POINTS</div>
                    <div className="text-xs font-mono font-bold text-cf-crimson mt-0.5">
                      {result?.anomalous_indices.length || 0} / {dataPoints.length}
                    </div>
                  </div>

                  <div className="bg-cf-panel-2 p-2.5 rounded border border-cf-line">
                    <div className="text-[10px] font-mono text-cf-text-faint">MEDIAN / MAD</div>
                    <div className="text-xs font-mono font-bold text-cf-text-dim mt-0.5">
                      {result?.summary_stats.median ?? "—"} / {result?.summary_stats.mad ?? "—"}
                    </div>
                  </div>
                </div>

                {/* Per-class count pills */}
                {result?.fault_counts && (
                  <div className="pt-2 border-t border-cf-line-soft">
                    <div className="text-[10px] font-mono text-cf-text-faint uppercase mb-2">
                      DETECTED SAMPLES PER CLASS
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                      {FAULT_CLASSES.map((cls) => {
                        const count = result.fault_counts?.[cls] || 0;
                        const cfg = FAULT_COLORS[cls];
                        return (
                          <div
                            key={cls}
                            className={`p-1.5 rounded border ${cfg.border} ${cfg.bg} flex items-center justify-between`}
                          >
                            <span className={cfg.text}>{cls}:</span>
                            <span className="font-bold text-cf-text">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart & Telemetry Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-cf-panel border border-cf-line rounded p-5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                  TELEMETRY OSCILLOSCOPE // {sensorTag}
                </div>
                {/* Fault Class Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                  {FAULT_CLASSES.map((cls) => {
                    const cfg = FAULT_COLORS[cls];
                    return (
                      <div key={cls} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.stroke }} />
                        <span className="text-cf-text-dim">{cls}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-full h-80 relative rounded-lg border-2 border-[#2E3B33] bg-[#090E0C] overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.85)]">
                {/* CRT Reticle & scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-30"
                  style={{
                    backgroundImage: "linear-gradient(rgba(18, 24, 20, 0) 50%, rgba(0, 0, 0, 0.6) 50%)",
                    backgroundSize: "100% 4px",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.65) 100%)",
                  }}
                />
                <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 font-mono text-[9px] text-verdigris/80 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-verdigris animate-pulse shadow-[0_0_6px_#4FA98A]" />
                  <span>OSC // CH-1 10Hz</span>
                </div>
                <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-cf-text-faint mt-3">
                <span>ACTIVE WINDOW: {dataPoints.length} SAMPLES @ 10Hz</span>
                <span>STAGE 1: MAD FILTER · STAGE 2: STATISTICAL SIGNATURE TREE</span>
              </div>
            </div>

            {/* STUCK vs DROPOUT Disambiguation Box */}
            <div className="bg-cf-panel border border-cf-line rounded p-5">
              <div className="flex items-center gap-2 font-mono text-xs text-[#5B9BD5] uppercase font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-[#5B9BD5]" />
                ENGINEERING DEEP-DIVE: STUCK VS. DROPOUT DISAMBIGUATION
              </div>
              <p className="text-xs text-cf-text-dim leading-relaxed mb-3">
                Both <strong>STUCK</strong> and <strong>DROPOUT</strong> exhibit zero rolling variance (a flatline). In physical 
                instrumentation (4–20 mA current loops), an open-circuit wire break or dead transmitter drops the signal to 
                <strong> 0.0 mA</strong> (or below 3.6 mA per NAMUR NE43 standard), whereas a mechanically seized diaphragm freezes 
                at the current operating process value (e.g. 52.8%).
              </p>
              <div className="p-3 bg-cf-panel-2 rounded border border-cf-line text-xs font-mono text-cf-text-dim leading-relaxed">
                <span className="text-cf-amber">Distinguishing Rule:</span> If rolling std dev &lt; 0.02 at non-zero operating 
                pressure/level (&gt; 1.0%), tag is classified as <span className="text-[#C5A059] font-bold">STUCK</span>. 
                If signal falls to 0.0 mA or NaN, tag is classified as <span className="text-[#5B9BD5] font-bold">DROPOUT</span>. 
                <br />
                <span className="text-cf-crimson">Important Caveat:</span> If a digital SCADA / fieldbus system implements dropout 
                via &quot;sample-and-hold last known good&quot; without out-of-band communication health bits, it is 
                <em> mathematically indistinguishable</em> from a stuck diaphragm. Telemetry status words are required in digital fieldbuses.
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Section: Confusion Matrix & Per-Class Precision / Recall */}
        {result?.confusion_matrix && result?.per_class_metrics && (
          <section className="mt-8 bg-cf-panel border border-cf-line rounded p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-cf-line-soft pb-4">
              <div>
                <div className="font-mono text-xs text-cf-amber uppercase tracking-wider">
                  CLASSIFICATION EVALUATION &amp; CLASS IMBALANCE BENCHMARK
                </div>
                <h2 className="font-heading text-lg font-semibold text-cf-text mt-1">
                  6×6 Confusion Matrix &amp; Per-Class Precision / Recall
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-cf-panel-2 px-3 py-1.5 rounded border border-cf-line font-mono text-xs">
                  <span className="text-cf-text-faint">OVERALL ACCURACY: </span>
                  <span className="text-cf-amber font-bold text-sm">{result.overall_accuracy?.toFixed(2)}%</span>
                </div>
                <div className="bg-cf-panel-2 px-3 py-1.5 rounded border border-cf-line font-mono text-xs text-cf-text-dim">
                  <span>SAMPLES: </span>
                  <span className="text-cf-text font-bold">{dataPoints.length}</span>
                </div>
              </div>
            </div>

            {/* Why Class Imbalance Matters Note */}
            <div className="bg-cf-panel-2 border border-cf-line rounded p-3 text-xs text-cf-text-dim mb-6 font-mono">
              <span className="text-cf-amber font-bold">WHY CLASS IMBALANCE MATTERS: </span>
              In real industrial plants, 99%+ of sensor timesteps are nominal. Reporting aggregate accuracy on an imbalanced 
              signal would misleadingly show 99% accuracy even if a model completely missed every stuck transmitter or drift. 
              The confusion matrix and per-class precision/recall below reveal the genuine diagnostic performance for each fault mode.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Confusion Matrix Table */}
              <div className="lg:col-span-6 overflow-x-auto">
                <div className="text-xs font-mono text-cf-text-faint uppercase mb-2">
                  CONFUSION MATRIX (ACTUAL ROWS × PREDICTED COLUMNS)
                </div>
                <table className="w-full text-xs font-mono border-collapse border border-cf-line">
                  <thead>
                    <tr className="bg-cf-panel-2 text-cf-text-dim">
                      <th className="p-2 border border-cf-line text-left">ACTUAL \ PRED</th>
                      {FAULT_CLASSES.map((cls) => (
                        <th key={cls} className="p-2 border border-cf-line text-center">
                          {cls}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FAULT_CLASSES.map((act) => {
                      const row = result.confusion_matrix?.[act] || {};
                      const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={act} className="hover:bg-cf-panel-2/50 transition-colors">
                          <td className="p-2 border border-cf-line font-bold text-cf-text">
                            {act} <span className="text-[10px] text-cf-text-faint">({rowTotal})</span>
                          </td>
                          {FAULT_CLASSES.map((pred) => {
                            const val = row[pred] ?? 0;
                            const isDiagonal = act === pred;
                            let cellBg = "";
                            let cellText = "text-cf-text-faint";

                            if (isDiagonal && val > 0) {
                              cellBg = "bg-cf-verdigris/15";
                              cellText = "text-cf-verdigris font-bold";
                            } else if (!isDiagonal && val > 0) {
                              cellBg = "bg-cf-crimson/15";
                              cellText = "text-cf-crimson font-bold";
                            }

                            return (
                              <td
                                key={pred}
                                className={`p-2 border border-cf-line text-center ${cellBg} ${cellText}`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Per-Class Metrics Table */}
              <div className="lg:col-span-6 overflow-x-auto">
                <div className="text-xs font-mono text-cf-text-faint uppercase mb-2">
                  PER-CLASS PRECISION, RECALL &amp; F1-SCORE
                </div>
                <table className="w-full text-xs font-mono border-collapse border border-cf-line">
                  <thead>
                    <tr className="bg-cf-panel-2 text-cf-text-dim">
                      <th className="p-2 border border-cf-line text-left">FAULT CLASS</th>
                      <th className="p-2 border border-cf-line text-right">PRECISION</th>
                      <th className="p-2 border border-cf-line text-right">RECALL</th>
                      <th className="p-2 border border-cf-line text-right">F1-SCORE</th>
                      <th className="p-2 border border-cf-line text-right">SUPPORT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAULT_CLASSES.map((cls) => {
                      const m = result.per_class_metrics?.[cls] || { precision: 0, recall: 0, f1_score: 0, support: 0 };
                      const cfg = FAULT_COLORS[cls];
                      return (
                        <tr key={cls} className="hover:bg-cf-panel-2/50 transition-colors">
                          <td className="p-2 border border-cf-line font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.stroke }} />
                            <span className={cfg.text}>{cls}</span>
                          </td>
                          <td className="p-2 border border-cf-line text-right font-bold text-cf-text">
                            {m.precision.toFixed(1)}%
                          </td>
                          <td className="p-2 border border-cf-line text-right font-bold text-cf-text">
                            {m.recall.toFixed(1)}%
                          </td>
                          <td className="p-2 border border-cf-line text-right text-cf-amber font-bold">
                            {m.f1_score.toFixed(1)}%
                          </td>
                          <td className="p-2 border border-cf-line text-right text-cf-text-dim">
                            {m.support}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Diagnostic Feature Summary */}
                <div className="mt-4 p-3 bg-cf-panel-2 rounded border border-cf-line text-[11px] font-mono text-cf-text-dim space-y-1">
                  <div className="text-cf-amber font-semibold uppercase mb-1">DECISION SIGNATURE RULES:</div>
                  <div>• <strong>DROPOUT:</strong> Signal ≤ 1.0% (0.0 mA loop current or NaN)</div>
                  <div>• <strong>STUCK:</strong> Rolling variance σ &lt; 0.02 at process operating level (&gt; 1.0%)</div>
                  <div>• <strong>NOISE:</strong> Rolling σ &gt; 2.0× baseline while mean remains near setpoint</div>
                  <div>• <strong>SPIKE:</strong> Isolated jump |Δx| &gt; 3.0× baseline returning within 1 sample</div>
                  <div>• <strong>DRIFT:</strong> Sustained departure &gt; 2.0× baseline with smooth step differences</div>
                </div>
              </div>
            </div>
          </section>
        )}
        </InstrumentPanel>
      </main>

      <SiteFooter subtitle="DIAGNOSTIC ENGINE // MULTI-CLASS FAULT CLASSIFIER" />
    </div>
  );
}
