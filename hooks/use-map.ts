/**
 * Map & Geo Visualization React Query Hooks
 *
 * Hooks for map coordinates, ward visualization, and house positions.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as mapApi from "@/lib/api/map";
import type {
  WardMapData,
  HouseMapPosition,
  WardMapResponse,
  HousePositionsResponse,
  GenerateCoordsResponse,
} from "@/lib/api/map";
import { toast } from "sonner";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch ward map data for heatmap visualization
 */
export function useMapWards(
  listId: number | undefined,
  options?: Partial<UseQueryOptions<WardMapResponse>>
) {
  return useQuery({
    queryKey: queryKeys.map.wards(listId!),
    queryFn: () => mapApi.getWardMapData(listId),
    enabled: !!listId,
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Fetch house positions for a specific ward
 */
export function useMapHousePositions(
  listId: number | undefined,
  wardNo: string | undefined,
  options?: Partial<UseQueryOptions<HousePositionsResponse>>
) {
  return useQuery({
    queryKey: queryKeys.map.housePositions(listId!, wardNo!),
    queryFn: () => mapApi.getHousePositions(wardNo!, listId),
    enabled: !!listId && !!wardNo,
    staleTime: 30 * 1000,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Generate geo coordinates for all houses
 */
export function useGenerateCoordinates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      centerLat,
      centerLng,
    }: {
      listId: number;
      centerLat?: number;
      centerLng?: number;
    }) => mapApi.generateCoordinates(listId, centerLat, centerLng),
    onSuccess: (data, variables) => {
      toast.success("Coordinates generated", {
        description: `Processed ${data.wards_processed} wards, ${data.houses_processed} houses`,
      });
      // Invalidate map queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.map.wards(variables.listId),
      });
    },
    onError: (error) => {
      toast.error("Failed to generate coordinates", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
