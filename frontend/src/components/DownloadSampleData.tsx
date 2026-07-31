'use client';

import { useState } from 'react';
import type { CascadeData } from '@/types/cascade';

interface DownloadSampleDataProps {
  data: CascadeData;
  onRegenerate?: () => Promise<void> | void;
}

function getSourceLabel(
  data: CascadeData,
): string {
  if (data.source.gdelt === 'real') {
    return 'GDELT context + synthetic social cascade';
  }

  return 'Synthetic social cascade + derived analytics';
}

function getSourceStatus(
  data: CascadeData,
): {
  label: string;
  tone: 'cyan' | 'indigo' | 'muted';
} {
  if (data.source.gdelt === 'real') {
    return {
      label: 'REAL CONTEXT',
      tone: 'cyan',
    };
  }

  return {
    label: 'SYNTHETIC',
    tone: 'indigo',
  };
}

export default function DownloadSampleData({
  data,
  onRegenerate,
}: DownloadSampleDataProps) {
  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);

    try {
      const exportPayload = {
        schema_version: '1.0',
        exported_at:
          new Date().toISOString(),

        provenance: data.source,

        scenario: {
          id: data.scenario_id,
          generated_at:
            data.generated_at,
        },

        nodes: data.nodes,
        events: data.events,
        metrics: data.metrics,

        analytics: {
          influencers:
            data.influencers,

          peak_velocity:
            data.peak_velocity,

          peak_timestamp:
            data.peak_timestamp,

          half_life_minutes:
            data.half_life_minutes,

          top3_reach_share:
            data.top3_reach_share,

          control_score:
            data.control_score,
        },
      };

      const blob = new Blob(
        [
          JSON.stringify(
            exportPayload,
            null,
            2,
          ),
        ],
        {
          type: 'application/json',
        },
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement(
          'a',
        );

      link.href = url;

      link.download =
        `${data.scenario_id}.json`;

      document.body.appendChild(
        link,
      );

      link.click();

      document.body.removeChild(
        link,
      );

      URL.revokeObjectURL(
        url,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate =
    async () => {
      if (!onRegenerate) {
        return;
      }

      setIsGenerating(true);

      try {
        await onRegenerate();
      } finally {
        setIsGenerating(false);
      }
    };

  const sourceStatus =
    getSourceStatus(data);

  const sourceLabel =
    getSourceLabel(data);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rails-indigo shadow-[0_0_10px_rgba(129,140,248,0.7)]" />

            <h3 className="text-sm font-semibold text-white">
              Sample Data
            </h3>
          </div>

          <span
            className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
              sourceStatus.tone ===
              'cyan'
                ? 'text-rails-cyan'
                : sourceStatus.tone ===
                    'indigo'
                  ? 'text-rails-indigo'
                  : 'text-rails-textMuted'
            }`}
          >
            {sourceStatus.label}
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-rails-textMuted">
          Export the current event stream and its
          derived intelligence for analysis, sharing,
          or reproducible development work.
        </p>
      </div>

      {/* Provenance */}
      <div className="border border-rails-border bg-slate-950/30 p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Data Provenance
        </div>

        <div className="mt-3 space-y-2 font-mono text-[9px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-rails-textMuted">
              SOCIAL CASCADE
            </span>

            <span className="text-rails-indigo">
              {data.source.social_cascade ===
              'synthetic'
                ? 'SYNTHETIC'
                : data.source.social_cascade.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-rails-textMuted">
              VIEWS
            </span>

            <span className="text-rails-indigo">
              {data.source.views.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-rails-textMuted">
              METRICS
            </span>

            <span className="text-rails-cyan">
              {data.source.metrics.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-rails-textMuted">
              GDELT
            </span>

            <span
              className={
                data.source.gdelt ===
                'real'
                  ? 'text-rails-cyan'
                  : 'text-rails-textMuted'
              }
            >
              {data.source.gdelt ===
              'real'
                ? 'REAL'
                : 'NOT USED'}
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-rails-border pt-3">
          <p className="text-[10px] leading-4 text-rails-textMuted">
            {sourceLabel}
          </p>
        </div>
      </div>

      {/* Scenario identifier */}
      <div className="border border-rails-border bg-rails-surfaceRaised p-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
          Scenario Identifier
        </div>

        <div className="mt-1 truncate font-mono text-[10px] text-white">
          {data.scenario_id}
        </div>

        <div className="mt-2 text-[9px] leading-4 text-rails-textMuted">
          Generated{' '}
          {new Date(
            data.generated_at,
          ).toLocaleString()}
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-rails-border pt-4">
        <div className="mb-3">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
            Export Current Scenario
          </div>

          <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
            Includes nodes, propagation events, metrics,
            influencers, and derived control analytics.
          </p>
        </div>

        <button
          onClick={
            handleDownload
          }
          disabled={
            isDownloading ||
            isGenerating
          }
          className="w-full border border-rails-cyan bg-rails-cyan px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloading
            ? 'Preparing Export...'
            : 'Download JSON'}
        </button>
      </div>

      {/* Regenerate */}
      {onRegenerate && (
        <div className="border-t border-rails-border pt-4">
          <div className="mb-3">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted">
              Scenario Generation
            </div>

            <p className="mt-1 text-[10px] leading-4 text-rails-textMuted">
              Generate another synthetic cascade scenario
              using the backend event generator.
            </p>
          </div>

          <button
            onClick={
              handleGenerate
            }
            disabled={
              isDownloading ||
              isGenerating
            }
            className="w-full border border-rails-border bg-rails-surfaceRaised px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-rails-textMuted transition-colors hover:border-rails-indigo/50 hover:text-rails-indigo disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating
              ? 'Generating Scenario...'
              : 'Generate New Scenario'}
          </button>
        </div>
      )}

      {/* Export schema */}
      <div className="border-t border-rails-border pt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-rails-textMuted">
          Export Schema
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="border border-rails-border bg-slate-950/30 p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
              Format
            </div>

            <div className="mt-1 text-xs font-semibold text-white">
              JSON
            </div>
          </div>

          <div className="border border-rails-border bg-slate-950/30 p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
              Version
            </div>

            <div className="mt-1 font-mono text-xs font-semibold text-white">
              1.0
            </div>
          </div>

          <div className="border border-rails-border bg-slate-950/30 p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
              Events
            </div>

            <div className="mt-1 font-mono text-xs font-semibold text-rails-cyan">
              {data.events.length}
            </div>
          </div>

          <div className="border border-rails-border bg-slate-950/30 p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-rails-textMuted">
              Nodes
            </div>

            <div className="mt-1 font-mono text-xs font-semibold text-rails-indigo">
              {data.nodes.length}
            </div>
          </div>
        </div>
      </div>

      {/* Protocol warning */}
      <div className="border border-rails-indigo/20 bg-rails-indigo/[0.03] p-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-indigo">
          Provenance Notice
        </div>

        <p className="mt-1.5 text-[10px] leading-4 text-rails-textMuted">
          Synthetic cascade and view data are labeled
          explicitly. Derived metrics are calculated from
          the event stream and should not be interpreted as
          live platform telemetry.
        </p>
      </div>
    </div>
  );
}