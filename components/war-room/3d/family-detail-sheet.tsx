"use client";

/**
 * FamilyDetailSheet — Clean & Simple Family Information Panel
 *
 * Designed for clarity and easy information scanning.
 * Focus on readability over visual effects.
 *
 * @version 3.0.0 — Simplified Design
 */

import React, { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Home,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SentimentType, TaggableSentiment } from "@/lib/api";
import type { Family3DData, FamilyMember } from "../war-room-3d-scene";

// ============================================================================
// Simple Sentiment Configuration
// ============================================================================

const SENTIMENT_CONFIG: Record<
  SentimentType,
  {
    color: string;
    bgClass: string;
    textClass: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  support: {
    color: "#22c55e",
    bgClass: "bg-green-500/20",
    textClass: "text-green-400",
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Support",
  },
  oppose: {
    color: "#ef4444",
    bgClass: "bg-red-500/20",
    textClass: "text-red-400",
    icon: <XCircle className="h-4 w-4" />,
    label: "Oppose",
  },
  swing: {
    color: "#f59e0b",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-400",
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Swing",
  },
  unknown: {
    color: "#6b7280",
    bgClass: "bg-gray-500/20",
    textClass: "text-gray-400",
    icon: <HelpCircle className="h-4 w-4" />,
    label: "Unknown",
  },
  neutral: {
    color: "#06b6d4",
    bgClass: "bg-cyan-500/20",
    textClass: "text-cyan-400",
    icon: <User className="h-4 w-4" />,
    label: "Neutral",
  },
};

// ============================================================================
// Types
// ============================================================================

interface FamilyDetailSheetProps {
  family: Family3DData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wardNo: string | null;
  boothId: string | null;
  onTagMember?: (
    voterId: number,
    sentiment: TaggableSentiment
  ) => Promise<void>;
  onTagAllFamily?: (
    houseNo: string,
    sentiment: TaggableSentiment
  ) => Promise<void>;
}

// ============================================================================
// Simple MemberRow Component — Clean & Readable
// ============================================================================

interface MemberRowProps {
  member: FamilyMember;
  onTag: (sentiment: TaggableSentiment) => void;
  isTagging: boolean;
}

function MemberRow({ member, onTag, isTagging }: MemberRowProps) {
  const config = SENTIMENT_CONFIG[member.sentiment || "unknown"];
  const isMale = member.gender === "Male" || member.gender === "पु";
  const memberRelation = (member as any).relation;
  const isHead =
    memberRelation === "Head" ||
    memberRelation === "स्वयं" ||
    memberRelation === "self";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      {/* Simple Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          config.bgClass
        )}
      >
        <User className={cn("h-5 w-5", config.textClass)} />
      </div>

      {/* Member Info — Clear & Simple */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{member.name}</span>
          {isHead && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
              HEAD
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-sm text-white/60">
          <span>{isMale ? "Male" : "Female"}</span>
          <span>•</span>
          <span>{member.age} yrs</span>
          <span>•</span>
          <span className={config.textClass}>{config.label}</span>
        </div>
      </div>

      {/* Tag Buttons — Simple & Clear */}
      <div className="flex gap-1.5">
        {(["support", "oppose", "swing"] as SentimentType[]).map((s) => {
          const cfg = SENTIMENT_CONFIG[s];
          const isActive = member.sentiment === s;
          return (
            <button
              key={s}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                isActive
                  ? cn(cfg.bgClass, cfg.textClass)
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
              )}
              style={
                isActive ? { boxShadow: `0 0 0 2px ${cfg.color}` } : undefined
              }
              onClick={() => onTag(s)}
              disabled={isTagging}
              title={cfg.label}
            >
              {isTagging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                cfg.icon
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component — Clean & Simple Design
// ============================================================================

export function FamilyDetailSheet({
  family,
  open,
  onOpenChange,
  wardNo,
  boothId,
  onTagMember,
  onTagAllFamily,
}: FamilyDetailSheetProps) {
  const [taggingMemberId, setTaggingMemberId] = useState<number | null>(null);
  const [taggingAll, setTaggingAll] = useState<SentimentType | null>(null);

  // Handle individual member tagging
  const handleTagMember = useCallback(
    async (voterId: number, sentiment: SentimentType) => {
      if (!onTagMember) return;
      setTaggingMemberId(voterId);
      try {
        await onTagMember(voterId, sentiment);
      } finally {
        setTaggingMemberId(null);
      }
    },
    [onTagMember]
  );

  // Handle bulk family tagging
  const handleTagAll = useCallback(
    async (sentiment: SentimentType) => {
      if (!onTagAllFamily || !family) return;
      setTaggingAll(sentiment);
      try {
        await onTagAllFamily(family.houseNo, sentiment);
      } finally {
        setTaggingAll(null);
      }
    },
    [onTagAllFamily, family]
  );

  if (!family) return null;

  const dominantConfig = SENTIMENT_CONFIG[family.sentiment];
  const members = family.members || [];
  const totalVoters = family.voterCount || 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] p-0 bg-slate-900 border-t border-white/10 flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            HEADER — Simple & Clear
        ════════════════════════════════════════════════════════════════════ */}
        <div className="px-5 pb-4 border-b border-white/10">
          <SheetHeader>
            <div className="flex items-center gap-4">
              {/* House Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  dominantConfig.bgClass
                )}
              >
                <Home className={cn("h-6 w-6", dominantConfig.textClass)} />
              </div>

              {/* Title & Location */}
              <div className="flex-1">
                <SheetTitle className="text-xl font-bold text-white">
                  House {family.houseNo}
                </SheetTitle>
                <p className="text-sm text-white/50 mt-0.5">
                  {wardNo && `Ward ${wardNo}`}
                  {wardNo && boothId && " • "}
                  {boothId && `Booth ${boothId}`}
                </p>
              </div>

              {/* Sentiment Badge */}
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg flex items-center gap-2",
                  dominantConfig.bgClass
                )}
              >
                <span className={dominantConfig.textClass}>
                  {dominantConfig.icon}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium capitalize",
                    dominantConfig.textClass
                  )}
                >
                  {family.sentiment}
                </span>
              </div>
            </div>
          </SheetHeader>

          {/* Head of Family */}
          {family.headOfFamily && (
            <p className="mt-3 text-sm text-white/60">
              <span className="text-white/40">Head:</span>{" "}
              <span className="text-white/80 font-medium">
                {family.headOfFamily}
              </span>
            </p>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STATS — Large, Clear Numbers
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-4 border-b border-white/10">
          {[
            {
              value: family.voterCount,
              label: "Total",
              textClass: "text-white",
            },
            {
              value: family.supportCount,
              label: "Support",
              textClass: "text-green-400",
            },
            {
              value: family.opposeCount,
              label: "Oppose",
              textClass: "text-red-400",
            },
            {
              value: family.swingCount,
              label: "Swing",
              textClass: "text-amber-400",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "py-4 text-center",
                i > 0 && "border-l border-white/10"
              )}
            >
              <div className={cn("text-2xl font-bold", stat.textClass)}>
                {stat.value}
              </div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            DISTRIBUTION BAR — Simple Visual
        ════════════════════════════════════════════════════════════════════ */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>Distribution</span>
            <span>{totalVoters} voters</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-white/10 flex">
            {totalVoters > 0 && (
              <>
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(family.supportCount / totalVoters) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${(family.opposeCount / totalVoters) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${(family.swingCount / totalVoters) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
          {/* Simple Legend */}
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-white/50">Support</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-white/50">Oppose</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-white/50">Swing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-white/50">Unknown</span>
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MEMBERS LIST — Scrollable
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{
            minHeight: "120px",
            maxHeight: "40vh",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80">
              Family Members ({members.length})
            </h3>
          </div>

          <div className="space-y-2">
            {members.length > 0 ? (
              members.map((member) => (
                <MemberRow
                  key={member.voter_id}
                  member={member}
                  onTag={(sentiment) =>
                    handleTagMember(member.voter_id, sentiment)
                  }
                  isTagging={taggingMemberId === member.voter_id}
                />
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No member details available</p>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            QUICK ACTIONS — Simple Buttons
        ════════════════════════════════════════════════════════════════════ */}
        <div className="px-5 py-4 border-t border-white/10 bg-slate-950">
          <p className="text-xs text-white/40 mb-3">
            Tag all {family.voterCount} members:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(["support", "oppose", "swing", "unknown"] as SentimentType[]).map(
              (sentiment) => {
                const cfg = SENTIMENT_CONFIG[sentiment];
                const isLoading = taggingAll === sentiment;
                const isActive = family.sentiment === sentiment;
                return (
                  <button
                    key={sentiment}
                    className={cn(
                      "py-3 rounded-lg flex flex-col items-center gap-1 transition-colors",
                      isActive
                        ? cn(cfg.bgClass, cfg.textClass)
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                    style={
                      isActive
                        ? { boxShadow: `0 0 0 2px ${cfg.color}` }
                        : undefined
                    }
                    onClick={() => handleTagAll(sentiment)}
                    disabled={taggingAll !== null}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span className={isActive ? cfg.textClass : ""}>
                          {cfg.icon}
                        </span>
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FamilyDetailSheet;
