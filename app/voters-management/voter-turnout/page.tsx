"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VoterFilters } from "@/components/voters/voter-filters";
import { TurnoutTable } from "@/components/voters/turnout-table";
import { api, type Voter, type TurnoutStatus } from "@/lib/api";
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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  FileDown,
  Printer,
  AlertCircle,
  RefreshCw,
  Loader2,
  Vote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Home as HomeIcon,
  Check,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useListContext } from "@/contexts/list-context";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

// Keyboard shortcuts for bulk turnout marking
const BULK_TURNOUT_SHORTCUTS: Record<string, TurnoutStatus> = {
  "1": "will_vote",
  "2": "wont_vote",
  "3": "unsure",
  "4": "not_home",
  "5": "already_voted",
};

const TURNOUT_LABELS: Record<TurnoutStatus, string> = {
  will_vote: "Will Vote",
  wont_vote: "Won't Vote",
  unsure: "Unsure",
  not_home: "Not Home",
  already_voted: "Already Voted",
  needs_transport: "Needs Transport",
  migrated: "Migrated",
  deceased: "Deceased",
  invalid: "Invalid",
};

// =============================================================================
// Types
// =============================================================================

interface VoterFiltersState {
  ward_no?: string;
  min_age?: number;
  max_age?: number;
  gender?: string;
  house_no?: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function TurnoutLoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="h-10 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="border rounded-lg p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded mb-2" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Turnout Stats Cards
// =============================================================================

function TurnoutStatsCards({
  voters,
  totalVoters,
}: {
  voters: Voter[];
  totalVoters: number;
}) {
  const willVoteCount = voters.filter(
    (v) => v.turnout_status === "will_vote"
  ).length;
  const wontVoteCount = voters.filter(
    (v) => v.turnout_status === "wont_vote"
  ).length;
  const alreadyVotedCount = voters.filter(
    (v) => v.turnout_status === "already_voted"
  ).length;
  const unsureCount = voters.filter(
    (v) => v.turnout_status === "unsure"
  ).length;
  const notHomeCount = voters.filter(
    (v) => v.turnout_status === "not_home"
  ).length;

  const stats = [
    {
      label: "Will Vote",
      count: willVoteCount,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Already Voted",
      count: alreadyVotedCount,
      icon: Check,
      color: "text-blue-600",
    },
    {
      label: "Won't Vote",
      count: wontVoteCount,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      label: "Unsure",
      count: unsureCount,
      icon: HelpCircle,
      color: "text-amber-600",
    },
    {
      label: "Not Home",
      count: notHomeCount,
      icon: HomeIcon,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map(({ label, count, icon: Icon, color }) => (
        <Card key={label}>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              {label}
            </CardDescription>
            <CardTitle className={`text-3xl ${color}`}>
              {count.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalVoters > 0 ? ((count / totalVoters) * 100).toFixed(1) : 0}% of
            total
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function VoterTurnoutPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();
  const queryClient = useQueryClient();

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<VoterFiltersState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNoteDialogOpen, setBulkNoteDialogOpen] = useState(false);
  const [bulkNoteStatus, setBulkNoteStatus] = useState<TurnoutStatus | null>(
    null
  );
  const [bulkNote, setBulkNote] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 500);

  // ==========================================================================
  // React Query - Fetch Voters
  // ==========================================================================

  const votersQueryKey = queryKeys.voters.list(selectedListId!, {
    page: currentPage,
    per_page: pageSize,
    search: debouncedSearch || undefined,
    ...activeFilters,
  });

  const {
    data: votersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: votersQueryKey,
    queryFn: async () => {
      if (debouncedSearch) {
        return api.searchVoters(debouncedSearch, selectedListId);
      }
      if (Object.keys(activeFilters).length > 0) {
        return api.filterVoters({
          ...activeFilters,
          list_id: selectedListId,
          page: currentPage,
          per_page: pageSize,
        });
      }
      return api.getVoters(currentPage, pageSize, selectedListId);
    },
    enabled: !!selectedListId && !listLoading,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const voters = votersData?.voters ?? [];
  const totalVoters = votersData?.total ?? 0;
  const totalPages = Math.ceil(totalVoters / pageSize);

  // ==========================================================================
  // React Query - Mutations
  // ==========================================================================

  // Quick mark turnout mutation
  const quickMarkMutation = useMutation({
    mutationFn: async ({
      voterId,
      status,
      note,
    }: {
      voterId: number;
      status: TurnoutStatus;
      note?: string;
    }) => {
      return api.markTurnout({
        list_id: selectedListId!,
        voter_id: voterId,
        status,
        note,
        source: "quick_mark",
      });
    },
    onMutate: async ({ voterId, status, note }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: votersQueryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(votersQueryKey);

      // Optimistically update
      queryClient.setQueryData(votersQueryKey, (old: typeof votersData) => {
        if (!old) return old;
        return {
          ...old,
          voters: old.voters.map((v: Voter) =>
            v.voter_id === voterId || parseInt(v.serial_no, 10) === voterId
              ? {
                  ...v,
                  turnout_status: status,
                  turnout_note: note || null,
                  turnout_marked_at: new Date().toISOString(),
                }
              : v
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(votersQueryKey, context.previousData);
      }
      toast.error("Failed to mark turnout");
    },
    onSuccess: (_, { status }) => {
      toast.success(`Marked as ${TURNOUT_LABELS[status]}`);
    },
  });

  // Bulk mark turnout mutation
  const bulkMarkMutation = useMutation({
    mutationFn: async ({
      voterIds,
      status,
      note,
    }: {
      voterIds: number[];
      status: TurnoutStatus;
      note?: string;
    }) => {
      return api.bulkMarkTurnout({
        list_id: selectedListId!,
        voter_ids: voterIds,
        status,
        note,
        source: "bulk_turnout",
      });
    },
    onMutate: async ({ voterIds, status, note }) => {
      await queryClient.cancelQueries({ queryKey: votersQueryKey });
      const previousData = queryClient.getQueryData(votersQueryKey);

      queryClient.setQueryData(votersQueryKey, (old: typeof votersData) => {
        if (!old) return old;
        return {
          ...old,
          voters: old.voters.map((v: Voter) => {
            const id = v.voter_id || parseInt(v.serial_no, 10);
            if (voterIds.includes(id)) {
              return {
                ...v,
                turnout_status: status,
                turnout_note: note || null,
                turnout_marked_at: new Date().toISOString(),
              };
            }
            return v;
          }),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(votersQueryKey, context.previousData);
      }
      toast.error("Failed to mark turnout", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    },
    onSuccess: (result, { status }) => {
      toast.success(
        `${result.data.marked_count} voters marked as ${TURNOUT_LABELS[status]}`
      );
      setSelectedIds(new Set());
      setBulkNoteDialogOpen(false);
      setBulkNote("");
    },
  });

  // Compute sentiments mutation
  const computeSentimentsMutation = useMutation({
    mutationFn: () => api.computeSentiments({ list_id: selectedListId! }),
    onSuccess: (result) => {
      toast.success("Sentiments computed successfully", {
        description: `${result.computed_count} voters processed`,
      });
      refetch();
    },
    onError: () => {
      toast.error("Failed to compute sentiments");
    },
  });

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleFilterChange = useCallback((filters: VoterFiltersState) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setActiveFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newSize: string) => {
    setPageSize(parseInt(newSize, 10));
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages]
  );

  const openBulkNoteDialog = useCallback((status: TurnoutStatus) => {
    setBulkNoteStatus(status);
    setBulkNote("");
    setBulkNoteDialogOpen(true);
  }, []);

  const handleBulkMarkTurnout = useCallback(
    (status: TurnoutStatus, note?: string) => {
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

      bulkMarkMutation.mutate({ voterIds, status, note });
    },
    [selectedIds, voters, bulkMarkMutation]
  );

  const handleQuickMarkTurnout = useCallback(
    async (voterId: number, status: TurnoutStatus, note?: string) => {
      await quickMarkMutation.mutateAsync({ voterId, status, note });
    },
    [quickMarkMutation]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        selectedIds.size === 0 ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const status = BULK_TURNOUT_SHORTCUTS[e.key];
      if (status) {
        e.preventDefault();
        openBulkNoteDialog(status);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, openBulkNoteDialog]);

  // ==========================================================================
  // Derived State
  // ==========================================================================

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
  const markedCount = voters.filter((v) => v.turnout_status != null).length;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalVoters);

  // ==========================================================================
  // Render
  // ==========================================================================

  if (isLoading || listLoading) {
    return <TurnoutLoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Vote className="h-5 w-5 text-muted-foreground" />
            Voter Turnout
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalVoters.toLocaleString()} total voters
            {voters.length !== totalVoters && voters.length > 0 && (
              <span className="text-primary">
                {" "}
                • Showing {voters.length.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Advanced Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => computeSentimentsMutation.mutate()}
                disabled={
                  computeSentimentsMutation.isPending || !selectedListId
                }
              >
                <Calculator className="h-4 w-4 mr-2" />
                {computeSentimentsMutation.isPending
                  ? "Computing..."
                  : "Compute Sentiments"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      {voters.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Male:</span>
            <span className="font-medium">{maleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            <span className="text-muted-foreground">Female:</span>
            <span className="font-medium">{femaleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Avg Age:</span>
            <span className="font-medium">{avgAge}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {error instanceof Error
                ? error.message
                : "Unable to fetch voters."}
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

      {/* Turnout Status Cards */}
      {voters.length > 0 && (
        <TurnoutStatsCards voters={voters} totalVoters={totalVoters} />
      )}

      {/* Turnout Summary */}
      {voters.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription>Turnout Tracking Progress</CardDescription>
            <CardTitle className="text-2xl">
              {markedCount.toLocaleString()} / {totalVoters.toLocaleString()}{" "}
              Marked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {totalVoters > 0
                    ? ((markedCount / totalVoters) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${
                      totalVoters > 0 ? (markedCount / totalVoters) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              {selectedIds.size > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(
                    [
                      "will_vote",
                      "wont_vote",
                      "unsure",
                      "not_home",
                      "already_voted",
                    ] as const
                  ).map((status, idx) => {
                    const icons = {
                      will_vote: CheckCircle2,
                      wont_vote: XCircle,
                      unsure: HelpCircle,
                      not_home: HomeIcon,
                      already_voted: Check,
                    };
                    const Icon = icons[status];
                    return (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        onClick={() => openBulkNoteDialog(status)}
                        disabled={bulkMarkMutation.isPending}
                        className="gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {TURNOUT_LABELS[status]} ({idx + 1})
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <TurnoutTable
        voters={voters}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onMarkTurnout={handleQuickMarkTurnout}
        totalMatchingVoters={totalVoters}
      />

      {/* Pagination */}
      {totalVoters > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
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

          <div className="text-sm text-muted-foreground">
            Showing {startIndex.toLocaleString()} - {endIndex.toLocaleString()}{" "}
            of {totalVoters.toLocaleString()} voters
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
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
                    goToPage(page);
                  }
                }}
                className="h-8 w-16 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">
                of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Note Dialog */}
      <Dialog open={bulkNoteDialogOpen} onOpenChange={setBulkNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for Bulk Turnout</DialogTitle>
            <DialogDescription>
              Marking {selectedIds.size} voter(s) as{" "}
              {bulkNoteStatus && (
                <span className="font-medium">
                  {TURNOUT_LABELS[bulkNoteStatus]}
                </span>
              )}
              . Add an optional note below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-note">Note (optional)</Label>
            <Textarea
              id="bulk-note"
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              placeholder="Add a note about this turnout marking..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkNoteDialogOpen(false);
                setBulkNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkNoteStatus) {
                  handleBulkMarkTurnout(bulkNoteStatus, bulkNote || undefined);
                }
              }}
              disabled={bulkMarkMutation.isPending}
            >
              {bulkMarkMutation.isPending ? "Marking..." : "Mark Turnout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
