"use client";

import { Fragment, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  api,
  type PollingStation,
  type PollingBooth,
  type Voter,
  type PollingBoothStatsRow,
  type PollingBoothStatsSummary,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  Building2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Vote,
  X,
  ChevronDown,
  Download,
  WifiOff,
  Phone,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";
import { useDebounce } from "@/hooks/use-debounce";
import {
  usePollingStations,
  useBoothStatistics,
} from "@/hooks/use-polling-stations";

type SortKey = "code" | "name" | "booth_count" | "voter_count";
type SortDir = "asc" | "desc";

export default function PollingStationsPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const expandedPsCode = searchParams.get("ps_code");
  const expandedDetailRef = useRef<HTMLDivElement>(null);

  // React Query Hooks
  const {
    data: stationsData,
    isLoading: stationsLoading,
    error: stationsErrorObj,
    refetch: refetchStations,
  } = usePollingStations(selectedListId);

  const stations = stationsData?.stations || [];
  const loading = stationsLoading;
  const error = stationsErrorObj ? "Unable to fetch polling stations." : null;

  const {
    data: boothStatsData,
    isLoading: boothStatsLoading,
    error: boothStatsErrorObj,
    refetch: refetchBoothStats,
  } = useBoothStatistics(selectedListId);

  const boothSummary = boothStatsData?.summary || null;
  const boothRows = boothStatsData?.rows || [];
  const boothStatsError = boothStatsErrorObj
    ? "Unable to fetch booth stats."
    : null;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Network monitoring state
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Network monitoring effect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update last updated when data changes
  useEffect(() => {
    if (stationsData || boothStatsData) {
      setLastUpdated(new Date());
    }
  }, [stationsData, boothStatsData]);

  // Inline station detail + booth voters (single expanded station + booth)
  const [expandedStation, setExpandedStation] = useState<PollingStation | null>(
    null
  );
  const [expandedBooths, setExpandedBooths] = useState<PollingBooth[]>([]);
  const [expandedStationLoading, setExpandedStationLoading] = useState(false);
  const [expandedStationError, setExpandedStationError] = useState<
    string | null
  >(null);

  const [activeBoothTab, setActiveBoothTab] = useState<string>("");
  const [boothVotersMap, setBoothVotersMap] = useState<Record<number, Voter[]>>(
    {}
  );
  const [boothDetailsMap, setBoothDetailsMap] = useState<
    Record<number, PollingBooth>
  >({});
  const [loadingVotersMap, setLoadingVotersMap] = useState<
    Record<number, boolean>
  >({});
  const [voterPageMap, setVoterPageMap] = useState<Record<number, number>>({});
  const [voterTotalMap, setVoterTotalMap] = useState<Record<number, number>>(
    {}
  );
  const votersPerPage = 1000; // Fetch all voters at once (no pagination)

  const fetchBoothVoters = useCallback(
    async (boothId: number, page: number = 1) => {
      if (!selectedListId) return;

      try {
        setLoadingVotersMap((prev) => ({ ...prev, [boothId]: true }));
        const data = await api.getPollingBooth(boothId, selectedListId, {
          include_voters: true,
          page,
          per_page: votersPerPage,
        });
        setBoothVotersMap((prev) => ({
          ...prev,
          [boothId]: data.voters || [],
        }));
        // Store booth details including sentiment_counts and turnout_counts
        if (data.booth) {
          setBoothDetailsMap((prev) => ({
            ...prev,
            [boothId]: data.booth,
          }));
        }
        setVoterTotalMap((prev) => ({
          ...prev,
          [boothId]: data.meta?.total || data.booth.voter_count || 0,
        }));
        setVoterPageMap((prev) => ({ ...prev, [boothId]: page }));
      } catch (err) {
        console.error("Failed to fetch booth voters:", err);
      } finally {
        setLoadingVotersMap((prev) => ({ ...prev, [boothId]: false }));
      }
    },
    [selectedListId]
  );

  const setExpandedPsCodeParam = useCallback(
    (psCode: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (psCode) params.set("ps_code", psCode);
      else params.delete("ps_code");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, router, pathname]
  );

  const fetchExpandedStation = useCallback(async () => {
    if (!selectedListId || !expandedPsCode) return;

    try {
      setExpandedStationLoading(true);
      setExpandedStationError(null);
      setBoothVotersMap({});
      setLoadingVotersMap({});
      setVoterPageMap({});
      setVoterTotalMap({});

      const data = await api.getPollingStation(expandedPsCode, selectedListId);
      setExpandedStation(data.station);
      const booths = data.station.booths || [];
      setExpandedBooths(booths);
      // Set first booth as active tab and fetch its voters
      if (booths.length > 0) {
        const firstBoothId = booths[0].polling_booth_id;
        setActiveBoothTab(String(firstBoothId));
        // Fetch voters for the first booth
        fetchBoothVoters(firstBoothId, 1);
      } else {
        setActiveBoothTab("");
      }
    } catch (err) {
      console.error("Failed to fetch polling station details:", err);
      setExpandedStationError(
        "Unable to fetch polling station details. Please check your API connection."
      );
      setExpandedStation(null);
      setExpandedBooths([]);
      setActiveBoothTab("");
    } finally {
      setExpandedStationLoading(false);
    }
  }, [selectedListId, expandedPsCode, fetchBoothVoters]);

  useEffect(() => {
    if (!expandedPsCode) {
      setExpandedStation(null);
      setExpandedBooths([]);
      setExpandedStationError(null);
      setActiveBoothTab("");
      setBoothVotersMap({});
      setLoadingVotersMap({});
      setVoterPageMap({});
      setVoterTotalMap({});
      return;
    }

    if (selectedListId && !listLoading) {
      fetchExpandedStation();
    }
  }, [expandedPsCode, selectedListId, listLoading, fetchExpandedStation]);

  // Auto-scroll to expanded detail when station is selected
  useEffect(() => {
    if (expandedPsCode && expandedDetailRef.current) {
      // Wait for content to render before scrolling
      setTimeout(() => {
        expandedDetailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [expandedPsCode]);

  const handleBoothTabChange = (value: string) => {
    setActiveBoothTab(value);
    if (value !== "analytics" && !boothVotersMap[parseInt(value)]) {
      fetchBoothVoters(parseInt(value), 1);
    }
  };

  // Filter stations by search query (using debounced search)
  const filteredStations = stations.filter((s) =>
    debouncedSearch
      ? s.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  // Sort stations
  const sortedStations = [...filteredStations].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  // Helper to highlight search matches
  const HighlightText = ({
    text,
    highlight,
  }: {
    text: string;
    highlight: string;
  }) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(
      `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getTotalVoterPages = (boothId: number) =>
    Math.ceil((voterTotalMap[boothId] || 0) / votersPerPage);

  // Export booth voters as PDF (via print)
  const exportBoothVoters = (booth: PollingBooth, voters: Voter[]) => {
    if (voters.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${booth.name || booth.code} - Voter List</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 15px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .sentiment-support { color: #16a34a; }
          .sentiment-oppose { color: #dc2626; }
          .sentiment-swing { color: #ca8a04; }
          .turnout-will { color: #16a34a; }
          .turnout-voted { color: #2563eb; }
          .turnout-wont { color: #dc2626; }
          @media print {
            body { padding: 10px; }
            th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>${booth.name || booth.code}</h1>
        <p class="subtitle">Total Voters: ${voters.length} | Station: ${
      booth.station_name || ""
    }</p>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>House No</th>
              <th>Voter ID</th>
              <th>Sentiment</th>
              <th>Turnout</th>
            </tr>
          </thead>
          <tbody>
            ${voters
              .map(
                (voter, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${voter.name}</td>
                <td>${voter.age}</td>
                <td>${voter.gender}</td>
                <td>${voter.house_no}</td>
                <td>${voter.voter_id_number || "-"}</td>
                <td class="${
                  voter.sentiment === "support"
                    ? "sentiment-support"
                    : voter.sentiment === "oppose"
                    ? "sentiment-oppose"
                    : voter.sentiment === "swing"
                    ? "sentiment-swing"
                    : ""
                }">
                  ${voter.sentiment || "-"}
                </td>
                <td class="${
                  voter.turnout_status === "will_vote"
                    ? "turnout-will"
                    : voter.turnout_status === "already_voted"
                    ? "turnout-voted"
                    : voter.turnout_status === "wont_vote"
                    ? "turnout-wont"
                    : ""
                }">
                  ${
                    voter.turnout_status
                      ? voter.turnout_status.replace("_", " ")
                      : "-"
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Stats
  const totalBooths = stations.reduce(
    (sum, s) => sum + (s.booth_count || 0),
    0
  );
  const totalVoters = stations.reduce(
    (sum, s) => sum + (s.voter_count || 0),
    0
  );

  const boothRowsSorted = [...boothRows].sort((a, b) => {
    const aVal = a.turnout_coverage_percent ?? Number.POSITIVE_INFINITY;
    const bVal = b.turnout_coverage_percent ?? Number.POSITIVE_INFINITY;
    return aVal - bVal;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Polling Stations
            </h1>
            {!isOnline && (
              <Badge variant="destructive" className="text-[10px]">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {isOnline && (stationsErrorObj || boothStatsErrorObj) && (
              <Badge
                variant="outline"
                className="text-[10px] text-orange-600 border-orange-600"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Connection Issues
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {stations.length} station{stations.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStations();
            refetchBoothStats();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="polling-stations" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            Polling Stations
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          {/* Quick Stats */}
          {!loading && stations.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold">{stations.length}</p>
                      <p className="text-xs text-muted-foreground">Stations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Vote className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-lg font-bold">{totalBooths}</p>
                      <p className="text-xs text-muted-foreground">Booths</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-lg font-bold">
                        {totalVoters.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Voters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Booth Intelligence */}
          {(boothStatsLoading ||
            boothStatsError ||
            boothSummary ||
            boothRows.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    Booth Intelligence
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Booth-wise campaign health (coverage, support, turnout)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchBoothStats()}
                  disabled={boothStatsLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>

              {boothStatsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{boothStatsError}</AlertDescription>
                </Alert>
              )}

              {boothStatsLoading && (
                <div className="border rounded-lg p-6 text-sm text-muted-foreground">
                  Loading booth stats...
                </div>
              )}

              {!boothStatsLoading && boothSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Total Booths
                      </p>
                      <p className="text-lg font-bold">
                        {boothSummary.total_booths}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Total Voters
                      </p>
                      <p className="text-lg font-bold">
                        {boothSummary.total_voters?.toLocaleString?.() ??
                          boothSummary.total_voters}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Turnout Coverage
                      </p>
                      <p className="text-lg font-bold">
                        {typeof boothSummary.turnout?.coverage_percent ===
                        "number"
                          ? `${boothSummary.turnout.coverage_percent.toFixed(
                              1
                            )}%`
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        Net Margin
                      </p>
                      <p className="text-lg font-bold">
                        {typeof boothSummary.sentiment?.net_margin === "number"
                          ? boothSummary.sentiment.net_margin.toLocaleString()
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!boothStatsLoading &&
                !boothStatsError &&
                boothRows.length === 0 && (
                  <div className="border rounded-lg p-6 text-sm text-muted-foreground">
                    No booth stats returned for this list.
                  </div>
                )}

              {!boothStatsLoading && boothRows.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booth</TableHead>
                        <TableHead>Ward</TableHead>
                        <TableHead className="text-right">Voters</TableHead>
                        <TableHead className="text-right">Support %</TableHead>
                        <TableHead className="text-right">Coverage %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boothRowsSorted.map((row, idx) => {
                        const boothLabel =
                          row.booth_code ||
                          row.code ||
                          row.booth_name ||
                          row.name ||
                          `Booth ${idx + 1}`;
                        const votersCount = row.total_voters ?? row.voter_count;
                        return (
                          <TableRow
                            key={`${
                              row.polling_booth_id ?? row.booth_id ?? boothLabel
                            }-${idx}`}
                          >
                            <TableCell className="font-medium">
                              {boothLabel}
                            </TableCell>
                            <TableCell>{row.ward_no ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              {typeof votersCount === "number"
                                ? votersCount.toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof row.support_percent === "number"
                                ? `${row.support_percent.toFixed(1)}%`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof row.turnout_coverage_percent === "number"
                                ? `${row.turnout_coverage_percent.toFixed(1)}%`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Polling Stations Tab */}
        <TabsContent value="polling-stations" className="space-y-4 mt-4">
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchStations()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Search with clear button and result count */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by station name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedSearch && (
              <p className="text-sm text-muted-foreground">
                {sortedStations.length} of {stations.length} stations
              </p>
            )}
          </div>

          {/* Content */}
          {loading ? (
            /* Skeleton Loading Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedStations.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {stations.length === 0
                  ? "No polling stations found"
                  : "No matching stations"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {stations.length === 0
                  ? "Polling station data will appear once voter data is imported"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStations.map((station) => {
                const psCodeValue = String(station.polling_station_id);
                const isExpanded = expandedPsCode === psCodeValue;

                return (
                  <Card
                    key={station.polling_station_id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                      isExpanded ? "ring-2 ring-primary shadow-md" : ""
                    }`}
                    onClick={() =>
                      setExpandedPsCodeParam(isExpanded ? null : psCodeValue)
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                              isExpanded
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10"
                            }`}
                          >
                            <MapPin
                              className={`h-5 w-5 ${
                                isExpanded ? "" : "text-primary"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">
                              {debouncedSearch ? (
                                <HighlightText
                                  text={station.name}
                                  highlight={debouncedSearch}
                                />
                              ) : (
                                station.name
                              )}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">
                              Code:{" "}
                              {debouncedSearch ? (
                                <HighlightText
                                  text={station.code}
                                  highlight={debouncedSearch}
                                />
                              ) : (
                                station.code
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${
                            isExpanded ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Vote className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">
                            {station.booth_count}
                          </span>
                          <span className="text-muted-foreground">Booths</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">
                            {station.voter_count.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">Voters</span>
                        </div>
                      </div>
                      {/* Voters per booth indicator */}
                      {station.booth_count > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>
                              ~
                              {Math.round(
                                station.voter_count / station.booth_count
                              )}{" "}
                              voters/booth
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              (station.voter_count /
                                (station.booth_count * 500)) *
                                100,
                              100
                            )}
                            className="h-1"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Expanded Station Detail */}
          {expandedPsCode && (
            <div ref={expandedDetailRef} className="scroll-mt-20">
              <Card className="border-primary/30">
                <CardContent className="p-4 space-y-3">
                  {(() => {
                    const station = sortedStations.find(
                      (s) => String(s.polling_station_id) === expandedPsCode
                    );
                    const sortedExpandedBooths = [...expandedBooths].sort(
                      (a, b) => {
                        const aVal = (a.code || "").toLowerCase();
                        const bVal = (b.code || "").toLowerCase();
                        return aVal.localeCompare(bVal);
                      }
                    );

                    return (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {expandedStation?.name || station?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Station Code:{" "}
                                {expandedStation?.code || station?.code}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchExpandedStation();
                              }}
                              disabled={expandedStationLoading}
                            >
                              <RefreshCw
                                className={`h-4 w-4 mr-1 ${
                                  expandedStationLoading ? "animate-spin" : ""
                                }`}
                              />
                              Refresh
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPsCodeParam(null);
                              }}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {expandedStationError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {expandedStationError}
                            </AlertDescription>
                          </Alert>
                        )}

                        {expandedStationLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : !expandedStation ? (
                          <div className="border rounded-lg p-6 text-sm text-muted-foreground">
                            Station details not loaded.
                          </div>
                        ) : (
                          <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <Card>
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Vote className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="text-lg font-bold">
                                        {expandedStation.booth_count}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Polling Booths
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <div>
                                      <p className="text-lg font-bold">
                                        {expandedStation.voter_count.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Total Voters
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <Tabs
                              value={activeBoothTab}
                              onValueChange={handleBoothTabChange}
                              className="w-full"
                            >
                              <TabsList className="w-full justify-start overflow-x-auto">
                                {sortedExpandedBooths.map((booth) => {
                                  const isLoadingBooth =
                                    loadingVotersMap[booth.polling_booth_id];
                                  return (
                                    <TabsTrigger
                                      key={booth.polling_booth_id}
                                      value={String(booth.polling_booth_id)}
                                      className="gap-1.5 relative"
                                    >
                                      {isLoadingBooth ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Vote className="h-3.5 w-3.5" />
                                      )}
                                      {booth.name}
                                      <Badge
                                        variant="secondary"
                                        className="ml-1 text-[10px] px-1.5 py-0"
                                      >
                                        {booth.voter_count}
                                      </Badge>
                                    </TabsTrigger>
                                  );
                                })}
                              </TabsList>

                              {/* Individual Booth Tabs */}
                              {sortedExpandedBooths.map((booth) => {
                                const boothId = booth.polling_booth_id;
                                const voters = boothVotersMap[boothId] || [];
                                const boothDetails = boothDetailsMap[boothId];
                                const loading =
                                  loadingVotersMap[boothId] || false;
                                const currentPage = voterPageMap[boothId] || 1;
                                const totalVoters = voterTotalMap[boothId] || 0;
                                const totalPages = getTotalVoterPages(boothId);

                                // Get sentiment and turnout counts from booth details
                                const sentimentCounts =
                                  boothDetails?.sentiment_counts;
                                const turnoutCounts =
                                  boothDetails?.turnout_counts;

                                return (
                                  <TabsContent
                                    key={boothId}
                                    value={String(boothId)}
                                    className="mt-4"
                                  >
                                    <Card>
                                      <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-base">
                                            Voters in {booth.name}
                                          </CardTitle>
                                          <div className="flex items-center gap-2">
                                            {voters.length > 0 && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  exportBoothVoters(
                                                    booth,
                                                    voters
                                                  )
                                                }
                                                className="gap-1.5"
                                              >
                                                <Download className="h-4 w-4" />
                                                Export PDF
                                              </Button>
                                            )}
                                            {totalVoters > 0 && (
                                              <Badge variant="secondary">
                                                {totalVoters.toLocaleString()}{" "}
                                                voters
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-0">
                                        {loading ? (
                                          <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                          </div>
                                        ) : voters.length === 0 ? (
                                          <div className="p-12 text-center text-muted-foreground">
                                            No voters found
                                          </div>
                                        ) : (
                                          <>
                                            {/* Sentiment & Turnout Stats */}
                                            {(sentimentCounts ||
                                              turnoutCounts) && (
                                              <div className="p-4 border-t grid grid-cols-2 gap-4">
                                                {/* Sentiment Counts */}
                                                {sentimentCounts && (
                                                  <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                      Sentiment
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {(sentimentCounts.support ??
                                                        0) > 0 && (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                          Support:{" "}
                                                          {
                                                            sentimentCounts.support
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(sentimentCounts.oppose ??
                                                        0) > 0 && (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                          Oppose:{" "}
                                                          {
                                                            sentimentCounts.oppose
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(sentimentCounts.swing ??
                                                        0) > 0 && (
                                                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                          Swing:{" "}
                                                          {
                                                            sentimentCounts.swing
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(sentimentCounts.neutral ??
                                                        0) > 0 && (
                                                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                                                          Neutral:{" "}
                                                          {
                                                            sentimentCounts.neutral
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(sentimentCounts.unknown ??
                                                        0) > 0 && (
                                                        <Badge variant="outline">
                                                          Unknown:{" "}
                                                          {
                                                            sentimentCounts.unknown
                                                          }
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                                {/* Turnout Counts */}
                                                {turnoutCounts && (
                                                  <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                      Turnout
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {(turnoutCounts.will_vote ??
                                                        0) > 0 && (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                          Will Vote:{" "}
                                                          {
                                                            turnoutCounts.will_vote
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.already_voted ??
                                                        0) > 0 && (
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                          Voted:{" "}
                                                          {
                                                            turnoutCounts.already_voted
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.wont_vote ??
                                                        0) > 0 && (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                          Won't Vote:{" "}
                                                          {
                                                            turnoutCounts.wont_vote
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.unsure ??
                                                        0) > 0 && (
                                                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                          Unsure:{" "}
                                                          {turnoutCounts.unsure}
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.not_home ??
                                                        0) > 0 && (
                                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                                          Not Home:{" "}
                                                          {
                                                            turnoutCounts.not_home
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.needs_transport ??
                                                        0) > 0 && (
                                                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                                          Needs Transport:{" "}
                                                          {
                                                            turnoutCounts.needs_transport
                                                          }
                                                        </Badge>
                                                      )}
                                                      {(turnoutCounts.unmarked ??
                                                        0) > 0 && (
                                                        <Badge variant="outline">
                                                          Unmarked:{" "}
                                                          {
                                                            turnoutCounts.unmarked
                                                          }
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            <div className="border-t">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead className="w-16">
                                                      S.No
                                                    </TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead className="w-20">
                                                      Age
                                                    </TableHead>
                                                    <TableHead className="w-20">
                                                      Gender
                                                    </TableHead>
                                                    <TableHead>
                                                      House No
                                                    </TableHead>
                                                    <TableHead className="w-24">
                                                      Sentiment
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                      Turnout
                                                    </TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {voters.map((voter) => (
                                                    <TableRow
                                                      key={voter.voter_id}
                                                    >
                                                      <TableCell className="font-mono text-xs">
                                                        {voter.serial_no}
                                                      </TableCell>
                                                      <TableCell>
                                                        <div className="flex items-center gap-2">
                                                          <Link
                                                            href={`/voters-management/voters/${voter.voter_id}`}
                                                            className="hover:underline text-primary flex-1 min-w-0 truncate"
                                                          >
                                                            {voter.name}
                                                          </Link>
                                                          {voter.mobile && (
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                  `tel:${voter.mobile}`,
                                                                  "_self"
                                                                );
                                                              }}
                                                              className="h-7 w-7 rounded flex items-center justify-center bg-green-600 hover:bg-green-700 text-white transition-colors shrink-0"
                                                              title="Call voter"
                                                            >
                                                              <Phone className="h-4 w-4" />
                                                            </button>
                                                          )}
                                                        </div>
                                                      </TableCell>
                                                      <TableCell>
                                                        {voter.age}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Badge
                                                          variant="outline"
                                                          className={
                                                            voter.gender ===
                                                              "Male" ||
                                                            voter.gender ===
                                                              "पु"
                                                              ? "border-blue-300 text-blue-700"
                                                              : "border-pink-300 text-pink-700"
                                                          }
                                                        >
                                                          {voter.gender === "पु"
                                                            ? "Male"
                                                            : voter.gender ===
                                                              "म"
                                                            ? "Female"
                                                            : voter.gender}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell>
                                                        {voter.house_no}
                                                      </TableCell>
                                                      <TableCell>
                                                        {voter.sentiment ? (
                                                          <Badge
                                                            variant="secondary"
                                                            className={
                                                              voter.sentiment ===
                                                              "support"
                                                                ? "bg-green-100 text-green-700"
                                                                : voter.sentiment ===
                                                                  "oppose"
                                                                ? "bg-red-100 text-red-700"
                                                                : voter.sentiment ===
                                                                  "swing"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                            }
                                                          >
                                                            {voter.sentiment ===
                                                            "support"
                                                              ? "Support"
                                                              : voter.sentiment ===
                                                                "oppose"
                                                              ? "Oppose"
                                                              : voter.sentiment ===
                                                                "swing"
                                                              ? "Swing"
                                                              : voter.sentiment}
                                                          </Badge>
                                                        ) : (
                                                          <span className="text-xs text-muted-foreground">
                                                            —
                                                          </span>
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        {voter.turnout_status ? (
                                                          <Badge
                                                            variant="secondary"
                                                            className={
                                                              voter.turnout_status ===
                                                              "will_vote"
                                                                ? "bg-green-100 text-green-700"
                                                                : voter.turnout_status ===
                                                                  "already_voted"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : voter.turnout_status ===
                                                                  "wont_vote"
                                                                ? "bg-red-100 text-red-700"
                                                                : voter.turnout_status ===
                                                                  "unsure"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                            }
                                                          >
                                                            {voter.turnout_status ===
                                                            "will_vote"
                                                              ? "Will Vote"
                                                              : voter.turnout_status ===
                                                                "already_voted"
                                                              ? "Voted"
                                                              : voter.turnout_status ===
                                                                "wont_vote"
                                                              ? "Won't Vote"
                                                              : voter.turnout_status ===
                                                                "unsure"
                                                              ? "Unsure"
                                                              : voter.turnout_status}
                                                          </Badge>
                                                        ) : (
                                                          <span className="text-xs text-muted-foreground">
                                                            Not marked
                                                          </span>
                                                        )}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                );
                              })}
                            </Tabs>
                          </>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
