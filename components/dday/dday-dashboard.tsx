"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type DDayPriorityVoter } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { FieldWorkerView } from "./field-worker-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Car,
  Phone,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Monitor,
  Smartphone,
  WifiOff,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DDayDashboard() {
  const { currentList } = useListContext();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "auto">(
    "auto"
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Listen for mutations from field workers and optimistically invalidate
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isOnline) {
        // Silently refetch in background when user returns to tab
        queryClient.invalidateQueries({
          queryKey: ["ddaySummary", currentList?.list_id],
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: ["ddayCandidateVotes", currentList?.list_id],
          refetchType: "active",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [queryClient, currentList?.list_id, isOnline]);

  const shouldShowMobileView =
    viewMode === "mobile" || (viewMode === "auto" && isMobile);

  // Fetch all D-Day data
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isError: summaryError,
    dataUpdatedAt: summaryUpdatedAt,
  } = useQuery({
    queryKey: ["ddaySummary", currentList?.list_id],
    queryFn: async () => {
      const data = await api.getDDaySummary(currentList!.list_id);
      setLastUpdated(new Date());
      return data;
    },
    enabled: !!currentList?.list_id,
    refetchInterval: isOnline ? 30000 : false, // Only refetch when online
    staleTime: 20000, // Consider data fresh for 20s
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when connection restored
  });

  const {
    data: candidateVotes,
    isLoading: candidateVotesLoading,
    refetch: refetchCandidateVotes,
    isError: candidateVotesError,
  } = useQuery({
    queryKey: ["ddayCandidateVotes", currentList?.list_id],
    queryFn: () => api.getDDayCandidateVotes(currentList!.list_id),
    enabled: !!currentList?.list_id,
    refetchInterval: isOnline ? 30000 : false,
    staleTime: 20000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: priorities,
    isLoading: prioritiesLoading,
    refetch: refetchPriorities,
    isError: prioritiesError,
  } = useQuery({
    queryKey: ["ddayPriorities", currentList?.list_id],
    queryFn: () =>
      api.getDDayPriorities({
        list_id: currentList!.list_id,
        limit: 100,
        priority_max: 10,
      }),
    enabled: !!currentList?.list_id,
    refetchInterval: isOnline ? 30000 : false,
    staleTime: 20000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: matrix,
    isLoading: matrixLoading,
    isError: matrixError,
  } = useQuery({
    queryKey: ["sentimentTurnoutMatrix", currentList?.list_id],
    queryFn: () => api.getSentimentTurnoutMatrix(currentList!.list_id),
    enabled: !!currentList?.list_id,
    refetchInterval: isOnline ? 30000 : false,
    staleTime: 20000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const handleRefresh = () => {
    if (!isOnline) {
      return; // Don't attempt refresh when offline
    }
    refetchSummary();
    refetchCandidateVotes();
    refetchPriorities();
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return "text-red-700 bg-red-100 dark:bg-red-950";
    if (priority <= 6)
      return "text-yellow-700 bg-yellow-100 dark:bg-yellow-950";
    return "text-gray-700 bg-gray-100 dark:bg-gray-900";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority <= 3) return "URGENT";
    if (priority <= 6) return "HIGH";
    return "ROUTINE";
  };

  if (!currentList) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a voter list</p>
      </div>
    );
  }

  // Show mobile-optimized field worker view
  if (shouldShowMobileView) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">D-Day Dashboard</h1>
            <p className="text-sm text-muted-foreground">Field worker view</p>
          </div>
          <Button
            onClick={() => setViewMode("desktop")}
            variant="outline"
            size="sm"
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
        <FieldWorkerView maxPriority={10} />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">D-Day Dashboard</h1>
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {isOnline &&
              (summaryError ||
                candidateVotesError ||
                prioritiesError ||
                matrixError) && (
                <Badge
                  variant="outline"
                  className="gap-1 text-yellow-600 border-yellow-600"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Connection Issues
                </Badge>
              )}
          </div>
          <p className="text-muted-foreground">
            {isOnline
              ? "Real-time election day management"
              : "Showing cached data (offline mode)"}
            {lastUpdated && (
              <span className="text-xs ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("mobile")}
            variant="outline"
            size="sm"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Field View
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={!isOnline}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Active Voters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary.overview.total_active_voters}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Already Voted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {summary.overview.already_voted}
              </div>
              <Progress
                value={summary.overview.voting_progress_percent}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {summary.overview.voting_progress_percent.toFixed(1)}% turnout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expected For Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {summary.overview.expected_for_us}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-3xl font-bold",
                  summary.overview.current_margin >= 0
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {summary.overview.current_margin >= 0 ? "+" : ""}
                {summary.overview.current_margin}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Urgent Actions */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Car className="h-5 w-5" />
                Transport Needed
              </CardTitle>
              <CardDescription>
                Supporters requiring immediate transport
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-700 dark:text-red-400">
                {summary.urgent_actions.supporters_need_transport}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <Phone className="h-5 w-5" />
                Not Contacted
              </CardTitle>
              <CardDescription>
                Supporters pending contact/confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">
                {summary.urgent_actions.supporters_not_contacted}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Priority Breakdown */}
      {summary && summary.priority_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>
              Voter distribution by action priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.priority_breakdown.map((item) => (
                <div
                  key={item.priority}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(item.priority)}>
                      Priority {item.priority}
                    </Badge>
                    <span className="text-sm">{item.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ward Breakdown */}
      {summary && summary.ward_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ward-wise Status
            </CardTitle>
            <CardDescription>Progress tracking by ward</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ward</TableHead>
                  <TableHead>Supporters Pending</TableHead>
                  <TableHead>Need Transport</TableHead>
                  <TableHead>Already Voted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.ward_breakdown.map((ward) => (
                  <TableRow key={ward.ward_no}>
                    <TableCell className="font-medium">
                      Ward {ward.ward_no}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ward.supporters_pending}</Badge>
                    </TableCell>
                    <TableCell>
                      {ward.need_transport > 0 ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950">
                          {ward.need_transport}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950">
                        {ward.already_voted}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Booth Breakdown */}
      {summary &&
        summary.booth_breakdown &&
        summary.booth_breakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Booth-wise Status
              </CardTitle>
              <CardDescription>
                Progress tracking by polling booth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booth</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Supporters Pending</TableHead>
                    <TableHead>Need Transport</TableHead>
                    <TableHead>Already Voted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.booth_breakdown.map((booth) => (
                    <TableRow key={`${booth.ward_no}-${booth.booth_no}`}>
                      <TableCell className="font-medium">
                        Booth {booth.booth_no}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Ward {booth.ward_no}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{booth.total}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {booth.supporters_pending}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booth.need_transport > 0 ? (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-950">
                            {booth.need_transport}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950">
                          {booth.already_voted}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

      {/* Candidate Vote Counts */}
      {candidateVotesLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48" />
          </CardContent>
        </Card>
      ) : candidateVotes && candidateVotes.candidates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Live Vote Counts
            </CardTitle>
            <CardDescription>
              Actual votes received per candidate ({candidateVotes.total_voted}{" "}
              total, {candidateVotes.unknown_votes} unknown)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidateVotes.candidates.map((candidate) => (
                <div key={candidate.candidate_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                          candidate.is_our_candidate
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {candidate.vote_count}
                      </div>
                      <div>
                        <p className="font-medium">
                          {candidate.candidate_name}
                          {candidate.is_our_candidate && (
                            <Badge className="ml-2 bg-green-600 text-white">
                              Ours
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {candidate.party_name} •{" "}
                          {candidate.vote_share_percent.toFixed(1)}% share
                        </p>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={
                      (candidate.vote_count / candidateVotes.total_voted) * 100
                    }
                    className={cn(
                      "h-2",
                      candidate.is_our_candidate && "[&>div]:bg-green-600"
                    )}
                  />
                  <div className="flex gap-4 text-xs text-muted-foreground pl-13">
                    <span>
                      Supporters: {candidate.breakdown.from_supporters}
                    </span>
                    <span>Opponents: {candidate.breakdown.from_opponents}</span>
                    <span>Swing: {candidate.breakdown.from_swing}</span>
                    <span>Unknown: {candidate.breakdown.from_unknown}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Priority Voters List */}
      {prioritiesLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      ) : priorities && priorities.voters.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Priority Voters ({priorities.total_results})
            </CardTitle>
            <CardDescription>
              Top priority voters requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>House No</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Booth</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorities.voters.slice(0, 50).map((voter) => (
                  <TableRow key={voter.voter_id}>
                    <TableCell>
                      <Badge className={getPriorityColor(voter.priority)}>
                        {voter.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voter.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {voter.relative_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{voter.house_no}</TableCell>
                    <TableCell>{voter.ward_no}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{voter.booth_no}</Badge>
                    </TableCell>
                    <TableCell>{voter.age}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={
                            voter.sentiment === "support"
                              ? "border-green-300 text-green-700"
                              : voter.sentiment === "swing"
                              ? "border-yellow-300 text-yellow-700"
                              : "border-red-300 text-red-700"
                          }
                        >
                          {voter.sentiment}
                        </Badge>
                        {voter.needs_transport && (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950">
                            <Car className="h-3 w-3 mr-1" />
                            Transport
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{voter.action}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>All priority voters have been contacted!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
