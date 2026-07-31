'use client';

import { useMemo } from "react";
import type { CascadeData } from "@/types/cascade";
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
} from "recharts";

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
        timestamp: new Date(
          metric.timestamp,
        ).getTime(),
        views: metric.views,
        reposts: metric.reposts,
        velocity: metric.velocity,
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

    return {
      chartData: sorted,
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

  const formatTick = (
    value: number,
  ) =>
    new Date(value).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );

  const formatCompact = (
    value: number,
  ) => {
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
            Cumulative views:{" "}
            <span className="font-mono font-bold text-emerald-400">
              {point.views.toLocaleString()}
            </span>
          </p>

          <p>
            Reposts:{" "}
            <span className="font-mono font-bold text-blue-400">
              {point.reposts}
            </span>
          </p>

          <p>
            Velocity:{" "}
            <span className="font-mono font-bold text-purple-400">
              {point.velocity.toFixed(
                1,
              )}/min
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
        No spread metrics available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-zinc-950 p-2">
          <div className="text-gray-500">
            Current views
          </div>
          <div className="font-mono font-semibold text-emerald-400">
            {formatCompact(
              chartData[
                chartData.length - 1
              ].views,
            )}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950 p-2">
          <div className="text-gray-500">
            Current reposts
          </div>
          <div className="font-mono font-semibold text-blue-400">
            {chartData[
              chartData.length - 1
            ].reposts}
          </div>
        </div>
      </div>

      <div className="h-[195px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
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
              yAxisId="views"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              dx={-8}
              tickFormatter={
                formatCompact
              }
            />

            <YAxis
              yAxisId="reposts"
              orientation="right"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              tickFormatter={
                formatCompact
              }
            />

            <Tooltip
              content={
                <CustomTooltip />
              }
            />

            <Legend
              wrapperStyle={{
                fontSize: 10,
              }}
            />

            <Line
              yAxisId="views"
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />

            <Line
              yAxisId="reposts"
              type="monotone"
              dataKey="reposts"
              name="Reposts / interval"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}