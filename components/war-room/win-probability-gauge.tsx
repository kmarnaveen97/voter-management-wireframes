"use client";

import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WinProbabilityGaugeProps {
  probability: number;
}

/**
 * Win probability gauge component
 * Shows visual indicator of election win probability
 * Memoized to prevent re-renders when parent state changes
 */
export const WinProbabilityGauge = memo(function WinProbabilityGauge({
  probability,
}: WinProbabilityGaugeProps) {
  const getColor = () => {
    if (probability >= 60) return "bg-green-500";
    if (probability >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLabel = () => {
    if (probability >= 70) return "Strong Lead";
    if (probability >= 55) return "Slight Lead";
    if (probability >= 45) return "Toss-Up";
    if (probability >= 30) return "Trailing";
    return "At Risk";
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Win Probability
        </h3>
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            probability >= 60 && "bg-green-100 text-green-700",
            probability >= 40 &&
              probability < 60 &&
              "bg-yellow-100 text-yellow-700",
            probability < 40 && "bg-red-100 text-red-700"
          )}
        >
          {getLabel()}
        </Badge>
      </div>
      <div className="relative">
        <div className="text-4xl font-bold text-foreground mb-2">
          {probability.toFixed(0)}%
        </div>
        <Progress value={probability} className={cn("h-3", getColor())} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
});

WinProbabilityGauge.displayName = "WinProbabilityGauge";
