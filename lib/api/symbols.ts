/**
 * Election Symbols API Module
 *
 * Endpoints for managing election symbols used in panchayat elections.
 */

import { apiFetch } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface ElectionSymbol {
  id: number;
  name_en: string;
  name_hi: string;
  category?: string;
  image_url?: string;
}

export interface SymbolsResponse {
  success: boolean;
  symbols: ElectionSymbol[];
  total: number;
}

export interface SymbolDetailResponse {
  success: boolean;
  symbol: ElectionSymbol;
}

export interface SymbolSearchResponse {
  success: boolean;
  results: ElectionSymbol[];
  query: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all available election symbols
 */
export async function getAllSymbols(
  lang?: "hi" | "en"
): Promise<SymbolsResponse> {
  return apiFetch<SymbolsResponse>("/api/symbols", {
    params: { lang },
  });
}

/**
 * Get a specific symbol by ID
 */
export async function getSymbol(
  symbolId: number
): Promise<SymbolDetailResponse> {
  return apiFetch<SymbolDetailResponse>(`/api/symbols/${symbolId}`);
}

/**
 * Search symbols by name (Hindi or English)
 */
export async function searchSymbols(
  query: string
): Promise<SymbolSearchResponse> {
  return apiFetch<SymbolSearchResponse>("/api/symbols/search", {
    params: { q: query },
  });
}
