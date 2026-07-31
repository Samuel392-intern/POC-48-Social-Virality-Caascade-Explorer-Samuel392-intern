import type { CascadeData } from '@/types/cascade';

interface WhyMattersPanelProps {
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

function getConcentrationState(
  top3ReachShare: number,
) {
  if (top3ReachShare >= 70) {
    return {
      label: 'HIGH CONCENTRATION',
      description:
        'A small set of distribution positions accounts for most downstream reach. The cascade is therefore highly dependent on a narrow part of the network.',
    };
  }

  if (top3ReachShare >= 40) {
    return {
      label: 'MODERATE CONCENTRATION',
      description:
        'Reach is meaningfully concentrated among a limited group of nodes, although propagation is not dominated by only a few positions.',
    };
  }

  return {
    label: 'BROAD DISTRIBUTION',
    description:
      'Downstream reach is relatively distributed across the visible network rather than being dominated by a small group of nodes.',
  };
}

export default function WhyMattersPanel({
  data,
}: WhyMattersPanelProps) {
  const top3ReachShare =
    Number.isFinite(
      data.top3_reach_share,
    )
      ? data.top3_reach_share
      : 0;

  const controlScore =
    Number.isFinite(
      data.control_score,
    )
      ? data.control_score
      : 0;

  const peakVelocity =
    Number.isFinite(
      data.peak_velocity,
    )
      ? data.peak_velocity
      : 0;

  const halfLife =
    Number.isFinite(
      data.half_life_minutes,
    )
      ? data.half_life_minutes
      : 0;

  const cumulativeViews =
    data.metrics.length > 0
      ? data.metrics[
          data.metrics.length - 1
        ]?.views ?? 0
      : 0;

  const concentration =
    getConcentrationState(
      top3ReachShare,
    );

  return (
    <div className="space-y-5">
      {/* Core intelligence statement */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rails-cyan shadow-[0_0_10px_rgba(56,189,248,0.8)]" />

          <h3 className="text-base font-semibold text-white">
            Why This Matters
          </h3>
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Distribution is rarely uniform. A small number
          of positions in a network can account for a
          disproportionate share of downstream reach,
          making the structure of the distribution rail
          as important as the size of the audience.
        </p>
      </div>

      {/* Main concentration signal */}
      <div className="border border-rails-cyan/20 bg-rails-cyan/[0.03] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Top-3 Reach Share
            </div>

            <div className="mt-1 text-3xl font-semibold tracking-tight text-rails-cyan">
              {top3ReachShare.toFixed(0)}%
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
              Control Score
            </div>

            <div className="mt-1 text-lg font-semibold text-rails-indigo">
              {controlScore.toFixed(1)}
              <span className="text-xs text-rails-textMuted">
                /100
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1 overflow-hidden bg-slate-900">
          <div
            className="h-full bg-rails-cyan shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(top3ReachShare, 0),
                100,
              )}%`,
            }}
          />
        </div>

        <div className="mt-3">
          <div className="text-xs font-semibold text-white">
            {concentration.label}
          </div>

          <p className="mt-1 text-[11px] leading-5 text-rails-textMuted">
            {concentration.description}
          </p>
        </div>
      </div>

      {/* Viewers */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-cyan">
            Everyday Viewers
          </span>

          <span className="h-px flex-1 bg-rails-border" />
        </div>

        <p className="text-xs leading-5 text-rails-textMuted">
          This scenario generated approximately{' '}
          <span className="font-mono font-semibold text-white">
            {formatCompact(
              cumulativeViews,
            )}
          </span>{' '}
          cumulative synthetic views. The important
          signal is not only how large the audience is,
          but how much of that reach depends on a small
          number of distribution nodes.
        </p>
      </div>

      {/* Builders */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-indigo">
            Builders
          </span>

          <span className="h-px flex-1 bg-rails-border" />
        </div>

        <p className="text-xs leading-5 text-rails-textMuted">
          The graph, timeline, replay state, and
          influence analysis are all derived from the
          same causal propagation event stream. Changing
          the visible event window therefore changes the
          downstream intelligence rather than just
          changing the presentation.
        </p>
      </div>

      {/* Allocators */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-cyan">
            Allocators
          </span>

          <span className="h-px flex-1 bg-rails-border" />
        </div>

        <p className="text-xs leading-5 text-rails-textMuted">
          A{' '}
          <span className="font-mono font-semibold text-white">
            {top3ReachShare.toFixed(0)}%
          </span>{' '}
          top-three reach share indicates how dependent
          this distribution rail is on a narrow set of
          high-leverage positions.
        </p>
      </div>

      {/* Timing */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
            Timing Signal
          </span>

          <span className="h-px flex-1 bg-rails-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-rails-border bg-slate-950/30 p-3">
            <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
              Peak Velocity
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {peakVelocity.toFixed(0)}
            </div>

            <div className="text-[10px] text-rails-textMuted">
              reposts / min
            </div>
          </div>

          <div className="border border-rails-border bg-slate-950/30 p-3">
            <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
              Half-Life
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {halfLife.toFixed(1)}
            </div>

            <div className="text-[10px] text-rails-textMuted">
              minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}