"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListContext } from "@/contexts/list-context";
import { api, type Voter } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  Search,
  Home,
  MapPin,
  User,
  RefreshCw,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotVotedYetPage() {
  const { currentList } = useListContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");

  // Fetch all voters
  const {
    data: votersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["voters", currentList?.list_id, "not-voted"],
    queryFn: () =>
      api.getVoters(
        1, // page
        10000, // perPage - get all voters
        currentList!.list_id // listId
      ),
    enabled: !!currentList?.list_id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter only voters who haven't voted yet
  const notVotedVoters = useMemo(() => {
    if (!votersData?.voters) return [];
    return votersData.voters.filter(
      (voter) =>
        !voter.turnout_status ||
        voter.turnout_status === "will_vote" ||
        voter.turnout_status === "needs_transport" ||
        voter.turnout_status === "unsure" ||
        voter.turnout_status === "not_home"
    );
  }, [votersData]);

  // Get unique wards
  const wards = useMemo(
    () =>
      Array.from(new Set(notVotedVoters.map((v) => String(v.ward_no)))).sort(),
    [notVotedVoters]
  );

  // Filter voters based on search and ward
  const filteredVoters = useMemo(() => {
    let filtered = notVotedVoters;

    if (selectedWard !== "all") {
      filtered = filtered.filter((v) => String(v.ward_no) === selectedWard);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.relative_name.toLowerCase().includes(query) ||
          v.house_no.toLowerCase().includes(query) ||
          String(v.ward_no).includes(query) ||
          (v.mobile && v.mobile.includes(query))
      );
    }

    return filtered;
  }, [notVotedVoters, selectedWard, searchQuery]);

  const handleCall = (mobile: string | null | undefined) => {
    if (mobile) {
      window.open(`tel:${mobile}`, "_self");
    }
  };

  if (!currentList) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-2xl">
          Please select a voter list
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* URGENT HEADER */}
      <div className="sticky top-0 z-10 bg-red-600 text-white shadow-lg rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold uppercase">
                Voters Not Voted Yet
              </h1>
              <p className="text-lg font-semibold mt-1">
                {filteredVoters.length.toLocaleString()} Voters Pending
              </p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="secondary" size="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Timer showing current time */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleTimeString("en-IN")}</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, house, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Ward Filter */}
            <div>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full h-10 px-3 text-sm border rounded-md bg-background"
              >
                <option value="all">All Wards ({notVotedVoters.length})</option>
                {wards.map((ward) => {
                  const wardCount = notVotedVoters.filter(
                    (v) => String(v.ward_no) === ward
                  ).length;
                  return (
                    <option key={ward} value={ward}>
                      Ward {ward} ({wardCount})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voter List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredVoters.length > 0 ? (
        <div className="space-y-3">
          {filteredVoters.map((voter) => (
            <Card
              key={voter.voter_id}
              className={cn(
                "border-l-8 hover:shadow-lg transition-shadow",
                voter.sentiment === "support"
                  ? "border-l-red-600 bg-red-50"
                  : voter.sentiment === "swing"
                  ? "border-l-yellow-600 bg-yellow-50"
                  : "border-l-gray-400"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Voter Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">
                        {voter.name}
                      </h3>
                      {voter.sentiment === "support" && (
                        <Badge className="bg-red-600 text-white text-xs">
                          SUPPORTER
                        </Badge>
                      )}
                      {voter.sentiment === "swing" && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          SWING
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {voter.relative_name}
                    </p>

                    {/* Details */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4" />
                        <span className="font-semibold">
                          House: {voter.house_no}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>Ward: {voter.ward_no}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>
                          {voter.age} years • {voter.gender}
                        </span>
                      </div>
                      {voter.mobile && (
                        <div className="flex items-center gap-2 text-sm font-mono">
                          <Phone className="h-4 w-4" />
                          {voter.mobile}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Button */}
                  {voter.mobile && (
                    <Button
                      onClick={() => handleCall(voter.mobile)}
                      size="default"
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-xl font-bold text-green-600 mb-2">
                ALL VOTERS HAVE VOTED!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery.trim()
                  ? `No results for "${searchQuery}"`
                  : "Great job! Keep monitoring."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
