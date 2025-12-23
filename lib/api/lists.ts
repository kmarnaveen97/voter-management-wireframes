/**
 * Lists API Module
 *
 * Voter list management: fetch lists, upload, comparison
 */

import { apiFetch, buildQueryString } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface VoterList {
  list_id: number;
  filename?: string;
  file?: string;
  year?: number;
  upload_date?: string;
  total_voters: number;
  status?: string;
  source_type?: string;
  location?: {
    block?: string;
    district?: string;
    gram_panchayat?: string;
  };
  metadata?: {
    import_path?: string;
  };
  // Legacy compatibility
  id?: number;
  name?: string;
  election_date?: string;
  created_at?: string;
}

export interface VoterListsResponse {
  lists: VoterList[];
  total: number;
}

export interface ComparisonJob {
  job_id: string;
  status: "processing" | "completed" | "error";
  message?: string;
}

export interface ComparisonResult {
  added_voters: number;
  removed_voters: number;
  changed_voters: number;
  unchanged_voters: number;
  details?: {
    added: Array<{ voter_id: number; name: string }>;
    removed: Array<{ voter_id: number; name: string }>;
    changed: Array<{ voter_id: number; name: string; changes: string[] }>;
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all available voter lists
 */
export async function getVoterLists(): Promise<VoterListsResponse> {
  return apiFetch<VoterListsResponse>("/api/lists");
}

/**
 * Get a single voter list by ID
 */
export async function getVoterList(listId: number): Promise<VoterList> {
  return apiFetch<VoterList>(`/api/lists/${listId}`);
}

/**
 * Delete a voter list
 */
export async function deleteVoterList(
  listId: number
): Promise<{ success: boolean }> {
  return apiFetch(`/api/lists/${listId}`, { method: "DELETE" });
}

// =============================================================================
// COMPARISON OPERATIONS
// =============================================================================

/**
 * Start a comparison job between two voter lists
 */
export async function startComparison(
  baseListId: number,
  compareListId: number
): Promise<ComparisonJob> {
  return apiFetch("/api/lists/compare", {
    method: "POST",
    body: JSON.stringify({
      base_list_id: baseListId,
      compare_list_id: compareListId,
    }),
  });
}

/**
 * Get comparison job status and results
 */
export async function getComparisonResult(
  jobId: string
): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>(`/api/lists/compare/${jobId}`);
}
