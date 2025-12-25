"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Map as MapIcon,
  Loader2,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Box,
  X,
  ArrowLeft,
  Building2,
  Users,
  Landmark,
  Menu,
  BarChart3,
  Heart,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  api,
  type WardMapSummary,
  type SentimentOverview,
  type SentimentType,
  type TaggableSentiment,
  type HousePosition,
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
import { toast } from "sonner";
import { FamilyDetailSheet } from "@/components/war-room/3d/family-detail-sheet";
import { OpponentSelectorDialog } from "@/components/voters/opponent-selector-dialog";

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
            <p className="text-white/50 text-sm">Initializing Three.js...</p>
          </div>
        </div>
      </div>
    ),
  }
);

// Import type and colors from the 3D scene component
import type {
  Ward3DData,
  Booth3DData,
  Family3DData,
} from "@/components/war-room/war-room-3d-scene";

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

const getDominantSentiment = (
  support: number = 0,
  oppose: number = 0,
  swing: number = 0
): SentimentType => {
  if (support > oppose && support > swing) return "support";
  if (oppose > support && oppose > swing) return "oppose";
  if (swing > support && swing > oppose) return "swing";
  return "unknown";
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function WarRoom3DPage() {
  const { selectedListId } = useListContext();

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"wards" | "booths" | "families">(
    "wards"
  );
  const [displayMode, setDisplayMode] = useState<"sentiment" | "turnout">(
    "sentiment"
  );
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<
    [number, number, number] | null
  >(null);
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Data State
  const [wards3D, setWards3D] = useState<Ward3DData[]>([]);
  const [boothData, setBoothData] = useState<Booth3DData[]>([]);
  const [familyData, setFamilyData] = useState<Family3DData[]>([]);

  // Family Selection State (for FamilyDetailSheet)
  const [selectedFamily, setSelectedFamily] = useState<Family3DData | null>(
    null
  );
  const [isFamilySheetOpen, setIsFamilySheetOpen] = useState(false);

  // Opponent Selector Dialog State (for tagging as oppose)
  const [opponentDialogOpen, setOpponentDialogOpen] = useState(false);
  const [pendingOpposeVoterIds, setPendingOpposeVoterIds] = useState<number[]>(
    []
  );
  const [pendingOpposeType, setPendingOpposeType] = useState<
    "member" | "family"
  >("member");
  const [pendingOpposeHouseNo, setPendingOpposeHouseNo] = useState<
    string | null
  >(null);

  // Our candidate ID (for support sentiment tagging)
  const [ourCandidateId, setOurCandidateId] = useState<number | null>(null);

  // Network monitoring state
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [boothsLoading, setBoothsLoading] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Refs for optimization
  const originalCameraPos = React.useRef<[number, number, number]>([
    15, 15, 15,
  ]);

  // Fetch our candidate (for support sentiment tagging)
  useEffect(() => {
    const fetchOurCandidate = async () => {
      if (!selectedListId) {
        setOurCandidateId(null);
        return;
      }
      try {
        const { candidates } = await api.getCandidates({
          list_id: selectedListId,
        });
        const ourCandidate = candidates?.find((c) => c.is_our_candidate);
        setOurCandidateId(
          ourCandidate?.candidate_id ?? ourCandidate?.id ?? null
        );
      } catch (err) {
        console.error("Failed to fetch our candidate", err);
        setOurCandidateId(null);
      }
    };
    fetchOurCandidate();
  }, [selectedListId]);

  // Network monitoring effect
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

  // Fetch Wards Data with React Query
  const wardsQuery = useQuery({
    queryKey: ["3d-wards", selectedListId],
    queryFn: async () => {
      if (!selectedListId) return [];
      const { wards } = await api.getMapWards(selectedListId);

      // Sort wards numerically (1, 2, 3, ..., 10, 11) instead of string order (1, 10, 11, ..., 2)
      const sortedWards = [...wards].sort((a, b) => {
        const numA = parseInt(a.ward_no, 10);
        const numB = parseInt(b.ward_no, 10);
        // Handle non-numeric ward numbers gracefully
        if (isNaN(numA) && isNaN(numB))
          return a.ward_no.localeCompare(b.ward_no);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });

      // Calculate spiral layout for wards (Golden Spiral)
      // This handles any number of wards gracefully without creating a huge empty ring
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const wardSpacing = 6; // Diameter 5 + spacing

      const mappedWards: Ward3DData[] = sortedWards.map((ward, index) => {
        // Spiral position
        const radius = wardSpacing * Math.sqrt(index); // Start from center (index 0 -> radius 0)
        const angle = index * goldenAngle;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return {
          wardNo: String(ward.ward_no),
          position: [x, 0, z], // On the ground, arranged in a circle
          sentiment: getDominantSentiment(
            ward.support_count,
            ward.oppose_count,
            ward.swing_count
          ),
          voterCount: ward.total_voters || 0,
          supportCount: ward.support_count || 0,
          opposeCount: ward.oppose_count || 0,
          swingCount: ward.swing_count || 0,
          unknownCount: ward.unknown_count || 0,
          supportPercent: ward.total_voters
            ? (ward.support_count / ward.total_voters) * 100
            : 0,
        };
      });

      return mappedWards;
    },
    enabled: !!selectedListId,
    staleTime: 30_000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update wards3D state when query data changes
  useEffect(() => {
    if (wardsQuery.data) {
      setWards3D(wardsQuery.data);
      setLastUpdated(new Date());
    }
  }, [wardsQuery.data]);

  // Reset drill-down state when selectedListId changes
  useEffect(() => {
    setViewMode("wards");
    setSelectedWard(null);
    setSelectedBooth(null);
    setBoothData([]);
    setFamilyData([]);
    setCameraTarget(null);
    setHoveredWard(null);
  }, [selectedListId]);

  // Update loading state
  useEffect(() => {
    setLoading(wardsQuery.isLoading);
  }, [wardsQuery.isLoading]);

  // React Query for booth data with offline support
  const boothsQuery = useQuery({
    queryKey: ["3d-booths", selectedListId, selectedWard],
    queryFn: async () => {
      if (!selectedListId || !selectedWard) return [];

      const data = await api.getPollingBoothStats(selectedListId, {
        ward_no: selectedWard,
      });

      // Map booth stats to spiral layout
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const boothSpacing = 4; // Diameter 3 + spacing

      const mappedBooths: Booth3DData[] = (data.booths || []).map(
        (booth, index) => {
          // Spiral position
          const radius = boothSpacing * Math.sqrt(index);
          const angle = index * goldenAngle;

          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          return {
            // Use unique polling_booth_id for API lookups
            boothId: String(booth.polling_booth_id || booth.booth_id || index),
            name: booth.booth_name || `Booth ${booth.polling_booth_id}`,
            position: [x, 0, z], // Circular layout
            sentiment: getDominantSentiment(
              booth.support_count,
              booth.oppose_count,
              booth.swing_count
            ),
            voterCount: booth.total_voters || 0,
            supportCount: booth.support_count || 0,
            opposeCount: booth.oppose_count || 0,
            swingCount: booth.swing_count || 0,
            unknownCount: booth.unknown_count || 0,
            supportPercent: booth.total_voters
              ? ((booth.support_count || 0) / booth.total_voters) * 100
              : 0,
          };
        }
      );

      return mappedBooths;
    },
    enabled: !!selectedListId && !!selectedWard,
    staleTime: 30_000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update booth data when query changes
  useEffect(() => {
    if (boothsQuery.data) {
      setBoothData(boothsQuery.data);
      setLastUpdated(new Date());
    }
  }, [boothsQuery.data]);

  // Update booths loading state
  useEffect(() => {
    setBoothsLoading(boothsQuery.isLoading);
  }, [boothsQuery.isLoading]);

  // Handle Ward Selection (Drill down to Booths)
  const handleSelectWard = useCallback(
    (wardNo: string | null) => {
      // If clicking same ward or null, just reset
      if (!wardNo || (selectedWard === wardNo && viewMode === "wards")) {
        setSelectedWard(wardNo);
        if (!wardNo) setViewMode("wards");
        return;
      }

      setSelectedWard(wardNo);

      if (wardNo) {
        setCameraTarget([0, 0, 0]); // Center view for new scene
        setViewMode("booths");
      } else {
        setCameraTarget(null);
        setViewMode("wards");
      }
    },
    [selectedWard, viewMode]
  );

  // React Query for family data with offline support
  const familiesQuery = useQuery({
    queryKey: ["3d-families", selectedListId, selectedWard, selectedBooth],
    queryFn: async () => {
      if (!selectedListId || !selectedWard || !selectedBooth) return [];

      // Fetch booth details with voters to construct families
      // Note: fetching up to 2000 voters per booth should cover most cases
      const { voters } = await api.getPollingBooth(
        selectedBooth,
        selectedListId,
        {
          include_voters: true,
          per_page: 2000,
        }
      );

      if (!voters || voters.length === 0) {
        return [];
      }

      // Group voters by house_no
      const housesMap = new Map<
        string,
        {
          houseNo: string;
          voterCount: number;
          sentimentCounts: Record<SentimentType, number>;
          members: any[];
        }
      >();

      voters.forEach((voter) => {
        const houseNo = voter.house_no || "Unknown";
        if (!housesMap.has(houseNo)) {
          housesMap.set(houseNo, {
            houseNo,
            voterCount: 0,
            sentimentCounts: {
              support: 0,
              oppose: 0,
              swing: 0,
              unknown: 0,
              neutral: 0,
            },
            members: [],
          });
        }

        const house = housesMap.get(houseNo)!;
        house.voterCount++;
        house.members.push(voter);

        const sentiment = (voter.sentiment || "unknown") as SentimentType;
        if (house.sentimentCounts[sentiment] !== undefined) {
          house.sentimentCounts[sentiment]++;
        } else {
          house.sentimentCounts.unknown++;
        }
      });

      // Convert map to array and sort by sentiment for clustering
      const validHouses = Array.from(housesMap.values());

      // Sort houses by dominant sentiment for neighborhood clustering
      const sentimentOrder: Record<SentimentType, number> = {
        support: 0,
        oppose: 1,
        swing: 2,
        neutral: 3,
        unknown: 4,
      };

      const sortedHouses = [...validHouses].sort((a, b) => {
        const aSentiment = getDominantSentiment(
          a.sentimentCounts.support,
          a.sentimentCounts.oppose,
          a.sentimentCounts.swing
        );
        const bSentiment = getDominantSentiment(
          b.sentimentCounts.support,
          b.sentimentCounts.oppose,
          b.sentimentCounts.swing
        );
        return sentimentOrder[aSentiment] - sentimentOrder[bSentiment];
      });

      // Map to improved neighborhood layout
      const totalHouses = sortedHouses.length;

      // Calculate grid-like neighborhood with streets
      const housesPerRow = Math.ceil(Math.sqrt(totalHouses * 1.5));
      const streetWidth = 1.5; // Space between rows (streets)
      const houseSpacing = 2.5; // Space between houses in a row

      const mappedFamilies: Family3DData[] = sortedHouses.map(
        (house, index) => {
          // Grid layout with offset rows (like real neighborhoods)
          const row = Math.floor(index / housesPerRow);
          const col = index % housesPerRow;

          // Offset every other row for more organic look
          const rowOffset = row % 2 === 0 ? 0 : houseSpacing * 0.5;

          // Calculate position with street spacing
          const x = (col - housesPerRow / 2) * houseSpacing + rowOffset;
          const z =
            (row - Math.ceil(totalHouses / housesPerRow) / 2) *
            (houseSpacing + streetWidth);

          // Determine Head of Family (Oldest Member)
          const sortedMembers = house.members.sort(
            (a, b) => (b.age || 0) - (a.age || 0)
          );
          const head = sortedMembers[0];
          const headName = head
            ? head.name || head.name_hindi || "Unknown"
            : "Unknown";

          return {
            id: house.houseNo,
            houseNo: house.houseNo,
            headOfFamily: headName,
            // Pass member details for hover card
            members: house.members.map((m) => ({
              voter_id: m.voter_id,
              name: m.name || m.name_hindi || "Unknown",
              age: m.age || 0,
              gender: m.gender || "Unknown",
              sentiment: (m.sentiment as SentimentType) || "unknown",
            })),
            position: [x, 0, z], // Neighborhood grid layout
            sentiment: getDominantSentiment(
              house.sentimentCounts.support,
              house.sentimentCounts.oppose,
              house.sentimentCounts.swing
            ),
            voterCount: house.voterCount,
            supportCount: house.sentimentCounts.support,
            opposeCount: house.sentimentCounts.oppose,
            swingCount: house.sentimentCounts.swing,
            unknownCount: house.sentimentCounts.unknown,
          };
        }
      );

      return mappedFamilies;
    },
    enabled: !!selectedListId && !!selectedWard && !!selectedBooth,
    staleTime: 30_000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update family data when query changes
  useEffect(() => {
    if (familiesQuery.data) {
      setFamilyData(familiesQuery.data);
      setLastUpdated(new Date());
    }
  }, [familiesQuery.data]);

  // Handle Booth Selection (Drill down to Families)
  const handleSelectBooth = useCallback(
    (boothId: string) => {
      if (!selectedListId || !selectedWard) return;
      setSelectedBooth(boothId);
      setCameraTarget([0, 0, 0]); // Reset camera for new view
      setViewMode("families");
    },
    [selectedListId, selectedWard]
  );

  // Handle Family Selection (Opens FamilyDetailSheet)
  const handleSelectFamily = useCallback(
    (familyId: string) => {
      const family = familyData.find((f) => f.id === familyId);
      if (family) {
        setSelectedFamily(family);
        setIsFamilySheetOpen(true);
        // Focus camera on family position
        setCameraTarget(family.position);
      }
    },
    [familyData]
  );

  // Handle tagging individual member
  const handleTagMember = useCallback(
    async (
      voterId: number,
      sentiment: TaggableSentiment,
      candidateId?: number
    ) => {
      if (!selectedListId) return;

      // For "oppose" sentiment without candidateId, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds([voterId]);
        setPendingOpposeType("member");
        setOpponentDialogOpen(true);
        return;
      }

      // Determine candidate ID based on sentiment
      const effectiveCandidateId =
        sentiment === "oppose" ? candidateId : ourCandidateId ?? undefined;

      try {
        await api.bulkTagVoters({
          voter_ids: [voterId],
          sentiment,
          list_id: selectedListId,
          source: "war_room_3d",
          propagate_family: false,
          candidate_id: effectiveCandidateId,
        });
        // Update local state
        setFamilyData((prev) =>
          prev.map((family) => ({
            ...family,
            members: family.members?.map((m) =>
              m.voter_id === voterId ? { ...m, sentiment } : m
            ),
            // Recalculate counts
            supportCount:
              family.members?.filter(
                (m) =>
                  (m.voter_id === voterId ? sentiment : m.sentiment) ===
                  "support"
              ).length || 0,
            opposeCount:
              family.members?.filter(
                (m) =>
                  (m.voter_id === voterId ? sentiment : m.sentiment) ===
                  "oppose"
              ).length || 0,
            swingCount:
              family.members?.filter(
                (m) =>
                  (m.voter_id === voterId ? sentiment : m.sentiment) === "swing"
              ).length || 0,
            unknownCount:
              family.members?.filter(
                (m) =>
                  (m.voter_id === voterId ? sentiment : m.sentiment) ===
                  "unknown"
              ).length || 0,
          }))
        );
        // Update selected family if it contains this member
        setSelectedFamily((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members?.map((m) =>
              m.voter_id === voterId ? { ...m, sentiment } : m
            ),
          };
        });
        toast.success(`Voter marked as ${sentiment}`);
      } catch (err) {
        console.error("Failed to tag voter", err);
        toast.error("Failed to update voter sentiment");
      }
    },
    [selectedListId, ourCandidateId]
  );

  // Handle tagging entire family
  const handleTagAllFamily = useCallback(
    async (
      houseNo: string,
      sentiment: TaggableSentiment,
      candidateId?: number
    ) => {
      if (!selectedListId || !selectedWard) return;

      // Get voter IDs from the family
      const family = familyData.find((f) => f.houseNo === houseNo);
      const voterIds =
        family?.members?.map((m) => m.voter_id).filter(Boolean) || [];

      if (voterIds.length === 0) {
        toast.error("No members found in this family");
        return;
      }

      // For "oppose" sentiment without candidateId, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setPendingOpposeVoterIds(voterIds);
        setPendingOpposeType("family");
        setPendingOpposeHouseNo(houseNo);
        setOpponentDialogOpen(true);
        return;
      }

      // Determine candidate ID based on sentiment
      const effectiveCandidateId =
        sentiment === "oppose" ? candidateId : ourCandidateId ?? undefined;

      try {
        await api.bulkTagVoters({
          voter_ids: voterIds,
          sentiment,
          list_id: selectedListId,
          source: "war_room_3d",
          propagate_family: false,
          candidate_id: effectiveCandidateId,
        });
        // Update local state
        setFamilyData((prev) =>
          prev.map((family) =>
            family.houseNo === houseNo
              ? {
                  ...family,
                  sentiment,
                  members: family.members?.map((m) => ({ ...m, sentiment })),
                  supportCount: sentiment === "support" ? family.voterCount : 0,
                  opposeCount: sentiment === "oppose" ? family.voterCount : 0,
                  swingCount: sentiment === "swing" ? family.voterCount : 0,
                  unknownCount: 0, // Tags are always known sentiments
                }
              : family
          )
        );
        // Update selected family
        setSelectedFamily((prev) => {
          if (!prev || prev.houseNo !== houseNo) return prev;
          return {
            ...prev,
            sentiment,
            members: prev.members?.map((m) => ({ ...m, sentiment })),
            supportCount: sentiment === "support" ? prev.voterCount : 0,
            opposeCount: sentiment === "oppose" ? prev.voterCount : 0,
            swingCount: sentiment === "swing" ? prev.voterCount : 0,
            unknownCount: 0, // Tags are always known sentiments
          };
        });
        toast.success(`House ${houseNo} marked as ${sentiment}`);
      } catch (err) {
        console.error("Failed to tag household", err);
        toast.error("Failed to update household sentiment");
      }
    },
    [selectedListId, selectedWard, familyData, ourCandidateId]
  );

  // Handler for when opponent is selected from dialog
  const handleConfirmOppose = useCallback(
    async (candidateId: number) => {
      if (pendingOpposeType === "member" && pendingOpposeVoterIds.length > 0) {
        await handleTagMember(pendingOpposeVoterIds[0], "oppose", candidateId);
      } else if (pendingOpposeType === "family" && pendingOpposeHouseNo) {
        await handleTagAllFamily(pendingOpposeHouseNo, "oppose", candidateId);
      }
      // Reset state
      setPendingOpposeVoterIds([]);
      setPendingOpposeHouseNo(null);
      setOpponentDialogOpen(false);
    },
    [
      pendingOpposeType,
      pendingOpposeVoterIds,
      pendingOpposeHouseNo,
      handleTagMember,
      handleTagAllFamily,
    ]
  );

  // Back / Reset Logic
  const handleResetCamera = useCallback(() => {
    if (viewMode === "families") {
      setViewMode("booths");
      setSelectedBooth(null);
      setCameraTarget([0, 0, 0]);
      // Maintain selectedWard and boothData
    } else if (viewMode === "booths") {
      setSelectedWard(null);
      setCameraTarget(null);
      setViewMode("wards");
    } else {
      // Already at root
      setSelectedWard(null);
      setCameraTarget(null);
    }
  }, [viewMode]);

  // Overview Stats
  const overview = useMemo(() => {
    // Calculate overview based on current view mode data
    let sourceData: {
      supportCount: number;
      opposeCount: number;
      swingCount: number;
      unknownCount: number;
      voterCount?: number;
    }[] = [];

    if (viewMode === "families") sourceData = familyData;
    else if (viewMode === "booths") sourceData = boothData;
    else sourceData = wards3D;

    return {
      support: sourceData.reduce((acc, curr) => acc + curr.supportCount, 0),
      oppose: sourceData.reduce((acc, curr) => acc + curr.opposeCount, 0),
      swing: sourceData.reduce((acc, curr) => acc + curr.swingCount, 0),
      unknown: sourceData.reduce((acc, curr) => acc + curr.unknownCount, 0),
      total: sourceData.reduce((acc, curr) => acc + (curr.voterCount || 0), 0),
    };
  }, [wards3D, boothData, familyData, viewMode]);

  // Current Selection Data for Sidebar
  const selectedWardData = useMemo(
    () => wards3D.find((w) => w.wardNo === selectedWard),
    [wards3D, selectedWard]
  );

  // Sidebar List Items
  const sidebarList = useMemo(() => {
    if (viewMode === "families") {
      return familyData.map((f) => ({
        id: f.id,
        label: `House ${f.houseNo}`,
        subLabel: `${f.voterCount} voters`,
        value: f.voterCount,
        sentiment: f.sentiment,
        onClick: () => handleSelectFamily(f.id), // Open FamilyDetailSheet
      }));
    } else if (viewMode === "booths") {
      return boothData.map((b) => ({
        id: b.boothId,
        label: b.name,
        subLabel: `${b.voterCount} voters`,
        value: b.voterCount,
        sentiment: b.sentiment,
        onClick: () => handleSelectBooth(b.boothId),
      }));
    } else {
      return wards3D.map((w) => ({
        id: w.wardNo,
        label: `Ward ${w.wardNo}`,
        subLabel: `${w.voterCount} voters`,
        value: w.voterCount,
        sentiment: w.sentiment,
        onClick: () => handleSelectWard(w.wardNo),
      }));
    }
  }, [
    viewMode,
    familyData,
    boothData,
    wards3D,
    handleSelectBooth,
    handleSelectWard,
    handleSelectFamily,
  ]);

  const viewTitle = useMemo(() => {
    if (viewMode === "families") return `Families in Booth (House list)`;
    if (viewMode === "booths") return `Booths in Ward ${selectedWard}`;
    return `All Wards (${wards3D.length})`;
  }, [viewMode, selectedWard, wards3D.length]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/voters-management/war-room">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1" suppressHydrationWarning>
            <h1 className="font-bold text-lg">3D War Room</h1>
          </div>
          {!isOnline && (
            <Badge variant="destructive" className="text-[10px]">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
          {isOnline && wardsQuery.isError && (
            <Badge
              variant="outline"
              className="text-[10px] text-orange-600 border-orange-600"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Connection Issues
            </Badge>
          )}
        </div>

        {viewMode !== "wards" && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-2"
            onClick={handleResetCamera}
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            {viewMode === "families" ? "Back to Booths" : "Back to Wards"}
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Total Voters
          </span>
          <span className="font-mono font-bold text-lg">
            {overview.total.toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
            <div className="text-xs text-green-600 font-medium">Support</div>
            <div className="font-bold text-green-700">
              {overview.support.toLocaleString()}
            </div>
          </div>
          <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
            <div className="text-xs text-red-600 font-medium">Oppose</div>
            <div className="font-bold text-red-700">
              {overview.oppose.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
            {viewMode === "families" ? (
              <Users className="h-3 w-3" />
            ) : viewMode === "booths" ? (
              <Landmark className="h-3 w-3" />
            ) : (
              <MapIcon className="h-3 w-3" />
            )}
            {viewTitle}
          </div>
          <div className="space-y-1 mt-1">
            {boothsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
              </div>
            ) : (
              sidebarList.map((item) => (
                <div
                  key={item.id}
                  className={`
                              group flex items-center justify-between p-2 rounded-md border border-transparent 
                              hover:bg-accent hover:border-border cursor-pointer transition-all
                              ${
                                selectedWard === item.id ||
                                selectedBooth === item.id
                                  ? "bg-accent border-primary/20"
                                  : ""
                              }
                          `}
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className="w-2 h-8 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          SENTIMENT_COLORS[item.sentiment] || "#aaa",
                      }}
                    />
                    <div className="truncate">
                      <div className="font-medium text-sm truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.subLabel}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {sidebarList.length === 0 && !boothsLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No data found for this view.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading 3D War Room...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div
          className={`hidden md:flex border-r border-border bg-card flex-col z-20 shadow-xl transition-all duration-300 ${
            isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
          }`}
        >
          <div className="w-80 h-full">{sidebarContent}</div>
        </div>

        {/* Desktop Sidebar Toggle */}
        <div
          className="hidden md:block absolute top-4 z-30 transition-all duration-300"
          style={{ left: isSidebarOpen ? "20rem" : "0" }}
        >
          <Button
            variant="secondary"
            size="icon"
            className="rounded-l-none shadow-md border-l-0 h-10 w-6 bg-card border-border"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile Header & Sheet */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>

        {/* 3D Canvas Area */}
        <div className="flex-1 relative bg-slate-950">
          {/* Info Badge */}
          {(selectedWard || selectedBooth) && (
            <div
              className={`absolute top-4 z-10 transition-all duration-300 ${
                isSidebarOpen ? "left-16 md:left-4" : "left-16 md:left-12"
              }`}
            >
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-2 bg-background/80 backdrop-blur border-border"
              >
                <span className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {viewMode === "families"
                    ? `Booth ${selectedBooth}`
                    : `Ward ${selectedWard}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleResetCamera}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          <WarRoom3DCanvas
            wards={wards3D}
            booths={boothData}
            families={familyData}
            viewMode={viewMode}
            displayMode={displayMode}
            selectedWard={selectedWard}
            hoveredWard={hoveredWard}
            onSelectWard={handleSelectWard}
            onSelectBooth={handleSelectBooth}
            onSelectFamily={handleSelectFamily}
            onHoverWard={setHoveredWard}
            cameraTarget={cameraTarget}
          />

          {/* Empty State / Error State */}
          {!loading && wards3D.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-background/90 backdrop-blur p-6 rounded-lg border border-border shadow-lg text-center pointer-events-auto max-w-xs mx-4">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">No Data Available</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {selectedListId
                    ? "Could not load ward data. Please check your connection."
                    : "Please select a voter list to view the War Room."}
                </p>
                <Button
                  onClick={() => setRetryTrigger((prev) => prev + 1)}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Display Mode Toggle */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-background/90 backdrop-blur rounded-lg border border-border shadow-lg p-1 flex gap-1">
              <button
                onClick={() => setDisplayMode("sentiment")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  displayMode === "sentiment"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Sentiment</span>
              </button>
              <button
                onClick={() => setDisplayMode("turnout")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  displayMode === "turnout"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Turnout</span>
              </button>
            </div>
          </div>

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur p-3 rounded-lg border border-border shadow-lg hidden md:block">
            <div className="text-xs font-semibold mb-2">
              {displayMode === "sentiment" ? "Sentiment Map" : "Turnout Map"}
            </div>
            {displayMode === "sentiment" ? (
              <div className="space-y-1">
                {Object.entries(SENTIMENT_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs capitalize">{key}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  <span className="text-xs">High (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-cyan-500" />
                  <span className="text-xs">Good (60-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="text-xs">Medium (40-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-gray-500" />
                  <span className="text-xs">Low (20-40%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-xs">Critical (&lt;20%)</span>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border border-border">
            {viewMode === "wards" && "Click a Ward to drill down"}
            {viewMode === "booths" && "Click a Booth to see Families"}
            {viewMode === "families" && "Click a Family for details"}
          </div>
        </div>

        {/* Family Detail Sheet */}
        <FamilyDetailSheet
          family={selectedFamily}
          open={isFamilySheetOpen}
          onOpenChange={setIsFamilySheetOpen}
          wardNo={selectedWard}
          boothId={selectedBooth}
          onTagMember={handleTagMember}
          onTagAllFamily={handleTagAllFamily}
        />

        {/* Opponent Selector Dialog */}
        <OpponentSelectorDialog
          open={opponentDialogOpen}
          onOpenChange={(open) => {
            setOpponentDialogOpen(open);
            if (!open) {
              setPendingOpposeVoterIds([]);
              setPendingOpposeHouseNo(null);
            }
          }}
          onSelect={handleConfirmOppose}
          voterCount={pendingOpposeVoterIds.length}
          title={
            pendingOpposeType === "family"
              ? `Tag family as opposing`
              : "Tag voter as opposing"
          }
        />
      </div>
    </TooltipProvider>
  );
}
