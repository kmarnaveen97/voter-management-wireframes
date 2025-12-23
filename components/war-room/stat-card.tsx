"use client";

import React, { memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}

/**
 * Stat card component for displaying war room metrics
 * Memoized to prevent re-renders when parent state changes
 */
export const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color
          )}
        >
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingDown size={12} />}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";
