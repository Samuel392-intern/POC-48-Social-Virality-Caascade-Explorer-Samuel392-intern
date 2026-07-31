'use client';

import { useMemo } from "react";
import type { CascadeData } from "@/types/cascade";

interface InfluencerNodesProps {
  data: CascadeData;
}

const COLOR_THEMES = [
  {
    bg: "bg-blue-500",
    lightBg:
      "bg-blue-950/40",
    text: "text-blue-400",
  },
  {
    bg: "bg-emerald-500",
    lightBg:
      "bg-emerald-950/40",
    text: "text-emerald-400",
  },
  {
    bg: "bg-purple-500",
    lightBg:
      "bg-purple-950/40",
    text: "text-purple-400",
  },
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

export default function InfluencerNodes({
  data,
}: InfluencerNodesProps) {
  const influencers =
    data.influencers ?? [];

  const rankedInfluencers =
    useMemo(
      () =>
        [...influencers].sort(
          (a, b) =>
            b.downstream_reach
            - a.downstream_reach,
        ),
      [influencers],
    );

  if (
    rankedInfluencers.length ===
    0
  ) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        No influencer data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-100">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          Key Amplifiers
        </h3>

        <p className="text-xs leading-4 text-gray-500">
          Ranked by downstream synthetic reach,
          not by arbitrary influence values.
        </p>
      </div>

      <div className="space-y-2">
        {rankedInfluencers.map(
          (
            influencer,
            index,
          ) => {
            const theme =
              COLOR_THEMES[
                index %
                  COLOR_THEMES.length
              ];

            return (
              <div
                key={influencer.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${theme.lightBg} ${theme.text}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-gray-100">
                        {influencer.label}
                      </span>

                      <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-400">
                        {influencer.role}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600">
                          Influence
                        </div>
                        <div className="font-mono font-semibold text-blue-400">
                          {influencer.influence_score.toFixed(
                            1,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600">
                          Reach
                        </div>
                        <div className="font-mono font-semibold text-emerald-400">
                          {formatCompact(
                            influencer.downstream_reach,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600">
                          Views
                        </div>
                        <div className="font-mono font-semibold text-gray-200">
                          {formatCompact(
                            influencer.views,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600">
                          Followers
                        </div>
                        <div className="font-mono font-semibold text-gray-200">
                          {formatCompact(
                            influencer.follower_count,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-[10px] text-gray-600">
                        <span>
                          Influence score
                        </span>
                        <span>
                          {influencer.influence_score.toFixed(
                            1,
                          )}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full ${theme.bg}`}
                          style={{
                            width: `${Math.min(
                              influencer.influence_score,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Top 3 reach share
          </span>

          <span className="font-mono font-semibold text-gray-200">
            {data.top3_reach_share.toFixed(
              1,
            )}
            %
          </span>
        </div>
      </div>
    </div>
  );
}