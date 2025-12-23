"use client";

import React, { memo } from "react";

interface SentimentBarProps {
  support: number;
  oppose: number;
  swing: number;
  unknown: number;
  total: number;
}

/**
 * Sentiment distribution bar component
 * Shows stacked bar visualization of voter sentiments
 * Memoized to prevent re-renders when parent state changes
 */
export const SentimentBar = memo(function SentimentBar({
  support,
  oppose,
  swing,
  unknown,
  total,
}: SentimentBarProps) {
  const supportPct = total > 0 ? (support / total) * 100 : 0;
  const opposePct = total > 0 ? (oppose / total) * 100 : 0;
  const swingPct = total > 0 ? (swing / total) * 100 : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Sentiment Distribution
      </h3>

      {/* Stacked bar */}
      <div className="h-8 rounded-lg overflow-hidden flex mb-3">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${supportPct}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${opposePct}%` }}
        />
        <div
          className="bg-yellow-500 transition-all"
          style={{ width: `${swingPct}%` }}
        />
        <div className="bg-gray-300 flex-1" />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Support</span>
          <span className="font-semibold ml-auto">{support}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Oppose</span>
          <span className="font-semibold ml-auto">{oppose}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-muted-foreground">Swing</span>
          <span className="font-semibold ml-auto">{swing}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-muted-foreground">Unknown</span>
          <span className="font-semibold ml-auto">{unknown}</span>
        </div>
      </div>
    </div>
  );
});

SentimentBar.displayName = "SentimentBar";
