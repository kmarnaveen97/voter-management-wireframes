"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { WardGrid } from "@/components/ward-grid";
import {
  api,
  type Stats,
  type WardStats,
  type AgeDistribution,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import {
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Home,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Upload,
  GitCompare,
  Map as MapIcon,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  HelpCircle as UnknownIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Skeleton Loading Component
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  href,
  iconColor = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  iconColor?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-sm text-muted-foreground truncate">{label}</p>
          </div>
          {href && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function Dashboard() {
  const router = useRouter();
  const {
    selectedListId,
    currentList,
    availableLists,
    isLoading: listLoading,
  } = useListContext();

  // Redirect to upload page if no lists exist
  const hasLists = (availableLists?.length ?? 0) > 0;

  useEffect(() => {
    if (listLoading) return;
    if (!hasLists) {
      router.replace("/voters-management/upload");
    }
  }, [hasLists, listLoading, router]);

  // React Query hooks for data fetching with automatic caching
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.stats.overview(selectedListId!),
    queryFn: () => api.getStats(selectedListId),
    enabled: !!selectedListId && hasLists,
  });

  const { data: wardStatsData } = useQuery({
    queryKey: queryKeys.stats.wards(selectedListId!),
    queryFn: () => api.getWardStats(selectedListId),
    enabled: !!selectedListId && hasLists,
  });

  const { data: ageDistribution } = useQuery({
    queryKey: queryKeys.stats.age(selectedListId!),
    queryFn: () => api.getAgeDistribution(selectedListId),
    enabled: !!selectedListId && hasLists,
  });

  const { data: familiesData } = useQuery({
    queryKey: queryKeys.families.list(selectedListId!, 1, {}),
    queryFn: () => api.getFamilies(1, 1, selectedListId),
    enabled: !!selectedListId && hasLists,
  });

  // Derived state
  const wardStats = wardStatsData?.wards ?? [];
  const familyCount = familiesData?.total ?? 0;
  const loading = statsLoading || listLoading;
  const error = statsError;

  // If no lists, show loading while redirecting to upload
  if (!hasLists && !listLoading) {
    return <DashboardSkeleton />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Unable to connect to the API server."}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 block"
              onClick={() => refetchStats()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  const malePercent =
    stats.total_voters > 0
      ? ((stats.male_count / stats.total_voters) * 100).toFixed(1)
      : "0";
  const femalePercent =
    stats.total_voters > 0
      ? ((stats.female_count / stats.total_voters) * 100).toFixed(1)
      : "0";

  const sortedWards = [...wardStats].sort(
    (a, b) => b.total_voters - a.total_voters
  );
  const topWard = sortedWards[0];
  const bottomWard = sortedWards[sortedWards.length - 1];

  const ageColors: Record<string, string> = {
    "18-25": "bg-emerald-500",
    "26-35": "bg-blue-500",
    "36-45": "bg-violet-500",
    "46-55": "bg-amber-500",
    "56-65": "bg-orange-500",
    "65+": "bg-rose-500",
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            List #{currentList?.list_id} • Year {currentList?.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Link href="/voters-management/war-room">
            <Button size="sm">
              <MapIcon className="h-4 w-4 mr-1" />
              War Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Voters"
          value={stats.total_voters}
          subtext={`${stats.total_wards} wards`}
          href="/voters-management/voters"
          iconColor="text-primary"
        />
        <StatCard
          icon={UserCheck}
          label="Male"
          value={stats.male_count}
          subtext={`${malePercent}%`}
          href="/voters-management/voters?gender=male"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={UserX}
          label="Female"
          value={stats.female_count}
          subtext={`${femalePercent}%`}
          href="/voters-management/voters?gender=female"
          iconColor="text-pink-600"
        />
        <StatCard
          icon={Home}
          label="Families"
          value={familyCount}
          subtext={`~${(stats.total_voters / familyCount || 0).toFixed(
            1
          )} per family`}
          href="/voters-management/families"
          iconColor="text-amber-600"
        />
      </div>

      {/* Sentiment Stats */}
      {stats.sentiment_counts && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <StatCard
            icon={ThumbsUp}
            label="Support"
            value={stats.sentiment_counts.support}
            subtext={`${(
              (stats.sentiment_counts.support / stats.total_voters) *
              100
            ).toFixed(1)}%`}
            iconColor="text-green-600"
          />
          <StatCard
            icon={ThumbsDown}
            label="Oppose"
            value={stats.sentiment_counts.oppose}
            subtext={`${(
              (stats.sentiment_counts.oppose / stats.total_voters) *
              100
            ).toFixed(1)}%`}
            iconColor="text-red-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Swing"
            value={stats.sentiment_counts.swing}
            subtext={`${(
              (stats.sentiment_counts.swing / stats.total_voters) *
              100
            ).toFixed(1)}%`}
            iconColor="text-amber-600"
          />
          <StatCard
            icon={Minus}
            label="Neutral"
            value={stats.sentiment_counts.neutral}
            subtext={`${(
              (stats.sentiment_counts.neutral / stats.total_voters) *
              100
            ).toFixed(1)}%`}
            iconColor="text-gray-600"
          />
          <StatCard
            icon={UnknownIcon}
            label="Unknown"
            value={stats.sentiment_counts.unknown}
            subtext={`${(
              (stats.sentiment_counts.unknown / stats.total_voters) *
              100
            ).toFixed(1)}%`}
            iconColor="text-slate-500"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gender Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-blue-500"
                    strokeDasharray={`${parseFloat(malePercent) * 2.51} 251`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-pink-500"
                    strokeDasharray={`${parseFloat(femalePercent) * 2.51} 251`}
                    strokeDashoffset={`-${parseFloat(malePercent) * 2.51}`}
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Male
                  </span>
                  <span className="font-medium">{malePercent}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    Female
                  </span>
                  <span className="font-medium">{femalePercent}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution - Pyramid Style */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Age Distribution by Gender
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ageDistribution?.age_groups && ageDistribution?.by_gender ? (
              <div className="space-y-1.5">
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-muted-foreground">Male</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-pink-500" />
                    <span className="text-muted-foreground">Female</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-muted-foreground">Other</span>
                  </div>
                </div>

                {/* Age Pyramid */}
                {Object.entries(ageDistribution.age_groups)
                  .sort(([a], [b]) => {
                    const order = [
                      "18-25",
                      "26-35",
                      "36-45",
                      "46-55",
                      "56-65",
                      "65+",
                    ];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map(([group, total]) => {
                    const maleCount =
                      ageDistribution.by_gender.Male[group] || 0;
                    const femaleCount =
                      ageDistribution.by_gender.Female[group] || 0;
                    const otherCount =
                      ageDistribution.by_gender.Other[group] || 0;
                    const maxCount = Math.max(
                      ...Object.values(ageDistribution.age_groups)
                    );

                    return (
                      <div
                        key={group}
                        className="flex items-center gap-2 text-xs"
                      >
                        {/* Male (left side) */}
                        <div className="flex-1 flex justify-end items-center gap-1">
                          <span className="text-muted-foreground text-[10px]">
                            {maleCount}
                          </span>
                          <div
                            className="h-4 bg-blue-500 rounded-l transition-all"
                            style={{
                              width: `${(maleCount / maxCount) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Age Group Label */}
                        <span className="w-14 text-center font-medium text-muted-foreground shrink-0">
                          {group}
                        </span>

                        {/* Female (right side) */}
                        <div className="flex-1 flex items-center gap-1">
                          <div
                            className="h-4 bg-pink-500 rounded-r transition-all"
                            style={{
                              width: `${(femaleCount / maxCount) * 100}%`,
                            }}
                          />
                          <span className="text-muted-foreground text-[10px]">
                            {femaleCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {/* Average Age */}
                <div className="pt-2 mt-2 border-t text-center">
                  <span className="text-xs text-muted-foreground">
                    Average Age:{" "}
                    <span className="font-semibold text-foreground">
                      {ageDistribution.average_age.toFixed(1)} years
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No age data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Ward Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/voters-management/voters">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Voters
              </Button>
            </Link>
            <Link href="/voters-management/families">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Families
              </Button>
            </Link>
            <Link href="/voters-management/upload">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>
            <Link href="/voters-management/compare">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Ward Highlights */}
        {topWard && bottomWard && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ward Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/voters-management/voters?ward=${topWard.ward_no}`}
                  className="group"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Ward {topWard.ward_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {topWard.total_voters.toLocaleString()} voters
                      </p>
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/voters-management/voters?ward=${bottomWard.ward_no}`}
                  className="group"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Ward {bottomWard.ward_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {bottomWard.total_voters.toLocaleString()} voters
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ward Breakdown Table */}
      {wardStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Ward-wise Sentiment Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of voter sentiments by ward with gender
              distribution
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sentiment" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sentiment">Sentiment Breakdown</TabsTrigger>
                <TabsTrigger value="gender-sentiment">
                  Gender × Sentiment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sentiment" className="mt-4">
                {/* Visual Charts */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {/* Sentiment Pie Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Overall Sentiment Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="relative h-32 w-32 shrink-0">
                          <svg
                            viewBox="0 0 100 100"
                            className="h-full w-full -rotate-90"
                          >
                            {stats.sentiment_counts &&
                              (() => {
                                const total = stats.total_voters;
                                const support =
                                  (stats.sentiment_counts.support / total) *
                                  100 *
                                  2.51;
                                const oppose =
                                  (stats.sentiment_counts.oppose / total) *
                                  100 *
                                  2.51;
                                const swing =
                                  (stats.sentiment_counts.swing / total) *
                                  100 *
                                  2.51;
                                const neutral =
                                  (stats.sentiment_counts.neutral / total) *
                                  100 *
                                  2.51;
                                const unknown =
                                  (stats.sentiment_counts.unknown / total) *
                                  100 *
                                  2.51;

                                let offset = 0;
                                return (
                                  <>
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="16"
                                      className="text-green-500"
                                      strokeDasharray={`${support} 251`}
                                      strokeDashoffset={-offset}
                                    />
                                    {((offset += support), null)}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="16"
                                      className="text-red-500"
                                      strokeDasharray={`${oppose} 251`}
                                      strokeDashoffset={-offset}
                                    />
                                    {((offset += oppose), null)}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="16"
                                      className="text-amber-500"
                                      strokeDasharray={`${swing} 251`}
                                      strokeDashoffset={-offset}
                                    />
                                    {((offset += swing), null)}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="16"
                                      className="text-gray-500"
                                      strokeDasharray={`${neutral} 251`}
                                      strokeDashoffset={-offset}
                                    />
                                    {((offset += neutral), null)}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="16"
                                      className="text-slate-400"
                                      strokeDasharray={`${unknown} 251`}
                                      strokeDashoffset={-offset}
                                    />
                                  </>
                                );
                              })()}
                          </svg>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {stats.sentiment_counts && (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-green-500" />
                                  Support
                                </span>
                                <span className="font-medium">
                                  {(
                                    (stats.sentiment_counts.support /
                                      stats.total_voters) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-red-500" />
                                  Oppose
                                </span>
                                <span className="font-medium">
                                  {(
                                    (stats.sentiment_counts.oppose /
                                      stats.total_voters) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  Swing
                                </span>
                                <span className="font-medium">
                                  {(
                                    (stats.sentiment_counts.swing /
                                      stats.total_voters) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                                  Neutral
                                </span>
                                <span className="font-medium">
                                  {(
                                    (stats.sentiment_counts.neutral /
                                      stats.total_voters) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                                  Unknown
                                </span>
                                <span className="font-medium">
                                  {(
                                    (stats.sentiment_counts.unknown /
                                      stats.total_voters) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Wards Bar Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Top Wards by Net Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {wardStats
                          .map((ward) => ({
                            ...ward,
                            netPosition:
                              (ward.sentiment_counts?.support || 0) -
                              (ward.sentiment_counts?.oppose || 0),
                          }))
                          .sort((a, b) => b.netPosition - a.netPosition)
                          .slice(0, 5)
                          .map((ward) => {
                            const maxNet = Math.max(
                              ...wardStats.map((w) =>
                                Math.abs(
                                  (w.sentiment_counts?.support || 0) -
                                    (w.sentiment_counts?.oppose || 0)
                                )
                              )
                            );
                            const barWidth =
                              maxNet > 0
                                ? (Math.abs(ward.netPosition) / maxNet) * 100
                                : 0;

                            return (
                              <div key={ward.ward_no} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">
                                    Ward {ward.ward_no}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      ward.netPosition > 0
                                        ? "text-green-600"
                                        : ward.netPosition < 0
                                        ? "text-red-600"
                                        : "text-gray-600"
                                    )}
                                  >
                                    {ward.netPosition > 0 ? "+" : ""}
                                    {ward.netPosition}
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      ward.netPosition > 0
                                        ? "bg-green-500"
                                        : ward.netPosition < 0
                                        ? "bg-red-500"
                                        : "bg-gray-400"
                                    )}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Ward</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right text-green-600">
                          Support
                        </TableHead>
                        <TableHead className="text-right text-red-600">
                          Oppose
                        </TableHead>
                        <TableHead className="text-right text-amber-600 hidden sm:table-cell">
                          Swing
                        </TableHead>
                        <TableHead className="text-right text-gray-600 hidden md:table-cell">
                          Neutral
                        </TableHead>
                        <TableHead className="text-right text-slate-500 hidden md:table-cell">
                          Unknown
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          Net Position
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wardStats.map((ward) => {
                        const support = ward.sentiment_counts?.support || 0;
                        const oppose = ward.sentiment_counts?.oppose || 0;
                        const swing = ward.sentiment_counts?.swing || 0;
                        const neutral = ward.sentiment_counts?.neutral || 0;
                        const unknown = ward.sentiment_counts?.unknown || 0;
                        const netPosition = support - oppose;
                        const netPositionPercent =
                          ward.total_voters > 0
                            ? ((netPosition / ward.total_voters) * 100).toFixed(
                                1
                              )
                            : "0";

                        return (
                          <TableRow key={ward.ward_no}>
                            <TableCell className="font-medium">
                              {ward.ward_no}
                            </TableCell>
                            <TableCell className="text-right">
                              {ward.total_voters}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {support}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {ward.total_voters > 0
                                  ? (
                                      (support / ward.total_voters) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %)
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {oppose}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {ward.total_voters > 0
                                  ? (
                                      (oppose / ward.total_voters) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %)
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-amber-600 font-medium hidden sm:table-cell">
                              {swing}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {ward.total_voters > 0
                                  ? ((swing / ward.total_voters) * 100).toFixed(
                                      0
                                    )
                                  : 0}
                                %)
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-gray-600 hidden md:table-cell">
                              {neutral}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {ward.total_voters > 0
                                  ? (
                                      (neutral / ward.total_voters) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %)
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-slate-500 hidden md:table-cell">
                              {unknown}
                              <span className="text-xs text-muted-foreground ml-1">
                                (
                                {ward.total_voters > 0
                                  ? (
                                      (unknown / ward.total_voters) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %)
                              </span>
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <span
                                className={cn(
                                  "font-semibold",
                                  netPosition > 0
                                    ? "text-green-600"
                                    : netPosition < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                                )}
                              >
                                {netPosition > 0 ? "+" : ""}
                                {netPosition}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({netPositionPercent}%)
                                </span>
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {stats.total_voters}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {stats.sentiment_counts?.support || 0}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {stats.sentiment_counts?.oppose || 0}
                        </TableCell>
                        <TableCell className="text-right text-amber-600 hidden sm:table-cell">
                          {stats.sentiment_counts?.swing || 0}
                        </TableCell>
                        <TableCell className="text-right text-gray-600 hidden md:table-cell">
                          {stats.sentiment_counts?.neutral || 0}
                        </TableCell>
                        <TableCell className="text-right text-slate-500 hidden md:table-cell">
                          {stats.sentiment_counts?.unknown || 0}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <span
                            className={cn(
                              "font-semibold",
                              (stats.sentiment_counts?.support || 0) -
                                (stats.sentiment_counts?.oppose || 0) >
                                0
                                ? "text-green-600"
                                : (stats.sentiment_counts?.support || 0) -
                                    (stats.sentiment_counts?.oppose || 0) <
                                  0
                                ? "text-red-600"
                                : "text-gray-600"
                            )}
                          >
                            {(stats.sentiment_counts?.support || 0) -
                              (stats.sentiment_counts?.oppose || 0) >
                            0
                              ? "+"
                              : ""}
                            {(stats.sentiment_counts?.support || 0) -
                              (stats.sentiment_counts?.oppose || 0)}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="gender-sentiment" className="mt-4">
                {ageDistribution?.sentiment_by_gender && stats ? (
                  <div className="space-y-6">
                    {/* Male Sentiment */}
                    <div>
                      <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Male Voters Sentiment
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">
                                Count
                              </TableHead>
                              <TableHead className="text-right">
                                Percentage
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-green-600 font-medium">
                                Support
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .support
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.male_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender.Male
                                        .support /
                                        stats.male_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-red-600 font-medium">
                                Oppose
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .oppose
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.male_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender.Male
                                        .oppose /
                                        stats.male_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-amber-600 font-medium">
                                Swing
                              </TableCell>
                              <TableCell className="text-right">
                                {ageDistribution.sentiment_by_gender.Male.swing}
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.male_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender.Male
                                        .swing /
                                        stats.male_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-gray-600">
                                Neutral
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .neutral
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.male_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender.Male
                                        .neutral /
                                        stats.male_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-slate-500">
                                Unknown
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .unknown
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.male_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender.Male
                                        .unknown /
                                        stats.male_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>Total Male</TableCell>
                              <TableCell className="text-right">
                                {stats.male_count}
                              </TableCell>
                              <TableCell className="text-right">100%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Female Sentiment */}
                    <div>
                      <h3 className="text-sm font-semibold text-pink-600 mb-3 flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        Female Voters Sentiment
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">
                                Count
                              </TableHead>
                              <TableHead className="text-right">
                                Percentage
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-green-600 font-medium">
                                Support
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .support
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.female_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender
                                        .Female.support /
                                        stats.female_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-red-600 font-medium">
                                Oppose
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .oppose
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.female_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender
                                        .Female.oppose /
                                        stats.female_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-amber-600 font-medium">
                                Swing
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .swing
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.female_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender
                                        .Female.swing /
                                        stats.female_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-gray-600">
                                Neutral
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .neutral
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.female_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender
                                        .Female.neutral /
                                        stats.female_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-slate-500">
                                Unknown
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .unknown
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {stats.female_count > 0
                                  ? (
                                      (ageDistribution.sentiment_by_gender
                                        .Female.unknown /
                                        stats.female_count) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>Total Female</TableCell>
                              <TableCell className="text-right">
                                {stats.female_count}
                              </TableCell>
                              <TableCell className="text-right">100%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Comparative Summary */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Gender Sentiment Comparison
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sentiment</TableHead>
                              <TableHead className="text-right text-blue-600">
                                Male
                              </TableHead>
                              <TableHead className="text-right text-pink-600">
                                Female
                              </TableHead>
                              <TableHead className="text-right">
                                Difference
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-green-600 font-medium">
                                Support
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .support
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.male_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Male.support /
                                          stats.male_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .support
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.female_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Female.support /
                                          stats.female_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {ageDistribution.sentiment_by_gender.Male
                                  .support -
                                  ageDistribution.sentiment_by_gender.Female
                                    .support >
                                0
                                  ? "+"
                                  : ""}
                                {ageDistribution.sentiment_by_gender.Male
                                  .support -
                                  ageDistribution.sentiment_by_gender.Female
                                    .support}{" "}
                                (M)
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-red-600 font-medium">
                                Oppose
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Male
                                    .oppose
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.male_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Male.oppose /
                                          stats.male_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .oppose
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.female_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Female.oppose /
                                          stats.female_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {ageDistribution.sentiment_by_gender.Male
                                  .oppose -
                                  ageDistribution.sentiment_by_gender.Female
                                    .oppose >
                                0
                                  ? "+"
                                  : ""}
                                {ageDistribution.sentiment_by_gender.Male
                                  .oppose -
                                  ageDistribution.sentiment_by_gender.Female
                                    .oppose}{" "}
                                (M)
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-amber-600 font-medium">
                                Swing
                              </TableCell>
                              <TableCell className="text-right">
                                {ageDistribution.sentiment_by_gender.Male.swing}
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.male_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Male.swing /
                                          stats.male_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {
                                  ageDistribution.sentiment_by_gender.Female
                                    .swing
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {stats.female_count > 0
                                    ? (
                                        (ageDistribution.sentiment_by_gender
                                          .Female.swing /
                                          stats.female_count) *
                                        100
                                      ).toFixed(0)
                                    : 0}
                                  %)
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {ageDistribution.sentiment_by_gender.Male
                                  .swing -
                                  ageDistribution.sentiment_by_gender.Female
                                    .swing >
                                0
                                  ? "+"
                                  : ""}
                                {ageDistribution.sentiment_by_gender.Male
                                  .swing -
                                  ageDistribution.sentiment_by_gender.Female
                                    .swing}{" "}
                                (M)
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Gender-wise sentiment data not available
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Ward Grid */}
      <WardGrid wards={wardStats} />
    </div>
  );
}
