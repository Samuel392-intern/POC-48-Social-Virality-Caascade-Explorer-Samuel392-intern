import { useState } from 'react';

interface FiltersProps {
  timeRange: string;
  setTimeRange: (val: string) => void;
  minInfluence: number;
  setMinInfluence: (val: number) => void;
  showLabels: boolean;
  setShowLabels: (val: boolean) => void;
  nodeSize: number;
  setNodeSize: (val: number) => void;
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
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  };

  const handleMinInfluenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInfluence(Number(e.target.value));
  };

  const handleShowLabelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowLabels(e.target.checked);
  };

  const handleNodeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeSize(Number(e.target.value));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Dashboard Filters
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Time Horizon
            </label>
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="5m">Last 5 Minutes</option>
              <option value="15m">Last 15 Minutes</option>
              <option value="1h">Last Hour (Full Stream)</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex justify-between">
              <span>Min Influence Threshold</span>
              <span className="font-mono text-blue-500">{Math.round(minInfluence * 100)}%</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={minInfluence}
                onChange={handleMinInfluenceChange}
                className="flex-1 accent-blue-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex justify-between">
              <span>Node Size Scaling</span>
              <span className="font-mono text-blue-500">{nodeSize}%</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={nodeSize}
                onChange={handleNodeSizeChange}
                className="flex-1 accent-blue-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="show-labels"
              checked={showLabels}
              onChange={handleShowLabelsChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 accent-blue-500 cursor-pointer"
            />
            <label htmlFor="show-labels" className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Render Node User Labels
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setTimeRange('1h');
              setMinInfluence(0);
              setShowLabels(true);
              setNodeSize(50);
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}