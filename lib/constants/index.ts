import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Minus,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Sentiment Configuration
// ============================================================================

/**
 * All possible sentiment values (including display-only values)
 * Note: "unknown" is for display/computed values only - do NOT send to API
 */
export type SentimentType =
  | "support"
  | "oppose"
  | "swing"
  | "unknown"
  | "neutral";

/**
 * Valid sentiment values that can be sent to the backend API
 * Backend only accepts: support, oppose, swing, neutral
 */
export type TaggableSentiment = Exclude<SentimentType, "unknown">;

export interface SentimentConfig {
  label: string;
  color: string;
  bgColor: string;
  lightBg: string;
  textColor: string;
  emissive: string;
  icon: LucideIcon;
  shortcut: string;
}

export const SENTIMENT_CONFIG: Record<SentimentType, SentimentConfig> = {
  support: {
    label: "Support",
    color: "#22c55e",
    bgColor: "bg-green-500",
    lightBg: "bg-green-100 dark:bg-green-900/40",
    textColor: "text-green-700 dark:text-green-300",
    emissive: "#166534",
    icon: CheckCircle2,
    shortcut: "1",
  },
  oppose: {
    label: "Oppose",
    color: "#ef4444",
    bgColor: "bg-red-500",
    lightBg: "bg-red-100 dark:bg-red-900/40",
    textColor: "text-red-700 dark:text-red-300",
    emissive: "#991b1b",
    icon: XCircle,
    shortcut: "2",
  },
  swing: {
    label: "Swing",
    color: "#f59e0b",
    bgColor: "bg-yellow-500",
    lightBg: "bg-yellow-100 dark:bg-yellow-900/40",
    textColor: "text-yellow-700 dark:text-yellow-300",
    emissive: "#b45309",
    icon: AlertTriangle,
    shortcut: "3",
  },
  neutral: {
    label: "Neutral",
    color: "#06b6d4",
    bgColor: "bg-cyan-500",
    lightBg: "bg-cyan-100 dark:bg-cyan-900/40",
    textColor: "text-cyan-700 dark:text-cyan-300",
    emissive: "#0e7490",
    icon: Minus,
    shortcut: "4",
  },
  unknown: {
    label: "Unknown",
    color: "#6b7280",
    bgColor: "bg-gray-500",
    lightBg: "bg-gray-100 dark:bg-gray-800/40",
    textColor: "text-gray-700 dark:text-gray-300",
    emissive: "#374151",
    icon: HelpCircle,
    shortcut: "0",
  },
} as const;

// War Room specific color variants (tactical theme)
export const SENTIMENT_WAR_ROOM_COLORS = {
  support: { bg: "#059669", text: "#065f46", light: "#d1fae5" },
  oppose: { bg: "#b91c1c", text: "#7f1d1d", light: "#fee2e2" },
  swing: { bg: "#f59e0b", text: "#b45309", light: "#fef3c3" },
  unknown: { bg: "#475569", text: "#1e293b", light: "#f1f5f9" },
  neutral: { bg: "#0891b2", text: "#0e7490", light: "#cffafe" },
} as const;

// Ward status for war room
export const WARD_STATUS_COLORS = {
  safe: { fill: "#10b981", stroke: "#059669", label: "Safe Zone" },
  battleground: { fill: "#f59e0b", stroke: "#d97706", label: "Battleground" },
  lost: { fill: "#dc2626", stroke: "#b91c1c", label: "Lost Zone" },
} as const;

export type WardStatus = keyof typeof WARD_STATUS_COLORS;

// ============================================================================
// Turnout Configuration
// ============================================================================

export type TurnoutStatus =
  | "will_vote"
  | "wont_vote"
  | "unsure"
  | "not_home"
  | "already_voted"
  | "needs_transport"
  | "migrated"
  | "deceased"
  | "invalid";

export interface TurnoutConfig {
  label: string;
  color: string;
  bgColor: string;
  shortcut?: string;
}

export const TURNOUT_CONFIG: Record<TurnoutStatus, TurnoutConfig> = {
  will_vote: {
    label: "Will Vote",
    color: "#22c55e",
    bgColor:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    shortcut: "1",
  },
  wont_vote: {
    label: "Won't Vote",
    color: "#ef4444",
    bgColor: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    shortcut: "2",
  },
  unsure: {
    label: "Unsure",
    color: "#f59e0b",
    bgColor:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    shortcut: "3",
  },
  not_home: {
    label: "Not Home",
    color: "#6b7280",
    bgColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    shortcut: "4",
  },
  already_voted: {
    label: "Already Voted",
    color: "#3b82f6",
    bgColor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    shortcut: "5",
  },
  needs_transport: {
    label: "Needs Transport",
    color: "#8b5cf6",
    bgColor:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  migrated: {
    label: "Migrated",
    color: "#ec4899",
    bgColor: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },
  deceased: {
    label: "Deceased",
    color: "#1f2937",
    bgColor: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  },
  invalid: {
    label: "Invalid",
    color: "#dc2626",
    bgColor: "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
  },
} as const;

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const SENTIMENT_SHORTCUTS: Record<string, SentimentType> = {
  "1": "support",
  "2": "oppose",
  "3": "swing",
  "4": "neutral",
} as const;

export const TURNOUT_SHORTCUTS: Record<string, TurnoutStatus> = {
  "1": "will_vote",
  "2": "wont_vote",
  "3": "unsure",
  "4": "not_home",
  "5": "already_voted",
} as const;

// ============================================================================
// Pagination Constants
// ============================================================================

export const DEFAULT_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500] as const;

// ============================================================================
// Helper Functions
// ============================================================================

export function getSentimentConfig(sentiment?: string): SentimentConfig {
  return (
    SENTIMENT_CONFIG[sentiment as SentimentType] || SENTIMENT_CONFIG.unknown
  );
}

export function getTurnoutConfig(status?: string): TurnoutConfig {
  return TURNOUT_CONFIG[status as TurnoutStatus] || TURNOUT_CONFIG.unsure;
}

export function getDominantSentiment(
  support: number = 0,
  oppose: number = 0,
  swing: number = 0
): SentimentType {
  if (support > oppose && support > swing) return "support";
  if (oppose > support && oppose > swing) return "oppose";
  if (swing > support && swing > oppose) return "swing";
  return "unknown";
}

export function calculateWinMargin(
  support: number,
  oppose: number,
  total: number
): number {
  if (total === 0) return 0;
  return ((support - oppose) / total) * 100;
}

export function getWardStatus(winMarginPercent: number): WardStatus {
  if (winMarginPercent > 10) return "safe";
  if (winMarginPercent < -10) return "lost";
  return "battleground";
}
