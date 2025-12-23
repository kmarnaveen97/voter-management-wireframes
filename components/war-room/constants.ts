import type { SentimentType } from "@/lib/api";

// Fierce Tactical War Room color palette (Dark, Tactical, Energetic, Cutthroat)
export const SENTIMENT_COLORS = {
  support: { bg: "#059669", text: "#065f46", light: "#d1fae5" }, // Tactical green (military)
  oppose: { bg: "#b91c1c", text: "#7f1d1d", light: "#fee2e2" }, // Blood red (fierce)
  swing: { bg: "#f59e0b", text: "#b45309", light: "#fef3c3" }, // Alert amber (high energy)
  unknown: { bg: "#475569", text: "#1e293b", light: "#f1f5f9" }, // Dark slate (tactical)
  neutral: { bg: "#0891b2", text: "#0e7490", light: "#cffafe" }, // Cyan edge (competitive)
} as const;

export const WARD_STATUS_COLORS = {
  safe: { fill: "#10b981", stroke: "#059669", label: "Safe Zone" }, // Victory green
  battleground: { fill: "#f59e0b", stroke: "#d97706", label: "Battleground" }, // Combat amber
  lost: { fill: "#dc2626", stroke: "#b91c1c", label: "Lost Zone" }, // Danger red
} as const;

// Keyboard shortcut keys
export const KEYBOARD_SHORTCUTS: Record<string, SentimentType | null> = {
  "1": "support",
  "2": "oppose",
  "3": "swing",
  "4": "unknown",
  Escape: null,
} as const;

export type SentimentColorKey = keyof typeof SENTIMENT_COLORS;
export type WardStatusKey = keyof typeof WARD_STATUS_COLORS;
