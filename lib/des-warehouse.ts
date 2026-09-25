/**
 * ControlForge — Discrete-Event Simulation (DES) Engine
 * Module: Warehouse Automation & Logistics Conveyor Line
 * 
 * ARCHITECTURAL PARADIGM:
 * Unlike continuous-time simulators (fixed dt Euler/RK4 integration),
 * this engine maintains a Future Event List (FEL / Priority Queue).
 * State transitions occur exclusively at non-uniform, irregular event times
 * (t_k -> t_{k+1}), with time leaping directly between event occurrences.
 */

export type EventType =
  | "ITEM_ARRIVAL"
  | "CONVEYOR_ARRIVAL"
  | "FINISH_PROCESSING"
  | "ITEM_DEPARTURE";

export type StationStatus = "IDLE" | "BUSY" | "BLOCKED";

export interface SimulationEvent {
  id: number;
  time: number; // Absolute simulated time in seconds
  dt: number; // Delta-t from previous event
  type: EventType;
  itemId: number;
  stationIndex: number; // 0: Inspection, 1: Sorting, 2: Packing, -1: Conveyor/Entry
  description?: string;
}

export interface Item {
  id: number;
  arrivalTime: number;
  departureTime?: number;
  state: "TRANSIT" | "QUEUED" | "PROCESSING" | "COMPLETED";
  currentStation: number; // -1: entry conveyor, 0, 1, 2, 3: exit
  // Conveyor transit interpolation
  transitStartTime: number;
  transitEndTime: number;
  fromStationIndex: number;
  toStationIndex: number;
  // Queue tracking
  queueEntryTime: number;
  timeInQueues: number;
  // Service tracking
  serviceStartTime: number;
  timeInProcessing: number;
}

export interface StationConfig {
  id: string;
  name: string;
  tag: string;
  meanServiceTime: number; // seconds
  serviceTimeVariance: number; // fractional variance, e.g. 0.2 (+/- 20%)
}

export interface StationState {
  config: StationConfig;
  status: StationStatus;
  currentItem: Item | null;
  queue: Item[];
  // Time-integrated metrics (exact integrals of piecewise-constant states)
  totalBusyTime: number;
  totalIdleTime: number;
  totalBlockedTime: number;
  timeWeightedQueueLength: number; // integral of Q(t) dt
  lastStateChangeTime: number;
  itemsProcessed: number;
  maxQueueLengthSeen: number;
}

export interface DESConfig {
  arrivalRate: number; // lambda: items per second (e.g. 0.1667 = 10 items/min)
  conveyorTransitTime: number; // seconds to travel conveyor segment between stations
  stations: StationConfig[];
}

export interface DESState {
  config: DESConfig;
  simTime: number;
  lastEventTime: number;
  nextEventId: number;
  nextItemId: number;
  eventQueue: SimulationEvent[]; // Priority queue sorted by event.time
  stations: StationState[];
  itemsInSystem: Map<number, Item>;
  completedItems: Item[];
  eventHistory: SimulationEvent[]; // Chronological log of executed events
  totalArrivals: number;
  totalDepartures: number;
}

// Pseudo-random sampling helpers (reproducible with optional seed or Math.random)
export function sampleExponential(lambda: number, rnd = Math.random): number {
  const rate = Math.max(1e-5, lambda);
  const u = Math.max(1e-7, Math.min(1.0 - 1e-7, rnd()));
  return -Math.log(u) / rate;
}

export function sampleUniform(min: number, max: number, rnd = Math.random): number {
  return min + (max - min) * rnd();
}

/**
 * Initializes a new Discrete-Event Simulation instance.
 */
export function createDESWarehouse(config: DESConfig, rnd = Math.random): DESState {
  const stationStates: StationState[] = config.stations.map((st) => ({
    config: { ...st },
    status: "IDLE",
    currentItem: null,
    queue: [],
    totalBusyTime: 0.0,
    totalIdleTime: 0.0,
    totalBlockedTime: 0.0,
    timeWeightedQueueLength: 0.0,
    lastStateChangeTime: 0.0,
    itemsProcessed: 0,
    maxQueueLengthSeen: 0,
  }));

  const initialEventTime = sampleExponential(config.arrivalRate, rnd);

  const initialEvent: SimulationEvent = {
    id: 1,
    time: Number(initialEventTime.toFixed(4)),
    dt: Number(initialEventTime.toFixed(4)),
    type: "ITEM_ARRIVAL",
    itemId: 1,
    stationIndex: -1,
    description: "Initial feeder package scheduled",
  };

  return {
    config,
    simTime: 0.0,
    lastEventTime: 0.0,
    nextEventId: 2,
    nextItemId: 2,
    eventQueue: [initialEvent],
    stations: stationStates,
    itemsInSystem: new Map(),
    completedItems: [],
    eventHistory: [],
    totalArrivals: 0,
    totalDepartures: 0,
  };
}

/**
 * Priority queue insert (keeps events ordered ascending by time)
 */
function scheduleEvent(state: DESState, time: number, type: EventType, itemId: number, stationIndex: number, description?: string) {
  const event: SimulationEvent = {
    id: state.nextEventId++,
    time: Number(time.toFixed(4)),
    dt: 0, // computed upon execution
    type,
    itemId,
    stationIndex,
    description,
  };

  // Binary search insertion for O(log n) efficiency
  let low = 0;
  let high = state.eventQueue.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (state.eventQueue[mid].time <= event.time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  state.eventQueue.splice(low, 0, event);
}

/**
 * Time-weighted metric updates across the jump [state.simTime -> newTime]
 */
function advanceMetrics(state: DESState, newTime: number) {
  const dt = newTime - state.simTime;
  if (dt <= 0) return;

  for (const st of state.stations) {
    if (st.status === "BUSY") {
      st.totalBusyTime += dt;
    } else if (st.status === "IDLE") {
      st.totalIdleTime += dt;
    } else if (st.status === "BLOCKED") {
      st.totalBlockedTime += dt;
    }

    st.timeWeightedQueueLength += st.queue.length * dt;
    if (st.queue.length > st.maxQueueLengthSeen) {
      st.maxQueueLengthSeen = st.queue.length;
    }
    st.lastStateChangeTime = newTime;
  }
}

/**
 * Executes exactly ONE discrete event from the Future Event List (FEL).
 * This represents the pure atomic leap of a Discrete-Event Simulation engine.
 */
export function stepDES(state: DESState, rnd = Math.random): SimulationEvent | null {
  if (state.eventQueue.length === 0) return null;

  const event = state.eventQueue.shift()!;
  const prevTime = state.simTime;
  const dt = Number(Math.max(0, event.time - prevTime).toFixed(4));
  event.dt = dt;

  // Advance time-weighted integrals to this exact event timestamp
  advanceMetrics(state, event.time);
  state.simTime = event.time;
  state.lastEventTime = prevTime;

  switch (event.type) {
    case "ITEM_ARRIVAL": {
      state.totalArrivals++;

      // 1. Schedule next Poisson arrival
      const interArrival = sampleExponential(state.config.arrivalRate, rnd);
      const nextArrivalTime = state.simTime + interArrival;
      scheduleEvent(
        state,
        nextArrivalTime,
        "ITEM_ARRIVAL",
        state.nextItemId++,
        -1,
        `Item #${event.itemId} entered infeed conveyor`
      );

      // 2. Instantiate Item on entry conveyor
      const item: Item = {
        id: event.itemId,
        arrivalTime: state.simTime,
        state: "TRANSIT",
        currentStation: 0,
        transitStartTime: state.simTime,
        transitEndTime: state.simTime + state.config.conveyorTransitTime,
        fromStationIndex: -1,
        toStationIndex: 0,
        queueEntryTime: 0.0,
        timeInQueues: 0.0,
        serviceStartTime: 0.0,
        timeInProcessing: 0.0,
      };
      state.itemsInSystem.set(item.id, item);

      // 3. Schedule arrival at Station 0 (Inspection)
      scheduleEvent(
        state,
        item.transitEndTime,
        "CONVEYOR_ARRIVAL",
        item.id,
        0,
        `Item #${item.id} arriving at ${state.stations[0].config.name}`
      );
      break;
    }

    case "CONVEYOR_ARRIVAL": {
      const item = state.itemsInSystem.get(event.itemId);
      if (!item) break;

      const stIdx = event.stationIndex;
      const st = state.stations[stIdx];

      if (st.status === "IDLE") {
        // Station is idle: immediately start processing
        st.status = "BUSY";
        st.currentItem = item;
        item.state = "PROCESSING";
        item.currentStation = stIdx;
        item.serviceStartTime = state.simTime;

        // Sample service duration
        const variance = st.config.serviceTimeVariance;
        const servDuration = sampleUniform(
          st.config.meanServiceTime * (1 - variance),
          st.config.meanServiceTime * (1 + variance),
          rnd
        );

        scheduleEvent(
          state,
          state.simTime + servDuration,
          "FINISH_PROCESSING",
          item.id,
          stIdx,
          `Item #${item.id} processing at ${st.config.tag}`
        );
      } else {
        // Station is busy: enter FIFO queue
        item.state = "QUEUED";
        item.currentStation = stIdx;
        item.queueEntryTime = state.simTime;
        st.queue.push(item);
        if (st.queue.length > st.maxQueueLengthSeen) {
          st.maxQueueLengthSeen = st.queue.length;
        }
      }
      break;
    }

    case "FINISH_PROCESSING": {
      const stIdx = event.stationIndex;
      const st = state.stations[stIdx];
      const item = st.currentItem;
      if (!item) break;

      st.itemsProcessed++;
      item.timeInProcessing += state.simTime - item.serviceStartTime;

      // Transfer item to next conveyor or exit
      if (stIdx < state.stations.length - 1) {
        // Next station
        const nextStIdx = stIdx + 1;
        item.state = "TRANSIT";
        item.fromStationIndex = stIdx;
        item.toStationIndex = nextStIdx;
        item.transitStartTime = state.simTime;
        item.transitEndTime = state.simTime + state.config.conveyorTransitTime;

        scheduleEvent(
          state,
          item.transitEndTime,
          "CONVEYOR_ARRIVAL",
          item.id,
          nextStIdx,
          `Item #${item.id} transiting from ${st.config.tag} to ${state.stations[nextStIdx].config.tag}`
        );
      } else {
        // Final station (Packing) completed -> transit to exit palletizer
        item.state = "TRANSIT";
        item.fromStationIndex = stIdx;
        item.toStationIndex = state.stations.length;
        item.transitStartTime = state.simTime;
        item.transitEndTime = state.simTime + state.config.conveyorTransitTime;

        scheduleEvent(
          state,
          item.transitEndTime,
          "ITEM_DEPARTURE",
          item.id,
          state.stations.length,
          `Item #${item.id} dispatched to palletizer`
        );
      }

      // Check if station queue has waiting items
      if (st.queue.length > 0) {
        const nextItem = st.queue.shift()!;
        nextItem.timeInQueues += state.simTime - nextItem.queueEntryTime;
        nextItem.state = "PROCESSING";
        nextItem.serviceStartTime = state.simTime;
        st.currentItem = nextItem;

        const variance = st.config.serviceTimeVariance;
        const servDuration = sampleUniform(
          st.config.meanServiceTime * (1 - variance),
          st.config.meanServiceTime * (1 + variance),
          rnd
        );

        scheduleEvent(
          state,
          state.simTime + servDuration,
          "FINISH_PROCESSING",
          nextItem.id,
          stIdx,
          `Item #${nextItem.id} pulled from queue into ${st.config.tag}`
        );
      } else {
        st.currentItem = null;
        st.status = "IDLE";
      }
      break;
    }

    case "ITEM_DEPARTURE": {
      const item = state.itemsInSystem.get(event.itemId);
      if (item) {
        item.state = "COMPLETED";
        item.departureTime = state.simTime;
        state.completedItems.push(item);
        state.itemsInSystem.delete(item.id);
        state.totalDepartures++;
      }
      break;
    }
  }

  // Keep a scrolling log of recent events (max 50)
  state.eventHistory.unshift(event);
  if (state.eventHistory.length > 50) {
    state.eventHistory.pop();
  }

  return event;
}

/**
 * Runs the simulation forward until simTime reaches targetTime,
 * executing all scheduled discrete events in timestamp order.
 */
export function advanceDESTo(state: DESState, targetTime: number, maxEvents = 2000, rnd = Math.random): number {
  let count = 0;
  while (state.eventQueue.length > 0 && state.eventQueue[0].time <= targetTime && count < maxEvents) {
    stepDES(state, rnd);
    count++;
  }
  // If targetTime is ahead of last executed event, interpolate metric integrals
  if (state.simTime < targetTime) {
    advanceMetrics(state, targetTime);
    state.simTime = targetTime;
  }
  return count;
}

/**
 * Calculates current aggregate metrics.
 */
export function getDESMetrics(state: DESState) {
  const t = Math.max(0.1, state.simTime);
  const completed = state.completedItems;
  const numCompleted = completed.length;

  // System throughput: items completed per minute of simulated time
  const throughputItemsPerMin = (numCompleted / t) * 60;

  // Average waiting time per completed item
  const avgWaitTimeSeconds =
    numCompleted > 0
      ? completed.reduce((sum, it) => sum + it.timeInQueues, 0) / numCompleted
      : 0;

  // Average total system lead time (arrival to departure)
  const avgLeadTimeSeconds =
    numCompleted > 0
      ? completed.reduce((sum, it) => sum + (it.departureTime! - it.arrivalTime), 0) / numCompleted
      : 0;

  // Per-station utilization and time-weighted average queue length
  const stationMetrics = state.stations.map((st) => {
    const utilPct = Math.min(100.0, (st.totalBusyTime / t) * 100);
    const avgQueueLen = st.timeWeightedQueueLength / t;
    const currentQueueLen = st.queue.length;

    // Theoretical maximum service capacity: items/min
    const maxCapacityItemsPerMin = (60 / st.config.meanServiceTime);

    return {
      id: st.config.id,
      name: st.config.name,
      tag: st.config.tag,
      utilizationPct: Number(utilPct.toFixed(1)),
      avgQueueLength: Number(avgQueueLen.toFixed(2)),
      currentQueueLength: currentQueueLen,
      maxQueueLengthSeen: st.maxQueueLengthSeen,
      itemsProcessed: st.itemsProcessed,
      maxCapacityItemsPerMin: Number(maxCapacityItemsPerMin.toFixed(1)),
      isBottleneck: false, // flagged dynamically below
    };
  });

  // Identify bottleneck station (highest utilization)
  let maxUtil = 0;
  let bottleneckIdx = -1;
  stationMetrics.forEach((m, idx) => {
    if (m.utilizationPct > maxUtil) {
      maxUtil = m.utilizationPct;
      bottleneckIdx = idx;
    }
  });
  if (bottleneckIdx >= 0 && maxUtil >= 75.0) {
    stationMetrics[bottleneckIdx].isBottleneck = true;
  }

  // System arrival rate in items/min
  const arrivalRateItemsPerMin = state.config.arrivalRate * 60;

  return {
    simTimeSeconds: Number(t.toFixed(2)),
    totalArrivals: state.totalArrivals,
    totalCompleted: numCompleted,
    itemsInSystemCount: state.itemsInSystem.size,
    throughputItemsPerMin: Number(throughputItemsPerMin.toFixed(2)),
    arrivalRateItemsPerMin: Number(arrivalRateItemsPerMin.toFixed(1)),
    avgWaitTimeSeconds: Number(avgWaitTimeSeconds.toFixed(2)),
    avgLeadTimeSeconds: Number(avgLeadTimeSeconds.toFixed(2)),
    stations: stationMetrics,
  };
}
