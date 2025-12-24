"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DDayPriorityVoter } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  CheckCircle2,
  Car,
  MapPin,
  User,
  Home,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FieldWorkerViewProps {
  maxPriority?: number;
}

export function FieldWorkerView({ maxPriority = 6 }: FieldWorkerViewProps) {
  const { currentList } = useListContext();
  const queryClient = useQueryClient();
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedBooth, setSelectedBooth] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [confirmVoterId, setConfirmVoterId] = useState<number | null>(null);
  const [captureSentimentFor, setCaptureSentimentFor] =
    useState<DDayPriorityVoter | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [processingVoters, setProcessingVoters] = useState<Set<number>>(
    new Set()
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const {
    data: priorities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "ddayFieldWorker",
      currentList?.list_id,
      selectedWard,
      selectedBooth,
      selectedSentiment,
      maxPriority,
    ],
    queryFn: () =>
      api.getDDayPriorities({
        list_id: currentList!.list_id,
        limit: 100,
        priority_max: maxPriority,
        ward_no: selectedWard !== "all" ? selectedWard : undefined,
        booth_no: selectedBooth !== "all" ? Number(selectedBooth) : undefined,
        sentiment:
          selectedSentiment !== "all"
            ? (selectedSentiment as "support" | "swing")
            : undefined,
      }),
    enabled: !!currentList?.list_id,
    refetchInterval: 20000, // Refetch every 20 seconds for field workers
  });

  // Fetch candidates list for voting selection
  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", currentList?.list_id],
    queryFn: () => api.getCandidates({ list_id: currentList!.list_id }),
    enabled: !!currentList?.list_id,
  });

  const candidates = candidatesData?.candidates || [];

  // Mark voter as voted
  const markVotedMutation = useMutation({
    mutationFn: ({
      voterId,
      voted_for_candidate_id,
    }: {
      voterId: number;
      voted_for_candidate_id?: number;
    }) =>
      api.markTurnout({
        list_id: currentList!.list_id,
        voter_id: voterId,
        status: "already_voted",
        voted_for_candidate_id: voted_for_candidate_id,
      }),
    onMutate: async ({ voterId }) => {
      // Mark voter as processing
      setProcessingVoters((prev) => new Set(prev).add(voterId));

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["ddayFieldWorker"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "ddayFieldWorker",
        currentList?.list_id,
        selectedWard,
        selectedBooth,
        selectedSentiment,
        maxPriority,
      ]);

      // Optimistically update by removing voter from list
      queryClient.setQueryData(
        [
          "ddayFieldWorker",
          currentList?.list_id,
          selectedWard,
          selectedBooth,
          selectedSentiment,
          maxPriority,
        ],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            voters: old.voters.filter((v: any) => v.voter_id !== voterId),
            total_results: old.total_results - 1,
          };
        }
      );

      return { previousData };
    },
    onSuccess: (_, { voterId }) => {
      toast.success("✓ Voter marked as voted");
      setConfirmVoterId(null);
      setProcessingVoters((prev) => {
        const next = new Set(prev);
        next.delete(voterId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["ddayFieldWorker"] });
      queryClient.invalidateQueries({ queryKey: ["ddaySummary"] });
      queryClient.invalidateQueries({ queryKey: ["ddayCandidateVotes"] });
    },
    onError: (error: any, { voterId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          [
            "ddayFieldWorker",
            currentList?.list_id,
            selectedWard,
            selectedBooth,
            selectedSentiment,
            maxPriority,
          ],
          context.previousData
        );
      }
      toast.error(error?.message || "Failed to mark voter. Please try again.");
      setConfirmVoterId(null);
      setProcessingVoters((prev) => {
        const next = new Set(prev);
        next.delete(voterId);
        return next;
      });
    },
  });

  // Mark voter needs transport
  const markTransportMutation = useMutation({
    mutationFn: (voterId: number) =>
      api.markTurnout({
        list_id: currentList!.list_id,
        voter_id: voterId,
        status: "needs_transport",
      }),
    onMutate: async (voterId) => {
      // Mark voter as processing
      setProcessingVoters((prev) => new Set(prev).add(voterId));

      await queryClient.cancelQueries({ queryKey: ["ddayFieldWorker"] });

      const previousData = queryClient.getQueryData([
        "ddayFieldWorker",
        currentList?.list_id,
        selectedWard,
        selectedBooth,
        selectedSentiment,
        maxPriority,
      ]);

      // Optimistically update voter's needs_transport flag
      queryClient.setQueryData(
        [
          "ddayFieldWorker",
          currentList?.list_id,
          selectedWard,
          selectedBooth,
          selectedSentiment,
          maxPriority,
        ],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            voters: old.voters.map((v: any) =>
              v.voter_id === voterId ? { ...v, needs_transport: true } : v
            ),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("🚗 Transport request sent");
      queryClient.invalidateQueries({ queryKey: ["ddayFieldWorker"] });
      queryClient.invalidateQueries({ queryKey: ["ddaySummary"] });
    },
    onError: (error: any, voterId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [
            "ddayFieldWorker",
            currentList?.list_id,
            selectedWard,
            selectedBooth,
            selectedSentiment,
            maxPriority,
          ],
          context.previousData
        );
      }
      toast.error(
        error?.message || "Failed to request transport. Please try again."
      );
      setProcessingVoters((prev) => {
        const next = new Set(prev);
        next.delete(voterId);
        return next;
      });
    },
  });

  const getPriorityColor = useCallback((priority: number) => {
    if (priority <= 3) return "bg-red-500";
    if (priority <= 6) return "bg-yellow-500";
    return "bg-gray-400";
  }, []);

  const getPriorityLabel = useCallback((priority: number) => {
    if (priority <= 3) return "URGENT";
    if (priority <= 6) return "HIGH";
    return "ROUTINE";
  }, []);

  const handleCall = useCallback((mobile: string | null) => {
    if (mobile) {
      // Use window.open to avoid navigation issues
      window.open(`tel:${mobile}`, "_self");
    } else {
      toast.error("No mobile number available");
    }
  }, []);

  const handleConfirmVote = useCallback(
    (voter: DDayPriorityVoter) => {
      // For support voters, auto-select our candidate
      if (voter.sentiment === "support") {
        const ourCandidate = candidates.find((c) => c.is_our_candidate);
        if (ourCandidate) {
          markVotedMutation.mutate({
            voterId: voter.voter_id,
            voted_for_candidate_id: ourCandidate.candidate_id,
          });
        } else {
          // Fallback: show dialog if our candidate not found
          setCaptureSentimentFor(voter);
          setConfirmVoterId(null);
        }
      } else {
        // For oppose/swing/neutral/unknown voters, show candidate selection
        setCaptureSentimentFor(voter);
        setConfirmVoterId(null);
      }
    },
    [markVotedMutation, candidates]
  );

  const handleCandidateSelection = useCallback(
    (candidateId: number | null) => {
      if (!captureSentimentFor) return;

      markVotedMutation.mutate({
        voterId: captureSentimentFor.voter_id,
        voted_for_candidate_id: candidateId || undefined,
      });
      setCaptureSentimentFor(null);
    },
    [captureSentimentFor, markVotedMutation]
  );

  if (!currentList) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a voter list</p>
      </div>
    );
  }

  // Get unique wards and booths (memoized)
  const wards = useMemo(
    () =>
      Array.from(
        new Set(priorities?.voters.map((v) => String(v.ward_no)) || [])
      ).sort(),
    [priorities?.voters]
  );
  const booths = useMemo(
    () =>
      Array.from(new Set(priorities?.voters.map((v) => v.booth_no) || [])).sort(
        (a, b) => a - b
      ),
    [priorities?.voters]
  );

  // Filter voters based on search query
  const filteredVoters = useMemo(() => {
    if (!priorities?.voters) return [];
    if (!searchQuery.trim()) return priorities.voters;

    const query = searchQuery.toLowerCase().trim();
    return priorities.voters.filter((voter) => {
      return (
        voter.name.toLowerCase().includes(query) ||
        voter.relative_name.toLowerCase().includes(query) ||
        voter.house_no.toLowerCase().includes(query) ||
        String(voter.ward_no).includes(query) ||
        String(voter.booth_no).includes(query) ||
        (voter.mobile && voter.mobile.includes(query))
      );
    });
  }, [priorities?.voters, searchQuery]);

  const displayCount = searchQuery.trim()
    ? filteredVoters.length
    : priorities?.total_results || 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Candidate Selection Dialog */}
      {captureSentimentFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Who Did They Vote For?</CardTitle>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">
                  {captureSentimentFor.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {captureSentimentFor.relative_name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Original sentiment:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {captureSentimentFor.sentiment}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Select which candidate they voted for:
              </p>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {candidates.map((candidate) => (
                <Button
                  key={candidate.candidate_id}
                  variant={candidate.is_our_candidate ? "default" : "outline"}
                  className={cn(
                    "w-full h-14 text-left justify-start text-lg",
                    candidate.is_our_candidate &&
                      "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() =>
                    handleCandidateSelection(candidate.candidate_id)
                  }
                  disabled={
                    captureSentimentFor
                      ? processingVoters.has(captureSentimentFor.voter_id)
                      : false
                  }
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{candidate.name}</p>
                      {candidate.party_name && (
                        <p className="text-xs opacity-80 truncate">
                          {candidate.party_name}{" "}
                          {candidate.party_symbol &&
                            `(${candidate.party_symbol})`}
                        </p>
                      )}
                    </div>
                    {candidate.is_our_candidate && (
                      <Badge variant="secondary" className="ml-2 bg-white/20">
                        Ours
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
              <Button
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={() => handleCandidateSelection(null)}
                disabled={
                  captureSentimentFor
                    ? processingVoters.has(captureSentimentFor.voter_id)
                    : false
                }
              >
                ? Don't Know / Refused to Say
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setCaptureSentimentFor(null)}
                disabled={
                  captureSentimentFor
                    ? processingVoters.has(captureSentimentFor.voter_id)
                    : false
                }
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Field Worker</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {displayCount} voters{" "}
                {searchQuery.trim() ? "found" : "to contact"}
              </p>
              {!isOnline && (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={processingVoters.size > 0}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, house, ward, booth, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedWard} onValueChange={setSelectedWard}>
            <SelectTrigger>
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

          <Select value={selectedBooth} onValueChange={setSelectedBooth}>
            <SelectTrigger>
              <SelectValue placeholder="All Booths" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Booths</SelectItem>
              {booths.map((booth) => (
                <SelectItem key={booth} value={String(booth)}>
                  Booth {booth}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSentiment}
            onValueChange={setSelectedSentiment}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Voters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Voters</SelectItem>
              <SelectItem value="support">Supporters Only</SelectItem>
              <SelectItem value="swing">Swing Voters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voter Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredVoters.length > 0 ? (
        <div className="space-y-3">
          {filteredVoters.map((voter) => (
            <Card
              key={voter.voter_id}
              className={cn(
                "border-l-4",
                voter.priority <= 3 && "border-l-red-500",
                voter.priority > 3 &&
                  voter.priority <= 6 &&
                  "border-l-yellow-500",
                voter.priority > 6 && "border-l-gray-400"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{voter.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {voter.relative_name}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-white",
                      getPriorityColor(voter.priority)
                    )}
                  >
                    {getPriorityLabel(voter.priority)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Voter Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span>House {voter.house_no}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Ward {voter.ward_no}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{voter.age} years</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{voter.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="h-4 w-4" />
                    <span>Booth {voter.booth_no}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={
                      voter.sentiment === "support"
                        ? "border-green-300 text-green-700 bg-green-50"
                        : voter.sentiment === "swing"
                        ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                        : "border-red-300 text-red-700 bg-red-50"
                    }
                  >
                    {voter.sentiment.toUpperCase()}
                  </Badge>
                  {voter.needs_transport && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      <Car className="h-3 w-3 mr-1" />
                      Transport Needed
                    </Badge>
                  )}
                </div>

                {/* Action Required */}
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm font-medium">Action Required:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {voter.action}
                  </p>
                </div>

                {/* Quick Actions */}
                {confirmVoterId === voter.voter_id ? (
                  <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      Confirm voter has cast their ballot?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmVote(voter)}
                        disabled={processingVoters.has(voter.voter_id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Yes, Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmVoterId(null)}
                        disabled={processingVoters.has(voter.voter_id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 flex-col gap-1"
                      onClick={() => handleCall(voter.mobile)}
                      disabled={
                        !voter.mobile || processingVoters.has(voter.voter_id)
                      }
                    >
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Call</span>
                    </Button>

                    <Button
                      variant="default"
                      size="lg"
                      className="h-14 flex-col gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => setConfirmVoterId(voter.voter_id)}
                      disabled={processingVoters.has(voter.voter_id)}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-xs">
                        {processingVoters.has(voter.voter_id)
                          ? "Processing..."
                          : "Voted"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 flex-col gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() =>
                        markTransportMutation.mutate(voter.voter_id)
                      }
                      disabled={
                        processingVoters.has(voter.voter_id) ||
                        voter.needs_transport
                      }
                    >
                      <Car className="h-5 w-5" />
                      <span className="text-xs">
                        {processingVoters.has(voter.voter_id)
                          ? "Processing..."
                          : voter.needs_transport
                          ? "Requested"
                          : "Transport"}
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              {searchQuery.trim() ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No Results</p>
                  <p className="text-sm mt-1">
                    No voters found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">All Done!</p>
                  <p className="text-sm mt-1">
                    No priority voters in selected filters
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
