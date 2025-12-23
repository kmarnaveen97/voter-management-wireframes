"use client";

import React, { useState, useEffect, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Home,
  Users,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Keyboard,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  api,
  type SentimentType,
  type WardMapSummary,
  type HousePosition,
} from "@/lib/api";
import { SENTIMENT_COLORS, WARD_STATUS_COLORS } from "./constants";

// Re-export types for convenience
export type { SentimentType, WardMapSummary, HousePosition };

// ============================================================================
// WardHoverCard - Floating hover card for ward info
// ============================================================================

interface WardHoverCardProps {
  ward: WardMapSummary;
  position: { x: number; y: number };
}

/**
 * WardHoverCard - Floating hover card for ward info
 * Memoized to prevent re-renders during hover events
 */
export const WardHoverCard = memo(function WardHoverCard({
  ward,
  position,
}: WardHoverCardProps) {
  const statusConfig = WARD_STATUS_COLORS[ward.status];

  // Calculate position to stay within viewport
  const cardWidth = 240;
  const cardHeight = 280;
  const padding = 16;

  // Default position: to the right and slightly above cursor
  let left = position.x + 16;
  let top = position.y - 10;

  // Check if card would go off right edge
  if (typeof window !== "undefined") {
    if (left + cardWidth + padding > window.innerWidth) {
      left = position.x - cardWidth - 16;
    }
    if (top + cardHeight + padding > window.innerHeight) {
      top = window.innerHeight - cardHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }
  }

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: left,
        top: top,
      }}
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 min-w-[220px]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-foreground">Ward {ward.ward_no}</h4>
          <Badge
            style={{
              backgroundColor: statusConfig.fill,
              color: statusConfig.stroke,
            }}
            className="border-0 text-xs font-semibold"
          >
            {statusConfig.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Voters</span>
            <span className="font-semibold">{ward.total_voters}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">My Supporters</span>
            <span className="font-semibold text-green-600">
              {ward.support_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Opposition</span>
            <span className="font-semibold text-red-600">
              {ward.oppose_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-600">Swing Voters</span>
            <span className="font-semibold text-yellow-600">
              {ward.swing_count}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Win Margin</span>
            <span
              className={cn(
                "font-bold",
                ward.win_margin_percent > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {ward.win_margin_percent > 0 ? "+" : ""}
              {ward.win_margin_percent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
WardHoverCard.displayName = "WardHoverCard";

// ============================================================================
// HouseDetailsDialog - Bottom sheet for house details
// ============================================================================

interface HouseDetailsDialogProps {
  house: HousePosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagSentiment: (
    wardNo: string,
    houseNo: string,
    sentiment: SentimentType
  ) => void;
  onRemoveTag?: (wardNo: string, houseNo: string) => void;
  isTagging?: boolean;
}

/**
 * HouseDetailsDialog - Bottom sheet for house details
 * Memoized to prevent re-renders when other state changes
 */
export const HouseDetailsDialog = memo(function HouseDetailsDialog({
  house,
  open,
  onOpenChange,
  onTagSentiment,
  onRemoveTag,
  isTagging = false,
}: HouseDetailsDialogProps) {
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{
      voter_id: number;
      name: string;
      age: number;
      gender: string;
      sentiment?: SentimentType | "neutral";
    }>
  >([]);

  // Fetch family members when dialog opens
  useEffect(() => {
    if (open && house) {
      setLoadingFamily(true);
      setFamilyMembers([]);
      api
        .getFamilyMembers(house.ward_no || "", house.house_no)
        .then((data) => {
          setFamilyMembers(data.members || []);
        })
        .catch((err) => {
          console.error("Failed to fetch family members:", err);
        })
        .finally(() => {
          setLoadingFamily(false);
        });
    }
  }, [open, house?.ward_no, house?.house_no]);

  if (!house) return null;

  const sentimentConfig =
    SENTIMENT_COLORS[house.sentiment] || SENTIMENT_COLORS.unknown;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Home size={18} className="text-primary" />
            House {house.house_no} • Ward {house.ward_no}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Current Status */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="font-semibold text-foreground">
                  {house.family_size || 0} family members
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: sentimentConfig.light }}
              >
                {house.sentiment === "support" && (
                  <CheckCircle2
                    size={24}
                    style={{ color: sentimentConfig.bg }}
                  />
                )}
                {house.sentiment === "oppose" && (
                  <XCircle size={24} style={{ color: sentimentConfig.bg }} />
                )}
                {house.sentiment === "swing" && (
                  <AlertTriangle
                    size={24}
                    style={{ color: sentimentConfig.bg }}
                  />
                )}
                {house.sentiment === "unknown" && (
                  <HelpCircle size={24} style={{ color: sentimentConfig.bg }} />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Badge
                style={{
                  backgroundColor: sentimentConfig.light,
                  color: sentimentConfig.text,
                }}
                className="border-0 capitalize"
              >
                {house.sentiment}
              </Badge>
              {house.has_manual_tag && (
                <Badge variant="outline" className="text-xs">
                  Manually Tagged
                </Badge>
              )}
            </div>
          </div>

          {/* Family Members Preview */}
          {loadingFamily ? (
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Loader2 size={14} className="animate-spin" />
                Loading family members...
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : familyMembers.length > 0 ? (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Family Members ({familyMembers.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {familyMembers.slice(0, 5).map((member) => {
                  // Map neutral to unknown for color lookup
                  const colorKey =
                    member.sentiment === "neutral"
                      ? "unknown"
                      : member.sentiment || "unknown";
                  const colors =
                    SENTIMENT_COLORS[
                      colorKey as keyof typeof SENTIMENT_COLORS
                    ] || SENTIMENT_COLORS.unknown;
                  return (
                    <div
                      key={member.voter_id}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                        style={{
                          backgroundColor: colors.light,
                          color: colors.text,
                        }}
                      >
                        {member.gender === "Male" || member.gender === "पु"
                          ? "M"
                          : "F"}
                      </div>
                      <span className="flex-1 truncate">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.age}y
                      </span>
                    </div>
                  );
                })}
                {familyMembers.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{familyMembers.length - 5} more
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Tag Actions with keyboard hints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">
                Update Sentiment
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Keyboard size={12} />
                <span>Press 1-4</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-between gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 h-12"
                onClick={() =>
                  onTagSentiment(house.ward_no || "", house.house_no, "support")
                }
                disabled={isTagging}
              >
                <span className="flex items-center gap-2">
                  {isTagging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  Support
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                  1
                </kbd>
              </Button>
              <Button
                variant="outline"
                className="justify-between gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-12"
                onClick={() =>
                  onTagSentiment(house.ward_no || "", house.house_no, "oppose")
                }
                disabled={isTagging}
              >
                <span className="flex items-center gap-2">
                  {isTagging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  Oppose
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                  2
                </kbd>
              </Button>
              <Button
                variant="outline"
                className="justify-between gap-2 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300 h-12"
                onClick={() =>
                  onTagSentiment(house.ward_no || "", house.house_no, "swing")
                }
                disabled={isTagging}
              >
                <span className="flex items-center gap-2">
                  {isTagging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-500" />
                  )}
                  Swing
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                  3
                </kbd>
              </Button>
              <Button
                variant="outline"
                className="justify-between gap-2 h-12"
                onClick={() =>
                  onTagSentiment(house.ward_no || "", house.house_no, "unknown")
                }
                disabled={isTagging}
              >
                <span className="flex items-center gap-2">
                  {isTagging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <HelpCircle size={16} className="text-gray-400" />
                  )}
                  Unknown
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                  4
                </kbd>
              </Button>
            </div>

            {/* Remove Tag Button */}
            {onRemoveTag &&
              house.sentiment &&
              house.sentiment !== "unknown" && (
                <Button
                  variant="outline"
                  className="w-full gap-2 h-10 border-dashed hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 mt-2"
                  onClick={() =>
                    onRemoveTag(house.ward_no || "", house.house_no)
                  }
                  disabled={isTagging}
                >
                  <X size={14} />
                  Remove Sentiment Tag
                </Button>
              )}
          </div>

          {/* View Family Details Link */}
          <Button variant="secondary" className="w-full gap-2 h-12" asChild>
            <a
              href={`/voters-management/families?ward=${house.ward_no}&house=${house.house_no}`}
            >
              <Users size={16} />
              View Family Details
              <ChevronRight size={14} className="ml-auto" />
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
HouseDetailsDialog.displayName = "HouseDetailsDialog";
