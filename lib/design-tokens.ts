/**
 * Design Tokens
 *
 * Centralized design system tokens for consistent UI across the platform.
 * Import these instead of hardcoding values in components.
 */

// =============================================================================
// SPACING SCALE (based on 4px grid)
// =============================================================================
export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

// =============================================================================
// TYPOGRAPHY SCALE
// =============================================================================
export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
    base: ["1rem", { lineHeight: "1.5rem" }], // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

// =============================================================================
// COLOR PALETTE - Semantic tokens
// =============================================================================
export const colors = {
  // Sentiment colors (domain-specific)
  sentiment: {
    support: {
      DEFAULT: "#22c55e",
      light: "#dcfce7",
      dark: "#14532d",
      text: "#15803d",
    },
    oppose: {
      DEFAULT: "#ef4444",
      light: "#fee2e2",
      dark: "#7f1d1d",
      text: "#dc2626",
    },
    swing: {
      DEFAULT: "#f59e0b",
      light: "#fef3c7",
      dark: "#78350f",
      text: "#d97706",
    },
    neutral: {
      DEFAULT: "#6b7280",
      light: "#f3f4f6",
      dark: "#374151",
      text: "#4b5563",
    },
    unknown: {
      DEFAULT: "#94a3b8",
      light: "#f1f5f9",
      dark: "#334155",
      text: "#64748b",
    },
  },

  // Turnout status colors
  turnout: {
    voted: {
      DEFAULT: "#22c55e",
      light: "#dcfce7",
    },
    notVoted: {
      DEFAULT: "#6b7280",
      light: "#f3f4f6",
    },
    pending: {
      DEFAULT: "#f59e0b",
      light: "#fef3c7",
    },
  },

  // Gender colors (for charts)
  gender: {
    male: "#3b82f6",
    female: "#ec4899",
    other: "#8b5cf6",
  },

  // Ward status colors (for heatmaps)
  ward: {
    safe: "#22c55e",
    leaning: "#84cc16",
    competitive: "#f59e0b",
    atRisk: "#f97316",
    lost: "#ef4444",
  },
} as const;

// =============================================================================
// BREAKPOINTS (mobile-first)
// =============================================================================
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// =============================================================================
// Z-INDEX SCALE
// =============================================================================
export const zIndex = {
  dropdown: 50,
  sticky: 40,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 50,
  tooltip: 60,
  toast: 100,
} as const;

// =============================================================================
// ANIMATION TOKENS
// =============================================================================
export const animation = {
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================
export const components = {
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  button: {
    height: {
      sm: "2rem", // 32px
      default: "2.5rem", // 40px
      lg: "2.75rem", // 44px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      default: `${spacing[2]} ${spacing[4]}`,
      lg: `${spacing[2.5]} ${spacing[5]}`,
    },
  },
  input: {
    height: "2.5rem", // 40px
    padding: `${spacing[2]} ${spacing[3]}`,
  },
  sidebar: {
    width: {
      expanded: "16rem", // 256px
      collapsed: "4rem", // 64px
    },
  },
  modal: {
    maxWidth: {
      sm: "24rem", // 384px
      default: "28rem", // 448px
      lg: "32rem", // 512px
      xl: "36rem", // 576px
      full: "calc(100vw - 2rem)",
    },
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sentiment color by key
 */
export function getSentimentColor(
  sentiment: keyof typeof colors.sentiment,
  variant: "DEFAULT" | "light" | "dark" | "text" = "DEFAULT"
): string {
  return (
    colors.sentiment[sentiment]?.[variant] ?? colors.sentiment.unknown[variant]
  );
}

/**
 * Get ward status color
 */
export function getWardStatusColor(status: keyof typeof colors.ward): string {
  return colors.ward[status] ?? colors.ward.competitive;
}

/**
 * Get gender color for charts
 */
export function getGenderColor(gender: "male" | "female" | "other"): string {
  return colors.gender[gender] ?? colors.gender.other;
}
