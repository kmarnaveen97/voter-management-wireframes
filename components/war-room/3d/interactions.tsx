"use client";

import { useEffect, useCallback, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================================================
// Keyboard Shortcut Handler
// ============================================================================

export interface KeyboardShortcuts {
  /** Reset camera to default position */
  resetCamera?: () => void;
  /** Toggle labels visibility */
  toggleLabels?: () => void;
  /** Toggle performance stats */
  toggleStats?: () => void;
  /** Navigate to next item */
  nextItem?: () => void;
  /** Navigate to previous item */
  prevItem?: () => void;
  /** Select current item */
  selectItem?: () => void;
  /** Go back (escape) */
  goBack?: () => void;
  /** Toggle fullscreen */
  toggleFullscreen?: () => void;
  /** Zoom in */
  zoomIn?: () => void;
  /** Zoom out */
  zoomOut?: () => void;
}

const DEFAULT_KEY_MAP: Record<string, keyof KeyboardShortcuts> = {
  r: "resetCamera",
  l: "toggleLabels",
  p: "toggleStats",
  ArrowRight: "nextItem",
  ArrowDown: "nextItem",
  ArrowLeft: "prevItem",
  ArrowUp: "prevItem",
  Enter: "selectItem",
  " ": "selectItem", // Space
  Escape: "goBack",
  f: "toggleFullscreen",
  "+": "zoomIn",
  "=": "zoomIn",
  "-": "zoomOut",
  _: "zoomOut",
};

/**
 * Hook to handle keyboard shortcuts for 3D scene navigation
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const action = DEFAULT_KEY_MAP[event.key];
      if (action && shortcuts[action]) {
        event.preventDefault();
        shortcuts[action]?.();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// ============================================================================
// Touch Gesture Handler
// ============================================================================

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  startTime: number;
  lastX: number;
  lastY: number;
  touches: number;
}

export interface TouchGestures {
  /** Single tap */
  onTap?: (x: number, y: number) => void;
  /** Double tap */
  onDoubleTap?: (x: number, y: number) => void;
  /** Long press */
  onLongPress?: (x: number, y: number) => void;
  /** Swipe left */
  onSwipeLeft?: () => void;
  /** Swipe right */
  onSwipeRight?: () => void;
  /** Swipe up */
  onSwipeUp?: () => void;
  /** Swipe down */
  onSwipeDown?: () => void;
  /** Pinch zoom */
  onPinch?: (scale: number) => void;
  /** Two-finger pan */
  onTwoFingerPan?: (deltaX: number, deltaY: number) => void;
}

const SWIPE_THRESHOLD = 50; // pixels
const SWIPE_VELOCITY_THRESHOLD = 0.3; // pixels per ms
const LONG_PRESS_DURATION = 500; // ms
const DOUBLE_TAP_DURATION = 300; // ms
const TAP_MOVE_THRESHOLD = 10; // pixels

/**
 * Hook to handle touch gestures for mobile 3D navigation
 */
export function useTouchGestures(
  containerRef: React.RefObject<HTMLElement>,
  gestures: TouchGestures,
  enabled: boolean = true
) {
  const touchState = useRef<TouchState | null>(null);
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback(
    (touches: TouchList): { x: number; y: number } => {
      if (touches.length === 0) return { x: 0, y: 0 };
      if (touches.length === 1) {
        return { x: touches[0].clientX, y: touches[0].clientY };
      }
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    },
    []
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touches = event.touches;
      const center = getCenter(touches);

      touchState.current = {
        startX: center.x,
        startY: center.y,
        startDistance: getDistance(touches),
        startTime: Date.now(),
        lastX: center.x,
        lastY: center.y,
        touches: touches.length,
      };

      // Set up long press detection for single touch
      if (touches.length === 1) {
        clearLongPressTimer();
        longPressTimer.current = setTimeout(() => {
          if (touchState.current && touchState.current.touches === 1) {
            const moveDistance = Math.sqrt(
              Math.pow(
                touchState.current.lastX - touchState.current.startX,
                2
              ) +
                Math.pow(
                  touchState.current.lastY - touchState.current.startY,
                  2
                )
            );
            if (moveDistance < TAP_MOVE_THRESHOLD) {
              gestures.onLongPress?.(center.x, center.y);
            }
          }
        }, LONG_PRESS_DURATION);
      }
    },
    [enabled, gestures, getCenter, getDistance, clearLongPressTimer]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !touchState.current) return;

      const touches = event.touches;
      const center = getCenter(touches);

      // Clear long press on movement
      clearLongPressTimer();

      // Handle pinch zoom
      if (touches.length === 2 && touchState.current.startDistance > 0) {
        const currentDistance = getDistance(touches);
        const scale = currentDistance / touchState.current.startDistance;
        gestures.onPinch?.(scale);
      }

      // Handle two-finger pan
      if (touches.length === 2) {
        const deltaX = center.x - touchState.current.lastX;
        const deltaY = center.y - touchState.current.lastY;
        gestures.onTwoFingerPan?.(deltaX, deltaY);
      }

      touchState.current.lastX = center.x;
      touchState.current.lastY = center.y;
      touchState.current.touches = touches.length;
    },
    [enabled, gestures, getCenter, getDistance, clearLongPressTimer]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !touchState.current) return;

      clearLongPressTimer();

      const state = touchState.current;
      const endTime = Date.now();
      const duration = endTime - state.startTime;
      const deltaX = state.lastX - state.startX;
      const deltaY = state.lastY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      // Only process gestures for single touch that ended
      if (state.touches === 1 && event.touches.length === 0) {
        // Check for swipe
        if (distance > SWIPE_THRESHOLD && velocity > SWIPE_VELOCITY_THRESHOLD) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
              gestures.onSwipeRight?.();
            } else {
              gestures.onSwipeLeft?.();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0) {
              gestures.onSwipeDown?.();
            } else {
              gestures.onSwipeUp?.();
            }
          }
        } else if (distance < TAP_MOVE_THRESHOLD && duration < 300) {
          // Check for tap / double tap
          const timeSinceLastTap = endTime - lastTapTime.current;

          if (timeSinceLastTap < DOUBLE_TAP_DURATION) {
            gestures.onDoubleTap?.(state.lastX, state.lastY);
            lastTapTime.current = 0; // Reset to prevent triple-tap
          } else {
            gestures.onTap?.(state.lastX, state.lastY);
            lastTapTime.current = endTime;
          }
        }
      }

      touchState.current = null;
    },
    [enabled, gestures, clearLongPressTimer]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
    });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      clearLongPressTimer();
    };
  }, [
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearLongPressTimer,
  ]);
}

// ============================================================================
// Camera Animation Hook
// ============================================================================

interface CameraAnimationOptions {
  /** Duration in seconds */
  duration?: number;
  /** Easing function */
  easing?: (t: number) => number;
}

// Easing functions
export const Easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

/**
 * Hook to animate camera to a target position
 */
export function useCameraAnimation() {
  const { camera } = useThree();
  const animationRef = useRef<{
    startPosition: THREE.Vector3;
    endPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
    easing: (t: number) => number;
    controls?: any;
  } | null>(null);

  const animateTo = useCallback(
    (
      position: THREE.Vector3 | [number, number, number],
      target: THREE.Vector3 | [number, number, number],
      controls?: any,
      options: CameraAnimationOptions = {}
    ) => {
      const { duration = 1.0, easing = Easings.easeOutCubic } = options;

      const endPos = Array.isArray(position)
        ? new THREE.Vector3(...position)
        : position;
      const endTarget = Array.isArray(target)
        ? new THREE.Vector3(...target)
        : target;

      animationRef.current = {
        startPosition: camera.position.clone(),
        endPosition: endPos,
        startTarget: controls?.target?.clone() || new THREE.Vector3(),
        endTarget: endTarget,
        startTime: performance.now(),
        duration: duration * 1000,
        easing,
        controls,
      };
    },
    [camera]
  );

  const update = useCallback(() => {
    if (!animationRef.current) return false;

    const anim = animationRef.current;
    const elapsed = performance.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    const easedProgress = anim.easing(progress);

    // Interpolate position
    camera.position.lerpVectors(
      anim.startPosition,
      anim.endPosition,
      easedProgress
    );

    // Interpolate target if controls exist
    if (anim.controls?.target) {
      anim.controls.target.lerpVectors(
        anim.startTarget,
        anim.endTarget,
        easedProgress
      );
      anim.controls.update();
    }

    // Check if animation complete
    if (progress >= 1) {
      animationRef.current = null;
      return false;
    }

    return true;
  }, [camera]);

  const cancel = useCallback(() => {
    animationRef.current = null;
  }, []);

  return { animateTo, update, cancel, isAnimating: !!animationRef.current };
}

// ============================================================================
// Focus Management Hook
// ============================================================================

/**
 * Hook to manage focus state for accessibility
 */
export function useFocusManagement<T extends { id: string }>(
  items: T[],
  onSelect: (item: T) => void
) {
  const focusIndex = useRef(0);

  const focusNext = useCallback(() => {
    if (items.length === 0) return;
    focusIndex.current = (focusIndex.current + 1) % items.length;
    return items[focusIndex.current];
  }, [items]);

  const focusPrev = useCallback(() => {
    if (items.length === 0) return;
    focusIndex.current = (focusIndex.current - 1 + items.length) % items.length;
    return items[focusIndex.current];
  }, [items]);

  const selectFocused = useCallback(() => {
    if (items.length === 0) return;
    const item = items[focusIndex.current];
    if (item) {
      onSelect(item);
    }
  }, [items, onSelect]);

  const focusByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length) {
        focusIndex.current = index;
        return items[index];
      }
      return null;
    },
    [items]
  );

  const focusById = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        focusIndex.current = index;
        return items[index];
      }
      return null;
    },
    [items]
  );

  return {
    focusIndex: focusIndex.current,
    focusedItem: items[focusIndex.current] || null,
    focusNext,
    focusPrev,
    selectFocused,
    focusByIndex,
    focusById,
  };
}
