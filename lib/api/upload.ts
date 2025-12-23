/**
 * Upload & Extraction API Module
 *
 * Endpoints for PDF/JSON upload and extraction job monitoring.
 */

import { apiFetch, apiUpload, API_BASE_URL } from "./client";

// =============================================================================
// TYPES
// =============================================================================

export interface ExtractionJob {
  job_id: string;
  status: "queued" | "processing" | "completed" | "error";
  progress: number;
  current_page?: number;
  total_pages?: number;
  voters_extracted?: number;
  message?: string;
  list_id?: number;
  error?: string;
  created_at: string;
  updated_at?: string;
}

export interface UploadResponse {
  success: boolean;
  job_id: string;
  message: string;
}

export interface JSONUploadResponse {
  success: boolean;
  message: string;
  list_id: number;
  voters_imported: number;
}

export interface ExtractionStatusResponse {
  job_id: string;
  status: ExtractionJob["status"];
  progress: number;
  current_page?: number;
  total_pages?: number;
  voters_extracted?: number;
  message?: string;
  list_id?: number;
  error?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Upload PDF for extraction using Gemini AI
 */
export async function uploadPDF(
  file: File,
  options?: {
    election_name?: string;
    election_date?: string;
    max_workers?: number;
  }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.election_name) {
    formData.append("election_name", options.election_name);
  }
  if (options?.election_date) {
    formData.append("election_date", options.election_date);
  }
  if (options?.max_workers) {
    formData.append("max_workers", String(options.max_workers));
  }

  return apiUpload<UploadResponse>("/api/upload/pdf", formData);
}

/**
 * Upload JSON voter data file
 */
export async function uploadJSON(file: File): Promise<JSONUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiUpload<JSONUploadResponse>("/api/upload/json", formData);
}

/**
 * Check extraction job status
 */
export async function getExtractionStatus(
  jobId: string
): Promise<ExtractionStatusResponse> {
  return apiFetch<ExtractionStatusResponse>(`/api/extract-status/${jobId}`);
}

/**
 * Get download URL for extracted JSON
 */
export function getDownloadUrl(filename: string): string {
  return `${API_BASE_URL}/api/download/${filename}`;
}

/**
 * Download extracted JSON file
 */
export async function downloadExtractedJSON(filename: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/download/${filename}`);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }
  return response.blob();
}
