/**
 * Strategy Engine API Client
 *
 * Integrates with POST /api/strategy/query endpoint
 * for electoral analysis commands.
 */

import { api } from "@/lib/api";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SentimentType =
  | "support"
  | "oppose"
  | "swing"
  | "neutral"
  | "unknown";
export type BoothStatus = "green" | "yellow" | "red";
export type TurnoutStatus = "voted" | "not_voted" | "pending";

export interface SentimentBreakdown {
  support: number;
  oppose: number;
  swing: number;
  neutral: number;
  unknown: number;
}

export interface SentimentWithPct {
  count: number;
  pct: number;
}

export interface CasteBreakdown {
  caste: string;
  count: number;
  support_pct: number;
}

export interface GenderBreakdown {
  male: number;
  female: number;
}

export interface AgeBands {
  "18-29": number;
  "30-44": number;
  "45-59": number;
  "60+": number;
}

export interface BoothSummary {
  booth_no: string;
  voters: number;
  support_pct: number;
  status?: BoothStatus;
}

export interface FamilySummary {
  family_id: string;
  members: number;
  sentiment: string;
  head_name?: string;
  influence_score?: number;
}

export interface Recommendation {
  priority: number;
  action: string;
  target?: number;
  export_ready?: boolean;
}

// ============================================================
// COMMAND RESPONSE TYPES
// ============================================================

export interface StrategyResponse<T = unknown> {
  success: boolean;
  command: string;
  params: Record<string, string>;
  data: T;
  analysis: Record<string, unknown>;
  recommendations: Recommendation[];
  generated_at: string;
}

export interface StrategyErrorResponse {
  success: false;
  error: string;
  message: string;
  code: string;
}

// Ward Command Response
export interface WardData {
  total_voters: number;
  sentiment: SentimentBreakdown;
  caste_breakdown: CasteBreakdown[];
  gender: GenderBreakdown;
  age_bands: AgeBands;
  booths: BoothSummary[];
  top_families: FamilySummary[];
}

export interface WardAnalysis {
  strength_score: number;
  sentiment_health: "strong" | "moderate" | "weak";
  swing_potential: number;
  risk_factors: string[];
}

export type WardResponse = StrategyResponse<WardData> & {
  analysis: WardAnalysis;
};

// Booth Command Response
export interface BoothData {
  booth_no: string;
  ps_code: string;
  ps_name: string;
  total_voters: number;
  sentiment: SentimentBreakdown;
  families: FamilySummary[];
  caste_breakdown: CasteBreakdown[];
}

export interface BoothAnalysis {
  status: BoothStatus;
  swing_count: number;
  unknown_count: number;
  mobilization_difficulty: "low" | "medium" | "high";
  key_families: number;
}

export type BoothResponse = StrategyResponse<BoothData> & {
  analysis: BoothAnalysis;
};

// Family Command Response
export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  sentiment: SentimentType;
  age: number;
  phone?: string;
}

export interface FamilyData {
  family_id: string;
  head: {
    id: number;
    name: string;
    age: number;
    phone?: string;
  };
  members: FamilyMember[];
  address: string;
  booth_no: string;
  ward_no: string;
}

export interface FamilyAnalysis {
  influence_score: number;
  family_sentiment:
    | "support"
    | "oppose"
    | "leaning_support"
    | "leaning_oppose"
    | "mixed"
    | "unknown";
  conversion_potential: "high" | "medium" | "low";
  outreach_approach: string;
}

export type FamilyResponse = StrategyResponse<FamilyData> & {
  analysis: FamilyAnalysis;
};

// Swing Command Response
export interface SwingVoter {
  id: number;
  name: string;
  age: number;
  phone?: string;
  family_id: string;
  family_size: number;
  influence_score: number;
  booth_no: string;
  ward_no: string;
  address: string;
}

export interface SwingData {
  total_swing: number;
  top_targets: SwingVoter[];
}

export interface SwingAnalysis {
  high_value_targets: number;
  medium_value: number;
  low_value: number;
}

export type SwingResponse = StrategyResponse<SwingData> & {
  analysis: SwingAnalysis;
};

// Sentiment Command Response
export interface SentimentData {
  global: {
    total: number;
    support: SentimentWithPct;
    oppose: SentimentWithPct;
    swing: SentimentWithPct;
    neutral: SentimentWithPct;
    unknown: SentimentWithPct;
  };
  by_ward: Array<{
    ward_no: string;
    support_pct: number;
    swing_pct: number;
    oppose_pct: number;
    status: BoothStatus;
  }>;
}

export interface SentimentAnalysis {
  campaign_health_score: number;
  momentum: "positive" | "negative" | "stable";
  wards_needing_focus: string[];
  strong_wards: string[];
}

export type SentimentResponse = StrategyResponse<SentimentData> & {
  analysis: SentimentAnalysis;
};

// Turnout Predict Response
export interface TurnoutData {
  ward_no: string;
  total_voters: number;
  predicted_turnout_pct: number;
  predicted_votes: number;
  by_booth: Array<{
    booth_no: string;
    predicted_pct: number;
    risk: "low" | "medium" | "high";
  }>;
  seniors_needing_transport: number;
  supporters_to_mobilize: number;
}

export interface TurnoutAnalysis {
  expected_turnout: string;
  risk_booths: string[];
  mobilization_gap: number;
}

export type TurnoutResponse = StrategyResponse<TurnoutData> & {
  analysis: TurnoutAnalysis;
};

// D-Day Response
export interface DDayData {
  timestamp: string;
  overall: {
    total: number;
    voted: number;
    turnout_pct: number;
  };
  by_booth: Array<{
    booth_no: string;
    total: number;
    voted: number;
    pct: number;
    status: "on_track" | "lagging" | "critical";
  }>;
  hourly_trend: Array<{
    hour: number;
    votes: number;
  }>;
}

export interface DDayAnalysis {
  lagging_booths: string[];
  priority_calls: number;
  hours_remaining: number;
}

export type DDayResponse = StrategyResponse<DDayData> & {
  analysis: DDayAnalysis;
};

// Compare Response
export interface CompareData {
  list_a: { id: number; name: string };
  list_b: { id: number; name: string };
  additions: number;
  deletions: number;
  changed: number;
  ward_shifts: Array<{
    ward_no: string;
    net_change: number;
  }>;
}

export interface CompareAnalysis {
  net_voter_delta: number;
  significant_shifts: string[];
  strategic_meaning: string;
}

export type CompareResponse = StrategyResponse<CompareData> & {
  analysis: CompareAnalysis;
};

// Message Response
export interface MessageData {
  messages: {
    whatsapp: Array<{ language: string; text: string }>;
    door_to_door: string[];
    sms?: string[];
  };
  target_audience: {
    segment: string;
    count: number;
    sentiment_mix: {
      support: number;
      swing: number;
      oppose: number;
    };
  };
}

export type MessageResponse = StrategyResponse<MessageData>;

// ============================================================
// COMMAND TYPES
// ============================================================

export type StrategyCommand =
  | "ward"
  | "booth"
  | "family"
  | "swing"
  | "sentiment"
  | "turnout"
  | "dday"
  | "compare"
  | "message"
  | "warroom"
  | "export";

export interface ParsedCommand {
  command: StrategyCommand;
  params: string[];
  raw: string;
}

// ============================================================
// API CLIENT
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

export interface StrategyQueryRequest {
  command: string;
  list_id?: number;
}

/**
 * Execute a strategy command
 */
export async function executeStrategyCommand<T = unknown>(
  command: string,
  listId?: number
): Promise<StrategyResponse<T> | StrategyErrorResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/strategy/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command,
        list_id: listId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: "Network Error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to connect to strategy API",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Parse a command string into structured format
 */
export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0]?.toLowerCase() as StrategyCommand;
  const params = parts.slice(1);

  const validCommands: StrategyCommand[] = [
    "ward",
    "booth",
    "family",
    "swing",
    "sentiment",
    "turnout",
    "dday",
    "compare",
    "message",
    "warroom",
    "export",
  ];

  if (!validCommands.includes(command)) {
    return null;
  }

  return {
    command,
    params,
    raw: trimmed,
  };
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(
  input: string
): Array<{ command: string; description: string }> {
  const commands = [
    {
      command: "/ward [ward_no]",
      description: "Analyze ward demographics, sentiment, families",
    },
    {
      command: "/booth [booth_no]",
      description: "Booth-level analysis and voter breakdown",
    },
    {
      command: "/family [family_id]",
      description: "Family influence analysis and outreach strategy",
    },
    {
      command: "/swing [ward|booth] [no]",
      description: "List swing voters ranked by influence",
    },
    {
      command: "/sentiment report",
      description: "Global campaign health and sentiment trends",
    },
    {
      command: "/turnout predict [ward]",
      description: "Turnout forecast and mobilization needs",
    },
    { command: "/dday", description: "Election day real-time monitoring" },
    {
      command: "/compare [list_a] [list_b]",
      description: "Compare voter lists for changes",
    },
    {
      command: "/message [type] [param]",
      description: "Generate outreach message templates",
    },
    {
      command: "/warroom status",
      description: "Overall campaign status and priorities",
    },
    {
      command: "/warroom alert",
      description: "Critical alerts needing attention",
    },
  ];

  if (!input) return commands;

  const lower = input.toLowerCase();
  return commands.filter(
    (c) =>
      c.command.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
  );
}

/**
 * Export endpoints
 */
export const strategyExports = {
  swingVoters: (wardNo?: string, boothNo?: string) => {
    const params = new URLSearchParams({ format: "csv" });
    if (wardNo) params.set("ward_no", wardNo);
    if (boothNo) params.set("booth_no", boothNo);
    return `${API_BASE}/api/strategy/export/swing?${params}`;
  },

  notVoted: () => `${API_BASE}/api/strategy/export/notvoted?format=csv`,

  boothReport: (boothNo: string, format: "csv" | "pdf" | "json" = "pdf") =>
    `${API_BASE}/api/strategy/export/booth?booth_no=${boothNo}&format=${format}`,

  wardReport: (wardNo: string, format: "csv" | "pdf" | "json" = "pdf") =>
    `${API_BASE}/api/strategy/export/ward?ward_no=${wardNo}&format=${format}`,
};

/**
 * Check if response is an error
 */
export function isStrategyError(
  response: StrategyResponse | StrategyErrorResponse
): response is StrategyErrorResponse {
  return !response.success;
}
