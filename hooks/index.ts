/**
 * Hooks Index
 *
 * Central export point for all React Query hooks.
 *
 * Usage:
 *   import { useVoters, useCasteSummary, useHealthCheck } from "@/hooks";
 */

// Core data hooks
export * from "./use-queries";

// War Room hooks
export * from "./use-war-room";

// Polling station hooks
export * from "./use-polling-stations";

// Caste detection hooks
export * from "./use-caste";

// Election symbols hooks
export * from "./use-symbols";

// Map visualization hooks
export * from "./use-map";

// Campaign users hooks
export * from "./use-users";

// System & health hooks
export * from "./use-system";

// Upload & extraction hooks
export * from "./use-upload";

// Sentiment history hooks
export * from "./use-history";

// Utility hooks
export * from "./use-debounce";
export * from "./use-mobile";
export * from "./use-toast";
export * from "./use-infinite-scroll";
export * from "./use-hotkeys";
