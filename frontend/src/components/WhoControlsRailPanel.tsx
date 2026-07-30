import { Node } from '@/types/cascade';

interface WhoControlsRailPanelProps {
  influencers: Node[];
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
];

export default function WhoControlsRailPanel({ influencers }: WhoControlsRailPanelProps) {
  if (!influencers || influencers.length === 0) {
    return <div className="text-center py-6 text-gray-500 dark:text-gray-400">No influencer data available</div>;
  }

  // Focus on top 3 influencers for control rail
  const topInfluencers = influencers.slice(0, 3);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Who Controls the Rail
        </h3>
        
        <div className="space-y-2.5">
          {topInfluencers.map((influencer, index) => {
            const theme = COLOR_THEMES[index % COLOR_THEMES.length];
            return (
              <div
                key={influencer.id}
                className="flex items-center space-x-3 p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="flex-shrink-0">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm ${theme.lightBg} ${theme.text}`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{influencer.label}</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex-shrink-0">Velocity Share:</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${theme.bg}`}
                        style={{ width: `${Math.min(influencer.influence * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{Math.round(influencer.influence * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 pt-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Control Analysis</h4>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p className="flex items-start">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            <span>
              Primary actor control drives <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round((topInfluencers[0]?.influence || 0) * 100)}%</span> of the initial propagation velocity.
            </span>
          </p>
          <p className="flex items-start">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
            <span>
              Targeting the top 3 nodes provides reach over <span className="font-bold text-gray-800 dark:text-gray-200">{Math.min(90, Math.floor((topInfluencers.reduce((sum, inf) => sum + inf.influence, 0) / Math.max(topInfluencers.length, 1)) * 100))}%</span> of downstream cascades.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}