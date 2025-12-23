// War Room Component Library
// Extracted from the 4000+ line page.tsx for better maintainability

// Constants
export * from "./constants";

// Utilities
export * from "./geo-utils";

// UI Components - Core
export { WarRoomSkeleton } from "./skeleton";
export { StatCard } from "./stat-card";
export { WinProbabilityGauge } from "./win-probability-gauge";
export { SentimentBar } from "./sentiment-bar";
export { FloatingPriorityTargets, TargetList } from "./target-components";

// UI Components - Hover & Dialogs
export { WardHoverCard, HouseDetailsDialog } from "./hover-dialog-components";

// UI Components - Family
export {
  FamilyMemberItem,
  FamilyCard,
  WardFamiliesPanel,
} from "./family-components";
export type { FamilyMember } from "./family-components";

// UI Components - Main Views
export { WardWarRoom } from "./ward-war-room";
export { VillageMap } from "./village-map";
