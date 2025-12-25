"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type VoterList,
  type ComparisonJob,
  type SavedComparison,
  type SavedComparisonReport,
} from "@/lib/api";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Edit3,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileSpreadsheet,
  User,
  Home,
  Phone,
  Hash,
  Calendar,
  Vote,
  History,
  Trash2,
  FolderOpen,
  Settings2,
  Loader2,
  Clock,
  X,
  Sparkles,
  Baby,
  UserCheck,
  HeartHandshake,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Items per page for pagination
const PAGE_SIZE = 25;

export default function ComparePage() {
  const [lists, setLists] = useState<VoterList[]>([]);
  const [list1Id, setList1Id] = useState<number | null>(null); // Old/Baseline list
  const [list2Id, setList2Id] = useState<number | null>(null); // New/Current list
  const [comparing, setComparing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<ComparisonJob["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [useAsync, setUseAsync] = useState(true); // Toggle for async vs sync API

  // New state for enhanced UI
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [showInsights, setShowInsights] = useState(true);

  // Threshold settings - like a sarpanch's experience-based matching criteria
  const [nameThreshold, setNameThreshold] = useState(85);
  const [relativeThreshold, setRelativeThreshold] = useState(80);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Saved comparisons state
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>(
    []
  );
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loadingComparisonId, setLoadingComparisonId] = useState<string | null>(
    null
  );

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

  // Ref to store the polling interval for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVoterLists();
      setLists(data.lists || []);
    } catch (err) {
      console.error("Failed to fetch voter lists:", err);
      setError(
        "Unable to fetch voter lists. Please check your API connection."
      );
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved comparisons - like checking your campaign records
  const fetchSavedComparisons = async () => {
    try {
      setLoadingSaved(true);
      const data = await api.getSavedComparisons();
      setSavedComparisons(data.comparisons || []);
    } catch (err) {
      console.error("Failed to fetch saved comparisons:", err);
      // Don't show error for this - it's not critical
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchSavedComparisons();
  }, []);

  const pollComparisonStatus = useCallback((jobId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await api.getComparisonStatus(jobId);
        setStatus(statusResponse.status);
        setProgress(statusResponse.progress || 0);

        if (statusResponse.status === "completed" && statusResponse.result) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setResults(statusResponse.result);
          setComparing(false);
        } else if (statusResponse.status === "error") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError(
            statusResponse.message || "Comparison failed. Please try again."
          );
          setComparing(false);
          setStatus("idle");
        }
      } catch (err) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError("Lost connection while comparing. Please try again.");
        setComparing(false);
        setStatus("idle");
      }
    }, 2000);
  }, []);

  const handleCompare = async () => {
    if (!list1Id || !list2Id) return;

    setComparing(true);
    setStatus("processing");
    setProgress(0);
    setError(null);
    setResults(null);

    try {
      // Determine which API to use based on list sizes
      const list1 = lists.find((l) => (l.list_id || l.id) === list1Id);
      const list2 = lists.find((l) => (l.list_id || l.id) === list2Id);
      const totalVoters =
        (list1?.total_voters || 0) + (list2?.total_voters || 0);

      const thresholdOptions = {
        name_threshold: nameThreshold,
        relative_threshold: relativeThreshold,
      };

      // Use sync API for small lists (< 10,000 total voters)
      if (totalVoters < 10000 && !useAsync) {
        const response = await api.compareVoterListsSync(
          list1Id,
          list2Id,
          thresholdOptions
        );
        setResults(response.result);
        setStatus("completed");
        setProgress(100);
        setComparing(false);
        // Refresh saved comparisons list
        fetchSavedComparisons();
      } else {
        // Use async API for large lists
        const response = await api.compareVoterLists(
          list1Id,
          list2Id,
          thresholdOptions
        );
        setJobId(response.job_id);
        pollComparisonStatus(response.job_id);
        // Refresh saved comparisons list
        fetchSavedComparisons();
      }
    } catch (err) {
      console.error("Comparison failed:", err);
      setError("Failed to start comparison. Please try again.");
      setComparing(false);
      setStatus("idle");
    }
  };

  // Load a saved comparison - like pulling up old election records
  const loadSavedComparison = async (comparison: SavedComparison) => {
    try {
      setLoadingComparisonId(comparison.job_id);

      // Set the list selections to match
      setList1Id(comparison.old_list_id);
      setList2Id(comparison.new_list_id);

      if (comparison.status === "completed") {
        // Fetch full report
        const report = await api.getSavedComparison(comparison.job_id);
        if (report.result) {
          // Use type assertion since API response may have optional summary
          setResults(report.result as ComparisonJob["result"]);
          setStatus("completed");
          setProgress(100);
          setJobId(comparison.job_id);
        }
      } else if (comparison.status === "processing") {
        // Start polling for this job
        setJobId(comparison.job_id);
        setStatus("processing");
        setComparing(true);
        pollComparisonStatus(comparison.job_id);
      }

      setShowSavedSheet(false);
    } catch (err) {
      console.error("Failed to load comparison:", err);
      setError("Failed to load saved comparison. Please try again.");
    } finally {
      setLoadingComparisonId(null);
    }
  };

  // Delete a saved comparison
  const deleteSavedComparison = async (jobId: string) => {
    try {
      await api.deleteSavedComparison(jobId);
      setSavedComparisons((prev) => prev.filter((c) => c.job_id !== jobId));
      setDeleteConfirmId(null);

      // If we're viewing this comparison, clear results
      if (jobId === jobId) {
        setResults(null);
        setStatus("idle");
      }
    } catch (err) {
      console.error("Failed to delete comparison:", err);
      setError("Failed to delete comparison. Please try again.");
    }
  };

  // Get list name by ID
  const getListName = (listId: number) => {
    const list = lists.find((l) => (l.list_id || l.id) === listId);
    return list?.filename || list?.name || `List #${listId}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const list1 = lists.find((l) => (l.list_id || l.id) === list1Id);
  const list2 = lists.find((l) => (l.list_id || l.id) === list2Id);

  // Reset pagination when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, wardFilter, ageFilter, genderFilter]);

  // Get unique wards from results for filter dropdown
  const availableWards = useMemo(() => {
    if (!results) return [];
    const wards = new Set<string>();

    results.new_voters?.forEach((item: any) => {
      if (item.ward) wards.add(item.ward);
    });
    results.deleted_voters?.forEach((item: any) => {
      if (item.ward) wards.add(item.ward);
    });
    results.corrected?.forEach((item: any) => {
      if (item.ward) wards.add(item.ward);
    });
    results.matched?.forEach((item: any) => {
      if (item.ward) wards.add(item.ward);
    });

    return Array.from(wards).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [results]);

  // Calculate voter insights for a given array of voters
  const calculateInsights = useCallback((voters: any[]) => {
    let total = 0,
      firstTime = 0,
      youth = 0,
      senior = 0,
      male = 0,
      female = 0,
      ageSum = 0,
      validAges = 0;

    voters.forEach((item: any) => {
      const voter = item.voter || item.old || item.new || item;
      total++;

      const age = voter.age || 0;
      if (age > 0) {
        ageSum += age;
        validAges++;
        if (age >= 18 && age <= 19) firstTime++;
        if (age >= 18 && age <= 30) youth++;
        if (age >= 60) senior++;
      }

      const gender = voter.gender || "";
      const isMale = gender === "Male" || gender === "पु" || gender === "M";
      const isFemale = gender === "Female" || gender === "म" || gender === "F";
      if (isMale) male++;
      else if (isFemale) female++;
    });

    return {
      total,
      firstTimeVoters: firstTime,
      youthVoters: youth,
      seniorCitizens: senior,
      maleCount: male,
      femaleCount: female,
      averageAge: validAges > 0 ? Math.round(ageSum / validAges) : 0,
    };
  }, []);

  // Memoized insights for new and deleted voters
  const newVoterInsights = useMemo(() => {
    return calculateInsights(results?.new_voters || []);
  }, [results?.new_voters, calculateInsights]);

  const deletedVoterInsights = useMemo(() => {
    return calculateInsights(results?.deleted_voters || []);
  }, [results?.deleted_voters, calculateInsights]);

  // Filter and paginate data based on active tab
  const getFilteredData = useCallback(
    (dataType: string) => {
      if (!results) return { items: [], total: 0 };

      let data: any[] = [];
      switch (dataType) {
        case "new":
          data = results.new_voters || [];
          break;
        case "deleted":
          data = results.deleted_voters || [];
          break;
        case "corrected":
          data = results.corrected || [];
          break;
        case "matched":
          data = results.matched || [];
          break;
        default:
          data = [];
      }

      // Apply ward filter
      if (wardFilter !== "all") {
        data = data.filter((item: any) => item.ward === wardFilter);
      }

      // Apply age filter
      if (ageFilter !== "all") {
        data = data.filter((item: any) => {
          const voter = item.voter || item.old || item.new || item;
          const age = voter.age || 0;
          switch (ageFilter) {
            case "first-time":
              return age >= 18 && age <= 19;
            case "youth":
              return age >= 18 && age <= 30;
            case "middle":
              return age >= 31 && age <= 55;
            case "senior":
              return age >= 56;
            default:
              return true;
          }
        });
      }

      // Apply gender filter
      if (genderFilter !== "all") {
        data = data.filter((item: any) => {
          const voter = item.voter || item.old || item.new || item;
          const gender = voter.gender || "";
          const isMale = gender === "Male" || gender === "पु" || gender === "M";
          const isFemale =
            gender === "Female" || gender === "म" || gender === "F";
          if (genderFilter === "male") return isMale;
          if (genderFilter === "female") return isFemale;
          return true;
        });
      }

      // Apply search filter (now includes house_no)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        data = data.filter((item: any) => {
          const voter = item.voter || item.old || item.new || item;
          const name = String(voter.name || "").toLowerCase();
          const relativeName = String(voter.relative_name || "").toLowerCase();
          const voterId = String(voter.voter_id || "").toLowerCase();
          const houseNo = String(voter.house_no || "").toLowerCase();
          return (
            name.includes(query) ||
            relativeName.includes(query) ||
            voterId.includes(query) ||
            houseNo.includes(query)
          );
        });
      }

      return { items: data, total: data.length };
    },
    [results, wardFilter, ageFilter, genderFilter, searchQuery]
  );

  // Get paginated data for current tab
  const paginatedData = useMemo(() => {
    const { items, total } = getFilteredData(activeTab);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedItems = items.slice(startIndex, startIndex + PAGE_SIZE);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      items: paginatedItems,
      total,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: Math.min(startIndex + PAGE_SIZE, total),
    };
  }, [getFilteredData, activeTab, currentPage]);

  // Ward breakdown data processing
  const wardBreakdownData = useMemo(() => {
    if (!results?.ward_breakdown) return [];

    return Object.entries(results.ward_breakdown)
      .map(([ward, counts]: [string, any]) => ({
        ward,
        matched: counts.matched || 0,
        corrected: counts.corrected || 0,
        new: counts.new || counts.new_voters || 0,
        deleted: counts.deleted || counts.deleted_voters || 0,
        total:
          (counts.matched || 0) +
          (counts.corrected || 0) +
          (counts.new || counts.new_voters || 0) +
          (counts.deleted || counts.deleted_voters || 0),
      }))
      .sort((a, b) => {
        const numA = parseInt(a.ward);
        const numB = parseInt(b.ward);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.ward.localeCompare(b.ward);
      });
  }, [results?.ward_breakdown]);

  // Export functionality - like a seasoned sarpanch sharing data with booth agents
  const exportToCSV = (dataType: string) => {
    const { items } = getFilteredData(dataType);
    if (items.length === 0) return;

    let csvContent = "";
    let filename = "";

    if (dataType === "new" || dataType === "deleted") {
      csvContent = "Voter ID,Name,Relative Name,Ward,Age,Gender\n";
      items.forEach((item: any) => {
        const voter = item.voter || item;
        csvContent += `"${voter.voter_id || ""}","${voter.name || ""}","${
          voter.relative_name || ""
        }","${item.ward || voter.ward_no || ""}","${voter.age || ""}","${
          voter.gender || ""
        }"\n`;
      });
      filename = dataType === "new" ? "new_voters.csv" : "deleted_voters.csv";
    } else if (dataType === "corrected") {
      csvContent = "Voter ID,Old Name,New Name,Ward,Match Score\n";
      items.forEach((item: any) => {
        csvContent += `"${item.old?.voter_id || ""}","${
          item.old?.name || ""
        }","${item.new?.name || ""}","${item.ward || ""}","${Math.round(
          (item.name_score || 0) * 100
        )}%"\n`;
      });
      filename = "corrected_voters.csv";
    } else if (dataType === "ward") {
      csvContent = "Ward,Matched,Corrected,New,Deleted,Total\n";
      wardBreakdownData.forEach((row) => {
        csvContent += `"${row.ward}","${row.matched}","${row.corrected}","${row.new}","${row.deleted}","${row.total}"\n`;
      });
      filename = "ward_breakdown.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportAllResults = () => {
    if (!results) return;

    let csvContent = "Category,Voter ID,Name,Relative Name,Ward,Details\n";

    results.new_voters?.forEach((item: any) => {
      const voter = item.voter || item;
      csvContent += `"New","${voter.voter_id || ""}","${voter.name || ""}","${
        voter.relative_name || ""
      }","${item.ward || ""}","Added to new list"\n`;
    });

    results.deleted_voters?.forEach((item: any) => {
      const voter = item.voter || item;
      csvContent += `"Deleted","${voter.voter_id || ""}","${
        voter.name || ""
      }","${voter.relative_name || ""}","${
        item.ward || ""
      }","Removed from list"\n`;
    });

    results.corrected?.forEach((item: any) => {
      csvContent += `"Corrected","${item.old?.voter_id || ""}","${
        item.old?.name
      } → ${item.new?.name}","${item.old?.relative_name || ""}","${
        item.ward || ""
      }","Match: ${Math.round((item.name_score || 0) * 100)}%"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "comparison_results.csv";
    link.click();
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="List Comparison"
          description="Compare two voter lists to identify additions and deletions"
        />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="List Comparison"
        description="Compare two voter lists to identify additions and deletions"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchLists}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Selection Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Lists to Compare</CardTitle>
                  <CardDescription>
                    Choose two voter lists to compare and analyze changes
                    between them
                  </CardDescription>
                </div>
                {/* Saved Comparisons Button */}
                <Sheet open={showSavedSheet} onOpenChange={setShowSavedSheet}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <History className="mr-2 h-4 w-4" />
                      Saved
                      {savedComparisons.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {savedComparisons.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full max-w-[340px] sm:max-w-[380px] flex flex-col"
                  >
                    <SheetHeader className="space-y-1 pb-4 border-b">
                      <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Saved Comparisons
                      </SheetTitle>
                      <SheetDescription>
                        View and manage your comparison history
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden py-4">
                      {loadingSaved ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Loading...
                          </p>
                        </div>
                      ) : savedComparisons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <div className="rounded-full bg-muted p-4 mb-4">
                            <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="font-medium">No saved comparisons</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Run a comparison to see it here
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-full pr-1">
                          <div className="space-y-3">
                            {savedComparisons.map((comparison) => (
                              <div
                                key={comparison.job_id}
                                className={`group rounded-xl border bg-card p-4 transition-all hover:shadow-md ${
                                  comparison.status === "completed"
                                    ? "hover:border-primary/50"
                                    : comparison.status === "processing"
                                    ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                                    : "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                                }`}
                              >
                                {/* Header with Status */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <Badge
                                    variant={
                                      comparison.status === "completed"
                                        ? "default"
                                        : comparison.status === "processing"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="font-medium"
                                  >
                                    {comparison.status === "processing" && (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    )}
                                    {comparison.status === "completed" && (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    )}
                                    {comparison.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(comparison.created_at)}
                                  </span>
                                </div>

                                {/* List Names */}
                                <div className="space-y-1.5 mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                    <p
                                      className="text-sm font-medium truncate"
                                      title={
                                        comparison.old_list_name ||
                                        getListName(comparison.old_list_id)
                                      }
                                    >
                                      {comparison.old_list_name ||
                                        getListName(comparison.old_list_id)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <p
                                      className="text-sm truncate"
                                      title={
                                        comparison.new_list_name ||
                                        getListName(comparison.new_list_id)
                                      }
                                    >
                                      {comparison.new_list_name ||
                                        getListName(comparison.new_list_id)}
                                    </p>
                                  </div>
                                </div>

                                {/* Stats */}
                                {comparison.status === "completed" && (
                                  <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/50 mb-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">
                                        New:
                                      </span>
                                      <span className="text-sm font-semibold text-green-600">
                                        +{comparison.new_voters_count || 0}
                                      </span>
                                    </div>
                                    <div className="w-px h-4 bg-border" />
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">
                                        Del:
                                      </span>
                                      <span className="text-sm font-semibold text-red-600">
                                        -{comparison.deleted_voters_count || 0}
                                      </span>
                                    </div>
                                    <div className="w-px h-4 bg-border" />
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">
                                        Mod:
                                      </span>
                                      <span className="text-sm font-semibold text-orange-600">
                                        {comparison.corrected_count || 0}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() =>
                                      loadSavedComparison(comparison)
                                    }
                                    disabled={
                                      loadingComparisonId ===
                                        comparison.job_id ||
                                      comparison.status !== "completed"
                                    }
                                  >
                                    {loadingComparisonId ===
                                    comparison.job_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                        Load Report
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      setDeleteConfirmId(comparison.job_id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    {/* Footer */}
                    {savedComparisons.length > 0 && (
                      <div className="pt-4 border-t text-center">
                        <p className="text-xs text-muted-foreground">
                          {savedComparisons.length} comparison
                          {savedComparisons.length !== 1 ? "s" : ""} saved
                        </p>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Baseline List (Older)
                  </label>
                  <Select
                    value={list1Id?.toString()}
                    onValueChange={(val) => setList1Id(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem
                          key={list.list_id || list.id}
                          value={(list.list_id || list.id)!.toString()}
                        >
                          {list.filename || list.name} ({list.total_voters}{" "}
                          voters)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Current List (Newer)
                  </label>
                  <Select
                    value={list2Id?.toString()}
                    onValueChange={(val) => setList2Id(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select second list" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem
                          key={list.list_id || list.id}
                          value={(list.list_id || list.id)!.toString()}
                          disabled={(list.list_id || list.id) === list1Id}
                        >
                          {list.filename || list.name} ({list.total_voters}{" "}
                          voters)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Settings - Threshold controls */}
              <Collapsible
                open={showAdvancedSettings}
                onOpenChange={setShowAdvancedSettings}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Advanced Settings
                    <ChevronRight
                      className={`ml-auto h-4 w-4 transition-transform ${
                        showAdvancedSettings ? "rotate-90" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Name Match Threshold
                        </label>
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {nameThreshold}%
                        </span>
                      </div>
                      <Slider
                        value={[nameThreshold]}
                        onValueChange={(val) => setNameThreshold(val[0])}
                        min={50}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        How closely voter names must match to be considered the
                        same person
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Relative Name Threshold
                        </label>
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {relativeThreshold}%
                        </span>
                      </div>
                      <Slider
                        value={[relativeThreshold]}
                        onValueChange={(val) => setRelativeThreshold(val[0])}
                        min={50}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        How closely relative names must match for voter
                        identification
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button
                onClick={handleCompare}
                disabled={
                  !list1Id || !list2Id || comparing || list1Id === list2Id
                }
                className="w-full"
              >
                {comparing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="mr-2 h-4 w-4" />
                    Start Comparison
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!deleteConfirmId}
            onOpenChange={() => setDeleteConfirmId(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Comparison?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this comparison report. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteConfirmId && deleteSavedComparison(deleteConfirmId)
                  }
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Status Alert */}
          {status === "processing" && (
            <Alert>
              <GitCompare className="h-4 w-4 animate-pulse" />
              <AlertDescription className="space-y-2">
                <p>
                  Comparing voter lists... This may take a few moments depending
                  on the list sizes.
                </p>
                {progress > 0 && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {progress}% complete
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Results Summary */}
          {results && (
            <>
              {/* Summary Header with Export */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>
                    Old List:{" "}
                    <strong className="text-foreground">
                      {results.summary?.total_old || 0}
                    </strong>{" "}
                    voters
                  </span>
                  <span>
                    New List:{" "}
                    <strong className="text-foreground">
                      {results.summary?.total_new || 0}
                    </strong>{" "}
                    voters
                  </span>
                </div>

                {/* Export Menu - Essential for booth workers */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportAllResults}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export All Results
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportToCSV("new")}>
                      <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                      Export New Voters
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV("deleted")}>
                      <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
                      Export Deleted Voters
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV("corrected")}>
                      <Edit3 className="mr-2 h-4 w-4 text-orange-600" />
                      Export Corrections
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportToCSV("ward")}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Export Ward Breakdown
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    activeTab === "matched"
                      ? "ring-2 ring-blue-600"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveTab("matched")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">
                        {results.summary?.matched || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Matched
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    activeTab === "corrected"
                      ? "ring-2 ring-orange-600"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveTab("corrected")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-600">
                        {results.summary?.corrected || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Corrected
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    activeTab === "new"
                      ? "ring-2 ring-green-600"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveTab("new")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {results.summary?.new_voters || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      New Voters
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    activeTab === "deleted"
                      ? "ring-2 ring-red-600"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveTab("deleted")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">
                        {results.summary?.deleted_voters || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deleted
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Voter Insights Section */}
              <Collapsible open={showInsights} onOpenChange={setShowInsights}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                    Voter Insights & Demographics
                    <ChevronDown
                      className={`ml-auto h-4 w-4 transition-transform ${
                        showInsights ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* New Voters Insights */}
                    <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          New Voters Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "first-time" && activeTab === "new"
                                ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                                : "hover:bg-emerald-50"
                            }`}
                            onClick={() => {
                              setActiveTab("new");
                              setAgeFilter(
                                ageFilter === "first-time"
                                  ? "all"
                                  : "first-time"
                              );
                            }}
                          >
                            <Baby className="h-3 w-3 mr-1" />
                            First-Time (18-19):{" "}
                            {newVoterInsights.firstTimeVoters}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "youth" && activeTab === "new"
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "hover:bg-blue-50"
                            }`}
                            onClick={() => {
                              setActiveTab("new");
                              setAgeFilter(
                                ageFilter === "youth" ? "all" : "youth"
                              );
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Youth (18-30): {newVoterInsights.youthVoters}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "senior" && activeTab === "new"
                                ? "bg-purple-100 border-purple-500 text-purple-700"
                                : "hover:bg-purple-50"
                            }`}
                            onClick={() => {
                              setActiveTab("new");
                              setAgeFilter(
                                ageFilter === "senior" ? "all" : "senior"
                              );
                            }}
                          >
                            <HeartHandshake className="h-3 w-3 mr-1" />
                            Senior (56+): {newVoterInsights.seniorCitizens}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              genderFilter === "male" && activeTab === "new"
                                ? "bg-sky-100 border-sky-500 text-sky-700"
                                : "hover:bg-sky-50"
                            }`}
                            onClick={() => {
                              setActiveTab("new");
                              setGenderFilter(
                                genderFilter === "male" ? "all" : "male"
                              );
                            }}
                          >
                            Male: {newVoterInsights.maleCount}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              genderFilter === "female" && activeTab === "new"
                                ? "bg-pink-100 border-pink-500 text-pink-700"
                                : "hover:bg-pink-50"
                            }`}
                            onClick={() => {
                              setActiveTab("new");
                              setGenderFilter(
                                genderFilter === "female" ? "all" : "female"
                              );
                            }}
                          >
                            Female: {newVoterInsights.femaleCount}
                          </Badge>
                          {newVoterInsights.averageAge > 0 && (
                            <Badge variant="secondary">
                              Avg Age: {newVoterInsights.averageAge}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Deleted Voters Insights */}
                    <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          Deleted Voters Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "first-time" &&
                              activeTab === "deleted"
                                ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                                : "hover:bg-emerald-50"
                            }`}
                            onClick={() => {
                              setActiveTab("deleted");
                              setAgeFilter(
                                ageFilter === "first-time"
                                  ? "all"
                                  : "first-time"
                              );
                            }}
                          >
                            <Baby className="h-3 w-3 mr-1" />
                            First-Time (18-19):{" "}
                            {deletedVoterInsights.firstTimeVoters}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "youth" && activeTab === "deleted"
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "hover:bg-blue-50"
                            }`}
                            onClick={() => {
                              setActiveTab("deleted");
                              setAgeFilter(
                                ageFilter === "youth" ? "all" : "youth"
                              );
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Youth (18-30): {deletedVoterInsights.youthVoters}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              ageFilter === "senior" && activeTab === "deleted"
                                ? "bg-purple-100 border-purple-500 text-purple-700"
                                : "hover:bg-purple-50"
                            }`}
                            onClick={() => {
                              setActiveTab("deleted");
                              setAgeFilter(
                                ageFilter === "senior" ? "all" : "senior"
                              );
                            }}
                          >
                            <HeartHandshake className="h-3 w-3 mr-1" />
                            Senior (56+): {deletedVoterInsights.seniorCitizens}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              genderFilter === "male" && activeTab === "deleted"
                                ? "bg-sky-100 border-sky-500 text-sky-700"
                                : "hover:bg-sky-50"
                            }`}
                            onClick={() => {
                              setActiveTab("deleted");
                              setGenderFilter(
                                genderFilter === "male" ? "all" : "male"
                              );
                            }}
                          >
                            Male: {deletedVoterInsights.maleCount}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              genderFilter === "female" &&
                              activeTab === "deleted"
                                ? "bg-pink-100 border-pink-500 text-pink-700"
                                : "hover:bg-pink-50"
                            }`}
                            onClick={() => {
                              setActiveTab("deleted");
                              setGenderFilter(
                                genderFilter === "female" ? "all" : "female"
                              );
                            }}
                          >
                            Female: {deletedVoterInsights.femaleCount}
                          </Badge>
                          {deletedVoterInsights.averageAge > 0 && (
                            <Badge variant="secondary">
                              Avg Age: {deletedVoterInsights.averageAge}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Detailed Results with Tabs */}
          {results && (
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="new" className="text-xs sm:text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 hidden sm:inline text-green-600" />
                        New
                      </TabsTrigger>
                      <TabsTrigger
                        value="deleted"
                        className="text-xs sm:text-sm"
                      >
                        <TrendingDown className="h-4 w-4 mr-1 hidden sm:inline text-red-600" />
                        Deleted
                      </TabsTrigger>
                      <TabsTrigger
                        value="corrected"
                        className="text-xs sm:text-sm"
                      >
                        <Edit3 className="h-4 w-4 mr-1 hidden sm:inline text-orange-600" />
                        Corrected
                      </TabsTrigger>
                      <TabsTrigger
                        value="matched"
                        className="text-xs sm:text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline text-blue-600" />
                        Matched
                      </TabsTrigger>
                      <TabsTrigger value="ward" className="text-xs sm:text-sm">
                        <MapPin className="h-4 w-4 mr-1 hidden sm:inline" />
                        By Ward
                      </TabsTrigger>
                    </TabsList>

                    {/* Search and Filter - Only for voter tabs */}
                    {activeTab !== "ward" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search by name, voter ID, house no..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          {availableWards.length > 0 && (
                            <Select
                              value={wardFilter}
                              onValueChange={setWardFilter}
                            >
                              <SelectTrigger className="w-full sm:w-32">
                                <SelectValue placeholder="All Wards" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Wards</SelectItem>
                                {availableWards.map((ward) => (
                                  <SelectItem key={ward} value={ward}>
                                    Ward {ward}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Select
                            value={ageFilter}
                            onValueChange={setAgeFilter}
                          >
                            <SelectTrigger className="w-full sm:w-40">
                              <SelectValue placeholder="All Ages" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Ages</SelectItem>
                              <SelectItem value="first-time">
                                First-Time (18-19)
                              </SelectItem>
                              <SelectItem value="youth">
                                Youth (18-30)
                              </SelectItem>
                              <SelectItem value="middle">
                                Middle (31-55)
                              </SelectItem>
                              <SelectItem value="senior">
                                Senior (56+)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={genderFilter}
                            onValueChange={setGenderFilter}
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue placeholder="All Genders" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Genders</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Active filters display */}
                        {(ageFilter !== "all" ||
                          genderFilter !== "all" ||
                          wardFilter !== "all") && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              Active filters:
                            </span>
                            {wardFilter !== "all" && (
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setWardFilter("all")}
                              >
                                Ward {wardFilter} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                            {ageFilter !== "all" && (
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setAgeFilter("all")}
                              >
                                {ageFilter === "first-time"
                                  ? "First-Time (18-19)"
                                  : ageFilter === "youth"
                                  ? "Youth (18-30)"
                                  : ageFilter === "middle"
                                  ? "Middle (31-55)"
                                  : "Senior (56+)"}{" "}
                                <X className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                            {genderFilter !== "all" && (
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setGenderFilter("all")}
                              >
                                {genderFilter === "male" ? "Male" : "Female"}{" "}
                                <X className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => {
                                setWardFilter("all");
                                setAgeFilter("all");
                                setGenderFilter("all");
                              }}
                            >
                              Clear all
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* New Voters Tab */}
                  <TabsContent value="new" className="m-0">
                    {paginatedData.total === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ||
                        wardFilter !== "all" ||
                        ageFilter !== "all" ||
                        genderFilter !== "all"
                          ? "No voters found matching your filters"
                          : "No new voters found"}
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Relative Name</TableHead>
                              <TableHead className="w-[120px]">
                                Voter ID
                              </TableHead>
                              <TableHead className="w-[60px]">Ward</TableHead>
                              <TableHead className="w-[70px]">House</TableHead>
                              <TableHead className="w-[50px]">Age</TableHead>
                              <TableHead className="w-[60px]">Gender</TableHead>
                              <TableHead className="w-[80px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedData.items.map(
                              (item: any, index: number) => {
                                const voter = item.voter || item;
                                return (
                                  <TableRow
                                    key={voter.voter_id || index}
                                    className="hover:bg-green-50/30 dark:hover:bg-green-950/10"
                                  >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                      {paginatedData.startIndex + index}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">
                                        {voter.name}
                                      </div>
                                      {voter.name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {voter.relative_name || "-"}
                                      </div>
                                      {voter.relative_name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.relative_name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {voter.voter_id_number || voter.voter_id}
                                    </TableCell>
                                    <TableCell>
                                      {item.ward || voter.ward_no || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {voter.house_no || "-"}
                                    </TableCell>
                                    <TableCell>{voter.age || "-"}</TableCell>
                                    <TableCell>{voter.gender || "-"}</TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-600 text-white text-xs">
                                        New
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </TabsContent>
                  {/* Deleted Voters Tab */}
                  <TabsContent value="deleted" className="m-0">
                    {paginatedData.total === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ||
                        wardFilter !== "all" ||
                        ageFilter !== "all" ||
                        genderFilter !== "all"
                          ? "No voters found matching your filters"
                          : "No deleted voters found"}
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Relative Name</TableHead>
                              <TableHead className="w-[120px]">
                                Voter ID
                              </TableHead>
                              <TableHead className="w-[60px]">Ward</TableHead>
                              <TableHead className="w-[70px]">House</TableHead>
                              <TableHead className="w-[50px]">Age</TableHead>
                              <TableHead className="w-[60px]">Gender</TableHead>
                              <TableHead className="w-[80px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedData.items.map(
                              (item: any, index: number) => {
                                const voter = item.voter || item;
                                return (
                                  <TableRow
                                    key={voter.voter_id || index}
                                    className="hover:bg-red-50/30 dark:hover:bg-red-950/10"
                                  >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                      {paginatedData.startIndex + index}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">
                                        {voter.name}
                                      </div>
                                      {voter.name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {voter.relative_name || "-"}
                                      </div>
                                      {voter.relative_name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.relative_name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {voter.voter_id_number || voter.voter_id}
                                    </TableCell>
                                    <TableCell>
                                      {item.ward || voter.ward_no || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {voter.house_no || "-"}
                                    </TableCell>
                                    <TableCell>{voter.age || "-"}</TableCell>
                                    <TableCell>{voter.gender || "-"}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Removed
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </TabsContent>
                  ;{/* Corrected Voters Tab */}
                  <TabsContent value="corrected" className="m-0">
                    {paginatedData.total === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ||
                        wardFilter !== "all" ||
                        ageFilter !== "all" ||
                        genderFilter !== "all"
                          ? "No voters found matching your filters"
                          : "No name corrections found"}
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/50 dark:bg-orange-950/20">
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Old Name</TableHead>
                              <TableHead>New Name</TableHead>
                              <TableHead>Relative Name</TableHead>
                              <TableHead className="w-[120px]">
                                Voter ID
                              </TableHead>
                              <TableHead className="w-[60px]">Ward</TableHead>
                              <TableHead className="w-[70px]">House</TableHead>
                              <TableHead className="w-[50px]">Age</TableHead>
                              <TableHead className="w-[80px]">
                                Match %
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedData.items.map(
                              (item: any, index: number) => (
                                <TableRow
                                  key={item.old?.voter_id || index}
                                  className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10"
                                >
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {paginatedData.startIndex + index}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-muted-foreground line-through">
                                      {item.old?.name}
                                    </div>
                                    {item.old?.name_hindi && (
                                      <div className="text-xs text-muted-foreground line-through">
                                        {item.old?.name_hindi}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium text-orange-700 dark:text-orange-400">
                                      {item.new?.name}
                                    </div>
                                    {item.new?.name_hindi && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.new?.name_hindi}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {item.old?.relative_name ||
                                        item.new?.relative_name ||
                                        "-"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {item.old?.voter_id_number ||
                                      item.old?.voter_id}
                                  </TableCell>
                                  <TableCell>
                                    {item.ward || item.old?.ward_no || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {item.old?.house_no ||
                                      item.new?.house_no ||
                                      "-"}
                                  </TableCell>
                                  <TableCell>
                                    {item.old?.age || item.new?.age || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="border-orange-600 text-orange-600 text-xs"
                                    >
                                      {Math.round((item.name_score || 0) * 100)}
                                      %
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </TabsContent>
                  ;{/* Matched Voters Tab */}
                  <TabsContent value="matched" className="m-0">
                    {paginatedData.total === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ||
                        wardFilter !== "all" ||
                        ageFilter !== "all" ||
                        genderFilter !== "all"
                          ? "No voters found matching your filters"
                          : "No matched voters data available"}
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-50/50 dark:bg-blue-950/20">
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Relative Name</TableHead>
                              <TableHead className="w-[120px]">
                                Voter ID
                              </TableHead>
                              <TableHead className="w-[60px]">Ward</TableHead>
                              <TableHead className="w-[70px]">House</TableHead>
                              <TableHead className="w-[50px]">Age</TableHead>
                              <TableHead className="w-[60px]">Gender</TableHead>
                              <TableHead className="w-[80px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedData.items.map(
                              (item: any, index: number) => {
                                const voter =
                                  item.old || item.new || item.voter || item;
                                return (
                                  <TableRow
                                    key={voter.voter_id || index}
                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10"
                                  >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                      {paginatedData.startIndex + index}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">
                                        {voter.name}
                                      </div>
                                      {voter.name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {voter.relative_name || "-"}
                                      </div>
                                      {voter.relative_name_hindi && (
                                        <div className="text-xs text-muted-foreground">
                                          {voter.relative_name_hindi}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {voter.voter_id_number || voter.voter_id}
                                    </TableCell>
                                    <TableCell>
                                      {item.ward || voter.ward_no || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {voter.house_no || "-"}
                                    </TableCell>
                                    <TableCell>{voter.age || "-"}</TableCell>
                                    <TableCell>{voter.gender || "-"}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Match
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </TabsContent>
                  ;{/* Ward Breakdown Tab - Most important for a sarpanch */}
                  <TabsContent value="ward" className="m-0">
                    {wardBreakdownData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Ward breakdown data not available
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Ward</TableHead>
                              <TableHead className="text-right">
                                <span className="text-blue-600">Matched</span>
                              </TableHead>
                              <TableHead className="text-right">
                                <span className="text-orange-600">
                                  Corrected
                                </span>
                              </TableHead>
                              <TableHead className="text-right">
                                <span className="text-green-600">New</span>
                              </TableHead>
                              <TableHead className="text-right">
                                <span className="text-red-600">Deleted</span>
                              </TableHead>
                              <TableHead className="text-right font-bold">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wardBreakdownData.map((row) => (
                              <TableRow
                                key={row.ward}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {row.ward}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-blue-600">
                                  {row.matched}
                                </TableCell>
                                <TableCell className="text-right text-orange-600">
                                  {row.corrected}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-medium">
                                  {row.new > 0 && "+"}
                                  {row.new}
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                  {row.deleted > 0 && "-"}
                                  {row.deleted}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {row.total}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Totals row */}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right text-blue-600">
                                {results.summary?.matched || 0}
                              </TableCell>
                              <TableCell className="text-right text-orange-600">
                                {results.summary?.corrected || 0}
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                +{results.summary?.new_voters || 0}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                -{results.summary?.deleted_voters || 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {(results.summary?.matched || 0) +
                                  (results.summary?.corrected || 0) +
                                  (results.summary?.new_voters || 0) +
                                  (results.summary?.deleted_voters || 0)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </TabsContent>
                  {/* Pagination - Only for voter tabs */}
                  {activeTab !== "ward" && paginatedData.total > PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {paginatedData.startIndex} to{" "}
                        {paginatedData.endIndex} of {paginatedData.total} voters
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          Page {currentPage} of {paginatedData.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(paginatedData.totalPages, p + 1)
                            )
                          }
                          disabled={currentPage === paginatedData.totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
