"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Map as MapIcon,
  Loader2,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  Layers,
  Box,
} from "lucide-react";
import {
  api,
  type WardMapSummary,
  type SentimentOverview,
  type SentimentType,
} from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

// Dynamic import with SSR disabled for Three.js components
const WarRoom3DCanvas = dynamic(
  () => import("@/components/war-room/war-room-3d-scene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <Box className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <p className="text-white/80 font-medium">Loading 3D Engine</p>
            <p className="text-white/50 text-sm">
              Initializing Three.js...
            </p>
          </div>
        </div>
      </div>
    ),
  }
);

// Import type and colors from the 3D scene component
import type { Ward3DData } from "@/components/war-room/war-room-3d-scene";

// ============================================================================
// Constants
// ============================================================================

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  support: "#22c55e",
  oppose: "#ef4444",
  swing: "#f59e0b",
  unknown: "#6b7280",
  neutral: "#06b6d4",
};

// ============================================================================
// Stats Panel
// ============================================================================

interface StatsPanelProps {
  overview: SentimentOverview | null;
  selectedWard: Ward3DData | null;
}

function StatsPanel({ overview, selectedWard }: StatsPanelProps) {
  const stats = selectedWard
    ? {
        total: selectedWard.voterCount,
        support: selectedWard.supportCount,
        oppose: selectedWard.opposeCount,
        swing: selectedWard.swingCount,
        unknown: selectedWard.unknownCount,
      }
    : overview
    ? {
        total: overview.total_voters,
        support: overview.sentiment_breakdown.support,
        oppose: overview.sentiment_breakdown.oppose || 0,
        swing: overview.sentiment_breakdown.swing,
        unknown: overview.sentiment_breakdown.unknown,
      }
    : null;

  if (!stats) return null;

  const supportPercent =
    stats.total > 0 ? (stats.support / stats.total) * 100 : 0;
  const opposePercent =
    stats.total > 0 ? (stats.oppose / stats.total) * 100 : 0;

  return (
    <Card className="bg-card/95 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {selectedWard ? (
            <>
              <Home className="h-4 w-4" />
              Ward {selectedWard.wardNo}
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              All Wards
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">
          {stats.total.toLocaleString()} voters
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Support
            </span>
            <span className="font-medium">
              {stats.support.toLocaleString()} ({supportPercent.toFixed(1)}%)
            </span>
          </div>
          <Progress value={supportPercent} className="h-2 bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Oppose
            </span>
            <span className="font-medium">
              {stats.oppose.toLocaleString()} ({opposePercent.toFixed(1)}%)
            </span>
          </div>
          <Progress
            value={opposePercent}
            className="h-2 bg-muted [&>div]:bg-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center p-2 rounded bg-amber-500/10">
            <div className="text-lg font-bold text-amber-600">
              {stats.swing.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Swing</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-500/10">
            <div className="text-lg font-bold text-gray-500">
              {stats.unknown.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Unknown</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function WarRoom3DPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  // Data state
  const [wardData, setWardData] = useState<WardMapSummary[]>([]);
  const [overview, setOverview] = useState<SentimentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<
    [number, number, number] | null
  >(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!selectedListId) return;

    try {
      setLoading(true);
      setError(null);

      const [wardsRes, overviewRes] = await Promise.all([
        api.getMapWards(selectedListId),
        api.getSentimentOverview(selectedListId),
      ]);

      setWardData(wardsRes.wards || []);
      setOverview(overviewRes);
    } catch (err) {
      console.error("Failed to fetch 3D war room data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    if (selectedListId && !listLoading) {
      fetchData();
    }
  }, [selectedListId, listLoading, fetchData]);

  // Transform ward data to 3D positions
  const wards3D: Ward3DData[] = useMemo(() => {
    const gridSize = Math.ceil(Math.sqrt(wardData.length));
    const spacing = 3;

    return wardData.map((ward, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = (col - gridSize / 2) * spacing;
      const z = (row - gridSize / 2) * spacing;

      // Determine dominant sentiment
      const counts = {
        support: ward.support_count || 0,
        oppose: ward.oppose_count || 0,
        swing: ward.swing_count || 0,
        unknown:
          ward.unknown_count ||
          ward.total_voters -
            (ward.support_count || 0) -
            (ward.oppose_count || 0) -
            (ward.swing_count || 0),
      };

      const maxCount = Math.max(
        counts.support,
        counts.oppose,
        counts.swing,
        counts.unknown
      );
      let sentiment: SentimentType = "unknown";
      if (maxCount === counts.support) sentiment = "support";
      else if (maxCount === counts.oppose) sentiment = "oppose";
      else if (maxCount === counts.swing) sentiment = "swing";

      const supportPercent =
        ward.total_voters > 0
          ? (counts.support / ward.total_voters) * 100
          : 0;

      return {
        wardNo: ward.ward_no,
        position: [x, 0.5, z] as [number, number, number],
        sentiment,
        voterCount: ward.total_voters,
        supportCount: counts.support,
        opposeCount: counts.oppose,
        swingCount: counts.swing,
        unknownCount: counts.unknown,
        supportPercent,
      };
    });
  }, [wardData]);

  // Get selected ward data
  const selectedWardData = useMemo(() => {
    return wards3D.find((w) => w.wardNo === selectedWard) || null;
  }, [wards3D, selectedWard]);

  // Handle ward selection
  const handleSelectWard = useCallback(
    (wardNo: string | null) => {
      setSelectedWard(wardNo);
      if (wardNo) {
        const ward = wards3D.find((w) => w.wardNo === wardNo);
        if (ward) {
          setCameraTarget(ward.position);
        }
      } else {
        setCameraTarget(null);
      }
    },
    [wards3D]
  );

  // Reset camera
  const handleResetCamera = useCallback(() => {
    setSelectedWard(null);
    setCameraTarget(null);
  }, []);

  if (loading || listLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold">Error Loading Data</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchData}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 md:w-80 bg-card border-r border-border flex flex-col shrink-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur">
                <Box className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">3D War Room</h1>
                <p className="text-xs text-white/70">
                  Interactive ward visualization
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-3 border-b">
            <Link href="/voters-management/war-room">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to 2D War Room
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <StatsPanel overview={overview} selectedWard={selectedWardData} />

              {/* Ward List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapIcon className="h-4 w-4" />
                    Wards ({wards3D.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
                  {wards3D.map((ward) => (
                    <button
                      key={ward.wardNo}
                      onClick={() => handleSelectWard(ward.wardNo)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                        selectedWard === ward.wardNo
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">Ward {ward.wardNo}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">
                          {ward.voterCount}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: SENTIMENT_COLORS[ward.sentiment],
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(
                    ["support", "oppose", "swing", "unknown"] as SentimentType[]
                  ).map((sentiment) => (
                    <div
                      key={sentiment}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: SENTIMENT_COLORS[sentiment],
                        }}
                      />
                      <span className="capitalize">{sentiment}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <WarRoom3DCanvas
            wards={wards3D}
            selectedWard={selectedWard}
            hoveredWard={hoveredWard}
            onSelectWard={handleSelectWard}
            onHoverWard={setHoveredWard}
            cameraTarget={cameraTarget}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleResetCamera}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Camera</TooltipContent>
            </Tooltip>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur rounded-lg p-3 text-xs text-muted-foreground space-y-1 hidden sm:block">
            <div>
              <strong>Controls:</strong>
            </div>
            <div>• Left click + drag: Rotate</div>
            <div>• Right click + drag: Pan</div>
            <div>• Scroll: Zoom</div>
            <div>• Click building: Select ward</div>
          </div>

          {/* Selected Ward Badge */}
          {selectedWard && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="text-sm py-1.5 px-3">
                <Home className="h-3.5 w-3.5 mr-1.5" />
                Ward {selectedWard} selected
                <button
                  onClick={() => handleSelectWard(null)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
