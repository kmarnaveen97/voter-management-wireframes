import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-80 bg-card border-r border-border flex flex-col h-full">
        <div className="p-6 bg-primary">
          <Skeleton className="h-6 w-40 bg-primary-foreground/20" />
          <Skeleton className="h-4 w-32 mt-2 bg-primary-foreground/20" />
          <Skeleton className="h-10 w-full mt-4 bg-primary-foreground/20" />
          <Skeleton className="h-10 w-full mt-3 bg-primary-foreground/20" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-48 w-64" />
      </div>
    </div>
  );
}
