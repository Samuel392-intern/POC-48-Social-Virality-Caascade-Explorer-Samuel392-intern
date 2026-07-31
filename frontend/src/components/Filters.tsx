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
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-100">
          <svg
            className="h-4 w-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>

          Dashboard Filters
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Time Horizon
            </label>

            <select
              value={timeRange}
              onChange={(event) =>
                setTimeRange(
                  event.target.value as
                    | '5m'
                    | '15m'
                    | '30m'
                    | '1h',
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
              <span>
                Min Influence Score
              </span>

              <span className="font-mono text-blue-400">
                {minInfluence.toFixed(0)}
              </span>
            </label>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minInfluence}
              onChange={(event) =>
                setMinInfluence(
                  Number(event.target.value),
                )
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
              <span>
                Node Size Scaling
              </span>

              <span className="font-mono text-blue-400">
                {nodeSize}%
              </span>
            </label>

            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={nodeSize}
              onChange={(event) =>
                setNodeSize(
                  Number(event.target.value),
                )
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-blue-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(event) =>
                setShowLabels(
                  event.target.checked,
                )
              }
              className="h-4 w-4 cursor-pointer accent-blue-500"
            />

            Render node labels
          </label>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setTimeRange('1h');
              setMinInfluence(0);
              setShowLabels(true);
              setNodeSize(50);
            }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-zinc-800"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}