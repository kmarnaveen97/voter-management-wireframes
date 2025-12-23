/**
 * Shared React Query hooks for voter management
 *
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Background refresh
 * - Optimistic updates
 * - Consistent loading/error states
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  api,
  type Voter,
  type Family,
  type VoterList,
  type Stats,
  type WardStats,
  type AgeDistribution,
  type SentimentOverview,
  type WardMapSummary,
  type HousePosition,
  type TargetVoter,
  type Candidate,
  type PollingStation,
  type PollingBooth,
} from "@/lib/api";
import type {
  SentimentType,
  TaggableSentiment,
  TurnoutStatus,
} from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

export interface VoterFilters {
  ward_no?: string;
  min_age?: number;
  max_age?: number;
  gender?: string;
  house_no?: string;
  page?: number;
  per_page?: number;
}

export interface CandidateFilters {
  status?: "active" | "withdrawn" | "disqualified";
  ward_no?: string;
}

// ============================================================================
// Voter Lists Hooks
// ============================================================================

/**
 * Fetch all available voter lists
 */
export function useVoterLists() {
  return useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: () => api.getVoterLists(),
    staleTime: 5 * 60 * 1000, // Lists don't change often
  });
}

/**
 * Fetch a single voter list's info
 */
export function useVoterList(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.lists.list(listId!),
    queryFn: () => api.getListInfo(),
    enabled: !!listId,
  });
}

// ============================================================================
// Voters Hooks
// ============================================================================

/**
 * Fetch voters with pagination and filters
 */
export function useVoters(
  listId: number | undefined,
  filters: VoterFilters = {},
  options?: Partial<UseQueryOptions<{ voters: Voter[]; total: number }>>
) {
  const { page = 1, per_page = 100, ...filterParams } = filters;

  return useQuery({
    queryKey: queryKeys.voters.list(listId!, {
      page,
      per_page,
      ...filterParams,
    }),
    queryFn: async () => {
      // Use filter endpoint if filters are applied, otherwise use regular voters endpoint
      const hasFilters = Object.values(filterParams).some(
        (v) => v !== undefined && v !== ""
      );

      if (hasFilters) {
        const result = await api.filterVoters({
          ...filterParams,
          list_id: listId,
          page,
          per_page,
        });
        return { voters: result.voters, total: result.total };
      }

      const result = await api.getVoters(page, per_page, listId);
      return { voters: result.voters, total: result.total };
    },
    enabled: !!listId,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    ...options,
  });
}

/**
 * Search voters by query
 */
export function useVoterSearch(
  listId: number | undefined,
  query: string,
  options?: Partial<UseQueryOptions<{ voters: Voter[]; total: number }>>
) {
  return useQuery({
    queryKey: queryKeys.voters.search(listId!, query),
    queryFn: async () => {
      const result = await api.searchVoters(query, listId);
      return { voters: result.voters, total: result.total };
    },
    enabled: !!listId && query.length >= 2,
    staleTime: 10 * 1000, // Search results are relatively fresh
    ...options,
  });
}

/**
 * Fetch single voter details
 */
export function useVoter(
  listId: number | undefined,
  voterId: number | undefined
) {
  return useQuery({
    queryKey: queryKeys.voters.detail(listId!, voterId!),
    queryFn: () => api.getVoter(voterId!, listId),
    enabled: !!listId && !!voterId,
  });
}

// ============================================================================
// Families Hooks
// ============================================================================

/**
 * Fetch families with pagination
 */
export function useFamilies(
  listId: number | undefined,
  page: number = 1,
  perPage: number = 50,
  filters?: { ward_no?: string }
) {
  return useQuery({
    queryKey: queryKeys.families.list(listId!, page, filters),
    queryFn: async () => {
      const result = await api.getFamilies(page, perPage, listId);
      // Apply client-side ward filter if needed (API might not support it)
      let families = result.families;
      if (filters?.ward_no) {
        families = families.filter((f) => f.ward_no === filters.ward_no);
      }
      return { families, total: result.total, page: result.page };
    },
    enabled: !!listId,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch family members for a specific house
 */
export function useFamilyMembers(
  listId: number | undefined,
  wardNo: string | undefined,
  houseNo: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.families.members(listId!, wardNo!, houseNo!),
    queryFn: () => api.getFamilyMembers(wardNo!, houseNo!, listId),
    enabled: !!listId && !!wardNo && !!houseNo,
    staleTime: 60 * 1000, // Family data is relatively stable
  });
}

/**
 * Fetch family tree structure
 */
export function useFamilyTree(
  listId: number | undefined,
  wardNo: string | undefined,
  houseNo: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.families.tree(listId!, wardNo!, houseNo!),
    queryFn: () => api.getFamilyTree(wardNo!, houseNo!, listId),
    enabled: !!listId && !!wardNo && !!houseNo,
  });
}

// ============================================================================
// Statistics Hooks
// ============================================================================

/**
 * Fetch overall dashboard statistics
 */
export function useStats(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.stats.overview(listId!),
    queryFn: () => api.getStats(listId),
    enabled: !!listId,
    staleTime: 60 * 1000, // Stats can be cached longer
  });
}

/**
 * Fetch ward-level statistics
 */
export function useWardStats(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.stats.wards(listId!),
    queryFn: () => api.getWardStats(listId),
    enabled: !!listId,
  });
}

/**
 * Fetch age distribution
 */
export function useAgeDistribution(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.stats.age(listId!),
    queryFn: () => api.getAgeDistribution(listId),
    enabled: !!listId,
  });
}

/**
 * Fetch gender distribution
 */
export function useGenderDistribution(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.stats.gender(listId!),
    queryFn: () => api.getGenderDistribution(listId),
    enabled: !!listId,
  });
}

// ============================================================================
// War Room / Sentiment Hooks
// ============================================================================

/**
 * Fetch sentiment overview for war room
 */
export function useSentimentOverview(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.warRoom.overview(listId!),
    queryFn: () => api.getSentimentOverview(listId!),
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch ward map data for visualization
 */
export function useWardMap(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.warRoom.wardMap(listId!),
    queryFn: () => api.getMapWards(listId!),
    enabled: !!listId,
  });
}

/**
 * Fetch house positions for a ward
 */
export function useHousePositions(
  listId: number | undefined,
  wardNo: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.warRoom.houses(listId!, wardNo!),
    queryFn: () => api.getWardHouses(wardNo!, listId!),
    enabled: !!listId && !!wardNo,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch priority targets (swing voters to convert)
 */
export function useTargetVoters(
  listId: number | undefined,
  limit: number = 20
) {
  return useQuery({
    queryKey: queryKeys.warRoom.targets(listId!),
    queryFn: () => api.getTargetVoters(listId!, { limit }),
    enabled: !!listId,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Sentiment Mutations
// ============================================================================

/**
 * Tag voter sentiment with optimistic update
 * Supports optional candidate_id for multi-candidate tracking
 * If candidate_id is not provided, it defaults to "our candidate" (backward compatible)
 */
export function useTagSentiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      voterId,
      sentiment,
      candidateId,
    }: {
      listId: number;
      voterId: number;
      sentiment: TaggableSentiment; // Only support, oppose, swing, neutral (NOT unknown)
      candidateId?: number; // Optional: defaults to our candidate on backend
    }) => {
      return api.tagVoterSentiment(voterId, {
        sentiment,
        list_id: listId,
        candidate_id: candidateId,
      });
    },
    // Optimistic update - immediately update UI before server responds
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.voters.all(variables.listId),
      });

      // Snapshot the previous value
      const previousVoters = queryClient.getQueriesData({
        queryKey: queryKeys.voters.all(variables.listId),
      });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.voters.all(variables.listId) },
        (old: { voters: Voter[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            voters: old.voters.map((voter) =>
              voter.voter_id === variables.voterId
                ? { ...voter, sentiment: variables.sentiment }
                : voter
            ),
          };
        }
      );

      // Return context with previous value for rollback
      return { previousVoters };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousVoters) {
        context.previousVoters.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.voters.all(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warRoom.overview(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stats.overview(variables.listId),
      });
      // Also invalidate projections since sentiment affects them
      queryClient.invalidateQueries({
        queryKey: queryKeys.projections.all(variables.listId),
      });
    },
  });
}

/**
 * Bulk tag multiple voters with optimistic update
 * Supports optional candidate_id for multi-candidate tracking
 */
export function useBulkTagSentiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      voterIds,
      sentiment,
      candidateId,
    }: {
      listId: number;
      voterIds: number[];
      sentiment: TaggableSentiment; // Only support, oppose, swing, neutral (NOT unknown)
      candidateId?: number; // Optional: defaults to our candidate on backend
    }) => {
      return api.bulkTagVoters({
        voter_ids: voterIds,
        sentiment,
        list_id: listId,
        source: "bulk_action",
        propagate_family: false,
        candidate_id: candidateId,
      });
    },
    // Optimistic update for bulk operations
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.voters.all(variables.listId),
      });

      const previousVoters = queryClient.getQueriesData({
        queryKey: queryKeys.voters.all(variables.listId),
      });

      const voterIdSet = new Set(variables.voterIds);

      queryClient.setQueriesData(
        { queryKey: queryKeys.voters.all(variables.listId) },
        (old: { voters: Voter[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            voters: old.voters.map((voter) =>
              voterIdSet.has(voter.voter_id)
                ? { ...voter, sentiment: variables.sentiment }
                : voter
            ),
          };
        }
      );

      return { previousVoters };
    },
    onError: (err, variables, context) => {
      if (context?.previousVoters) {
        context.previousVoters.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.voters.all(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warRoom.overview(variables.listId),
      });
      // Also invalidate projections since sentiment affects them
      queryClient.invalidateQueries({
        queryKey: queryKeys.projections.all(variables.listId),
      });
    },
  });
}

/**
 * Tag family sentiment (propagates to all members)
 */
export function useTagFamilySentiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      wardNo,
      houseNo,
      sentiment,
      candidateId,
    }: {
      listId: number;
      wardNo: string;
      houseNo: string;
      sentiment: TaggableSentiment; // Only support, oppose, swing, neutral (NOT unknown)
      candidateId?: number; // Required for oppose sentiment, optional for others
    }) => {
      // First get family members, then bulk tag them
      const family = await api.getFamilyMembers(wardNo, houseNo, listId);
      const voterIds = family.members
        .map((m) => m.voter_id)
        .filter((id): id is number => id !== undefined);

      if (voterIds.length === 0) {
        throw new Error("No family members found");
      }

      return api.bulkTagVoters({
        voter_ids: voterIds,
        sentiment,
        list_id: listId,
        source: "family_tag",
        propagate_family: false,
        candidate_id: candidateId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(
          variables.listId,
          variables.wardNo,
          variables.houseNo
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warRoom.houses(variables.listId, variables.wardNo),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.warRoom.overview(variables.listId),
      });
    },
  });
}

// ============================================================================
// Turnout Mutations
// ============================================================================

/**
 * Mark voter turnout status with optimistic update
 */
export function useMarkTurnout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      voterId,
      status,
      note,
    }: {
      listId: number;
      voterId: number;
      status: TurnoutStatus;
      note?: string;
    }) => {
      return api.markTurnout({
        list_id: listId,
        voter_id: voterId,
        status,
        note,
      });
    },
    // Optimistic update for instant feedback on election day
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.turnout.voters(variables.listId),
      });

      const previousTurnout = queryClient.getQueriesData({
        queryKey: queryKeys.turnout.voters(variables.listId),
      });

      // Update turnout status optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.turnout.voters(variables.listId) },
        (
          old:
            | {
                voters: Array<{
                  voter_id: number;
                  turnout_status?: TurnoutStatus;
                }>;
              }
            | undefined
        ) => {
          if (!old) return old;
          return {
            ...old,
            voters: old.voters.map((voter) =>
              voter.voter_id === variables.voterId
                ? { ...voter, turnout_status: variables.status }
                : voter
            ),
          };
        }
      );

      return { previousTurnout };
    },
    onError: (err, variables, context) => {
      if (context?.previousTurnout) {
        context.previousTurnout.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.turnout.voters(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.turnout.summary(variables.listId),
      });
    },
  });
}

/**
 * Bulk mark turnout for multiple voters
 */
export function useBulkMarkTurnout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      voterIds,
      status,
      note,
    }: {
      listId: number;
      voterIds: number[];
      status: TurnoutStatus;
      note?: string;
    }) => {
      return api.bulkMarkTurnout({
        list_id: listId,
        voter_ids: voterIds,
        status,
        note,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.turnout.voters(variables.listId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.turnout.summary(variables.listId),
      });
    },
  });
}

// ============================================================================
// Elections / Candidates Hooks
// ============================================================================

/**
 * Fetch candidates for an election
 */
export function useCandidates(
  listId: number | undefined,
  filters?: CandidateFilters
) {
  return useQuery({
    queryKey: queryKeys.elections.candidates(listId!, filters),
    queryFn: () => api.getCandidates({ list_id: listId!, ...filters }),
    enabled: !!listId,
  });
}

// ============================================================================
// Polling Stations Hooks
// ============================================================================

/**
 * Fetch polling stations
 */
export function usePollingStations(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.polling.stations(listId!),
    queryFn: () => api.getPollingStations(listId!),
    enabled: !!listId,
  });
}

/**
 * Fetch polling booth statistics
 */
export function usePollingBoothStats(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.polling.boothStats(listId!),
    queryFn: () => api.getPollingBoothStats(listId!),
    enabled: !!listId,
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch data for better UX
 */
export function usePrefetchVoters() {
  const queryClient = useQueryClient();

  return (listId: number, filters: VoterFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.voters.list(listId, filters),
      queryFn: () =>
        api.getVoters(filters.page || 1, filters.per_page || 100, listId),
    });
  };
}

/**
 * Invalidate all data for a list (useful after bulk operations)
 */
export function useInvalidateListData() {
  const queryClient = useQueryClient();

  return (listId: number) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        // Invalidate any query that includes this listId
        return Array.isArray(key) && key.includes(listId);
      },
    });
  };
}
