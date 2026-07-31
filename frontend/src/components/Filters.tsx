'use client';

interface FiltersProps {
  timeRange: string;
  setTimeRange: (
    value: '5m' | '15m' | '30m' | '1h',
  ) => void;

  minInfluence: number;
  setMinInfluence: (
    value: number,
  ) => void;

  showLabels: boolean;
  setShowLabels: (
    value: boolean,
  ) => void;

  nodeSize: number;
  setNodeSize: (
    value: number,
  ) => void;
}

type TimeRange =
  | '5m'
  | '15m'
  | '30m'
  | '1h';

const TIME_RANGE_LABELS: Record<
  TimeRange,
  string
> = {
  '5m': '05 MIN',
  '15m': '15 MIN',
  '30m': '30 MIN',
  '1h': 'FULL SCENARIO',
};

export default function Filters({
  timeRange,
  setTimeRange,
  minInfluence,
  setMinInfluence,
  showLabels,
  setShowLabels,
  nodeSize,
  setNodeSize,
}: FiltersProps) {
  const normalizedTimeRange =
    timeRange as TimeRange;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rails-cyan shadow-[0_0_10px_rgba(56,189,248,0.8)]" />

            <h3 className="text-sm font-semibold text-white">
              Distribution Filters
            </h3>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
            Live
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Adjust the visible cascade window and
          visualization thresholds. Changes are applied
          locally without reloading the scenario.
        </p>
      </div>

      {/* Time horizon */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="cascade-time-range"
            className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted"
          >
            Time Horizon
          </label>

          <span
            title="Controls how far back from the scenario endpoint the dashboard displays."
            className="cursor-help font-mono text-[9px] text-rails-cyan"
          >
            {TIME_RANGE_LABELS[
              normalizedTimeRange
            ]}
          </span>
        </div>

        <select
          id="cascade-time-range"
          value={timeRange}
          onChange={(event) =>
            setTimeRange(
              event.target.value as TimeRange,
            )
          }
          className="w-full appearance-none border border-rails-border bg-rails-surfaceRaised px-3 py-2.5 text-xs font-medium text-white outline-none transition-colors hover:border-rails-cyan/40 focus:border-rails-cyan focus:ring-1 focus:ring-rails-cyan/30"
        >
          <option value="5m">
            Last 5 Minutes
          </option>

          <option value="15m">
            Last 15 Minutes
          </option>

          <option value="30m">
            Last 30 Minutes
          </option>

          <option value="1h">
            Full Scenario
          </option>
        </select>

        <p className="mt-1.5 text-[10px] leading-4 text-rails-textMuted">
          Narrower windows make recent propagation
          behavior easier to isolate.
        </p>
      </div>

      {/* Influence threshold */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Minimum Influence
            </div>

            <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
              Hide nodes below the selected influence
              threshold.
            </p>
          </div>

          <span
            title="Only nodes with an influence score at or above this value remain visible."
            className="shrink-0 cursor-help font-mono text-sm font-semibold text-rails-cyan"
          >
            {minInfluence.toFixed(0)}
          </span>
        </div>

        <input
          aria-label="Minimum influence score"
          type="range"
          min="0"
          max="100"
          step="5"
          value={minInfluence}
          onChange={(event) =>
            setMinInfluence(
              Number(
                event.target.value,
              ),
            )
          }
          className="rails-slider h-1.5 w-full cursor-pointer appearance-none rounded-none bg-rails-border accent-rails-cyan"
        />

        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-rails-textMuted">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Node size */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Node Size Scaling
            </div>

            <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
              Adjust the visual scale of network nodes
              without changing the underlying data.
            </p>
          </div>

          <span
            title="Changes only the visual size of nodes in the topology."
            className="shrink-0 cursor-help font-mono text-sm font-semibold text-rails-indigo"
          >
            {nodeSize}%
          </span>
        </div>

        <input
          aria-label="Node size scaling"
          type="range"
          min="10"
          max="100"
          step="5"
          value={nodeSize}
          onChange={(event) =>
            setNodeSize(
              Number(
                event.target.value,
              ),
            )
          }
          className="rails-slider rails-slider-indigo h-1.5 w-full cursor-pointer appearance-none rounded-none bg-rails-border accent-rails-indigo"
        />

        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-rails-textMuted">
          <span>10%</span>
          <span>55%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Labels */}
      <div className="border-t border-rails-border pt-4">
        <label
          htmlFor="cascade-show-labels"
          className="flex cursor-pointer items-start justify-between gap-4"
        >
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Network Labels
            </div>

            <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
              Render user identifiers directly on the
              topology.
            </p>
          </div>

          <input
            id="cascade-show-labels"
            type="checkbox"
            checked={showLabels}
            onChange={(event) =>
              setShowLabels(
                event.target.checked,
              )
            }
            className="mt-0.5 h-4 w-4 cursor-pointer appearance-none border border-rails-border bg-rails-surfaceRaised checked:border-rails-cyan checked:bg-rails-cyan"
          />
        </label>
      </div>

      {/* Current filter state */}
      <div className="border border-rails-border bg-slate-950/30 p-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Active Filter State
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <div className="text-[9px] text-rails-textMuted">
              Window
            </div>

            <div className="font-mono text-[10px] font-semibold text-white">
              {TIME_RANGE_LABELS[
                normalizedTimeRange
              ]}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-rails-textMuted">
              Influence
            </div>

            <div className="font-mono text-[10px] font-semibold text-rails-cyan">
              ≥ {minInfluence}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-rails-textMuted">
              Node Scale
            </div>

            <div className="font-mono text-[10px] font-semibold text-rails-indigo">
              {nodeSize}%
            </div>
          </div>

          <div>
            <div className="text-[9px] text-rails-textMuted">
              Labels
            </div>

            <div className="font-mono text-[10px] font-semibold text-white">
              {showLabels
                ? 'VISIBLE'
                : 'HIDDEN'}
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end border-t border-rails-border pt-4">
        <button
          onClick={() => {
            setTimeRange('1h');
            setMinInfluence(0);
            setShowLabels(true);
            setNodeSize(50);
          }}
          className="border border-rails-border bg-rails-surfaceRaised px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-rails-textMuted transition-colors hover:border-rails-cyan/50 hover:text-rails-cyan"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}