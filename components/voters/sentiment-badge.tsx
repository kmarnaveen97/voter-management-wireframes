"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Minus,
  HelpCircle,
} from "lucide-react";

// Define local Sentiment type since it's not exported from api
export type Sentiment = "support" | "oppose" | "swing" | "neutral" | "unknown";

// Centralized sentiment configuration
const SENTIMENT_CONFIG = {
  support: {
    label: "Support",
    icon: ThumbsUp,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    dotColor: "bg-green-500",
  },
  oppose: {
    label: "Oppose",
    icon: ThumbsDown,
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
  },
  swing: {
    label: "Swing",
    icon: TrendingUp,
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    dotColor: "bg-gray-500",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dotColor: "bg-slate-400",
  },
} as const;

export interface SentimentBadgeProps {
  sentiment: Sentiment;
  showIcon?: boolean;
  showDot?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function SentimentBadge({
  sentiment,
  showIcon = false,
  showDot = false,
  size = "default",
  className,
}: SentimentBadgeProps) {
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    default: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        "font-medium inline-flex items-center gap-1",
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      )}
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

// Utility for getting sentiment color for charts/visualizations
export function getSentimentColor(sentiment: Sentiment): string {
  const colors: Record<Sentiment, string> = {
    support: "#22c55e",
    oppose: "#ef4444",
    swing: "#f59e0b",
    neutral: "#6b7280",
    unknown: "#94a3b8",
  };
  return colors[sentiment] || colors.unknown;
}

// Export config for reuse
export { SENTIMENT_CONFIG };
