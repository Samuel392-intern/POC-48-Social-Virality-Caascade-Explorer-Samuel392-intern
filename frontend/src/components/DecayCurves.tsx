'use client';

import { useMemo } from 'react';
import type { CascadeData } from '@/types/cascade';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DecayCurvesProps {
  data: CascadeData;
  currentTime: number;
  duration: number;
}

interface ChartPoint {
  timestamp: number;
  velocity: number;
  reposts: number;
  activeSpreaders: number;
}

function getDecayInterpretation(
  velocity: number,
  peak: number,
): string {
  if (peak <= 0) {
    return 'NO MEASURABLE MOMENTUM';
  }

  const ratio =
    velocity / peak;

  if (ratio >= 0.75) {
    return 'PEAK-ADJACENT MOMENTUM';
  }

  if (ratio >= 0.5) {
    return 'ACTIVE PROPAGATION';
  }

  if (ratio >= 0.25) {
    return 'MOMENTUM DECAYING';
  }

  return 'LOW RESIDUAL MOMENTUM';
}

export default function DecayCurves({
  data,
  currentTime,
  duration,
}: DecayCurvesProps) {
  const {
    chartData,
    activeTimestamp,
    peakVelocity,
    halfPeak,
  } = useMemo(() => {
    const sorted = [...data.metrics]
      .map((metric) => ({
        timestamp:
          new Date(
            metric.timestamp,
          ).getTime(),

        velocity:
          Number.isFinite(
            metric.velocity,
          )
            ? metric.velocity
            : 0,

        reposts:
          Number.isFinite(
            metric.reposts,
          )
            ? metric.reposts
            : 0,

        activeSpreaders:
          Number.isFinite(
            metric.active_spreaders,
          )
            ? metric.active_spreaders
            : 0,
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

        peakVelocity: 0,

        halfPeak: 0,
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

    const activeTs =
      first +
      replayRatio *
        (last - first);

    const peak =
      Math.max(
        ...sorted.map(
          (point) =>
            point.velocity,
        ),
      );

    return {
      chartData:
        sorted,

      activeTimestamp:
        activeTs,

      peakVelocity:
        peak,

      halfPeak:
        peak / 2,
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
          Propagation Decay
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
              Velocity
            </span>

            <span className="font-mono text-xs font-semibold text-rails-cyan">
              {point.velocity.toFixed(
                1,
              )}
              /min
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-rails-textMuted">
              Reposts
            </span>

            <span className="font-mono text-xs font-semibold text-white">
              {point.reposts}
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
            {getDecayInterpretation(
              point.velocity,
              peakVelocity,
            )}
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-rails-border bg-slate-950/20 text-xs text-rails-textMuted">
        No propagation metrics available.
      </div>
    );
  }

  const safePeak =
    Number.isFinite(
      data.peak_velocity,
    )
      ? data.peak_velocity
      : peakVelocity;

  const safeHalfLife =
    Number.isFinite(
      data.half_life_minutes,
    )
      ? data.half_life_minutes
      : 0;

  return (
    <div className="w-full">
      {/* Intelligence summary */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
            Peak
          </div>

          <div className="mt-1 text-lg font-semibold text-rails-cyan">
            {safePeak.toFixed(0)}
          </div>

          <div className="mt-0.5 text-[10px] text-rails-textMuted">
            reposts / min
          </div>
        </div>

        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
            Half-Life
          </div>

          <div className="mt-1 text-lg font-semibold text-rails-indigo">
            {safeHalfLife.toFixed(1)}
          </div>

          <div className="mt-0.5 text-[10px] text-rails-textMuted">
            minutes
          </div>
        </div>

        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
            Method
          </div>

          <div className="mt-1 text-xs font-semibold text-white">
            Event-derived
          </div>

          <div className="mt-0.5 text-[10px] text-rails-textMuted">
            observed velocity
          </div>
        </div>
      </div>

      {/* Current interpretation */}
      {latest && (
        <div className="mb-3 border border-rails-cyan/20 bg-rails-cyan/[0.025] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
              Current Momentum
            </span>

            <span className="font-mono text-[9px] font-semibold text-rails-cyan">
              {getDecayInterpretation(
                latest.velocity,
                peakVelocity,
              )}
            </span>
          </div>
        </div>
      )}

      <div className="h-[195px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 8,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="cascadeVelocityDecayRails"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#38BDF8"
                  stopOpacity={0.28}
                />

                <stop
                  offset="95%"
                  stopColor="#38BDF8"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

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
              stroke="#64748B"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dx={-8}
              allowDecimals={false}
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

            {halfPeak > 0 && (
              <ReferenceLine
                y={halfPeak}
                stroke="#818CF8"
                strokeOpacity={0.7}
                strokeDasharray="4 4"
                label={{
                  value:
                    '50% PEAK',
                  fill:
                    '#818CF8',
                  fontSize: 8,
                  position:
                    'insideTopLeft',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="velocity"
              stroke="#38BDF8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cascadeVelocityDecayRails)"
              activeDot={{
                r: 4,
                fill: '#38BDF8',
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
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 border-t border-rails-border pt-2">
        <p className="text-[10px] leading-4 text-rails-textMuted">
          Decay is derived from observed synthetic repost
          velocity rather than a predefined exponential
          curve. The 50% reference line shows when momentum
          falls below half of the observed peak.
        </p>
      </div>
    </div>
  );
}