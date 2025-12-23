"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  GitBranch,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  TreePine,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeStats {
  total_families: number;
  families_with_trees: number;
  pending_families: number;
}

interface JobStatus {
  status: string;
  progress: number;
  total_families: number;
  processed: number;
  errors: string[];
}

interface TreeManagementPanelProps {
  onTreesBuilt?: () => void; // Callback when trees are built
}

export function TreeManagementPanel({
  onTreesBuilt,
}: TreeManagementPanelProps) {
  const { selectedListId, currentList } = useListContext();
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch stats on mount and when list changes
  const fetchStats = useCallback(async () => {
    if (!selectedListId) return;
    setLoading(true);
    try {
      const result = await api.getFamilyTreeStats(selectedListId);
      if (result.success && result.data) {
        setStats(result.data);
        // Auto-expand if no trees built
        if (result.data.families_with_trees === 0) {
          setIsOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tree stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Poll job status when building
  useEffect(() => {
    if (!jobId || !building) return;

    const pollInterval = setInterval(async () => {
      const result = await api.getFamilyTreeJobStatus(jobId);
      if (result.success && result.data) {
        setJobStatus(result.data);

        if (result.data.status === "completed") {
          setBuilding(false);
          setJobId(null);
          setSuccess(
            `Successfully built family trees for ${result.data.processed} families`
          );
          fetchStats();
          onTreesBuilt?.();
        } else if (result.data.status === "failed") {
          setBuilding(false);
          setJobId(null);
          setError(
            result.data.errors?.join(", ") || "Failed to build family trees"
          );
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, building, fetchStats, onTreesBuilt]);

  // Trigger tree generation
  const handleBuildTrees = async () => {
    if (!selectedListId) return;

    setError(null);
    setSuccess(null);
    setBuilding(true);
    setJobStatus(null);

    try {
      const result = await api.triggerFamilyTreeGeneration({
        listId: selectedListId,
        verifyWithGemini: true, // Always use AI
        forceRebuild: false, // Can only trigger once
      });

      if (result.success && result.data?.job_id) {
        setJobId(result.data.job_id);
      } else {
        setBuilding(false);
        setError(result.message || "Failed to start tree generation");
      }
    } catch (err) {
      setBuilding(false);
      setError("Failed to connect to server");
    }
  };

  const progressPercentage = jobStatus
    ? Math.round((jobStatus.processed / jobStatus.total_families) * 100)
    : 0;

  const hasExistingTrees = stats && stats.families_with_trees > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TreePine className="h-5 w-5 text-green-600" />
                वंशवृक्ष प्रबंधन (Family Tree Management)
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats && (
                  <Badge
                    variant={hasExistingTrees ? "default" : "secondary"}
                    className={cn(
                      "gap-1",
                      hasExistingTrees && "bg-green-100 text-green-800"
                    )}
                  >
                    <GitBranch className="h-3 w-3" />
                    {stats.families_with_trees}/{stats.total_families} Built
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total_families}</p>
                  <p className="text-xs text-muted-foreground">
                    कुल परिवार (Total)
                  </p>
                </div>
                <div className="rounded-lg border bg-green-50 border-green-200 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {stats.families_with_trees}
                  </p>
                  <p className="text-xs text-green-600">निर्मित (Built)</p>
                </div>
                <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {stats.pending_families}
                  </p>
                  <p className="text-xs text-amber-600">लंबित (Pending)</p>
                </div>
              </div>
            )}

            {/* Building Progress */}
            {building && jobStatus && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      वंशवृक्ष निर्माण जारी है...
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-800">
                    {progressPercentage}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-blue-600">
                  {jobStatus.processed} / {jobStatus.total_families} families
                  processed
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{success}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 px-2"
                  onClick={() => setSuccess(null)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 px-2"
                  onClick={() => setError(null)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {hasExistingTrees ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    वंशवृक्ष पहले से निर्मित है (Trees already built)
                  </span>
                </div>
              ) : (
                <Button
                  onClick={handleBuildTrees}
                  disabled={building || !selectedListId}
                  className="gap-2"
                >
                  {building ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <Play className="h-4 w-4" />
                    </>
                  )}
                  {building ? "निर्माण जारी..." : "AI से वंशवृक्ष बनाएं"}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={fetchStats}
                disabled={loading || building}
                className="gap-2"
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            {/* Current List Info */}
            <div className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Active List: {currentList?.filename || `List ${selectedListId}`}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
