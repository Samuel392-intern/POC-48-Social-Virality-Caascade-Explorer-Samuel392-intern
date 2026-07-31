'use client';

import type { CascadeData } from '@/types/cascade';

interface ReplayControlsProps {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;

  currentTime: number;
  setCurrentTime: (
    value:
      | number
      | ((previous: number) => number),
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

function formatSeconds(
  value: number,
): string {
  return `${value.toFixed(1)}s`;
}

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

  const replayState =
    isPlaying
      ? 'RUNNING'
      : safeCurrentTime >=
          safeDuration
        ? 'COMPLETE'
        : 'PAUSED';

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
  <rect
    width="1200"
    height="700"
    fill="#030712"
  />

  <rect
    x="32"
    y="32"
    width="1136"
    height="636"
    fill="#0B1117"
    stroke="#1F2937"
  />

  <text
    x="56"
    y="72"
    fill="#38BDF8"
    font-family="Arial, sans-serif"
    font-size="10"
    font-weight="700"
    letter-spacing="2"
  >
    REAL RAILS INTELLIGENCE LIBRARY
  </text>

  <text
    x="56"
    y="112"
    fill="#E5E7EB"
    font-family="Arial, sans-serif"
    font-size="26"
    font-weight="700"
  >
    SOCIAL VIRALITY CASCADE EXPLORER
  </text>

  <text
    x="56"
    y="140"
    fill="#64748B"
    font-family="monospace"
    font-size="12"
  >
    DISTRIBUTION &amp; DEMAND
  </text>

  <line
    x1="56"
    y1="166"
    x2="1144"
    y2="166"
    stroke="#1F2937"
  />

  <text
    x="56"
    y="205"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    SCENARIO
  </text>

  <text
    x="56"
    y="228"
    fill="#E5E7EB"
    font-family="monospace"
    font-size="13"
  >
    ${data.scenario_id}
  </text>

  <text
    x="56"
    y="272"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    REPLAY POSITION
  </text>

  <text
    x="56"
    y="298"
    fill="#38BDF8"
    font-family="monospace"
    font-size="24"
    font-weight="700"
  >
    ${Math.round(progressPercent)}%
  </text>

  <text
    x="56"
    y="325"
    fill="#94A3B8"
    font-family="monospace"
    font-size="12"
  >
    ${formatSeconds(
      safeCurrentTime,
    )} / ${formatSeconds(
      safeDuration,
    )}
  </text>

  <text
    x="400"
    y="205"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    EVENT COUNT
  </text>

  <text
    x="400"
    y="228"
    fill="#E5E7EB"
    font-family="monospace"
    font-size="22"
    font-weight="700"
  >
    ${data.events.length}
  </text>

  <text
    x="400"
    y="272"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    REPLAY SPEED
  </text>

  <text
    x="400"
    y="298"
    fill="#818CF8"
    font-family="monospace"
    font-size="22"
    font-weight="700"
  >
    ${safeSpeed.toFixed(1)}x
  </text>

  <text
    x="400"
    y="342"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    STATE
  </text>

  <text
    x="400"
    y="365"
    fill="#E5E7EB"
    font-family="monospace"
    font-size="14"
    font-weight="700"
  >
    ${replayState}
  </text>

  <line
    x1="56"
    y1="410"
    x2="1144"
    y2="410"
    stroke="#1F2937"
  />

  <text
    x="56"
    y="448"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    GENERATED SNAPSHOT
  </text>

  <text
    x="56"
    y="480"
    fill="#94A3B8"
    font-family="Arial, sans-serif"
    font-size="13"
  >
    Replay state captured from the event-driven
  </text>

  <text
    x="56"
    y="502"
    fill="#94A3B8"
    font-family="Arial, sans-serif"
    font-size="13"
  >
    synthetic distribution cascade.
  </text>

  <text
    x="56"
    y="580"
    fill="#64748B"
    font-family="monospace"
    font-size="10"
  >
    SOURCE
  </text>

  <text
    x="56"
    y="602"
    fill="#E5E7EB"
    font-family="monospace"
    font-size="12"
  >
    SYNTHETIC / DERIVED ANALYTICS
  </text>
</svg>
`;

    const blob = new Blob(
      [svg],
      {
        type:
          'image/svg+xml;charset=utf-8',
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPlaying
                  ? 'bg-rails-cyan shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                  : 'bg-rails-textMuted'
              }`}
            />

            <h3 className="text-sm font-semibold text-white">
              Replay / Event Stream
            </h3>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
            {replayState}
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Replay the causal event stream to inspect how
          distribution structure changes over time.
        </p>
      </div>

      {/* Play / reset controls */}
      <div className="border-t border-rails-border pt-4">
        <div className="flex gap-2">
          <button
            onClick={handlePlayPause}
            className={`flex-1 border px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              isPlaying
                ? 'border-rails-indigo bg-rails-indigo/10 text-rails-indigo hover:bg-rails-indigo/20'
                : 'border-rails-cyan bg-rails-cyan text-slate-950 hover:bg-sky-300'
            }`}
          >
            {isPlaying
              ? 'Pause Stream'
              : safeCurrentTime >=
                  safeDuration
                ? 'Replay Stream'
                : 'Play Stream'}
          </button>

          <button
            onClick={handleReset}
            className="border border-rails-border bg-rails-surfaceRaised px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted transition-colors hover:border-rails-cyan/40 hover:text-rails-cyan"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Replay progress */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Replay Position
            </div>

            <div className="mt-1 text-xl font-semibold text-white">
              {Math.round(
                progressPercent,
              )}
              <span className="ml-0.5 text-sm text-rails-textMuted">
                %
              </span>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-rails-textMuted">
            {formatSeconds(
              safeCurrentTime,
            )}
            {' / '}
            {formatSeconds(
              safeDuration,
            )}
          </div>
        </div>

        <div className="mb-2 h-1 bg-rails-border">
          <div
            className="h-full bg-rails-cyan shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-[width] duration-100"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        <input
          aria-label="Replay position"
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
          className="rails-slider h-1.5 w-full cursor-pointer appearance-none rounded-none bg-rails-border accent-rails-cyan"
        />

        <div className="mt-1 flex justify-between font-mono text-[9px] text-rails-textMuted">
          <span>START</span>
          <span>EVENT STREAM</span>
          <span>END</span>
        </div>
      </div>

      {/* Speed */}
      <div className="border-t border-rails-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Replay Speed
            </div>

            <p className="mt-1 text-[10px] text-rails-textMuted">
              Controls how quickly the event stream is
              traversed.
            </p>
          </div>

          <select
            aria-label="Replay speed"
            value={safeSpeed}
            onChange={
              handleSpeedChange
            }
            className="border border-rails-border bg-rails-surfaceRaised px-3 py-2 font-mono text-[10px] font-semibold text-white outline-none transition-colors hover:border-rails-cyan/40 focus:border-rails-cyan"
          >
            <option value={0.5}>
              0.5x / SLOW
            </option>

            <option value={1}>
              1.0x / NORMAL
            </option>

            <option value={2}>
              2.0x / FAST
            </option>

            <option value={5}>
              5.0x / HYPER
            </option>
          </select>
        </div>
      </div>

      {/* Event state */}
      <div className="grid grid-cols-2 gap-2 border-t border-rails-border pt-4">
        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
            Events
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {data.events.length}
          </div>
        </div>

        <div className="border border-rails-border bg-slate-950/30 p-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
            Nodes
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {data.nodes.length}
          </div>
        </div>
      </div>

      {/* Snapshot export */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-3">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
            Snapshot Export
          </div>

          <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
            Export the current replay state for analysis
            or sharing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={
              handleExportSvg
            }
            className="border border-rails-indigo/50 bg-rails-indigo/5 px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-rails-indigo transition-colors hover:border-rails-indigo hover:bg-rails-indigo/10"
          >
            SVG Graph
          </button>

          <button
            onClick={
              handleExportPng
            }
            className="border border-rails-border bg-rails-surfaceRaised px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-rails-textMuted transition-colors hover:border-rails-cyan/50 hover:text-rails-cyan"
          >
            PNG Snapshot
          </button>
        </div>
      </div>

      {/* Provenance */}
      <div className="border border-rails-border bg-slate-950/30 p-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
          Replay Provenance
        </div>

        <div className="mt-2 space-y-1 font-mono text-[9px] text-rails-textMuted">
          <div className="flex justify-between gap-3">
            <span>SCENARIO</span>
            <span className="truncate text-rails-text">
              {data.scenario_id}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span>SOURCE</span>
            <span className="text-rails-cyan">
              SYNTHETIC
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span>METRICS</span>
            <span className="text-rails-indigo">
              DERIVED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}