"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface FilterChip {
  /**
   * Unique key for the filter
   */
  key: string;

  /**
   * Display label for the filter
   */
  label: string;

  /**
   * Filter value (displayed after the label)
   */
  value: string | number;

  /**
   * Callback to remove this filter
   */
  onRemove: () => void;

  /**
   * Optional color variant
   */
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export interface FilterChipsProps {
  /**
   * Array of active filters
   */
  filters: FilterChip[];

  /**
   * Callback to clear all filters
   */
  onClearAll?: () => void;

  /**
   * Show "Clear all" button
   * @default true (when there are 2+ filters)
   */
  showClearAll?: boolean;

  /**
   * Maximum number of visible chips before collapsing
   */
  maxVisible?: number;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterChips({
  filters,
  onClearAll,
  showClearAll,
  maxVisible,
  className,
}: FilterChipsProps) {
  // Don't render if no filters
  if (filters.length === 0) return null;

  // Determine which filters to show
  const visibleFilters = maxVisible ? filters.slice(0, maxVisible) : filters;
  const hiddenCount = maxVisible ? Math.max(0, filters.length - maxVisible) : 0;

  // Show clear all if explicitly enabled, or if there are 2+ filters
  const shouldShowClearAll =
    showClearAll ?? (filters.length >= 2 && !!onClearAll);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Active filter label */}
      <span className="text-sm text-muted-foreground">Filters:</span>

      {/* Filter chips */}
      {visibleFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant={filter.variant || "secondary"}
          className="gap-1 pr-1"
        >
          <span className="font-normal">{filter.label}:</span>
          <span className="font-medium">{filter.value}</span>
          <button
            onClick={filter.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Hidden count badge */}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          +{hiddenCount} more
        </Badge>
      )}

      {/* Clear all button */}
      {shouldShowClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
