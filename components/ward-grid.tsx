import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { WardStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface WardGridProps {
  wards: WardStats[];
}

export function WardGrid({ wards }: WardGridProps) {
  if (!wards || wards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            No ward data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average for highlighting
  const avgVoters = Math.round(
    wards.reduce((sum, w) => sum + w.total_voters, 0) / wards.length
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ward Breakdown</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {wards.length} wards
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wards.map((ward) => {
            const isAboveAvg = ward.total_voters > avgVoters;
            const isBelowAvg = ward.total_voters < avgVoters * 0.8;

            return (
              <Link
                key={ward.ward_no}
                href={`/voters-management/voters?ward=${ward.ward_no}`}
                className="block group"
              >
                <div
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-all duration-200",
                    "hover:shadow-md hover:border-primary/50 cursor-pointer",
                    "group-hover:translate-y-[-2px]",
                    isBelowAvg &&
                      "border-red-200 bg-red-50/30 dark:bg-red-950/10",
                    isAboveAvg &&
                      "border-green-200 bg-green-50/30 dark:bg-green-950/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Ward {ward.ward_no}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-2xl font-bold",
                        isBelowAvg && "text-red-600",
                        isAboveAvg && "text-green-600"
                      )}
                    >
                      {ward.total_voters.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      voters
                    </span>
                  </div>

                  {/* Gender breakdown bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${
                          (ward.male_count / ward.total_voters) * 100
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-pink-500"
                      style={{
                        width: `${
                          (ward.female_count / ward.total_voters) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {ward.male_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      {ward.female_count}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
