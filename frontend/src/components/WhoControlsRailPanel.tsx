import type { CascadeNode } from '@/types/cascade';

interface WhoControlsRailPanelProps {
  influencers: CascadeNode[];
  top3ReachShare: number;
  controlScore: number;
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

function getNodeAccent(
  index: number,
): string {
  const accents = [
    'text-rails-cyan',
    'text-rails-indigo',
    'text-sky-300',
  ];

  return accents[
    index % accents.length
  ];
}

function getNodeBar(
  index: number,
): string {
  const bars = [
    'bg-rails-cyan',
    'bg-rails-indigo',
    'bg-sky-300',
  ];

  return bars[
    index % bars.length
  ];
}

function getControlInterpretation(
  controlScore: number,
  top3ReachShare: number,
): string {
  if (
    controlScore >= 50 ||
    top3ReachShare >= 70
  ) {
    return (
      'Control is highly concentrated. A relatively small set of distribution positions has disproportionate leverage over downstream reach.'
    );
  }

  if (
    controlScore >= 20 ||
    top3ReachShare >= 40
  ) {
    return (
      'Control is meaningfully concentrated, but downstream reach is not entirely dependent on a small number of positions.'
    );
  }

  return (
    'Control is comparatively distributed across the visible network, reducing dependence on individual high-reach positions.'
  );
}

export default function WhoControlsRailPanel({
  influencers,
  top3ReachShare,
  controlScore,
}: WhoControlsRailPanelProps) {
  const safeTop3ReachShare =
    Number.isFinite(
      top3ReachShare,
    )
      ? top3ReachShare
      : 0;

  const safeControlScore =
    Number.isFinite(
      controlScore,
    )
      ? controlScore
      : 0;

  if (
    !influencers ||
    influencers.length === 0
  ) {
    return (
      <div className="border border-rails-border bg-slate-950/30 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          No control signal
        </p>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          No active distribution nodes are available
          for the current replay window.
        </p>
      </div>
    );
  }

  const topInfluencers =
    influencers.slice(0, 3);

  const totalTopReach =
    topInfluencers.reduce(
      (sum, influencer) =>
        sum +
        Math.max(
          influencer.downstream_reach,
          0,
        ),
      0,
    );

  return (
    <div className="space-y-5">
      {/* Governance context */}
      <div className="border border-rails-indigo/20 bg-rails-indigo/[0.03] p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-indigo">
          Governance / Institutional Context
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Social virality is shaped by a feedback loop
          between platforms, recommendation systems,
          influential users, and audiences. Already-visible
          content can receive additional amplification,
          concentrating attention and influence around
          established distribution positions.
        </p>
      </div>

      {/* Control headline */}
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Who Controls the Rail
            </div>

            <div className="mt-1 text-2xl font-semibold text-white">
              {safeTop3ReachShare.toFixed(0)}%
            </div>

            <div className="text-[10px] text-rails-textMuted">
              of downstream reach is held by the top three
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Control
            </div>

            <div className="mt-1 text-lg font-semibold text-rails-indigo">
              {safeControlScore.toFixed(1)}
              <span className="text-xs text-rails-textMuted">
                /100
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 h-1 bg-slate-950">
          <div
            className="h-full bg-rails-indigo shadow-[0_0_12px_rgba(129,140,248,0.45)] transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(
                  safeTop3ReachShare,
                  0,
                ),
                100,
              )}%`,
            }}
          />
        </div>

        <p className="mt-3 text-[11px] leading-5 text-rails-textMuted">
          {getControlInterpretation(
            safeControlScore,
            safeTop3ReachShare,
          )}
        </p>
      </div>

      {/* Distribution nodes */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
            Critical Distribution Positions
          </span>

          <span className="h-px flex-1 bg-rails-border" />
        </div>

        <div className="space-y-2">
          {topInfluencers.map(
            (
              influencer,
              index,
            ) => {
              const downstreamReach =
                Math.max(
                  influencer.downstream_reach,
                  0,
                );

              const topThreeShare =
                totalTopReach > 0
                  ? (
                      downstreamReach /
                      totalTopReach
                    ) *
                    100
                  : 0;

              return (
                <div
                  key={influencer.id}
                  className="border border-rails-border bg-slate-950/30 p-3 transition-colors hover:border-rails-cyan/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-rails-border bg-rails-surfaceRaised font-mono text-[10px] text-rails-textMuted">
                      0{index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white">
                            {influencer.label}
                          </div>

                          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-rails-textMuted">
                            {influencer.role}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 font-mono text-xs font-semibold ${getNodeAccent(index)}`}
                        >
                          {formatCompact(
                            downstreamReach,
                          )}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between font-mono text-[9px] text-rails-textMuted">
                          <span>
                            Share within top 3
                          </span>

                          <span>
                            {topThreeShare.toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>

                        <div className="mt-1 h-1 bg-slate-900">
                          <div
                            className={`h-full ${getNodeBar(index)}`}
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  topThreeShare,
                                  0,
                                ),
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                            Influence
                          </div>

                          <div className="mt-0.5 text-xs font-semibold text-white">
                            {Number.isFinite(
                              influencer.influence_score,
                            )
                              ? influencer.influence_score.toFixed(
                                  1,
                                )
                              : '0.0'}
                          </div>
                        </div>

                        <div>
                          <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
                            Views
                          </div>

                          <div className="mt-0.5 text-xs font-semibold text-white">
                            {formatCompact(
                              influencer.views,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Infrastructure interpretation */}
      <div className="border-t border-rails-border pt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Rail Interpretation
        </div>

        <p className="mt-2 text-[11px] leading-5 text-rails-textMuted">
          The visible influencers represent network
          positions with unusually high downstream leverage.
          In a real distribution system, similar
          concentration can make reach dependent on a small
          number of platform or network-level amplification
          points.
        </p>
      </div>
    </div>
  );
}