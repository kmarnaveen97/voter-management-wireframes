/**
 * Campaign Users API Module
 *
 * Endpoints for managing campaign team users.
 */

import { apiFetch, apiPost } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface CampaignUser {
  id: number;
  username: string;
  display_name?: string;
  role?: string;
  created_at: string;
  last_active?: string;
  stats?: {
    voters_tagged: number;
    turnout_marked: number;
  };
}

export interface UsersResponse {
  success: boolean;
  users: CampaignUser[];
  total: number;
}

export interface CreateUserResponse {
  success: boolean;
  user: CampaignUser;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all campaign team users
 */
export async function getUsers(): Promise<UsersResponse> {
  return apiFetch<UsersResponse>("/api/users");
}

/**
 * Create a new campaign team user
 */
export async function createUser(
  username: string,
  displayName?: string,
  role?: string
): Promise<CreateUserResponse> {
  return apiPost<CreateUserResponse>("/api/users", {
    username,
    display_name: displayName,
    role,
  });
}
