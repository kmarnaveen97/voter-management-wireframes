"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Family } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileDown,
  TreeDeciduous,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  WifiOff,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";
import Link from "next/link";

const BATCH_SIZE = 500;
const ITEMS_PER_PAGE = 50;

export default function HouseholdsPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  // All families data (fetched in batches)
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalToFetch, setTotalToFetch] = useState(0);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Frontend pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [sortKey, setSortKey] = useState<
    "ward_no" | "house_no" | "mukhiya_name" | "member_count"
  >("ward_no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Network monitoring state
  const [isOnline, setIsOnline] = useState(true);

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

  // Fetch all families in batches
  const fetchAllFamilies = async (listId: number) => {
    setIsFetchingAll(true);
    setFetchComplete(false);
    setError(null);
    setAllFamilies([]);
    setLoadingProgress(0);

    try {
      // First fetch to get total count
      const firstBatch = await api.getFamilies(1, BATCH_SIZE, listId);
      const total = firstBatch.total || 0;
      setTotalToFetch(total);

      if (total === 0) {
        setFetchComplete(true);
        setIsFetchingAll(false);
        return;
      }

      let allData: Family[] = [...(firstBatch.families || [])];
      setAllFamilies(allData);
      setLoadingProgress(Math.min(100, (allData.length / total) * 100));

      // Calculate remaining pages
      const totalPages = Math.ceil(total / BATCH_SIZE);

      // Fetch remaining batches
      for (let page = 2; page <= totalPages; page++) {
        const batch = await api.getFamilies(page, BATCH_SIZE, listId);
        const newFamilies = batch.families || [];

        if (newFamilies.length === 0) break;

        allData = [...allData, ...newFamilies];
        setAllFamilies(allData);
        setLoadingProgress(Math.min(100, (allData.length / total) * 100));
      }

      setFetchComplete(true);
    } catch (err) {
      console.error("Failed to fetch families:", err);
      setError("Failed to load households. Please try again.");
    } finally {
      setIsFetchingAll(false);
    }
  };

  // Auto-fetch when list changes
  useEffect(() => {
    if (selectedListId && !listLoading) {
      fetchAllFamilies(selectedListId);
    }
  }, [selectedListId, listLoading]);

  // Extract unique wards from data
  const wards = useMemo(() => {
    const wardSet = new Set(allFamilies.map((f) => f.ward_no));
    return Array.from(wardSet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [allFamilies]);

  // Filter families
  const filteredFamilies = useMemo(() => {
    let result = [...allFamilies];

    // Filter by ward
    if (selectedWard !== "all") {
      result = result.filter((f) => f.ward_no === selectedWard);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.house_no?.toLowerCase().includes(q) ||
          f.mukhiya_name?.toLowerCase().includes(q) ||
          f.ward_no?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allFamilies, selectedWard, searchQuery]);

  // Sort families
  const sortedFamilies = useMemo(() => {
    return [...filteredFamilies].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case "ward_no":
          aVal = parseInt(a.ward_no) || 0;
          bVal = parseInt(b.ward_no) || 0;
          break;
        case "house_no":
          aVal = parseInt(a.house_no) || 0;
          bVal = parseInt(b.house_no) || 0;
          break;
        case "mukhiya_name":
          aVal = (a.mukhiya_name || "").toLowerCase();
          bVal = (b.mukhiya_name || "").toLowerCase();
          break;
        case "member_count":
          aVal = a.member_count || 0;
          bVal = b.member_count || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredFamilies, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sortedFamilies.length / ITEMS_PER_PAGE);
  const paginatedFamilies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFamilies.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFamilies, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedWard, sortKey, sortDir]);

  // Toggle sort
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Sort indicator component
  const SortIcon = ({ column }: { column: typeof sortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // Stats from filtered data
  const totalMembers = filteredFamilies.reduce(
    (sum, f) => sum + (f.member_count || 0),
    0
  );
  const avgMembers =
    filteredFamilies.length > 0
      ? (totalMembers / filteredFamilies.length).toFixed(1)
      : "0";
  const largestFamily =
    filteredFamilies.length > 0
      ? Math.max(...filteredFamilies.map((f) => f.member_count || 0))
      : 0;

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  const isLoading = isFetchingAll && allFamilies.length === 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              Households
            </h1>
            {!isOnline && (
              <Badge variant="destructive" className="text-[10px]">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {fetchComplete
              ? `${allFamilies.length.toLocaleString()} households loaded`
              : isFetchingAll
              ? `Loading... ${allFamilies.length.toLocaleString()} of ${totalToFetch.toLocaleString()}`
              : "Loading households..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedListId && fetchAllFamilies(selectedListId)}
            disabled={isFetchingAll}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isFetchingAll ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Link href="/voters-management/family-mapping">
            <Button size="sm">
              <TreeDeciduous className="h-4 w-4 mr-1" />
              Family Trees
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading Progress */}
      {isFetchingAll && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Loading households in batches...
            </span>
            <span className="font-medium">{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )}

      {/* Quick Stats */}
      {fetchComplete && filteredFamilies.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">
                    {filteredFamilies.length.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedWard !== "all" || searchQuery
                      ? "Filtered"
                      : "Total"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">
                    {totalMembers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{avgMembers}</p>
                  <p className="text-xs text-muted-foreground">Avg/House</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{largestFamily}</p>
                  <p className="text-xs text-muted-foreground">Largest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedListId && fetchAllFamilies(selectedListId)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by house #, ward, or head name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={selectedWard} onValueChange={setSelectedWard}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {wards.map((ward) => (
              <SelectItem key={ward} value={ward}>
                Ward {ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedWard !== "all" || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedWard("all");
            }}
            className="h-9"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Loading households...
            </p>
          </div>
        </div>
      ) : sortedFamilies.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Home className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            No households found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {allFamilies.length > 0
              ? "Try adjusting your filters"
              : "No data available"}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    className="w-16 font-medium cursor-pointer hover:bg-muted/80 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("ward_no")}
                  >
                    <div className="flex items-center">
                      Ward
                      <SortIcon column="ward_no" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-20 font-medium cursor-pointer hover:bg-muted/80 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("house_no")}
                  >
                    <div className="flex items-center">
                      House
                      <SortIcon column="house_no" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("mukhiya_name")}
                  >
                    <div className="flex items-center">
                      Head of Household
                      <SortIcon column="mukhiya_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-20 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("member_count")}
                  >
                    <div className="flex items-center">
                      Members
                      <SortIcon column="member_count" />
                    </div>
                  </TableHead>
                  <TableHead className="w-24 font-medium hidden md:table-cell">
                    Gender
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFamilies.map((family, index) => {
                  // Calculate gender counts from members if available
                  const maleCount =
                    family.members?.filter((m) =>
                      ["Male", "पु", "M", "m"].includes(m.gender)
                    ).length || 0;
                  const femaleCount =
                    family.members?.filter((m) =>
                      ["Female", "म", "F", "f"].includes(m.gender)
                    ).length || 0;
                  return (
                    <TableRow
                      key={`${family.ward_no}-${family.house_no}-${index}`}
                      className="group"
                    >
                      <TableCell className="font-mono text-sm hidden sm:table-cell">
                        {family.ward_no}
                      </TableCell>
                      <TableCell className="font-mono text-sm hidden sm:table-cell">
                        {family.house_no}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {family.mukhiya_name || "—"}
                        </div>
                        {family.mukhiya_age && (
                          <div className="text-xs text-muted-foreground">
                            Age {family.mukhiya_age}
                          </div>
                        )}
                        {/* Mobile Details */}
                        <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1"
                          >
                            W-{family.ward_no}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1"
                          >
                            H-{family.house_no}
                          </Badge>
                          {(maleCount > 0 || femaleCount > 0) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1"
                            >
                              {maleCount > 0 ? `${maleCount}M` : ""}
                              {maleCount > 0 && femaleCount > 0 ? " " : ""}
                              {femaleCount > 0 ? `${femaleCount}F` : ""}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {family.member_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-1">
                          {maleCount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                            >
                              {maleCount}M
                            </Badge>
                          )}
                          {femaleCount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-pink-50 text-pink-600 border-pink-200"
                            >
                              {femaleCount}F
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/voters-management/family-mapping?ward=${family.ward_no}&house=${family.house_no}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                {((currentPage - 1) * ITEMS_PER_PAGE + 1).toLocaleString()} to{" "}
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  sortedFamilies.length
                ).toLocaleString()}{" "}
                of {sortedFamilies.length.toLocaleString()} households
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {renderPaginationButtons()}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {totalPages <= 1 && sortedFamilies.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing all {sortedFamilies.length.toLocaleString()} households
            </p>
          )}
        </>
      )}
    </div>
  );
}
