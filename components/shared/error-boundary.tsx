"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCcw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
  /**
   * Child components to render
   */
  children: ReactNode;

  /**
   * Custom fallback UI when error occurs
   */
  fallback?: ReactNode;

  /**
   * Callback when error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Whether to show the reset button
   * @default true
   */
  showReset?: boolean;

  /**
   * Whether to show link to home
   * @default true
   */
  showHomeLink?: boolean;

  /**
   * Custom home link
   * @default "/voters-management"
   */
  homeHref?: string;

  /**
   * Whether to show error details in development
   * @default true
   */
  showDevDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// DEFAULT FALLBACK UI
// =============================================================================

interface DefaultFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  showReset: boolean;
  showHomeLink: boolean;
  homeHref: string;
  showDevDetails: boolean;
}

function DefaultFallback({
  error,
  errorInfo,
  onReset,
  showReset,
  showHomeLink,
  homeHref,
  showDevDetails,
}: DefaultFallbackProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>

      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
      </div>

      <div className="flex gap-3">
        {showReset && (
          <Button onClick={onReset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
        {showHomeLink && (
          <Button variant="outline" asChild>
            <Link href={homeHref}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        )}
      </div>

      {/* Development error details */}
      {isDev && showDevDetails && error && (
        <details className="w-full max-w-2xl mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Error details (development only)
          </summary>
          <div className="mt-2 rounded-lg bg-muted p-4 text-sm">
            <div className="font-mono">
              <p className="font-semibold text-destructive">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <>
                  <p className="mt-4 font-semibold">Component Stack:</p>
                  <pre className="mt-1 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback
      return (
        <DefaultFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showReset={this.props.showReset ?? true}
          showHomeLink={this.props.showHomeLink ?? true}
          homeHref={this.props.homeHref ?? "/voters-management"}
          showDevDetails={this.props.showDevDetails ?? true}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// PAGE-LEVEL ERROR BOUNDARY
// =============================================================================

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

/**
 * Page-level error boundary with consistent styling.
 * Use this to wrap individual pages.
 *
 * @example
 * ```tsx
 * // In a page layout or page component
 * <PageErrorBoundary pageName="Voters">
 *   <VotersPage />
 * </PageErrorBoundary>
 * ```
 */
export function PageErrorBoundary({
  children,
  pageName,
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log with page context
        console.error(`Error in ${pageName || "page"}:`, error, errorInfo);
      }}
      showReset
      showHomeLink
    >
      {children}
    </ErrorBoundary>
  );
}

// =============================================================================
// WIDGET/SECTION ERROR BOUNDARY
// =============================================================================

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetName?: string;
}

/**
 * Lightweight error boundary for widgets/sections.
 * Shows a compact error state that doesn't disrupt the page.
 *
 * @example
 * ```tsx
 * <WidgetErrorBoundary widgetName="Stats">
 *   <StatsWidget />
 * </WidgetErrorBoundary>
 * ```
 */
export function WidgetErrorBoundary({
  children,
  widgetName,
}: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              {widgetName ? `${widgetName} failed to load` : "Failed to load"}
            </p>
          </div>
        </div>
      }
      showReset={false}
      showHomeLink={false}
    >
      {children}
    </ErrorBoundary>
  );
}
