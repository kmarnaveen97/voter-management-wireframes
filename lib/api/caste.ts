/**
 * Caste Detection API Module
 *
 * Endpoints for caste detection, demographic analysis, and AI-powered resolution.
 */

import { apiFetch, apiPost, apiPut, type CasteCategory } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface CasteDetectionResult {
  voter_id: number;
  caste: string | null;
  category: CasteCategory | null;
  confidence: number;
  detection_level: "level_1" | "level_2" | "level_3" | "manual" | "ai";
  source: string;
}

export interface CasteVoter {
  voter_id: number;
  name: string;
  relative_name: string;
  ward_no: string;
  house_no: string;
  caste: string | null;
  category: CasteCategory | null;
  confidence: number;
  detection_level: string;
}

export interface HouseholdCaste {
  ward_no: string;
  house_no: string;
  primary_caste: string | null;
  members: Array<{
    voter_id: number;
    name: string;
    caste: string | null;
    confidence: number;
  }>;
}

export interface WardCasteDistribution {
  ward_no: string;
  total_voters: number;
  distribution: Record<string, number>;
  by_category: Record<CasteCategory, number>;
}

export interface CasteSummary {
  list_id: number;
  total_voters: number;
  detected_count: number;
  detection_rate: number;
  by_level: {
    level_1: number;
    level_2: number;
    level_3: number;
    manual: number;
    ai: number;
    undetected: number;
  };
  by_category: Record<CasteCategory, number>;
  top_castes: Array<{ caste: string; count: number }>;
}

export interface AmbiguousVoter {
  voter_id: number;
  name: string;
  relative_name: string;
  ward_no: string;
  house_no: string;
  ambiguity_reason: string;
  signals: {
    surname_match?: string;
    household_caste?: string;
    neighbor_castes?: string[];
  };
}

export interface CasteDetectResponse {
  success: boolean;
  statistics: {
    level_1_matches: number;
    level_2_propagated: number;
    level_3_interpolated: number;
    undetected: number;
    total_processed: number;
  };
}

export interface AIResolveResponse {
  success: boolean;
  resolved_count: number;
  results: Array<{
    voter_id: number;
    caste: string;
    category: CasteCategory;
    confidence: number;
    reasoning: string;
  }>;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Run caste detection pipeline (3-level detection)
 */
export async function runCasteDetection(
  listId: number
): Promise<CasteDetectResponse> {
  const response = await apiPost<CasteDetectResponse>("/api/caste/detect", {
    list_id: listId,
  });
  return response;
}

/**
 * Reload caste dictionary configuration
 */
export async function reloadCasteConfig(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>("/api/caste/reload-config");
}

/**
 * Get caste for a specific voter
 */
export async function getVoterCaste(
  voterId: number,
  listId?: number
): Promise<CasteDetectionResult> {
  const response = await apiFetch<{ data: CasteDetectionResult }>(
    `/api/voters/${voterId}/caste`,
    { params: { list_id: listId } }
  );
  return response.data;
}

/**
 * Manually override caste for a voter
 */
export async function setVoterCaste(
  voterId: number,
  caste: string,
  category?: CasteCategory
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>(`/api/voters/${voterId}/caste`, {
    caste,
    category,
  });
}

/**
 * Get household caste breakdown
 */
export async function getHouseholdCaste(
  wardNo: string,
  houseNo: string,
  listId?: number
): Promise<HouseholdCaste> {
  const response = await apiFetch<{ data: HouseholdCaste }>(
    `/api/families/${wardNo}/${houseNo}/caste`,
    { params: { list_id: listId } }
  );
  return response.data;
}

/**
 * Get ward caste distribution
 */
export async function getWardCasteDistribution(
  wardNo: string,
  listId?: number
): Promise<WardCasteDistribution> {
  const response = await apiFetch<{ data: WardCasteDistribution }>(
    `/api/caste/ward/${wardNo}`,
    { params: { list_id: listId } }
  );
  return response.data;
}

/**
 * Get caste detection summary
 */
export async function getCasteSummary(listId?: number): Promise<CasteSummary> {
  const response = await apiFetch<{ data: CasteSummary }>(
    "/api/caste/summary",
    {
      params: { list_id: listId },
    }
  );
  return response.data;
}

/**
 * Get voters filtered by caste/category
 */
export async function getVotersByCaste(options: {
  list_id?: number;
  caste?: string;
  category?: CasteCategory;
  ward_no?: string;
  page?: number;
  per_page?: number;
}): Promise<{ voters: CasteVoter[]; total: number }> {
  const response = await apiFetch<{
    data: { voters: CasteVoter[]; total: number };
  }>("/api/caste/voters", {
    params: options as Record<string, string | number | undefined>,
  });
  return response.data;
}

/**
 * Get house caste details
 */
export async function getHouseCaste(
  houseNo: string,
  listId?: number
): Promise<HouseholdCaste> {
  const response = await apiFetch<{ data: HouseholdCaste }>(
    `/api/caste/house/${houseNo}`,
    { params: { list_id: listId } }
  );
  return response.data;
}

/**
 * Get ambiguous voters that need AI resolution
 */
export async function getAmbiguousVoters(options?: {
  list_id?: number;
  limit?: number;
  reason?: string;
}): Promise<{ voters: AmbiguousVoter[]; total: number }> {
  const response = await apiFetch<{
    data: { voters: AmbiguousVoter[]; total: number };
  }>("/api/caste/ambiguous", {
    params: options as Record<string, string | number | undefined>,
  });
  return response.data;
}

/**
 * Resolve ambiguous castes using AI (Gemini)
 */
export async function resolveAmbiguousCastes(
  listId: number,
  options?: { limit?: number }
): Promise<AIResolveResponse> {
  return apiPost<AIResolveResponse>("/api/caste/resolve-ambiguous", {
    list_id: listId,
    ...options,
  });
}
