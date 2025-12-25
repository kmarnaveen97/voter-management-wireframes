"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map as MapIcon,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Home,
  User,
  Search,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronRight,
  ChevronDown,
  Loader2,
  BarChart3,
  Crosshair,
  Shield,
  Swords,
  Flag,
  Eye,
  X,
  Heart,
  Calendar,
  Hash,
  UserCheck,
  Users2,
  ChevronLeft,
  Keyboard,
  Calculator,
  Terminal,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type WardMapSummary,
  type HousePosition,
  type SentimentOverview,
  type TargetVoter,
  type SentimentType,
  type Family,
  type FamilySentiment,
} from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  useWarRoomData,
  useTagHouseSentiment,
  useTagSingleVoter,
  useRemoveHouseSentiment,
  useComputeSentiments,
  useCoverageStats,
} from "@/hooks/use-war-room";

// Import extracted war-room components
import {
  SENTIMENT_COLORS,
  WARD_STATUS_COLORS,
  KEYBOARD_SHORTCUTS,
  WarRoomSkeleton,
  StatCard,
  WinProbabilityGauge,
  SentimentBar,
  FloatingPriorityTargets,
  TargetList,
  WardHoverCard,
  HouseDetailsDialog,
  FamilyMemberItem,
  FamilyCard,
  WardFamiliesPanel,
  WardWarRoom,
  VillageMap,
} from "@/components/war-room";
import { StrategyPanel } from "@/components/war-room/strategy-panel";
import { OpponentSelectorDialog } from "@/components/voters/opponent-selector-dialog";

// ============================================================================
// Geo-Simulation Engine (kept here due to Map-based return types)
// ============================================================================

// Generate house positions in spiral pattern within a ward
function generateHouseSpiral(
  houseCount: number,
  centerX: number,
  centerY: number,
  maxRadius: number
): { x: number; y: number; size: number }[] {
  const positions = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < houseCount; i++) {
    const radius = (maxRadius * 0.8 * Math.sqrt(i + 1)) / Math.sqrt(houseCount);
    const angle = i * goldenAngle;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      size: 6,
    });
  }

  return positions;
}

// ============================================================================
// Ward War Room - Full screen view of a single ward with houses grid
// ============================================================================

// Generate house grid positions for ward war room (organized layout)
function generateHouseGridPositions(
  houseCount: number,
  containerWidth: number,
  containerHeight: number
): Array<{ x: number; y: number; row: number; col: number }> {
  const positions: Array<{ x: number; y: number; row: number; col: number }> =
    [];

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(houseCount * 1.5)); // More columns than rows
  const rows = Math.ceil(houseCount / cols);

  const cellWidth = containerWidth / (cols + 1);
  const cellHeight = containerHeight / (rows + 1);
  const spacing = Math.min(cellWidth, cellHeight);

  const startX = (containerWidth - (cols - 1) * spacing) / 2;
  const startY = (containerHeight - (rows - 1) * spacing) / 2;

  for (let i = 0; i < houseCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    positions.push({
      x: startX + col * spacing,
      y: startY + row * spacing,
      row,
      col,
    });
  }

  return positions;
}

export default function WarRoomPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  // ─────────────────────────────────────────────────────────────────────────
  // React Query Hooks for Data Fetching
  // ─────────────────────────────────────────────────────────────────────────
  const {
    overview,
    wards,
    houses,
    targets,
    isLoading: dataLoading,
    isFetching,
    error: dataError,
    refetch: refetchData,
  } = useWarRoomData(selectedListId);

  // Derived loading/error states
  const loading = listLoading || dataLoading;
  const error = dataError;

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations for Tagging Operations
  // ─────────────────────────────────────────────────────────────────────────
  const tagHouseMutation = useTagHouseSentiment(selectedListId);
  const tagSingleVoterMutation = useTagSingleVoter(selectedListId);
  const removeHouseMutation = useRemoveHouseSentiment(selectedListId);
  const computeSentimentsMutation = useComputeSentiments(selectedListId);

  // Fetch our candidate (for support sentiment tagging)
  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", selectedListId],
    queryFn: () => api.getCandidates({ list_id: selectedListId! }),
    enabled: !!selectedListId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const ourCandidateId = useMemo(() => {
    const ourCandidate = candidatesData?.candidates?.find(
      (c) => c.is_our_candidate
    );
    return ourCandidate?.candidate_id ?? ourCandidate?.id ?? null;
  }, [candidatesData]);

  // Derived tagging state
  const isTagging = tagHouseMutation.isPending || removeHouseMutation.isPending;
  const isComputing = computeSentimentsMutation.isPending;

  // Coverage stats computed via hook
  const coverageStats = useCoverageStats(houses);

  // Refs for timeout cleanup to prevent memory leaks
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      if (searchBlurTimeoutRef.current) {
        clearTimeout(searchBlurTimeoutRef.current);
      }
    };
  }, []);

  // Ripple animation state - tracks which house was just tagged
  const [rippleHouse, setRippleHouse] = useState<{
    wardNo: string;
    houseNo: string;
  } | null>(null);

  // UI State
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoveredWardData, setHoveredWardData] = useState<WardMapSummary | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<HousePosition | null>(
    null
  );
  const [isHouseDialogOpen, setIsHouseDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // New UI State for improvements
  const [sentimentFilters, setSentimentFilters] = useState<Set<SentimentType>>(
    new Set(["support", "oppose", "swing", "unknown", "neutral"])
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hoveredMapHouse, setHoveredMapHouse] = useState<string | null>(null); // house_no of hovered house on map
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [sessionStats, setSessionStats] = useState({ tagged: 0, voters: 0 });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showWardWarRoom, setShowWardWarRoom] = useState(false); // Toggle ward war room view
  const [showStrategyPanel, setShowStrategyPanel] = useState(false); // Strategy Engine panel
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile menu sheet
  const [displayMode, setDisplayMode] = useState<"sentiment" | "turnout">(
    "sentiment"
  ); // Toggle sentiment/turnout view
  const [isOnline, setIsOnline] = useState(true); // Network status
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // Last data update time

  // Opponent selector dialog state (for oppose sentiment)
  const [opponentDialogOpen, setOpponentDialogOpen] = useState(false);
  const [pendingOpposeData, setPendingOpposeData] = useState<{
    type: "house" | "voter";
    wardNo: string;
    houseNo?: string;
    voterId?: number;
    familySize?: number;
    previousSentiment?: SentimentType;
  } | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Track data freshness
  useEffect(() => {
    if (overview || wards.length > 0) {
      setLastUpdated(new Date());
    }
  }, [overview, wards]);

  // Search results - filter houses and targets based on query
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return { houses: [], targets: [] };

    const query = debouncedSearchQuery.toLowerCase();
    const matchedHouses: Array<HousePosition & { wardNo: string }> = [];
    const matchedTargets: TargetVoter[] = [];

    // Search through houses
    houses.forEach((wardHouses, wardNo) => {
      wardHouses.forEach((house) => {
        if (house.house_no.toLowerCase().includes(query)) {
          matchedHouses.push({ ...house, wardNo });
        }
      });
    });

    // Search through targets
    targets.forEach((target) => {
      if (
        target.name.toLowerCase().includes(query) ||
        target.house_no.toLowerCase().includes(query) ||
        target.ward_no.toLowerCase().includes(query)
      ) {
        matchedTargets.push(target);
      }
    });

    return {
      houses: matchedHouses.slice(0, 5),
      targets: matchedTargets.slice(0, 5),
    };
  }, [debouncedSearchQuery, houses, targets]);

  // Find next untagged house
  const findNextUntagged = useCallback(() => {
    for (const [wardNo, wardHouses] of houses) {
      const untagged = wardHouses.find((h) => h.sentiment === "unknown");
      if (untagged) {
        setSelectedWard(wardNo);
        setSelectedHouse({ ...untagged, ward_no: wardNo });
        setIsHouseDialogOpen(true);
        return;
      }
    }
    toast.info("All houses have been tagged! 🎉");
  }, [houses]);

  // Toggle sentiment filter
  const toggleSentimentFilter = (sentiment: SentimentType) => {
    setSentimentFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sentiment)) {
        // Don't allow removing all filters
        if (newSet.size > 1) {
          newSet.delete(sentiment);
        }
      } else {
        newSet.add(sentiment);
      }
      return newSet;
    });
  };

  // Handlers
  const handleWardHover = (ward: WardMapSummary, e: React.MouseEvent) => {
    setHoveredWard(ward.ward_no);
    setHoveredWardData(ward);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  };

  const handleWardLeave = () => {
    setHoveredWard(null);
    setHoveredWardData(null);
  };

  const handleHouseClick = (house: HousePosition) => {
    setSelectedHouse(house);
    setIsHouseDialogOpen(true);
  };

  // Store previous sentiment for undo
  const lastTagRef = useRef<{
    wardNo: string;
    houseNo: string;
    previousSentiment: SentimentType;
    newSentiment: SentimentType;
  } | null>(null);

  // Sentiment label mapping
  const sentimentLabels: Record<SentimentType, string> = {
    support: "Support 👍",
    oppose: "Oppose 👎",
    swing: "Swing 🤷",
    unknown: "Unknown",
    neutral: "Neutral",
  };

  const handleTagSentiment = async (
    wardNo: string,
    houseNo: string,
    sentiment: SentimentType,
    candidateId?: number
  ) => {
    // Prevent double-clicks
    if (isTagging) return;

    // Find the house to get current sentiment
    const wardHouses = houses.get(wardNo);
    const house = wardHouses?.find((h) => h.house_no === houseNo);
    const previousSentiment = house?.sentiment || "unknown";
    const familySize = house?.family_size || 1;

    // For "oppose" sentiment without candidateId, show opponent selector dialog
    if (sentiment === "oppose" && !candidateId) {
      setPendingOpposeData({
        type: "house",
        wardNo,
        houseNo,
        familySize,
        previousSentiment,
      });
      setOpponentDialogOpen(true);
      return;
    }

    // Store for undo
    lastTagRef.current = {
      wardNo,
      houseNo,
      previousSentiment,
      newSentiment: sentiment,
    };

    // Update session stats optimistically
    if (previousSentiment === "unknown" && sentiment !== "unknown") {
      setSessionStats((prev) => ({
        tagged: prev.tagged + 1,
        voters: prev.voters + familySize,
      }));
    }

    setIsHouseDialogOpen(false);

    // Trigger ripple animation with proper cleanup
    setRippleHouse({ wardNo, houseNo });
    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current);
    }
    rippleTimeoutRef.current = setTimeout(() => setRippleHouse(null), 1500);

    // Determine candidate ID based on sentiment
    // - support: our candidate
    // - oppose: opponent candidate (passed as parameter)
    // - swing/neutral: our candidate (they're undecided about our candidate)
    const effectiveCandidateId =
      sentiment === "oppose" ? candidateId : ourCandidateId ?? undefined;

    // Execute mutation with optimistic updates
    tagHouseMutation.mutate(
      {
        wardNo,
        houseNo,
        sentiment,
        familySize,
        previousSentiment,
        candidateId: effectiveCandidateId,
      },
      {
        onSuccess: () => {
          toast.success(
            `House ${houseNo} marked as ${sentimentLabels[sentiment]}`,
            {
              description: `Ward ${wardNo} • ${familySize} family members updated`,
              duration: 5000,
            }
          );
        },
        onError: () => {
          toast.error("Failed to tag house sentiment");
        },
      }
    );
  };

  // Handler for tagging a single voter (from family panel)
  const handleTagSingleVoter = async (
    voterId: number,
    sentiment: SentimentType,
    candidateId?: number
  ) => {
    if (!selectedListId || !selectedWard) return;

    // For "oppose" sentiment without candidateId, show opponent selector dialog
    if (sentiment === "oppose" && !candidateId) {
      setPendingOpposeData({
        type: "voter",
        wardNo: selectedWard,
        voterId,
      });
      setOpponentDialogOpen(true);
      return;
    }

    // Update session stats optimistically
    setSessionStats((prev) => ({
      tagged: prev.tagged + 1,
      voters: prev.voters + 1,
    }));

    // Determine candidate ID based on sentiment
    const effectiveCandidateId =
      sentiment === "oppose" ? candidateId : ourCandidateId ?? undefined;

    tagSingleVoterMutation.mutate({
      voterId,
      sentiment,
      wardNo: selectedWard,
      candidateId: effectiveCandidateId,
    });
  };

  // Handler for when opponent is selected from dialog
  const handleConfirmOppose = useCallback(
    async (candidateId: number) => {
      if (!pendingOpposeData) return;

      if (pendingOpposeData.type === "house" && pendingOpposeData.houseNo) {
        await handleTagSentiment(
          pendingOpposeData.wardNo,
          pendingOpposeData.houseNo,
          "oppose",
          candidateId
        );
      } else if (
        pendingOpposeData.type === "voter" &&
        pendingOpposeData.voterId
      ) {
        await handleTagSingleVoter(
          pendingOpposeData.voterId,
          "oppose",
          candidateId
        );
      }

      // Reset state
      setPendingOpposeData(null);
      setOpponentDialogOpen(false);
    },
    [pendingOpposeData]
  );

  // Handler for removing house sentiment tag
  const handleRemoveHouseTag = async (wardNo: string, houseNo: string) => {
    if (isTagging) return;

    const wardHouses = houses.get(wardNo);
    const house = wardHouses?.find((h) => h.house_no === houseNo);
    const previousSentiment = house?.sentiment || "unknown";
    const familySize = house?.family_size || 1;

    setIsHouseDialogOpen(false);

    removeHouseMutation.mutate({
      wardNo,
      houseNo,
      familySize,
      previousSentiment,
    });
  };

  // Compute sentiments handler
  const handleComputeSentiments = useCallback(() => {
    if (!selectedListId) {
      toast.error("No voter list selected");
      return;
    }
    computeSentimentsMutation.mutate();
  }, [selectedListId, computeSentimentsMutation]);

  // Keyboard shortcuts for tagging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (work anytime)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      // ESC to close ward war room
      if (e.key === "Escape" && showWardWarRoom) {
        e.preventDefault();
        setShowWardWarRoom(false);
        setSelectedWard(null);
        return;
      }

      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !isHouseDialogOpen) {
        e.preventDefault();
        findNextUntagged();
        return;
      }

      if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
        return;
      }

      // Only handle if house dialog is open
      if (!isHouseDialogOpen || !selectedHouse) return;

      const key = e.key;
      if (key in KEYBOARD_SHORTCUTS) {
        e.preventDefault();
        const sentiment =
          KEYBOARD_SHORTCUTS[key as keyof typeof KEYBOARD_SHORTCUTS];
        if (sentiment) {
          handleTagSentiment(
            selectedHouse.ward_no || "",
            selectedHouse.house_no,
            sentiment
          );
        } else if (key === "Escape") {
          setIsHouseDialogOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHouseDialogOpen, selectedHouse, findNextUntagged, showWardWarRoom]);

  const handleSelectTarget = (target: TargetVoter) => {
    // Find the house and open dialog
    const wardHouses = houses.get(target.ward_no);
    const house = wardHouses?.find((h) => h.house_no === target.house_no);
    if (house) {
      setSelectedHouse(house);
      setIsHouseDialogOpen(true);
    }
  };

  // Handler for selecting a ward - opens Ward War Room by default
  const handleSelectWard = (wardNo: string | null) => {
    setSelectedWard(wardNo);
    if (wardNo) {
      setShowWardWarRoom(true); // Open ward war room by default
    } else {
      setShowWardWarRoom(false);
    }
  };

  if (loading) {
    return <WarRoomSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Unable to Load War Room
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetchData()} className="gap-2">
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Ward War Room - Full screen view when enabled */}
        {showWardWarRoom && selectedWard && selectedListId ? (
          <WardWarRoom
            wardNo={selectedWard}
            wardData={wards.find((w) => w.ward_no === selectedWard)}
            houses={houses.get(selectedWard) || []}
            listId={selectedListId}
            onClose={() => {
              setShowWardWarRoom(false);
              setSelectedWard(null);
            }}
            onHouseClick={(house) => {
              setSelectedHouse(house);
              setIsHouseDialogOpen(true);
            }}
            onTagSentiment={handleTagSentiment}
          />
        ) : (
          <>
            {/* Left Sidebar - Shows WardFamiliesPanel when ward is selected, otherwise regular stats */}
            {/* Mobile: Use Sheet, Desktop: Inline sidebar */}
            {!isSidebarCollapsed && selectedWard && selectedListId ? (
              <WardFamiliesPanel
                wardNo={selectedWard}
                listId={selectedListId}
                houses={houses.get(selectedWard) || []}
                onClose={() => setSelectedWard(null)}
                onTagSentiment={handleTagSingleVoter}
                highlightedHouseNo={hoveredMapHouse}
                onOpenWarRoom={() => setShowWardWarRoom(true)}
              />
            ) : (
              <div
                className={cn(
                  "bg-card border-r border-border flex flex-col overflow-hidden shrink-0 transition-all duration-300",
                  isSidebarCollapsed ? "w-0 opacity-0" : "w-72 md:w-80",
                  "hidden md:flex" // Hide on mobile - use floating panel instead
                )}
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white px-4 py-4 shrink-0 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-900/50 flex items-center justify-center">
                      <MapIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0" suppressHydrationWarning>
                      <h1 className="text-base font-bold tracking-tight">
                        War Room
                      </h1>
                      <p className="text-white/60 text-xs">Village Dashboard</p>
                    </div>
                    {/* Session Stats & Network Status Inline */}
                    {sessionStats.tagged > 0 && (
                      <Badge className="bg-white/20 text-white border-0 text-[10px] shrink-0">
                        {sessionStats.tagged} tagged
                      </Badge>
                    )}
                    {!isOnline && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] shrink-0"
                      >
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                    {isOnline && error && (
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 text-orange-600 border-orange-600"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Connection Issues
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats - Scrollable */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-3 space-y-3">
                    {/* Search - Top Priority */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Input
                        type="text"
                        placeholder="Search voter or house..."
                        className="pl-9 h-9 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                          // Clear any existing timeout to prevent stale closures
                          if (searchBlurTimeoutRef.current) {
                            clearTimeout(searchBlurTimeoutRef.current);
                          }
                          searchBlurTimeoutRef.current = setTimeout(
                            () => setIsSearchFocused(false),
                            200
                          );
                        }}
                      />

                      {/* Search Results Dropdown */}
                      {isSearchFocused &&
                        searchQuery &&
                        (searchResults.houses.length > 0 ||
                          searchResults.targets.length > 0) && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                            {searchResults.targets.length > 0 && (
                              <div>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                                  Voters
                                </div>
                                {searchResults.targets.map((target) => (
                                  <button
                                    key={target.voter_id}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 text-left"
                                    onClick={() => {
                                      handleSelectTarget(target);
                                      setSearchQuery("");
                                    }}
                                  >
                                    <User
                                      size={14}
                                      className="text-muted-foreground"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {target.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Ward {target.ward_no} • House{" "}
                                        {target.house_no}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "text-[10px] shrink-0",
                                        target.sentiment === "support" &&
                                          "bg-green-100 text-green-700",
                                        target.sentiment === "oppose" &&
                                          "bg-red-100 text-red-700",
                                        target.sentiment === "swing" &&
                                          "bg-yellow-100 text-yellow-700"
                                      )}
                                    >
                                      {target.sentiment}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            )}

                            {searchResults.houses.length > 0 && (
                              <div>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                                  Houses
                                </div>
                                {searchResults.houses.map((house) => (
                                  <button
                                    key={`${house.wardNo}-${house.house_no}`}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 text-left"
                                    onClick={() => {
                                      setSelectedHouse({
                                        ...house,
                                        ward_no: house.wardNo,
                                      });
                                      setIsHouseDialogOpen(true);
                                      setSearchQuery("");
                                    }}
                                  >
                                    <Home
                                      size={14}
                                      className="text-muted-foreground"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">
                                        House {house.house_no}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Ward {house.wardNo} •{" "}
                                        {house.family_size} members
                                      </p>
                                    </div>
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          SENTIMENT_COLORS[house.sentiment]
                                            ?.bg || "#9ca3af",
                                      }}
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Quick Stats Row */}
                    {overview && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-green-600">
                            {overview.sentiment_breakdown?.support || 0}
                          </div>
                          <div className="text-[10px] text-green-600/80 font-medium">
                            Support
                          </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-yellow-600">
                            {overview.sentiment_breakdown?.swing || 0}
                          </div>
                          <div className="text-[10px] text-yellow-600/80 font-medium">
                            Swing
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-red-600">
                            {overview.sentiment_breakdown?.oppose ||
                              overview.win_projection?.oppose ||
                              0}
                          </div>
                          <div className="text-[10px] text-red-600/80 font-medium">
                            Oppose
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coverage Progress - Compact */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground">
                          Coverage
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {coverageStats.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={coverageStats.percentage}
                        className="h-1.5"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {coverageStats.tagged}/{coverageStats.total} houses
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] gap-1 px-2 hover:bg-primary/10"
                          onClick={findNextUntagged}
                        >
                          <Target size={10} />
                          Next
                        </Button>
                      </div>
                    </div>

                    {/* Sentiment Filters - Inline */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Filter
                        </span>
                        {sentimentFilters.size < 4 && (
                          <button
                            className="text-[10px] text-primary hover:underline"
                            onClick={() =>
                              setSentimentFilters(
                                new Set([
                                  "support",
                                  "oppose",
                                  "swing",
                                  "unknown",
                                ])
                              )
                            }
                          >
                            Show all
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {(
                          [
                            "support",
                            "oppose",
                            "swing",
                            "unknown",
                          ] as SentimentType[]
                        ).map((sentiment) => {
                          const isActive = sentimentFilters.has(sentiment);
                          const config = SENTIMENT_COLORS[sentiment];
                          const icons: Record<SentimentType, string> = {
                            support: "✓",
                            oppose: "✗",
                            swing: "?",
                            unknown: "○",
                            neutral: "—",
                          };
                          return (
                            <button
                              key={sentiment}
                              className={cn(
                                "flex-1 py-1.5 rounded-md text-xs font-medium transition-all border",
                                isActive
                                  ? "border-transparent"
                                  : "border-border bg-background opacity-50 hover:opacity-75"
                              )}
                              style={{
                                backgroundColor: isActive
                                  ? config.light
                                  : undefined,
                                color: isActive ? config.text : undefined,
                              }}
                              onClick={() => toggleSentimentFilter(sentiment)}
                            >
                              {icons[sentiment]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Win Probability - Compact */}
                    {overview && (
                      <div className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            Win Probability
                          </span>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              50 +
                                (overview.win_projection?.margin_percent ||
                                  0) >=
                                50
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {(
                              50 +
                              (overview.win_projection?.margin_percent || 0)
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${
                                50 +
                                (overview.win_projection?.margin_percent || 0)
                              }%`,
                            }}
                          />
                          <div className="h-full bg-red-500 flex-1" />
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Advanced Actions */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs gap-2"
                        onClick={handleComputeSentiments}
                        disabled={isComputing || !selectedListId}
                      >
                        {isComputing ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Computing...
                          </>
                        ) : (
                          <>
                            <Calculator size={12} />
                            Compute Sentiments
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs gap-2"
                        onClick={() => refetchData()}
                        disabled={loading}
                      >
                        <RefreshCw
                          size={12}
                          className={loading ? "animate-spin" : ""}
                        />
                        Refresh Data
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Ward Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant={selectedWard === null ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setSelectedWard(null)}
                      >
                        All Wards
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={() => {
                          setSentimentFilters(new Set(["swing"]));
                          toast.info("Showing swing voters only");
                        }}
                      >
                        <AlertTriangle size={12} className="text-yellow-500" />
                        Swing
                      </Button>
                    </div>

                    {/* Ward List - Compact */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Wards ({wards.length})
                      </span>
                      <div className="space-y-0.5">
                        {wards.map((ward) => {
                          const statusConfig = WARD_STATUS_COLORS[ward.status];
                          const isSelected = selectedWard === ward.ward_no;

                          return (
                            <button
                              key={ward.ward_no}
                              onClick={() =>
                                handleSelectWard(
                                  isSelected ? null : ward.ward_no
                                )
                              }
                              className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left",
                                isSelected
                                  ? "bg-primary/10 ring-1 ring-primary/30"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <div
                                className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs"
                                style={{
                                  backgroundColor: statusConfig.fill,
                                  color: statusConfig.stroke,
                                }}
                              >
                                {ward.ward_no}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  Ward {ward.ward_no}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {ward.total_voters} voters
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={cn(
                                    "text-xs font-semibold",
                                    ward.win_margin_percent > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {ward.win_margin_percent > 0 ? "+" : ""}
                                  {ward.win_margin_percent.toFixed(0)}%
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {(houses.get(ward.ward_no) || []).length}{" "}
                                  houses
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority Targets - Only if not shown in floating panel */}
                    {targets.length > 0 && (
                      <>
                        <div className="border-t border-border" />
                        <TargetList
                          targets={targets}
                          onSelectTarget={handleSelectTarget}
                        />
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Sidebar Toggle Button - Hidden on mobile */}
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "absolute top-4 z-30 bg-white/90 hover:bg-white shadow-lg transition-all hidden md:flex",
                isSidebarCollapsed ? "left-4" : "left-[296px] lg:left-[328px]"
              )}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </Button>

            {/* Main Content - Map */}
            <div className="flex-1 relative">
              <VillageMap
                wards={wards}
                houses={houses}
                onWardHover={handleWardHover}
                onWardLeave={handleWardLeave}
                onHouseClick={handleHouseClick}
                onHouseHover={setHoveredMapHouse}
                hoveredWard={hoveredWard}
                selectedWard={selectedWard}
                selectedHouse={selectedHouse}
                onSelectWard={handleSelectWard}
                rippleHouse={rippleHouse}
                sentimentFilters={sentimentFilters}
                displayMode={displayMode}
              />

              {/* Display Mode Toggle - Responsive positioning */}
              <div className="absolute top-4 left-4 md:left-1/2 md:-translate-x-1/2 z-20">
                <div className="bg-white/95 backdrop-blur rounded-lg border shadow-lg p-1 flex gap-1">
                  <button
                    onClick={() => setDisplayMode("sentiment")}
                    className={cn(
                      "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all",
                      displayMode === "sentiment"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Sentiment</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode("turnout")}
                    className={cn(
                      "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all",
                      displayMode === "turnout"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Turnout</span>
                  </button>
                </div>
              </div>

              {/* Floating Priority Targets Panel */}
              <FloatingPriorityTargets
                targets={targets}
                onSelectTarget={handleSelectTarget}
              />

              {/* Hover Card */}
              {hoveredWardData && (
                <WardHoverCard
                  ward={hoveredWardData}
                  position={hoverPosition}
                />
              )}

              {/* Keyboard Help Button - Hidden on mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-4 right-4 z-20 bg-white/90 hover:bg-white shadow-lg hidden sm:flex"
                    onClick={() => setShowKeyboardHelp(true)}
                  >
                    <Keyboard size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts (?)</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* House Details Dialog */}
            <HouseDetailsDialog
              house={selectedHouse}
              open={isHouseDialogOpen}
              onOpenChange={setIsHouseDialogOpen}
              onTagSentiment={handleTagSentiment}
              onRemoveTag={handleRemoveHouseTag}
              isTagging={isTagging}
            />

            {/* Keyboard Shortcuts Help Dialog */}
            <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Keyboard size={20} />
                    Keyboard Shortcuts
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      When tagging a house
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500" />
                          Mark as Support
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          1
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm flex items-center gap-2">
                          <XCircle size={14} className="text-red-500" />
                          Mark as Oppose
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          2
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm flex items-center gap-2">
                          <AlertTriangle
                            size={14}
                            className="text-yellow-500"
                          />
                          Mark as Swing
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          3
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm flex items-center gap-2">
                          <HelpCircle size={14} className="text-gray-400" />
                          Mark as Unknown
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          4
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm">Close dialog</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          Esc
                        </kbd>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Global shortcuts
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm">Jump to next untagged</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          N
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm">Toggle sidebar</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          [
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                        <span className="text-sm">Show this help</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                          ?
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Strategy Engine Panel (Sheet) */}
            <Sheet open={showStrategyPanel} onOpenChange={setShowStrategyPanel}>
              <SheetContent side="right" className="w-[450px] sm:w-[500px] p-0">
                <StrategyPanel
                  className="h-full border-0 rounded-none"
                  defaultCommand={
                    selectedWard ? `/ward ${selectedWard}` : undefined
                  }
                />
              </SheetContent>
            </Sheet>

            {/* Strategy Engine Floating Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="absolute bottom-4 right-4 sm:right-16 z-20 shadow-lg bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={() => setShowStrategyPanel(true)}
                >
                  <Terminal size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Strategy Engine (⌘K)</p>
              </TooltipContent>
            </Tooltip>

            {/* Opponent Selector Dialog (for oppose sentiment) */}
            <OpponentSelectorDialog
              open={opponentDialogOpen}
              onOpenChange={(open) => {
                setOpponentDialogOpen(open);
                if (!open) setPendingOpposeData(null);
              }}
              onSelect={handleConfirmOppose}
            />

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
              <div className="flex items-center justify-around p-2">
                {/* Quick Stats */}
                {overview && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 font-semibold">
                      {overview.sentiment_breakdown?.support || 0}
                    </span>
                    <span className="text-yellow-600 font-semibold">
                      {overview.sentiment_breakdown?.swing || 0}
                    </span>
                    <span className="text-red-600 font-semibold">
                      {overview.sentiment_breakdown?.oppose || 0}
                    </span>
                  </div>
                )}
                {/* Menu Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setShowMobileMenu(true)}
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Wards ({wards.length})
                </Button>
                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => refetchData()}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isFetching && "animate-spin")}
                  />
                </Button>
              </div>
            </div>

            {/* Mobile Menu Sheet */}
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-xl">
                <SheetHeader className="px-4 py-3 border-b">
                  <SheetTitle className="text-left">War Room</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full pb-20">
                  <div className="p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search voter or house..."
                        className="pl-9 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Quick Stats */}
                    {overview && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-600">
                            {overview.sentiment_breakdown?.support || 0}
                          </div>
                          <div className="text-xs text-green-600/80">
                            Support
                          </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-yellow-600">
                            {overview.sentiment_breakdown?.swing || 0}
                          </div>
                          <div className="text-xs text-yellow-600/80">
                            Swing
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-600">
                            {overview.sentiment_breakdown?.oppose || 0}
                          </div>
                          <div className="text-xs text-red-600/80">Oppose</div>
                        </div>
                      </div>
                    )}

                    {/* Coverage */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Coverage</span>
                        <span className="text-sm text-muted-foreground">
                          {coverageStats.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={coverageStats.percentage}
                        className="h-2"
                      />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          {coverageStats.tagged}/{coverageStats.total} houses
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            findNextUntagged();
                            setShowMobileMenu(false);
                          }}
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Next
                        </Button>
                      </div>
                    </div>

                    {/* Ward List */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Wards ({wards.length})
                      </h3>
                      <div className="space-y-1">
                        {wards.map((ward) => {
                          const statusConfig = WARD_STATUS_COLORS[ward.status];
                          return (
                            <button
                              key={ward.ward_no}
                              onClick={() => {
                                handleSelectWard(ward.ward_no);
                                setShowMobileMenu(false);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                                style={{
                                  backgroundColor: statusConfig.fill,
                                  color: statusConfig.stroke,
                                }}
                              >
                                {ward.ward_no}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium">
                                  Ward {ward.ward_no}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {ward.total_voters} voters
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={cn(
                                    "text-sm font-semibold",
                                    ward.win_margin_percent > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {ward.win_margin_percent > 0 ? "+" : ""}
                                  {ward.win_margin_percent.toFixed(0)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {(houses.get(ward.ward_no) || []).length}{" "}
                                  houses
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
