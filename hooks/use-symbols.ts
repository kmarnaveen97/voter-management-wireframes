/**
 * Election Symbols React Query Hooks
 *
 * Hooks for fetching and searching election symbols.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as symbolsApi from "@/lib/api/symbols";
import type {
  ElectionSymbol,
  SymbolsResponse,
  SymbolDetailResponse,
  SymbolSearchResponse,
} from "@/lib/api/symbols";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch all election symbols
 */
export function useElectionSymbols(
  lang?: "hi" | "en",
  options?: Partial<UseQueryOptions<SymbolsResponse>>
) {
  return useQuery({
    queryKey: queryKeys.symbols.all(lang),
    queryFn: () => symbolsApi.getAllSymbols(lang),
    staleTime: 10 * 60 * 1000, // Symbols rarely change
    ...options,
  });
}

/**
 * Fetch a specific symbol by ID
 */
export function useSymbol(
  symbolId: number | undefined,
  options?: Partial<UseQueryOptions<SymbolDetailResponse>>
) {
  return useQuery({
    queryKey: queryKeys.symbols.detail(symbolId!),
    queryFn: () => symbolsApi.getSymbol(symbolId!),
    enabled: !!symbolId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Search symbols by name
 */
export function useSymbolSearch(
  query: string,
  options?: Partial<UseQueryOptions<SymbolSearchResponse>>
) {
  return useQuery({
    queryKey: queryKeys.symbols.search(query),
    queryFn: () => symbolsApi.searchSymbols(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
    ...options,
  });
}
