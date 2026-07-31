'use client';

import { useEffect, useMemo, useState } from 'react';

import CascadeGraph from '@/components/CascadeGraph';
import SpreadTimeline from '@/components/SpreadTimeline';
import InfluencerNodes from '@/components/InfluencerNodes';
import DecayCurves from '@/components/DecayCurves';
import ReplayControls from '@/components/ReplayControls';
import WhyMattersPanel from '@/components/WhyMattersPanel';
import WhoControlsRailPanel from '@/components/WhoControlsRailPanel';
import Filters from '@/components/Filters';
import DownloadSampleData from '@/components/DownloadSampleData';

import type {
  CascadeData,
  PropagationEvent,
} from '@/types/cascade';

type TimeRange = '5m' | '15m' | '30m' | '1h';

interface ProcessedCascadeData extends CascadeData {
  visibleEvents: PropagationEvent[];
}

const TIME_RANGE_MINUTES: Record<TimeRange, number> = {
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
};

function getEventBounds(events: PropagationEvent[]) {
  if (events.length === 0) {
    const now = Date.now();

    return {
      startMs: now,
      endMs: now,
    };
  }

  const timestamps = events.map((event) =>
    new Date(event.timestamp).getTime(),
  );

  return {
    startMs: Math.min(...timestamps),
    endMs: Math.max(...timestamps),
  };
}

export default function CascadeExplorer() {
  const [cascadeData, setCascadeData] =
    useState<CascadeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [timeRange, setTimeRange] =
    useState<TimeRange>('1h');
  const [minInfluence, setMinInfluence] =
    useState(0);
  const [showLabels, setShowLabels] =
    useState(true);
  const [nodeSize, setNodeSize] =
    useState(50);

  const [isPlaying, setIsPlaying] =
    useState(false);
  const [currentTime, setCurrentTime] =
    useState(0);
  const [speed, setSpeed] =
    useState(1);

  const replayDuration = useMemo(() => {
    if (
      !cascadeData ||
      cascadeData.events.length === 0
    ) {
      return 1;
    }

    const { startMs, endMs } =
      getEventBounds(cascadeData.events);

    return Math.max(
      1,
      (endMs - startMs) / 1000,
    );
  }, [cascadeData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        '/api/cascade',
        { cache: 'no-store' },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`,
        );
      }

      const data =
        (await response.json()) as CascadeData;

      if (
        !Array.isArray(data.events) ||
        !Array.isArray(data.nodes) ||
        !Array.isArray(data.metrics)
      ) {
        throw new Error(
          'Invalid cascade response: missing events, nodes, or metrics.',
        );
      }

      setCascadeData(data);
      setCurrentTime(0);
      setIsPlaying(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred.',
      );
      setCascadeData(null);
      setIsPlaying(false);
      setCurrentTime(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCurrentTime((previous) => {
        const next = previous + 0.1 * speed;

        if (next >= replayDuration) {
          setIsPlaying(false);
          return replayDuration;
        }

        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isPlaying, speed, replayDuration]);

  const processedData =
    useMemo<ProcessedCascadeData | null>(() => {
      if (!cascadeData) {
        return null;
      }

      const { startMs, endMs } =
        getEventBounds(cascadeData.events);

      const replayMs = Math.min(
        endMs,
        startMs + currentTime * 1000,
      );

      const rangeMinutes =
        TIME_RANGE_MINUTES[timeRange];

      const rangeCutoffMs =
        endMs - rangeMinutes * 60 * 1000;

      let events = cascadeData.events.filter(
        (event) =>
          new Date(event.timestamp).getTime() >=
          rangeCutoffMs,
      );

      events = events.filter(
        (event) =>
          new Date(event.timestamp).getTime() <=
          replayMs,
      );

      const influenceEligibleIds = new Set(
        cascadeData.nodes
          .filter(
            (node) =>
              node.influence_score >=
              minInfluence,
          )
          .map((node) => node.id),
      );

      const activeActorIds = new Set(
        events.map((event) => event.actor_id),
      );

      const visibleNodeIds = new Set(
        cascadeData.nodes
          .filter(
            (node) =>
              influenceEligibleIds.has(node.id) &&
              activeActorIds.has(node.id),
          )
          .map((node) => node.id),
      );

      events = events.filter((event) =>
        visibleNodeIds.has(event.actor_id),
      );

      const visibleNodes =
        cascadeData.nodes.filter((node) =>
          visibleNodeIds.has(node.id),
        );

      const visibleNodeIdSet = new Set(
        visibleNodes.map((node) => node.id),
      );

      const visibleInfluencers =
        cascadeData.influencers.filter((node) =>
          visibleNodeIdSet.has(node.id),
        );

      return {
        ...cascadeData,
        nodes: visibleNodes,
        influencers: visibleInfluencers,
        events,
        visibleEvents: events,
      };
    }, [
      cascadeData,
      timeRange,
      minInfluence,
      currentTime,
    ]);

  const visibleMetrics = useMemo(() => {
    if (!cascadeData) {
      return [];
    }

    const { startMs, endMs } =
      getEventBounds(cascadeData.events);

    const replayMs = Math.min(
      endMs,
      startMs + currentTime * 1000,
    );

    const rangeMinutes =
      TIME_RANGE_MINUTES[timeRange];

    const rangeCutoffMs =
      endMs - rangeMinutes * 60 * 1000;

    return cascadeData.metrics.filter(
      (metric) => {
        const timestamp =
          new Date(metric.timestamp).getTime();

        return (
          timestamp >= rangeCutoffMs &&
          timestamp <= replayMs
        );
      },
    );
  }, [
    cascadeData,
    currentTime,
    timeRange,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rails-obsidian text-rails-text">
        <div className="flex min-h-screen items-center justify-center bg-rails-grid bg-rails-grid-size">
          <div className="w-full max-w-md border border-rails-border bg-rails-surface/95 p-8 shadow-rails-glow">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rails-cyan shadow-[0_0_14px_rgba(56,189,248,0.8)]" />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-rails-cyan">
                RRIL / DIST &amp; DEMAND
              </span>
            </div>

            <h1 className="text-xl font-semibold text-white">
              Initializing intelligence terminal
            </h1>

            <p className="mt-2 text-sm leading-6 text-rails-textMuted">
              Loading event stream, topology, and
              propagation metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rails-obsidian p-6 text-rails-text">
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-lg border border-red-500/30 bg-rails-surface p-7 shadow-rails-glow">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center border border-red-500/30 bg-red-500/10 font-bold text-red-300">
                !
              </span>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-300">
                  RRIL / DATA PIPELINE
                </p>

                <h1 className="mt-1 text-xl font-semibold text-white">
                  Cascade Load Failure
                </h1>
              </div>
            </div>

            <p className="mb-5 text-sm leading-6 text-rails-textMuted">
              {error}
            </p>

            <button
              onClick={() => void fetchData()}
              className="border border-rails-cyan bg-rails-cyan px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Retry data load
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cascadeData || !processedData) {
    return (
      <div className="min-h-screen bg-rails-obsidian text-rails-text">
        <div className="flex min-h-screen items-center justify-center text-rails-textMuted">
          No cascade scenario available.
        </div>
      </div>
    );
  }

  const activeEventCount =
    processedData.events.length;

  const activeRepostCount =
    processedData.events.filter(
      (event) => event.action === 'repost',
    ).length;

  const replayPercent =
    replayDuration > 0
      ? Math.min(
          100,
          Math.round(
            (currentTime / replayDuration) * 100,
          ),
        )
      : 0;

  const peakVelocity = Number.isFinite(
    cascadeData.peak_velocity,
  )
    ? cascadeData.peak_velocity
    : 0;

  const top3ReachShare = Number.isFinite(
    cascadeData.top3_reach_share,
  )
    ? cascadeData.top3_reach_share
    : 0;

  const controlScore = Number.isFinite(
    cascadeData.control_score,
  )
    ? cascadeData.control_score
    : 0;

  const chartData = {
    ...processedData,
    metrics: visibleMetrics,
  };

  const concentrationLabel =
    top3ReachShare >= 70
      ? 'HIGH CONCENTRATION'
      : top3ReachShare >= 40
        ? 'MODERATE CONCENTRATION'
        : 'BROAD DISTRIBUTION';

  return (
    <div className="min-h-screen overflow-x-hidden bg-rails-obsidian text-rails-text">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-4 md:px-6 lg:px-8">
        {/* -----------------------------------------------------
            HEADER / TERMINAL BAR
        ----------------------------------------------------- */}
        <header className="mb-5 border border-rails-border bg-rails-surface shadow-rails-glow">
          <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                <span className="border border-rails-cyan/30 bg-rails-cyan/5 px-2 py-1 text-rails-cyan">
                  RRIL
                </span>

                <span className="border border-rails-border bg-slate-950/30 px-2 py-1 text-rails-textMuted">
                  Distribution &amp; Demand
                </span>

                <span className="border border-rails-border bg-slate-950/30 px-2 py-1 text-rails-textMuted">
                  Synthetic Source
                </span>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Social Virality Cascade Explorer
                </h1>

                <span className="font-mono text-[11px] text-rails-textMuted">
                  scenario://
                  {cascadeData.scenario_id}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-rails-textMuted">
                Trace how information moves through
                a distribution network, where reach
                concentrates, and which network positions
                carry disproportionate amplification power.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="border border-rails-border bg-slate-950/40 px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-rails-textMuted">
                  Status
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-rails-cyan shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                  Replay Ready
                </div>
              </div>

              <button
                onClick={() => void fetchData()}
                className="border border-rails-border bg-rails-surfaceRaised px-4 py-2.5 text-xs font-semibold text-white transition hover:border-rails-cyan/50 hover:text-rails-cyan"
              >
                Refresh Scenario
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-rails-border sm:grid-cols-4">
            <div className="border-r border-rails-border px-5 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
                Active Nodes
              </div>
              <div className="mt-1 text-xl font-semibold text-white">
                {processedData.nodes.length}
              </div>
            </div>

            <div className="border-r border-rails-border px-5 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
                Propagation Events
              </div>
              <div className="mt-1 text-xl font-semibold text-white">
                {activeEventCount}
              </div>
              <div className="mt-0.5 text-[10px] text-rails-textMuted">
                {activeRepostCount} reposts
              </div>
            </div>

            <div className="border-r border-rails-border px-5 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
                Peak Velocity
              </div>
              <div className="mt-1 text-xl font-semibold text-rails-cyan">
                {peakVelocity.toFixed(0)}
              </div>
              <div className="mt-0.5 text-[10px] text-rails-textMuted">
                reposts / minute
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
                Replay Position
              </div>
              <div className="mt-1 text-xl font-semibold text-white">
                {replayPercent}%
              </div>
              <div className="mt-0.5 text-[10px] text-rails-textMuted">
                {currentTime.toFixed(1)}s /{' '}
                {replayDuration.toFixed(1)}s
              </div>
            </div>
          </div>
        </header>

        {/* -----------------------------------------------------
            70 / 30 MAIN STAGE + INTELLIGENCE SIDEBAR
        ----------------------------------------------------- */}
        <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
          {/* ================= MAIN STAGE ================== */}
          <section className="min-w-0 space-y-5">
            <div className="border border-rails-border bg-rails-surface p-4 shadow-rails-glow md:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                    Main Stage / Network Topology
                  </div>

                  <h2 className="text-base font-semibold text-white">
                    Cascade Spread Topology
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-rails-textMuted">
                    Event-derived propagation paths across
                    the synthetic distribution network.
                  </p>
                </div>

                <div className="hidden border border-rails-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted sm:block">
                  Interactive
                </div>
              </div>

              <CascadeGraph
                data={processedData}
                showLabels={showLabels}
                nodeSizeScaling={nodeSize}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="border border-rails-border bg-rails-surface p-4 shadow-rails-glow md:p-5">
                <div className="mb-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                    Temporal Signal
                  </div>

                  <h2 className="mt-1 text-base font-semibold text-white">
                    Spread &amp; Exposure Timeline
                  </h2>

                  <p className="mt-1 text-xs text-rails-textMuted">
                    Exposure and propagation through the
                    selected replay window.
                  </p>
                </div>

                <SpreadTimeline
                  data={chartData}
                  currentTime={currentTime}
                  duration={replayDuration}
                />
              </div>

              <div className="border border-rails-border bg-rails-surface p-4 shadow-rails-glow md:p-5">
                <div className="mb-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-rails-indigo">
                    Temporal Signal
                  </div>

                  <h2 className="mt-1 text-base font-semibold text-white">
                    Propagation Decay
                  </h2>

                  <p className="mt-1 text-xs text-rails-textMuted">
                    How quickly distribution momentum
                    attenuates.
                  </p>
                </div>

                <DecayCurves
                  data={chartData}
                  currentTime={currentTime}
                  duration={replayDuration}
                />
              </div>
            </div>
          </section>

          {/* ================= SIDEBAR ====================== */}
          <aside className="min-w-0 space-y-4">
            {/* Primary Intelligence */}
            <section className="border border-rails-cyan/20 bg-rails-surface p-5 shadow-rails-glow-strong">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                Intelligence Sidebar
              </div>

              <h2 className="mt-2 text-lg font-semibold text-white">
                Distribution Concentration
              </h2>

              <p className="mt-2 text-xs leading-5 text-rails-textMuted">
                A small number of positions in a
                distribution network can account for a
                disproportionate share of downstream reach.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border border-rails-border bg-slate-950/35 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-rails-textMuted">
                    Top-3 Reach Share
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-rails-cyan">
                    {top3ReachShare.toFixed(0)}%
                  </div>
                </div>

                <div className="border border-rails-border bg-slate-950/35 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-rails-textMuted">
                    Control Score
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-rails-indigo">
                    {controlScore.toFixed(0)}
                  </div>
                </div>
              </div>

              <div
                className="mt-3 border border-rails-border bg-slate-950/35 p-3"
                title="A qualitative interpretation of how concentrated downstream reach is among a small number of distribution nodes."
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-rails-textMuted">
                  Interpretation
                </div>
                <div className="mt-1 text-xs font-semibold text-white">
                  {concentrationLabel}
                </div>
                <p className="mt-1 text-[11px] leading-5 text-rails-textMuted">
                  {top3ReachShare >= 70
                    ? 'Distribution is highly dependent on a small set of high-leverage network positions.'
                    : top3ReachShare >= 40
                      ? 'Reach is meaningfully concentrated, but propagation is not dominated by only a few positions.'
                      : 'Downstream reach is comparatively distributed across the visible network.'}
                </p>
              </div>
            </section>

            {/* Why This Matters */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                A / Why This Matters
              </div>

              <WhyMattersPanel data={cascadeData} />
            </section>

            {/* Who Controls the Rail */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-indigo">
                B / Who Controls the Rail
              </div>

              <p className="mb-4 text-xs leading-5 text-rails-textMuted">
                Social distribution is shaped by a feedback
                loop between platforms, recommendation
                systems, influential users, and audiences.
                Visibility can compound around already-visible
                positions.
              </p>

              <WhoControlsRailPanel
                influencers={
                  processedData.influencers
                }
                top3ReachShare={
                  top3ReachShare
                }
                controlScore={
                  controlScore
                }
              />
            </section>

            {/* Influencers / Critical Distribution Nodes */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                Critical Distribution Nodes
              </div>

              <InfluencerNodes
                data={processedData}
              />
            </section>

            {/* Filters */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-textMuted">
                C / Functional Filters
              </div>

              <Filters
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                minInfluence={minInfluence}
                setMinInfluence={setMinInfluence}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                nodeSize={nodeSize}
                setNodeSize={setNodeSize}
              />
            </section>

            {/* Replay */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-cyan">
                Replay / Event Stream
              </div>

              <ReplayControls
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                speed={speed}
                setSpeed={setSpeed}
                duration={replayDuration}
                data={processedData}
              />
            </section>

            {/* Download */}
            <section className="border border-rails-border bg-rails-surface p-5">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-rails-textMuted">
                D / Sample Data
              </div>

              <DownloadSampleData
                data={cascadeData}
                onRegenerate={fetchData}
              />
            </section>
          </aside>
        </main>

        <footer className="mt-7 border-t border-rails-border py-5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-rails-muted">
          Real Rails Intelligence Library / Distribution &amp; Demand /
          Synthetic event-driven cascade
        </footer>
      </div>
    </div>
  );
}