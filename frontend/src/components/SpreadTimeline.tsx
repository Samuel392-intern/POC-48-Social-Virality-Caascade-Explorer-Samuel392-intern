'use client';

import { useMemo } from 'react';
import type { CascadeData } from '@/types/cascade';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

interface SpreadTimelineProps {
  data: CascadeData;
  currentTime: number;
  duration: number;
}

interface ChartPoint {
  timestamp: number;
  views: number;
  reposts: number;
  velocity: number;
  activeSpreaders: number;
}

function formatCompact(
  value: number,
): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(
      value / 1_000
    ).toFixed(1)}K`;
  }

  return String(
    Math.round(value),
  );
}

function getSpreadInterpretation(
  point: ChartPoint,
): string {
  if (
    point.velocity >= 5 &&
    point.activeSpreaders >= 3
  ) {
    return 'ACTIVE AMPLIFICATION';
  }

  if (
    point.velocity > 0 &&
    point.activeSpreaders > 0
  ) {
    return 'PROPAGATION UNDERWAY';
  }

  return 'LOW CURRENT MOMENTUM';
}

export default function SpreadTimeline({
  data,
  currentTime,
  duration,
}: SpreadTimelineProps) {
  const {
    chartData,
    activeTimestamp,
  } = useMemo(() => {
    const sorted = [...data.metrics]
      .map((metric) => ({
        timestamp:
          new Date(
            metric.timestamp,
          ).getTime(),

        views: metric.views,

        reposts:
          metric.reposts,

        velocity:
          metric.velocity,

        activeSpreaders:
          metric.active_spreaders,
      }))
      .sort(
        (a, b) =>
          a.timestamp -
          b.timestamp,
      );

    if (sorted.length === 0) {
      return {
        chartData:
          [] as ChartPoint[],

        activeTimestamp: 0,
      };
    }

    const first =
      sorted[0].timestamp;

    const last =
      sorted[
        sorted.length - 1
      ].timestamp;

    const replayRatio =
      duration > 0
        ? Math.max(
            0,
            Math.min(
              1,
              currentTime /
                duration,
            ),
          )
        : 0;

    return {
      chartData:
        sorted,

      activeTimestamp:
        first +
        replayRatio *
          (last - first),
    };
  }, [
    data.metrics,
    currentTime,
    duration,
  ]);

  const latest =
    chartData[
      chartData.length - 1
    ];

  const formatTick = (
    value: number,
  ) =>
    new Date(
      value,
    ).toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;

    payload?: Array<{
      payload: ChartPoint;
    }>;
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    const point =
      payload[0].payload;

    return (
      <div className="min-w-[220px] border border-rails-border bg-rails-surface/95 p-3 text-white shadow-2xl backdrop-blur-sm">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Distribution Signal
        </div>

        <p className="mt-1 text-xs font-semibold text-white">
          {new Date(
            point.timestamp,
          ).toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute:
                '2-digit',
              second:
                '2-digit',
            },
          )}
        </p>

        <div className="mt-3 space-y-2 border-t border-rails-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-rails-textMuted">
              Cumulative views
            </span>

            <span className="font-mono text-xs font-semibold text-rails-cyan">
              {point.views.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-rails-textMuted">
              Reposts
            </span>

            <span className="font-mono text-xs font-semibold text-rails-indigo">
              {point.reposts}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-rails-textMuted">
              Velocity
            </span>

            <span className="font-mono text-xs font-semibold text-white">
              {point.velocity.toFixed(
                1,
              )}
              /min
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-rails-textMuted">
              Active spreaders
            </span>

            <span className="font-mono text-xs font-semibold text-white">
              {
                point.activeSpreaders
              }
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-rails-border pt-2">
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-rails-cyan">
            {getSpreadInterpretation(
              point,
            )}
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-rails-border bg-slate-950/20 text-xs text-rails-textMuted">
        No spread metrics available for the current
        scenario.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Signal summary */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
            Current Exposure
          </div>

          <div className="mt-1 text-xl font-semibold text-rails-cyan">
            {formatCompact(
              latest.views,
            )}
          </div>

          <div className="mt-0.5 text-[10px] text-rails-textMuted">
            cumulative synthetic views
          </div>
        </div>

        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
            Current Reposts
          </div>

          <div className="mt-1 text-xl font-semibold text-rails-indigo">
            {latest.reposts}
          </div>

          <div className="mt-0.5 text-[10px] text-rails-textMuted">
            reposts in interval
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[195px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 8,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1F2937"
              opacity={0.7}
            />

            <XAxis
              dataKey="timestamp"
              type="number"
              domain={[
                'dataMin',
                'dataMax',
              ]}
              tickFormatter={
                formatTick
              }
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={{
                stroke:
                  '#1F2937',
              }}
              dy={8}
            />

            <YAxis
              yAxisId="views"
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dx={-8}
              tickFormatter={
                formatCompact
              }
            />

            <YAxis
              yAxisId="reposts"
              orientation="right"
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={
                formatCompact
              }
            />

            <Tooltip
              content={
                <CustomTooltip />
              }
              cursor={{
                stroke:
                  '#38BDF8',
                strokeOpacity:
                  0.18,
              }}
            />

            <Legend
              wrapperStyle={{
                fontSize: 9,
                color: '#94A3B8',
                paddingTop:
                  8,
              }}
              iconSize={7}
            />

            <Line
              yAxisId="views"
              type="monotone"
              dataKey="views"
              name="Exposure"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#38BDF8',
                stroke:
                  '#030712',
                strokeWidth: 2,
              }}
            />

            <Line
              yAxisId="reposts"
              type="monotone"
              dataKey="reposts"
              name="Reposts / interval"
              stroke="#818CF8"
              strokeWidth={2}
              dot={{
                r: 1.5,
                fill: '#818CF8',
                stroke:
                  '#818CF8',
              }}
              activeDot={{
                r: 4,
                fill: '#818CF8',
                stroke:
                  '#030712',
                strokeWidth: 2,
              }}
            />

            {currentTime > 0 && (
              <ReferenceLine
                x={
                  activeTimestamp
                }
                stroke="#38BDF8"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{
                  value:
                    'REPLAY',
                  fill:
                    '#38BDF8',
                  fontSize: 8,
                  position:
                    'top',
                  fontWeight:
                    'bold',
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 border-t border-rails-border pt-2">
        <p className="text-[10px] leading-4 text-rails-textMuted">
          The exposure curve shows cumulative downstream
          attention while the repost signal shows active
          propagation. Divergence between the two helps
          distinguish audience size from active distribution.
        </p>
      </div>
    </div>
  );
}