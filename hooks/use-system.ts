/**
 * System & Health React Query Hooks
 *
 * Hooks for health checks, system info, and utilities.
 */

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as systemApi from "@/lib/api/system";
import type { HealthStatus, InfoResponse } from "@/lib/api/system";
import { toast } from "sonner";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Check API health status
 */
export function useHealthCheck(
  options?: Partial<UseQueryOptions<HealthStatus>>
) {
  return useQuery({
    queryKey: queryKeys.system.health,
    queryFn: () => systemApi.checkHealth(),
    refetchInterval: 30 * 1000, // Check every 30 seconds
    retry: false, // Don't retry health checks
    ...options,
  });
}

/**
 * Get available voter lists info
 */
export function useListsInfo(options?: Partial<UseQueryOptions<InfoResponse>>) {
  return useQuery({
    queryKey: queryKeys.system.info,
    queryFn: () => systemApi.getListsInfo(),
    staleTime: 60 * 1000,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Clear all data (DANGEROUS)
 */
export function useClearAllData() {
  return useMutation({
    mutationFn: () => systemApi.clearAllData(),
    onSuccess: () => {
      toast.success("All data cleared", {
        description: "Database has been reset",
      });
      // Force page reload to reset all state
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to clear data", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
