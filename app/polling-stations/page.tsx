"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type PollingStation } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  Search,
  MapPin,
  ChevronRight,
  Vote,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";

type SortKey = "code" | "name" | "booth_count" | "voter_count";
type SortDir = "asc" | "desc";

export default function PollingStationsPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  const [stations, setStations] = useState<PollingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchStations = useCallback(async () => {
    if (!selectedListId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getPollingStations(selectedListId);
      setStations(data.stations || []);
    } catch (err) {
      console.error("Failed to fetch polling stations:", err);
      setError(
        "Unable to fetch polling stations. Please check your API connection."
      );
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    if (selectedListId && !listLoading) {
      fetchStations();
    }
  }, [selectedListId, listLoading, fetchStations]);

  // Filter stations by search query
  const filteredStations = stations.filter((s) =>
    searchQuery
      ? s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Stats
  const totalBooths = stations.reduce(
    (sum, s) => sum + (s.booth_count || 0),
    0
  );
  const totalVoters = stations.reduce(
    (sum, s) => sum + (s.voter_count || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Polling Stations
          </h1>
          <p className="text-sm text-muted-foreground">
            {stations.length} station{stations.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStations}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

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

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchStations}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by station name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("code")}
                >
                  Code
                  <SortIndicator columnKey="code" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  Station Name
                  <SortIndicator columnKey="name" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("booth_count")}
                >
                  Booths
                  <SortIndicator columnKey="booth_count" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("voter_count")}
                >
                  Voters
                  <SortIndicator columnKey="voter_count" />
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStations.map((station) => (
                <TableRow key={station.polling_station_id} className="group">
                  <TableCell className="font-mono text-sm">
                    {station.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {station.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {station.booth_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {station.voter_count.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/polling-stations/${station.polling_station_id}`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
