/**
 * API Client Configuration
 *
 * Centralized fetch wrapper with error handling, base URL configuration,
 * and TypeScript support.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

// =============================================================================
// ERROR TYPES
// =============================================================================

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// =============================================================================
// FETCH WRAPPER
// =============================================================================

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Generic API fetch wrapper with error handling and TypeScript support
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Default headers
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add Content-Type for JSON bodies
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        `API Error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error",
      0
    );
  }
}

// =============================================================================
// MUTATION HELPERS
// =============================================================================

/**
 * POST request helper
 */
export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    params,
  });
}

/**
 * PUT request helper
 */
export function apiPut<T>(
  endpoint: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    params,
  });
}

/**
 * DELETE request helper
 */
export function apiDelete<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
    params,
  });
}

/**
 * File upload helper (multipart/form-data)
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      `Upload Error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// =============================================================================
// SHARED TYPES
// =============================================================================

export type SentimentType =
  | "support"
  | "oppose"
  | "swing"
  | "neutral"
  | "unknown";

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

export type CasteCategory = "General" | "OBC" | "SC" | "ST" | "Minority";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
