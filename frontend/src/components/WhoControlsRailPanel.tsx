import type { CascadeNode } from "@/types/cascade";

interface WhoControlsRailPanelProps {
  influencers: CascadeNode[];
  top3ReachShare: number;
  controlScore: number;
}

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
];

function formatCompact(
  value: number,
): string {
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

  return value.toLocaleString();
}

export default function WhoControlsRailPanel({
  influencers,
  top3ReachShare,
  controlScore,
}: WhoControlsRailPanelProps) {
  if (
    !influencers ||
    influencers.length === 0
  ) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        No control data available.
      </div>
    );
  }

  const topInfluencers =
    influencers.slice(0, 3);

  const totalTopReach =
    topInfluencers.reduce(
      (sum, influencer) =>
        sum +
        influencer.downstream_reach,
      0,
    );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-100">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Who Controls the Rail
        </h3>

        <p className="text-xs leading-4 text-gray-500">
          Where downstream reach is concentrated
          across the simulated distribution network.
        </p>
      </div>

      <div className="space-y-2.5">
        {topInfluencers.map(
          (
            influencer,
            index,
          ) => {
            const share =
              totalTopReach > 0
                ? (
                    influencer.downstream_reach /
                    totalTopReach
                  ) * 100
                : 0;

            return (
              <div
                key={influencer.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${COLORS[index % COLORS.length]}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-gray-100">
                        {influencer.label}
                      </span>

                      <span className="font-mono text-xs text-emerald-400">
                        {formatCompact(
                          influencer.downstream_reach,
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full ${COLORS[index % COLORS.length]}`}
                          style={{
                            width: `${Math.min(
                              share,
                              100,
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="w-12 text-right font-mono text-[10px] text-gray-500">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Control Analysis
        </h4>

        <div className="space-y-2.5 text-xs leading-4 text-gray-400">
          <p>
            The top three amplifiers account for{" "}
            <span className="font-bold text-gray-100">
              {top3ReachShare.toFixed(
                1,
              )}
              %
            </span>{" "}
            of actor-attributed downstream reach.
          </p>

          <p>
            Reach concentration score:{" "}
            <span className="font-mono font-bold text-indigo-400">
              {controlScore.toFixed(1)}
            </span>
            / 100.
          </p>

          <p className="text-gray-600">
            Higher concentration means more of the
            simulated distribution rail is dependent on
            fewer amplifiers.
          </p>
        </div>
      </div>
    </div>
  );
}