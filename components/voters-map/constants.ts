// Constants for Voters Map visualization

// Sentiment colors
export const SENTIMENT_COLORS = {
  support: "#22c55e",
  oppose: "#ef4444",
  swing: "#eab308",
  neutral: "#6b7280",
  unknown: "#d1d5db",
} as const;

// Political campaign color semantics:
// Green = "Go" / Safe / Us
// Red = "Stop" / Danger / Them
// Yellow = "Caution" / Opportunity / "Work Here"
export const WARD_STATUS_COLORS = {
  safe: "#22c55e", // Deep green - dominating (>15% lead)
  leaning: "#86efac", // Light green - leading slightly
  battleground: "#eab308", // Yellow - statistical tie
  contested: "#fca5a5", // Light red - trailing
  lost: "#ef4444", // Red - losing badly
} as const;

export const SENTIMENT_LABELS = {
  support: "Support",
  oppose: "Oppose",
  swing: "Swing",
  neutral: "Neutral",
  unknown: "Unknown",
} as const;
