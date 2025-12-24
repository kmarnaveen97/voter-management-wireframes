"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VoterFilters } from "@/components/voters/voter-filters";
import { VoterTable } from "@/components/voters/voter-table";
import { OpponentSelectorDialog } from "@/components/voters/opponent-selector-dialog";
import { api, type Voter } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  FileDown,
  Printer,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Calculator,
  ThumbsUp,
  ThumbsDown,
  Minus,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  WifiOff,
  Wifi,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useDebounce } from "@/hooks/use-debounce";
import { useListContext } from "@/contexts/list-context";
import { toast } from "sonner";
import {
  type SentimentType,
  SENTIMENT_SHORTCUTS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

interface VoterFiltersState {
  ward_no?: string;
  min_age?: number;
  max_age?: number;
  gender?: string;
  house_no?: string;
}

// ============================================================================
// Custom Hooks (page-specific)
// ============================================================================

/**
 * Hook for fetching voters with filters, search, and pagination
 */
function useVotersQuery(
  listId: number | undefined,
  options: {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: VoterFiltersState;
    paginationEnabled: boolean;
  }
) {
  const { page, pageSize, searchQuery, filters, paginationEnabled } = options;
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Build query key that includes all variables affecting the result
  const queryKey = useMemo(() => {
    if (debouncedSearch) {
      return queryKeys.voters.search(listId!, debouncedSearch);
    }
    return queryKeys.voters.list(listId!, {
      page: paginationEnabled ? page : 1,
      per_page: paginationEnabled ? pageSize : 10000,
      ...filters,
    });
  }, [listId, debouncedSearch, page, pageSize, filters, paginationEnabled]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const effectivePage = paginationEnabled ? page : 1;
      const effectivePerPage = paginationEnabled ? pageSize : 10000;

      if (debouncedSearch) {
        const data = await api.searchVoters(debouncedSearch, listId, filters);
        return { voters: data.voters || [], total: data.total || 0 };
      }

      if (Object.keys(filters).length > 0) {
        const data = await api.filterVoters({
          ...filters,
          list_id: listId,
          page: effectivePage,
          per_page: effectivePerPage,
        });
        return { voters: data.voters || [], total: data.total || 0 };
      }

      const data = await api.getVoters(effectivePage, effectivePerPage, listId);
      return { voters: data.voters || [], total: data.total || 0 };
    },
    enabled: !!listId,
    placeholderData: (prev) => prev, // Keep showing previous data while fetching
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for fetching sentiment overview (total stats across all voters)
 */
function useSentimentOverview(listId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.warRoom.overview(listId ?? 0),
    queryFn: () => api.getSentimentOverview(listId!),
    enabled: !!listId,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for bulk tagging voters
 */
function useBulkTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      voterIds,
      sentiment,
      listId,
      candidateId,
    }: {
      voterIds: number[];
      sentiment: SentimentType;
      listId: number;
      candidateId?: number;
    }) => {
      return api.bulkTagVoters({
        voter_ids: voterIds,
        sentiment,
        list_id: listId,
        source: "manual",
        propagate_family: true,
        candidate_id: candidateId,
      });
    },
    onSuccess: (result, variables) => {
      // Invalidate all voter queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["voters"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["warRoom"] });

      const sentimentLabels: Record<SentimentType, string> = {
        support: "Support 👍",
        oppose: "Oppose 👎",
        swing: "Swing 🤷",
        unknown: "Unknown",
        neutral: "Neutral",
      };

      toast.success(
        `${result.tagged_count || variables.voterIds.length} voters marked as ${
          sentimentLabels[variables.sentiment]
        }`,
        {
          description: result.propagated_count
            ? `${result.propagated_count} family members also updated`
            : undefined,
        }
      );
    },
    onError: (error) => {
      console.error("Bulk tagging failed:", error);
      toast.error("Failed to tag voters", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Hook for quick tagging individual voters
 */
function useQuickTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      voterId,
      sentiment,
      listId,
      candidateId,
    }: {
      voterId: number;
      sentiment: SentimentType;
      listId: number;
      candidateId?: number;
    }) => {
      return api.bulkTagVoters({
        voter_ids: [voterId],
        sentiment,
        list_id: listId,
        source: "manual",
        propagate_family: false,
        candidate_id: candidateId,
      });
    },
    onSuccess: () => {
      // Only invalidate after mutation succeeds
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
    onError: () => {
      toast.error("Failed to tag voter");
    },
  });
}

/**
 * Hook for removing voter sentiment
 */
function useRemoveTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voterIds: number[]) => {
      const promises = voterIds.map((id) => api.removeVoterSentiment(id));
      return Promise.all(promises);
    },
    onSuccess: (_, voterIds) => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
      toast.success(`Removed tags from ${voterIds.length} voter(s)`);
    },
    onError: () => {
      toast.error("Failed to remove some tags");
    },
  });
}

/**
 * Hook for computing sentiments
 */
function useComputeSentimentsMutation(listId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!listId) throw new Error("No list selected");
      return api.computeSentiments({ list_id: listId });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Sentiments computed successfully", {
        description: `${result.computed_count} voters processed`,
      });
    },
    onError: () => {
      toast.error("Failed to compute sentiments");
    },
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default function VotersPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();
  const queryClient = useQueryClient();

  // Local UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<VoterFiltersState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [paginationEnabled, setPaginationEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("votersPagePaginationEnabled");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });

  // Opponent selector dialog state
  const [opponentDialogOpen, setOpponentDialogOpen] = useState(false);
  const [pendingOpposeVoterIds, setPendingOpposeVoterIds] = useState<number[]>(
    []
  );
  const [pendingOpposeType, setPendingOpposeType] = useState<"bulk" | "quick">(
    "bulk"
  );

  // React Query hooks
  const {
    data: votersData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useVotersQuery(selectedListId, {
    page: currentPage,
    pageSize,
    searchQuery,
    filters: activeFilters,
    paginationEnabled,
  });

  const bulkTagMutation = useBulkTagMutation();
  const quickTagMutation = useQuickTagMutation();
  const removeTagMutation = useRemoveTagMutation();
  const computeSentimentsMutation =
    useComputeSentimentsMutation(selectedListId);

  // Fetch our candidate (for support sentiment tagging)
  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", selectedListId],
    queryFn: () => api.getCandidates({ list_id: selectedListId! }),
    enabled: !!selectedListId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch sentiment overview (total stats across all voters)
  const { data: sentimentOverview, isLoading: overviewLoading } =
    useSentimentOverview(selectedListId);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Track data freshness
  useEffect(() => {
    if (votersData) {
      setLastUpdated(new Date());
    }
  }, [votersData]);

  // Toggle between page stats and total stats
  const [showTotalStats, setShowTotalStats] = useState(true);

  const ourCandidateId = useMemo(() => {
    const ourCandidate = candidatesData?.candidates?.find(
      (c) => c.is_our_candidate
    );
    return ourCandidate?.candidate_id ?? ourCandidate?.id ?? null;
  }, [candidatesData]);

  // Derived state
  const voters = votersData?.voters ?? [];
  const totalVoters = votersData?.total ?? 0;
  const totalPages = Math.ceil(totalVoters / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalVoters);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters, selectedListId]);

  // Persist pagination setting
  useEffect(() => {
    localStorage.setItem(
      "votersPagePaginationEnabled",
      String(paginationEnabled)
    );
  }, [paginationEnabled]);

  // Keyboard shortcuts for bulk tagging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        selectedIds.size === 0 ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const sentiment = SENTIMENT_SHORTCUTS[e.key];
      if (sentiment) {
        e.preventDefault();
        handleBulkTag(sentiment);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds]);

  // Handlers
  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize, 10));
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: VoterFiltersState) => {
    setActiveFilters(filters);
  };

  const handleReset = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  const handleBulkTag = useCallback(
    async (sentiment: SentimentType, candidateId?: number) => {
      if (selectedIds.size === 0) {
        toast.error("No voters selected");
        return;
      }

      const voterIds = Array.from(selectedIds)
        .map((id) => {
          const voter = voters.find(
            (v) => String(v.voter_id || v.serial_no) === id
          );
          return (
            voter?.voter_id ||
            (voter?.serial_no ? parseInt(voter.serial_no, 10) : undefined)
          );
        })
        .filter((id): id is number => id !== undefined && !isNaN(id));

      if (voterIds.length === 0) {
        toast.error("No valid voter IDs found");
        return;
      }

      if (!selectedListId) {
        toast.error("No list selected");
        return;
      }

      // For "oppose" sentiment without candidateId, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds(voterIds);
        setPendingOpposeType("bulk");
        setOpponentDialogOpen(true);
        return;
      }

      // For "support" sentiment, always use our candidate
      const effectiveCandidateId =
        sentiment === "support" ? ourCandidateId ?? undefined : candidateId;

      await bulkTagMutation.mutateAsync({
        voterIds,
        sentiment,
        listId: selectedListId,
        candidateId: effectiveCandidateId,
      });
      setSelectedIds(new Set());
    },
    [selectedIds, voters, bulkTagMutation, selectedListId, ourCandidateId]
  );

  const handleQuickTag = useCallback(
    async (voterId: number, sentiment: SentimentType, candidateId?: number) => {
      if (!selectedListId) {
        toast.error("No list selected");
        return;
      }

      // For "oppose" sentiment without candidateId, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds([voterId]);
        setPendingOpposeType("quick");
        setOpponentDialogOpen(true);
        return;
      }

      // For "support" sentiment, always use our candidate
      const effectiveCandidateId =
        sentiment === "support" ? ourCandidateId ?? undefined : candidateId;

      await quickTagMutation.mutateAsync({
        voterId,
        sentiment,
        listId: selectedListId,
        candidateId: effectiveCandidateId,
      });
      toast.success(`Voter tagged as ${sentiment}`);
    },
    [quickTagMutation, selectedListId, ourCandidateId]
  );

  // Handler for when opponent is selected from dialog
  const handleConfirmOppose = useCallback(
    async (candidateId: number) => {
      if (pendingOpposeType === "bulk") {
        // Re-call bulk tag with the selected candidate ID
        await handleBulkTag("oppose", candidateId);
      } else {
        // Re-call quick tag with the selected candidate ID
        if (pendingOpposeVoterIds.length > 0) {
          await handleQuickTag(pendingOpposeVoterIds[0], "oppose", candidateId);
        }
      }
      // Reset state
      setPendingOpposeVoterIds([]);
      setOpponentDialogOpen(false);
    },
    [pendingOpposeType, pendingOpposeVoterIds, handleBulkTag, handleQuickTag]
  );

  const handleBulkRemoveTag = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error("No voters selected");
      return;
    }

    const voterIds = Array.from(selectedIds)
      .map((id) => {
        const voter = voters.find(
          (v) => String(v.voter_id || v.serial_no) === id
        );
        return (
          voter?.voter_id ||
          (voter?.serial_no ? parseInt(voter.serial_no, 10) : undefined)
        );
      })
      .filter((id): id is number => id !== undefined && !isNaN(id));

    if (voterIds.length === 0) return;

    await removeTagMutation.mutateAsync(voterIds);
    setSelectedIds(new Set());
  }, [selectedIds, voters, removeTagMutation]);

  const handleQuickRemoveTag = useCallback(
    async (voterId: number) => {
      await removeTagMutation.mutateAsync([voterId]);
    },
    [removeTagMutation]
  );

  // Quick stats computed from current page results
  const pageStats = useMemo(() => {
    const maleCount = voters.filter(
      (v) =>
        v.gender?.toLowerCase() === "male" ||
        v.gender === "पु" ||
        v.gender?.toLowerCase() === "m"
    ).length;
    const femaleCount = voters.length - maleCount;
    const avgAge =
      voters.length > 0
        ? Math.round(
            voters.reduce((sum, v) => sum + (v.age || 0), 0) / voters.length
          )
        : 0;

    return {
      maleCount,
      femaleCount,
      avgAge,
      supportCount: voters.filter((v) => v.sentiment === "support").length,
      opposeCount: voters.filter((v) => v.sentiment === "oppose").length,
      neutralCount: voters.filter((v) => v.sentiment === "neutral").length,
      swingCount: voters.filter((v) => v.sentiment === "swing").length,
    };
  }, [voters]);

  // Total stats from sentiment overview API (all voters in list)
  const totalStats = useMemo(() => {
    const breakdown = sentimentOverview?.sentiment_breakdown;
    return {
      supportCount: breakdown?.support ?? 0,
      opposeCount: breakdown?.oppose ?? 0,
      neutralCount: breakdown?.neutral ?? 0,
      swingCount: breakdown?.swing ?? 0,
      unknownCount: breakdown?.unknown ?? 0,
    };
  }, [sentimentOverview]);

  // Use either page stats or total stats based on toggle
  const stats = showTotalStats ? totalStats : pageStats;
  const statsTotal = showTotalStats
    ? sentimentOverview?.total_voters ?? totalVoters
    : voters.length;

  const isBusy =
    bulkTagMutation.isPending ||
    removeTagMutation.isPending ||
    computeSentimentsMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Voters
              {isFetching && !isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </h1>
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {isOnline && error && (
              <Badge
                variant="outline"
                className="gap-1 text-yellow-600 border-yellow-600"
              >
                <AlertCircle className="h-3 w-3" />
                Connection Issues
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalVoters.toLocaleString()} total
            {voters.length !== totalVoters && voters.length > 0 && (
              <span className="text-primary">
                {" "}
                • Showing {voters.length.toLocaleString()}
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs ml-2">
                • Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Advanced Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => computeSentimentsMutation.mutate()}
                disabled={
                  computeSentimentsMutation.isPending ||
                  !selectedListId ||
                  !isOnline
                }
              >
                <Calculator className="h-4 w-4 mr-2" />
                {computeSentimentsMutation.isPending
                  ? "Computing..."
                  : "Compute Sentiments"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => refetch()} disabled={!isOnline}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      {!isLoading && voters.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Male:</span>
            <span className="font-medium">{stats.maleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            <span className="text-muted-foreground">Female:</span>
            <span className="font-medium">{stats.femaleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Avg Age:</span>
            <span className="font-medium">{stats.avgAge}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {error instanceof Error ? error.message : "Failed to load voters"}
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, house no, ward... (Hindi supported)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <VoterFilters onFilterChange={handleFilterChange} onReset={handleReset} />

      {/* Sentiment Stats Cards */}
      {!isLoading && voters.length > 0 && (
        <div className="space-y-3">
          {/* Toggle between page stats and total stats */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {showTotalStats ? (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  All Voters Stats (
                  {sentimentOverview?.total_voters?.toLocaleString() ??
                    "..."}{" "}
                  total)
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Current Page Stats ({voters.length.toLocaleString()} shown)
                </span>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTotalStats(!showTotalStats)}
              className="gap-2"
              disabled={overviewLoading}
            >
              {showTotalStats ? (
                <>
                  <ToggleRight className="h-4 w-4" />
                  <span className="hidden sm:inline">Show Page Stats</span>
                  <span className="sm:hidden">Page</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Show All Stats</span>
                  <span className="sm:hidden">All</span>
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SentimentCard
              icon={ThumbsUp}
              label="Support"
              count={stats.supportCount}
              total={statsTotal}
              color="green"
            />
            <SentimentCard
              icon={ThumbsDown}
              label="Oppose"
              count={stats.opposeCount}
              total={statsTotal}
              color="red"
            />
            <SentimentCard
              icon={TrendingUp}
              label="Swing"
              count={stats.swingCount}
              total={statsTotal}
              color="amber"
            />
            <SentimentCard
              icon={Minus}
              label="Neutral"
              count={stats.neutralCount}
              total={statsTotal}
              color="gray"
            />
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalVoters > 0 && paginationEnabled && !isLoading && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalVoters={totalVoters}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Table */}
      {isLoading || listLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <VoterTable
          voters={voters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkTag={handleBulkTag}
          onBulkRemoveTag={handleBulkRemoveTag}
          onQuickTag={handleQuickTag}
          onQuickRemoveTag={handleQuickRemoveTag}
          isBulkTagging={isBusy}
          totalMatchingVoters={totalVoters}
        />
      )}

      {/* Bottom Pagination */}
      {totalVoters > 0 && paginationEnabled && !isLoading && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalVoters={totalVoters}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Opponent Selector Dialog */}
      <OpponentSelectorDialog
        open={opponentDialogOpen}
        onOpenChange={(open) => {
          setOpponentDialogOpen(open);
          if (!open) {
            setPendingOpposeVoterIds([]);
          }
        }}
        onSelect={handleConfirmOppose}
        voterCount={pendingOpposeVoterIds.length}
        title={
          pendingOpposeVoterIds.length > 1
            ? `Tag ${pendingOpposeVoterIds.length} voters as opposing`
            : "Tag voter as opposing"
        }
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SentimentCard({
  icon: Icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  total: number;
  color: "green" | "red" | "amber" | "gray";
}) {
  const colorClasses = {
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
    gray: "text-gray-600",
  };

  return (
    <Card>
      <CardHeader className="pb-3 p-4">
        <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${colorClasses[color]}`} />
          {label}
        </CardDescription>
        <CardTitle className={`text-2xl sm:text-3xl ${colorClasses[color]}`}>
          {count.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground p-4 pt-0">
        {total > 0 ? ((count / total) * 100).toFixed(1) : 0}% of total
      </CardContent>
    </Card>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalVoters,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalVoters: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4 border-t sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
        <div className="text-xs text-muted-foreground sm:hidden">
          {startIndex}-{endIndex} of {totalVoters}
        </div>
      </div>

      <div className="hidden sm:block text-sm text-muted-foreground">
        Showing {startIndex.toLocaleString()} - {endIndex.toLocaleString()} of{" "}
        {totalVoters.toLocaleString()} voters
      </div>

      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          <span className="text-sm text-muted-foreground">Page</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value, 10);
              if (!isNaN(page) && page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            className="h-8 w-16 text-center text-sm"
          />
          <span className="text-sm text-muted-foreground">of {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
