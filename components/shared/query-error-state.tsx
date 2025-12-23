"use client";

import { AlertCircle, RefreshCcw, Home, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// =============================================================================
// TYPES
// =============================================================================

export interface QueryErrorStateProps {
  /**
   * The error object from React Query or any Error instance
   */
  error: Error | null;

  /**
   * Layout variant
   * - full-page: Centered error with large icon (for page-level errors)
   * - inline: Alert-style error (for section errors)
   * - card: Error in a card container (for widget errors)
   * - centered: Simple centered text (for empty areas)
   */
  variant?: "full-page" | "inline" | "card" | "centered";

  /**
   * Custom error title
   * @default "Something went wrong"
   */
  title?: string;

  /**
   * Custom error description (overrides error.message)
   */
  description?: string;

  /**
   * Callback for retry button
   */
  onRetry?: () => void;

  /**
   * Text for retry button
   * @default "Try again"
   */
  retryText?: string;

  /**
   * Whether retry is currently in progress
   */
  isRetrying?: boolean;

  /**
   * Show a link to home page
   */
  showHomeLink?: boolean;

  /**
   * Custom home link href
   * @default "/voters-management"
   */
  homeHref?: string;

  /**
   * Custom home link text
   * @default "Go to Dashboard"
   */
  homeText?: string;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function QueryErrorState({
  error,
  variant = "inline",
  title = "Something went wrong",
  description,
  onRetry,
  retryText = "Try again",
  isRetrying = false,
  showHomeLink = false,
  homeHref = "/voters-management",
  homeText = "Go to Dashboard",
  className,
}: QueryErrorStateProps) {
  // Don't render if no error
  if (!error) return null;

  const errorMessage =
    description || error.message || "An unexpected error occurred";

  // Full-page variant - large centered error
  if (variant === "full-page") {
    return (
      <div
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center gap-6 p-8",
          className
        )}
      >
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-muted-foreground max-w-md">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} disabled={isRetrying}>
              <RefreshCcw
                className={cn("mr-2 h-4 w-4", isRetrying && "animate-spin")}
              />
              {retryText}
            </Button>
          )}
          {showHomeLink && (
            <Button variant="outline" asChild>
              <Link href={homeHref}>
                <Home className="mr-2 h-4 w-4" />
                {homeText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant - error inside a card container
  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/50 bg-destructive/5 p-6",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-medium text-destructive">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
            {(onRetry || showHomeLink) && (
              <div className="flex gap-2">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    disabled={isRetrying}
                  >
                    <RefreshCcw
                      className={cn(
                        "mr-1.5 h-3.5 w-3.5",
                        isRetrying && "animate-spin"
                      )}
                    />
                    {retryText}
                  </Button>
                )}
                {showHomeLink && (
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={homeHref}>{homeText}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Centered variant - simple centered text
  if (variant === "centered") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 py-12 text-center",
          className
        )}
      >
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCcw
              className={cn("mr-1.5 h-3.5 w-3.5", isRetrying && "animate-spin")}
            />
            {retryText}
          </Button>
        )}
      </div>
    );
  }

  // Inline variant (default) - Alert component
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-4 shrink-0"
          >
            <RefreshCcw
              className={cn("mr-1.5 h-3.5 w-3.5", isRetrying && "animate-spin")}
            />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
