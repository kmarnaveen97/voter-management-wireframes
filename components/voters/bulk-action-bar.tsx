"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  X,
  Tag,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Minus,
  HelpCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { Sentiment } from "./sentiment-badge";

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkTag: (sentiment: Sentiment) => void;
  onBulkMarkVoted?: () => void;
  isLoading?: boolean;
  className?: string;
}

const SENTIMENT_OPTIONS: Array<{
  value: Sentiment;
  label: string;
  icon: typeof ThumbsUp;
  className: string;
}> = [
  {
    value: "support",
    label: "Support",
    icon: ThumbsUp,
    className: "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50",
  },
  {
    value: "oppose",
    label: "Oppose",
    icon: ThumbsDown,
    className: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
  },
  {
    value: "swing",
    label: "Swing",
    icon: TrendingUp,
    className: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50",
  },
  {
    value: "neutral",
    label: "Neutral",
    icon: Minus,
    className: "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/50",
  },
  {
    value: "unknown",
    label: "Unknown",
    icon: HelpCircle,
    className: "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50",
  },
];

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkTag,
  onBulkMarkVoted,
  isLoading = false,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-2.5 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in duration-200",
        className
      )}
    >
      {/* Selection count */}
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-primary-foreground/30" />

      {/* Bulk tag dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="h-8 gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Tag className="h-3.5 w-3.5" />
            )}
            Tag Sentiment
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40">
          {SENTIMENT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onBulkTag(option.value)}
              className={cn("gap-2 cursor-pointer", option.className)}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mark voted button (optional) */}
      {onBulkMarkVoted && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkMarkVoted}
          disabled={isLoading}
          className="h-8 gap-1.5"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Mark Voted
        </Button>
      )}

      <div className="h-4 w-px bg-primary-foreground/30" />

      {/* Clear selection */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}
