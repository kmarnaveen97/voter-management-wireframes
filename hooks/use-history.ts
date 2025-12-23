/**
 * Sentiment History React Query Hooks
 *
 * Hooks for sentiment audit trail and history tracking.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { historyApi, type VoterHistoryResponse } from "@/lib/api";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch sentiment history for a voter
 */
export function useVoterSentimentHistory(
  listId: number | undefined,
  voterId: number | undefined,
  options?: Partial<UseQueryOptions<VoterHistoryResponse>>
) {
  return useQuery({
    queryKey: queryKeys.voters.history(listId!, voterId!),
    queryFn: () => historyApi.getVoterSentimentHistory(voterId!, listId),
    enabled: !!listId && !!voterId,
    ...options,
  });
}
