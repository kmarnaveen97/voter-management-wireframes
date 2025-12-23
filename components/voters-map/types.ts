// Types for Voters Map components
import type {
  MapHouseData,
  MapFamilyMember,
  MapFamilySentiment,
} from "@/lib/api";

// Ward data for map visualization
export interface WardData {
  ward_no: string;
  total_voters: number;
  support_count: number;
  oppose_count: number;
  swing_count: number;
  win_margin_percent: number;
  status: "safe" | "battleground" | "lost";
  center: { x: number; y: number };
}

// Extended house data with UI-specific fields
export type HouseData = MapHouseData & {
  sentiment: "support" | "oppose" | "swing" | "neutral" | "unknown";
  position: { x: number; y: number };
};

// Extended family member with UI-specific fields
export type FamilyMember = MapFamilyMember & {
  sentiment: "support" | "oppose" | "swing" | "neutral" | "unknown";
  position?: { x: number; y: number };
};

// Extended family sentiment with UI-specific fields
export type FamilySentiment = Omit<
  MapFamilySentiment,
  "members" | "dominant_sentiment"
> & {
  dominant_sentiment: string;
  members: FamilyMember[];
};

// Overview statistics for the map
export interface OverviewStats {
  total_voters: number;
  sentiment_breakdown: {
    support: number;
    oppose: number;
    swing: number;
    unknown: number;
  };
  ward_status: {
    safe: number;
    battleground: number;
    lost: number;
  };
  win_projection: {
    support: number;
    oppose: number;
    margin: number;
    margin_percent: number;
  };
}

// Initialization status
export type InitStatus = {
  sentiments_computed: boolean;
  coords_generated: boolean;
  last_computed_at: string | null;
  total_tagged: number;
  is_ready: boolean;
};

export type InitStep = "idle" | "computing" | "generating" | "done" | "error";
