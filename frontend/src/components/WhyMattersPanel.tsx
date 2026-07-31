import type { CascadeData } from "@/types/cascade";

interface WhyMattersPanelProps {
  data: CascadeData;
}

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

export default function WhyMattersPanel({
  data,
}: WhyMattersPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-100">
          Why This Matters
        </h3>

        <p className="mt-1 text-xs leading-4 text-gray-600">
          One view for viewers, builders and allocators
          trying to understand the Distribution &amp; Demand rail.
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />

          <div>
            <p className="font-medium text-gray-100">
              For everyday viewers
            </p>

            <p className="mt-0.5 leading-5 text-gray-500">
              This scenario reached{" "}
              <span className="font-semibold text-gray-300">
                {formatCompact(
                  data.metrics.at(-1)?.views ??
                    0,
                )}
              </span>{" "}
              cumulative synthetic views, with a peak
              propagation velocity of{" "}
              <span className="font-mono text-gray-300">
                {data.peak_velocity.toFixed(
                  0,
                )}
              </span>{" "}
              reposts per minute.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

          <div>
            <p className="font-medium text-gray-100">
              For builders
            </p>

            <p className="mt-0.5 leading-5 text-gray-500">
              The graph, timeline and replay are all derived
              from the same causal event stream, so a change in
              the propagation chain changes every downstream view.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />

          <div>
            <p className="font-medium text-gray-100">
              For allocators
            </p>

            <p className="mt-0.5 leading-5 text-gray-500">
              The top three amplifiers account for{" "}
              <span className="font-mono text-gray-300">
                {data.top3_reach_share.toFixed(
                  1,
                )}
                %
              </span>{" "}
              of actor-attributed downstream reach.
              Concentration is{" "}
              <span className="font-mono text-gray-300">
                {data.control_score.toFixed(
                  1,
                )}
              </span>
              /100.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />

          <div>
            <p className="font-medium text-gray-100">
              Timing matters
            </p>

            <p className="mt-0.5 leading-5 text-gray-500">
              The synthetic cascade reaches half of its peak
              repost velocity after roughly{" "}
              <span className="font-mono text-gray-300">
                {data.half_life_minutes.toFixed(
                  1,
                )}
                m
              </span>
              . That makes the replay useful for comparing
              early versus late intervention windows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}