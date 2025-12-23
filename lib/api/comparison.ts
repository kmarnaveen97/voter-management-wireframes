/**
 * List Comparison API Module
 *
 * All voter list comparison related API calls
 */

import { apiFetch, buildQueryString } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export type ComparisonStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface ComparisonJob {
  job_id: string;
  source_list_id: number;
  target_list_id: number;
  source_list_name?: string;
  target_list_name?: string;
  status: ComparisonStatus;
  progress?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ComparisonSummary {
  total_source: number;
  total_target: number;
  matched: number;
  added: number;
  removed: number;
  modified: number;
  match_percent: number;
}

export interface VoterDiff {
  voter_id?: number;
  epic_id?: string;
  name: string;
  status: "matched" | "added" | "removed" | "modified";
  changes?: {
    field: string;
    old_value: string | null;
    new_value: string | null;
  }[];
  source_data?: Record<string, unknown>;
  target_data?: Record<string, unknown>;
}

export interface ComparisonResult {
  job_id: string;
  summary: ComparisonSummary;
  diffs: VoterDiff[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
  };
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface CreateComparisonResponse {
  job: ComparisonJob;
  message: string;
}

export interface ComparisonStatusResponse {
  job: ComparisonJob;
}

export interface ComparisonResultsResponse {
  result: ComparisonResult;
}

export interface ComparisonJobsResponse {
  total: number;
  jobs: ComparisonJob[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Start a new comparison job between two lists
 */
export async function startComparison(
  sourceListId: number,
  targetListId: number,
  options?: {
    match_fields?: string[];
    ignore_case?: boolean;
  }
): Promise<CreateComparisonResponse> {
  const response = await apiFetch<CreateComparisonResponse>("/api/compare", {
    method: "POST",
    body: JSON.stringify({
      source_list_id: sourceListId,
      target_list_id: targetListId,
      match_fields: options?.match_fields,
      ignore_case: options?.ignore_case ?? true,
    }),
  });

  return response;
}

/**
 * Get comparison job status
 */
export async function getComparisonStatus(
  jobId: string
): Promise<ComparisonJob> {
  const response = await apiFetch<{ data: ComparisonJob }>(
    `/api/compare/${jobId}/status`
  );

  return response.data;
}

/**
 * Get comparison results (paginated)
 */
export async function getComparisonResults(
  jobId: string,
  options?: {
    status_filter?: "matched" | "added" | "removed" | "modified";
    page?: number;
    per_page?: number;
    search?: string;
  }
): Promise<ComparisonResult> {
  const params: Record<string, unknown> = {};
  if (options?.status_filter) params.status = options.status_filter;
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;
  if (options?.search) params.search = options.search;

  const response = await apiFetch<{
    data: {
      summary: ComparisonSummary;
      diffs: VoterDiff[];
    };
    meta?: { page: number; per_page: number; total: number };
  }>(`/api/compare/${jobId}/results${buildQueryString(params)}`);

  return {
    job_id: jobId,
    summary: response.data.summary,
    diffs: response.data.diffs,
    meta: response.meta,
  };
}

/**
 * Get comparison summary only (without diffs)
 */
export async function getComparisonSummary(
  jobId: string
): Promise<ComparisonSummary> {
  const response = await apiFetch<{ data: ComparisonSummary }>(
    `/api/compare/${jobId}/summary`
  );

  return response.data;
}

/**
 * List all comparison jobs for a list
 */
export async function getComparisonJobs(
  listId: number,
  options?: {
    status?: ComparisonStatus;
    page?: number;
    per_page?: number;
  }
): Promise<ComparisonJobsResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.status) params.status = options.status;
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;

  const response = await apiFetch<{
    data: { jobs: ComparisonJob[] };
    meta?: { total: number };
  }>(`/api/compare/jobs${buildQueryString(params)}`);

  return {
    total: response.meta?.total || response.data?.jobs?.length || 0,
    jobs: response.data?.jobs || [],
  };
}

/**
 * Cancel a running comparison job
 */
export async function cancelComparison(jobId: string): Promise<void> {
  await apiFetch(`/api/compare/${jobId}/cancel`, { method: "POST" });
}

/**
 * Delete a comparison job and its results
 */
export async function deleteComparison(jobId: string): Promise<void> {
  await apiFetch(`/api/compare/${jobId}`, { method: "DELETE" });
}

/**
 * Apply comparison changes (merge added/modified voters into target)
 */
export async function applyComparisonChanges(
  jobId: string,
  options?: {
    apply_added?: boolean;
    apply_modified?: boolean;
    voter_ids?: number[];
  }
): Promise<{
  applied_count: number;
  failed_count: number;
  failed_ids?: number[];
}> {
  const response = await apiFetch<{
    data: {
      applied_count: number;
      failed_count: number;
      failed_ids?: number[];
    };
  }>(`/api/compare/${jobId}/apply`, {
    method: "POST",
    body: JSON.stringify({
      apply_added: options?.apply_added ?? true,
      apply_modified: options?.apply_modified ?? true,
      voter_ids: options?.voter_ids,
    }),
  });

  return response.data;
}
