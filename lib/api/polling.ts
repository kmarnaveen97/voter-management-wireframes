/**
 * Polling Stations & Booths API Module
 *
 * All polling station and booth related API calls
 */

import {
  apiFetch,
  buildQueryString,
  type SentimentCounts,
  type TurnoutCounts,
} from "./client";
import type { Voter } from "./voters";

// =============================================================================
// TYPES
// =============================================================================

export interface PollingStation {
  polling_station_id: number;
  code: string;
  name: string;
  booth_count: number;
  voter_count: number;
  ward_id?: number;
  ward_no?: string;
  booths?: PollingBooth[];
}

export interface PollingBooth {
  polling_booth_id: number;
  code: string;
  name: string;
  polling_station_id?: number;
  station_code?: string;
  station_name?: string;
  ward_id?: number;
  ward_no?: string;
  voter_count: number;
  male_count?: number;
  female_count?: number;
  sentiment_counts?: SentimentCounts;
  turnout_counts?: TurnoutCounts;
  voters?: Voter[];
}

export interface PollingBoothStatsSummary {
  total_booths: number;
  total_voters: number;
  sentiment?: {
    support: number;
    oppose: number;
    swing: number;
    neutral?: number;
    unknown?: number;
    support_percent?: number;
    net_margin?: number;
    net_margin_percent?: number;
  };
  turnout?: {
    marked: number;
    unmarked: number;
    coverage_percent?: number;
    will_vote?: number;
    projected_turnout_percent?: number;
  };
}

export interface PollingBoothStatsRow {
  polling_booth_id?: number;
  booth_id?: number;
  booth_code?: string;
  booth_name?: string;
  code?: string;
  name?: string;
  ward_no?: string;
  total_voters?: number;
  voter_count?: number;
  male_count?: number;
  female_count?: number;
  support_count?: number;
  oppose_count?: number;
  swing_count?: number;
  neutral_count?: number;
  unknown_count?: number;
  support_percent?: number;
  turnout_marked?: number;
  will_vote_count?: number;
  turnout_coverage_percent?: number;
  projected_turnout_percent?: number;
}

export interface StationsResponse {
  total: number;
  stations: PollingStation[];
}

export interface StationDetailResponse {
  station: PollingStation;
  voters?: Voter[];
  meta?: { page: number; per_page: number; total: number };
}

export interface BoothsResponse {
  total: number;
  booths: PollingBooth[];
}

export interface BoothDetailResponse {
  booth: PollingBooth;
  voters?: Voter[];
  meta?: { page: number; per_page: number; total: number };
}

export interface BoothStatsResponse {
  summary: PollingBoothStatsSummary;
  booths: PollingBoothStatsRow[];
}

// =============================================================================
// API FUNCTIONS - POLLING STATIONS
// =============================================================================

/**
 * Get all polling stations for a list
 */
export async function getPollingStations(
  listId: number
): Promise<StationsResponse> {
  const response = await apiFetch<{
    data?: { polling_stations?: PollingStation[] };
    meta?: { total: number };
  }>(`/api/polling-stations?list_id=${listId}`);

  return {
    total: response.data?.polling_stations?.length || response.meta?.total || 0,
    stations: response.data?.polling_stations || [],
  };
}

/**
 * Get a single polling station with its booths
 */
export async function getPollingStation(
  stationId: number | string,
  listId: number,
  options?: {
    include_voters?: boolean;
    page?: number;
    per_page?: number;
  }
): Promise<StationDetailResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.include_voters) params.include_voters = "true";
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;

  const response = await apiFetch<{
    data: PollingStation & { voters?: Voter[] };
    meta?: { page: number; per_page: number; total: number };
  }>(`/api/polling-stations/${stationId}${buildQueryString(params)}`);

  return {
    station: response.data,
    voters: response.data?.voters,
    meta: response.meta,
  };
}

// =============================================================================
// API FUNCTIONS - POLLING BOOTHS
// =============================================================================

/**
 * Get all polling booths, optionally filtered by station
 */
export async function getPollingBooths(
  listId: number,
  stationId?: number | string,
  options?: {
    ward_no?: string;
    include_stats?: boolean;
  }
): Promise<BoothsResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (stationId) params.station_id = stationId;
  if (options?.ward_no) params.ward_no = options.ward_no;
  if (options?.include_stats) params.include_stats = "true";

  const response = await apiFetch<{
    data?: { polling_booths?: PollingBooth[] };
    meta?: { total: number };
  }>(`/api/polling-booths${buildQueryString(params)}`);

  return {
    total: response.data?.polling_booths?.length || response.meta?.total || 0,
    booths: response.data?.polling_booths || [],
  };
}

/**
 * Get a single polling booth with optional voters
 */
export async function getPollingBooth(
  boothId: number | string,
  listId: number,
  options?: {
    include_voters?: boolean;
    page?: number;
    per_page?: number;
  }
): Promise<BoothDetailResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.include_voters) params.include_voters = "true";
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;

  const response = await apiFetch<{
    data: PollingBooth & {
      voters?: Voter[];
      pagination?: { page: number; per_page: number; total: number };
    };
    meta?: { page: number; per_page: number; total: number };
  }>(`/api/polling-booths/${boothId}${buildQueryString(params)}`);

  const pagination = response.data?.pagination;
  return {
    booth: response.data,
    voters: response.data?.voters,
    meta: pagination
      ? {
          page: pagination.page,
          per_page: pagination.per_page,
          total: pagination.total,
        }
      : response.meta,
  };
}

/**
 * Get booth-level campaign statistics
 */
export async function getPollingBoothStats(
  listId: number,
  options?: { ward_no?: string }
): Promise<BoothStatsResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.ward_no) params.ward_no = options.ward_no;

  const response = await apiFetch<{
    data?: {
      summary: PollingBoothStatsSummary;
      booths: PollingBoothStatsRow[];
    };
  }>(`/api/polling-booths/stats${buildQueryString(params)}`);

  return {
    summary: response.data?.summary || { total_booths: 0, total_voters: 0 },
    booths: response.data?.booths || [],
  };
}
