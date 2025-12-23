import { Skeleton } from "@/components/ui/skeleton";

export default function VotersMapLoading() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-border p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      {/* Map Area Skeleton */}
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </div>
  );
}
