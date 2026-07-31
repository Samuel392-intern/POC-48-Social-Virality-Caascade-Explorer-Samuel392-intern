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
import ShaderBackground from '@/components/ShaderBackground';

import type {
  CascadeData,
  PropagationEvent,
} from '@/types/cascade';

type TimeRange =
  | '5m'
  | '15m'
  | '30m'
  | '1h';

interface ProcessedCascadeData
  extends CascadeData {
  visibleEvents: PropagationEvent[];
}

const TIME_RANGE_MINUTES: Record<
  TimeRange,
  number
> = {
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
};

function getEventBounds(
  events: PropagationEvent[],
) {
  if (events.length === 0) {
    const now = Date.now();

    return {
      startMs: now,
      endMs: now,
    };
  }

  const timestamps = events.map(
    (event) =>
      new Date(
        event.timestamp,
      ).getTime(),
  );

  return {
    startMs: Math.min(
      ...timestamps,
    ),
    endMs: Math.max(
      ...timestamps,
    ),
  };
}

export default function CascadeExplorer() {
  const [
    cascadeData,
    setCascadeData,
  ] = useState<CascadeData | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    timeRange,
    setTimeRange,
  ] = useState<TimeRange>('1h');

  const [
    minInfluence,
    setMinInfluence,
  ] = useState(0);

  const [
    showLabels,
    setShowLabels,
  ] = useState(true);

  const [
    nodeSize,
    setNodeSize,
  ] = useState(50);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    speed,
    setSpeed,
  ] = useState(1);

  const replayDuration =
    useMemo(() => {
      if (
        !cascadeData ||
        cascadeData.events.length === 0
      ) {
        return 1;
      }

      const {
        startMs,
        endMs,
      } = getEventBounds(
        cascadeData.events,
      );

      return Math.max(
        1,
        (endMs - startMs) / 1000,
      );
    }, [cascadeData]);

  const fetchData =
    async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            '/api/cascade',
            {
              cache: 'no-store',
            },
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

  /*
   * Replay clock.
   */
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timerId =
      window.setInterval(() => {
        setCurrentTime(
          (previous) => {
            const next =
              previous +
              0.1 * speed;

            if (
              next >=
              replayDuration
            ) {
              setIsPlaying(false);
              return replayDuration;
            }

            return next;
          },
        );
      }, 100);

    return () => {
      window.clearInterval(
        timerId,
      );
    };
  }, [
    isPlaying,
    speed,
    replayDuration,
  ]);

  /*
   * Build event stream visible at the current replay point.
   */
  const processedData =
    useMemo<ProcessedCascadeData | null>(
      () => {
        if (!cascadeData) {
          return null;
        }

        const {
          startMs,
          endMs,
        } = getEventBounds(
          cascadeData.events,
        );

        const replayMs =
          Math.min(
            endMs,
            startMs +
              currentTime * 1000,
          );

        const rangeMinutes =
          TIME_RANGE_MINUTES[
            timeRange
          ];

        const rangeCutoffMs =
          endMs -
          rangeMinutes *
            60 *
            1000;

        let events =
          cascadeData.events.filter(
            (event) => {
              const timestamp =
                new Date(
                  event.timestamp,
                ).getTime();

              return (
                timestamp >=
                rangeCutoffMs
              );
            },
          );

        events =
          events.filter(
            (event) => {
              const timestamp =
                new Date(
                  event.timestamp,
                ).getTime();

              return (
                timestamp <=
                replayMs
              );
            },
          );

        const influenceEligibleIds =
          new Set(
            cascadeData.nodes
              .filter(
                (node) =>
                  node.influence_score >=
                  minInfluence,
              )
              .map(
                (node) =>
                  node.id,
              ),
          );

        const activeActorIds =
          new Set(
            events.map(
              (event) =>
                event.actor_id,
            ),
          );

        const visibleNodeIds =
          new Set(
            cascadeData.nodes
              .filter(
                (node) =>
                  influenceEligibleIds.has(
                    node.id,
                  ) &&
                  activeActorIds.has(
                    node.id,
                  ),
              )
              .map(
                (node) =>
                  node.id,
              ),
          );

        events =
          events.filter(
            (event) =>
              visibleNodeIds.has(
                event.actor_id,
              ),
          );

        const visibleNodes =
          cascadeData.nodes.filter(
            (node) =>
              visibleNodeIds.has(
                node.id,
              ),
          );

        const visibleNodeIdSet =
          new Set(
            visibleNodes.map(
              (node) =>
                node.id,
            ),
          );

        const visibleInfluencers =
          cascadeData.influencers.filter(
            (node) =>
              visibleNodeIdSet.has(
                node.id,
              ),
          );

        return {
          ...cascadeData,
          nodes: visibleNodes,
          influencers:
            visibleInfluencers,
          events,
          visibleEvents:
            events,
        };
      },
      [
        cascadeData,
        timeRange,
        minInfluence,
        currentTime,
      ],
    );

  /*
   * Metrics use the same replay cutoff.
   */
  const visibleMetrics =
    useMemo(() => {
      if (!cascadeData) {
        return [];
      }

      const {
        startMs,
        endMs,
      } = getEventBounds(
        cascadeData.events,
      );

      const replayMs =
        Math.min(
          endMs,
          startMs +
            currentTime * 1000,
        );

      const rangeMinutes =
        TIME_RANGE_MINUTES[
          timeRange
        ];

      const rangeCutoffMs =
        endMs -
        rangeMinutes *
          60 *
          1000;

      return cascadeData.metrics.filter(
        (metric) => {
          const timestamp =
            new Date(
              metric.timestamp,
            ).getTime();

          return (
            timestamp >=
              rangeCutoffMs &&
            timestamp <=
              replayMs
          );
        },
      );
    }, [
      cascadeData,
      currentTime,
      timeRange,
    ]);

  /*
   * Keep shader visible in all UI states.
   */
  const background =
    <ShaderBackground />;

  if (loading) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 text-gray-100">
        {background}

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/65 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-300/20 border-t-blue-400" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Real Rails Intelligence Library
            </p>

            <p className="mt-3 text-lg font-semibold text-white">
              Loading cascade scenario
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Preparing the event stream,
              network topology, and replay
              timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 p-6 text-gray-100">
        {background}

        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-red-400/15 bg-zinc-950/75 p-7 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                !
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
                  Cascade Explorer
                </p>

                <h2 className="text-xl font-bold text-white">
                  Cascade Load Failure
                </h2>
              </div>
            </div>

            <p className="mb-5 text-sm leading-6 text-zinc-400">
              {error}
            </p>

            <button
              onClick={() =>
                void fetchData()
              }
              className="rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    !cascadeData ||
    !processedData
  ) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 text-gray-100">
        {background}

        <div className="relative z-10 flex min-h-screen items-center justify-center text-zinc-400">
          No cascade scenario available.
        </div>
      </div>
    );
  }

  const activeEventCount =
    processedData.events.length;

  const activeRepostCount =
    processedData.events.filter(
      (event) =>
        event.action ===
        'repost',
    ).length;

  const replayPercent =
    replayDuration > 0
      ? Math.min(
          100,
          Math.round(
            (currentTime /
              replayDuration) *
              100,
          ),
        )
      : 0;

  const peakVelocity =
    Number.isFinite(
      cascadeData.peak_velocity,
    )
      ? cascadeData.peak_velocity
      : 0;

  const top3ReachShare =
    Number.isFinite(
      cascadeData.top3_reach_share,
    )
      ? cascadeData.top3_reach_share
      : 0;

  const controlScore =
    Number.isFinite(
      cascadeData.control_score,
    )
      ? cascadeData.control_score
      : 0;

  const chartData = {
    ...processedData,
    metrics: visibleMetrics,
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-transparent px-4 py-6 text-gray-100 transition-colors duration-300 md:px-6">
      {background}

      {/* =======================================================
          PAGE CONTENT
      ======================================================= */}

      <div className="relative z-10">
        {/* =====================================================
            HERO
        ===================================================== */}

        <header className="relative mb-7 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/45 px-6 py-7 shadow-2xl backdrop-blur-md md:px-8 md:py-8">
          <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
                  Real Rails Intelligence Library
                </span>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Distribution &amp; Demand
                </span>

                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                  Synthetic Cascade
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl md:text-5xl">
                Social Virality
                <span className="block bg-gradient-to-r from-blue-300 via-purple-300 to-pink-200 bg-clip-text text-transparent">
                  Cascade Explorer
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
                Trace how a message moves through
                a social network — from seed to
                amplifier to downstream reach —
                and see where distribution power
                concentrates over time.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Event-driven propagation
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Synthetic social graph
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Replayable cascade
                </span>
              </div>

              <div className="mt-4 inline-flex items-center rounded-lg border border-white/5 bg-black/20 px-3 py-1.5 font-mono text-[11px] text-zinc-500">
                scenario://
                {cascadeData.scenario_id}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
              <div className="text-right text-xs text-zinc-500">
                <div className="font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Cascade State
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span>Replay-ready</span>
                </div>
              </div>

              <button
                onClick={() =>
                  void fetchData()
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-white/10"
              >
                Refresh Scenario
              </button>
            </div>
          </div>
        </header>

        {/* =====================================================
            METRICS
        ===================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Active Nodes
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {processedData.nodes.length}
            </div>

            <div className="mt-1 text-xs text-zinc-600">
              of {cascadeData.nodes.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Propagation Events
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {activeEventCount}
            </div>

            <div className="mt-1 text-xs text-zinc-600">
              {activeRepostCount} reposts
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Peak Velocity
            </div>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-black text-white">
                {peakVelocity.toFixed(0)}
              </span>

              <span className="mb-1 text-xs text-blue-300">
                reposts/min
              </span>
            </div>

            <div className="mt-1 text-xs text-zinc-600">
              highest propagation rate
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Replay
            </div>

            <div className="mt-2 text-3xl font-black text-blue-300">
              {replayPercent}%
            </div>

            <div className="mt-1 text-xs text-zinc-600">
              {currentTime.toFixed(1)}
              s /{' '}
              {replayDuration.toFixed(1)}
              s
            </div>
          </div>
        </div>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <main className="grid gap-6 lg:grid-cols-3">
          {/* ===================================================
              LEFT COLUMN
          =================================================== */}

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/62 p-4 shadow-2xl backdrop-blur-md md:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.8)]" />
                    Cascade Spread Topology
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Event-derived propagation paths
                    across the synthetic social graph.
                  </p>
                </div>

                <div className="hidden rounded-lg border border-white/5 bg-black/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:block">
                  Live topology
                </div>
              </div>

              <CascadeGraph
                data={processedData}
                showLabels={showLabels}
                nodeSizeScaling={
                  nodeSize
                }
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/62 p-4 shadow-2xl backdrop-blur-md md:p-6">
                <div className="mb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.7)]" />
                    Spread &amp; Exposure Timeline
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    How exposure accumulates through
                    the replay window.
                  </p>
                </div>

                <SpreadTimeline
                  data={chartData}
                  currentTime={
                    currentTime
                  }
                  duration={
                    replayDuration
                  }
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/62 p-4 shadow-2xl backdrop-blur-md md:p-6">
                <div className="mb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.7)]" />
                    Propagation Decay
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    How quickly the network loses
                    propagation momentum.
                  </p>
                </div>

                <DecayCurves
                  data={chartData}
                  currentTime={
                    currentTime
                  }
                  duration={
                    replayDuration
                  }
                />
              </div>
            </div>
          </div>

          {/* ===================================================
              RIGHT COLUMN
          =================================================== */}

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
              <ReplayControls
                isPlaying={
                  isPlaying
                }
                setIsPlaying={
                  setIsPlaying
                }
                currentTime={
                  currentTime
                }
                setCurrentTime={
                  setCurrentTime
                }
                speed={speed}
                setSpeed={
                  setSpeed
                }
                duration={
                  replayDuration
                }
                data={
                  processedData
                }
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
              <Filters
                timeRange={
                  timeRange
                }
                setTimeRange={
                  setTimeRange
                }
                minInfluence={
                  minInfluence
                }
                setMinInfluence={
                  setMinInfluence
                }
                showLabels={
                  showLabels
                }
                setShowLabels={
                  setShowLabels
                }
                nodeSize={nodeSize}
                setNodeSize={
                  setNodeSize
                }
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
              <InfluencerNodes
                data={
                  processedData
                }
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
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
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
              <WhyMattersPanel
                data={
                  cascadeData
                }
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/68 p-5 shadow-2xl backdrop-blur-md">
              <DownloadSampleData
                data={
                  cascadeData
                }
                onRegenerate={
                  fetchData
                }
              />
            </div>
          </div>
        </main>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-zinc-600">
          <p>
            Social Virality Cascade
            Explorer — Real Rails
            Intelligence Library.
            Synthetic social propagation
            with derived cascade analytics.
          </p>
        </footer>
      </div>
    </div>
  );
}