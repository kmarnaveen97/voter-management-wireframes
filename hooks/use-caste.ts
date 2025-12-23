/**
 * Caste Detection React Query Hooks
 *
 * Hooks for caste detection, demographic analysis, and AI resolution.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as casteApi from "@/lib/api/caste";
import type {
  CasteSummary,
  CasteVoter,
  CasteDetectionResult,
  HouseholdCaste,
  WardCasteDistribution,
  AmbiguousVoter,
} from "@/lib/api/caste";
import type { CasteCategory } from "@/lib/api/client";
import { toast } from "sonner";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch caste detection summary for a list
 */
export function useCasteSummary(
  listId: number | undefined,
  options?: Partial<UseQueryOptions<CasteSummary>>
) {
  return useQuery({
    queryKey: queryKeys.caste.summary(listId!),
    queryFn: () => casteApi.getCasteSummary(listId),
    enabled: !!listId,
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Fetch caste for a specific voter
 */
export function useVoterCaste(
  listId: number | undefined,
  voterId: number | undefined,
  options?: Partial<UseQueryOptions<CasteDetectionResult>>
) {
  return useQuery({
    queryKey: queryKeys.caste.voter(listId!, voterId!),
    queryFn: () => casteApi.getVoterCaste(voterId!, listId),
    enabled: !!listId && !!voterId,
    ...options,
  });
}

/**
 * Fetch household caste breakdown
 */
export function useHouseholdCaste(
  listId: number | undefined,
  wardNo: string | undefined,
  houseNo: string | undefined,
  options?: Partial<UseQueryOptions<HouseholdCaste>>
) {
  return useQuery({
    queryKey: queryKeys.caste.household(listId!, wardNo!, houseNo!),
    queryFn: () => casteApi.getHouseholdCaste(wardNo!, houseNo!, listId),
    enabled: !!listId && !!wardNo && !!houseNo,
    ...options,
  });
}

/**
 * Fetch ward caste distribution
 */
export function useWardCasteDistribution(
  listId: number | undefined,
  wardNo: string | undefined,
  options?: Partial<UseQueryOptions<WardCasteDistribution>>
) {
  return useQuery({
    queryKey: queryKeys.caste.ward(listId!, wardNo!),
    queryFn: () => casteApi.getWardCasteDistribution(wardNo!, listId),
    enabled: !!listId && !!wardNo,
    ...options,
  });
}

/**
 * Fetch voters by caste/category with filters
 */
export function useVotersByCaste(
  listId: number | undefined,
  filters?: {
    caste?: string;
    category?: CasteCategory;
    ward_no?: string;
    page?: number;
    per_page?: number;
  },
  options?: Partial<UseQueryOptions<{ voters: CasteVoter[]; total: number }>>
) {
  return useQuery({
    queryKey: queryKeys.caste.voters(listId!, filters),
    queryFn: () => casteApi.getVotersByCaste({ list_id: listId, ...filters }),
    enabled: !!listId,
    placeholderData: (prev) => prev,
    ...options,
  });
}

/**
 * Fetch ambiguous voters needing AI resolution
 */
export function useAmbiguousVoters(
  listId: number | undefined,
  filters?: {
    limit?: number;
    reason?: string;
  },
  options?: Partial<
    UseQueryOptions<{ voters: AmbiguousVoter[]; total: number }>
  >
) {
  return useQuery({
    queryKey: queryKeys.caste.ambiguous(listId!, filters),
    queryFn: () => casteApi.getAmbiguousVoters({ list_id: listId, ...filters }),
    enabled: !!listId,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Run caste detection pipeline
 */
export function useRunCasteDetection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: number) => casteApi.runCasteDetection(listId),
    onSuccess: (data, listId) => {
      toast.success("Caste detection complete", {
        description: `Processed ${data.statistics.total_processed} voters`,
      });
      // Invalidate all caste-related queries
      queryClient.invalidateQueries({
        queryKey: ["caste", listId],
      });
    },
    onError: (error) => {
      toast.error("Caste detection failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Manually set voter caste
 */
export function useSetVoterCaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      voterId,
      caste,
      category,
    }: {
      voterId: number;
      caste: string;
      category?: CasteCategory;
      listId: number;
    }) => casteApi.setVoterCaste(voterId, caste, category),
    onSuccess: (_, variables) => {
      toast.success("Caste updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.caste.voter(variables.listId, variables.voterId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.caste.summary(variables.listId),
      });
    },
    onError: (error) => {
      toast.error("Failed to update caste", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Resolve ambiguous castes using AI
 */
export function useResolveAmbiguousCastes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, limit }: { listId: number; limit?: number }) =>
      casteApi.resolveAmbiguousCastes(listId, { limit }),
    onSuccess: (data, variables) => {
      toast.success("AI resolution complete", {
        description: `Resolved ${data.resolved_count} ambiguous cases`,
      });
      queryClient.invalidateQueries({
        queryKey: ["caste", variables.listId],
      });
    },
    onError: (error) => {
      toast.error("AI resolution failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Reload caste dictionary configuration
 */
export function useReloadCasteConfig() {
  return useMutation({
    mutationFn: () => casteApi.reloadCasteConfig(),
    onSuccess: () => {
      toast.success("Caste dictionary reloaded");
    },
    onError: (error) => {
      toast.error("Failed to reload config", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
