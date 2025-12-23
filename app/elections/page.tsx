"use client";

import { useEffect, useState, useCallback } from "react";
import { CandidateCard } from "@/components/elections/candidate-card";
import { AddCandidateDialog } from "@/components/elections/add-candidate-dialog";
import { api, type Candidate } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Vote,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useListContext } from "@/contexts/list-context";

export default function ElectionsPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [wards, setWards] = useState<string[]>([]);

  const fetchCandidates = useCallback(async () => {
    if (!selectedListId) return;

    try {
      setLoading(true);
      setError(null);
      const filters: {
        list_id: number;
        status?: "active" | "withdrawn" | "disqualified";
        ward_no?: string;
      } = {
        list_id: selectedListId,
      };
      if (statusFilter !== "all") {
        filters.status = statusFilter as
          | "active"
          | "withdrawn"
          | "disqualified";
      }
      if (wardFilter !== "all") {
        filters.ward_no = wardFilter;
      }
      const data = await api.getCandidates(filters);
      setCandidates(data.candidates || []);

      // Extract unique wards
      const uniqueWards = [
        ...new Set(
          data.candidates?.map((c) => c.ward_no).filter(Boolean) || []
        ),
      ];
      setWards(uniqueWards.sort((a, b) => parseInt(a) - parseInt(b)));
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Unable to fetch candidates. Please check your API connection.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedListId, statusFilter, wardFilter]);

  useEffect(() => {
    if (selectedListId && !listLoading) {
      fetchCandidates();
    }
  }, [selectedListId, listLoading, fetchCandidates]);

  const handleEdit = (candidate: Candidate) => {
    console.log("[v0] Edit candidate:", candidate);
    // TODO: Implement edit dialog
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
      await api.deleteCandidate(id);
      fetchCandidates();
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      alert("Failed to delete candidate. Please try again.");
    }
  };

  // Filter candidates by search query
  const filteredCandidates = candidates.filter((c) =>
    searchQuery
      ? c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.party_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Stats
  const activeCount = candidates.filter((c) => c.status === "active").length;
  const withdrawnCount = candidates.filter(
    (c) => c.status === "withdrawn"
  ).length;
  const disqualifiedCount = candidates.filter(
    (c) => c.status === "disqualified"
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Vote className="h-5 w-5 text-muted-foreground" />
            Elections
          </h1>
          <p className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>
        <AddCandidateDialog onSuccess={fetchCandidates} />
      </div>

      {/* Quick Stats */}
      {!loading && candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-lg font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-lg font-bold">{withdrawnCount}</p>
                  <p className="text-xs text-muted-foreground">Withdrawn</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-lg font-bold">{disqualifiedCount}</p>
                  <p className="text-xs text-muted-foreground">Disqualified</p>
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
            <Button variant="outline" size="sm" onClick={fetchCandidates}>
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
            placeholder="Search by name or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={wardFilter} onValueChange={setWardFilter}>
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

      {/* Active filter badges */}
      {(statusFilter !== "all" || wardFilter !== "all") && (
        <div className="flex flex-wrap gap-1">
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/10"
              onClick={() => setStatusFilter("all")}
            >
              Status: {statusFilter} ×
            </Badge>
          )}
          {wardFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/10"
              onClick={() => setWardFilter("all")}
            >
              Ward: {wardFilter} ×
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Vote className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {candidates.length === 0
              ? "No candidates yet"
              : "No matching candidates"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {candidates.length === 0
              ? "Add your first candidate to get started"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.candidate_id || candidate.id}
              candidate={candidate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
