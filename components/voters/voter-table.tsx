"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Voter, SentimentType, TurnoutStatus } from "@/lib/api";
import { VoterProfilePanel } from "./voter-profile-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  ChevronRight,
  Users,
  FileDown,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Keyboard,
  Tag,
  MoreHorizontal,
  UserCheck,
  Download,
  Printer,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoterTableProps {
  voters: Voter[];
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onBulkTag?: (sentiment: SentimentType) => void;
  onBulkRemoveTag?: () => void;
  onQuickTag?: (voterId: number, sentiment: SentimentType) => Promise<void>;
  onQuickRemoveTag?: (voterId: number) => Promise<void>;
  isBulkTagging?: boolean;
  totalMatchingVoters?: number;
  onSelectAllMatching?: () => void;
}

export function VoterTable({
  voters,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onBulkTag,
  onBulkRemoveTag,
  onQuickTag,
  onQuickRemoveTag,
  isBulkTagging = false,
  totalMatchingVoters,
  onSelectAllMatching,
}: VoterTableProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [quickTaggingId, setQuickTaggingId] = useState<string | null>(null);
  const [profileVoterId, setProfileVoterId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 52; // Fixed row height for virtualization

  const rowVirtualizer = useVirtualizer({
    count: voters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  });

  // Memoized selection handlers to prevent re-renders
  const updateSelection = useCallback(
    (newIds: Set<string>) => {
      if (onSelectionChange) {
        onSelectionChange(newIds);
      } else {
        setInternalSelectedIds(newIds);
      }
    },
    [onSelectionChange]
  );

  const toggleSelect = useCallback(
    (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      updateSelection(newSet);
    },
    [selectedIds, updateSelection]
  );

  const toggleAll = useCallback(() => {
    if (selectedIds.size === voters.length) {
      updateSelection(new Set());
    } else {
      updateSelection(
        new Set(voters.map((v) => String(v.voter_id || v.serial_no || "")))
      );
    }
  }, [selectedIds.size, voters, updateSelection]);

  // Quick tag handler for individual voters
  const handleQuickTag = useCallback(
    async (voter: Voter, sentiment: SentimentType) => {
      if (!onQuickTag) return;
      const voterId = voter.voter_id || parseInt(voter.serial_no, 10);
      if (!voterId || isNaN(voterId)) return;

      const id = String(voter.voter_id || voter.serial_no);
      setQuickTaggingId(id);
      try {
        await onQuickTag(voterId, sentiment);
      } finally {
        setQuickTaggingId(null);
      }
    },
    [onQuickTag]
  );

  // Memoized style utility functions
  const getAgeColor = useCallback((age: number) => {
    if (age <= 35)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    if (age <= 55)
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  }, []);

  const getGenderColor = useCallback((gender: string) => {
    const g = gender?.toLowerCase();
    if (g === "male" || g === "m" || g === "पु")
      return "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400";
    if (g === "female" || g === "f" || g === "म")
      return "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400";
    return "bg-gray-100 text-gray-600";
  }, []);

  const getSentimentRowColor = useCallback((sentiment?: string) => {
    switch (sentiment) {
      case "support":
        return "bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 border-l-[6px] border-l-green-500";
      case "oppose":
        return "bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 border-l-[6px] border-l-red-500";
      case "swing":
        return "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 border-l-[6px] border-l-yellow-500";
      case "neutral":
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 border-l-[6px] border-l-gray-400";
      default:
        return "hover:bg-muted/50 border-l-[6px] border-l-transparent";
    }
  }, []);

  const getSentimentBadge = useCallback((sentiment?: string) => {
    switch (sentiment) {
      case "support":
        return {
          label: "Support",
          className:
            "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        };
      case "oppose":
        return {
          label: "Oppose",
          className:
            "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        };
      case "swing":
        return {
          label: "Swing",
          className:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        };
      case "neutral":
        return {
          label: "Neutral",
          className:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        };
      default:
        return null;
    }
  }, []);

  const getTurnoutBadge = useCallback((status?: TurnoutStatus | null) => {
    switch (status) {
      case "will_vote":
        return {
          label: "Will Vote",
          className:
            "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        };
      case "already_voted":
        return {
          label: "Already Voted",
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        };
      case "wont_vote":
        return {
          label: "Won't Vote",
          className:
            "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        };
      case "unsure":
        return {
          label: "Unsure",
          className:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        };
      case "not_home":
        return {
          label: "Not Home",
          className:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        };
      case "needs_transport":
        return {
          label: "Needs Transport",
          className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        };
      case "migrated":
        return {
          label: "Migrated",
          className:
            "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        };
      case "deceased":
        return {
          label: "Deceased",
          className:
            "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
        };
      case "invalid":
        return {
          label: "Invalid",
          className:
            "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
        };
      default:
        return null;
    }
  }, []);

  if (voters.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No voters found</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Selection Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg sm:flex-row sm:items-center">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs sm:hidden"
                onClick={() => updateSelection(new Set())}
              >
                Clear
              </Button>
            </div>

            {/* Sentiment Buttons */}
            {onBulkTag && (
              <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2 mt-0 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:pl-3 sm:ml-1">
                <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
                  Tag as:
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-green-50 hover:bg-green-100 hover:text-green-700 border-green-200"
                      onClick={() => onBulkTag("support")}
                      disabled={isBulkTagging}
                    >
                      {isBulkTagging ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                          <span className="hidden sm:inline">Support</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Mark as Support</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                        1
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-red-50 hover:bg-red-100 hover:text-red-700 border-red-200"
                      onClick={() => onBulkTag("oppose")}
                      disabled={isBulkTagging}
                    >
                      <XCircle className="h-3 w-3 mr-1 text-red-600" />
                      <span className="hidden sm:inline">Oppose</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Mark as Oppose</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                        2
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-700 border-yellow-200"
                      onClick={() => onBulkTag("swing")}
                      disabled={isBulkTagging}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1 text-yellow-600" />
                      <span className="hidden sm:inline">Swing</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Mark as Swing</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                        3
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs hover:bg-muted"
                      onClick={() => onBulkTag("neutral")}
                      disabled={isBulkTagging}
                    >
                      <HelpCircle className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="hidden sm:inline">Neutral</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>Mark as Neutral</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                        4
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Remove Tag Button */}
                {onBulkRemoveTag && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs hover:bg-muted border-dashed ml-2"
                        onClick={onBulkRemoveTag}
                        disabled={isBulkTagging}
                      >
                        <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="hidden sm:inline">Remove Tag</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Remove sentiment tags</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Other Actions */}
            <div className="flex gap-1 ml-auto mt-2 sm:mt-0 w-full sm:w-auto justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 sm:flex-none"
                  >
                    <FileDown className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export selected voters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1 sm:flex-none"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Call List</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create call list</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs hidden sm:inline-flex"
                onClick={() => updateSelection(new Set())}
              >
                Clear
              </Button>
            </div>

            {/* Keyboard hint */}
            {onBulkTag && (
              <div className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground border-l border-border pl-3">
                <Keyboard className="h-3 w-3" />
                <span>Press 1-4 to tag</span>
              </div>
            )}
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          {/* Fixed Header */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedIds.size === voters.length && voters.length > 0
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-14 font-medium">Sr.</TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium hidden md:table-cell">
                    Relative
                  </TableHead>
                  <TableHead className="w-16 font-medium hidden sm:table-cell">
                    Age
                  </TableHead>
                  <TableHead className="w-16 font-medium hidden sm:table-cell">
                    Gender
                  </TableHead>
                  <TableHead className="w-14 font-medium hidden sm:table-cell">
                    Ward
                  </TableHead>
                  <TableHead className="w-16 font-medium hidden md:table-cell">
                    House
                  </TableHead>
                  <TableHead className="w-20 font-medium">Sentiment</TableHead>
                  <TableHead className="w-28 font-medium hidden lg:table-cell">
                    Turnout
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Virtualized Body */}
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: Math.min(voters.length * ROW_HEIGHT, 600) }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const voter = voters[virtualRow.index];
                const index = virtualRow.index;
                const id = String(voter.voter_id || voter.serial_no || index);
                const isSelected = selectedIds.has(id);
                const sentimentBadge = getSentimentBadge(voter.sentiment);
                const turnoutBadge = getTurnoutBadge(voter.turnout_status);

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={cn(
                      "group cursor-pointer transition-colors border-b flex items-center",
                      getSentimentRowColor(voter.sentiment),
                      isSelected && "!bg-primary/10 ring-1 ring-primary/30"
                    )}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => toggleSelect(id)}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-10 px-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(id)}
                        aria-label={`Select ${voter.name}`}
                      />
                    </div>
                    {/* Serial No */}
                    <div className="w-14 px-2 flex-shrink-0 font-mono text-xs text-muted-foreground">
                      {voter.serial_no}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0 px-2">
                      <div className="font-medium truncate">{voter.name}</div>
                      {voter.name_hindi && voter.name_hindi !== voter.name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {voter.name_hindi}
                        </div>
                      )}
                      {/* Mobile-only details */}
                      <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 font-normal"
                        >
                          {voter.age} •{" "}
                          {voter.gender === "पु"
                            ? "M"
                            : voter.gender === "म"
                            ? "F"
                            : voter.gender?.charAt(0)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 font-normal"
                        >
                          W-{voter.ward_no}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-1 truncate">
                          {voter.relative_name}
                        </span>
                      </div>
                    </div>
                    {/* Relative Name */}
                    <div className="hidden md:block w-40 px-2 flex-shrink-0">
                      <div className="text-sm truncate">
                        {voter.relative_name}
                      </div>
                      {voter.relative_name_hindi &&
                        voter.relative_name_hindi !== voter.relative_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {voter.relative_name_hindi}
                          </div>
                        )}
                    </div>
                    {/* Age */}
                    <div className="hidden sm:flex w-16 px-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-normal",
                          getAgeColor(voter.age)
                        )}
                      >
                        {voter.age}
                      </Badge>
                    </div>
                    {/* Gender */}
                    <div className="hidden sm:flex w-16 px-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-normal",
                          getGenderColor(voter.gender)
                        )}
                      >
                        {voter.gender === "पु"
                          ? "M"
                          : voter.gender === "म"
                          ? "F"
                          : voter.gender?.charAt(0)}
                      </Badge>
                    </div>
                    {/* Ward */}
                    <div className="hidden sm:block w-14 px-2 flex-shrink-0 font-mono text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{voter.ward_no}</span>
                        </TooltipTrigger>
                        <TooltipContent>Ward {voter.ward_no}</TooltipContent>
                      </Tooltip>
                    </div>
                    {/* House No */}
                    <div className="hidden md:block w-16 px-2 flex-shrink-0 font-mono text-xs">
                      {voter.house_no}
                    </div>
                    {/* Sentiment */}
                    <div className="w-20 px-2 flex-shrink-0">
                      {sentimentBadge ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs font-medium cursor-help",
                                sentimentBadge.className
                              )}
                            >
                              {sentimentBadge.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-xs">
                              <div className="font-medium">
                                {sentimentBadge.label}
                              </div>
                              {voter.sentiment_source && (
                                <div className="text-muted-foreground mt-0.5">
                                  Source: {voter.sentiment_source}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    {/* Turnout */}
                    <div className="hidden lg:block w-28 px-2 flex-shrink-0">
                      {turnoutBadge ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs font-medium cursor-help",
                                turnoutBadge.className
                              )}
                            >
                              {turnoutBadge.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-xs">
                              <div className="font-medium">
                                {turnoutBadge.label}
                              </div>
                              {voter.turnout_marked_at && (
                                <div className="text-muted-foreground mt-0.5">
                                  Marked at: {voter.turnout_marked_at}
                                </div>
                              )}
                              {voter.turnout_note && (
                                <div className="text-muted-foreground mt-0.5">
                                  Note: {voter.turnout_note}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not marked
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div
                      className="w-10 px-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {/* Quick Tag Buttons - appear on hover (desktop) or always (mobile) */}
                        {onQuickTag && (
                          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {quickTaggingId === id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickTag(voter, "support");
                                      }}
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-green-100 text-green-600 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="text-xs"
                                  >
                                    Support (1)
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickTag(voter, "oppose");
                                      }}
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-100 text-red-600 transition-colors"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="text-xs"
                                  >
                                    Oppose (2)
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickTag(voter, "swing");
                                      }}
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-yellow-100 text-yellow-600 transition-colors"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="text-xs"
                                  >
                                    Swing (3)
                                  </TooltipContent>
                                </Tooltip>
                                {/* Remove Tag Button */}
                                {onQuickRemoveTag && voter.sentiment && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const voterId =
                                            voter.voter_id ||
                                            parseInt(voter.serial_no, 10);
                                          if (!isNaN(voterId)) {
                                            setQuickTaggingId(id);
                                            onQuickRemoveTag(voterId)
                                              .catch(() => {})
                                              .finally(() =>
                                                setQuickTaggingId(null)
                                              );
                                          }
                                        }}
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors border border-dashed border-border"
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="text-xs"
                                    >
                                      Remove Tag
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setProfileVoterId(voter.voter_id);
                            setProfileOpen(true);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <VoterProfilePanel
        voterId={profileVoterId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </TooltipProvider>
  );
}
