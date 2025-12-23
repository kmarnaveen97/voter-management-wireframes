"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type VoterList } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface ComparisonResult {
  additions: Array<{
    name: string;
    relative_name?: string;
    ward_no?: string;
  }>;
  deletions: Array<{
    name: string;
    relative_name?: string;
    ward_no?: string;
  }>;
}

type ComparisonStatus = "idle" | "processing" | "completed" | "error";

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to fetch voter lists
 */
function useVoterLists() {
  return useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: () => api.getVoterLists(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to poll comparison status
 */
function useComparisonStatus(
  jobId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["comparison", "status", jobId],
    queryFn: () => api.getComparisonStatus(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      // Stop polling when completed or error
      const status = query.state.data?.status;
      if (status === "completed" || status === "error") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

/**
 * Hook to fetch comparison results
 */
function useComparisonResults(jobId: string | null, enabled: boolean) {
  return useQuery<ComparisonResult>({
    queryKey: ["comparison", "results", jobId],
    queryFn: () => api.getComparisonResults(jobId!),
    enabled: !!jobId && enabled,
    staleTime: Infinity, // Results don't change
  });
}

/**
 * Hook to start comparison
 */
function useStartComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      list1Id,
      list2Id,
    }: {
      list1Id: number;
      list2Id: number;
    }) => {
      return api.compareVoterLists(list1Id, list2Id);
    },
    onSuccess: () => {
      // Invalidate any previous comparison results
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
    },
  });
}

// ============================================================================
// Main Component
// ============================================================================

export default function ComparePage() {
  const queryClient = useQueryClient();

  // List selection state
  const [list1Id, setList1Id] = useState<number | null>(null);
  const [list2Id, setList2Id] = useState<number | null>(null);

  // Comparison state
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // React Query hooks
  const {
    data: listsData,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useVoterLists();

  const startComparison = useStartComparison();

  const {
    data: statusData,
    error: statusError,
  } = useComparisonStatus(jobId, isPolling);

  const status = statusData?.status || "idle";

  // Fetch results when comparison completes
  const {
    data: results,
    isLoading: resultsLoading,
  } = useComparisonResults(jobId, status === "completed");

  const lists = listsData?.lists || [];

  // Stop polling when completed or error
  useEffect(() => {
    if (status === "completed" || status === "error") {
      setIsPolling(false);
    }
  }, [status]);

  // Handle error state
  useEffect(() => {
    if (status === "error" || statusError) {
      setIsPolling(false);
    }
  }, [status, statusError]);

  const handleCompare = async () => {
    if (!list1Id || !list2Id) return;

    try {
      const response = await startComparison.mutateAsync({ list1Id, list2Id });
      setJobId(response.job_id);
      setIsPolling(true);
    } catch (err) {
      console.error("Comparison failed:", err);
    }
  };

  const list1 = lists.find((l) => (l.list_id || l.id) === list1Id);
  const list2 = lists.find((l) => (l.list_id || l.id) === list2Id);

  const comparing = startComparison.isPending || isPolling;
  const error =
    listsError?.message ||
    startComparison.error?.message ||
    statusError?.message ||
    (status === "error" ? "Comparison failed. Please try again." : null);

  if (listsLoading) {
    return (
      <>
        <PageHeader
          title="List Comparison"
          description="Compare two voter lists to identify additions and deletions"
        />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="List Comparison"
        description="Compare two voter lists to identify additions and deletions"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => refetchLists()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select Lists to Compare</CardTitle>
              <CardDescription>
                Choose two voter lists to compare and analyze changes between
                them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Baseline List (Older)
                  </label>
                  <Select
                    value={list1Id?.toString()}
                    onValueChange={(val) => setList1Id(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem
                          key={list.list_id || list.id}
                          value={(list.list_id || list.id)!.toString()}
                        >
                          {list.filename || list.name} ({list.total_voters} voters)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Current List (Newer)
                  </label>
                  <Select
                    value={list2Id?.toString()}
                    onValueChange={(val) => setList2Id(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select second list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem
                          key={list.list_id || list.id}
                          value={(list.list_id || list.id)!.toString()}
                          disabled={(list.list_id || list.id) === list1Id}
                        >
                          {list.filename || list.name} ({list.total_voters} voters)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCompare}
                disabled={!list1Id || !list2Id || comparing || list1Id === list2Id}
                className="w-full"
              >
                <GitCompare className="mr-2 h-4 w-4" />
                {comparing ? "Comparing..." : "Start Comparison"}
              </Button>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {(isPolling || status === "processing") && (
            <Alert>
              <GitCompare className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                Comparing voter lists... This may take a few moments depending
                on the list sizes.
              </AlertDescription>
            </Alert>
          )}

          {/* Results Loading */}
          {status === "completed" && resultsLoading && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading comparison results...</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">
                      {(results.additions?.length || 0) +
                        (results.deletions?.length || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    New Voters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {results.additions?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Removed Voters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">
                      {results.deletions?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Results */}
          {results && (
            <>
              {results.additions && results.additions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      New Voters Added
                    </CardTitle>
                    <CardDescription>
                      Voters present in {list2?.name || list2?.filename} but not
                      in {list1?.name || list1?.filename}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.additions.slice(0, 10).map((voter, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{voter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {voter.relative_name} • Ward {voter.ward_no}
                            </p>
                          </div>
                          <Badge className="bg-green-600">New</Badge>
                        </div>
                      ))}
                      {results.additions.length > 10 && (
                        <p className="text-center text-sm text-muted-foreground">
                          And {results.additions.length - 10} more...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.deletions && results.deletions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Voters Removed
                    </CardTitle>
                    <CardDescription>
                      Voters present in {list1?.name || list1?.filename} but not
                      in {list2?.name || list2?.filename}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.deletions.slice(0, 10).map((voter, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{voter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {voter.relative_name} • Ward {voter.ward_no}
                            </p>
                          </div>
                          <Badge variant="destructive">Removed</Badge>
                        </div>
                      ))}
                      {results.deletions.length > 10 && (
                        <p className="text-center text-sm text-muted-foreground">
                          And {results.deletions.length - 10} more...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
