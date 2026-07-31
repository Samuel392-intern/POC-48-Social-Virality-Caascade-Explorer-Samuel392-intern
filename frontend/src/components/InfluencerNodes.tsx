'use client';

import { useMemo } from 'react';
import type { CascadeData } from '@/types/cascade';

interface InfluencerNodesProps {
  data: CascadeData;
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function getNodeAccent(index: number): string {
  const accents = [
    'text-rails-cyan',
    'text-rails-indigo',
    'text-sky-300',
  ];

  return accents[index % accents.length];
}

function getNodeBar(index: number): string {
  const bars = [
    'bg-rails-cyan',
    'bg-rails-indigo',
    'bg-sky-300',
  ];

  return bars[index % bars.length];
}

function getLeverageLabel(
  influenceScore: number,
): string {
  if (influenceScore >= 70) {
    return 'HIGH LEVERAGE';
  }

  if (influenceScore >= 40) {
    return 'MEDIUM LEVERAGE';
  }

  return 'LOWER LEVERAGE';
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
            b.downstream_reach -
            a.downstream_reach,
        ),
      [influencers],
    );

  const topInfluencers =
    rankedInfluencers.slice(0, 5);

  if (rankedInfluencers.length === 0) {
    return (
      <div className="border border-rails-border bg-slate-950/30 p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Distribution Positions
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          No high-leverage distribution nodes are
          active in the current replay window.
        </p>
      </div>
    );
  }

  const safeTop3ReachShare =
    Number.isFinite(
      data.top3_reach_share,
    )
      ? data.top3_reach_share
      : 0;

  const totalReach =
    rankedInfluencers.reduce(
      (sum, node) =>
        sum +
        Math.max(
          node.downstream_reach,
          0,
        ),
      0,
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rails-cyan shadow-[0_0_10px_rgba(56,189,248,0.8)]" />

            <h3 className="text-sm font-semibold text-white">
              Critical Distribution Nodes
            </h3>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
            Ranked
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Network positions with the greatest
          downstream reach in the current synthetic
          cascade.
        </p>
      </div>

      {/* Top-level signal */}
      <div className="border border-rails-border bg-slate-950/30 p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Top-3 Reach Share
            </div>

            <div className="mt-1 text-2xl font-semibold text-rails-cyan">
              {safeTop3ReachShare.toFixed(0)}%
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Active Positions
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {rankedInfluencers.length}
            </div>
          </div>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-rails-textMuted">
          Higher top-three share indicates greater
          dependence on a small set of distribution
          positions.
        </p>
      </div>

      {/* Node list */}
      <div className="space-y-2">
        {topInfluencers.map(
          (influencer, index) => {
            const influenceScore =
              Number.isFinite(
                influencer.influence_score,
              )
                ? Math.min(
                    Math.max(
                      influencer.influence_score,
                      0,
                    ),
                    100,
                  )
                : 0;

            const downstreamReach =
              Math.max(
                influencer.downstream_reach,
                0,
              );

            const globalReachShare =
              totalReach > 0
                ? (downstreamReach /
                    totalReach) *
                  100
                : 0;

            const accent =
              getNodeAccent(index);

            const bar =
              getNodeBar(index);

            return (
              <div
                key={influencer.id}
                className="border border-rails-border bg-rails-surfaceRaised p-3 transition-colors hover:border-rails-cyan/30"
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-rails-border bg-rails-surface font-mono text-[10px] text-rails-textMuted">
                    {String(
                      index + 1,
                    ).padStart(2, '0')}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-white">
                          {influencer.label}
                        </div>

                        <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
                          {influencer.role}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] ${accent}`}
                      >
                        {getLeverageLabel(
                          influenceScore,
                        )}
                      </span>
                    </div>

                    {/* Core metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                          Downstream Reach
                        </div>

                        <div
                          className={`mt-0.5 font-mono text-xs font-semibold ${accent}`}
                        >
                          {formatCompact(
                            downstreamReach,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                          Influence
                        </div>

                        <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                          {influenceScore.toFixed(
                            1,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                          Views
                        </div>

                        <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                          {formatCompact(
                            influencer.views,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                          Followers
                        </div>

                        <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                          {formatCompact(
                            influencer.follower_count,
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Influence bar */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                        <span>
                          Influence Index
                        </span>

                        <span>
                          {influenceScore.toFixed(
                            1,
                          )}
                        </span>
                      </div>

                      <div className="h-1 bg-rails-border">
                        <div
                          className={`h-full ${bar} shadow-[0_0_10px_rgba(56,189,248,0.25)] transition-all duration-500`}
                          style={{
                            width: `${influenceScore}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Reach share */}
                    <div className="mt-2 flex items-center justify-between font-mono text-[8px] text-rails-textMuted">
                      <span>
                        Network reach share
                      </span>

                      <span className="text-white">
                        {globalReachShare.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Interpretation */}
      <div className="border-t border-rails-border pt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Distribution Interpretation
        </div>

        <p className="mt-2 text-[11px] leading-5 text-rails-textMuted">
          These nodes represent high-leverage positions
          in the synthetic distribution network. They
          should be read as structural amplification
          points rather than as real-world platform
          institutions or verified social accounts.
        </p>
      </div>
    </div>
  );
}