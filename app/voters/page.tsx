"use client";

import { useEffect, useState, useCallback } from "react";
import { VoterFilters } from "@/components/voters/voter-filters";
import { VoterTable } from "@/components/voters/voter-table";
import { OpponentSelectorDialog } from "@/components/voters/opponent-selector-dialog";
import { api, type Voter, type SentimentType } from "@/lib/api";
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
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useListContext } from "@/contexts/list-context";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

// Keyboard shortcuts for bulk tagging
const BULK_TAG_SHORTCUTS: Record<string, SentimentType> = {
  "1": "support",
  "2": "oppose",
  "3": "swing",
  "4": "neutral",
};

export default function VotersPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalVoters, setTotalVoters] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    ward_no?: string;
    min_age?: number;
    max_age?: number;
    gender?: string;
    house_no?: string;
  }>({});
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Pagination calculations
  const totalPages = Math.ceil(totalVoters / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalVoters);

  // Bulk tagging state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagging, setIsBulkTagging] = useState(false);

  // Opponent selector dialog state
  const [opponentDialogOpen, setOpponentDialogOpen] = useState(false);
  const [pendingOpposeVoterIds, setPendingOpposeVoterIds] = useState<number[]>(
    []
  );
  const [pendingOpposeType, setPendingOpposeType] = useState<"bulk" | "quick">(
    "bulk"
  );

  const fetchVoters = useCallback(
    async (page: number, listId?: number, perPage: number = pageSize) => {
      try {
        setLoading(true);
        setError(null);

        let data;
        if (debouncedSearch) {
          // Search within the selected list only
          data = await api.searchVoters(debouncedSearch, listId);
        } else if (Object.keys(activeFilters).length > 0) {
          data = await api.filterVoters({
            ...activeFilters,
            list_id: listId,
            page,
            per_page: perPage,
          });
        } else {
          data = await api.getVoters(page, perPage, listId);
        }

        const newVoters = data.voters || [];
        setVoters(newVoters);
        setTotalVoters(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch voters:", err);
        setError("Unable to fetch voters. Please check your API connection.");
        setVoters([]);
        setTotalVoters(0);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, activeFilters, pageSize]
  );

  useEffect(() => {
    if (selectedListId && !listLoading) {
      setCurrentPage(1);
      fetchVoters(1, selectedListId, pageSize);
    }
  }, [selectedListId, listLoading, debouncedSearch, activeFilters, pageSize]);

  // Handle page change
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      fetchVoters(page, selectedListId, pageSize);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages, selectedListId, pageSize, fetchVoters]
  );

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: {
    ward_no?: string;
    min_age?: number;
    max_age?: number;
    gender?: string;
    house_no?: string;
  }) => {
    setActiveFilters(filters);
  };

  const handleReset = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  // Bulk tagging handler
  const handleBulkTag = useCallback(
    async (sentiment: SentimentType, candidateId?: number) => {
      if (selectedIds.size === 0) {
        toast.error("No voters selected");
        return;
      }

      if (!selectedListId) {
        toast.error("No voter list selected");
        return;
      }

      // Get voter_ids from selected IDs
      const voterIds = Array.from(selectedIds)
        .map((id) => {
          const voter = voters.find(
            (v) => String(v.voter_id || v.serial_no) === id
          );
          // Use voter_id if available, otherwise try to parse serial_no as number
          return (
            voter?.voter_id ||
            (voter?.serial_no ? parseInt(voter.serial_no, 10) : undefined)
          );
        })
        .filter((id): id is number => id !== undefined && !isNaN(id));

      if (voterIds.length === 0) {
        toast.error("No valid voter IDs found", {
          description: "Selected voters may not have valid IDs",
        });
        return;
      }

      // For "oppose" sentiment, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds(voterIds);
        setPendingOpposeType("bulk");
        setOpponentDialogOpen(true);
        return;
      }

      setIsBulkTagging(true);

      const sentimentLabels: Record<SentimentType, string> = {
        support: "Support 👍",
        oppose: "Oppose 👎",
        swing: "Swing 🤷",
        unknown: "Unknown",
        neutral: "Neutral",
      };

      try {
        const result = await api.bulkTagVoters({
          voter_ids: voterIds,
          sentiment,
          list_id: selectedListId,
          propagate_family: true,
          candidate_id: candidateId, // Pass opponent candidate for "oppose"
        });

        toast.success(
          `${result.tagged_count || voterIds.length} voters marked as ${
            sentimentLabels[sentiment]
          }`,
          {
            description: result.propagated_count
              ? `${result.propagated_count} family members also updated`
              : undefined,
          }
        );

        // Update local voter state with the new sentiment (for immediate highlighting)
        setVoters((prevVoters) =>
          prevVoters.map((voter) => {
            const voterId = voter.voter_id || parseInt(voter.serial_no, 10);
            if (voterIds.includes(voterId)) {
              return {
                ...voter,
                sentiment,
                sentiment_source: "manual" as const,
              };
            }
            return voter;
          })
        );

        // Clear selection after successful tagging
        setSelectedIds(new Set());
      } catch (err) {
        console.error("Bulk tagging failed:", err);
        toast.error("Failed to tag voters", {
          description:
            err instanceof Error
              ? err.message
              : "Please try again or contact support",
        });
      } finally {
        setIsBulkTagging(false);
      }
    },
    [selectedIds, voters, selectedListId]
  );

  // Quick tag handler for individual voters (from table row hover)
  const handleQuickTag = useCallback(
    async (voterId: number, sentiment: SentimentType, candidateId?: number) => {
      if (!selectedListId) {
        toast.error("No voter list selected");
        return;
      }

      // For "oppose" sentiment, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds([voterId]);
        setPendingOpposeType("quick");
        setOpponentDialogOpen(true);
        return;
      }

      const sentimentLabels: Record<SentimentType, string> = {
        support: "Support 👍",
        oppose: "Oppose 👎",
        swing: "Swing 🤷",
        unknown: "Unknown",
        neutral: "Neutral",
      };

      try {
        await api.bulkTagVoters({
          voter_ids: [voterId],
          sentiment,
          list_id: selectedListId,
          propagate_family: true,
          candidate_id: candidateId, // Pass opponent candidate for "oppose"
        });

        // Update local state
        setVoters((prevVoters) =>
          prevVoters.map((voter) => {
            if (
              voter.voter_id === voterId ||
              parseInt(voter.serial_no, 10) === voterId
            ) {
              return {
                ...voter,
                sentiment,
                sentiment_source: "manual" as const,
              };
            }
            return voter;
          })
        );

        toast.success(`Voter tagged as ${sentimentLabels[sentiment]}`);
      } catch (err) {
        console.error("Quick tag failed:", err);
        toast.error("Failed to tag voter");
      }
    },
    [selectedListId]
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

  // Keyboard shortcuts for bulk tagging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if voters are selected and not in an input field
      if (
        selectedIds.size === 0 ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const sentiment = BULK_TAG_SHORTCUTS[e.key];
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
  }, [selectedIds, handleBulkTag]);

  // Quick stats from current results
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

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Voters
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalVoters.toLocaleString()} total
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
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && voters.length > 0 && (
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchVoters(1, selectedListId, pageSize)}
            >
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

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <VoterTable
            voters={voters}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkTag={handleBulkTag}
            onQuickTag={handleQuickTag}
            isBulkTagging={isBulkTagging}
            totalMatchingVoters={totalVoters}
          />

          {/* Pagination Controls */}
          {totalVoters > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
              {/* Page Size Selector */}
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

              {/* Page Info */}
              <div className="text-sm text-muted-foreground">
                Showing {startIndex.toLocaleString()} -{" "}
                {endIndex.toLocaleString()} of {totalVoters.toLocaleString()}{" "}
                voters
              </div>

              {/* Page Navigation */}
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

                {/* Page Number Input */}
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
        </>
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
