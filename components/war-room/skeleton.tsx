"use client";

import { Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * War Room loading skeleton
 * Shows while the main data is being fetched
 */
export function WarRoomSkeleton() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-5 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/20" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Win Probability Skeleton */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-2.5 bg-muted/30">
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
                <Skeleton className="h-2 w-12 mx-auto" />
              </div>
            ))}
          </div>

          {/* Sentiment Bar Skeleton */}
          <div className="bg-card rounded-xl border border-border p-4">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-full rounded-lg mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Ward List Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
              >
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Skeleton */}
      <div className="flex-1 relative bg-slate-900 rounded-2xl m-2 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              {/* Animated circles representing ward loading */}
              {[0, 1, 2].map((ring) => (
                <div
                  key={ring}
                  className="absolute inset-0 rounded-full border-2 border-slate-700 animate-ping"
                  style={{
                    width: 100 + ring * 80,
                    height: 100 + ring * 80,
                    left: `calc(50% - ${50 + ring * 40}px)`,
                    top: `calc(50% - ${50 + ring * 40}px)`,
                    animationDelay: `${ring * 0.3}s`,
                    animationDuration: "2s",
                  }}
                />
              ))}
              <div className="relative z-10 bg-slate-800 rounded-full p-6">
                <MapIcon className="w-8 h-8 text-slate-500 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-500 mt-8 text-sm animate-pulse">
              Loading village map...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
