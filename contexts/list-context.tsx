"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type VoterList } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";

interface ListContextType {
  availableLists: VoterList[];
  selectedListId: number | undefined;
  setSelectedListId: (id: number) => void;
  isLoading: boolean;
  error: Error | null;
  currentList: VoterList | undefined;
  refreshLists: () => Promise<void>;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export function ListProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedListId, setSelectedListIdState] = useState<number | undefined>(
    undefined
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Use React Query for fetching lists - automatic caching and deduplication
  const {
    data: listsData,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: () => api.getVoterLists(),
    staleTime: 5 * 60 * 1000, // Lists don't change often
    gcTime: 10 * 60 * 1000,
  });

  const availableLists = listsData?.lists ?? [];

  // Initialize selected list from localStorage or first available
  useEffect(() => {
    if (isInitialized || queryLoading) return;

    const savedListId = localStorage.getItem("selectedListId");
    if (
      savedListId &&
      availableLists.some((l) => l.list_id === Number(savedListId))
    ) {
      setSelectedListIdState(Number(savedListId));
    } else if (availableLists.length > 0) {
      setSelectedListIdState(availableLists[0].list_id);
    }
    setIsInitialized(true);
  }, [availableLists, queryLoading, isInitialized]);

  // Refresh lists and handle selection if current is gone
  const refreshLists = useCallback(async () => {
    const result = await refetch();
    const lists = result.data?.lists ?? [];

    // If current selection no longer exists, select first available
    if (selectedListId && !lists.some((l) => l.list_id === selectedListId)) {
      if (lists.length > 0) {
        setSelectedListIdState(lists[0].list_id);
        localStorage.setItem("selectedListId", String(lists[0].list_id));
      } else {
        setSelectedListIdState(undefined);
        localStorage.removeItem("selectedListId");
      }
    }
  }, [refetch, selectedListId]);

  // Save selection to localStorage and prefetch data for new list
  const setSelectedListId = useCallback(
    (id: number) => {
      setSelectedListIdState(id);
      localStorage.setItem("selectedListId", String(id));

      // Prefetch commonly needed data for the new list (only if not in cache)
      queryClient.prefetchQuery({
        queryKey: queryKeys.stats.overview(id),
        queryFn: () => api.getStats(id),
        staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
      });
    },
    [queryClient]
  );

  const currentList = availableLists.find((l) => l.list_id === selectedListId);

  return (
    <ListContext.Provider
      value={{
        availableLists,
        selectedListId,
        setSelectedListId,
        isLoading: queryLoading || !isInitialized,
        error: error as Error | null,
        currentList,
        refreshLists,
      }}
    >
      {children}
    </ListContext.Provider>
  );
}

export function useListContext() {
  const context = useContext(ListContext);
  if (context === undefined) {
    throw new Error("useListContext must be used within a ListProvider");
  }
  return context;
}
