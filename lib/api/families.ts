/**
 * Families API Module
 *
 * All family-related API calls: fetch families, family members, family sentiment
 */

import {
  apiFetch,
  buildQueryString,
  type Sentiment,
  type SentimentCounts,
} from "./client";
import type { Voter } from "./voters";

// =============================================================================
// TYPES
// =============================================================================

export interface Family {
  ward_id?: number;
  ward_no: string;
  house_no: string;
  list_id?: number;
  address?: string;
  member_count: number;
  vote_count?: number;
  mukhiya_name?: string;
  mukhiya_age?: number;
  mukhiya_gender?: string;
  members?: Voter[];
  sentiment_counts?: SentimentCounts;
  dominant_sentiment?: Sentiment;
}

export interface FamiliesResponse {
  families: Family[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FamilyFilters {
  ward?: string;
  minMembers?: number;
  maxMembers?: number;
  sentiment?: Sentiment;
  search?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get paginated families with filters
 */
export async function getFamilies(
  page: number = 1,
  perPage: number = 50,
  listId?: number,
  filters?: FamilyFilters
): Promise<FamiliesResponse> {
  const params = {
    page,
    per_page: perPage,
    list_id: listId,
    ward_no: filters?.ward,
    min_members: filters?.minMembers,
    max_members: filters?.maxMembers,
    sentiment: filters?.sentiment,
    search: filters?.search,
  };

  return apiFetch<FamiliesResponse>(`/api/families${buildQueryString(params)}`);
}

/**
 * Get family members by house number and ward
 */
export async function getFamilyMembers(
  houseNo: string,
  wardNo: string,
  listId?: number
): Promise<{ family: Family; members: Voter[] }> {
  const params = { house_no: houseNo, ward_no: wardNo, list_id: listId };
  return apiFetch(`/api/families/members${buildQueryString(params)}`);
}

/**
 * Get family tree structure for visualization
 */
export async function getFamilyTree(
  houseNo: string,
  wardNo: string,
  listId?: number
): Promise<{
  root: Voter;
  children: Voter[];
  relationships: Array<{ from: number; to: number; type: string }>;
}> {
  const params = { house_no: houseNo, ward_no: wardNo, list_id: listId };
  return apiFetch(`/api/families/tree${buildQueryString(params)}`);
}

// =============================================================================
// FAMILY SENTIMENT OPERATIONS
// =============================================================================

/**
 * Tag entire family's sentiment (cascades to all members)
 */
export async function tagFamilySentiment(
  houseNo: string,
  wardNo: string,
  sentiment: Sentiment,
  listId?: number
): Promise<{ success: boolean; updated_count: number }> {
  return apiFetch(`/api/families/sentiment`, {
    method: "POST",
    body: JSON.stringify({
      house_no: houseNo,
      ward_no: wardNo,
      sentiment,
      list_id: listId,
    }),
  });
}

/**
 * Get family sentiment summary
 */
export async function getFamilySentimentSummary(
  houseNo: string,
  wardNo: string,
  listId?: number
): Promise<{
  total_members: number;
  sentiment_counts: SentimentCounts;
  dominant_sentiment: Sentiment;
}> {
  const params = { house_no: houseNo, ward_no: wardNo, list_id: listId };
  return apiFetch(`/api/families/sentiment-summary${buildQueryString(params)}`);
}
