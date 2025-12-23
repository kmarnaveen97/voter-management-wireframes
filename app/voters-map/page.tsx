"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Map,
  ZoomIn,
  ZoomOut,
  Maximize,
  Home,
  X,
  ChevronLeft,
  Loader2,
  Target,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  api,
  type MapHouseData,
  type MapFamilyMember,
  type MapFamilySentiment,
  type WardHousesResponse,
} from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import from the new voters-map module
import {
  type WardData,
  type HouseData,
  type FamilyMember,
  type FamilySentiment,
  type OverviewStats,
  type InitStatus,
  type InitStep,
  SENTIMENT_COLORS,
  WARD_STATUS_COLORS,
  SENTIMENT_LABELS,
  seededRandom,
  getDotSize,
  getOpacity,
  generateHexagonPath,
  generatePhyllotaxisPositions,
  getWardHeatColor,
  getStrategicVerdict,
  generateWardRingLayout,
  IntelligenceCard,
  HouseIntelligenceCard,
  WardCard,
  FamilyMemberCard,
  FamilyDetailsPanel,
  TagDialog,
  InitializationPanel,
} from "@/components/voters-map";

// --- Components ---

// Tactical SVG Heatmap - "War Room" View
function TacticalHeatmap({
  wards,
  houses,
  selectedWard,
  selectedHouse,
  view,
  scale,
  position,
  onSelectWard,
  onSelectHouse,
  isDragging,
}: {
  wards: WardData[];
  houses: HouseData[];
  selectedWard: WardData | null;
  selectedHouse: HouseData | null;
  view: "wards" | "houses";
  scale: number;
  position: { x: number; y: number };
  onSelectWard: (ward: WardData) => void;
  onSelectHouse: (house: HouseData) => void;
  isDragging: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const lastMoveTime = useRef<number>(0);
  const [hoveredWard, setHoveredWard] = useState<WardData | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<HouseData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Cache bounding rect on mount and when scale/position changes
  useEffect(() => {
    rectRef.current = svgRef.current?.getBoundingClientRect() || null;
  }, [scale, position]);

  // Calculate ward positions in ring layout
  const wardPositions = useMemo(() => {
    return generateWardRingLayout(wards.length, 500, 400, 600);
  }, [wards.length]);

  // Calculate house positions using phyllotaxis spiral
  const housePositions = useMemo(() => {
    if (!selectedWard || houses.length === 0) return [];
    return generatePhyllotaxisPositions(houses.length, 500, 400, 350);
  }, [selectedWard, houses.length]);

  // Handle mouse move for tooltip positioning - throttled to 60fps
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMoveTime.current < 16) return; // ~60fps throttle
    lastMoveTime.current = now;

    if (rectRef.current) {
      setTooltipPos({
        x: e.clientX - rectRef.current.left,
        y: e.clientY - rectRef.current.top,
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 800"
        className="w-full h-full"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          willChange: "transform", // Hint to browser for GPU acceleration
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Definitions for patterns and gradients */}
        <defs>
          {/* Blueprint grid pattern - tactical feel */}
          <pattern
            id="gridPattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.15" />
          </pattern>

          {/* Arterial road pattern */}
          <pattern
            id="roadPattern"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="5"
              x2="10"
              y2="5"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>

          {/* Glow filter for selected elements */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow for polygons */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Background - The "Terrain" */}
        <rect width="1000" height="800" className="fill-background" />
        <rect
          width="1000"
          height="800"
          fill="url(#gridPattern)"
          className="text-muted-foreground"
        />

        {/* Arterial Roads - Visual anchor points radiating from center */}
        <g className="text-muted-foreground" opacity="0.3">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="500"
              y1="400"
              x2={500 + 500 * Math.cos((angle * Math.PI) / 180)}
              y2={400 + 400 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.4"
            />
          ))}
          {/* Central chowk circle */}
          <circle
            cx="500"
            cy="400"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle
            cx="500"
            cy="400"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.2"
          />
        </g>

        {view === "wards" ? (
          /* Ward Polygons View - "Strategic Zones" */
          <g>
            {wards.map((ward, index) => {
              const pos = wardPositions[index] || { x: 500, y: 400 };
              const wardSize = 50 + ward.total_voters / 50;
              const heatColor = getWardHeatColor(ward.win_margin_percent);
              const isSelected = selectedWard?.ward_no === ward.ward_no;
              const isHovered = hoveredWard?.ward_no === ward.ward_no;

              return (
                <g key={ward.ward_no}>
                  {/* Ward polygon - hexagonal shape */}
                  <path
                    d={generateHexagonPath(
                      pos.x,
                      pos.y,
                      wardSize,
                      0.1,
                      parseInt(ward.ward_no) || index
                    )}
                    fill={heatColor}
                    fillOpacity={isSelected ? 0.9 : isHovered ? 0.8 : 0.6}
                    stroke={isSelected ? "hsl(var(--primary))" : "white"}
                    strokeWidth={isSelected ? 4 : 2}
                    filter={isSelected ? "url(#glow)" : "url(#shadow)"}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectWard(ward)}
                    onMouseEnter={() => setHoveredWard(ward)}
                    onMouseLeave={() => setHoveredWard(null)}
                    style={{
                      transform:
                        isHovered && !isSelected ? "scale(1.05)" : "scale(1)",
                      transformOrigin: `${pos.x}px ${pos.y}px`,
                    }}
                  />

                  {/* Ward number label */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={isSelected ? "18" : "14"}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {ward.ward_no}
                  </text>

                  {/* Mini sentiment dots around ward */}
                  {ward.swing_count > 0 && (
                    <circle
                      cx={pos.x + wardSize * 0.6}
                      cy={pos.y - wardSize * 0.6}
                      r="8"
                      fill={SENTIMENT_COLORS.swing}
                      stroke="white"
                      strokeWidth="2"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}
          </g>
        ) : (
          /* House Dots View - "Tactical Units" with Phyllotaxis Spiral */
          <g>
            {/* Ward boundary indicator */}
            {selectedWard && (
              <circle
                cx="500"
                cy="400"
                r="380"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="10,5"
                opacity="0.3"
              />
            )}

            {/* House dots in spiral pattern */}
            {houses.map((house, index) => {
              const pos = housePositions[index] || { x: 500, y: 400 };
              const dotSize = getDotSize(house.family_size);
              const color = SENTIMENT_COLORS[house.sentiment];
              const opacity = getOpacity(house.confidence);
              const isSelected = selectedHouse?.house_no === house.house_no;
              const isHovered = hoveredHouse?.house_no === house.house_no;

              return (
                <g key={house.house_no}>
                  {/* House dot */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={dotSize / 2}
                    fill={color}
                    fillOpacity={opacity}
                    stroke={
                      isSelected
                        ? "hsl(var(--primary))"
                        : house.has_manual_tag
                        ? "white"
                        : "transparent"
                    }
                    strokeWidth={isSelected ? 3 : house.has_manual_tag ? 2 : 0}
                    filter={isSelected ? "url(#glow)" : undefined}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectHouse(house)}
                    onMouseEnter={() => setHoveredHouse(house)}
                    onMouseLeave={() => setHoveredHouse(null)}
                    style={{
                      transform:
                        isHovered || isSelected ? "scale(1.3)" : "scale(1)",
                      transformOrigin: `${pos.x}px ${pos.y}px`,
                    }}
                  />

                  {/* Manual tag indicator */}
                  {house.has_manual_tag && (
                    <circle
                      cx={pos.x + dotSize / 2}
                      cy={pos.y - dotSize / 2}
                      r="4"
                      fill="white"
                      stroke={color}
                      strokeWidth="1"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Center marker */}
        <circle
          cx="500"
          cy="400"
          r="6"
          fill="hsl(var(--primary))"
          opacity="0.5"
        />
      </svg>

      {/* Floating Intelligence Card - Ward Hover */}
      {hoveredWard && view === "wards" && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: Math.min(tooltipPos.x + 15, window.innerWidth - 280),
            top: tooltipPos.y - 10,
          }}
        >
          <IntelligenceCard ward={hoveredWard} />
        </div>
      )}

      {/* Floating Intelligence Card - House Hover */}
      {hoveredHouse && view === "houses" && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: Math.min(tooltipPos.x + 15, window.innerWidth - 250),
            top: tooltipPos.y - 10,
          }}
        >
          <HouseIntelligenceCard house={hoveredHouse} />
        </div>
      )}
    </div>
  );
}

// --- Main Page Component ---
export default function VotersMapPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  // Initialization State
  const [initStatus, setInitStatus] = useState<InitStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStep, setInitStep] = useState<InitStep>("idle");
  const [initError, setInitError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // State
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null);
  const [familyData, setFamilyData] = useState<FamilySentiment | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [housesError, setHousesError] = useState<string | null>(null);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedVoterForTag, setSelectedVoterForTag] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"wards" | "houses">("wards");

  // Canvas State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Helper to derive status from win margin
  const getWardStatus = (margin: number): "safe" | "battleground" | "lost" => {
    if (margin > 10) return "safe";
    if (margin >= -5) return "battleground";
    return "lost";
  };

  // Fetch real data from API
  const fetchMapData = useCallback(async () => {
    if (!selectedListId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch ward stats from existing API
      const statsData = await api.getStatsRaw(selectedListId);

      // Transform ward_stats into WardData format
      const wardData: WardData[] = statsData.ward_stats.map((ward, i) => {
        // For now, sentiment data comes from computed_sentiments table
        // Until we have a dedicated endpoint, we estimate based on age distribution
        // Youth (18-25) are ~20% of voters, marked as swing
        const estimatedSwing = Math.floor(ward.voters * 0.2);
        const support = 0; // No manual tags yet
        const oppose = 0; // No manual tags yet
        const margin = 0; // No support/oppose = neutral

        return {
          ward_no: ward.ward_no,
          total_voters: ward.voters,
          support_count: support,
          oppose_count: oppose,
          swing_count: estimatedSwing,
          win_margin_percent: margin,
          status: "battleground" as const, // All wards neutral until tagged
          center: {
            // Arrange wards in a grid pattern
            x: 100 + (i % 4) * 200 + (Math.random() * 30 - 15),
            y: 100 + Math.floor(i / 4) * 150 + (Math.random() * 30 - 15),
          },
        };
      });

      setWards(wardData);

      // Calculate overview from real ward data
      const totalVoters = statsData.metadata.total_voters;
      const totalSwing = wardData.reduce((sum, w) => sum + w.swing_count, 0);
      const totalSupport = 0;
      const totalOppose = 0;
      const totalUnknown = totalVoters - totalSwing;

      setOverview({
        total_voters: totalVoters,
        sentiment_breakdown: {
          support: totalSupport,
          oppose: totalOppose,
          swing: totalSwing,
          unknown: totalUnknown,
        },
        ward_status: {
          safe: 0,
          battleground: wardData.length,
          lost: 0,
        },
        win_projection: {
          support: totalSupport,
          oppose: totalOppose,
          margin: 0,
          margin_percent: 0,
        },
      });
    } catch (err) {
      console.error("Error fetching map data:", err);
      setError("Failed to load map data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  // Check initialization status and load data on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!selectedListId) {
        setCheckingStatus(false);
        return;
      }

      try {
        // Try to fetch actual data - if it works, data is ready
        await fetchMapData();

        setInitStatus({
          sentiments_computed: true,
          coords_generated: true,
          last_computed_at: new Date().toISOString(),
          total_tagged: 0,
          is_ready: true,
        });
      } catch (err) {
        console.error("Error checking status:", err);
        setInitError("Failed to check initialization status");
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [selectedListId, fetchMapData]);

  // Load map data - now uses fetchMapData which calls real API
  const loadMapData = useCallback(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Handle initialization - calls real API to compute sentiments
  const handleInitialize = async () => {
    if (!selectedListId) {
      setInitError("No voter list selected. Please select a list first.");
      return;
    }

    setIsInitializing(true);
    setInitError(null);

    try {
      // Step 1: Compute Sentiments using real API
      setInitStep("computing");
      await api.computeSentiments(selectedListId);

      // Step 2: Generate Coordinates using real API
      setInitStep("generating");
      await api.generateMapCoords(selectedListId);

      // Update status
      setInitStep("done");
      setInitStatus({
        sentiments_computed: true,
        coords_generated: true,
        last_computed_at: new Date().toISOString(),
        total_tagged: 0,
        is_ready: true,
      });

      // Load map data after a short delay
      setTimeout(() => {
        fetchMapData();
      }, 500);
    } catch (err) {
      console.error("Initialization error:", err);
      setInitStep("error");
      setInitError("Initialization failed. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Load houses when ward is selected
  const handleSelectWard = useCallback(
    async (ward: WardData) => {
      if (!selectedListId) return;

      setSelectedWard(ward);
      setLoadingHouses(true);
      setHousesError(null);
      setView("houses");

      try {
        // Try to fetch real house data from API
        const response = await api.getWardHouses(ward.ward_no, selectedListId);

        // Transform API response to HouseData format - handle nested data structure
        const houseData = response.data?.houses || response.houses || [];
        const mappedHouses: HouseData[] = houseData.map((h, i) => ({
          house_no: h.house_no || String(100 + i),
          family_size: h.family_size || 3,
          sentiment: (h.sentiment as HouseData["sentiment"]) || "unknown",
          support_count: h.support_count || 0,
          oppose_count: h.oppose_count || 0,
          swing_count: h.swing_count || 0,
          confidence: h.confidence || 0.5,
          has_manual_tag: h.has_manual_tag || false,
          position: h.position || {
            // Deterministic position based on index
            x: 50 + (i % 10) * 70 + seededRandom(i * 100) * 30,
            y: 50 + Math.floor(i / 10) * 60 + seededRandom(i * 100 + 50) * 30,
          },
        }));

        setHouses(mappedHouses);
        setHousesError(null);
      } catch (err) {
        console.error("Error fetching houses:", err);
        setHouses([]);
        setHousesError("Failed to load house data. Please try again.");
      } finally {
        setLoadingHouses(false);
        setPosition({ x: 0, y: 0 });
        setScale(1);
      }
    },
    [selectedListId]
  );

  // Load family when house is selected
  const handleSelectHouse = useCallback(
    async (house: HouseData) => {
      if (!selectedWard || !selectedListId) return;
      setSelectedHouse(house);
      setLoadingFamily(true);

      try {
        // Fetch real family sentiment data from API
        const response = await api.getFamilySentiments(
          selectedWard.ward_no,
          house.house_no,
          selectedListId
        );

        // API response is typed - use it directly
        const members = response.members || [];
        const sentimentBreakdown = response.sentiment_breakdown || {
          support: members.filter((m) => m.sentiment === "support").length,
          oppose: members.filter((m) => m.sentiment === "oppose").length,
          swing: members.filter((m) => m.sentiment === "swing").length,
          unknown: members.filter(
            (m) => m.sentiment === "unknown" || !m.sentiment
          ).length,
        };

        const familyData: FamilySentiment = {
          ward_no: response.ward_no || selectedWard.ward_no,
          house_no: response.house_no || house.house_no,
          family_size: response.family_size || members.length,
          dominant_sentiment: response.dominant_sentiment || house.sentiment,
          sentiment_breakdown: sentimentBreakdown,
          has_manual_tags: response.has_manual_tags || false,
          members: members.map((m) => ({
            voter_id: m.voter_id,
            name: m.name,
            age: m.age,
            gender: m.gender,
            relationship: m.relationship || "family",
            sentiment: (m.sentiment as FamilyMember["sentiment"]) || "unknown",
            sentiment_source: m.sentiment_source || "none",
            confidence: m.confidence || 0.5,
            is_manually_tagged: m.is_manually_tagged || false,
            inherited_from: m.inherited_from || null,
          })),
        };

        setFamilyData(familyData);
        setFamilyError(null);
      } catch (err) {
        console.error("Error fetching family data:", err);
        setFamilyData(null);
        setFamilyError("Failed to load family data. Please try again.");
      } finally {
        setLoadingFamily(false);
      }
    },
    [selectedWard, selectedListId]
  );

  // Tag voter handler - uses real API
  const handleTagVoter = async (
    voterId: number,
    sentiment: "support" | "oppose" | "swing" | "unknown"
  ) => {
    if (!selectedListId) return;

    setIsTagging(true);

    try {
      // Call real API to tag voter
      await api.tagVoter(voterId, {
        sentiment: sentiment,
        ripple_to_family: true, // Propagate to family members
      });

      // Update local state on success
      if (familyData) {
        setFamilyData({
          ...familyData,
          members: familyData.members.map((m) =>
            m.voter_id === voterId
              ? {
                  ...m,
                  sentiment: sentiment as FamilyMember["sentiment"],
                  sentiment_source: "manual",
                  is_manually_tagged: true,
                  confidence: 1,
                }
              : m
          ),
        });
      }

      // Refresh ward data to reflect changes
      fetchMapData();
    } catch (err) {
      console.error("Error tagging voter:", err);
      // Could show toast here
    } finally {
      setIsTagging(false);
    }
  };

  // Canvas handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(Math.max(0.5, s * delta), 3));
    } else {
      setPosition((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const endDrag = () => setIsDragging(false);

  // Show loading while checking status
  if (checkingStatus || listLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading map data...
          </p>
        </div>
      </div>
    );
  }

  // Show initialization panel if data is not ready
  if (!initStatus?.is_ready && initStep !== "done") {
    return (
      <TooltipProvider delayDuration={200}>
        <PageHeader
          title="Voters Map"
          description="Sentiment heatmap and voter tagging"
        />
        <div className="p-6">
          <InitializationPanel
            status={initStatus}
            onInitialize={handleInitialize}
            isInitializing={isInitializing}
            initStep={initStep}
            error={initError}
          />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-screen">
        <PageHeader
          title="Voters Map"
          description="Tactical sentiment heatmap and voter tagging"
        >
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={view === "wards" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setView("wards");
                  setSelectedWard(null);
                  setSelectedHouse(null);
                  setFamilyData(null);
                  setHouses([]);
                }}
              >
                <Map size={14} className="mr-1" />
              Wards
            </Button>
            {selectedWard && (
              <Button
                variant={view === "houses" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
              >
                <Home size={14} className="mr-1" />
                Ward {selectedWard.ward_no}
              </Button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
              className="h-8 w-8"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              className="h-8 w-8"
            >
              <ZoomOut size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="h-8 w-8"
            >
              <Maximize size={16} />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMapData()}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={cn("mr-1", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar - Stats & Ward List */}
        <div className="w-72 border-r border-border flex flex-col bg-card shrink-0 h-full overflow-hidden">
          {/* Ward/House List with Stats */}
          <ScrollArea className="flex-1 h-full">
            {/* Overview Stats */}
            {overview && (
              <div className="p-4 border-b border-border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-2xl font-bold text-foreground">
                      {overview.total_voters.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Voters
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        overview.win_projection.margin > 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {overview.win_projection.margin > 0 ? "+" : ""}
                      {overview.win_projection.margin_percent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Win Margin
                    </div>
                  </Card>
                </div>

                {/* Sentiment Breakdown */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Sentiment Distribution</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full bg-green-500 cursor-pointer transition-all hover:brightness-110"
                          style={{
                            width: `${
                              (overview.sentiment_breakdown.support /
                                overview.total_voters) *
                              100
                            }%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Support: {overview.sentiment_breakdown.support}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full bg-red-500 cursor-pointer transition-all hover:brightness-110"
                          style={{
                            width: `${
                              (overview.sentiment_breakdown.oppose /
                                overview.total_voters) *
                              100
                            }%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Oppose: {overview.sentiment_breakdown.oppose}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full bg-yellow-500 cursor-pointer transition-all hover:brightness-110"
                          style={{
                            width: `${
                              (overview.sentiment_breakdown.swing /
                                overview.total_voters) *
                              100
                            }%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Swing: {overview.sentiment_breakdown.swing}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex justify-between text-[10px] mt-2">
                    <span className="text-green-600">
                      👍 {overview.sentiment_breakdown.support}
                    </span>
                    <span className="text-red-600">
                      👎 {overview.sentiment_breakdown.oppose}
                    </span>
                    <span className="text-yellow-600">
                      🎯 {overview.sentiment_breakdown.swing}
                    </span>
                    <span className="text-muted-foreground">
                      ❓ {overview.sentiment_breakdown.unknown}
                    </span>
                  </div>
                </div>

                {/* Ward Status Pills */}
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="flex-1 justify-center border-green-500 text-green-600 text-[10px]"
                  >
                    {overview.ward_status.safe} Safe
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex-1 justify-center border-yellow-500 text-yellow-600 text-[10px]"
                  >
                    {overview.ward_status.battleground} Battle
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex-1 justify-center border-red-500 text-red-600 text-[10px]"
                  >
                    {overview.ward_status.lost} Lost
                  </Badge>
                </div>
              </div>
            )}

            {/* Ward/House List */}
            <div className="p-3 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {view === "wards"
                  ? "Wards"
                  : `Houses in Ward ${selectedWard?.ward_no}`}
              </h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading...
                  </p>
                </div>
              ) : view === "wards" ? (
                wards.map((ward) => (
                  <WardCard
                    key={ward.ward_no}
                    ward={ward}
                    isSelected={selectedWard?.ward_no === ward.ward_no}
                    onClick={() => handleSelectWard(ward)}
                  />
                ))
              ) : loadingHouses ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading houses...
                  </p>
                </div>
              ) : housesError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <AlertTriangle size={24} className="text-red-500" />
                  <p className="text-sm text-red-600 mt-2 text-center">
                    {housesError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      selectedWard && handleSelectWard(selectedWard)
                    }
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Retry
                  </Button>
                </div>
              ) : houses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Home size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    No houses found in this ward
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {houses.slice(0, 30).map((house) => (
                    <button
                      key={house.house_no}
                      onClick={() => handleSelectHouse(house)}
                      className={cn(
                        "w-full p-2 rounded-lg border text-left transition-all text-sm",
                        selectedHouse?.house_no === house.house_no
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                SENTIMENT_COLORS[house.sentiment],
                            }}
                          />
                          <span className="font-medium">
                            House {house.house_no}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {house.family_size}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="p-3 border-t border-border bg-muted/30">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Sentiment Legend
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Oppose</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Swing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span>Unknown</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 flex flex-col relative bg-background">
          {/* Tactical SVG Heatmap Canvas */}
          <div
            ref={canvasRef}
            className={cn(
              "flex-1 overflow-hidden relative",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onWheel={handleWheel}
          >
            <TacticalHeatmap
              wards={wards}
              houses={houses}
              selectedWard={selectedWard}
              selectedHouse={selectedHouse}
              view={view}
              scale={scale}
              position={position}
              onSelectWard={handleSelectWard}
              onSelectHouse={handleSelectHouse}
              isDragging={isDragging}
            />
          </div>

          {/* Heat Scale Legend - Bottom Left */}
          <div className="absolute bottom-4 left-4 z-10">
            <Card className="p-3 bg-card/95 backdrop-blur-sm">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Heat Scale
              </h4>
              <div className="flex items-center gap-1">
                <div
                  className="w-6 h-4 rounded-sm"
                  style={{ backgroundColor: WARD_STATUS_COLORS.safe }}
                />
                <div
                  className="w-6 h-4 rounded-sm"
                  style={{ backgroundColor: WARD_STATUS_COLORS.leaning }}
                />
                <div
                  className="w-6 h-4 rounded-sm"
                  style={{ backgroundColor: WARD_STATUS_COLORS.battleground }}
                />
                <div
                  className="w-6 h-4 rounded-sm"
                  style={{ backgroundColor: WARD_STATUS_COLORS.contested }}
                />
                <div
                  className="w-6 h-4 rounded-sm"
                  style={{ backgroundColor: WARD_STATUS_COLORS.lost }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>Safe</span>
                <span>Lost</span>
              </div>
            </Card>
          </div>

          {/* Instructions Overlay */}
          {!selectedWard && view === "wards" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <Card className="px-4 py-2 bg-card/95 backdrop-blur-sm flex items-center gap-2 text-sm text-muted-foreground">
                <Target size={16} className="text-primary" />
                <span>
                  Hover over a ward for intelligence • Click to explore houses
                </span>
              </Card>
            </div>
          )}

          {view === "houses" && !selectedHouse && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <Card className="px-4 py-2 bg-card/95 backdrop-blur-sm flex items-center gap-2 text-sm text-muted-foreground">
                <Home size={16} className="text-green-600" />
                <span>
                  Click on a house to view family details and tag voters
                </span>
              </Card>
            </div>
          )}
        </div>

        {/* Family Details Panel - show loading, error, or data */}
        {(loadingFamily || familyError || familyData) && selectedHouse && (
          <div className="fixed right-4 top-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-card shadow-2xl z-50 border border-border rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {loadingFamily ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-3">
                  Loading family data...
                </p>
              </div>
            ) : familyError ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <AlertTriangle size={32} className="text-red-500" />
                <p className="text-sm text-red-600 mt-3 text-center">
                  {familyError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    selectedHouse && handleSelectHouse(selectedHouse)
                  }
                >
                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setFamilyError(null);
                    setSelectedHouse(null);
                  }}
                >
                  Close
                </Button>
              </div>
            ) : familyData ? (
              <FamilyDetailsPanel
                family={familyData}
                onClose={() => {
                  setFamilyData(null);
                  setSelectedHouse(null);
                  setFamilyError(null);
                }}
                onTagVoter={handleTagVoter}
                isTagging={isTagging}
              />
            ) : null}
          </div>
        )}

        {/* Backdrop for family panel */}
        {(loadingFamily || familyError || familyData) && selectedHouse && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => {
              setFamilyData(null);
              setFamilyError(null);
              setSelectedHouse(null);
            }}
          />
        )}

        {/* Tag Dialog */}
        <TagDialog
          open={tagDialogOpen}
          onOpenChange={setTagDialogOpen}
          voter={selectedVoterForTag}
          onSubmit={async (data) => {
            if (selectedVoterForTag) {
              await handleTagVoter(selectedVoterForTag.id, data.sentiment);
            }
            setTagDialogOpen(false);
            setSelectedVoterForTag(null);
          }}
          isLoading={isTagging}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}
