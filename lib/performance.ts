/**
 * Performance Utilities
 *
 * Helper functions and hooks for optimizing application performance.
 */

import { useCallback, useRef, useEffect } from "react";

// =============================================================================
// REQUEST IDLE CALLBACK POLYFILL
// =============================================================================

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

/**
 * Cross-browser requestIdleCallback with fallback
 */
export const requestIdleCallback =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback): number => {
        const start = Date.now();
        return window.setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1) as unknown as number;
      };

export const cancelIdleCallback =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

// =============================================================================
// DEFERRED EXECUTION
// =============================================================================

/**
 * Execute a callback during browser idle time
 */
export function whenIdle(callback: () => void, timeout = 1000): void {
  requestIdleCallback(callback, { timeout });
}

/**
 * Hook to run effect during idle time
 */
export function useIdleEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  timeout = 1000
): void {
  useEffect(() => {
    let cleanup: void | (() => void);
    const handle = requestIdleCallback(
      () => {
        cleanup = effect();
      },
      { timeout }
    );
    return () => {
      cancelIdleCallback(handle);
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// =============================================================================
// LAZY LOADING UTILITIES
// =============================================================================

/**
 * Preload a module during idle time
 */
export function preloadModule(moduleLoader: () => Promise<unknown>): void {
  whenIdle(() => {
    moduleLoader().catch(() => {
      // Silent fail - module will be loaded on demand anyway
    });
  });
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// =============================================================================
// RENDER OPTIMIZATION
// =============================================================================

/**
 * Measure component render time (development only)
 */
export function measureRender(componentName: string): () => void {
  if (process.env.NODE_ENV !== "development") {
    return () => {};
  }

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) {
      // Longer than one frame (60fps)
      console.warn(
        `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`
      );
    }
  };
}

/**
 * Hook to track and log slow renders
 */
export function useRenderTracking(componentName: string): void {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (renderCount.current > 1 && timeSinceLastRender < 100) {
      console.warn(
        `[Performance] ${componentName} re-rendered rapidly (${timeSinceLastRender.toFixed(
          0
        )}ms since last render, total: ${renderCount.current} renders)`
      );
    }
  });
}

// =============================================================================
// MEMORY OPTIMIZATION
// =============================================================================

/**
 * Check if the device has limited memory
 */
export function isLowMemoryDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  // @ts-expect-error - deviceMemory is not in all TypeScript definitions
  const deviceMemory = navigator.deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return true;
  }

  // hardwareConcurrency is standard but check availability
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) {
    return true;
  }

  return false;
}

/**
 * Get recommended batch size based on device capabilities
 */
export function getRecommendedBatchSize(): number {
  if (isLowMemoryDevice()) {
    return 25;
  }
  return 100;
}

// =============================================================================
// INTERSECTION OBSERVER UTILITIES
// =============================================================================

/**
 * Hook for lazy loading elements when they enter viewport
 */
export function useInView(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(([entry]) => {
        setIsInView(entry.isIntersecting);
      }, options);

      observerRef.current.observe(node);
    },
    [options.root, options.rootMargin, options.threshold]
  );

  return [ref, isInView];
}

// Need to import useState for useInView
import { useState } from "react";

// =============================================================================
// NETWORK UTILITIES
// =============================================================================

/**
 * Check if user is on a slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;

  // Network Information API - cast to any for cross-browser support
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
    mozConnection?: { effectiveType?: string };
    webkitConnection?: { effectiveType?: string };
  };

  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return false;

  const slowTypes = ["slow-2g", "2g", "3g"];
  return slowTypes.includes(connection.effectiveType || "");
}

/**
 * Check if user has enabled data saver
 */
export function isDataSaverEnabled(): boolean {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  return nav.connection?.saveData === true;
}

// =============================================================================
// BUNDLE SIZE HELPERS
// =============================================================================

/**
 * Dynamically import heavy libraries only when needed
 */
export const lazyImports = {
  // Three.js (only for 3D views)
  three: () => import("three"),

  // React Three Fiber
  reactThreeFiber: () => import("@react-three/fiber"),

  // Charts (only for dashboard)
  // recharts: () => import("recharts"),
};

/**
 * Feature flags for optional heavy features
 */
export const performanceFeatures = {
  enable3D: () => !isLowMemoryDevice() && !isSlowConnection(),
  enableAnimations: () => !isSlowConnection() && !isDataSaverEnabled(),
  enablePrefetch: () => !isSlowConnection(),
};
