export default function VoterTurnoutLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
          <div className="h-9 w-20 bg-muted animate-pulse rounded" />
          <div className="h-9 w-10 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="flex gap-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 w-full bg-muted animate-pulse rounded" />

      {/* Filters skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Sentiment cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg">
        <div className="h-12 bg-muted/50 border-b" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
