"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface PageLoadingSkeletonProps {
  /**
   * Predefined layout variants
   * - dashboard: Header + stat cards + large content area
   * - table: Header + toolbar + table rows
   * - cards: Header + grid of card skeletons
   * - detail: Header + sidebar + main content
   * - form: Header + form fields
   */
  variant?: "dashboard" | "table" | "cards" | "detail" | "form";

  /**
   * Number of stat cards to show (for dashboard variant)
   * @default 4
   */
  statsCount?: number;

  /**
   * Number of columns for stat cards
   * @default 4
   */
  statsColumns?: 2 | 3 | 4 | 5;

  /**
   * Number of rows to show (for table variant)
   * @default 8
   */
  rowCount?: number;

  /**
   * Number of cards to show (for cards variant)
   * @default 6
   */
  cardCount?: number;

  /**
   * Whether to show the header skeleton
   * @default true
   */
  showHeader?: boolean;

  /**
   * Whether to show action buttons in header
   * @default true
   */
  showHeaderActions?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function HeaderSkeleton({ showActions = true }: { showActions?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b py-4">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="ml-auto h-4 w-16" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PageLoadingSkeleton({
  variant = "table",
  statsCount = 4,
  statsColumns = 4,
  rowCount = 8,
  cardCount = 6,
  showHeader = true,
  showHeaderActions = true,
  className,
}: PageLoadingSkeletonProps) {
  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[statsColumns];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {showHeader && <HeaderSkeleton showActions={showHeaderActions} />}

      {/* Dashboard variant */}
      {variant === "dashboard" && (
        <>
          {/* Stat cards */}
          <div className={cn("grid gap-4", gridColsClass)}>
            {Array.from({ length: statsCount }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Main content area */}
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </>
      )}

      {/* Table variant */}
      {variant === "table" && (
        <>
          <ToolbarSkeleton />
          <div className="rounded-lg border bg-card">
            {/* Table header */}
            <div className="flex items-center gap-4 border-b bg-muted/50 px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
            {/* Table rows */}
            <div className="px-4">
              {Array.from({ length: rowCount }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </>
      )}

      {/* Cards variant */}
      {variant === "cards" && (
        <>
          <ToolbarSkeleton />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cardCount }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {/* Detail variant (with sidebar) */}
      {variant === "detail" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-20 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form variant */}
      {variant === "form" && (
        <div className="rounded-lg border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <FormFieldSkeleton key={i} />
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      )}
    </div>
  );
}
