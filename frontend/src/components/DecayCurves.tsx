'use client';

import { useMemo } from "react";
import type { CascadeData } from "@/types/cascade";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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

export default function DecayCurves({
  data,
  currentTime,
  duration,
}: DecayCurvesProps) {
  const {
    chartData,
    activeTimestamp,
    halfPeak,
  } = useMemo(() => {
    const sorted = [...data.metrics]
      .map((metric) => ({
        timestamp: new Date(
          metric.timestamp,
        ).getTime(),
        velocity: metric.velocity,
        reposts: metric.reposts,
        activeSpreaders:
          metric.active_spreaders,
      }))
      .sort(
        (a, b) =>
          a.timestamp - b.timestamp,
      );

    if (sorted.length === 0) {
      return {
        chartData: [] as ChartPoint[],
        activeTimestamp: 0,
        halfPeak: 0,
      };
    }

    const first =
      sorted[0].timestamp;

    const last =
      sorted[sorted.length - 1]
        .timestamp;

    const replayRatio =
      duration > 0
        ? Math.max(
            0,
            Math.min(
              1,
              currentTime / duration,
            ),
          )
        : 0;

    const activeTs =
      first +
      replayRatio *
        (last - first);

    const peak = Math.max(
      ...sorted.map(
        (point) => point.velocity,
      ),
    );

    return {
      chartData: sorted,
      activeTimestamp: activeTs,
      halfPeak: peak / 2,
    };
  }, [
    data.metrics,
    currentTime,
    duration,
  ]);

  const formatTick = (
    value: number,
  ) => {
    const date = new Date(value);

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

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
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-xl">
        <p className="font-semibold">
          {new Date(
            point.timestamp,
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>

        <div className="mt-2 space-y-1 text-gray-300">
          <p>
            Propagation velocity:{" "}
            <span className="font-mono font-bold text-red-400">
              {point.velocity.toFixed(1)}
            </span>{" "}
            reposts/min
          </p>

          <p>
            Reposts:{" "}
            <span className="font-mono font-bold text-gray-100">
              {point.reposts}
            </span>
          </p>

          <p>
            Active spreaders:{" "}
            <span className="font-mono font-bold text-gray-100">
              {point.activeSpreaders}
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">
        No propagation metrics available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-zinc-950 p-2">
          <div className="text-gray-500">
            Peak
          </div>
          <div className="font-mono font-semibold text-red-400">
            {data.peak_velocity.toFixed(
              0,
            )}
            /min
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950 p-2">
          <div className="text-gray-500">
            Half-life
          </div>
          <div className="font-mono font-semibold text-gray-100">
            {data.half_life_minutes.toFixed(
              1,
            )}
            m
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950 p-2">
          <div className="text-gray-500">
            Mode
          </div>
          <div className="font-semibold text-gray-100">
            Event-derived
          </div>
        </div>
      </div>

      <div className="h-[195px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="cascadeVelocityDecay"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#ef4444"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="#ef4444"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.2}
            />

            <XAxis
              dataKey="timestamp"
              type="number"
              domain={[
                "dataMin",
                "dataMax",
              ]}
              tickFormatter={
                formatTick
              }
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              dy={8}
            />

            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              dx={-8}
              allowDecimals={false}
            />

            <Tooltip
              content={
                <CustomTooltip />
              }
            />

            {halfPeak > 0 && (
              <ReferenceLine
                y={halfPeak}
                stroke="#71717a"
                strokeDasharray="4 4"
                label={{
                  value: "50% PEAK",
                  fill: "#a1a1aa",
                  fontSize: 8,
                  position: "insideTopLeft",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="velocity"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cascadeVelocityDecay)"
            />

            {currentTime > 0 && (
              <ReferenceLine
                x={activeTimestamp}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: "REPLAY",
                  fill: "#f59e0b",
                  fontSize: 8,
                  position: "top",
                  fontWeight: "bold",
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-[11px] leading-4 text-gray-600">
        Decay is derived from observed synthetic
        repost velocity, not from a predefined
        exponential curve.
      </p>
    </div>
  );
}