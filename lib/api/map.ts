/**
 * Map & Geo Visualization API Module
 *
 * Endpoints for map coordinates, ward visualization, and house positions.
 */

import { apiFetch, apiPost, type SentimentType } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface WardMapData {
  ward_no: string;
  total_houses: number;
  total_voters: number;
  sentiment_breakdown: {
    support: number;
    oppose: number;
    swing: number;
    neutral: number;
    unknown: number;
  };
  dominant_sentiment: SentimentType;
  center_lat?: number;
  center_lng?: number;
}

export interface HouseMapPosition {
  house_no: string;
  ward_no: string;
  lat: number;
  lng: number;
  voter_count: number;
  sentiment: SentimentType;
  tagged_count: number;
}

export interface GenerateCoordsResponse {
  success: boolean;
  message: string;
  wards_processed: number;
  houses_processed: number;
}

export interface WardMapResponse {
  success: boolean;
  wards: WardMapData[];
  list_id: number;
}

export interface HousePositionsResponse {
  success: boolean;
  ward_no: string;
  houses: HouseMapPosition[];
  total: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Generate geo coordinates for all houses in each ward
 * Uses sunflower spiral algorithm for distribution
 */
export async function generateCoordinates(
  listId: number,
  centerLat?: number,
  centerLng?: number
): Promise<GenerateCoordsResponse> {
  return apiPost<GenerateCoordsResponse>("/api/map/generate-coords", {
    list_id: listId,
    center_lat: centerLat,
    center_lng: centerLng,
  });
}

/**
 * Get ward summary data for heatmap visualization
 */
export async function getWardMapData(
  listId?: number
): Promise<WardMapResponse> {
  return apiFetch<WardMapResponse>("/api/map/wards", {
    params: { list_id: listId },
  });
}

/**
 * Get house positions with sentiment for a specific ward
 */
export async function getHousePositions(
  wardNo: string,
  listId?: number
): Promise<HousePositionsResponse> {
  return apiFetch<HousePositionsResponse>(`/api/map/ward/${wardNo}/houses`, {
    params: { list_id: listId },
  });
}
