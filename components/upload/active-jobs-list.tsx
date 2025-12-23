"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUpload } from "@/contexts/upload-context";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActiveJobsListProps {
  onSelectJob: (jobId: string) => void;
  excludeJobId?: string;
}

export function ActiveJobsList({
  onSelectJob,
  excludeJobId,
}: ActiveJobsListProps) {
  const { activeJobs } = useUpload();

  const filteredJobs = excludeJobId
    ? activeJobs.filter((job) => job.jobId !== excludeJobId)
    : activeJobs;

  if (filteredJobs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Active Uploads
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filteredJobs.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredJobs.map((job) => {
          const progress = job.status?.progress || 0;
          const status = job.status?.status || "processing";
          const timeAgo = formatDistanceToNow(job.startedAt, {
            addSuffix: true,
          });

          return (
            <Button
              key={job.jobId}
              variant="ghost"
              className="w-full h-auto p-3 justify-start hover:bg-muted/50"
              onClick={() => onSelectJob(job.jobId)}
            >
              <div className="flex items-center gap-3 w-full">
                {/* Status Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    status === "completed"
                      ? "bg-green-500/10 text-green-600"
                      : status === "error"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {status === "processing" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {status === "completed" && (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {status === "error" && <AlertCircle className="h-4 w-4" />}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{job.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Started {timeAgo}</span>
                  </div>

                  {/* Progress bar for processing jobs */}
                  {status === "processing" && (
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  )}

                  {/* Status message */}
                  {job.status?.message && status === "processing" && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {job.status.message}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
