"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WarehouseDiagram from "@/components/warehouse/WarehouseDiagram";
import {
  createDESWarehouse,
  stepDES,
  advanceDESTo,
  getDESMetrics,
  DESConfig,
  DESState,
  SimulationEvent,
} from "@/lib/des-warehouse";

// Default initial simulation configuration
const DEFAULT_CONFIG: DESConfig = {
  arrivalRate: 0.1667, // 10 items/min (mean inter-arrival = 6.0s)
  conveyorTransitTime: 2.0, // 2.0s per conveyor segment
  stations: [
    { id: "st-01", name: "Inspection", tag: "ST-01", meanServiceTime: 3.8, serviceTimeVariance: 0.15 },
    { id: "st-02", name: "Sorting", tag: "ST-02", meanServiceTime: 4.8, serviceTimeVariance: 0.20 },
    { id: "st-03", name: "Packing", tag: "ST-03", meanServiceTime: 3.2, serviceTimeVariance: 0.15 },
  ],
};

type PlaybackSpeed = 1 | 2 | 5 | 10 | 20;

export default function WarehouseSimulatorPage() {
  const [config, setConfig] = useState<DESConfig>(DEFAULT_CONFIG);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedWarp, setSpeedWarp] = useState<PlaybackSpeed>(2);
  const [activePreset, setActivePreset] = useState<string>("balanced");

  // DES Engine State Container
  const simStateRef = useRef<DESState>(createDESWarehouse(DEFAULT_CONFIG));
  const [renderTick, setRenderTick] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<number>(0);

  // Animation frame loop for continuous playback
  const lastRealTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Force re-render state trigger
  const triggerRender = useCallback(() => {
    setDisplayTime(simStateRef.current.simTime);
    setRenderTick((v) => v + 1);
  }, []);

  // Reset simulator
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    simStateRef.current = createDESWarehouse(config);
    triggerRender();
  }, [config, triggerRender]);

  // Execute single discrete event (Step Next Event)
  const handleStepNextEvent = useCallback(() => {
    setIsPlaying(false);
    const event = stepDES(simStateRef.current);
    if (event) {
      triggerRender();
    }
  }, [triggerRender]);

  // Fast forward N events instantaneously
  const handleFastForward = useCallback((numEvents: number) => {
    setIsPlaying(false);
    for (let i = 0; i < numEvents; i++) {
      if (!stepDES(simStateRef.current)) break;
    }
    triggerRender();
  }, [triggerRender]);

  // Animation loop for smooth playback
  const runPlaybackLoop = useCallback(
    (currentTime: number) => {
      if (!lastRealTimeRef.current) lastRealTimeRef.current = currentTime;
      const realDt = (currentTime - lastRealTimeRef.current) / 1000; // real seconds
      lastRealTimeRef.current = currentTime;

      // Advance simulated time proportional to speedWarp
      const simDt = realDt * speedWarp;
      const targetSimTime = simStateRef.current.simTime + simDt;

      advanceDESTo(simStateRef.current, targetSimTime, 100);
      setDisplayTime(simStateRef.current.simTime);
      setRenderTick((v) => v + 1);

      if (isPlaying) {
        animFrameIdRef.current = requestAnimationFrame(runPlaybackLoop);
      }
    },
    [isPlaying, speedWarp]
  );

  useEffect(() => {
    if (isPlaying) {
      lastRealTimeRef.current = performance.now();
      animFrameIdRef.current = requestAnimationFrame(runPlaybackLoop);
    } else {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      lastRealTimeRef.current = 0;
    }
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, runPlaybackLoop]);

  // Preset Configurations
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    let newArrival = 0.1667;
    let stTimes = [3.8, 4.8, 3.2];

    if (presetName === "balanced") {
      // Arrival = 8.0/min, capacity comfortably exceeds arrival
      newArrival = 8.0 / 60;
      stTimes = [3.5, 4.2, 3.0];
    } else if (presetName === "sorting-bottleneck") {
      // Arrival = 14.0/min (0.233/s), Sorting = 6.5s (capacity 9.2/min) -> bottleneck forms!
      newArrival = 14.0 / 60;
      stTimes = [3.0, 6.5, 2.8];
    } else if (presetName === "surge-inflow") {
      // Arrival = 22.0/min (0.366/s) -> all queues saturate
      newArrival = 22.0 / 60;
      stTimes = [4.0, 5.0, 3.5];
    }

    const newConfig: DESConfig = {
      ...config,
      arrivalRate: newArrival,
      stations: config.stations.map((st, i) => ({
        ...st,
        meanServiceTime: stTimes[i],
      })),
    };

    setConfig(newConfig);
    setIsPlaying(false);
    simStateRef.current = createDESWarehouse(newConfig);
    triggerRender();
  };

  // Slider adjustments
  const updateArrivalRate = (ratePerMin: number) => {
    const newArrival = ratePerMin / 60;
    const newConfig = { ...config, arrivalRate: newArrival };
    setConfig(newConfig);
    simStateRef.current.config.arrivalRate = newArrival;
    triggerRender();
  };

  const updateStationServiceTime = (index: number, seconds: number) => {
    const updated = [...config.stations];
    updated[index] = { ...updated[index], meanServiceTime: seconds };
    const newConfig = { ...config, stations: updated };
    setConfig(newConfig);
    simStateRef.current.config.stations[index].meanServiceTime = seconds;
    simStateRef.current.stations[index].config.meanServiceTime = seconds;
    triggerRender();
  };

  // Metrics
  const metrics = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = renderTick; // trigger recalculation
    return getDESMetrics(simStateRef.current);
  }, [renderTick]);

  // Formatted simulation clock
  const formattedClock = useMemo(() => {
    const totalSecs = Math.floor(displayTime);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const centis = Math.floor((displayTime - totalSecs) * 100);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  }, [displayTime]);

  const eventHistory = simStateRef.current.eventHistory;
  const upcomingEvents = simStateRef.current.eventQueue.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col engineering-grid-bg text-cf-text">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Module Header */}
        <header className="mb-6 max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-xs text-cf-amber tracking-widest uppercase mb-2">
            <span>SIMULATORS // LOGISTICS &amp; DISCRETE-EVENT SYSTEMS</span>
            <span>·</span>
            <span>MILESTONE 1</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-cf-text mb-3">
            Warehouse Automation &amp; Conveyor Line Simulator
          </h1>
          <p className="text-cf-text-dim text-sm md:text-base leading-relaxed">
            A pure <strong>Discrete-Event Simulation (DES)</strong> engine modeling an industrial 3-station conveyor line 
            (<em>Inspection &rarr; Sorting &rarr; Packing</em>). Unlike continuous PID/ODE simulators that advance on uniform 
            clock ticks (<span className="font-mono text-cf-amber">&Delta;t = const</span>), this engine leaps across irregular 
            intervals driven by a prioritized <strong>Future Event List (FEL)</strong> and Poisson package arrivals.
          </p>
        </header>

        {/* Paradigm Shift Educational Banner */}
        <div className="bg-cf-panel-2 border border-cf-line rounded p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cf-amber animate-pulse" />
            <div>
              <span className="text-cf-amber font-bold">PARADIGM SHIFT: </span>
              <span className="text-cf-text-dim">
                Continuous Systems (Euler/PID) &rarr; Discrete-Event Systems (Priority Queue)
              </span>
            </div>
          </div>
          <div className="text-cf-text-faint text-[11px] bg-cf-panel px-2.5 py-1 rounded border border-cf-line">
            STATE CHANGES AT EVENT TIMESTAMPS ONLY (t_k &rarr; t_k+1)
          </div>
        </div>

        {/* Control & Master Instrument Panel */}
        <div className="bg-cf-panel border border-cf-line rounded p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cf-line-soft pb-4 mb-5">
            {/* Simulation Clock Readout */}
            <div className="flex items-center gap-4">
              <div className="bg-cf-panel-2 px-4 py-2 rounded border border-cf-line">
                <div className="text-[10px] font-mono text-cf-text-faint uppercase">SIMULATED TIME (t_sim)</div>
                <div className="font-mono text-2xl font-bold text-cf-amber tracking-wider glow-amber">
                  {formattedClock}
                </div>
              </div>

              <div className="bg-cf-panel-2 px-3 py-2 rounded border border-cf-line">
                <div className="text-[10px] font-mono text-cf-text-faint uppercase">CLOCK STATE</div>
                <div className="font-mono text-xs font-bold flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlaying ? "bg-cf-verdigris animate-pulse" : "bg-cf-amber"
                    }`}
                  />
                  <span className={isPlaying ? "text-cf-verdigris" : "text-cf-amber"}>
                    {isPlaying ? `RUNNING (${speedWarp}x WARP)` : "PAUSED / STEP"}
                  </span>
                </div>
              </div>
            </div>

            {/* Playback & Step Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  isPlaying
                    ? "bg-cf-crimson text-white hover:bg-cf-crimson/90"
                    : "bg-cf-amber text-cf-bg hover:bg-cf-amber/90"
                }`}
              >
                <span>{isPlaying ? "❚❚ PAUSE" : "▶ RUN SIMULATION"}</span>
              </button>

              <button
                onClick={handleStepNextEvent}
                disabled={isPlaying}
                className="px-3 py-2 rounded font-mono text-xs border border-cf-line bg-cf-panel-2 hover:border-cf-amber text-cf-text disabled:opacity-40 transition-colors"
                title="Pop and execute the single next discrete event from the FEL"
              >
                ⏭ STEP NEXT EVENT
              </button>

              <button
                onClick={() => handleFastForward(50)}
                disabled={isPlaying}
                className="px-3 py-2 rounded font-mono text-xs border border-cf-line bg-cf-panel-2 hover:border-cf-amber text-cf-text-dim hover:text-cf-text disabled:opacity-40 transition-colors"
                title="Instantly execute 50 events in batch"
              >
                ⏩ BATCH (50 EVTS)
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-2 rounded font-mono text-xs border border-cf-line bg-cf-panel-2 hover:border-cf-crimson text-cf-text-dim hover:text-cf-crimson transition-colors"
              >
                ↺ RESET
              </button>
            </div>

            {/* Speed Warp Selector */}
            <div className="flex items-center gap-1 bg-cf-panel-2 p-1 rounded border border-cf-line text-xs font-mono">
              <span className="px-2 text-[10px] text-cf-text-faint">SPEED:</span>
              {([1, 2, 5, 10, 20] as PlaybackSpeed[]).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedWarp(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    speedWarp === spd ? "bg-cf-amber text-cf-bg" : "text-cf-text-dim hover:text-cf-text"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Presets & Parameter Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Presets */}
            <div className="md:col-span-4 flex flex-col gap-2">
              <div className="font-mono text-[11px] text-cf-text-faint uppercase">SCENARIO PRESETS</div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => applyPreset("balanced")}
                  className={`text-left p-2.5 rounded border font-mono text-xs transition-colors ${
                    activePreset === "balanced"
                      ? "border-cf-verdigris bg-cf-verdigris/10 text-cf-verdigris"
                      : "border-cf-line bg-cf-panel-2 text-cf-text-dim hover:border-cf-amber hover:text-cf-text"
                  }`}
                >
                  <div className="font-bold">1. Balanced Flow (Steady)</div>
                  <div className="text-[10px] opacity-75">λ = 8/min · Service &approx; 3.5–4.2s (No Bottleneck)</div>
                </button>

                <button
                  onClick={() => applyPreset("sorting-bottleneck")}
                  className={`text-left p-2.5 rounded border font-mono text-xs transition-colors ${
                    activePreset === "sorting-bottleneck"
                      ? "border-cf-crimson bg-cf-crimson/10 text-cf-crimson"
                      : "border-cf-line bg-cf-panel-2 text-cf-text-dim hover:border-cf-amber hover:text-cf-text"
                  }`}
                >
                  <div className="font-bold">2. Sorting Bottleneck</div>
                  <div className="text-[10px] opacity-75">λ = 14/min · Sorting = 6.5s (Queue Explodes)</div>
                </button>

                <button
                  onClick={() => applyPreset("surge-inflow")}
                  className={`text-left p-2.5 rounded border font-mono text-xs transition-colors ${
                    activePreset === "surge-inflow"
                      ? "border-cf-amber bg-cf-amber/10 text-cf-amber"
                      : "border-cf-line bg-cf-panel-2 text-cf-text-dim hover:border-cf-amber hover:text-cf-text"
                  }`}
                >
                  <div className="font-bold">3. Heavy Surge Overflow</div>
                  <div className="text-[10px] opacity-75">λ = 22/min · Over-capacity systemic surge</div>
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-cf-panel-2 p-3.5 rounded border border-cf-line">
              {/* Arrival Rate */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cf-text-dim">ARRIVAL RATE (λ):</span>
                  <span className="text-cf-amber font-bold">
                    {(config.arrivalRate * 60).toFixed(1)} items/min
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="0.5"
                  value={Number((config.arrivalRate * 60).toFixed(1))}
                  onChange={(e) => updateArrivalRate(parseFloat(e.target.value))}
                  className="w-full accent-cf-amber"
                />
                <div className="text-[10px] font-mono text-cf-text-faint mt-0.5">
                  Mean Inter-Arrival: {(1 / config.arrivalRate).toFixed(1)}s (Poisson process)
                </div>
              </div>

              {/* Station 0 Inspection */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cf-text-dim">ST-01 [INSPECTION]:</span>
                  <span className="text-cf-text font-bold">
                    {config.stations[0].meanServiceTime.toFixed(1)}s (cap: {(60 / config.stations[0].meanServiceTime).toFixed(1)}/m)
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.2"
                  value={config.stations[0].meanServiceTime}
                  onChange={(e) => updateStationServiceTime(0, parseFloat(e.target.value))}
                  className="w-full accent-cf-amber"
                />
              </div>

              {/* Station 1 Sorting */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cf-text-dim">ST-02 [SORTING]:</span>
                  <span className="text-[#FF6B4A] font-bold">
                    {config.stations[1].meanServiceTime.toFixed(1)}s (cap: {(60 / config.stations[1].meanServiceTime).toFixed(1)}/m)
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.2"
                  value={config.stations[1].meanServiceTime}
                  onChange={(e) => updateStationServiceTime(1, parseFloat(e.target.value))}
                  className="w-full accent-[#FF6B4A]"
                />
              </div>

              {/* Station 2 Packing */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cf-text-dim">ST-03 [PACKING]:</span>
                  <span className="text-cf-text font-bold">
                    {config.stations[2].meanServiceTime.toFixed(1)}s (cap: {(60 / config.stations[2].meanServiceTime).toFixed(1)}/m)
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.2"
                  value={config.stations[2].meanServiceTime}
                  onChange={(e) => updateStationServiceTime(2, parseFloat(e.target.value))}
                  className="w-full accent-cf-amber"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Diagram Visualization Component */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 font-mono text-xs">
            <span className="text-cf-amber uppercase tracking-wider font-semibold">
              LIVE CONVEYOR &amp; STATION TOPOLOGY
            </span>
            <span className="text-cf-text-faint">
              ACTIVE WIP ITEMS: {metrics.itemsInSystemCount}
            </span>
          </div>

          <WarehouseDiagram state={simStateRef.current} displayTime={displayTime} />
        </section>

        {/* Tracked Metrics Dashboard */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Throughput */}
          <div className="bg-cf-panel border border-cf-line rounded p-4">
            <div className="text-[10px] font-mono text-cf-text-faint uppercase">SYSTEM THROUGHPUT</div>
            <div className="font-mono text-2xl font-bold text-cf-amber mt-1">
              {metrics.throughputItemsPerMin.toFixed(2)}
              <span className="text-xs text-cf-text-dim font-normal ml-1">items/min</span>
            </div>
            <div className="text-[10px] font-mono text-cf-text-dim mt-1">
              Total Completed: <strong className="text-cf-text">{metrics.totalCompleted}</strong>
            </div>
          </div>

          {/* Average Waiting Time */}
          <div className="bg-cf-panel border border-cf-line rounded p-4">
            <div className="text-[10px] font-mono text-cf-text-faint uppercase">AVG QUEUE WAITING TIME</div>
            <div className="font-mono text-2xl font-bold text-cf-text mt-1">
              {metrics.avgWaitTimeSeconds.toFixed(2)}
              <span className="text-xs text-cf-text-dim font-normal ml-1">sec</span>
            </div>
            <div className="text-[10px] font-mono text-cf-text-dim mt-1">
              Total System Lead: <strong className="text-cf-text">{metrics.avgLeadTimeSeconds.toFixed(1)}s</strong>
            </div>
          </div>

          {/* Bottleneck Indicator */}
          <div className="bg-cf-panel border border-cf-line rounded p-4">
            <div className="text-[10px] font-mono text-cf-text-faint uppercase">PRIMARY BOTTLENECK</div>
            <div className="font-mono text-base font-bold mt-1">
              {metrics.stations.find((s) => s.isBottleneck) ? (
                <span className="text-cf-crimson flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cf-crimson animate-pulse" />
                  {metrics.stations.find((s) => s.isBottleneck)?.tag} [{metrics.stations.find((s) => s.isBottleneck)?.name.toUpperCase()}]
                </span>
              ) : (
                <span className="text-cf-verdigris flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cf-verdigris" />
                  BALANCED / NO CHOKE
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-cf-text-dim mt-1">
              Arrival Rate: <strong className="text-cf-amber">{metrics.arrivalRateItemsPerMin.toFixed(1)}/min</strong>
            </div>
          </div>

          {/* Work in Progress (WIP) */}
          <div className="bg-cf-panel border border-cf-line rounded p-4">
            <div className="text-[10px] font-mono text-cf-text-faint uppercase">WORK-IN-PROGRESS (WIP)</div>
            <div className="font-mono text-2xl font-bold text-cf-text mt-1">
              {metrics.itemsInSystemCount}
              <span className="text-xs text-cf-text-dim font-normal ml-1">items</span>
            </div>
            <div className="text-[10px] font-mono text-cf-text-dim mt-1">
              Little&apos;s Law: <strong className="text-cf-text">L &approx; &lambda; &middot; W</strong>
            </div>
          </div>
        </section>

        {/* Station Details & Utilization Bars */}
        <section className="bg-cf-panel border border-cf-line rounded p-5 mb-8">
          <div className="font-mono text-xs text-cf-amber uppercase tracking-wider mb-4">
            STATION UTILIZATION &amp; TIME-WEIGHTED QUEUE PERFORMANCE
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {metrics.stations.map((st) => {
              const isOverloaded = st.utilizationPct >= 85.0;
              const barColor = isOverloaded ? "bg-cf-crimson" : st.utilizationPct > 60 ? "bg-cf-amber" : "bg-cf-verdigris";

              return (
                <div key={st.id} className="bg-cf-panel-2 p-4 rounded border border-cf-line font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-cf-line-soft pb-2">
                    <span className="font-bold text-cf-text">
                      {st.tag} &middot; {st.name}
                    </span>
                    {st.isBottleneck && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cf-crimson/20 border border-cf-crimson text-cf-crimson font-bold">
                        BOTTLENECK
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-cf-text-dim">UTILIZATION:</span>
                      <span className="font-bold text-cf-text">{st.utilizationPct}%</span>
                    </div>
                    <div className="w-full bg-cf-panel h-2 rounded overflow-hidden border border-cf-line">
                      <div
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${st.utilizationPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <div className="text-cf-text-faint text-[10px]">CURRENT QUEUE</div>
                      <div className="font-bold text-cf-text">{st.currentQueueLength} pkgs</div>
                    </div>
                    <div>
                      <div className="text-cf-text-faint text-[10px]">AVG TIME-WEIGHTED Q</div>
                      <div className="font-bold text-cf-amber">{st.avgQueueLength}</div>
                    </div>
                    <div>
                      <div className="text-cf-text-faint text-[10px]">MAX QUEUE SEEN</div>
                      <div className="font-bold text-cf-text">{st.maxQueueLengthSeen} pkgs</div>
                    </div>
                    <div>
                      <div className="text-cf-text-faint text-[10px]">MAX CAPACITY</div>
                      <div className="font-bold text-cf-text">{st.maxCapacityItemsPerMin}/min</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Discrete-Event Engine Audit Trail: FEL & Event Execution Log */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upcoming Future Event List (FEL) */}
          <div className="lg:col-span-5 bg-cf-panel border border-cf-line rounded p-5 flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-cf-line-soft pb-2">
              <span className="text-cf-amber uppercase tracking-wider font-semibold">
                FUTURE EVENT LIST (PRIORITY QUEUE)
              </span>
              <span className="text-[11px] text-cf-text-faint">
                {simStateRef.current.eventQueue.length} QUEUED
              </span>
            </div>
            <p className="text-[11px] text-cf-text-dim leading-relaxed mb-3">
              The core data structure of DES. Events are scheduled ahead and popped in chronological order:
            </p>

            <div className="space-y-2 flex-1">
              {upcomingEvents.length === 0 ? (
                <div className="p-3 text-center text-cf-text-faint">Queue empty</div>
              ) : (
                upcomingEvents.map((evt, idx) => {
                  const deltaFromNow = Math.max(0, evt.time - displayTime);
                  return (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded bg-cf-panel-2 border border-cf-line flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <div className="font-bold text-cf-text flex items-center gap-1.5">
                          <span className="text-[9px] px-1 rounded bg-cf-line text-cf-text-dim">
                            #{idx + 1}
                          </span>
                          <span className="text-cf-amber">{evt.type}</span>
                        </div>
                        <div className="text-[10px] text-cf-text-faint mt-0.5">
                          Item #{evt.itemId} &middot; {evt.stationIndex >= 0 ? `ST-0${evt.stationIndex + 1}` : "Conveyor"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cf-text">{evt.time.toFixed(3)}s</div>
                        <div className="text-[10px] text-cf-text-faint">+{deltaFromNow.toFixed(2)}s</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chronological Event Execution Log */}
          <div className="lg:col-span-7 bg-cf-panel border border-cf-line rounded p-5 flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-cf-line-soft pb-2">
              <span className="text-cf-amber uppercase tracking-wider font-semibold">
                IRREGULAR EVENT TIMESTAMPS (DES PROOF)
              </span>
              <span className="text-[11px] text-cf-text-faint">
                NON-UNIFORM &Delta;t LEAPS
              </span>
            </div>
            <p className="text-[11px] text-cf-text-dim leading-relaxed mb-3">
              Empirical trace of discrete leaps between state transitions, demonstrating non-fixed &Delta;t:
            </p>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-cf-panel-2 text-cf-text-dim border-b border-cf-line">
                    <th className="p-1.5">EVENT #</th>
                    <th className="p-1.5">SIM TIME (t)</th>
                    <th className="p-1.5 text-cf-amber">&Delta;t JUMP</th>
                    <th className="p-1.5">TYPE</th>
                    <th className="p-1.5">ITEM</th>
                    <th className="p-1.5">TARGET</th>
                  </tr>
                </thead>
                <tbody>
                  {eventHistory.slice(0, 10).map((evt) => (
                    <tr key={evt.id} className="border-b border-cf-line-soft hover:bg-cf-panel-2/50">
                      <td className="p-1.5 font-bold text-cf-text">#{evt.id}</td>
                      <td className="p-1.5 text-cf-text">{evt.time.toFixed(3)}s</td>
                      <td className="p-1.5 font-bold text-cf-amber">+{evt.dt.toFixed(3)}s</td>
                      <td className="p-1.5 text-cf-text-dim">{evt.type}</td>
                      <td className="p-1.5 font-bold text-cf-text">#{evt.itemId}</td>
                      <td className="p-1.5 text-cf-text-faint">
                        {evt.stationIndex >= 0 ? `ST-0${evt.stationIndex + 1}` : "Infeed"}
                      </td>
                    </tr>
                  ))}
                  {eventHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-cf-text-faint">
                        No events executed yet. Click &quot;STEP NEXT EVENT&quot; or &quot;RUN SIMULATION&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter subtitle="DISCRETE-EVENT ENGINE // WAREHOUSE LOGISTICS" />
    </div>
  );
}
