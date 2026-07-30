import { useMemo } from 'react';
import { CascadeData } from '@/types/cascade';
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

export default function DecayCurves({ data, currentTime, duration }: DecayCurvesProps) {
  // Process chart data
  const { chartData, activeTimestamp } = useMemo(() => {
    if (!data.decay_curve || data.decay_curve.length === 0) {
      return { chartData: [], activeTimestamp: 0 };
    }

    const sorted = data.decay_curve
      .map((d) => ({
        ...d,
        timestamp: new Date(d.time).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sorted.length === 0) {
      return { chartData: [], activeTimestamp: 0 };
    }

    const tMin = sorted[0].timestamp;
    const tMax = sorted[sorted.length - 1].timestamp;
    const activeTs = tMin + (currentTime / duration) * (tMax - tMin);

    return { chartData: sorted, activeTimestamp: activeTs };
  }, [data.decay_curve, currentTime, duration]);

  const formatTick = (tickVal: number) => {
    try {
      return new Date(tickVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-md text-xs text-white font-sans">
          <p className="font-semibold">{new Date(dataPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-red-400 mt-1">
            Virality: <span className="font-bold font-mono">{dataPoint.value.toFixed(1)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
        No decay stats.
      </div>
    );
  }

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDecay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTick}
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDecay)"
          />
          {currentTime > 0 && (
            <ReferenceLine
              x={activeTimestamp}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: 'REPLAY',
                fill: '#f59e0b',
                fontSize: 8,
                position: 'top',
                fontWeight: 'bold',
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}