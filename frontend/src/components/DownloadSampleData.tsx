"use client";

import { useState } from "react";
import type { CascadeData } from "@/types/cascade";

interface DownloadSampleDataProps {
  data: CascadeData;
  onRegenerate?: () => Promise<void> | void;
}

export default function DownloadSampleData({
  data,
  onRegenerate,
}: DownloadSampleDataProps) {
  const [isDownloading, setIsDownloading] =
    useState(false);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);

    try {
      const exportPayload = {
        schema_version: "1.0",
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
          type: "application/json",
        },
      );

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold text-gray-100">
          Scenario Data
        </h3>

        <p className="mb-3 text-sm text-gray-500">
          Export the current scenario, including its
          event stream and derived analytics.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={
              handleDownload
            }
            disabled={
              isDownloading ||
              isGenerating
            }
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading
              ? "Preparing..."
              : "Download JSON"}
          </button>

          {onRegenerate && (
            <button
              onClick={
                handleGenerate
              }
              disabled={
                isDownloading ||
                isGenerating
              }
              className="flex w-full items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? "Generating Scenario..."
                : "Generate New Scenario"}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-3 text-xs text-gray-600">
        <p>
          <strong className="text-gray-500">
            Format:
          </strong>{" "}
          JSON
        </p>

        <p className="mt-1">
          <strong className="text-gray-500">
            Includes:
          </strong>{" "}
          nodes, propagation events, metrics,
          influencers and control analytics
        </p>

        <p className="mt-1">
          <strong className="text-gray-500">
            Provenance:
          </strong>{" "}
          {data.source.gdelt ===
          "real"
            ? "GDELT context + synthetic social cascade"
            : "Synthetic social cascade + derived analytics"}
        </p>
      </div>
    </div>
  );
}