"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface PaginationControlsProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Total number of items
   */
  totalItems: number;

  /**
   * Current page size
   */
  pageSize: number;

  /**
   * Available page size options
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Page change callback
   */
  onPageChange: (page: number) => void;

  /**
   * Page size change callback
   */
  onPageSizeChange?: (size: number) => void;

  /**
   * Display variant
   * - full: All controls (page size, input, navigation)
   * - simple: Just navigation buttons
   * - compact: Minimal with just prev/next
   */
  variant?: "full" | "simple" | "compact";

  /**
   * Show page size selector
   * @default true (for full variant)
   */
  showPageSizeSelector?: boolean;

  /**
   * Show direct page input
   * @default true (for full variant)
   */
  showPageInput?: boolean;

  /**
   * Show item count text (e.g., "Showing 1-10 of 100")
   * @default true
   */
  showItemCount?: boolean;

  /**
   * Label for items (e.g., "voters", "families")
   * @default "items"
   */
  itemLabel?: string;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  variant = "full",
  showPageSizeSelector,
  showPageInput,
  showItemCount = true,
  itemLabel = "items",
  className,
}: PaginationControlsProps) {
  const [inputValue, setInputValue] = useState(String(currentPage));

  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Determine which controls to show based on variant
  const shouldShowPageSizeSelector =
    showPageSizeSelector ?? (variant === "full" && !!onPageSizeChange);
  const shouldShowPageInput = showPageInput ?? variant === "full";

  // Navigation handlers
  const goToFirstPage = () => onPageChange(1);
  const goToPrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      } else {
        setInputValue(String(currentPage));
      }
    }
  };

  // Sync input value when currentPage changes externally
  if (
    inputValue !== String(currentPage) &&
    document.activeElement?.tagName !== "INPUT"
  ) {
    setInputValue(String(currentPage));
  }

  // Compact variant - just prev/next buttons
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Simple variant - navigation buttons only
  if (variant === "simple") {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        {showItemCount && (
          <p className="text-sm text-muted-foreground">
            {startItem}-{endItem} of {totalItems.toLocaleString()} {itemLabel}
          </p>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Full variant - all controls
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Left side: Item count + page size */}
      <div className="flex items-center gap-4">
        {showItemCount && (
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalItems.toLocaleString()}{" "}
            {itemLabel}
          </p>
        )}
        {shouldShowPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side: Navigation */}
      <div className="flex items-center gap-2">
        {/* First / Previous */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToFirstPage}
            disabled={currentPage <= 1}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Page input */}
        {shouldShowPageInput && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => setInputValue(String(currentPage))}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>
        )}

        {/* Next / Last */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToLastPage}
            disabled={currentPage >= totalPages}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
