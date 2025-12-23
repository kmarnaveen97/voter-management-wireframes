import { Box } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WarRoom3DLoading() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-72 md:w-80 bg-card border-r border-border flex flex-col shrink-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur">
              <Box className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-28 bg-white/20" />
              <Skeleton className="h-3 w-40 bg-white/10" />
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="p-3 border-b">
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Stats */}
        <div className="flex-1 p-4 space-y-4">
          {/* Stats Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Skeleton className="h-16 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          </div>

          {/* Ward List Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>

          {/* Legend Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas Area Skeleton */}
      <div className="flex-1 relative bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <Box className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-2">
              <p className="text-white/80 font-medium">Loading 3D War Room</p>
              <p className="text-white/50 text-sm">
                Preparing ward visualization...
              </p>
            </div>
          </div>
        </div>

        {/* Grid lines effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
    </div>
  );
}
