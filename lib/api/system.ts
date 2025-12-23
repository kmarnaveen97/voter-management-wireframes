/**
 * System API Module
 *
 * Health checks, system info, and utility endpoints.
 */

import { apiFetch, apiDelete } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  environment: string;
  database?: {
    connected: boolean;
    latency_ms?: number;
  };
  version?: string;
}

export interface ApiInfo {
  message: string;
  version: string;
  endpoints: string[];
}

export interface ListInfo {
  id: number;
  name: string;
  filename: string;
  year?: number;
  total_voters: number;
  upload_date: string;
  source_type: string;
  has_family_tree?: boolean;
}

export interface InfoResponse {
  lists: ListInfo[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}

/**
 * Get API information and available endpoints
 */
export async function getApiInfo(): Promise<ApiInfo> {
  return apiFetch<ApiInfo>("/");
}

/**
 * Get available voter lists with metadata
 */
export async function getListsInfo(): Promise<InfoResponse> {
  return apiFetch<InfoResponse>("/api/info");
}

/**
 * Clear all data (DANGEROUS - use with caution)
 */
export async function clearAllData(): Promise<{
  success: boolean;
  message: string;
}> {
  return apiDelete<{ success: boolean; message: string }>(
    "/api/voters/clear-all"
  );
}
