"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type ExtractionStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Users,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUpload } from "@/contexts/upload-context";

interface ExtractionProgressProps {
  jobId: string;
  onBack?: () => void;
}

const steps = [
  { key: "uploading", label: "Uploading", icon: FileText },
  { key: "processing", label: "AI Extraction", icon: Sparkles },
  { key: "completed", label: "Complete", icon: CheckCircle2 },
];

export function ExtractionProgress({ jobId, onBack }: ExtractionProgressProps) {
  const [status, setStatus] = useState<ExtractionStatus | null>(null);
  const router = useRouter();
  const { removeJob, getJob, activeJobs } = useUpload();

  // Sync with context updates
  useEffect(() => {
    const contextJob = getJob(jobId);
    if (contextJob?.status) {
      setStatus(contextJob.status);
    }
  }, [jobId, getJob, activeJobs]); // activeJobs dependency ensures we update when context updates

  useEffect(() => {
    // If we have status from context, use that instead of polling
    const contextJob = getJob(jobId);
    if (contextJob?.status) {
      setStatus(contextJob.status);

      // If completed or error, remove from active jobs after a delay
      if (
        contextJob.status.status === "completed" ||
        contextJob.status.status === "error"
      ) {
        const timer = setTimeout(() => {
          removeJob(jobId);
        }, 5000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Fallback to manual polling ONLY if not in context
    // This prevents double polling since context already polls active jobs
    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const data = await api.getExtractionStatus(jobId);
        setStatus(data);

        if (data.status === "completed" || data.status === "error") {
          timeoutId = setTimeout(() => {
            removeJob(jobId);
          }, 5000);
        } else if (data.status === "processing") {
          timeoutId = setTimeout(pollStatus, 5000);
        }
      } catch (err) {
        console.error("[v0] Failed to fetch extraction status:", err);
        timeoutId = setTimeout(pollStatus, 5000);
      }
    };

    pollStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId, removeJob, getJob]);

  const getCurrentStep = () => {
    if (!status) return 0;
    if (status.status === "processing") return 1;
    if (status.status === "completed") return 2;
    return 1;
  };

  if (!status) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#4A00B1] via-[#FF5E39] to-[#B7CF4F]" />
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A00B1]/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#4A00B1]" />
            </div>
            <p className="text-sm text-muted-foreground">Loading status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <Card className="overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#4A00B1] via-[#FF5E39] to-[#B7CF4F]" />

      <CardHeader className="pb-4">
        {/* Back button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Upload
          </Button>
        )}

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              status.status === "completed"
                ? "bg-[#B7CF4F]/15"
                : status.status === "error"
                ? "bg-destructive/10"
                : "bg-[#4A00B1]/10"
            }`}
          >
            {status.status === "processing" && (
              <Loader2 className="h-6 w-6 animate-spin text-[#4A00B1]" />
            )}
            {status.status === "completed" && (
              <CheckCircle2 className="h-6 w-6 text-[#7a8a35]" />
            )}
            {status.status === "error" && (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <div>
            <CardTitle className="text-xl">
              {status.status === "processing" && "Extracting Voter Data..."}
              {status.status === "completed" && "Extraction Complete!"}
              {status.status === "error" && "Extraction Failed"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {status.status === "processing" &&
                "Gemini AI is analyzing your voter list"}
              {status.status === "completed" &&
                "All voter data has been extracted and saved"}
              {status.status === "error" &&
                "An error occurred during extraction"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-[#B7CF4F] text-white"
                        : isActive
                        ? "bg-[#4A00B1] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 sm:w-28 h-0.5 mx-2 mb-6 ${
                      index < currentStep ? "bg-[#B7CF4F]" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {status.progress}%
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#4A00B1] to-[#B7CF4F] transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {status.current_page && status.total_pages && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#4A00B1]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#4A00B1]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {status.current_page}
                <span className="text-sm font-normal text-muted-foreground">
                  /{status.total_pages}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pages Processed
              </p>
            </div>
          )}
          {status.voters_extracted !== undefined && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#B7CF4F]/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#7a8a35]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {status.voters_extracted}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Voters Extracted
              </p>
            </div>
          )}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF5E39]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#FF5E39]" />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground capitalize">
              {status.status}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current Status
            </p>
          </div>
        </div>

        {/* Message */}
        {status.message && (
          <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
            {status.message}
          </div>
        )}

        {/* Error */}
        {status.error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {status.error}
          </div>
        )}

        {/* Action Button */}
        {status.status === "completed" && status.list_id && (
          <Button
            className="w-full h-11 text-base font-medium bg-[#4A00B1] hover:bg-[#3a008d] gap-2"
            onClick={() => router.push("/voters-management")}
          >
            View Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
