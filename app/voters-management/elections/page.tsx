"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CandidateCard } from "@/components/elections/candidate-card";
import { AddCandidateDialog } from "@/components/elections/add-candidate-dialog";
import { ProjectionsDashboard } from "@/components/elections/projections-dashboard";
import {
  api,
  type Candidate,
  type ProjectionsResponse,
  type CandidateProjection,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Vote,
  AlertCircle,
  RefreshCw,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  Star,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";
import { queryKeys } from "@/lib/query-client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CandidatesResponse {
  list_id?: number;
  total: number;
  candidates: Candidate[];
}

type CandidateStatus = "active" | "withdrawn" | "disqualified";

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function ElectionsLoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-8 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 flex-1 min-w-[200px] max-w-sm" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-12 rounded-full mb-3" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Card Components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <div>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ElectionsPage() {
  const queryClient = useQueryClient();
  const { selectedListId, isLoading: listLoading } = useListContext();

  // ─────────────────────────────────────────────────────────────────────────
  // Local State (UI-only)
  // ─────────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const [showProjections, setShowProjections] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Query: Fetch Candidates
  // ─────────────────────────────────────────────────────────────────────────
  const candidatesQueryKey = queryKeys.elections.byList(
    selectedListId ?? 0,
    statusFilter !== "all" ? (statusFilter as CandidateStatus) : undefined,
    wardFilter !== "all" ? wardFilter : undefined
  );

  const {
    data: candidatesData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<CandidatesResponse>({
    queryKey: candidatesQueryKey,
    queryFn: async () => {
      const filters: {
        list_id: number;
        status?: CandidateStatus;
        ward_no?: string;
      } = {
        list_id: selectedListId!,
      };

      if (statusFilter !== "all") {
        filters.status = statusFilter as CandidateStatus;
      }
      if (wardFilter !== "all") {
        filters.ward_no = wardFilter;
      }

      return api.getCandidates(filters);
    },
    enabled: !!selectedListId && !listLoading,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const candidates = candidatesData?.candidates ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // Query: Fetch Projections
  // ─────────────────────────────────────────────────────────────────────────
  const projectionsQueryKey = queryKeys.projections.overview(
    selectedListId ?? 0
  );

  const { data: projectionsData, isLoading: projectionsLoading } =
    useQuery<ProjectionsResponse>({
      queryKey: projectionsQueryKey,
      queryFn: () => api.getProjections(selectedListId!),
      enabled: !!selectedListId && !listLoading && candidates.length > 0,
      staleTime: 60 * 1000, // 1 minute
    });

  // Create a map of projections by candidate_id for easy lookup
  const projectionsMap = useMemo(() => {
    const map = new Map<number, CandidateProjection>();
    if (projectionsData?.projections) {
      projectionsData.projections.forEach((p) => {
        map.set(p.candidate_id, p);
      });
    }
    return map;
  }, [projectionsData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mutation: Delete Candidate
  // ─────────────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      return api.deleteCandidate(candidateId);
    },
    onMutate: async (candidateId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: candidatesQueryKey });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<CandidatesResponse>(candidatesQueryKey);

      // Optimistically remove the candidate
      if (previousData) {
        queryClient.setQueryData<CandidatesResponse>(candidatesQueryKey, {
          ...previousData,
          candidates: previousData.candidates.filter(
            (c) => (c.candidate_id ?? c.id) !== candidateId
          ),
          total: previousData.total - 1,
        });
      }

      return { previousData };
    },
    onError: (err, candidateId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(candidatesQueryKey, context.previousData);
      }
      console.error("Failed to delete candidate:", err);
      alert("Failed to delete candidate. Please try again.");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: candidatesQueryKey });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Mutation: Set Primary Candidate
  // ─────────────────────────────────────────────────────────────────────────
  const setPrimaryMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      return api.setOurCandidate(candidateId, selectedListId!);
    },
    onMutate: async (candidateId) => {
      await queryClient.cancelQueries({ queryKey: candidatesQueryKey });
      const previousData =
        queryClient.getQueryData<CandidatesResponse>(candidatesQueryKey);

      // Optimistically update is_our_candidate
      if (previousData) {
        queryClient.setQueryData<CandidatesResponse>(candidatesQueryKey, {
          ...previousData,
          candidates: previousData.candidates.map((c) => ({
            ...c,
            is_our_candidate: (c.candidate_id ?? c.id) === candidateId,
          })),
        });
      }

      return { previousData };
    },
    onError: (err, candidateId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(candidatesQueryKey, context.previousData);
      }
      console.error("Failed to set primary candidate:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to set primary candidate. The API endpoint may not be available yet."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: candidatesQueryKey });
      queryClient.invalidateQueries({ queryKey: projectionsQueryKey });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Data (Memoized)
  // ─────────────────────────────────────────────────────────────────────────

  // Extract unique wards for filter dropdown
  const wards = useMemo(() => {
    const uniqueWards = [
      ...new Set(
        candidates.map((c) => c.ward_no).filter((w): w is string => Boolean(w))
      ),
    ];
    return uniqueWards.sort((a, b) => parseInt(a) - parseInt(b));
  }, [candidates]);

  // Filter candidates by search query (client-side)
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;

    const query = searchQuery.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.party_name?.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

  // Stats computed from full candidate list
  const stats = useMemo(() => {
    return {
      active: candidates.filter((c) => c.status === "active").length,
      withdrawn: candidates.filter((c) => c.status === "withdrawn").length,
      disqualified: candidates.filter((c) => c.status === "disqualified")
        .length,
    };
  }, [candidates]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleEdit = (candidate: Candidate) => {
    console.log("[Elections] Edit candidate:", candidate);
    // TODO: Implement edit dialog
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;
    deleteMutation.mutate(id);
  };

  const handleSetPrimary = (candidate: Candidate) => {
    const candidateId = candidate.candidate_id ?? candidate.id;
    if (!candidateId) return;
    if (!confirm(`Set ${candidate.name} as your primary candidate?`)) return;
    setPrimaryMutation.mutate(candidateId);
  };

  const handleAddSuccess = () => {
    // Invalidate queries to refetch fresh data
    queryClient.invalidateQueries({
      queryKey: queryKeys.elections.all,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // Show skeleton during initial load
  if ((isLoading || listLoading) && !candidatesData) {
    return <ElectionsLoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Vote className="h-5 w-5 text-muted-foreground" />
            Elections
            {isFetching && !isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showProjections ? "default" : "outline"}
            size="sm"
            onClick={() => setShowProjections(!showProjections)}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {showProjections ? "Hide Projections" : "Show Projections"}
          </Button>
          <AddCandidateDialog onSuccess={handleAddSuccess} />
        </div>
      </div>

      {/* Quick Stats */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={CheckCircle2}
            iconColor="text-green-600"
            value={stats.active}
            label="Active"
          />
          <StatCard
            icon={MinusCircle}
            iconColor="text-yellow-600"
            value={stats.withdrawn}
            label="Withdrawn"
          />
          <StatCard
            icon={XCircle}
            iconColor="text-red-600"
            value={stats.disqualified}
            label="Disqualified"
          />
        </div>
      )}

      {/* Projections Dashboard */}
      {showProjections && projectionsData && (
        <ProjectionsDashboard projections={projectionsData} />
      )}
      {showProjections && projectionsLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading projections...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {error instanceof Error
                ? error.message
                : "Unable to fetch candidates. Please check your API connection."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
              />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={wardFilter} onValueChange={setWardFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {wards.map((ward) => (
              <SelectItem key={ward} value={ward}>
                Ward {ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {(statusFilter !== "all" || wardFilter !== "all") && (
        <div className="flex flex-wrap gap-1">
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/10"
              onClick={() => setStatusFilter("all")}
            >
              Status: {statusFilter} ×
            </Badge>
          )}
          {wardFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/10"
              onClick={() => setWardFilter("all")}
            >
              Ward: {wardFilter} ×
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {filteredCandidates.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Vote className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {candidates.length === 0
              ? "No candidates yet"
              : "No matching candidates"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {candidates.length === 0
              ? "Add your first candidate to get started"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.candidate_id || candidate.id}
              candidate={candidate}
              projection={projectionsMap.get(
                candidate.candidate_id ?? candidate.id ?? 0
              )}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              showProjections={showProjections}
            />
          ))}
        </div>
      )}
    </div>
  );
}
