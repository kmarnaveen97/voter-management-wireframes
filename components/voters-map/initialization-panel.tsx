"use client";

import React, { memo } from "react";
import { Map, Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InitStatus, InitStep } from "./types";

interface InitializationPanelProps {
  status: InitStatus | null;
  onInitialize: () => void;
  isInitializing: boolean;
  initStep: InitStep;
  error: string | null;
}

export const InitializationPanel = memo(function InitializationPanel({
  status,
  onInitialize,
  isInitializing,
  initStep,
  error,
}: InitializationPanelProps) {
  const getStepIcon = (step: InitStep, currentStep: InitStep) => {
    if (step === currentStep) {
      return <Loader2 size={16} className="animate-spin text-primary" />;
    }
    if (
      (step === "computing" &&
        (currentStep === "generating" || currentStep === "done")) ||
      (step === "generating" && currentStep === "done")
    ) {
      return <CheckCircle2 size={16} className="text-green-500" />;
    }
    return (
      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
    );
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Map size={24} className="text-primary" />
            </div>
            <div>
              <CardTitle>Initialize Voters Map</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Set up sentiment data and map coordinates
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Info */}
          {status && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  {status.sentiments_computed ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Sentiments
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">
                  {status.sentiments_computed ? "Computed" : "Not Ready"}
                </p>
              </Card>
              <Card className="p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  {status.coords_generated ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Coordinates
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">
                  {status.coords_generated ? "Generated" : "Not Ready"}
                </p>
              </Card>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Initialization Steps
            </h4>

            <div className="space-y-2">
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  initStep === "computing"
                    ? "bg-primary/5 border-primary/30"
                    : "border-border"
                )}
              >
                {getStepIcon("computing", initStep)}
                <div className="flex-1">
                  <p className="text-sm font-medium">Compute Sentiments</p>
                  <p className="text-xs text-muted-foreground">
                    Tag youth voters (18-25) as swing, others as unknown
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  initStep === "generating"
                    ? "bg-primary/5 border-primary/30"
                    : "border-border"
                )}
              >
                {getStepIcon("generating", initStep)}
                <div className="flex-1">
                  <p className="text-sm font-medium">Generate Coordinates</p>
                  <p className="text-xs text-muted-foreground">
                    Create X,Y positions for wards and houses
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {initStep === "done" && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">
                Initialization complete! Loading map...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={onInitialize}
            disabled={isInitializing || initStep === "done"}
          >
            {isInitializing ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {initStep === "computing"
                  ? "Computing Sentiments..."
                  : "Generating Coordinates..."}
              </>
            ) : initStep === "done" ? (
              <>
                <CheckCircle2 size={18} className="mr-2" />
                Initialization Complete
              </>
            ) : (
              <>
                <Play size={18} className="mr-2" />
                Start Initialization
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This process may take a few moments depending on the number of
            voters.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
