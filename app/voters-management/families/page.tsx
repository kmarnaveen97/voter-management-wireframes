"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useListContext } from "@/contexts/list-context";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function HouseholdsPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [wards, setWards] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<
    "ward_no" | "house_no" | "mukhiya_name" | "member_count"
  >("ward_no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Sorted families
  const sortedFamilies = useMemo(() => {
    return [...families].sort((a, b) => {
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
  }, [families, sortKey, sortDir]);

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

  // Stats
  const totalMembers = families.reduce(
    (sum, f) => sum + (f.member_count || 0),
    0
  );
  const avgMembers =
    families.length > 0 ? (totalMembers / families.length).toFixed(1) : "0";
  const largestFamily =
    families.length > 0
      ? Math.max(...families.map((f) => f.member_count || 0))
      : 0;

  const fetchWards = useCallback(async (listId?: number) => {
    try {
      const data = await api.getWardStats(listId);
      const wardNumbers = data.wards?.map((w) => w.ward_no) || [];
      setWards(wardNumbers);
    } catch {
      setWards([]);
    }
  }, []);

  const fetchFamilies = useCallback(
    async (page: number, append: boolean = false, listId?: number) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const data = await api.getFamilies(page, PAGE_SIZE, listId);
        let newFamilies = data.families || [];

        // Filter by ward if selected
        if (selectedWard !== "all") {
          newFamilies = newFamilies.filter(
            (f: Family) => f.ward_no === selectedWard
          );
        }

        // Filter by search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          newFamilies = newFamilies.filter(
            (f: Family) =>
              f.house_no?.toLowerCase().includes(q) ||
              f.mukhiya_name?.toLowerCase().includes(q)
          );
        }

        if (append) {
          setFamilies((prev) => [...prev, ...newFamilies]);
        } else {
          setFamilies(newFamilies);
        }

        setTotalFamilies(data.total || 0);
        setHasMore((data.families?.length || 0) >= PAGE_SIZE);
      } catch {
        setError("Unable to fetch households.");
        if (!append) {
          setFamilies([]);
          setTotalFamilies(0);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedWard, searchQuery]
  );

  useEffect(() => {
    if (selectedListId && !listLoading) {
      fetchWards(selectedListId);
    }
  }, [selectedListId, listLoading, fetchWards]);

  useEffect(() => {
    if (selectedListId && !listLoading) {
      setCurrentPage(1);
      setFamilies([]);
      setHasMore(true);
      fetchFamilies(1, false, selectedListId);
    }
  }, [selectedListId, listLoading, selectedWard, searchQuery]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !selectedListId) return;
    setCurrentPage((prev) => {
      const nextPage = prev + 1;
      fetchFamilies(nextPage, true, selectedListId);
      return nextPage;
    });
  }, [loadingMore, hasMore, fetchFamilies, selectedListId]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMore,
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Home className="h-5 w-5 text-muted-foreground" />
            Households
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalFamilies.toLocaleString()} households
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Quick Stats */}
      {!loading && families.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{families.length}</p>
                  <p className="text-xs text-muted-foreground">Showing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{totalMembers}</p>
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
              onClick={() => fetchFamilies(1, false, selectedListId)}
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
            placeholder="Search by house # or head name..."
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
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : families.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Home className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            No households found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your filters
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
                {sortedFamilies.map((family, index) => {
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

          <div ref={sentinelRef} className="h-2" />

          {loadingMore && (
            <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading more...
            </div>
          )}

          {!hasMore && families.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing all {families.length.toLocaleString()} households
            </p>
          )}
        </>
      )}
    </div>
  );
}
