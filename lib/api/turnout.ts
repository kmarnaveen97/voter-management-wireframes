/**
 * Voter Turnout API Module
 *
 * All turnout marking and tracking related API calls
 */

import { apiFetch, buildQueryString, type TurnoutStatus } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface TurnoutMark {
  voter_id: number;
  turnout_status: TurnoutStatus;
  marked_at?: string;
  marked_by?: string;
  notes?: string;
}

export interface BulkTurnoutMarkRequest {
  voter_ids: number[];
  turnout_status: TurnoutStatus;
  notes?: string;
}

export interface TurnoutSummary {
  total_voters: number;
  voted: number;
  will_vote: number;
  not_voting: number;
  unknown: number;
  voted_percent: number;
  will_vote_percent: number;
  projected_turnout: number;
  projected_turnout_percent: number;
}

export interface WardTurnoutStats {
  ward_no: string;
  ward_name?: string;
  total_voters: number;
  voted: number;
  will_vote: number;
  not_voting: number;
  unknown: number;
  voted_percent: number;
  projected_turnout_percent: number;
}

export interface BoothTurnoutStats {
  booth_id: number;
  booth_code: string;
  booth_name?: string;
  total_voters: number;
  voted: number;
  will_vote: number;
  not_voting: number;
  voted_percent: number;
  projected_turnout_percent: number;
}

export interface HourlyTurnoutData {
  hour: string;
  voted_count: number;
  cumulative_voted: number;
  cumulative_percent: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface TurnoutSummaryResponse {
  summary: TurnoutSummary;
  by_ward?: WardTurnoutStats[];
  by_booth?: BoothTurnoutStats[];
  hourly?: HourlyTurnoutData[];
}

export interface TurnoutMarkResponse {
  success: boolean;
  voter_id: number;
  turnout_status: TurnoutStatus;
  updated_at: string;
}

export interface BulkTurnoutMarkResponse {
  success: boolean;
  updated_count: number;
  failed_count: number;
  failed_ids?: number[];
}

// =============================================================================
// API FUNCTIONS - TURNOUT MARKING
// =============================================================================

/**
 * Mark a single voter's turnout status
 */
export async function markTurnout(
  listId: number,
  voterId: number,
  status: TurnoutStatus,
  notes?: string
): Promise<TurnoutMarkResponse> {
  const response = await apiFetch<{ data: TurnoutMarkResponse }>(
    `/api/voters/${voterId}/turnout`,
    {
      method: "POST",
      body: JSON.stringify({
        list_id: listId,
        turnout_status: status,
        notes,
      }),
    }
  );

  return response.data;
}

/**
 * Bulk mark turnout status for multiple voters
 */
export async function bulkMarkTurnout(
  listId: number,
  voterIds: number[],
  status: TurnoutStatus,
  notes?: string
): Promise<BulkTurnoutMarkResponse> {
  const response = await apiFetch<{ data: BulkTurnoutMarkResponse }>(
    "/api/voters/bulk-turnout",
    {
      method: "POST",
      body: JSON.stringify({
        list_id: listId,
        voter_ids: voterIds,
        turnout_status: status,
        notes,
      }),
    }
  );

  return response.data;
}

/**
 * Clear turnout mark for a voter
 */
export async function clearTurnout(
  listId: number,
  voterId: number
): Promise<void> {
  await apiFetch(`/api/voters/${voterId}/turnout?list_id=${listId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// API FUNCTIONS - TURNOUT STATISTICS
// =============================================================================

/**
 * Get turnout summary for a list
 */
export async function getTurnoutSummary(
  listId: number,
  options?: {
    ward_no?: string;
    booth_id?: number;
    include_wards?: boolean;
    include_booths?: boolean;
    include_hourly?: boolean;
  }
): Promise<TurnoutSummaryResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.booth_id) params.booth_id = options.booth_id;
  if (options?.include_wards) params.include_wards = "true";
  if (options?.include_booths) params.include_booths = "true";
  if (options?.include_hourly) params.include_hourly = "true";

  const response = await apiFetch<{
    data: {
      summary: TurnoutSummary;
      by_ward?: WardTurnoutStats[];
      by_booth?: BoothTurnoutStats[];
      hourly?: HourlyTurnoutData[];
    };
  }>(`/api/turnout/summary${buildQueryString(params)}`);

  return {
    summary: response.data.summary,
    by_ward: response.data.by_ward,
    by_booth: response.data.by_booth,
    hourly: response.data.hourly,
  };
}

/**
 * Get turnout by ward
 */
export async function getTurnoutByWard(
  listId: number
): Promise<WardTurnoutStats[]> {
  const response = await apiFetch<{
    data: { wards: WardTurnoutStats[] };
  }>(`/api/turnout/by-ward?list_id=${listId}`);

  return response.data?.wards || [];
}

/**
 * Get turnout by booth
 */
export async function getTurnoutByBooth(
  listId: number,
  wardNo?: string
): Promise<BoothTurnoutStats[]> {
  const params: Record<string, unknown> = { list_id: listId };
  if (wardNo) params.ward_no = wardNo;

  const response = await apiFetch<{
    data: { booths: BoothTurnoutStats[] };
  }>(`/api/turnout/by-booth${buildQueryString(params)}`);

  return response.data?.booths || [];
}

/**
 * Get hourly turnout data (for live tracking on election day)
 */
export async function getHourlyTurnout(
  listId: number,
  options?: { ward_no?: string; booth_id?: number }
): Promise<HourlyTurnoutData[]> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.booth_id) params.booth_id = options.booth_id;

  const response = await apiFetch<{
    data: { hourly: HourlyTurnoutData[] };
  }>(`/api/turnout/hourly${buildQueryString(params)}`);

  return response.data?.hourly || [];
}

/**
 * Get real-time turnout feed (for war room dashboards)
 */
export async function getTurnoutFeed(
  listId: number,
  options?: {
    since?: string; // ISO timestamp
    limit?: number;
  }
): Promise<TurnoutMark[]> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.since) params.since = options.since;
  if (options?.limit) params.limit = options.limit;

  const response = await apiFetch<{
    data: { marks: TurnoutMark[] };
  }>(`/api/turnout/feed${buildQueryString(params)}`);

  return response.data?.marks || [];
}
