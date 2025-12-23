"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Default query options for the entire app
const defaultQueryOptions = {
  queries: {
    // Data is considered fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 2 times
    retry: 2,
    // Don't refetch on window focus by default (can override per-query)
    refetchOnWindowFocus: false,
    // Don't refetch on mount if data exists
    refetchOnMount: false,
    // Don't refetch on reconnect
    refetchOnReconnect: false,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to avoid sharing state between requests in SSR
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: defaultQueryOptions })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Export a function to create QueryClient for SSR if needed
export function makeQueryClient() {
  return new QueryClient({ defaultOptions: defaultQueryOptions });
}

// Query key factory for type-safe, consistent cache keys
export const queryKeys = {
  // Voter lists
  lists: {
    all: ["lists"] as const,
    list: (id: number) => ["lists", id] as const,
  },

  // Voters
  voters: {
    all: (listId: number) => ["voters", listId] as const,
    list: (listId: number, filters: object) =>
      ["voters", listId, "list", filters] as const,
    search: (listId: number, query: string) =>
      ["voters", listId, "search", query] as const,
    detail: (listId: number, voterId: number) =>
      ["voters", listId, voterId] as const,
    sentiment: (listId: number, voterId: number) =>
      ["voters", listId, voterId, "sentiment"] as const,
    history: (listId: number, voterId: number) =>
      ["voters", listId, voterId, "history"] as const,
  },

  // Families
  families: {
    all: (listId: number) => ["families", listId] as const,
    list: (listId: number, page: number, filters?: object) =>
      ["families", listId, "list", page, filters] as const,
    members: (listId: number, wardNo: string, houseNo: string) =>
      ["families", listId, "members", wardNo, houseNo] as const,
    tree: (listId: number, wardNo: string, houseNo: string) =>
      ["families", listId, "tree", wardNo, houseNo] as const,
    sentiments: (listId: number, wardNo: string, houseNo: string) =>
      ["families", listId, "sentiments", wardNo, houseNo] as const,
  },

  // Statistics
  stats: {
    all: (listId: number) => ["stats", listId] as const,
    overview: (listId: number) => ["stats", listId, "overview"] as const,
    wards: (listId: number) => ["stats", listId, "wards"] as const,
    age: (listId: number) => ["stats", listId, "age"] as const,
    gender: (listId: number) => ["stats", listId, "gender"] as const,
    targets: (listId: number, filters?: object) =>
      ["stats", listId, "targets", filters] as const,
  },

  // War Room / Sentiment
  warRoom: {
    overview: (listId: number) => ["warRoom", listId, "overview"] as const,
    wardMap: (listId: number) => ["warRoom", listId, "wardMap"] as const,
    houses: (listId: number, wardNo: string) =>
      ["warRoom", listId, "houses", wardNo] as const,
    targets: (listId: number) => ["warRoom", listId, "targets"] as const,
  },

  // Map / Geo
  map: {
    wards: (listId: number) => ["map", listId, "wards"] as const,
    housePositions: (listId: number, wardNo: string) =>
      ["map", listId, "houses", wardNo] as const,
  },

  // Elections / Candidates
  elections: {
    all: ["elections"] as const,
    list: (filters?: object) => ["elections", "list", filters] as const,
    detail: (electionId: number) => ["elections", electionId] as const,
    byList: (
      listId: number,
      status?: "active" | "withdrawn" | "disqualified",
      wardNo?: string
    ) => ["elections", listId, { status, wardNo }] as const,
    candidates: (listId: number, filters?: object) =>
      ["elections", listId, "candidates", filters] as const,
    candidate: (candidateId: number) =>
      ["elections", "candidate", candidateId] as const,
    ourCandidate: (listId: number) =>
      ["elections", listId, "ourCandidate"] as const,
  },

  // Projections
  projections: {
    all: (listId: number) => ["projections", listId] as const,
    overview: (listId: number, includeWardBreakdown?: boolean) =>
      ["projections", listId, "overview", { includeWardBreakdown }] as const,
    compare: (listId: number, candidateIds: number[]) =>
      ["projections", listId, "compare", candidateIds] as const,
    ward: (listId: number, wardNo: string) =>
      ["projections", listId, "ward", wardNo] as const,
  },

  // Polling
  polling: {
    stations: (listId: number) => ["polling", listId, "stations"] as const,
    station: (listId: number, stationId: number) =>
      ["polling", listId, "station", stationId] as const,
    booths: (listId: number, filters?: object) =>
      ["polling", listId, "booths", filters] as const,
    booth: (listId: number, boothId: number) =>
      ["polling", listId, "booth", boothId] as const,
    boothStats: (listId: number, wardNo?: string) =>
      ["polling", listId, "boothStats", wardNo] as const,
    boothVoters: (listId: number, boothId: number) =>
      ["polling", listId, "booth", boothId, "voters"] as const,
  },

  // Turnout
  turnout: {
    summary: (listId: number) => ["turnout", listId, "summary"] as const,
    voters: (listId: number, filters?: Record<string, unknown>) =>
      ["turnout", listId, "voters", filters] as const,
  },

  // Caste Detection
  caste: {
    summary: (listId: number) => ["caste", listId, "summary"] as const,
    voter: (listId: number, voterId: number) =>
      ["caste", listId, "voter", voterId] as const,
    household: (listId: number, wardNo: string, houseNo: string) =>
      ["caste", listId, "household", wardNo, houseNo] as const,
    ward: (listId: number, wardNo: string) =>
      ["caste", listId, "ward", wardNo] as const,
    voters: (listId: number, filters?: object) =>
      ["caste", listId, "voters", filters] as const,
    ambiguous: (listId: number, filters?: object) =>
      ["caste", listId, "ambiguous", filters] as const,
  },

  // Symbols
  symbols: {
    all: (lang?: string) => ["symbols", lang] as const,
    detail: (symbolId: number) => ["symbols", symbolId] as const,
    search: (query: string) => ["symbols", "search", query] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    detail: (userId: number) => ["users", userId] as const,
  },

  // Comparison
  comparison: {
    jobs: (listId?: number) => ["comparison", "jobs", listId] as const,
    status: (jobId: string) => ["comparison", "status", jobId] as const,
    results: (jobId: string) => ["comparison", "results", jobId] as const,
  },

  // System
  system: {
    health: ["system", "health"] as const,
    info: ["system", "info"] as const,
  },

  // Upload / Extraction
  extraction: {
    status: (jobId: string) => ["extraction", jobId] as const,
  },
} as const;
