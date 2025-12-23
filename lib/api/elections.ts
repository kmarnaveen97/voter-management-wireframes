/**
 * Elections & Candidates API Module
 *
 * All election and candidate related API calls
 */

import { apiFetch, buildQueryString } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface Candidate {
  candidate_id: number;
  name: string;
  party?: string;
  symbol?: string;
  photo_url?: string;
  incumbent?: boolean;
  election_id?: number;
  list_id?: number;
  alliance?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Election {
  election_id: number;
  name: string;
  type: "general" | "by-election" | "local" | "assembly" | "parliamentary";
  date: string;
  constituency?: string;
  state?: string;
  status: "upcoming" | "active" | "completed";
  candidate_count?: number;
  candidates?: Candidate[];
  list_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ElectionSummary {
  total_elections: number;
  upcoming: number;
  active: number;
  completed: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ElectionsResponse {
  total: number;
  elections: Election[];
  summary?: ElectionSummary;
}

export interface ElectionDetailResponse {
  election: Election;
  candidates: Candidate[];
}

export interface CandidatesResponse {
  total: number;
  candidates: Candidate[];
}

export interface CandidateDetailResponse {
  candidate: Candidate;
  vote_counts?: {
    support: number;
    oppose: number;
    swing: number;
  };
}

// =============================================================================
// API FUNCTIONS - ELECTIONS
// =============================================================================

/**
 * Get all elections for a list
 */
export async function getElections(
  listId: number,
  options?: {
    status?: "upcoming" | "active" | "completed";
    type?: string;
    page?: number;
    per_page?: number;
  }
): Promise<ElectionsResponse> {
  const params: Record<string, unknown> = { list_id: listId };
  if (options?.status) params.status = options.status;
  if (options?.type) params.type = options.type;
  if (options?.page) params.page = options.page;
  if (options?.per_page) params.per_page = options.per_page;

  const response = await apiFetch<{
    data?: { elections?: Election[] };
    meta?: { total: number };
    summary?: ElectionSummary;
  }>(`/api/elections${buildQueryString(params)}`);

  return {
    total: response.data?.elections?.length || response.meta?.total || 0,
    elections: response.data?.elections || [],
    summary: response.summary,
  };
}

/**
 * Get a single election with candidates
 */
export async function getElection(
  electionId: number,
  listId: number
): Promise<ElectionDetailResponse> {
  const response = await apiFetch<{
    data: Election & { candidates?: Candidate[] };
  }>(`/api/elections/${electionId}?list_id=${listId}`);

  return {
    election: response.data,
    candidates: response.data?.candidates || [],
  };
}

/**
 * Create a new election
 */
export async function createElection(
  listId: number,
  data: {
    name: string;
    type: Election["type"];
    date: string;
    constituency?: string;
    state?: string;
    status?: Election["status"];
  }
): Promise<Election> {
  const response = await apiFetch<{ data: Election }>("/api/elections", {
    method: "POST",
    body: JSON.stringify({ ...data, list_id: listId }),
  });

  return response.data;
}

/**
 * Update an existing election
 */
export async function updateElection(
  electionId: number,
  data: Partial<Omit<Election, "election_id" | "created_at">>
): Promise<Election> {
  const response = await apiFetch<{ data: Election }>(
    `/api/elections/${electionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.data;
}

/**
 * Delete an election
 */
export async function deleteElection(electionId: number): Promise<void> {
  await apiFetch(`/api/elections/${electionId}`, { method: "DELETE" });
}

// =============================================================================
// API FUNCTIONS - CANDIDATES
// =============================================================================

/**
 * Get all candidates for an election
 */
export async function getCandidates(
  electionId: number,
  listId: number
): Promise<CandidatesResponse> {
  const response = await apiFetch<{
    data?: { candidates?: Candidate[] };
    meta?: { total: number };
  }>(`/api/elections/${electionId}/candidates?list_id=${listId}`);

  return {
    total: response.data?.candidates?.length || response.meta?.total || 0,
    candidates: response.data?.candidates || [],
  };
}

/**
 * Get a single candidate
 */
export async function getCandidate(
  candidateId: number,
  listId: number
): Promise<CandidateDetailResponse> {
  const response = await apiFetch<{
    data: Candidate;
    vote_counts?: { support: number; oppose: number; swing: number };
  }>(`/api/candidates/${candidateId}?list_id=${listId}`);

  return {
    candidate: response.data,
    vote_counts: response.vote_counts,
  };
}

/**
 * Create a new candidate
 */
export async function createCandidate(
  electionId: number,
  data: {
    name: string;
    party?: string;
    symbol?: string;
    photo_url?: string;
    incumbent?: boolean;
    alliance?: string;
    notes?: string;
  }
): Promise<Candidate> {
  const response = await apiFetch<{ data: Candidate }>(
    `/api/elections/${electionId}/candidates`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return response.data;
}

/**
 * Update an existing candidate
 */
export async function updateCandidate(
  candidateId: number,
  data: Partial<Omit<Candidate, "candidate_id" | "created_at">>
): Promise<Candidate> {
  const response = await apiFetch<{ data: Candidate }>(
    `/api/candidates/${candidateId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.data;
}

/**
 * Delete a candidate
 */
export async function deleteCandidate(candidateId: number): Promise<void> {
  await apiFetch(`/api/candidates/${candidateId}`, { method: "DELETE" });
}
