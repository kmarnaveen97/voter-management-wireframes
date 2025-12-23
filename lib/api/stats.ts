/**
 * Statistics API Module
 *
 * Endpoints for fetching voter statistics, demographics, and ward data.
 */

import { apiFetch } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface Stats {
  list_id: number;
  total_voters: number;
  male_count: number;
  female_count: number;
  total_wards: number;
  average_age: number;
  total_families?: number;
}

export interface WardStats {
  ward_no: string;
  voter_count: number;
  male_count: number;
  female_count: number;
}

export interface AgeDistribution {
  age_group: string;
  count: number;
}

export interface StatsResponse {
  success: boolean;
  stats: Stats;
  ward_stats?: WardStats[];
  age_distribution?: AgeDistribution[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get complete statistics for a voter list
 */
export async function getStats(listId: number): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/api/stats", {
    params: { list_id: listId },
  });
}
