import { useEffect, useCallback, useRef } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: KeyHandler;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseHotkeysOptions {
  enabled?: boolean;
  enableOnFormTags?: boolean;
  targetElement?: HTMLElement | null;
}

const FORM_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

function matchesModifiers(event: KeyboardEvent, config: KeyConfig): boolean {
  return (
    (!config.ctrl || event.ctrlKey) &&
    (!config.shift || event.shiftKey) &&
    (!config.alt || event.altKey) &&
    (!config.meta || event.metaKey)
  );
}

function matchesKey(event: KeyboardEvent, key: string): boolean {
  const normalizedKey = key.toLowerCase();
  const eventKey = event.key.toLowerCase();

  // Handle special keys
  if (normalizedKey === "escape" || normalizedKey === "esc") {
    return eventKey === "escape";
  }
  if (normalizedKey === "enter" || normalizedKey === "return") {
    return eventKey === "enter";
  }
  if (normalizedKey === "space" || normalizedKey === " ") {
    return eventKey === " " || event.code === "Space";
  }
  if (normalizedKey === "arrowup" || normalizedKey === "up") {
    return eventKey === "arrowup";
  }
  if (normalizedKey === "arrowdown" || normalizedKey === "down") {
    return eventKey === "arrowdown";
  }
  if (normalizedKey === "arrowleft" || normalizedKey === "left") {
    return eventKey === "arrowleft";
  }
  if (normalizedKey === "arrowright" || normalizedKey === "right") {
    return eventKey === "arrowright";
  }

  return eventKey === normalizedKey;
}

/**
 * Hook for handling keyboard shortcuts
 *
 * @example
 * useHotkeys([
 *   { key: "1", handler: () => tagVoter("support") },
 *   { key: "2", handler: () => tagVoter("oppose") },
 *   { key: "escape", handler: () => clearSelection() },
 *   { key: "k", ctrl: true, handler: () => openCommandPalette() },
 * ]);
 */
export function useHotkeys(
  shortcuts: KeyConfig[],
  options: UseHotkeysOptions = {}
) {
  const { enabled = true, enableOnFormTags = false, targetElement } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if focused on form element (unless explicitly enabled)
      if (!enableOnFormTags) {
        const target = event.target as HTMLElement;
        if (FORM_TAGS.includes(target.tagName)) {
          return;
        }
        // Also check contentEditable
        if (target.isContentEditable) {
          return;
        }
      }

      for (const config of shortcutsRef.current) {
        if (config.enabled === false) continue;

        if (matchesKey(event, config.key) && matchesModifiers(event, config)) {
          if (config.preventDefault !== false) {
            event.preventDefault();
          }
          config.handler(event);
          return;
        }
      }
    },
    [enabled, enableOnFormTags]
  );

  useEffect(() => {
    const element = targetElement ?? document;
    element.addEventListener("keydown", handleKeyDown as EventListener);
    return () => {
      element.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [handleKeyDown, targetElement]);
}

/**
 * Hook for single key shortcut
 */
export function useHotkey(
  key: string,
  handler: KeyHandler,
  options: Omit<KeyConfig, "key" | "handler"> & UseHotkeysOptions = {}
) {
  const { enabled, enableOnFormTags, targetElement, ...keyOptions } = options;

  useHotkeys([{ key, handler, ...keyOptions }], {
    enabled,
    enableOnFormTags,
    targetElement,
  });
}

/**
 * Common keyboard shortcut configurations
 */
export const SHORTCUTS = {
  // Sentiment tagging (vim-style with numbers)
  TAG_SUPPORT: { key: "1", description: "Tag as Support" },
  TAG_OPPOSE: { key: "2", description: "Tag as Oppose" },
  TAG_SWING: { key: "3", description: "Tag as Swing" },
  TAG_NEUTRAL: { key: "4", description: "Tag as Neutral" },
  CLEAR_TAG: { key: "0", description: "Clear tag" },

  // Navigation
  NEXT_ITEM: { key: "j", description: "Next item" },
  PREV_ITEM: { key: "k", description: "Previous item" },
  FIRST_ITEM: { key: "g", shift: true, description: "Go to first" },
  LAST_ITEM: { key: "G", shift: true, description: "Go to last" },

  // Selection
  SELECT_ITEM: { key: "x", description: "Toggle selection" },
  SELECT_ALL: { key: "a", ctrl: true, description: "Select all" },
  DESELECT_ALL: { key: "escape", description: "Clear selection" },

  // Search
  SEARCH: { key: "/", description: "Focus search" },
  SEARCH_ALT: { key: "k", ctrl: true, description: "Open search" },

  // Actions
  OPEN: { key: "enter", description: "Open item" },
  EDIT: { key: "e", description: "Edit" },
  DELETE: { key: "d", description: "Delete" },
  REFRESH: { key: "r", ctrl: true, description: "Refresh" },

  // Panels
  TOGGLE_SIDEBAR: { key: "b", ctrl: true, description: "Toggle sidebar" },
  TOGGLE_DETAILS: { key: "i", description: "Toggle details" },

  // Help
  HELP: { key: "?", shift: true, description: "Show shortcuts" },
} as const;
