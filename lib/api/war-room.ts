/**
 * War Room API Module
 *
 * All war room, sentiment, and geographic visualization related API calls
 */

import { apiFetch, buildQueryString, type Sentiment, type SentimentCounts } from "./client";
import type { Voter } from "./voters";

// =============================================================================
// TYPES
// =============================================================================

export interface WardMapSummary {
  ward_no: string;
  ward_name?: string;
  total_voters: number;
  support_count: number;
  oppose_count: number;
  swing_count: number;
  neutral_count: number;
  unknown_count: number;
  support_percent: number;
  net_margin: number;
  net_margin_percent: number;
  dominant_sentiment: SentimentType;
  color_code?: string;
  coordinates?: { lat: number; lng: number };
}

export interface HousePosition {
  house_id: number;
  house_no: string;
  address?: string;
  latitude: number;
  longitude: number;
  ward_no?: string;
  booth_code?: string;
  voter_count: number;
  sentiment_counts: SentimentCounts;
  dominant_sentiment: SentimentType;
  families?: {
    family_id: number;
    family_name: string;
    member_count: number;
    dominant_sentiment: SentimentType;
  }[];
}

export interface SentimentOverview {
  total_voters: number;
  tagged_voters: number;
  coverage_percent: number;
  support: number;
  oppose: number;
  swing: number;
  neutral: number;
  unknown: number;
  support_percent: number;
  oppose_percent: number;
  swing_percent: number;
  net_margin: number;
  net_margin_percent: number;
  trend?: {
    period: string;
    support_change: number;
    oppose_change: number;
    swing_change: number;
  };
}

export interface TargetVoter {
  voter_id: number;
  epic_id?: string;
  name: string;
  age?: number;
  gender?: string;
  house_no?: string;
  ward_no?: string;
  booth_code?: string;
  current_sentiment: SentimentType;
  target_sentiment?: SentimentType;
  priority: "high" | "medium" | "low";
  assigned_to?: string;
  notes?: string;
  last_contact?: string;
  family_influence_score?: number;
}

export interface WarRoomStats {
  sentiment: SentimentOverview;
  wards: WardMapSummary[];
  activity?: {
    today_contacts: number;
    conversions: number;
    pending_followups: number;
  };
}

export interface ClusterData {
  cluster_id: string;
  center: { lat: number; lng: number };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  house_count: number;
  voter_count: number;
  sentiment_counts: SentimentCounts;
  dominant_sentiment: SentimentType;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface WarRoomStatsResponse {
  stats: WarRoomStats;
}

export interface WardMapResponse {
  wards: WardMapSummary[];
}

export interface HousePositionsResponse {
  houses: HousePosition[];
  clusters?: ClusterData[];
  meta?: {
    total: number;
    visible: number;
    zoom_level: number;
  };
}

export interface TargetVotersResponse {
  total: number;
  voters: TargetVoter[];
  summary?: {
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
}

// =============================================================================
// API FUNCTIONS - WAR ROOM DASHBOARD
// =============================================================================

/**
 * Get comprehensive war room statistics
 */
export async function getWarRoomStats(listId: number): Promise<WarRoomStats> {
  const response = await apiFetch<{
    data: {
      sentiment: SentimentOverview;
      wards: WardMapSummary[];
      activity?: WarRoomStats["activity"];
    };
  }>(`/api/war-room/stats?list_id=${listId}`);

  return {
    sentiment: response.data.sentiment,
    wards: response.data.wards,
    activity: response.data.activity,
  };
}

/**
 * Get sentiment overview for the entire list
 */
export async function getSentimentOverview(
  listId: number,
  options?: { ward_no?: string; include_trend?: boolean }
): Promise<SentimentOverview> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.include_trend) params.include_trend = "true";

  const response = await apiFetch<{ data: SentimentOverview }>(
    `/api/war-room/sentiment${buildQueryString(params)}`
  );

  return response.data;
}

// =============================================================================
// API FUNCTIONS - GEOGRAPHIC DATA
// =============================================================================

/**
 * Get ward-level sentiment map data
 */
export async function getWardMapData(listId: number): Promise<WardMapSummary[]> {
  const response = await apiFetch<{
    data: { wards: WardMapSummary[] };
  }>(`/api/war-room/wards?list_id=${listId}`);

  return response.data?.wards || [];
}

/**
 * Get house positions for 3D/map visualization
 */
export async function getHousePositions(
  listId: number,
  options?: {
    ward_no?: string;
    booth_code?: string;
    bounds?: { north: number; south: number; east: number; west: number };
    zoom_level?: number;
    cluster?: boolean;
    sentiment_filter?: SentimentType[];
  }
): Promise<HousePositionsResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.booth_code) params.booth_code = options.booth_code;
  if (options?.bounds) params.bounds = JSON.stringify(options.bounds);
  if (options?.zoom_level) params.zoom = options.zoom_level;
  if (options?.cluster) params.cluster = "true";
  if (options?.sentiment_filter) {
    params.sentiments = options.sentiment_filter.join(",");
  }

  const response = await apiFetch<{
    data: {
      houses: HousePosition[];
      clusters?: ClusterData[];
    };
    meta?: { total: number; visible: number; zoom_level: number };
  }>(`/api/war-room/houses${buildQueryString(params)}`);

  return {
    houses: response.data?.houses || [],
    clusters: response.data?.clusters,
    meta: response.meta,
  };
}

/**
 * Get voters for a specific house (for drill-down)
 */
export async function getHouseVoters(
  listId: number,
  houseId: number
): Promise<Voter[]> {
  const response = await apiFetch<{
    data: { voters: Voter[] };
  }>(`/api/war-room/houses/${houseId}/voters?list_id=${listId}`);

  return response.data?.voters || [];
}

// =============================================================================
// API FUNCTIONS - TARGET LISTS
// =============================================================================

/**
 * Get swing voters to target for conversion
 */
export async function getTargetVoters(
  listId: number,
  options?: {
    priority?: "high" | "medium" | "low";
    ward_no?: string;
    assigned_to?: string;
    page?: number;
    per_page?: number;
  }
): Promise<TargetVotersResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.priority) params.priority = options.priority;
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.assigned_to) params.assigned_to = options.assigned_to;
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;

  const response = await apiFetch<{
    data: {
      voters: TargetVoter[];
      summary?: TargetVotersResponse["summary"];
    };
    meta?: { total: number };
  }>(`/api/war-room/targets${buildQueryString(params)}`);

  return {
    total: response.meta?.total || response.data?.voters?.length || 0,
    voters: response.data?.voters || [],
    summary: response.data?.summary,
  };
}

/**
 * Assign target voter to a campaign worker
 */
export async function assignTargetVoter(
  listId: number,
  voterId: number,
  assignee: string,
  notes?: string
): Promise<void> {
  await apiFetch(`/api/war-room/targets/${voterId}/assign`, {
    method: "POST",
    body: JSON.stringify({
      list_id: listId,
      assigned_to: assignee,
      notes,
    }),
  });
}

/**
 * Log a contact/interaction with a target voter
 */
export async function logTargetContact(
  listId: number,
  voterId: number,
  data: {
    contact_type: "phone" | "visit" | "meeting" | "other";
    outcome: "positive" | "negative" | "neutral" | "no_contact";
    new_sentiment?: SentimentType;
    notes?: string;
  }
): Promise<void> {
  await apiFetch(`/api/war-room/targets/${voterId}/contact`, {
    method: "POST",
    body: JSON.stringify({
      list_id: listId,
      ...data,
    }),
  });
}

// =============================================================================
// API FUNCTIONS - REAL-TIME UPDATES
// =============================================================================

/**
 * Get recent sentiment changes (for live war room updates)
 */
export async function getRecentSentimentChanges(
  listId: number,
  options?: {
    since?: string; // ISO timestamp
    limit?: number;
  }
): Promise<{
  voter_id: number;
  name: string;
  old_sentiment: SentimentType;
  new_sentiment: SentimentType;
  changed_at: string;
  changed_by?: string;
}[]> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.since) params.since = options.since;
  if (options?.limit) params.limit = options.limit;

  const response = await apiFetch<{
    data: {
      changes: {
        voter_id: number;
        name: string;
        old_sentiment: SentimentType;
        new_sentiment: SentimentType;
        changed_at: string;
        changed_by?: string;
      }[];
    };
  }>(`/api/war-room/changes${buildQueryString(params)}`);

  return response.data?.changes || [];
}
