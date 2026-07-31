'use client';

import type { CascadeData } from '@/types/cascade';

interface ReplayControlsProps {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentTime: number;
  setCurrentTime: (
    value: number | ((previous: number) => number),
  ) => void;
  speed: number;
  setSpeed: (value: number) => void;
  duration: number;
  data: CascadeData;
}

const safeNumber = (
  value: unknown,
  fallback = 0,
) =>
  typeof value === 'number' &&
  Number.isFinite(value)
    ? value
    : fallback;

export default function ReplayControls({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  speed,
  setSpeed,
  duration,
  data,
}: ReplayControlsProps) {
  const safeCurrentTime = safeNumber(
    currentTime,
    0,
  );

  const safeDuration = Math.max(
    1,
    safeNumber(duration, 1),
  );

  const safeSpeed = Math.max(
    0.1,
    safeNumber(speed, 1),
  );

  const progressPercent =
    Math.min(
      100,
      Math.max(
        0,
        (safeCurrentTime /
          safeDuration) *
          100,
      ),
    );

  const handlePlayPause = () => {
    if (
      !isPlaying &&
      safeCurrentTime >= safeDuration
    ) {
      setCurrentTime(0);
    }

    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSliderChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number(
      event.target.value,
    );

    if (Number.isFinite(value)) {
      setCurrentTime(
        Math.max(
          0,
          Math.min(
            value,
            safeDuration,
          ),
        ),
      );
    }
  };

  const handleSpeedChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = Number(
      event.target.value,
    );

    if (Number.isFinite(value)) {
      setSpeed(value);
    }
  };

  const handleExportPng = () => {
    const canvas =
      document.querySelector(
        'canvas[data-cascade-graph="true"]',
      ) as HTMLCanvasElement | null;

    if (!canvas) {
      console.error(
        'Cascade graph canvas not found.',
      );
      return;
    }

    const dataUrl =
      canvas.toDataURL('image/png');

    const link =
      document.createElement('a');

    link.href = dataUrl;
    link.download =
      `cascade-${data.scenario_id}-snapshot.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSvg = () => {
    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1200"
  height="700"
  viewBox="0 0 1200 700"
>
  <rect width="1200" height="700" fill="#09090b"/>

  <text
    x="40"
    y="50"
    fill="#f4f4f5"
    font-family="Arial, sans-serif"
    font-size="24"
    font-weight="700"
  >
    Social Virality Cascade Explorer
  </text>

  <text
    x="40"
    y="80"
    fill="#71717a"
    font-family="Arial, sans-serif"
    font-size="13"
  >
    ${data.scenario_id}
  </text>

  <text
    x="40"
    y="125"
    fill="#a1a1aa"
    font-family="Arial, sans-serif"
    font-size="14"
  >
    Replay: ${Math.round(progressPercent)}%
  </text>

  <text
    x="40"
    y="150"
    fill="#a1a1aa"
    font-family="Arial, sans-serif"
    font-size="14"
  >
    Events: ${data.events.length}
  </text>
</svg>
`;

    const blob = new Blob(
      [svg],
      {
        type: 'image/svg+xml;charset=utf-8',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      `cascade-${data.scenario_id}-snapshot.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-100">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Replay Mode
        </h3>

        <div className="flex gap-3">
          <button
            onClick={handlePlayPause}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isPlaying
              ? 'Pause'
              : 'Play'}
          </button>

          <button
            onClick={handleReset}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Replay Speed
          </span>

          <select
            value={safeSpeed}
            onChange={
              handleSpeedChange
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-gray-100"
          >
            <option value={0.5}>
              0.5x
            </option>
            <option value={1}>
              1.0x
            </option>
            <option value={2}>
              2.0x
            </option>
            <option value={5}>
              5.0x
            </option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-14 text-xs font-mono text-gray-500">
            {Math.round(safeCurrentTime)}s
          </span>

          <input
            type="range"
            min={0}
            max={safeDuration}
            step={0.1}
            value={Math.min(
              safeCurrentTime,
              safeDuration,
            )}
            onChange={
              handleSliderChange
            }
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-blue-500"
          />

          <span className="w-14 text-right text-xs font-mono text-gray-500">
            {Math.round(safeDuration)}s
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Snapshot Export
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportSvg}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            SVG Graph
          </button>

          <button
            onClick={handleExportPng}
            className="flex-1 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600"
          >
            PNG Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}