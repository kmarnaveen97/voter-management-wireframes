"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  api,
  type WardMapSummary,
  type HousePosition,
  type SentimentOverview,
  type TargetVoter,
  type SentimentType,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WarRoomData {
  overview: SentimentOverview | null;
  wards: WardMapSummary[];
  houses: Map<string, HousePosition[]>;
  targets: TargetVoter[];
}

interface TagHouseSentimentParams {
  wardNo: string;
  houseNo: string;
  sentiment: SentimentType;
  familySize: number;
  previousSentiment: SentimentType;
  candidateId?: number; // For multi-candidate tracking
}

interface TagSingleVoterParams {
  voterId: number;
  sentiment: SentimentType;
  wardNo: string;
  candidateId?: number; // For multi-candidate tracking
}

// ─────────────────────────────────────────────────────────────────────────────
// War Room Data Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useWarRoomData(listId: number | null | undefined) {
  const queryClient = useQueryClient();

  // Query: Sentiment Overview
  const overviewQuery = useQuery({
    queryKey: queryKeys.warRoom.overview(listId ?? 0),
    queryFn: () => api.getSentimentOverview(listId!),
    enabled: !!listId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Query: Ward Map Data
  const wardsQuery = useQuery({
    queryKey: queryKeys.warRoom.wardMap(listId ?? 0),
    queryFn: async () => {
      const data = await api.getMapWards(listId!);
      return data?.wards ?? [];
    },
    enabled: !!listId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Query: Houses for all wards (depends on wards query)
  const housesQuery = useQuery({
    queryKey: [...queryKeys.warRoom.overview(listId ?? 0), "houses"],
    queryFn: async () => {
      const wardsList = wardsQuery.data ?? [];
      const housesMap = new Map<string, HousePosition[]>();

      if (wardsList.length > 0) {
        await Promise.all(
          wardsList.map(async (ward) => {
            try {
              const data = await api.getWardHouses(ward.ward_no, listId!);
              const housesWithWard = (data?.houses ?? []).map((h) => ({
                ...h,
                ward_no: ward.ward_no,
              }));
              housesMap.set(ward.ward_no, housesWithWard);
            } catch (e) {
              console.warn(
                `Failed to fetch houses for ward ${ward.ward_no}:`,
                e
              );
              housesMap.set(ward.ward_no, []);
            }
          })
        );
      }

      return housesMap;
    },
    enabled: !!listId && !!wardsQuery.data && wardsQuery.data.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Query: Target Voters
  const targetsQuery = useQuery({
    queryKey: queryKeys.warRoom.targets(listId ?? 0),
    queryFn: async () => {
      const data = await api.getTargetVoters(listId!, { limit: 50 });
      return data?.targets ?? [];
    },
    enabled: !!listId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Combined loading/error states
  const isLoading =
    overviewQuery.isLoading ||
    wardsQuery.isLoading ||
    housesQuery.isLoading ||
    targetsQuery.isLoading;

  const isFetching =
    overviewQuery.isFetching ||
    wardsQuery.isFetching ||
    housesQuery.isFetching ||
    targetsQuery.isFetching;

  const error =
    overviewQuery.error ||
    wardsQuery.error ||
    housesQuery.error ||
    targetsQuery.error;

  // Refetch all data
  const refetch = useCallback(() => {
    return Promise.all([
      overviewQuery.refetch(),
      wardsQuery.refetch(),
      housesQuery.refetch(),
      targetsQuery.refetch(),
    ]);
  }, [overviewQuery, wardsQuery, housesQuery, targetsQuery]);

  // Invalidate all war room data
  const invalidate = useCallback(() => {
    if (!listId) return;
    queryClient.invalidateQueries({
      queryKey: queryKeys.warRoom.overview(listId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.warRoom.wardMap(listId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.warRoom.targets(listId),
    });
  }, [queryClient, listId]);

  return {
    overview: overviewQuery.data ?? null,
    wards: wardsQuery.data ?? [],
    houses: housesQuery.data ?? new Map<string, HousePosition[]>(),
    targets: targetsQuery.data ?? [],
    isLoading,
    isFetching,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
    invalidate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// House Sentiment Tagging Mutation
// ─────────────────────────────────────────────────────────────────────────────

export function useTagHouseSentiment(listId: number | null | undefined) {
  const queryClient = useQueryClient();
  const housesQueryKey = [...queryKeys.warRoom.overview(listId ?? 0), "houses"];
  const overviewQueryKey = queryKeys.warRoom.overview(listId ?? 0);
  const wardsQueryKey = queryKeys.warRoom.wardMap(listId ?? 0);

  return useMutation({
    mutationFn: async ({
      wardNo,
      houseNo,
      sentiment,
      candidateId,
    }: TagHouseSentimentParams) => {
      if (!listId) throw new Error("No list selected");

      // Get family members and bulk tag them
      const family = await api.getFamilyMembers(wardNo, houseNo, listId);
      const voterIds = family.members
        .map((m) => m.voter_id)
        .filter((id): id is number => id !== undefined);

      if (voterIds.length > 0) {
        await api.bulkTagVoters({
          voter_ids: voterIds,
          sentiment,
          list_id: listId,
          source: "war_room",
          propagate_family: false,
          candidate_id: candidateId,
        });
      }

      return { voterIds, sentiment };
    },
    onMutate: async ({
      wardNo,
      houseNo,
      sentiment,
      familySize,
      previousSentiment,
    }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: housesQueryKey });
      await queryClient.cancelQueries({ queryKey: overviewQueryKey });
      await queryClient.cancelQueries({ queryKey: wardsQueryKey });

      // Snapshot previous values
      const previousHouses =
        queryClient.getQueryData<Map<string, HousePosition[]>>(housesQueryKey);
      const previousOverview =
        queryClient.getQueryData<SentimentOverview>(overviewQueryKey);
      const previousWards =
        queryClient.getQueryData<WardMapSummary[]>(wardsQueryKey);

      // Optimistically update houses
      if (previousHouses) {
        const newMap = new Map(previousHouses);
        const wardHouses = newMap.get(wardNo);
        if (wardHouses) {
          const updatedHouses = wardHouses.map((h) =>
            h.house_no === houseNo ? { ...h, sentiment } : h
          );
          newMap.set(wardNo, updatedHouses);
        }
        queryClient.setQueryData(housesQueryKey, newMap);
      }

      // Optimistically update overview stats
      if (previousOverview && previousSentiment !== sentiment) {
        const newBreakdown = { ...previousOverview.sentiment_breakdown };

        // Decrease count for previous sentiment
        if (previousSentiment in newBreakdown) {
          newBreakdown[previousSentiment] = Math.max(
            0,
            (newBreakdown[previousSentiment] || 0) - familySize
          );
        }

        // Increase count for new sentiment
        if (sentiment in newBreakdown) {
          newBreakdown[sentiment] = (newBreakdown[sentiment] || 0) + familySize;
        }

        // Recalculate win projection
        const support = newBreakdown.support || 0;
        const oppose = newBreakdown.oppose || 0;
        const margin = support - oppose;
        const marginPercent =
          previousOverview.total_voters > 0
            ? (margin / previousOverview.total_voters) * 100
            : 0;

        queryClient.setQueryData<SentimentOverview>(overviewQueryKey, {
          ...previousOverview,
          sentiment_breakdown: newBreakdown,
          win_projection: {
            ...previousOverview.win_projection,
            support,
            oppose,
            margin,
            margin_percent: marginPercent,
          },
        });
      }

      // Optimistically update ward stats
      if (previousWards) {
        queryClient.setQueryData<WardMapSummary[]>(
          wardsQueryKey,
          previousWards.map((ward) => {
            if (ward.ward_no !== wardNo) return ward;

            let newSupportCount = ward.support_count;
            let newOpposeCount = ward.oppose_count;
            let newSwingCount = ward.swing_count;

            // Decrease previous sentiment count
            if (previousSentiment === "support") newSupportCount -= familySize;
            else if (previousSentiment === "oppose")
              newOpposeCount -= familySize;
            else if (previousSentiment === "swing") newSwingCount -= familySize;

            // Increase new sentiment count
            if (sentiment === "support") newSupportCount += familySize;
            else if (sentiment === "oppose") newOpposeCount += familySize;
            else if (sentiment === "swing") newSwingCount += familySize;

            // Ensure non-negative
            newSupportCount = Math.max(0, newSupportCount);
            newOpposeCount = Math.max(0, newOpposeCount);
            newSwingCount = Math.max(0, newSwingCount);

            // Recalculate win margin
            const margin = newSupportCount - newOpposeCount;
            const marginPercent =
              ward.total_voters > 0 ? (margin / ward.total_voters) * 100 : 0;

            // Determine new status
            let newStatus: "safe" | "battleground" | "lost" = ward.status;
            if (marginPercent > 10) newStatus = "safe";
            else if (marginPercent < -10) newStatus = "lost";
            else newStatus = "battleground";

            return {
              ...ward,
              support_count: newSupportCount,
              oppose_count: newOpposeCount,
              swing_count: newSwingCount,
              win_margin_percent: marginPercent,
              status: newStatus,
            };
          })
        );
      }

      return { previousHouses, previousOverview, previousWards };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousHouses) {
        queryClient.setQueryData(housesQueryKey, context.previousHouses);
      }
      if (context?.previousOverview) {
        queryClient.setQueryData(overviewQueryKey, context.previousOverview);
      }
      if (context?.previousWards) {
        queryClient.setQueryData(wardsQueryKey, context.previousWards);
      }
      console.error("Failed to tag house sentiment:", err);
    },
    // Don't invalidate on success - optimistic update is sufficient
    // and we want to avoid flicker
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Voter Tagging Mutation
// ─────────────────────────────────────────────────────────────────────────────

export function useTagSingleVoter(listId: number | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      voterId,
      sentiment,
      candidateId,
    }: TagSingleVoterParams) => {
      if (!listId) throw new Error("No list selected");
      return api.bulkTagVoters({
        voter_ids: [voterId],
        sentiment,
        list_id: listId,
        source: "war_room",
        propagate_family: false,
        candidate_id: candidateId,
      });
    },
    onSuccess: (_, { sentiment }) => {
      toast.success(`Voter tagged as ${sentiment}`, { duration: 2000 });
    },
    onError: (err) => {
      console.error("Failed to tag voter:", err);
      toast.error("Failed to tag voter");
    },
    onSettled: () => {
      // Optionally invalidate to refresh data
      if (listId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.warRoom.overview(listId),
        });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Remove House Sentiment Mutation
// ─────────────────────────────────────────────────────────────────────────────

export function useRemoveHouseSentiment(listId: number | null | undefined) {
  const queryClient = useQueryClient();
  const housesQueryKey = [...queryKeys.warRoom.overview(listId ?? 0), "houses"];

  return useMutation({
    mutationFn: async ({
      wardNo,
      houseNo,
    }: {
      wardNo: string;
      houseNo: string;
      familySize: number;
      previousSentiment: SentimentType;
    }) => {
      if (!listId) throw new Error("No list selected");

      // Get family members and remove their tags
      const family = await api.getFamilyMembers(wardNo, houseNo, listId);
      const voterIds = family.members
        .map((m) => m.voter_id)
        .filter((id): id is number => id !== undefined);

      if (voterIds.length > 0) {
        await Promise.all(voterIds.map((id) => api.removeVoterSentiment(id)));
      }

      return { voterIds };
    },
    onMutate: async ({ wardNo, houseNo }) => {
      await queryClient.cancelQueries({ queryKey: housesQueryKey });

      const previousHouses =
        queryClient.getQueryData<Map<string, HousePosition[]>>(housesQueryKey);

      if (previousHouses) {
        const newMap = new Map(previousHouses);
        const wardHouses = newMap.get(wardNo);
        if (wardHouses) {
          const updatedHouses = wardHouses.map((h) =>
            h.house_no === houseNo
              ? { ...h, sentiment: "unknown" as SentimentType }
              : h
          );
          newMap.set(wardNo, updatedHouses);
        }
        queryClient.setQueryData(housesQueryKey, newMap);
      }

      return { previousHouses };
    },
    onSuccess: (_, { wardNo, houseNo }) => {
      toast.success(`Sentiment tag removed from House ${houseNo}`, {
        description: `Ward ${wardNo}`,
      });
    },
    onError: (err, variables, context) => {
      if (context?.previousHouses) {
        queryClient.setQueryData(housesQueryKey, context.previousHouses);
      }
      console.error("Failed to remove house sentiment:", err);
      toast.error("Failed to remove sentiment tag");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute Sentiments Mutation
// ─────────────────────────────────────────────────────────────────────────────

export function useComputeSentiments(listId: number | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!listId) throw new Error("No list selected");
      return api.computeSentiments({ list_id: listId });
    },
    onSuccess: (result) => {
      toast.success("Sentiments computed successfully", {
        description: `${result.computed_count} voters processed`,
      });

      // Invalidate all war room data to refresh
      if (listId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.warRoom.overview(listId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.warRoom.wardMap(listId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.warRoom.targets(listId),
        });
      }
    },
    onError: (err) => {
      console.error("Failed to compute sentiments:", err);
      toast.error("Failed to compute sentiments");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage Stats Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCoverageStats(houses: Map<string, HousePosition[]>) {
  return useMemo(() => {
    let totalHouses = 0;
    let taggedHouses = 0;

    houses.forEach((wardHouses) => {
      wardHouses.forEach((house) => {
        totalHouses++;
        if (house.sentiment !== "unknown") {
          taggedHouses++;
        }
      });
    });

    const percentage = totalHouses > 0 ? (taggedHouses / totalHouses) * 100 : 0;
    return { total: totalHouses, tagged: taggedHouses, percentage };
  }, [houses]);
}
