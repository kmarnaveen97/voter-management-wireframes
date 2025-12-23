"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";
import { api, type ExtractionStatus } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";

export interface UploadJob {
  jobId: string;
  filename: string;
  status: ExtractionStatus | null;
  startedAt: number;
}

interface UploadContextType {
  activeJobs: UploadJob[];
  addJob: (jobId: string, filename: string) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => UploadJob | undefined;
  isUploading: boolean;
  currentProgress: number;
  isLoadingJobs: boolean;
  refreshActiveJobs: () => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const STORAGE_KEY = "voter_upload_active_jobs";
const POLL_INTERVAL = 5 * 1000; // 5 seconds for active polling
const BACKGROUND_POLL_INTERVAL = 30 * 1000; // 30 seconds for background polling

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<UploadJob[]>([]);
  const activeJobsRef = useRef(activeJobs);

  useEffect(() => {
    activeJobsRef.current = activeJobs;
  }, [activeJobs]);

  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshLists } = useListContext();
  const hasInitialized = useRef(false);

  // Fetch active jobs from backend on mount
  const fetchActiveJobsFromBackend = useCallback(async (): Promise<
    UploadJob[]
  > => {
    try {
      const response = await api.getActiveJobs();
      if (response.active_jobs && response.active_jobs.length > 0) {
        return response.active_jobs.map((job) => ({
          jobId: job.job_id,
          filename: job.pdf_filename || job.filename || "Unknown file",
          status: job,
          startedAt: job.elapsed_seconds
            ? Date.now() - job.elapsed_seconds * 1000
            : Date.now(),
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch active jobs from backend:", error);
      return [];
    }
  }, []);

  // Load persisted jobs from localStorage as fallback
  const loadFromLocalStorage = useCallback((): UploadJob[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const jobs: UploadJob[] = JSON.parse(stored);
        // Filter out jobs older than 24 hours
        const validJobs = jobs.filter(
          (job) => Date.now() - job.startedAt < 24 * 60 * 60 * 1000
        );
        return validJobs;
      }
    } catch (e) {
      console.error("Failed to load upload jobs from storage:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return [];
  }, []);

  // Initialize jobs from backend first, then merge with localStorage
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeJobs = async () => {
      setIsLoadingJobs(true);

      // Try to get active jobs from backend first
      const backendJobs = await fetchActiveJobsFromBackend();
      const localJobs = loadFromLocalStorage();

      // Merge: backend jobs take priority, but include local jobs not in backend
      const backendJobIds = new Set(backendJobs.map((j) => j.jobId));
      const mergedJobs = [
        ...backendJobs,
        ...localJobs.filter((j) => !backendJobIds.has(j.jobId)),
      ];

      if (mergedJobs.length > 0) {
        setActiveJobs(mergedJobs);
        // If we recovered jobs, show a notification
        if (backendJobs.length > 0) {
          toast.info("Active Uploads Recovered", {
            description: `Found ${backendJobs.length} upload(s) in progress.`,
          });
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      setIsLoadingJobs(false);
    };

    initializeJobs();
  }, [fetchActiveJobsFromBackend, loadFromLocalStorage]);

  // Refresh active jobs from backend
  const refreshActiveJobs = useCallback(async () => {
    const backendJobs = await fetchActiveJobsFromBackend();
    if (backendJobs.length > 0) {
      setActiveJobs((prev) => {
        const backendJobIds = new Set(backendJobs.map((j) => j.jobId));
        return [
          ...backendJobs,
          ...prev.filter((j) => !backendJobIds.has(j.jobId)),
        ];
      });
    }
  }, [fetchActiveJobsFromBackend]);

  // Persist jobs to localStorage whenever they change
  useEffect(() => {
    if (activeJobs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeJobs));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeJobs]);

  // Poll for status updates
  const pollJobStatus = useCallback(async () => {
    const currentJobs = activeJobsRef.current;
    if (currentJobs.length === 0) return;

    const updatedJobs: UploadJob[] = [];
    const completedJobs: UploadJob[] = [];
    const failedJobs: UploadJob[] = [];

    for (const job of currentJobs) {
      try {
        const status = await api.getExtractionStatus(job.jobId);
        const updatedJob = { ...job, status };

        if (status.status === "completed") {
          completedJobs.push(updatedJob);
        } else if (status.status === "error") {
          failedJobs.push(updatedJob);
        } else {
          updatedJobs.push(updatedJob);
        }
      } catch (error) {
        console.error(`Failed to get status for job ${job.jobId}:`, error);
        // Keep the job in the list but don't update status
        updatedJobs.push(job);
      }
    }

    // Show notifications for completed/failed jobs
    for (const job of completedJobs) {
      toast.success(`Upload Complete`, {
        description: `"${job.filename}" has been processed successfully. ${
          job.status?.voters_extracted || 0
        } voters found.`,
        duration: 5000,
      });
      // Refresh the list context to show new data
      refreshLists();
    }

    for (const job of failedJobs) {
      toast.error(`Upload Failed`, {
        description: `"${job.filename}" failed: ${
          job.status?.error || "Unknown error"
        }`,
        duration: 5000,
      });
    }

    // Update state with only the still-processing jobs
    setActiveJobs(updatedJobs);
  }, [refreshLists]);

  // Set up polling interval with visibility-aware frequency
  useEffect(() => {
    if (activeJobs.length === 0) {
      // No active jobs, clear interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const setupPolling = () => {
      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Use faster polling when page is visible, slower when hidden
      const interval = document.hidden
        ? BACKGROUND_POLL_INTERVAL
        : POLL_INTERVAL;
      pollIntervalRef.current = setInterval(pollJobStatus, interval);
    };

    // Poll immediately on mount
    pollJobStatus();
    setupPolling();

    // Adjust polling rate based on page visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - poll immediately and restart with faster interval
        pollJobStatus();
      }
      setupPolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeJobs.length, pollJobStatus]);

  const addJob = useCallback((jobId: string, filename: string) => {
    const newJob: UploadJob = {
      jobId,
      filename,
      status: null,
      startedAt: Date.now(),
    };
    setActiveJobs((prev) => [...prev, newJob]);
    toast.info("Upload Started", {
      description: `Processing "${filename}"...`,
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setActiveJobs((prev) => prev.filter((job) => job.jobId !== jobId));
  }, []);

  const getJob = useCallback(
    (jobId: string) => {
      return activeJobs.find((job) => job.jobId === jobId);
    },
    [activeJobs]
  );

  const isUploading = activeJobs.length > 0;

  const currentProgress =
    activeJobs.length > 0
      ? activeJobs.reduce((sum, job) => sum + (job.status?.progress || 0), 0) /
        activeJobs.length
      : 0;

  return (
    <UploadContext.Provider
      value={{
        activeJobs,
        addJob,
        removeJob,
        getJob,
        isUploading,
        currentProgress,
        isLoadingJobs,
        refreshActiveJobs,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
