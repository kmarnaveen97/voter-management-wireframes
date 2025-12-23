"use client";

import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/contexts/upload-context";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface UploadIndicatorProps {
  collapsed?: boolean;
}

export function UploadIndicator({ collapsed = false }: UploadIndicatorProps) {
  const { activeJobs, isUploading, currentProgress } = useUpload();

  if (!isUploading) return null;

  const activeJob = activeJobs[0]; // Show first active job
  const progress = activeJob?.status?.progress || 0;
  const currentStep = activeJob?.status?.message || "Processing...";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/voters-management/upload"
            className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary animate-pulse"
          >
            <Upload className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium text-xs">Upload in Progress</p>
            <p className="text-xs text-muted-foreground truncate">
              {activeJob?.filename}
            </p>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="text-xs font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href="/voters-management/upload"
      className="block rounded-lg bg-primary/10 p-3 hover:bg-primary/15 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Upload className="h-4 w-4 text-primary" />
          <Loader2 className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-spin" />
        </div>
        <span className="text-xs font-medium text-foreground">
          Upload in Progress
        </span>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-2">
        {activeJob?.filename}
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground truncate max-w-[120px]">
            {currentStep}
          </span>
          <span className="font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {activeJobs.length > 1 && (
        <p className="text-xs text-muted-foreground mt-2">
          +{activeJobs.length - 1} more in queue
        </p>
      )}
    </Link>
  );
}
