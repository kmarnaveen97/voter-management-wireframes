/**
 * Voter Sentiment History API Module
 *
 * Endpoints for sentiment audit trail and history tracking.
 */

import { apiFetch, type SentimentType } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface SentimentHistoryEntry {
  id: number;
  voter_id: number;
  sentiment: SentimentType;
  previous_sentiment?: SentimentType;
  source: string;
  confidence: number;
  user_id?: number;
  user_name?: string;
  notes?: string;
  created_at: string;
}

export interface VoterHistoryResponse {
  voter_id: number;
  voter_name: string;
  current_sentiment: SentimentType;
  history: SentimentHistoryEntry[];
  total_changes: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get sentiment change history for a voter
 */
export async function getVoterSentimentHistory(
  voterId: number,
  listId?: number
): Promise<VoterHistoryResponse> {
  const response = await apiFetch<{ data: VoterHistoryResponse }>(
    `/api/history/voter/${voterId}`,
    { params: { list_id: listId } }
  );
  return response.data;
}
