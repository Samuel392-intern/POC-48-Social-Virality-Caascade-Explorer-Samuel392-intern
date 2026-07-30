import { useState, useMemo } from 'react';
import { CascadeData } from '@/types/cascade';

interface InfluencerNodesProps {
  data: CascadeData;
}

const COLOR_THEMES = [
  {
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    bg: 'bg-purple-500',
    lightBg: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
  },
  {
    bg: 'bg-pink-500',
    lightBg: 'bg-pink-100 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
  },
  {
    bg: 'bg-indigo-500',
    lightBg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
];

export default function InfluencerNodes({ data }: InfluencerNodesProps) {
  const [showAll, setShowAll] = useState(false);
  
  const influencers = data.influencers || [];

  // Compute derived state dynamically
  const { top3Influencers, visibleInfluencers } = useMemo(() => {
    const top3 = influencers.slice(0, 3);
    const visible = showAll ? influencers : top3;
    return { top3Influencers: top3, visibleInfluencers: visible };
  }, [influencers, showAll]);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  if (influencers.length === 0) {
    return <div className="text-center py-6 text-gray-500 dark:text-gray-400">No influencer data available</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Key Influencer Nodes
        </h3>
        
        <div className="space-y-2">
          {visibleInfluencers.map((influencer, index) => {
            const theme = COLOR_THEMES[index % COLOR_THEMES.length];
            return (
              <div
                key={influencer.id}
                className="flex items-center space-x-3 p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800"
              >
                <div className="flex-shrink-0">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm ${theme.lightBg} ${theme.text}`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{influencer.label}</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="flex-shrink-0">Influence:</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${theme.bg}`}
                        style={{ width: `${Math.min(influencer.influence * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{Math.round(influencer.influence * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {influencers.length > 3 && (
        <div className="pt-1">
          <button
            onClick={toggleShowAll}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {showAll ? 'Collapse to Top 3' : `View All Influencers (${influencers.length})`}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-zinc-800 pt-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Network Impact Distribution</h4>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p className="flex items-start">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            <span>
              Top 3 drivers account for <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round(
                top33PercentCalculated(top3Influencers)
              )}%</span> of primary seed influence
            </span>
          </p>
          <p className="flex items-start">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            <span>
              The network exhibits a clear <span className="font-bold text-emerald-500">{influencers.length}-tier</span> node distribution hierarchy.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline helper to calculate aggregate percentage
function top33PercentCalculated(nodes: any[]) {
  if (nodes.length === 0) return 0;
  const sum = nodes.reduce((acc, curr) => acc + curr.influence, 0);
  return (sum / nodes.length) * 100;
}