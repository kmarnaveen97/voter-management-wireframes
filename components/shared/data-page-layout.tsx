"use client";

import { PageLoadingSkeleton } from "./page-loading-skeleton";
import { QueryErrorState } from "./query-error-state";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface DataPageLayoutProps {
  /**
   * Page is loading
   */
  isLoading?: boolean;

  /**
   * Error object
   */
  error?: Error | null;

  /**
   * Retry callback for error state
   */
  onRetry?: () => void;

  /**
   * Whether retry is in progress
   */
  isRetrying?: boolean;

  /**
   * Loading skeleton variant
   */
  loadingVariant?: "dashboard" | "table" | "cards" | "detail" | "form";

  /**
   * Number of stat cards for dashboard skeleton
   */
  statsCount?: number;

  /**
   * Number of rows for table skeleton
   */
  rowCount?: number;

  /**
   * Error variant
   */
  errorVariant?: "full-page" | "inline" | "card" | "centered";

  /**
   * Page content (rendered when not loading and no error)
   */
  children: React.ReactNode;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DataPageLayout - A wrapper component that handles loading, error, and success states.
 *
 * Use this to wrap your page content and automatically get:
 * - Loading skeletons while data is fetching
 * - Error states with retry functionality
 * - Clean content rendering when data is ready
 *
 * @example
 * ```tsx
 * <DataPageLayout
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   loadingVariant="table"
 * >
 *   <YourPageContent />
 * </DataPageLayout>
 * ```
 */
export function DataPageLayout({
  isLoading = false,
  error = null,
  onRetry,
  isRetrying = false,
  loadingVariant = "table",
  statsCount,
  rowCount,
  errorVariant = "full-page",
  children,
  className,
}: DataPageLayoutProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <PageLoadingSkeleton
          variant={loadingVariant}
          statsCount={statsCount}
          rowCount={rowCount}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <QueryErrorState
          error={error}
          variant={errorVariant}
          onRetry={onRetry}
          isRetrying={isRetrying}
          showHomeLink={errorVariant === "full-page"}
        />
      </div>
    );
  }

  // Success state - render children
  return <div className={cn(className)}>{children}</div>;
}
