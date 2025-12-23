"use client";

import { use, useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  type Voter,
  type SentimentType,
  type TaggableSentiment,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Printer,
  User,
  Home,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  Vote,
  Hash,
  UserCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Star,
  StarOff,
  Edit3,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useListContext } from "@/contexts/list-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OpponentSelectorDialog } from "@/components/voters/opponent-selector-dialog";

const SENTIMENT_CONFIG: Record<
  SentimentType,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  support: {
    label: "Supporter",
    color: "text-green-600",
    bg: "bg-green-500",
    border: "border-green-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Confirmed supporter of our candidate",
  },
  oppose: {
    label: "Opposition",
    color: "text-red-600",
    bg: "bg-red-500",
    border: "border-red-500",
    icon: <XCircle className="h-4 w-4" />,
    description: "Supports opposing candidate",
  },
  swing: {
    label: "Swing Voter",
    color: "text-amber-600",
    bg: "bg-amber-500",
    border: "border-amber-500",
    icon: <HelpCircle className="h-4 w-4" />,
    description: "Undecided, potential target for outreach",
  },
  unknown: {
    label: "Not Contacted",
    color: "text-gray-500",
    bg: "bg-gray-400",
    border: "border-gray-400",
    icon: <User className="h-4 w-4" />,
    description: "No contact or sentiment data yet",
  },
  neutral: {
    label: "Neutral",
    color: "text-slate-500",
    bg: "bg-slate-400",
    border: "border-slate-400",
    icon: <User className="h-4 w-4" />,
    description: "Not interested in voting or politics",
  },
};

export default function VoterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const voterId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedListId } = useListContext();
  const [voter, setVoter] = useState<Voter | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagging, setTagging] = useState(false);
  const [notes, setNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [propagateToFamily, setPropagateToFamily] = useState(false);

  // Opponent dialog state for oppose sentiment
  const [opponentDialogOpen, setOpponentDialogOpen] = useState(false);

  // Fetch our candidate (for support sentiment tagging)
  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", selectedListId],
    queryFn: () => api.getCandidates({ list_id: selectedListId! }),
    enabled: !!selectedListId,
    staleTime: 60 * 1000, // 1 minute
  });

  const ourCandidateId = useMemo(() => {
    const ourCandidate = candidatesData?.candidates?.find(
      (c) => c.is_our_candidate
    );
    return ourCandidate?.candidate_id ?? ourCandidate?.id ?? null;
  }, [candidatesData]);

  useEffect(() => {
    if (!selectedListId) {
      setError("Please select a voter list first.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const voterData = await api.getVoter(voterId, selectedListId);
        setVoter(voterData);

        // Fetch family members from same house
        if (voterData.ward_no && voterData.house_no) {
          try {
            const familyData = await api.getFamilyMembers(
              voterData.ward_no,
              voterData.house_no,
              selectedListId
            );
            // Filter out current voter
            setFamilyMembers(
              (familyData.members || []).filter(
                (v) => String(v.voter_id) !== String(voterId)
              )
            );
          } catch {
            // Ignore family fetch errors
          }
        }
      } catch (err) {
        console.error("Failed to load voter:", err);
        setError(
          "Failed to load voter details. Voter may not exist in the selected list."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [voterId, selectedListId]);

  const handleTagSentiment = useCallback(
    async (sentiment: TaggableSentiment, candidateId?: number) => {
      if (!voter || !selectedListId) return;

      // For "oppose" sentiment without candidateId, show opponent selector dialog
      if (sentiment === "oppose" && !candidateId) {
        setOpponentDialogOpen(true);
        return;
      }

      setTagging(true);

      // Snapshot previous state for rollback
      const prevVoter = { ...voter };
      const prevFamilyMembers = [...familyMembers];

      // Optimistic Update
      setVoter({ ...voter, sentiment, sentiment_source: "manual" });

      if (propagateToFamily && familyMembers.length > 0) {
        setFamilyMembers(
          familyMembers.map((m) => ({
            ...m,
            sentiment,
            sentiment_source: "inherited" as const,
          }))
        );
      }

      try {
        // Backend Logic Alignment:
        // If propagateToFamily is true, we send ONLY the current voter's ID with propagate_family=true.
        // The backend will handle finding family members and marking them as "inherited" (lower confidence).
        // If we sent all IDs, everyone would be marked as "manual" (high confidence), which is wrong.

        const voterIds = [voter.voter_id];

        // Determine candidate ID based on sentiment:
        // - oppose: use the selected opponent candidate
        // - support/swing/neutral: use our candidate
        const effectiveCandidateId =
          sentiment === "oppose" ? candidateId : ourCandidateId ?? undefined;

        await api.bulkTagVoters({
          voter_ids: voterIds,
          sentiment,
          list_id: selectedListId,
          source: "manual",
          propagate_family: propagateToFamily,
          candidate_id: effectiveCandidateId,
        });

        if (propagateToFamily && familyMembers.length > 0) {
          toast.success(
            `Marked ${voter.name} as ${SENTIMENT_CONFIG[sentiment].label} (and family)`
          );
        } else {
          toast.success(`Marked as ${SENTIMENT_CONFIG[sentiment].label}`);
        }
      } catch (err) {
        // Rollback on error
        setVoter(prevVoter);
        setFamilyMembers(prevFamilyMembers);
        toast.error("Failed to update sentiment");
      } finally {
        setTagging(false);
      }
    },
    [voter, selectedListId, propagateToFamily, familyMembers, ourCandidateId]
  );

  // Handler for when opponent is selected from dialog
  const handleConfirmOppose = useCallback(
    async (candidateId: number) => {
      await handleTagSentiment("oppose", candidateId);
      setOpponentDialogOpen(false);
    },
    [handleTagSentiment]
  );

  const handleShare = async () => {
    const text = `Voter: ${voter?.name}\nWard: ${voter?.ward_no}\nHouse: ${voter?.house_no}\nSerial: ${voter?.serial_no}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: voter?.name, text });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Voter details copied!");
    }
  };

  const getAgeCategory = (age: number) => {
    if (age < 30)
      return {
        label: "Young Voter",
        color: "text-blue-600",
        bg: "bg-blue-100",
      };
    if (age < 50)
      return {
        label: "Middle Age",
        color: "text-purple-600",
        bg: "bg-purple-100",
      };
    if (age < 65)
      return { label: "Senior", color: "text-orange-600", bg: "bg-orange-100" };
    return { label: "Elder", color: "text-amber-600", bg: "bg-amber-100" };
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-card border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !voter) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Unable to Load Voter</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error || "The requested voter could not be found."}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const sentiment = voter.sentiment || "unknown";
  const sentimentConfig = SENTIMENT_CONFIG[sentiment];
  const ageCategory = getAgeCategory(voter.age || 0);
  const familySentimentSummary = familyMembers.reduce((acc, m) => {
    const s = m.sentiment || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm truncate">{voter.name}</h1>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    sentimentConfig.bg
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                #{voter.serial_no} • Ward {voter.ward_no}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsStarred(!isStarred)}
                >
                  {isStarred ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Star voter for quick access</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print voter slip</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNotes(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Add Notes
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Phone className="h-4 w-4 mr-2" />
                  Add Phone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Sentiment Quick Action Bar */}
        <Card className="overflow-hidden print:hidden">
          <div
            className={cn(
              "px-4 py-3 border-l-4",
              sentimentConfig.border,
              sentiment === "support" && "bg-green-50 dark:bg-green-950/20",
              sentiment === "oppose" && "bg-red-50 dark:bg-red-950/20",
              sentiment === "swing" && "bg-amber-50 dark:bg-amber-950/20",
              (sentiment === "unknown" || sentiment === "neutral") &&
                "bg-muted/50"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    sentiment === "support" && "bg-green-100 text-green-600",
                    sentiment === "oppose" && "bg-red-100 text-red-600",
                    sentiment === "swing" && "bg-amber-100 text-amber-600",
                    (sentiment === "unknown" || sentiment === "neutral") &&
                      "bg-gray-100 text-gray-500"
                  )}
                >
                  {sentimentConfig.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("font-semibold", sentimentConfig.color)}
                    >
                      {sentimentConfig.label}
                    </span>
                    {voter.sentiment_source && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 shrink-0"
                      >
                        {voter.sentiment_source === "manual"
                          ? "Tagged"
                          : voter.sentiment_source}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {sentimentConfig.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 shrink-0">
                {familyMembers.length > 0 && (
                  <div className="flex items-center gap-2 mr-2">
                    <Switch
                      id="propagate"
                      checked={propagateToFamily}
                      onCheckedChange={setPropagateToFamily}
                      className="scale-90"
                    />
                    <Label
                      htmlFor="propagate"
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Apply to family
                    </Label>
                  </div>
                )}

                <div className="flex rounded-lg border bg-background p-0.5 w-full sm:w-auto justify-between sm:justify-start">
                  {(["support", "swing", "oppose"] as SentimentType[]).map(
                    (s) => (
                      <Tooltip key={s}>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                              sentiment === s
                                ? cn(
                                    "text-white",
                                    s === "support" && "bg-green-500",
                                    s === "oppose" && "bg-red-500",
                                    s === "swing" && "bg-amber-500"
                                  )
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            onClick={() => handleTagSentiment(s)}
                            disabled={tagging}
                          >
                            {SENTIMENT_CONFIG[s].icon}
                            <span className="inline sm:hidden md:inline">
                              {SENTIMENT_CONFIG[s].label}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Mark as {SENTIMENT_CONFIG[s].label}
                          {propagateToFamily && familyMembers.length > 0 && (
                            <span className="block text-[10px] opacity-70">
                              + {familyMembers.length} family members
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Voter Card */}
        <Card className="overflow-hidden">
          <div className="p-5">
            {/* Profile Section */}
            <div className="flex items-start gap-4 mb-5">
              <div className="relative">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    voter.gender === "Male" || voter.gender === "पु"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-pink-100 text-pink-600"
                  )}
                >
                  <User className="h-7 w-7" />
                </div>
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                    sentimentConfig.bg
                  )}
                >
                  <span className="text-white text-[8px] font-bold">
                    {sentiment === "support"
                      ? "✓"
                      : sentiment === "oppose"
                      ? "✗"
                      : "?"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {voter.name}
                    </h2>
                    {voter.name_hindi && voter.name_hindi !== voter.name && (
                      <p className="text-muted-foreground text-sm">
                        {voter.name_hindi}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      voter.gender === "Male" || voter.gender === "पु"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        : "bg-pink-100 text-pink-700 hover:bg-pink-100"
                    )}
                  >
                    {voter.gender === "पु"
                      ? "Male"
                      : voter.gender === "म"
                      ? "Female"
                      : voter.gender}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      ageCategory.bg,
                      ageCategory.color,
                      "hover:opacity-90"
                    )}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {voter.age} yrs
                  </Badge>
                  {sentiment === "swing" && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Priority Target
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Serial No.
                </p>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {voter.serial_no}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Info Grid - Redesigned */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* House */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  House
                </p>
                <p className="font-bold text-lg">{voter.house_no}</p>
              </div>

              {/* Ward */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Ward
                </p>
                <p className="font-bold text-lg">{voter.ward_no}</p>
              </div>

              {/* Family */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Family
                </p>
                <p className="font-bold text-lg">{familyMembers.length + 1}</p>
              </div>

              {/* Serial (mobile) */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 sm:hidden">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Serial
                </p>
                <p className="font-bold text-lg">{voter.serial_no}</p>
              </div>

              {/* Age Category (desktop only) */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 hidden sm:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Category
                </p>
                <p className={cn("font-semibold text-sm", ageCategory.color)}>
                  {ageCategory.label}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Detailed Info */}
            <div className="space-y-4">
              {/* Relative */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Father / Husband
                  </p>
                  <p className="font-medium">{voter.relative_name}</p>
                  {voter.relative_name_hindi &&
                    voter.relative_name_hindi !== voter.relative_name && (
                      <p className="text-sm text-muted-foreground">
                        {voter.relative_name_hindi}
                      </p>
                    )}
                </div>
              </div>

              {/* Polling Station */}
              {(voter.ps_name || voter.ps_code) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Polling Station
                    </p>
                    <p className="font-medium">
                      {voter.ps_name || `Station ${voter.ps_code}`}
                    </p>
                    {voter.ps_code && voter.ps_name && (
                      <p className="text-xs text-muted-foreground">
                        Code: {voter.ps_code}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Polling Booth */}
              {(voter.pb_name || voter.pb_code) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Vote className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Polling Booth
                    </p>
                    <p className="font-medium">
                      {voter.pb_name || `Booth ${voter.pb_code}`}
                    </p>
                    {voter.pb_code && voter.pb_name && (
                      <p className="text-xs text-muted-foreground">
                        Booth: {voter.pb_code}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Voter ID */}
              {voter.voter_id_number && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Voter ID (EPIC)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium tracking-wide">
                        {voter.voter_id_number}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(voter.voter_id_number!, "Voter ID")
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Family Members</h3>
                <Badge variant="secondary" className="text-xs">
                  {familyMembers.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Sentiment summary dots */}
                <div className="flex items-center gap-1 mr-2">
                  {Object.entries(familySentimentSummary).map(([s, count]) => (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              SENTIMENT_CONFIG[s as SentimentType]?.bg ||
                                "bg-gray-400"
                            )}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {count}{" "}
                        {SENTIMENT_CONFIG[s as SentimentType]?.label || s}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <Link
                  href={`/voters-management/families?ward=${voter.ward_no}&house=${voter.house_no}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                  >
                    View All
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="divide-y">
                {familyMembers.map((member) => {
                  const memberSentiment = member.sentiment || "unknown";
                  const memberConfig = SENTIMENT_CONFIG[memberSentiment];
                  return (
                    <Link
                      key={member.voter_id || member.serial_no}
                      href={`/voters-management/voters/${
                        member.voter_id || member.serial_no
                      }`}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            member.gender === "Male" || member.gender === "पु"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-pink-100 text-pink-600"
                          )}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                            memberConfig.bg
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.age} yrs • #{member.serial_no}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 print:hidden">
          <Link
            href={`/voters-management/voters?ward=${voter.ward_no}`}
            className="contents"
          >
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">Ward {voter.ward_no}</span>
            </Button>
          </Link>
          <Link
            href={`/voters-management/families?ward=${voter.ward_no}&house=${voter.house_no}`}
            className="contents"
          >
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">Family</span>
            </Button>
          </Link>
          <Link
            href={`/voters-management/war-room?ward=${voter.ward_no}`}
            className="contents"
          >
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">War Room</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => setShowNotes(true)}
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs">Add Note</span>
          </Button>
        </div>

        {/* Notes Dialog */}
        <Dialog open={showNotes} onOpenChange={setShowNotes}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Notes for {voter.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this voter..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNotes(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Notes saved");
                    setShowNotes(false);
                  }}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Print-only section */}
        <div className="hidden print:block mt-8 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{voter.name}</h2>
              {voter.name_hindi && (
                <p className="text-lg">{voter.name_hindi}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Serial No.</p>
              <p className="text-3xl font-bold">{voter.serial_no}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <strong>Father/Husband:</strong> {voter.relative_name}
            </div>
            <div>
              <strong>Age:</strong> {voter.age} years
            </div>
            <div>
              <strong>House No:</strong> {voter.house_no}
            </div>
            <div>
              <strong>Ward:</strong> {voter.ward_no}
            </div>
            {voter.ps_name && (
              <div className="col-span-2">
                <strong>Polling Station:</strong> {voter.ps_name}
              </div>
            )}
            {voter.voter_id_number && (
              <div className="col-span-2">
                <strong>Voter ID:</strong> {voter.voter_id_number}
              </div>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-6 pt-4 border-t">
            Generated on{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            • Voter Management System
          </p>
        </div>
      </div>

      {/* Opponent Selector Dialog */}
      <OpponentSelectorDialog
        open={opponentDialogOpen}
        onOpenChange={setOpponentDialogOpen}
        onSelect={handleConfirmOppose}
        voterCount={
          propagateToFamily && familyMembers.length > 0
            ? familyMembers.length + 1
            : 1
        }
        title={
          propagateToFamily && familyMembers.length > 0
            ? `Tag ${familyMembers.length + 1} people as opposing`
            : "Tag voter as opposing"
        }
      />
    </div>
  );
}
