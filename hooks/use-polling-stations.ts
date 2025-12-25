/**
 * React Query hooks for Polling Stations page
 *
 * Provides:
 * - Station list fetching with caching
 * - Booth statistics (aggregated intelligence)
 * - Station detail with booth list
 * - Booth voter fetching
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  api,
  type PollingStation,
  type PollingBooth,
  type Voter,
  type PollingBoothStatsSummary,
  type PollingBoothStatsRow,
} from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface BoothStatsData {
  summary: PollingBoothStatsSummary;
  rows: PollingBoothStatsRow[];
}

export interface StationDetailData {
  station: PollingStation;
  booths: PollingBooth[];
}

export interface BoothVotersData {
  booth: PollingBooth;
  voters: Voter[];
  total: number;
}

// ============================================================================
// Polling Stations Hooks
// ============================================================================

/**
 * Fetch all polling stations for a list
 */
export function usePollingStations(listId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.polling.stations(listId!),
    queryFn: () => api.getPollingStations(listId!),
    enabled: !!listId,
    staleTime: 2 * 60 * 1000, // Stations don't change often
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Fetch booth statistics from /api/stats endpoint
 * Includes booth-level campaign health data
 */
export function useBoothStatistics(listId: number | null | undefined) {
  return useQuery<BoothStatsData>({
    queryKey: queryKeys.polling.statsRaw(listId!),
    enabled: !!listId,
    staleTime: 60 * 1000, // Cache stats for 1 minute
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const data = await api.getStatsRaw(listId!);

      // Build summary from metadata
      const summary: PollingBoothStatsSummary = {
        total_booths: data.metadata.total_booths || 0,
        total_voters: data.metadata.total_voters || 0,
        sentiment: data.metadata.sentiment_counts
          ? {
              support: data.metadata.sentiment_counts.support || 0,
              oppose: data.metadata.sentiment_counts.oppose || 0,
              swing: data.metadata.sentiment_counts.swing || 0,
              neutral: data.metadata.sentiment_counts.neutral || 0,
              unknown: data.metadata.sentiment_counts.unknown || 0,
            }
          : undefined,
        turnout: data.metadata.turnout_summary
          ? {
              marked: data.metadata.turnout_summary.marked || 0,
              unmarked: data.metadata.turnout_summary.unmarked || 0,
              coverage_percent:
                data.metadata.turnout_summary.coverage_percent || 0,
              will_vote: data.metadata.turnout_summary.will_vote || 0,
              projected_turnout_percent:
                data.metadata.turnout_summary.projected_turnout_percent || 0,
            }
          : undefined,
      };

      // Map booth_stats to PollingBoothStatsRow format
      const rows: PollingBoothStatsRow[] = (data.booth_stats || []).map(
        (b) => ({
          polling_booth_id: b.polling_booth_id,
          booth_code: b.booth_code,
          booth_name: b.booth_name,
          code: b.booth_code,
          name: b.booth_name,
          ward_no: b.ward_no,
          total_voters: b.total_voters,
          voter_count: b.total_voters,
          male_count: b.male_count,
          female_count: b.female_count,
          support_count: b.sentiment_counts?.support || 0,
          oppose_count: b.sentiment_counts?.oppose || 0,
          swing_count: b.sentiment_counts?.swing || 0,
          neutral_count: b.sentiment_counts?.neutral || 0,
          unknown_count: b.sentiment_counts?.unknown || 0,
          support_percent: b.support_percent,
          turnout_marked: b.turnout_counts?.marked || 0,
          will_vote_count: b.turnout_counts?.will_vote || 0,
          turnout_coverage_percent: b.turnout_coverage_percent,
          projected_turnout_percent: b.projected_turnout_percent,
        })
      );

      return { summary, rows };
    },
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single polling station with its booths
 */
export function usePollingStationDetail(
  listId: number | null | undefined,
  stationCode: string | null | undefined
) {
  return useQuery<StationDetailData>({
    queryKey: queryKeys.polling.station(listId!, stationCode!),
    queryFn: async () => {
      const data = await api.getPollingStation(stationCode!, listId!);
      return {
        station: data.station,
        booths: data.station.booths || [],
      };
    },
    enabled: !!listId && !!stationCode,
    staleTime: 60 * 1000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Fetch voters for a specific booth
 */
export function useBoothVoters(
  listId: number | null | undefined,
  boothId: number | null | undefined,
  options?: { page?: number; perPage?: number }
) {
  const { page = 1, perPage = 1000 } = options || {};

  return useQuery<BoothVotersData>({
    queryKey: queryKeys.polling.boothVoters(listId!, boothId!),
    queryFn: async () => {
      const data = await api.getPollingBooth(boothId!, listId!, {
        include_voters: true,
        page,
        per_page: perPage,
      });
      return {
        booth: data.booth,
        voters: data.voters || [],
        total: data.meta?.total || data.booth.voter_count || 0,
      };
    },
    enabled: !!listId && !!boothId,
    staleTime: 30 * 1000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

/**
 * Prefetch booth voters before user navigates to that tab
 */
export function usePrefetchBoothVoters() {
  const queryClient = useQueryClient();

  return (listId: number, boothId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.polling.boothVoters(listId, boothId),
      queryFn: async () => {
        const data = await api.getPollingBooth(boothId, listId, {
          include_voters: true,
          page: 1,
          per_page: 1000,
        });
        return {
          booth: data.booth,
          voters: data.voters || [],
          total: data.meta?.total || data.booth.voter_count || 0,
        };
      },
    });
  };
}

/**
 * Invalidate all polling station data
 */
export function useInvalidatePollingData() {
  const queryClient = useQueryClient();

  return (listId: number) => {
    queryClient.invalidateQueries({
      queryKey: ["polling", listId],
    });
  };
}
