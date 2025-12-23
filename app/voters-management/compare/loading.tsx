import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CompareLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Selection area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((col) => (
          <Card key={col}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison results */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Left side */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-24 mx-auto" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>

            {/* Center - labels */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-24 mx-auto" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-32 mx-auto" />
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-24 mx-auto" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
