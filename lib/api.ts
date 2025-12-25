// API client for connecting to the backend
// Swagger API Version: 2.0
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

// ============================================================================
// Type Definitions (aligned with Swagger schema)
// ============================================================================

export interface Voter {
  voter_id: number;
  serial_no: string;
  name: string;
  name_hindi?: string;
  relative_name: string;
  relative_name_hindi?: string;
  house_no: string;
  age: number;
  gender: "Male" | "Female" | "पु" | "म";
  ward_no: string;
  ps_code?: string;
  ps_name?: string;
  pb_code?: string;
  pb_name?: string;
  voter_id_number?: string;
  mobile?: string | null;
  // Sentiment data (optional, populated from sentiment API)
  sentiment?: "support" | "oppose" | "swing" | "unknown" | "neutral";
  sentiment_source?: "manual" | "inherited" | "computed";
  // Turnout data (optional, populated from turnout API)
  turnout_status?: TurnoutStatus | null;
  turnout_note?: string | null;
  turnout_marked_at?: string | null;
  turnout_marked_by?: number | null;
}

export interface Family {
  ward_id?: number;
  ward_no: string;
  house_no: string;
  list_id?: number;
  address?: string;
  member_count: number;
  vote_count?: number;
  mukhiya_name?: string;
  mukhiya_age?: number;
  mukhiya_gender?: string;
  members?: Voter[];
}

export interface VoterList {
  list_id: number;
  filename?: string;
  file?: string;
  year?: number;
  upload_date?: string;
  total_voters: number;
  status?: string;
  source_type?: string;
  location?: {
    block?: string;
    district?: string;
    gram_panchayat?: string;
  };
  metadata?: {
    import_path?: string;
  };
  // Legacy compatibility
  id?: number;
  name?: string;
  election_date?: string;
  created_at?: string;
}

export interface Ward {
  ward_id: number;
  ward_no: string;
  voter_count: number;
}

// Transformed stats for dashboard use
export interface Stats {
  list_id: number;
  total_voters: number;
  male_count: number;
  female_count: number;
  male_percentage: number;
  female_percentage: number;
  total_wards: number;
  average_age: number;
  sentiment_counts?: {
    support: number;
    oppose: number;
    swing: number;
    neutral: number;
    unknown: number;
  };
}

// Raw API response from /api/stats
export interface StatsApiResponse {
  metadata: {
    filename: string;
    imported_at: string;
    total_voters: number;
    total_wards: number;
    total_booths?: number;
    sentiment_counts?: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
    turnout_summary?: {
      marked: number;
      unmarked: number;
      coverage_percent: number;
      will_vote: number;
      projected_turnout_percent: number;
    };
  };
  ward_stats: Array<{
    ward_no: string;
    voters: number;
    males: number;
    females: number;
    families: number;
    largest_family: number;
    sentiment_counts?: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
  }>;
  booth_stats?: Array<{
    polling_booth_id: number;
    booth_code: string;
    booth_name: string;
    station_code: string;
    station_name: string;
    ward_no: string;
    total_voters: number;
    male_count: number;
    female_count: number;
    support_percent: number;
    projected_turnout_percent: number;
    turnout_coverage_percent: number;
    sentiment_counts: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
    turnout_counts: {
      will_vote: number;
      wont_vote: number;
      already_voted: number;
      marked: number;
      unmarked: number;
    };
  }>;
}

export interface WardStats {
  ward_no: string;
  total_voters: number;
  male_count: number;
  female_count: number;
  sentiment_counts?: {
    support: number;
    oppose: number;
    swing: number;
    neutral: number;
    unknown: number;
  };
}

export interface AgeDistribution {
  list_id: number;
  age_groups: { [ageGroup: string]: number };
  average_age: number;
  total_voters: number;
  by_gender: {
    Male: { [ageGroup: string]: number };
    Female: { [ageGroup: string]: number };
    Other: { [ageGroup: string]: number };
  };
  sentiment_counts?: {
    support: number;
    oppose: number;
    swing: number;
    neutral: number;
    unknown: number;
  };
  sentiment_by_gender?: {
    Male: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
    Female: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
    Other: {
      support: number;
      oppose: number;
      swing: number;
      neutral: number;
      unknown: number;
    };
  };
}

export interface GenderDistribution {
  list_id: number;
  male_count: number;
  female_count: number;
  other_count: number;
  male_percentage: number;
  female_percentage: number;
  total: number;
}

export interface ExtractionStatus {
  job_id: string;
  status: "processing" | "completed" | "error";
  progress: number;
  current_page?: number;
  total_pages?: number;
  voters_extracted?: number;
  message?: string;
  current_step?: string;
  pdf_filename?: string;
  filename?: string;
  election_name?: string;
  election_date?: string;
  list_id?: number;
  output_file?: string;
  error?: string;
  elapsed_seconds?: number;
}

// Active jobs response from /api/upload/active-jobs
export interface ActiveJobsResponse {
  has_active: boolean;
  active_jobs: ExtractionStatus[];
  count: number;
}

// Recent jobs response from /api/jobs/recent
export interface RecentJobsResponse {
  jobs: ExtractionStatus[];
  count: number;
}

export interface ElectionSymbol {
  id: number;
  name_hi: string;
  name_en: string;
}

export interface PollingStation {
  polling_station_id: number;
  code: string;
  name: string;
  booth_count: number;
  voter_count: number;
  ward_id?: number;
  ward_no?: string;
  booths?: PollingBooth[];
}

export interface PollingBooth {
  polling_booth_id: number;
  code: string;
  name: string;
  polling_station_id?: number;
  station_code?: string;
  station_name?: string;
  ward_id?: number;
  ward_no?: string;
  voter_count: number;
  male_count?: number;
  female_count?: number;
  sentiment_counts?: SentimentCounts;
  turnout_counts?: TurnoutCounts;
  voters?: Voter[];
}

export type SentimentCounts = Partial<Record<SentimentType, number>>;

export type TurnoutCountKey = TurnoutStatus | "unmarked";

export type TurnoutCounts = Partial<Record<TurnoutCountKey, number>>;

export interface PollingBoothStatsSummary {
  total_booths: number;
  total_voters: number;
  sentiment?: {
    support: number;
    oppose: number;
    swing: number;
    neutral?: number;
    unknown?: number;
    support_percent?: number;
    net_margin?: number;
    net_margin_percent?: number;
  };
  turnout?: {
    marked: number;
    unmarked: number;
    coverage_percent?: number;
    will_vote?: number;
    projected_turnout_percent?: number;
  };
}

export interface PollingBoothStatsRow {
  polling_booth_id?: number;
  booth_id?: number;
  booth_code?: string;
  booth_name?: string;
  code?: string;
  name?: string;
  ward_no?: string;
  total_voters?: number;
  voter_count?: number;
  male_count?: number;
  female_count?: number;

  support_count?: number;
  oppose_count?: number;
  swing_count?: number;
  neutral_count?: number;
  unknown_count?: number;
  support_percent?: number;

  turnout_marked?: number;
  will_vote_count?: number;
  turnout_coverage_percent?: number;
  projected_turnout_percent?: number;
}

export interface Candidate {
  candidate_id: number;
  list_id: number;
  voter_id?: number | null;
  voter_serial_no?: number | null;
  name: string;
  relative_name?: string;
  age?: number;
  gender?: "Male" | "Female";
  house_no?: string;
  ward_no?: string;
  party_name?: string;
  party_symbol?: string;
  contact_number?: string;
  education?: string;
  is_from_voter_list?: boolean;
  is_our_candidate?: boolean;
  status: "active" | "withdrawn" | "disqualified";
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility
  id?: number;
}

// Projections types for multi-candidate support
export interface CandidateProjection {
  candidate_id: number;
  candidate_name: string;
  party_name?: string;
  party_symbol?: string;
  is_our_candidate: boolean;
  sentiment_counts: {
    support: number;
    oppose: number;
    swing: number;
    neutral: number;
    unknown: number;
  };
  projected_votes: number;
  vote_share_percent: number;
  win_probability?: number;
}

export interface ProjectionsResponse {
  list_id: number;
  total_voters: number;
  projected_turnout: number;
  projections: CandidateProjection[];
  our_candidate?: CandidateProjection;
  leader?: CandidateProjection;
  margin?: number;
}

export interface WardProjection {
  ward_no: string;
  total_voters: number;
  projections: CandidateProjection[];
  leader_candidate_id: number;
  leader_name: string;
  margin: number;
}

export interface Election {
  election_id: number;
  list_id: number;
  election_name: string;
  election_date?: string;
  election_type?: "panchayat" | "municipal" | "state" | "lok_sabha";
  description?: string;
  status?: "active" | "completed" | "archived";
  total_candidates?: number;
  filename?: string;
  total_voters?: number;
  list_year?: number;
  candidate_count?: number;
  ward_count?: number;
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility
  id?: number;
  name?: string;
}

export interface ComparisonSummary {
  total_old: number;
  total_new: number;
  matched: number;
  corrected: number;
  new_voters: number;
  deleted_voters: number;
}

export interface ComparisonMatchedItem {
  old: Voter;
  new: Voter;
  ward: string;
}

export interface ComparisonCorrectedItem {
  old: Voter;
  new: Voter;
  ward: string;
  name_score: number;
  relative_score: number;
}

export interface ComparisonNewDeletedItem {
  voter: Voter;
  ward: string;
}

export interface ComparisonWardBreakdown {
  [ward: string]: {
    matched: number;
    corrected: number;
    new: number;
    deleted: number;
  };
}

export interface ComparisonJob {
  job_id: string;
  status: "processing" | "completed" | "error";
  progress?: number;
  message?: string;
  error?: string;
  result?: {
    summary: ComparisonSummary;
    matched: ComparisonMatchedItem[];
    corrected: ComparisonCorrectedItem[];
    new_voters: ComparisonNewDeletedItem[];
    deleted_voters: ComparisonNewDeletedItem[];
    ward_breakdown?: ComparisonWardBreakdown;
  };
}

// Saved comparison metadata for listing
export interface SavedComparison {
  job_id: string;
  old_list_id: number;
  new_list_id: number;
  old_list_name?: string;
  new_list_name?: string;
  status: "pending" | "processing" | "completed" | "error";
  matched_count?: number;
  corrected_count?: number;
  new_voters_count?: number;
  deleted_voters_count?: number;
  created_at: string;
  completed_at?: string;
}

// Response for GET /api/comparisons
export interface SavedComparisonsResponse {
  comparisons: SavedComparison[];
}

// Full saved comparison report - GET /api/comparisons/{job_id}
export interface SavedComparisonReport {
  job_id: string;
  old_list_id: number;
  new_list_id: number;
  old_list_name?: string;
  new_list_name?: string;
  status: "pending" | "processing" | "completed" | "error";
  summary?: ComparisonSummary;
  result?: {
    summary?: ComparisonSummary;
    matched: ComparisonMatchedItem[];
    corrected: ComparisonCorrectedItem[];
    new_voters: ComparisonNewDeletedItem[];
    deleted_voters: ComparisonNewDeletedItem[];
    ward_breakdown?: ComparisonWardBreakdown;
  };
  created_at?: string;
  completed_at?: string;
}

// Delete comparison response
export interface DeleteComparisonResponse {
  success: boolean;
  message: string;
  job_id: string;
}

export interface ComparisonResult {
  status: "completed";
  old_count: number;
  new_count: number;
  result: {
    summary: ComparisonSummary;
    matched: ComparisonMatchedItem[];
    corrected: ComparisonCorrectedItem[];
    new_voters: ComparisonNewDeletedItem[];
    deleted_voters: ComparisonNewDeletedItem[];
    ward_breakdown?: ComparisonWardBreakdown;
  };
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  components: {
    database: string;
    gemini_api: string;
    upload_directory: string;
  };
  response_time_ms: number;
}

// ============================================================================
// Sentiment & War Room Types
// ============================================================================

/**
 * All possible sentiment values (including display-only values)
 * Note: "unknown" is for display/computed values only - do NOT send to API
 */
export type SentimentType =
  | "support"
  | "oppose"
  | "swing"
  | "unknown"
  | "neutral";

/**
 * Valid sentiment values that can be sent to the backend API
 * Backend only accepts: support, oppose, swing, neutral
 */
export type TaggableSentiment = Exclude<SentimentType, "unknown">;

export type TurnoutStatus =
  | "will_vote"
  | "wont_vote"
  | "unsure"
  | "not_home"
  | "already_voted"
  | "needs_transport"
  | "migrated"
  | "deceased"
  | "invalid";

export interface TurnoutMark {
  voter_id: number;
  status: TurnoutStatus;
  note?: string;
  user_id?: number;
  source?: string;
  marked_at?: string;
}

export interface TurnoutMarkRequest {
  list_id: number;
  voter_id: number;
  status: TurnoutStatus;
  voted_for_candidate_id?: number;
  note?: string;
  user_id?: number;
  source?: string;
  marked_at?: string;
}

export interface BulkTurnoutMarkRequest {
  list_id: number;
  marks?: Array<{ voter_id: number; status: TurnoutStatus; note?: string }>;
  voter_ids?: number[];
  status?: TurnoutStatus;
  note?: string;
  user_id?: number;
  source?: string;
}

export interface BulkTurnoutMarkResponse {
  success: boolean;
  data: {
    marked_count: number;
    failed_count: number;
    results: Array<{
      voter_id: number;
      success: boolean;
      latest?: {
        turnout_status: TurnoutStatus;
        turnout_note?: string;
        turnout_marked_at: string;
        turnout_marked_by?: number;
      };
      error?: string;
    }>;
  };
}

export interface VoterSentiment {
  voter_id: number;
  sentiment: SentimentType;
  is_manual: boolean;
  inherited_from?: number;
  notes?: string;
  tagged_at?: string;
  tagged_by?: string;
}

export interface FamilySentiment {
  ward_no: string;
  house_no: string;
  members: Array<{
    voter_id: number;
    name: string;
    age: number;
    gender: string;
    sentiment: SentimentType;
    is_manual: boolean;
    is_youth: boolean;
  }>;
}

export interface WardMapSummary {
  ward_no: string;
  total_voters: number;
  support_count: number;
  oppose_count: number;
  swing_count: number;
  unknown_count: number;
  neutral_count?: number;
  win_margin_percent: number;
  status: "safe" | "battleground" | "lost";
  center: {
    x: number;
    y: number;
  };
  manually_tagged?: number;
}

export interface HousePosition {
  ward_no?: string; // Added locally when fetching
  house_no: string;
  sentiment: SentimentType;
  family_size: number;
  support_count: number;
  oppose_count: number;
  swing_count: number;
  has_manual_tag: boolean;
  confidence: number;
  position: {
    x: number;
    y: number;
  };
  // Polling station and booth info
  ps_code?: string;
  ps_name?: string;
  pb_code?: string;
  pb_name?: string;
}

export interface SentimentOverview {
  list_id: number;
  total_voters: number;
  sentiment_breakdown: {
    support: number;
    oppose?: number;
    swing: number;
    unknown: number;
    neutral?: number;
  };
  source_breakdown: {
    manual: number;
    inherited_parent?: number;
    inherited_spouse?: number;
    inherited_sibling?: number;
    youth_rule: number;
    none: number;
  };
  tagging_activity: {
    total_manual_tags: number;
    last_24_hours: number;
    last_7_days: number;
  };
  win_projection: {
    support: number;
    oppose: number;
    margin: number;
    margin_percent: number;
  };
  ward_status: {
    safe?: number;
    battleground?: number;
    lost?: number;
  };
}

export interface TargetVoter {
  voter_id: number;
  name: string;
  age: number;
  gender: string;
  ward_no: string;
  house_no: string;
  sentiment: SentimentType;
  priority_score: number;
  confidence: number;
  relationship?: string;
}

export interface SentimentHistory {
  voter_id: number;
  changes: Array<{
    from_sentiment: SentimentType;
    to_sentiment: SentimentType;
    changed_at: string;
    changed_by?: string;
    notes?: string;
  }>;
}

export interface VoterProfile {
  voter_id: number;
  name: string;
  relative_name: string;
  gender: string;
  age: number;
  house_no: string;
  ward_id: number;
  serial_no: string;

  mobile_number: string | null;
  alt_mobile_number: string | null;
  has_whatsapp: boolean;

  verified_caste: string | null;
  caste_category: "General" | "OBC" | "SC" | "ST" | "EWS" | null;
  caste_source: "self_declared" | "document" | "family" | "field_worker" | null;
  detected_caste: string | null;
  caste_confidence: number | null;

  occupation: string | null;
  economic_status: "bpl" | "lower" | "middle" | "upper" | null;
  is_beneficiary: boolean;
  beneficiary_schemes: string[];
  land_ownership: string | null;

  is_influencer: boolean;
  influencer_reach: number;
  influencer_type:
    | "political"
    | "religious"
    | "community_leader"
    | "teacher"
    | "business"
    | null;
  party_affiliation: string | null;
  is_volunteer: boolean;

  primary_issue: string | null;
  grievance: string | null;
  issues_tags: string[];

  profile_exists: boolean;
  updated_at: string | null;
}

export interface VoterProfileUpdate {
  mobile_number?: string;
  alt_mobile_number?: string;
  has_whatsapp?: boolean;

  verified_caste?: string;
  caste_category?: "General" | "OBC" | "SC" | "ST" | "EWS";
  caste_source?: "self_declared" | "document" | "family" | "field_worker";

  occupation?: string;
  economic_status?: "bpl" | "lower" | "middle" | "upper";
  is_beneficiary?: boolean;
  beneficiary_schemes?: string[];
  land_ownership?: string;

  is_influencer?: boolean;
  influencer_reach?: number;
  influencer_type?:
    | "political"
    | "religious"
    | "community_leader"
    | "teacher"
    | "business";
  party_affiliation?: string;
  is_volunteer?: boolean;

  primary_issue?: string;
  grievance?: string;
  issues_tags?: string[];
}

export interface BulkProfileUpdate {
  voter_id: number;
  [key: string]: any;
}

export interface ProfileSearchFilters {
  list_id: number;
  caste_category?: "General" | "OBC" | "SC" | "ST" | "EWS";
  is_influencer?: boolean;
  is_beneficiary?: boolean;
  occupation?: string;
  economic_status?: "bpl" | "lower" | "middle" | "upper";
  influencer_type?:
    | "political"
    | "religious"
    | "community_leader"
    | "teacher"
    | "business";
  party_affiliation?: string;
  limit?: number;
  offset?: number;
}

export interface SentimentTurnoutMatrix {
  matrix: {
    support_unmarked: number;
    support_will_vote: number;
    support_needs_transport: number;
    oppose_unmarked: number;
    swing_unmarked: number;
  };
  projection: {
    total_active: number;
    already_voted: number;
    expected_for_us: number;
    expected_against_us: number;
    margin: number;
    swing_likely_voting: number;
  };
  action_needed: {
    supporters_need_transport: number;
    supporters_not_contacted: number;
    confirmed_not_voting: number;
  };
}

export interface DDayPriorityVoter {
  voter_id: number;
  name: string;
  relative_name: string;
  house_no: string;
  ward_no: number | string;
  booth_no: number;
  age: number;
  gender: string;
  mobile: string | null;
  sentiment: SentimentType;
  turnout_status: TurnoutStatus | "unmarked";
  needs_transport: boolean;
  priority: number;
  action: string;
}

export interface DDayPriorityResponse {
  total_results: number;
  priority_summary: Record<string, number>;
  voters: DDayPriorityVoter[];
}

export interface DDaySummary {
  overview: {
    total_active_voters: number;
    already_voted: number;
    voting_progress_percent: number;
    expected_for_us: number;
    expected_against_us: number;
    current_margin: number;
  };
  urgent_actions: {
    supporters_need_transport: number;
    supporters_not_contacted: number;
  };
  priority_breakdown: Array<{
    priority: number;
    action: string;
    count: number;
  }>;
  ward_breakdown: Array<{
    ward_no: number | string;
    supporters_pending: number;
    need_transport: number;
    already_voted: number;
  }>;
  booth_breakdown: Array<{
    booth_no: number;
    ward_no: number | string;
    total: number;
    supporters_pending: number;
    need_transport: number;
    already_voted: number;
  }>;
}

export interface CandidateVoteBreakdown {
  from_supporters: number;
  from_opponents: number;
  from_swing: number;
  from_unknown: number;
}

export interface CandidateVoteCount {
  candidate_id: number;
  candidate_name: string;
  party_name: string | null;
  is_our_candidate: boolean;
  vote_count: number;
  vote_share_percent: number;
  breakdown: CandidateVoteBreakdown;
}

export interface DDayCandidateVotes {
  list_id: number;
  total_voted: number;
  unknown_votes: number;
  candidates: CandidateVoteCount[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  list_id?: number;
  page: number;
  per_page: number;
  total: number;
  items: T[];
}

// ============================================================================
// API Client
// ============================================================================

export const api = {
  // --------------------------------------------------------------------------
  // System Endpoints
  // --------------------------------------------------------------------------

  /** Health check - GET /health */
  healthCheck: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  },

  /** Get API info - GET / */
  getApiInfo: async () => {
    const res = await fetch(`${API_BASE_URL}/`);
    if (!res.ok) throw new Error("Failed to fetch API info");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Voter Lists
  // --------------------------------------------------------------------------

  /** Get current voter list info - GET /api/info */
  getListInfo: async (): Promise<VoterList> => {
    const res = await fetch(`${API_BASE_URL}/api/info`);
    if (!res.ok) throw new Error("Failed to fetch voter list info");
    return res.json();
  },

  /**
   * Get all voter lists
   * First tries dedicated /api/lists endpoint, falls back to probing with smart batching
   */
  getVoterLists: async (): Promise<{ lists: VoterList[] }> => {
    // First, try the dedicated lists endpoint (if backend supports it)
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists`);
      if (res.ok) {
        const data = await res.json();

        // Handle { data: { lists: [] } } format (Standard API response)
        if (data.data?.lists && Array.isArray(data.data.lists)) {
          return { lists: data.data.lists };
        }

        // Handle { lists: [] } format (Legacy/Direct response)
        if (data.lists && Array.isArray(data.lists)) {
          return { lists: data.lists };
        }
      }
    } catch {
      // Endpoint doesn't exist, fall back to probing
    }

    // Fallback: Probe list_ids in batches to discover available lists
    // Use smart batching: start with 1-20, then continue in batches if we find lists near the end
    const lists: VoterList[] = [];
    let batchStart = 1;
    const batchSize = 20;
    const maxListId = 200; // Safety limit
    let consecutiveEmptyBatches = 0;
    const maxEmptyBatches = 2; // Stop after 2 empty batches in a row

    while (
      batchStart <= maxListId &&
      consecutiveEmptyBatches < maxEmptyBatches
    ) {
      const batchEnd = Math.min(batchStart + batchSize - 1, maxListId);

      const probePromises = Array.from(
        { length: batchEnd - batchStart + 1 },
        (_, i) => batchStart + i
      ).map(async (listId) => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/stats?list_id=${listId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.metadata?.total_voters > 0) {
              return {
                list_id: listId,
                total_voters: data.metadata.total_voters,
                total_wards: data.metadata.total_wards,
                filename: data.metadata.filename,
                upload_date: data.metadata.imported_at,
              } as VoterList;
            }
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(probePromises);
      const foundLists = results.filter(
        (list): list is VoterList => list !== null
      );

      if (foundLists.length > 0) {
        lists.push(...foundLists);
        consecutiveEmptyBatches = 0;

        // If we found lists near the end of this batch, continue searching
        const maxFoundId = Math.max(...foundLists.map((l) => l.list_id));
        if (maxFoundId >= batchEnd - 2) {
          // Found lists near the end, might be more
          batchStart = batchEnd + 1;
          continue;
        }
      } else {
        consecutiveEmptyBatches++;
      }

      batchStart = batchEnd + 1;
    }

    // Sort by list_id for consistent ordering
    lists.sort((a, b) => a.list_id - b.list_id);

    return { lists };
  },

  /** Delete voter list (permanent) - DELETE /api/voters/list/{list_id} */
  deleteVoterList: async (
    listId: number
  ): Promise<{
    success: boolean;
    message: string;
    list_id: number;
    deleted_voters: number;
    filename: string;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/list/${listId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete voter list");
    return res.json();
  },

  /** Archive voter list (soft delete) - DELETE /api/files/{list_id} */
  archiveVoterList: async (
    listId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/files/${listId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to archive voter list");
    return res.json();
  },

  /** Clear all data - DELETE /api/voters/clear-all */
  clearAllData: async (): Promise<{
    success: boolean;
    message: string;
    lists_deleted: number;
    voters_deleted: number;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/clear-all`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to clear all data");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Voters
  // --------------------------------------------------------------------------

  /** Get all voters (paginated) - GET /api/voters */
  getVoters: async (
    page = 1,
    perPage = 50,
    listId?: number
  ): Promise<{
    list_id: number;
    page: number;
    per_page: number;
    total: number;
    voters: Voter[];
  }> => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/voters?${params}`);
    if (!res.ok) throw new Error("Failed to fetch voters");
    const json = await res.json();
    // API returns { data: { list_id, voters }, meta: { page, per_page, total, ... }, success }
    return {
      list_id: json.data?.list_id || 1,
      page: json.meta?.page || page,
      per_page: json.meta?.per_page || perPage,
      total: json.meta?.total || 0,
      voters: json.data?.voters || [],
    };
  },

  /** Get single voter by ID - GET /api/voters/{voter_id} */
  getVoter: async (
    voterId: number | string,
    listId?: number
  ): Promise<Voter> => {
    // Use direct endpoint
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(
      `${API_BASE_URL}/api/voters/${voterId}${
        params.toString() ? `?${params}` : ""
      }`
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
      if (json.voter) return json.voter;
      return json;
    }

    // Fallback: search by ID
    const searchParams = new URLSearchParams({ q: String(voterId) });
    if (listId) searchParams.append("list_id", String(listId));
    const searchRes = await fetch(
      `${API_BASE_URL}/api/voters/search?${searchParams}`
    );
    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      const voters = searchJson.data?.voters || searchJson.voters || [];
      const voter = voters.find(
        (v: Voter) =>
          String(v.voter_id) === String(voterId) ||
          String(v.serial_no) === String(voterId)
      );
      if (voter) return voter;
    }

    throw new Error("Voter not found");
  },

  /** Search voters - GET /api/voters/search */
  searchVoters: async (
    query: string,
    listId?: number,
    filters?: {
      ward_no?: string;
      min_age?: number;
      max_age?: number;
      gender?: string;
      house_no?: string;
    }
  ): Promise<{
    list_id: number;
    query: string;
    total: number;
    voters: Voter[];
  }> => {
    const params = new URLSearchParams({ q: query });
    if (listId) params.append("list_id", String(listId));

    // Append filters if present
    if (filters) {
      if (filters.ward_no) params.append("ward_no", filters.ward_no);
      if (filters.min_age) params.append("min_age", String(filters.min_age));
      if (filters.max_age) params.append("max_age", String(filters.max_age));
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.house_no) params.append("house_no", filters.house_no);
    }

    const res = await fetch(`${API_BASE_URL}/api/voters/search?${params}`);
    if (!res.ok) throw new Error("Failed to search voters");
    const json = await res.json();
    // Handle nested response structure
    return {
      list_id: json.data?.list_id || json.list_id || 1,
      query: json.data?.query || json.query || query,
      total: json.meta?.total || json.total || json.data?.voters?.length || 0,
      voters: json.data?.voters || json.voters || [],
    };
  },

  /** Get voter profile - GET /api/voters/{voter_id}/profile */
  getVoterProfile: async (
    voterId: number,
    listId: number
  ): Promise<VoterProfile> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    const res = await fetch(
      `${API_BASE_URL}/api/voters/${voterId}/profile?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch voter profile");
    const json = await res.json();
    return json.data;
  },

  /** Update voter profile - POST /api/voters/{voter_id}/profile */
  updateVoterProfile: async (
    voterId: number,
    profile: VoterProfileUpdate
  ): Promise<VoterProfile> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/${voterId}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error("Failed to update voter profile");
    const json = await res.json();
    return json.data;
  },

  /** Bulk update voter profiles - POST /api/voters/profiles/bulk */
  bulkUpdateProfiles: async (
    listId: number,
    profiles: BulkProfileUpdate[]
  ): Promise<{
    updated_count: number;
    failed_count: number;
    results: Array<{ voter_id: number; success: boolean; error?: string }>;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/profiles/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: listId, profiles }),
    });
    if (!res.ok) throw new Error("Failed to bulk update profiles");
    const json = await res.json();
    return json.data;
  },

  /** Search voter profiles - POST /api/voters/profiles/search */
  searchVoterProfiles: async (
    filters: ProfileSearchFilters
  ): Promise<{
    voters: VoterProfile[];
    total: number;
    page: number;
    per_page: number;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/profiles/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    if (!res.ok) throw new Error("Failed to search voter profiles");
    const json = await res.json();
    return json.data;
  },

  /** Get sentiment-turnout matrix stats - GET /api/stats/sentiment-turnout */
  getSentimentTurnoutMatrix: async (
    listId: number
  ): Promise<SentimentTurnoutMatrix> => {
    const res = await fetch(
      `${API_BASE_URL}/api/stats/sentiment-turnout?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch sentiment-turnout matrix");
    const json = await res.json();
    return json.data || json;
  },

  /** Get D-Day priority list - GET /api/dday/priorities */
  getDDayPriorities: async (params: {
    list_id: number;
    limit?: number;
    priority_max?: number;
    ward_no?: string;
    booth_no?: number;
    sentiment?: "support" | "swing";
  }): Promise<DDayPriorityResponse> => {
    const queryParams = new URLSearchParams({
      list_id: String(params.list_id),
      limit: String(params.limit || 100),
      priority_max: String(params.priority_max || 10),
    });
    if (params.ward_no) queryParams.append("ward_no", params.ward_no);
    if (params.booth_no)
      queryParams.append("booth_no", String(params.booth_no));
    if (params.sentiment) queryParams.append("sentiment", params.sentiment);

    const res = await fetch(
      `${API_BASE_URL}/api/dday/priorities?${queryParams}`
    );
    if (!res.ok) throw new Error("Failed to fetch D-Day priorities");
    const json = await res.json();
    return json.data || json;
  },

  /** Get D-Day summary dashboard - GET /api/dday/summary */
  getDDaySummary: async (
    listId: number,
    options?: { ward_no?: string; booth_no?: number }
  ): Promise<DDaySummary> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.ward_no) params.append("ward_no", options.ward_no);
    if (options?.booth_no) params.append("booth_no", String(options.booth_no));

    const res = await fetch(`${API_BASE_URL}/api/dday/summary?${params}`);
    if (!res.ok) throw new Error("Failed to fetch D-Day summary");
    const json = await res.json();
    return json.data || json;
  },

  /** Get D-Day candidate vote counts - GET /api/dday/candidate-votes */
  getDDayCandidateVotes: async (
    listId: number,
    options?: { ward_no?: string; booth_no?: number }
  ): Promise<DDayCandidateVotes> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.ward_no) params.append("ward_no", options.ward_no);
    if (options?.booth_no) params.append("booth_no", String(options.booth_no));

    const res = await fetch(
      `${API_BASE_URL}/api/dday/candidate-votes?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch candidate votes");
    const json = await res.json();
    return json.data || json;
  },

  /** Filter voters - GET /api/voters/filter */
  filterVoters: async (filters: {
    ward_no?: string;
    min_age?: number;
    max_age?: number;
    gender?: string;
    house_no?: string;
    list_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<{
    list_id: number;
    total: number;
    filters: typeof filters;
    voters: Voter[];
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const res = await fetch(`${API_BASE_URL}/api/voters/filter?${params}`);
    if (!res.ok) throw new Error("Failed to filter voters");
    const json = await res.json();
    // Handle nested response structure
    return {
      list_id: json.data?.list_id || json.list_id || 1,
      total: json.meta?.total || json.total || json.data?.voters?.length || 0,
      filters: json.data?.filters || json.filters || filters,
      voters: json.data?.voters || json.voters || [],
    };
  },

  // --------------------------------------------------------------------------
  // Wards
  // --------------------------------------------------------------------------

  /** Get all wards - GET /api/wards */
  getWards: async (
    listId?: number
  ): Promise<{
    list_id: number;
    wards: Ward[];
  }> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/wards?${params}`);
    if (!res.ok) throw new Error("Failed to fetch wards");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Families
  // --------------------------------------------------------------------------

  /** Get all families (paginated) - GET /api/families */
  getFamilies: async (
    page = 1,
    perPage = 50,
    listId?: number
  ): Promise<{
    list_id: number;
    page: number;
    per_page: number;
    total: number;
    families: Family[];
  }> => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/families?${params}`);
    if (!res.ok) throw new Error("Failed to fetch families");
    const json = await res.json();
    // API returns { data: { list_id, families }, meta: { page, per_page, total, ... }, success }
    return {
      list_id: json.data?.list_id || 1,
      page: json.meta?.page || page,
      per_page: json.meta?.per_page || perPage,
      total: json.meta?.total || 0,
      families: json.data?.families || [],
    };
  },

  /**
   * Search family by ward and house number
   * Uses getFamilyMembers endpoint directly instead of loading all families
   */
  searchFamily: async (
    wardNo: string,
    houseNo: string,
    listId?: number
  ): Promise<Family | null> => {
    try {
      // Use the direct endpoint that accepts ward_no and house_no
      const data = await api.getFamilyMembers(wardNo, houseNo, listId);
      if (data && data.member_count > 0) {
        return {
          ward_no: data.ward_no,
          house_no: data.house_no,
          member_count: data.member_count,
          mukhiya_name: data.mukhiya?.name,
          mukhiya_age: data.mukhiya?.age,
          mukhiya_gender: data.mukhiya?.gender,
          members: data.members,
        };
      }
      return null;
    } catch (error) {
      console.warn(
        `Family not found for ward ${wardNo}, house ${houseNo}:`,
        error
      );
      return null;
    }
  },

  /** Get family members - GET /api/families/members */
  getFamilyMembers: async (
    wardNo: string,
    houseNo: string,
    listId?: number
  ): Promise<{
    list_id: number;
    ward_no: string;
    house_no: string;
    member_count: number;
    mukhiya?: {
      name: string;
      age: number;
      gender: string;
      relative_name?: string;
      serial_no?: string;
      voter_id?: number;
    };
    members: Voter[];
  }> => {
    const params = new URLSearchParams({
      ward_no: wardNo,
      house_no: houseNo,
    });
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/families/members?${params}`);
    if (!res.ok) throw new Error("Failed to fetch family members");
    const json = await res.json();
    // Handle nested response structure
    return {
      list_id: json.data?.list_id || listId || 1,
      ward_no: json.data?.ward_no || wardNo,
      house_no: json.data?.house_no || houseNo,
      member_count: json.data?.member_count || 0,
      mukhiya: json.data?.mukhiya,
      members: json.data?.members || [],
    };
  },

  /** Get family tree with relationships - GET /api/families/tree */
  getFamilyTree: async (
    wardNo: string,
    houseNo: string,
    listId?: number
  ): Promise<{
    success: boolean;
    data: {
      head: {
        voter_id: number;
        name: string;
        age: number;
        gender: string;
      };
      relationships: Array<{
        voter_id: number;
        name: string;
        age: number;
        gender: string;
        relationship_type: string;
        relationship_to_head: string;
        confidence: number;
      }>;
      ward_no: string;
      house_no: string;
      member_count: number;
      list_id: number;
      source: string;
    } | null;
  }> => {
    const params = new URLSearchParams({
      ward_no: wardNo,
      house_no: houseNo,
    });
    if (listId) params.append("list_id", String(listId));

    try {
      const res = await fetch(`${API_BASE_URL}/api/families/tree?${params}`);
      if (!res.ok) {
        return { success: false, data: null };
      }
      const json = await res.json();
      return {
        success: json.success || false,
        data: json.data || null,
      };
    } catch (error) {
      console.error("Failed to fetch family tree:", error);
      return { success: false, data: null };
    }
  },

  /** Build family trees - POST /api/families/tree/build (deprecated, use triggerFamilyTreeGeneration) */
  buildFamilyTrees: async (
    listId: number,
    verifyWithGemini: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    data?: { job_id: string; status: string };
  }> => {
    // Redirect to new trigger endpoint
    return api.triggerFamilyTreeGeneration({ listId, verifyWithGemini });
  },

  /** Trigger family tree generation - POST /api/families/tree/trigger */
  triggerFamilyTreeGeneration: async (options: {
    listId: number;
    verifyWithGemini?: boolean;
    wardNo?: string;
    forceRebuild?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data?: { job_id: string; status: string };
    error?: string;
  }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/families/tree/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list_id: options.listId,
          verify_with_gemini: options.verifyWithGemini || false,
          ward_no: options.wardNo,
          force_rebuild: options.forceRebuild || false,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: json.error || "Failed to trigger tree generation",
          error: json.error,
        };
      }
      return {
        success: json.success || false,
        message:
          json.data?.message || json.message || "Tree generation started",
        data: json.data,
      };
    } catch (error) {
      return { success: false, message: "Failed to connect to server" };
    }
  },

  /** Get family tree build job status - GET /api/families/tree/status/{job_id} */
  getFamilyTreeJobStatus: async (
    jobId: string
  ): Promise<{
    success: boolean;
    data: {
      status: string;
      progress: number;
      total_families: number;
      processed: number;
      errors: string[];
    } | null;
  }> => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/families/tree/status/${jobId}`
      );
      if (!res.ok) {
        return { success: false, data: null };
      }
      const json = await res.json();
      return {
        success: json.success || false,
        data: json.data || null,
      };
    } catch (error) {
      return { success: false, data: null };
    }
  },

  /** Verify family with Gemini AI - POST /api/families/tree/verify */
  verifyFamilyWithGemini: async (
    wardNo: string,
    houseNo: string,
    listId?: number
  ): Promise<{ success: boolean; data: unknown }> => {
    try {
      const body: Record<string, unknown> = {
        ward_no: wardNo,
        house_no: houseNo,
      };
      if (listId) body.list_id = listId;

      const res = await fetch(`${API_BASE_URL}/api/families/tree/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return { success: false, data: null };
      }
      const json = await res.json();
      return {
        success: json.success || false,
        data: json.data || null,
      };
    } catch (error) {
      return { success: false, data: null };
    }
  },

  /** Get family tree stats - GET /api/families/tree/stats */
  getFamilyTreeStats: async (
    listId?: number
  ): Promise<{
    success: boolean;
    data: {
      total_families: number;
      families_with_trees: number;
      pending_families: number;
    } | null;
  }> => {
    try {
      const params = new URLSearchParams();
      if (listId) params.append("list_id", String(listId));
      const res = await fetch(
        `${API_BASE_URL}/api/families/tree/stats?${params}`
      );
      if (!res.ok) {
        return { success: false, data: null };
      }
      const json = await res.json();
      return {
        success: json.success || false,
        data: json.data || null,
      };
    } catch (error) {
      return { success: false, data: null };
    }
  },

  /** Clear family trees - DELETE /api/families/tree/clear */
  clearFamilyTrees: async (
    listId?: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const params = new URLSearchParams();
      if (listId) params.append("list_id", String(listId));
      const res = await fetch(
        `${API_BASE_URL}/api/families/tree/clear?${params}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        return { success: false, message: "Failed to clear family trees" };
      }
      const json = await res.json();
      return {
        success: json.success || false,
        message: json.message || "Family trees cleared",
      };
    } catch (error) {
      return { success: false, message: "Failed to connect to server" };
    }
  },

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  /** Get overall statistics - combines /api/stats, /api/stats/gender, /api/stats/age-distribution */
  getStats: async (listId?: number): Promise<Stats> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));

    // Fetch all stats endpoints in parallel
    const [statsRes, genderRes, ageRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/stats?${params}`),
      fetch(`${API_BASE_URL}/api/stats/gender?${params}`),
      fetch(`${API_BASE_URL}/api/stats/age-distribution?${params}`),
    ]);

    if (!statsRes.ok) throw new Error("Failed to fetch stats");

    const statsData: StatsApiResponse = await statsRes.json();
    const genderData: GenderDistribution = genderRes.ok
      ? await genderRes.json()
      : {
          male_count: 0,
          female_count: 0,
          male_percentage: 0,
          female_percentage: 0,
          total: 0,
          list_id: 0,
          other_count: 0,
        };
    const ageData: AgeDistribution = ageRes.ok
      ? await ageRes.json()
      : { list_id: 0, age_groups: {}, average_age: 0, total_voters: 0 };

    return {
      list_id: genderData.list_id || 1,
      total_voters: statsData.metadata.total_voters,
      male_count: genderData.male_count,
      female_count: genderData.female_count,
      male_percentage: genderData.male_percentage,
      female_percentage: genderData.female_percentage,
      total_wards: statsData.metadata.total_wards,
      average_age: ageData.average_age,
      sentiment_counts: statsData.metadata.sentiment_counts,
    };
  },

  /** Get raw stats API response - GET /api/stats */
  getStatsRaw: async (listId?: number): Promise<StatsApiResponse> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/stats?${params}`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  /** Get ward statistics - GET /api/stats/wards */
  getWardStats: async (
    listId?: number
  ): Promise<{ list_id: number; wards: WardStats[] }> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/stats/wards?${params}`);
    if (!res.ok) throw new Error("Failed to fetch ward stats");
    return res.json();
  },

  /** Get gender distribution - GET /api/stats/gender */
  getGenderStats: async (listId?: number): Promise<GenderDistribution> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/stats/gender?${params}`);
    if (!res.ok) throw new Error("Failed to fetch gender stats");
    return res.json();
  },

  /** Get age distribution - GET /api/stats/age-distribution */
  getAgeDistribution: async (listId?: number): Promise<AgeDistribution> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(
      `${API_BASE_URL}/api/stats/age-distribution?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch age distribution");
    return res.json();
  },

  /** Get gender distribution - GET /api/stats/gender */
  getGenderDistribution: async (
    listId?: number
  ): Promise<GenderDistribution> => {
    const params = new URLSearchParams();
    if (listId) params.append("list_id", String(listId));
    const res = await fetch(`${API_BASE_URL}/api/stats/gender?${params}`);
    if (!res.ok) throw new Error("Failed to fetch gender distribution");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Upload & Extraction
  // --------------------------------------------------------------------------

  /** Upload PDF for extraction - POST /api/upload/pdf */
  uploadPDF: async (
    file: File,
    options?: {
      election_name?: string;
      election_date?: string;
      max_workers?: number;
    }
  ): Promise<{
    job_id: string;
    status: string;
    message: string;
    pdf_filename: string;
    election_name?: string;
    election_date?: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.election_name)
      formData.append("election_name", options.election_name);
    if (options?.election_date)
      formData.append("election_date", options.election_date);
    if (options?.max_workers)
      formData.append("max_workers", String(options.max_workers));

    const res = await fetch(`${API_BASE_URL}/api/upload/pdf`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload PDF");
    return res.json();
  },

  /** Upload JSON voter data - POST /api/upload/json */
  uploadJSON: async (
    file: File
  ): Promise<{
    message: string;
    list_id: number;
    filename: string;
    total_voters: number;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/upload/json`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload JSON");
    return res.json();
  },

  /** Check extraction status - GET /api/extract-status/{job_id} */
  getExtractionStatus: async (jobId: string): Promise<ExtractionStatus> => {
    const res = await fetch(`${API_BASE_URL}/api/extract-status/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch extraction status");
    return res.json();
  },

  /** Get active upload/extraction jobs - GET /api/upload/active-jobs */
  getActiveJobs: async (): Promise<ActiveJobsResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/upload/active-jobs`);
    if (!res.ok) throw new Error("Failed to fetch active jobs");
    const data = await res.json();
    // Backend returns { success, data: { active_jobs, has_active, count }}
    return data.data || { has_active: false, active_jobs: [], count: 0 };
  },

  /** Get recent upload/extraction jobs - GET /api/upload/recent-jobs */
  getRecentJobs: async (
    hours: number = 24,
    limit: number = 20
  ): Promise<RecentJobsResponse> => {
    const res = await fetch(
      `${API_BASE_URL}/api/upload/recent-jobs?hours=${hours}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch recent jobs");
    const data = await res.json();
    // Backend returns { success, data: { jobs, count, hours_back }}
    return data.data || { jobs: [], count: 0 };
  },

  /** Download extracted JSON - GET /api/download/{filename} */
  downloadExtractedFile: async (filename: string): Promise<Blob> => {
    const res = await fetch(`${API_BASE_URL}/api/download/${filename}`);
    if (!res.ok) throw new Error("File not found");
    return res.blob();
  },

  // --------------------------------------------------------------------------
  // Comparison
  // --------------------------------------------------------------------------

  /** Start async comparison - POST /api/compare-lists */
  compareVoterLists: async (
    oldListId: number,
    newListId: number,
    options?: { name_threshold?: number; relative_threshold?: number }
  ): Promise<ComparisonJob> => {
    const res = await fetch(`${API_BASE_URL}/api/compare-lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_list_id: oldListId,
        new_list_id: newListId,
        name_threshold: options?.name_threshold ?? 85,
        relative_threshold: options?.relative_threshold ?? 80,
      }),
    });
    if (!res.ok) throw new Error("Failed to start comparison");
    return res.json();
  },

  /** Check comparison status - GET /api/compare-status/{job_id} */
  getComparisonStatus: async (jobId: string): Promise<ComparisonJob> => {
    const res = await fetch(`${API_BASE_URL}/api/compare-status/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch comparison status");
    return res.json();
  },

  /** Sync comparison for small lists - POST /api/compare-sync */
  compareVoterListsSync: async (
    oldListId: number,
    newListId: number,
    options?: { name_threshold?: number; relative_threshold?: number }
  ): Promise<ComparisonResult> => {
    const res = await fetch(`${API_BASE_URL}/api/compare-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_list_id: oldListId,
        new_list_id: newListId,
        name_threshold: options?.name_threshold ?? 85,
        relative_threshold: options?.relative_threshold ?? 80,
      }),
    });
    if (!res.ok) throw new Error("Failed to compare lists");
    return res.json();
  },

  /** List all saved comparisons - GET /api/comparisons */
  getSavedComparisons: async (params?: {
    list_id?: number;
    status?: "pending" | "processing" | "completed" | "error";
    limit?: number;
  }): Promise<SavedComparisonsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.list_id) queryParams.append("list_id", String(params.list_id));
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/comparisons?${queryString}`
      : `${API_BASE_URL}/api/comparisons`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch saved comparisons");
    return res.json();
  },

  /** Get saved comparison report - GET /api/comparisons/{job_id} */
  getSavedComparison: async (jobId: string): Promise<SavedComparisonReport> => {
    const res = await fetch(`${API_BASE_URL}/api/comparisons/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch comparison report");
    return res.json();
  },

  /** Delete saved comparison - DELETE /api/comparisons/{job_id} */
  deleteSavedComparison: async (
    jobId: string
  ): Promise<DeleteComparisonResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/comparisons/${jobId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete comparison");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Elections
  // --------------------------------------------------------------------------

  /** Create election - POST /api/elections */
  createElection: async (data: {
    list_id: number;
    election_name: string;
    election_date: string;
    election_type?: "panchayat" | "municipal" | "state" | "lok_sabha";
    description?: string;
    status?: "active" | "completed" | "archived";
  }): Promise<ApiResponse<Election>> => {
    const res = await fetch(`${API_BASE_URL}/api/elections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create election");
    return res.json();
  },

  /** Get all elections - GET /api/elections */
  getElections: async (filters?: {
    status?: "active" | "completed" | "archived";
    election_type?: "panchayat" | "municipal" | "state" | "lok_sabha";
    year?: number;
  }): Promise<{
    success: boolean;
    data: Election[];
    meta: { total: number };
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const res = await fetch(`${API_BASE_URL}/api/elections?${params}`);
    if (!res.ok) throw new Error("Failed to fetch elections");
    return res.json();
  },

  /** Get single election - GET /api/elections/{election_id} */
  getElection: async (electionId: number): Promise<ApiResponse<Election>> => {
    const res = await fetch(`${API_BASE_URL}/api/elections/${electionId}`);
    if (!res.ok) throw new Error("Failed to fetch election");
    return res.json();
  },

  /** Update election - PUT /api/elections/{election_id} */
  updateElection: async (
    electionId: number,
    data: Partial<Omit<Election, "election_id" | "list_id">>
  ): Promise<ApiResponse<Election>> => {
    const res = await fetch(`${API_BASE_URL}/api/elections/${electionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update election");
    return res.json();
  },

  /** Delete/Archive election - DELETE /api/elections/{election_id} */
  deleteElection: async (
    electionId: number,
    hardDelete = false
  ): Promise<{
    success: boolean;
    message: string;
    election_id: number;
  }> => {
    const params = new URLSearchParams();
    if (hardDelete) params.append("hard_delete", "true");
    const res = await fetch(
      `${API_BASE_URL}/api/elections/${electionId}?${params}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to delete election");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Candidates
  // --------------------------------------------------------------------------

  /** Add candidate - POST /api/candidates */
  createCandidate: async (data: {
    list_id: number;
    voter_id?: number;
    name?: string;
    relative_name?: string;
    age?: number;
    gender?: "Male" | "Female";
    house_no?: string;
    ward_no?: string;
    party_name?: string;
    party_symbol?: string;
    contact_number?: string;
    education?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    candidate_id: number;
    candidate: Candidate;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create candidate");
    return res.json();
  },

  /** Get all candidates - GET /api/candidates */
  getCandidates: async (filters?: {
    list_id?: number;
    status?: "active" | "withdrawn" | "disqualified";
    ward_no?: string;
  }): Promise<{
    list_id?: number;
    total: number;
    candidates: Candidate[];
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const res = await fetch(`${API_BASE_URL}/api/candidates?${params}`);
    if (!res.ok) throw new Error("Failed to fetch candidates");
    const json = await res.json();
    // API returns { data: { candidates, list_id }, meta: { total }, success }
    return {
      candidates: json.data?.candidates || [],
      list_id: json.data?.list_id,
      total: json.meta?.total || 0,
    };
  },

  /** Get single candidate - GET /api/candidates/{candidate_id} */
  getCandidate: async (candidateId: number): Promise<Candidate> => {
    const res = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}`);
    if (!res.ok) throw new Error("Failed to fetch candidate");
    return res.json();
  },

  /** Update candidate - PUT /api/candidates/{candidate_id} */
  updateCandidate: async (
    candidateId: number,
    data: Partial<
      Pick<
        Candidate,
        | "party_name"
        | "party_symbol"
        | "contact_number"
        | "education"
        | "status"
        | "notes"
      >
    >
  ): Promise<{
    success: boolean;
    message: string;
    candidate: Candidate;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update candidate");
    return res.json();
  },

  /** Delete candidate - DELETE /api/candidates/{candidate_id} */
  deleteCandidate: async (
    candidateId: number
  ): Promise<{
    success: boolean;
    message: string;
    candidate_id: number;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete candidate");
    return res.json();
  },

  /** Set candidate as primary (our candidate) - POST /api/candidates/{candidate_id}/set-primary */
  setOurCandidate: async (
    candidateId: number,
    listId: number
  ): Promise<{
    success: boolean;
    message: string;
    candidate: Candidate;
  }> => {
    const res = await fetch(
      `${API_BASE_URL}/api/candidates/${candidateId}/set-primary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId }),
      }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          "Failed to set primary candidate"
      );
    }
    return res.json();
  },

  /** Get our candidate - GET /api/candidates/our */
  getOurCandidate: async (listId: number): Promise<Candidate | null> => {
    const res = await fetch(
      `${API_BASE_URL}/api/candidates/our?list_id=${listId}`
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch our candidate");
    const json = await res.json();
    return json.data || json.candidate || null;
  },

  // --------------------------------------------------------------------------
  // Projections Endpoints
  // --------------------------------------------------------------------------

  /** Get projections overview - GET /api/projections */
  getProjections: async (
    listId: number,
    options?: { include_ward_breakdown?: boolean }
  ): Promise<ProjectionsResponse> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.include_ward_breakdown) {
      params.append("include_ward_breakdown", "true");
    }
    const res = await fetch(`${API_BASE_URL}/api/projections?${params}`);
    if (!res.ok) throw new Error("Failed to fetch projections");
    const json = await res.json();

    // Handle API response format mismatch (API returns 'candidates', frontend expects 'projections')
    const data = json.data || json;
    if (data.candidates && !data.projections) {
      // Transform candidates to match frontend interface
      const candidates = data.candidates.map((c: any) => ({
        ...c,
        // Map flat sentiment counts to nested structure if needed
        sentiment_counts: c.sentiment_counts || {
          support: c.support_count || 0,
          oppose: c.oppose_count || 0,
          swing: c.swing_count || 0,
          neutral: c.neutral_count || 0,
          unknown: c.unknown_count || 0,
        },
      }));

      // Calculate projected_turnout as sum of all projected_votes
      const projected_turnout = candidates.reduce(
        (sum: number, c: any) => sum + (c.projected_votes || 0),
        0
      );

      // Find our candidate and leader
      const our_candidate = candidates.find((c: any) => c.is_our_candidate);
      const leader = [...candidates].sort(
        (a: any, b: any) => b.projected_votes - a.projected_votes
      )[0];

      // Calculate margin
      const margin =
        our_candidate && leader
          ? our_candidate.projected_votes - leader.projected_votes
          : undefined;

      return {
        ...data,
        projections: candidates,
        projected_turnout,
        our_candidate,
        leader,
        margin,
      };
    }

    return data;
  },

  /** Compare projections between candidates - GET /api/projections/compare */
  getProjectionsCompare: async (
    listId: number,
    candidateIds: number[]
  ): Promise<{
    candidates: CandidateProjection[];
    comparison: {
      leader: CandidateProjection;
      margin: number;
      swing_potential: number;
    };
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (candidateIds.length >= 1)
      params.append("candidate_a", String(candidateIds[0]));
    if (candidateIds.length >= 2)
      params.append("candidate_b", String(candidateIds[1]));

    const res = await fetch(
      `${API_BASE_URL}/api/projections/compare?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch projections comparison");
    const json = await res.json();
    return json.data || json;
  },

  /** Get ward-level projection - GET /api/projections/ward/{ward_no} */
  getWardProjection: async (
    listId: number,
    wardNo: string
  ): Promise<WardProjection> => {
    const res = await fetch(
      `${API_BASE_URL}/api/projections/ward/${wardNo}?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch ward projection");
    const json = await res.json();
    return json.data || json;
  },

  // --------------------------------------------------------------------------
  // Sentiment Endpoints (War Room)
  // --------------------------------------------------------------------------

  /** Tag voter sentiment - POST /api/voters/{voter_id}/tag */
  tagVoterSentiment: async (
    voterId: number,
    data: {
      sentiment: TaggableSentiment; // Only support, oppose, swing, neutral (NOT unknown)
      list_id: number; // Required: which voter list
      confidence?: number; // 1-5 scale (optional)
      source?: string; // e.g., 'field_survey', 'rally_attendance', 'manual'
      notes?: string;
      candidate_id?: number; // Optional: defaults to 0 (your candidate)
    }
  ): Promise<{
    success: boolean;
    message: string;
    voter_id: number;
    sentiment: SentimentType;
    propagated_to?: number[];
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/${voterId}/tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to tag voter sentiment");
    return res.json();
  },

  /** Remove voter sentiment tag - DELETE /api/voters/{voter_id}/tag */
  removeVoterSentiment: async (
    voterId: number,
    userId?: number
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const url = userId
      ? `${API_BASE_URL}/api/voters/${voterId}/tag?user_id=${userId}`
      : `${API_BASE_URL}/api/voters/${voterId}/tag`;
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove voter sentiment");
    return res.json();
  },

  /** Get voter sentiment - GET /api/voters/{voter_id}/sentiment */
  getVoterSentiment: async (
    voterId: number,
    listId: number
  ): Promise<VoterSentiment> => {
    const res = await fetch(
      `${API_BASE_URL}/api/voters/${voterId}/sentiment?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch voter sentiment");
    return res.json();
  },

  /** Get family sentiments - GET /api/families/{ward_no}/{house_no}/sentiments */
  getFamilySentiments: async (
    wardNo: string,
    houseNo: string,
    listId: number
  ): Promise<FamilySentiment> => {
    const res = await fetch(
      `${API_BASE_URL}/api/families/${wardNo}/${houseNo}/sentiments?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch family sentiments");
    return res.json();
  },

  /** Bulk tag multiple voters - POST /api/voters/bulk-tag */
  bulkTagVoters: async (data: {
    voter_ids: number[];
    sentiment: TaggableSentiment; // Only support, oppose, swing, neutral (NOT unknown)
    list_id: number; // Required: which voter list
    source?: string; // e.g., 'rally_attendance', 'field_survey', 'manual'
    propagate_family?: boolean;
    candidate_id?: number; // Optional: defaults to 0 (your candidate)
  }): Promise<{
    success: boolean;
    message: string;
    tagged_count: number;
    propagated_count?: number;
    failed_ids?: number[];
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/voters/bulk-tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to bulk tag voters");
    return res.json();
  },

  /** Compute all sentiments - POST /api/sentiment/compute */
  computeSentiments: async (data?: {
    list_id?: number;
  }): Promise<{
    success: boolean;
    message: string;
    computed_count: number;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/sentiment/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error("Failed to compute sentiments");
    return res.json();
  },

  // --------------------------------------------------------------------------
  // Map Endpoints (War Room)
  // --------------------------------------------------------------------------

  /** Generate geo coordinates - POST /api/map/generate-coords */
  generateMapCoordinates: async (data: {
    list_id: number;
    center_lat?: number;
    center_lng?: number;
  }): Promise<{
    success: boolean;
    message: string;
    wards_generated: number;
    houses_generated: number;
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/map/generate-coords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate map coordinates");
    return res.json();
  },

  /** Get ward summary for heatmap - GET /api/map/wards */
  getMapWards: async (
    listId: number
  ): Promise<{
    list_id: number;
    total_wards: number;
    overview: {
      support: number;
      oppose: number;
      neutral: number;
      battleground: number;
    };
    wards: WardMapSummary[];
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/map/wards?list_id=${listId}`);
    if (!res.ok) throw new Error("Failed to fetch map wards");
    const json = await res.json();
    return json.data; // Unwrap nested {data: {...}, success: true}
  },

  /** Get house positions for a ward - GET /api/map/ward/{ward_no}/houses */
  getWardHouses: async (
    wardNo: string,
    listId: number
  ): Promise<{
    ward_no: string;
    houses: HousePosition[];
  }> => {
    const res = await fetch(
      `${API_BASE_URL}/api/map/ward/${wardNo}/houses?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch ward houses");
    const json = await res.json();
    return json.data; // Unwrap nested {data: {...}, success: true}
  },

  // --------------------------------------------------------------------------
  // Statistics Endpoints (War Room)
  // --------------------------------------------------------------------------

  /** Get sentiment overview - GET /api/stats/overview */
  getSentimentOverview: async (listId: number): Promise<SentimentOverview> => {
    const res = await fetch(
      `${API_BASE_URL}/api/stats/overview?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch sentiment overview");
    const json = await res.json();
    return json.data; // Unwrap nested {data: {...}, success: true}
  },

  /** Get target voters for canvassing - GET /api/stats/targets */
  getTargetVoters: async (
    listId: number,
    options?: {
      ward_no?: string;
      limit?: number;
    }
  ): Promise<{
    list_id: number;
    filter: {
      limit: number;
      sentiment: string;
      ward_no: string | null;
    };
    targets: TargetVoter[];
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.ward_no) params.append("ward_no", options.ward_no);
    if (options?.limit) params.append("limit", String(options.limit));
    const res = await fetch(`${API_BASE_URL}/api/stats/targets?${params}`);
    if (!res.ok) throw new Error("Failed to fetch target voters");
    const json = await res.json();
    return json.data; // Unwrap nested {data: {...}, success: true}
  },

  // --------------------------------------------------------------------------
  // History Endpoints (War Room)
  // --------------------------------------------------------------------------

  /** Get voter sentiment history - GET /api/history/voter/{voter_id} */
  getVoterSentimentHistory: async (
    voterId: number,
    listId: number
  ): Promise<SentimentHistory> => {
    const res = await fetch(
      `${API_BASE_URL}/api/history/voter/${voterId}?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch voter sentiment history");
    return res.json();
  },

  // ==========================================================================
  // Election Symbols API
  // ==========================================================================

  /** Get all election symbols - GET /api/symbols */
  getSymbols: async (
    lang?: "hi" | "en"
  ): Promise<{
    total: number;
    symbols: ElectionSymbol[];
  }> => {
    const params = lang ? `?lang=${lang}` : "";
    const res = await fetch(`${API_BASE_URL}/api/symbols${params}`);
    if (!res.ok) throw new Error("Failed to fetch symbols");
    const json = await res.json();
    return {
      total: json.data?.symbols?.length || 0,
      symbols: json.data?.symbols || [],
    };
  },

  /** Get single symbol by ID - GET /api/symbols/{id} */
  getSymbol: async (id: number): Promise<ElectionSymbol> => {
    const res = await fetch(`${API_BASE_URL}/api/symbols/${id}`);
    if (!res.ok) throw new Error("Failed to fetch symbol");
    const json = await res.json();
    return json.data;
  },

  /** Search symbols - GET /api/symbols/search?q={query} */
  searchSymbols: async (
    query: string
  ): Promise<{
    query: string;
    total: number;
    symbols: ElectionSymbol[];
  }> => {
    const res = await fetch(
      `${API_BASE_URL}/api/symbols/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to search symbols");
    const json = await res.json();
    return {
      query: json.query || query,
      total: json.data?.symbols?.length || 0,
      symbols: json.data?.symbols || [],
    };
  },

  // ==========================================================================
  // Polling Stations & Booths API
  // ==========================================================================

  /** Get all polling stations - GET /api/polling-stations */
  getPollingStations: async (
    listId: number
  ): Promise<{
    total: number;
    stations: PollingStation[];
  }> => {
    const res = await fetch(
      `${API_BASE_URL}/api/polling-stations?list_id=${listId}`
    );
    if (!res.ok) throw new Error("Failed to fetch polling stations");
    const json = await res.json();
    return {
      total: json.data?.polling_stations?.length || json.meta?.total || 0,
      stations: json.data?.polling_stations || [],
    };
  },

  /** Get single polling station with booths - GET /api/polling-stations/{id} */
  getPollingStation: async (
    stationId: number | string,
    listId: number,
    options?: {
      include_voters?: boolean;
      page?: number;
      per_page?: number;
    }
  ): Promise<{
    station: PollingStation;
    voters?: Voter[];
    meta?: { page: number; per_page: number; total: number };
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.include_voters) params.append("include_voters", "true");
    if (options?.page) params.append("page", String(options.page));
    if (options?.per_page) params.append("per_page", String(options.per_page));
    const res = await fetch(
      `${API_BASE_URL}/api/polling-stations/${stationId}?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch polling station");
    const json = await res.json();
    return {
      station: json.data,
      voters: json.data?.voters,
      meta: json.meta,
    };
  },

  /** Get all polling booths - GET /api/polling-booths */
  getPollingBooths: async (
    listId: number,
    stationId?: number | string,
    options?: {
      ward_no?: string;
      include_stats?: boolean;
    }
  ): Promise<{
    total: number;
    booths: PollingBooth[];
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (stationId) params.append("station_id", String(stationId));
    if (options?.ward_no) params.append("ward_no", options.ward_no);
    if (options?.include_stats) params.append("include_stats", "true");
    const res = await fetch(`${API_BASE_URL}/api/polling-booths?${params}`);
    if (!res.ok) throw new Error("Failed to fetch polling booths");
    const json = await res.json();
    return {
      total: json.data?.polling_booths?.length || json.meta?.total || 0,
      booths: json.data?.polling_booths || [],
    };
  },

  /** Get single polling booth - GET /api/polling-booths/{id} */
  getPollingBooth: async (
    boothId: number | string,
    listId: number,
    options?: {
      include_voters?: boolean;
      page?: number;
      per_page?: number;
    }
  ): Promise<{
    booth: PollingBooth;
    voters?: Voter[];
    meta?: { page: number; per_page: number; total: number };
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.include_voters) params.append("include_voters", "true");
    if (options?.page) params.append("page", String(options.page));
    if (options?.per_page) params.append("per_page", String(options.per_page));
    const res = await fetch(
      `${API_BASE_URL}/api/polling-booths/${boothId}?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch polling booth");
    const json = await res.json();
    const pagination = json.data?.pagination;
    return {
      booth: json.data,
      voters: json.data?.voters,
      meta: pagination
        ? {
            page: pagination.page,
            per_page: pagination.per_page,
            total: pagination.total,
          }
        : json.meta,
    };
  },

  /** Booth-level campaign stats - GET /api/polling-booths/stats */
  getPollingBoothStats: async (
    listId: number,
    options?: { ward_no?: string }
  ): Promise<{
    summary: PollingBoothStatsSummary;
    booths: PollingBoothStatsRow[];
  }> => {
    const params = new URLSearchParams({ list_id: String(listId) });
    if (options?.ward_no) params.append("ward_no", options.ward_no);
    const res = await fetch(
      `${API_BASE_URL}/api/polling-booths/stats?${params}`
    );
    if (!res.ok) throw new Error("Failed to fetch polling booth stats");
    const json = await res.json();
    return {
      summary: json.data?.summary,
      booths: json.data?.booths || [],
    };
  },

  // ==========================================================================
  // Turnout APIs
  // ==========================================================================

  /** Mark single voter turnout - POST /api/turnout/mark */
  markTurnout: async (
    request: TurnoutMarkRequest
  ): Promise<{
    success: boolean;
    data: {
      turnout_status: TurnoutStatus;
      turnout_note?: string;
      turnout_marked_at: string;
      turnout_marked_by?: number;
    };
  }> => {
    const res = await fetch(`${API_BASE_URL}/api/turnout/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Failed to mark turnout");
    }
    return res.json();
  },

  /** Bulk mark voter turnout - POST /api/turnout/bulk-mark */
  bulkMarkTurnout: async (
    request: BulkTurnoutMarkRequest
  ): Promise<BulkTurnoutMarkResponse> => {
    // Validate request
    if (!request.marks && !request.voter_ids) {
      throw new Error("Either 'marks' or 'voter_ids' must be provided");
    }
    if (request.marks && request.marks.length > 1000) {
      throw new Error("Maximum 1000 marks per request");
    }
    if (request.voter_ids && request.voter_ids.length > 1000) {
      throw new Error("Maximum 1000 voter_ids per request");
    }

    const res = await fetch(`${API_BASE_URL}/api/turnout/bulk-mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Failed to bulk mark turnout");
    }
    return res.json();
  },
};

// ============================================================================
// Utility: Check if API is available
// ============================================================================

export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await api.healthCheck();
    return true;
  } catch {
    return false;
  }
};
