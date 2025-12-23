/**
 * Upload & Extraction React Query Hooks
 *
 * Hooks for PDF/JSON upload and extraction job monitoring.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as uploadApi from "@/lib/api/upload";
import type {
  ExtractionStatusResponse,
  UploadResponse,
  JSONUploadResponse,
} from "@/lib/api/upload";
import { toast } from "sonner";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Poll extraction job status
 */
export function useExtractionStatus(
  jobId: string | undefined,
  options?: Partial<UseQueryOptions<ExtractionStatusResponse>>
) {
  return useQuery({
    queryKey: queryKeys.extraction.status(jobId!),
    queryFn: () => uploadApi.getExtractionStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling when job is complete or errored
      const status = query.state.data?.status;
      if (status === "completed" || status === "error") {
        return false;
      }
      return 2000; // Poll every 2 seconds while processing
    },
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Upload PDF for extraction
 */
export function useUploadPDF() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      electionName,
      electionDate,
      maxWorkers,
    }: {
      file: File;
      electionName?: string;
      electionDate?: string;
      maxWorkers?: number;
    }) =>
      uploadApi.uploadPDF(file, {
        election_name: electionName,
        election_date: electionDate,
        max_workers: maxWorkers,
      }),
    onSuccess: (data) => {
      toast.success("PDF uploaded", {
        description: "Extraction has started. You can track progress below.",
      });
    },
    onError: (error) => {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Upload JSON voter data
 */
export function useUploadJSON() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadApi.uploadJSON(file),
    onSuccess: (data) => {
      toast.success("JSON imported", {
        description: `Imported ${data.voters_imported} voters`,
      });
      // Invalidate lists to show new data
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.info,
      });
    },
    onError: (error) => {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
