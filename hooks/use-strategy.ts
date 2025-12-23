/**
 * Strategy Engine React Query Hooks
 *
 * Provides hooks for executing strategy commands
 * and managing command history.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useListContext } from "@/contexts/list-context";
import {
  executeStrategyCommand,
  parseCommand,
  isStrategyError,
  type StrategyResponse,
  type StrategyErrorResponse,
  type ParsedCommand,
  type WardResponse,
  type BoothResponse,
  type FamilyResponse,
  type SwingResponse,
  type SentimentResponse,
  type TurnoutResponse,
  type DDayResponse,
  type CompareResponse,
  type MessageResponse,
} from "@/lib/api/strategy";

// ============================================================
// QUERY KEYS
// ============================================================

export const strategyKeys = {
  all: ["strategy"] as const,
  command: (cmd: string, listId?: number) => ["strategy", cmd, listId] as const,
  ward: (wardNo: string, listId?: number) =>
    ["strategy", "ward", wardNo, listId] as const,
  booth: (boothNo: string, listId?: number) =>
    ["strategy", "booth", boothNo, listId] as const,
  family: (familyId: string, listId?: number) =>
    ["strategy", "family", familyId, listId] as const,
  swing: (scope: string, listId?: number) =>
    ["strategy", "swing", scope, listId] as const,
  sentiment: (listId?: number) => ["strategy", "sentiment", listId] as const,
  turnout: (wardNo: string, listId?: number) =>
    ["strategy", "turnout", wardNo, listId] as const,
  dday: (listId?: number) => ["strategy", "dday", listId] as const,
};

// ============================================================
// COMMAND HISTORY HOOK
// ============================================================

export interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  response?: StrategyResponse | StrategyErrorResponse;
}

export function useCommandHistory(maxHistory: number = 50) {
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback(
    (item: Omit<CommandHistoryItem, "id" | "timestamp">) => {
      const newItem: CommandHistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setHistory((prev) => [newItem, ...prev].slice(0, maxHistory));
      setHistoryIndex(-1);
    },
    [maxHistory]
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down"): string | null => {
      if (history.length === 0) return null;

      let newIndex: number;
      if (direction === "up") {
        newIndex = Math.min(historyIndex + 1, history.length - 1);
      } else {
        newIndex = Math.max(historyIndex - 1, -1);
      }

      setHistoryIndex(newIndex);
      return newIndex >= 0 ? history[newIndex].command : null;
    },
    [history, historyIndex]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    addToHistory,
    navigateHistory,
    clearHistory,
    currentIndex: historyIndex,
  };
}

// ============================================================
// MAIN STRATEGY HOOK
// ============================================================

export function useStrategy() {
  const { selectedListId } = useListContext();
  const queryClient = useQueryClient();
  const { history, addToHistory, navigateHistory, clearHistory } =
    useCommandHistory();

  const executeMutation = useMutation({
    mutationFn: async (command: string) => {
      const result = await executeStrategyCommand(
        command,
        selectedListId ?? undefined
      );
      return { command, result };
    },
    onSuccess: ({ command, result }) => {
      addToHistory({
        command,
        success: !isStrategyError(result),
        response: result,
      });

      // Cache the result for specific queries
      const parsed = parseCommand(command);
      if (parsed && !isStrategyError(result)) {
        const cacheKey = getCacheKeyForCommand(
          parsed,
          selectedListId ?? undefined
        );
        if (cacheKey) {
          queryClient.setQueryData(cacheKey, result);
        }
      }
    },
    onError: (error, command) => {
      addToHistory({
        command,
        success: false,
        response: {
          success: false,
          error: "Mutation Error",
          message: error instanceof Error ? error.message : "Unknown error",
          code: "MUTATION_ERROR",
        },
      });
    },
  });

  const execute = useCallback(
    async (command: string) => {
      return executeMutation.mutateAsync(command);
    },
    [executeMutation]
  );

  return {
    execute,
    isLoading: executeMutation.isPending,
    lastResult: executeMutation.data?.result,
    lastCommand: executeMutation.data?.command,
    error: executeMutation.error,
    history,
    navigateHistory,
    clearHistory,
    reset: executeMutation.reset,
  };
}

// ============================================================
// SPECIFIC COMMAND HOOKS
// ============================================================

/**
 * Hook for ward analysis
 */
export function useWardAnalysis(
  wardNo: string,
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.ward(wardNo, selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<WardResponse["data"]>(
        `/ward ${wardNo}`,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as WardResponse;
    },
    enabled: options?.enabled !== false && !!wardNo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for booth analysis
 */
export function useBoothAnalysis(
  boothNo: string,
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.booth(boothNo, selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<BoothResponse["data"]>(
        `/booth ${boothNo}`,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as BoothResponse;
    },
    enabled: options?.enabled !== false && !!boothNo,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for family analysis
 */
export function useFamilyAnalysis(
  familyId: string,
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.family(familyId, selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<FamilyResponse["data"]>(
        `/family ${familyId}`,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as FamilyResponse;
    },
    enabled: options?.enabled !== false && !!familyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for swing voter analysis
 */
export function useSwingAnalysis(
  scope: { ward?: string; booth?: string },
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();
  const command = scope.ward
    ? `/swing ward ${scope.ward}`
    : scope.booth
    ? `/swing booth ${scope.booth}`
    : null;

  const scopeKey = scope.ward || scope.booth || "";

  return useQuery({
    queryKey: strategyKeys.swing(scopeKey, selectedListId ?? undefined),
    queryFn: async () => {
      if (!command) throw new Error("Ward or booth required");
      const result = await executeStrategyCommand<SwingResponse["data"]>(
        command,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as SwingResponse;
    },
    enabled: options?.enabled !== false && !!command,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for sentiment report
 */
export function useSentimentReport(options?: { enabled?: boolean }) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.sentiment(selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<SentimentResponse["data"]>(
        "/sentiment report",
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as SentimentResponse;
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for turnout prediction
 */
export function useTurnoutPrediction(
  wardNo: string,
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.turnout(wardNo, selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<TurnoutResponse["data"]>(
        `/turnout predict ${wardNo}`,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as TurnoutResponse;
    },
    enabled: options?.enabled !== false && !!wardNo,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for D-Day monitoring (election day)
 */
export function useDDayMonitoring(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: strategyKeys.dday(selectedListId ?? undefined),
    queryFn: async () => {
      const result = await executeStrategyCommand<DDayResponse["data"]>(
        "/dday",
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as DDayResponse;
    },
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds for live data
    refetchInterval: options?.refetchInterval ?? 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook for list comparison
 */
export function useListComparison(
  listA: number,
  listB: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["strategy", "compare", listA, listB],
    queryFn: async () => {
      const result = await executeStrategyCommand<CompareResponse["data"]>(
        `/compare ${listA} ${listB}`
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as CompareResponse;
    },
    enabled: options?.enabled !== false && !!listA && !!listB,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for message templates
 */
export function useMessageTemplates(
  type: "caste" | "sentiment" | "ward",
  param: string,
  options?: { enabled?: boolean }
) {
  const { selectedListId } = useListContext();

  return useQuery({
    queryKey: ["strategy", "message", type, param, selectedListId],
    queryFn: async () => {
      const result = await executeStrategyCommand<MessageResponse["data"]>(
        `/message ${type} ${param}`,
        selectedListId ?? undefined
      );
      if (isStrategyError(result)) {
        throw new Error(result.message);
      }
      return result as MessageResponse;
    },
    enabled: options?.enabled !== false && !!param,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================================
// HELPERS
// ============================================================

function getCacheKeyForCommand(
  parsed: ParsedCommand,
  listId?: number
): readonly unknown[] | null {
  switch (parsed.command) {
    case "ward":
      return parsed.params[0]
        ? strategyKeys.ward(parsed.params[0], listId)
        : null;
    case "booth":
      return parsed.params[0]
        ? strategyKeys.booth(parsed.params[0], listId)
        : null;
    case "family":
      return parsed.params[0]
        ? strategyKeys.family(parsed.params[0], listId)
        : null;
    case "sentiment":
      return strategyKeys.sentiment(listId);
    case "dday":
      return strategyKeys.dday(listId);
    default:
      return null;
  }
}
