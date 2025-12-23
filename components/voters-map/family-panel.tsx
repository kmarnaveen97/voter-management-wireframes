"use client";

import { memo, useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown, HelpCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FamilyMember, FamilySentiment } from "./types";
import { SENTIMENT_COLORS, SENTIMENT_LABELS } from "./constants";

// Family Member Card with Tagging
export const FamilyMemberCard = memo(function FamilyMemberCard({
  member,
  onTag,
  isTagging,
}: {
  member: FamilyMember;
  onTag: (
    voterId: number,
    sentiment: "support" | "oppose" | "swing" | "unknown"
  ) => void;
  isTagging: boolean;
}) {
  const isFemale =
    member.gender === "Female" ||
    member.gender === "महिला" ||
    member.gender === "म";
  const isYouth = member.age >= 18 && member.age <= 25;
  const sentimentColor = SENTIMENT_COLORS[member.sentiment];

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        member.is_manually_tagged
          ? "bg-primary/5 border-primary/30"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
              isFemale ? "bg-pink-500" : "bg-primary"
            )}
          >
            {member.name.charAt(0)}
          </div>
          {/* Sentiment indicator ring */}
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: sentimentColor,
              opacity: member.confidence,
            }}
          />
          {member.is_manually_tagged && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-white">
              <Check size={10} className="text-white" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-foreground truncate">
              {member.name}
            </p>
            {isYouth && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700 text-[9px] px-1 py-0"
              >
                🎯 Youth
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {member.age}Y • {member.relationship}
          </p>

          {/* Source info */}
          <div className="flex items-center gap-1.5 mt-1">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4"
              style={{
                borderColor: sentimentColor,
                color: sentimentColor,
              }}
            >
              {SENTIMENT_LABELS[member.sentiment]}
            </Badge>
            <span className="text-[9px] text-muted-foreground">
              {member.sentiment_source === "manual"
                ? "✋ Manual"
                : member.sentiment_source === "inherited_spouse"
                ? "💑 From spouse"
                : member.sentiment_source === "inherited_parent"
                ? "👨‍👧 From parent"
                : member.sentiment_source === "youth_rule"
                ? "🎯 Youth swing"
                : "❓ Unknown"}
            </span>
          </div>
        </div>

        {/* Quick Tag Buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={member.sentiment === "support" ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  member.sentiment === "support" &&
                    "bg-green-500 hover:bg-green-600"
                )}
                onClick={() => onTag(member.voter_id, "support")}
                disabled={isTagging}
              >
                <ThumbsUp size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tag as Support</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={member.sentiment === "oppose" ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  member.sentiment === "oppose" && "bg-red-500 hover:bg-red-600"
                )}
                onClick={() => onTag(member.voter_id, "oppose")}
                disabled={isTagging}
              >
                <ThumbsDown size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tag as Oppose</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={member.sentiment === "swing" ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  member.sentiment === "swing" &&
                    "bg-yellow-500 hover:bg-yellow-600"
                )}
                onClick={() => onTag(member.voter_id, "swing")}
                disabled={isTagging}
              >
                <HelpCircle size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tag as Swing</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

// Family Details Panel (renders content only, container handled by parent)
export const FamilyDetailsPanel = memo(function FamilyDetailsPanel({
  family,
  onClose,
  onTagVoter,
  isTagging,
}: {
  family: FamilySentiment | null;
  onClose: () => void;
  onTagVoter: (
    voterId: number,
    sentiment: "support" | "oppose" | "swing" | "unknown"
  ) => void;
  isTagging: boolean;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!family) return null;

  // Safely access sentiment_breakdown with defaults
  const breakdown = family.sentiment_breakdown || {
    support: 0,
    oppose: 0,
    swing: 0,
    unknown: 0,
  };
  const total =
    (breakdown.support || 0) +
      (breakdown.oppose || 0) +
      (breakdown.swing || 0) +
      (breakdown.unknown || 0) || 1;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-4 shrink-0 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl">
              {family.house_no}
            </div>
            <div>
              <h3 className="font-bold text-lg">House {family.house_no}</h3>
              <p className="text-white/70 text-sm">
                Ward {family.ward_no} • {family.family_size} members
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Sentiment Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-white/80">
            <span>Family Sentiment</span>
            <span className="capitalize">{family.dominant_sentiment}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-400 transition-all"
              style={{ width: `${(breakdown.support / total) * 100}%` }}
            />
            <div
              className="h-full bg-red-400 transition-all"
              style={{ width: `${(breakdown.oppose / total) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-400 transition-all"
              style={{ width: `${(breakdown.swing / total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/60">
            <span>👍 {breakdown.support}</span>
            <span>👎 {breakdown.oppose}</span>
            <span>🎯 {breakdown.swing}</span>
            <span>❓ {breakdown.unknown}</span>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1 py-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Family Members
            </h4>
            {family.has_manual_tags && (
              <Badge variant="secondary" className="text-[10px]">
                <Check size={10} className="mr-1" />
                Has manual tags
              </Badge>
            )}
          </div>
          {family.members.map((member) => (
            <FamilyMemberCard
              key={member.voter_id}
              member={member}
              onTag={onTagVoter}
              isTagging={isTagging}
            />
          ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30 shrink-0 rounded-b-xl">
        <p className="text-[10px] text-center text-muted-foreground">
          Click sentiment buttons to tag voters • Changes propagate to family
        </p>
      </div>
    </div>
  );
});
