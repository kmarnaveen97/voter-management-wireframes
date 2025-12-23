/**
 * API Module Index
 *
 * Re-exports all API modules for convenient imports.
 *
 * Usage:
 *   import { votersApi, familiesApi, statsApi } from "@/lib/api";
 *   const voters = await votersApi.getVoters(1, 50, listId);
 *
 * Or import specific functions:
 *   import { getVoters, tagSentiment } from "@/lib/api/voters";
 */

// =============================================================================
// MODULE NAMESPACE EXPORTS
// =============================================================================

import * as votersApi from "./voters";
import * as familiesApi from "./families";
import * as statsApi from "./stats";
import * as listsApi from "./lists";
import * as pollingApi from "./polling";
import * as electionsApi from "./elections";
import * as turnoutApi from "./turnout";
import * as comparisonApi from "./comparison";
import * as warRoomApi from "./war-room";
import * as casteApi from "./caste";
import * as symbolsApi from "./symbols";
import * as mapApi from "./map";
import * as usersApi from "./users";
import * as systemApi from "./system";
import * as uploadApi from "./upload";
import * as historyApi from "./history";

export {
  votersApi,
  familiesApi,
  statsApi,
  listsApi,
  pollingApi,
  electionsApi,
  turnoutApi,
  comparisonApi,
  warRoomApi,
  casteApi,
  symbolsApi,
  mapApi,
  usersApi,
  systemApi,
  uploadApi,
  historyApi,
};

// =============================================================================
// SHARED UTILITIES & TYPES
// =============================================================================

export * from "./client";

// Re-export CasteCategory explicitly for easier access
export {
  type CasteCategory,
  type SentimentType,
  type TurnoutStatus,
} from "./client";

// =============================================================================
// TYPE RE-EXPORTS (for convenience)
// =============================================================================

// Voters
export type { Voter, VoterFilters, VotersResponse } from "./voters";

// Families
export type { Family, FamiliesResponse } from "./families";

// Stats
export type { Stats, WardStats, AgeDistribution, StatsResponse } from "./stats";

// Lists
export type { VoterList } from "./lists";

// Polling Stations
export type {
  PollingStation,
  PollingBooth,
  PollingBoothStatsSummary,
  PollingBoothStatsRow,
  StationsResponse,
  StationDetailResponse,
  BoothsResponse,
  BoothDetailResponse,
  BoothStatsResponse,
} from "./polling";

// Elections
export type {
  Candidate,
  Election,
  ElectionSummary,
  ElectionsResponse,
  ElectionDetailResponse,
  CandidatesResponse,
  CandidateDetailResponse,
} from "./elections";

// Turnout
export type {
  TurnoutMark,
  BulkTurnoutMarkRequest,
  TurnoutSummary,
  WardTurnoutStats,
  BoothTurnoutStats,
  HourlyTurnoutData,
  TurnoutSummaryResponse,
  TurnoutMarkResponse,
  BulkTurnoutMarkResponse,
} from "./turnout";

// Comparison
export type {
  ComparisonStatus,
  ComparisonJob,
  ComparisonSummary,
  VoterDiff,
  ComparisonResult,
  CreateComparisonResponse,
  ComparisonStatusResponse,
  ComparisonResultsResponse,
  ComparisonJobsResponse,
} from "./comparison";

// War Room
export type {
  WardMapSummary,
  HousePosition,
  SentimentOverview,
  TargetVoter,
  WarRoomStats,
  ClusterData,
  WarRoomStatsResponse,
  WardMapResponse,
  HousePositionsResponse,
  TargetVotersResponse,
} from "./war-room";

// Caste
export type {
  CasteDetectionResult,
  CasteVoter,
  HouseholdCaste,
  WardCasteDistribution,
  CasteSummary,
  AmbiguousVoter,
  CasteDetectResponse,
  AIResolveResponse,
} from "./caste";

// Symbols
export type {
  ElectionSymbol,
  SymbolsResponse,
  SymbolDetailResponse,
  SymbolSearchResponse,
} from "./symbols";

// Map (Note: WardMapResponse and HousePositionsResponse are re-exported from war-room)
export type {
  WardMapData,
  HouseMapPosition,
  GenerateCoordsResponse,
} from "./map";
export type {
  WardMapResponse as MapWardResponse,
  HousePositionsResponse as MapHousePositionsResponse,
} from "./map";

// Users
export type { CampaignUser, UsersResponse, CreateUserResponse } from "./users";

// System
export type { HealthStatus, ApiInfo, ListInfo, InfoResponse } from "./system";

// Upload
export type {
  ExtractionJob,
  UploadResponse,
  JSONUploadResponse,
  ExtractionStatusResponse,
} from "./upload";

// History
export type { SentimentHistoryEntry, VoterHistoryResponse } from "./history";
