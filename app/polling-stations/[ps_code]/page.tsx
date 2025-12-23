"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  type PollingStation,
  type PollingBooth,
  type Voter,
} from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  ChevronLeft,
  ChevronRight,
  Vote,
  ArrowLeft,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";

type SortKey = "code" | "name" | "voter_count";
type SortDir = "asc" | "desc";

export default function PollingStationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stationId = params.ps_code as string;
  const { selectedListId, isLoading: listLoading } = useListContext();

  const [station, setStation] = useState<PollingStation | null>(null);
  const [booths, setBooths] = useState<PollingBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Booth detail expansion
  const [expandedBooth, setExpandedBooth] = useState<number | null>(null);
  const [boothVoters, setBoothVoters] = useState<Voter[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [voterPage, setVoterPage] = useState(1);
  const [voterTotal, setVoterTotal] = useState(0);
  const votersPerPage = 20;

  const fetchStation = useCallback(async () => {
    if (!selectedListId || !stationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getPollingStation(stationId, selectedListId);
      setStation(data.station);
      setBooths(data.station.booths || []);
    } catch (err) {
      console.error("Failed to fetch polling station:", err);
      setError(
        "Unable to fetch polling station details. Please check your API connection."
      );
      setStation(null);
      setBooths([]);
    } finally {
      setLoading(false);
    }
  }, [selectedListId, stationId]);

  useEffect(() => {
    if (selectedListId && !listLoading && stationId) {
      fetchStation();
    }
  }, [selectedListId, listLoading, stationId, fetchStation]);

  const fetchBoothVoters = useCallback(
    async (boothId: number, page: number = 1) => {
      if (!selectedListId) return;

      try {
        setLoadingVoters(true);
        const data = await api.getPollingBooth(boothId, selectedListId, {
          include_voters: true,
          page,
          per_page: votersPerPage,
        });
        setBoothVoters(data.voters || []);
        setVoterTotal(data.meta?.total || data.booth.voter_count || 0);
        setVoterPage(page);
      } catch (err) {
        console.error("Failed to fetch booth voters:", err);
      } finally {
        setLoadingVoters(false);
      }
    },
    [selectedListId]
  );

  const toggleBoothExpand = (boothId: number) => {
    if (expandedBooth === boothId) {
      setExpandedBooth(null);
      setBoothVoters([]);
    } else {
      setExpandedBooth(boothId);
      fetchBoothVoters(boothId, 1);
    }
  };

  // Sort booths
  const sortedBooths = [...booths].sort((a, b) => {
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

  const totalVoterPages = Math.ceil(voterTotal / votersPerPage);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchStation}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-4 md:p-6">
        <div className="border rounded-lg p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            Polling station not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Back button & Header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/polling-stations")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stations
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              {station.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Station Code: {station.code}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStation}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-lg font-bold">{station.booth_count}</p>
                <p className="text-xs text-muted-foreground">Polling Booths</p>
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
                  {station.voter_count.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Voters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booths Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Polling Booths
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedBooths.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No booths found for this station
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("code")}
                  >
                    Booth Code
                    <SortIndicator columnKey="code" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Booth Name
                    <SortIndicator columnKey="name" />
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
                {sortedBooths.map((booth) => (
                  <>
                    <TableRow
                      key={booth.polling_booth_id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleBoothExpand(booth.polling_booth_id)}
                    >
                      <TableCell className="font-mono text-sm">
                        {booth.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Vote className="h-4 w-4 text-muted-foreground" />
                          {booth.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {booth.voter_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedBooth === booth.polling_booth_id
                              ? "rotate-90"
                              : ""
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                    {expandedBooth === booth.polling_booth_id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-sm">
                                Voters in {booth.name}
                              </h4>
                              {voterTotal > 0 && (
                                <Badge variant="secondary">
                                  {voterTotal.toLocaleString()} voters
                                </Badge>
                              )}
                            </div>
                            {loadingVoters ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : boothVoters.length === 0 ? (
                              <div className="text-center py-6 text-muted-foreground text-sm">
                                No voters found
                              </div>
                            ) : (
                              <>
                                <div className="border rounded-lg overflow-hidden">
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
                                        <TableHead>House No</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {boothVoters.map((voter) => (
                                        <TableRow key={voter.voter_id}>
                                          <TableCell className="font-mono text-xs">
                                            {voter.serial_no}
                                          </TableCell>
                                          <TableCell>
                                            <Link
                                              href={`/voters/${voter.serial_no}`}
                                              className="hover:underline text-primary"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              {voter.name}
                                            </Link>
                                          </TableCell>
                                          <TableCell>{voter.age}</TableCell>
                                          <TableCell>{voter.gender}</TableCell>
                                          <TableCell>
                                            {voter.house_no}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {/* Pagination */}
                                {totalVoterPages > 1 && (
                                  <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-muted-foreground">
                                      Page {voterPage} of {totalVoterPages}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetchBoothVoters(
                                            booth.polling_booth_id,
                                            voterPage - 1
                                          );
                                        }}
                                        disabled={voterPage <= 1}
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetchBoothVoters(
                                            booth.polling_booth_id,
                                            voterPage + 1
                                          );
                                        }}
                                        disabled={voterPage >= totalVoterPages}
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
