"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ComparePage() {
  const [lists, setLists] = useState<VoterList[]>([]);
  const [list1Id, setList1Id] = useState<number | null>(null);
  const [list2Id, setList2Id] = useState<number | null>(null);
  const [comparing, setComparing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref to store the polling interval for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVoterLists();
      setLists(data.lists || []);
    } catch (err) {
      console.error("Failed to fetch voter lists:", err);
      setError(
        "Unable to fetch voter lists. Please check your API connection."
      );
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const pollComparisonStatus = useCallback((jobId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await api.getComparisonStatus(jobId);
        setStatus(statusResponse.status);

        if (statusResponse.status === "completed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          const resultsResponse = await api.getComparisonResults(jobId);
          setResults(resultsResponse);
          setComparing(false);
        } else if (statusResponse.status === "error") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError("Comparison failed. Please try again.");
          setComparing(false);
          setStatus("idle");
        }
      } catch (err) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError("Lost connection while comparing. Please try again.");
        setComparing(false);
        setStatus("idle");
      }
    }, 2000);
  }, []);

  const handleCompare = async () => {
    if (!list1Id || !list2Id) return;

    setComparing(true);
    setStatus("processing");
    setError(null);
    try {
      const response = await api.compareVoterLists(list1Id, list2Id);
      setJobId(response.job_id);
      pollComparisonStatus(response.job_id);
    } catch (err) {
      console.error("Comparison failed:", err);
      setError("Failed to start comparison. Please try again.");
      setComparing(false);
      setStatus("idle");
    }
  };

  const list1 = lists.find((l) => (l.list_id || l.id) === list1Id);
  const list2 = lists.find((l) => (l.list_id || l.id) === list2Id);

  if (loading) {
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

      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchLists}>
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
                          {list.filename || list.name} ({list.total_voters}{" "}
                          voters)
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
                          {list.filename || list.name} ({list.total_voters}{" "}
                          voters)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCompare}
                disabled={
                  !list1Id || !list2Id || comparing || list1Id === list2Id
                }
                className="w-full"
              >
                <GitCompare className="mr-2 h-4 w-4" />
                {comparing ? "Comparing..." : "Start Comparison"}
              </Button>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {status === "processing" && (
            <Alert>
              <GitCompare className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                Comparing voter lists... This may take a few moments depending
                on the list sizes.
              </AlertDescription>
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
                      Voters present in {list2?.name} but not in {list1?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.additions
                        .slice(0, 10)
                        .map((voter: any, index: number) => (
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
                            <Badge variant="default" className="bg-green-600">
                              New
                            </Badge>
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
                      Voters present in {list1?.name} but not in {list2?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.deletions
                        .slice(0, 10)
                        .map((voter: any, index: number) => (
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

function Badge({ children, variant, className }: any) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        variant === "destructive"
          ? "bg-red-600 text-white"
          : variant === "default"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground"
      } ${className}`}
    >
      {children}
    </span>
  );
}
