/**
 * Voters API Module
 *
 * All voter-related API calls: fetch, search, filter, sentiment tagging
 */

import {
  apiFetch,
  buildQueryString,
  type Sentiment,
  type SentimentSource,
  type TurnoutStatus,
  type Gender,
} from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface Voter {
  voter_id: number;
  serial_no: string;
  name: string;
  name_hindi?: string;
  relative_name: string;
  relative_name_hindi?: string;
  house_no: string;
  age: number;
  gender: Gender;
  ward_no: string;
  ps_code?: string;
  ps_name?: string;
  pb_code?: string;
  pb_name?: string;
  voter_id_number?: string;
  sentiment?: Sentiment;
  sentiment_source?: SentimentSource;
  turnout_status?: TurnoutStatus | null;
  turnout_note?: string | null;
  turnout_marked_at?: string | null;
  turnout_marked_by?: number | null;
}

export interface VoterFilters {
  ward?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  sentiment?: Sentiment;
  search?: string;
  house_no?: string;
  ps_code?: string;
  pb_code?: string;
}

export interface VotersResponse {
  voters: Voter[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface VoterSearchResult {
  voter_id: number;
  name: string;
  serial_no: string;
  ward_no: string;
  house_no: string;
  age: number;
  gender: Gender;
  sentiment?: Sentiment;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get paginated voters with filters
 */
export async function getVoters(
  page: number = 1,
  perPage: number = 50,
  listId?: number,
  filters?: VoterFilters
): Promise<VotersResponse> {
  const params = {
    page,
    per_page: perPage,
    list_id: listId,
    ward_no: filters?.ward,
    gender: filters?.gender,
    min_age: filters?.minAge,
    max_age: filters?.maxAge,
    sentiment: filters?.sentiment,
    search: filters?.search,
    house_no: filters?.house_no,
    ps_code: filters?.ps_code,
    pb_code: filters?.pb_code,
  };

  return apiFetch<VotersResponse>(`/api/voters${buildQueryString(params)}`);
}

/**
 * Get a single voter by ID
 */
export async function getVoter(
  voterId: number,
  listId?: number
): Promise<Voter> {
  const params = listId ? { list_id: listId } : {};
  return apiFetch<Voter>(`/api/voters/${voterId}${buildQueryString(params)}`);
}

/**
 * Search voters by name or serial number
 */
export async function searchVoters(
  query: string,
  listId?: number,
  limit: number = 20
): Promise<VoterSearchResult[]> {
  const params = { q: query, list_id: listId, limit };
  const response = await apiFetch<{ results: VoterSearchResult[] }>(
    `/api/voters/search${buildQueryString(params)}`
  );
  return response.results;
}

/**
 * Get voters by house number (for family grouping)
 */
export async function getVotersByHouse(
  houseNo: string,
  wardNo: string,
  listId?: number
): Promise<Voter[]> {
  const params = { house_no: houseNo, ward_no: wardNo, list_id: listId };
  const response = await apiFetch<{ voters: Voter[] }>(
    `/api/voters/by-house${buildQueryString(params)}`
  );
  return response.voters;
}

// =============================================================================
// SENTIMENT OPERATIONS
// =============================================================================

export interface TagSentimentRequest {
  voter_id: number;
  sentiment: Sentiment;
  list_id?: number;
}

export interface BulkTagSentimentRequest {
  voter_ids: number[];
  sentiment: Sentiment;
  list_id?: number;
}

/**
 * Tag a single voter's sentiment
 */
export async function tagSentiment(
  voterId: number,
  sentiment: Sentiment,
  listId?: number
): Promise<{ success: boolean; voter_id: number }> {
  return apiFetch(`/api/sentiment/tag`, {
    method: "POST",
    body: JSON.stringify({ voter_id: voterId, sentiment, list_id: listId }),
  });
}

/**
 * Bulk tag multiple voters' sentiment
 */
export async function bulkTagSentiment(
  voterIds: number[],
  sentiment: Sentiment,
  listId?: number
): Promise<{ success: boolean; updated_count: number }> {
  return apiFetch(`/api/sentiment/bulk-tag`, {
    method: "POST",
    body: JSON.stringify({ voter_ids: voterIds, sentiment, list_id: listId }),
  });
}

/**
 * Remove sentiment tag from a voter
 */
export async function removeSentiment(
  voterId: number,
  listId?: number
): Promise<{ success: boolean }> {
  return apiFetch(`/api/sentiment/remove`, {
    method: "POST",
    body: JSON.stringify({ voter_id: voterId, list_id: listId }),
  });
}

/**
 * Compute sentiments for voters without tags (based on family/neighbors)
 */
export async function computeSentiments(
  listId?: number
): Promise<{ success: boolean; computed_count: number }> {
  return apiFetch(`/api/sentiment/compute`, {
    method: "POST",
    body: JSON.stringify({ list_id: listId }),
  });
}

// =============================================================================
// TURNOUT OPERATIONS
// =============================================================================

export interface MarkTurnoutRequest {
  voter_id: number;
  status: TurnoutStatus;
  note?: string;
  list_id?: number;
}

/**
 * Mark a voter's turnout status
 */
export async function markTurnout(
  voterId: number,
  status: TurnoutStatus,
  note?: string,
  listId?: number
): Promise<{ success: boolean }> {
  return apiFetch(`/api/turnout/mark`, {
    method: "POST",
    body: JSON.stringify({ voter_id: voterId, status, note, list_id: listId }),
  });
}

/**
 * Bulk mark turnout for multiple voters
 */
export async function bulkMarkTurnout(
  voterIds: number[],
  status: TurnoutStatus,
  listId?: number
): Promise<{ success: boolean; updated_count: number }> {
  return apiFetch(`/api/turnout/bulk-mark`, {
    method: "POST",
    body: JSON.stringify({ voter_ids: voterIds, status, list_id: listId }),
  });
}
