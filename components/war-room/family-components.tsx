"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Home,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  api,
  type SentimentType,
  type Family,
  type HousePosition,
} from "@/lib/api";
import { SENTIMENT_COLORS } from "./constants";

// ============================================================================
// Re-export types from API for convenience
// ============================================================================

export type { SentimentType, Family, HousePosition };

export interface FamilyMember {
  voter_id: number;
  name: string;
  age: number;
  gender: string;
  sentiment?: SentimentType;
  is_manual?: boolean;
  is_youth?: boolean;
}

// ============================================================================
// FamilyMemberItem - Individual family member with tagging
// ============================================================================

interface FamilyMemberItemProps {
  member: FamilyMember;
  onTagSentiment: (voterId: number, sentiment: SentimentType) => void;
  allowTagging: boolean;
}

/**
 * FamilyMemberItem - Individual family member with tagging
 * Memoized to prevent re-renders when siblings change
 */
export const FamilyMemberItem = memo(function FamilyMemberItem({
  member,
  onTagSentiment,
  allowTagging,
}: FamilyMemberItemProps) {
  const sentimentConfig =
    SENTIMENT_COLORS[member.sentiment || "unknown"] || SENTIMENT_COLORS.unknown;

  // Determine relationship badge based on age and gender
  const getRelationshipBadge = () => {
    const isYouth = member.is_youth ?? member.age <= 30;
    if (isYouth) return { label: "Youth", color: "bg-blue-100 text-blue-700" };
    if (member.age >= 60)
      return { label: "Senior", color: "bg-purple-100 text-purple-700" };
    return null;
  };

  const relationshipBadge = getRelationshipBadge();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left",
            "hover:bg-muted/50 border border-transparent hover:border-border"
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              backgroundColor: sentimentConfig.light,
              color: sentimentConfig.text,
            }}
          >
            {member.gender === "Male" || member.gender === "पु" ? "M" : "F"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {member.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {member.age}Y •{" "}
              {member.gender === "Male" || member.gender === "पु"
                ? "Male"
                : "Female"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {relationshipBadge && (
              <Badge
                variant="secondary"
                className={cn("text-[10px]", relationshipBadge.color)}
              >
                {relationshipBadge.label}
              </Badge>
            )}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sentimentConfig.bg }}
            />
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm">{member.name}</h4>
            <p className="text-xs text-muted-foreground">
              {member.age} years •{" "}
              {member.gender === "Male" || member.gender === "पु"
                ? "Male"
                : "Female"}
              {member.is_youth && " • Youth Voter"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              style={{
                backgroundColor: sentimentConfig.light,
                color: sentimentConfig.text,
              }}
              className="border-0 capitalize text-xs"
            >
              {member.sentiment}
            </Badge>
            {member.is_manual && (
              <Badge variant="outline" className="text-[10px]">
                Manual
              </Badge>
            )}
          </div>

          {allowTagging && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2">
                Quick Tag:
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-green-50 hover:text-green-700"
                  onClick={() => onTagSentiment(member.voter_id, "support")}
                >
                  <CheckCircle2 size={14} className="text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onTagSentiment(member.voter_id, "oppose")}
                >
                  <XCircle size={14} className="text-red-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-yellow-50 hover:text-yellow-700"
                  onClick={() => onTagSentiment(member.voter_id, "swing")}
                >
                  <AlertTriangle size={14} className="text-yellow-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onTagSentiment(member.voter_id, "unknown")}
                >
                  <HelpCircle size={14} className="text-gray-400" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
FamilyMemberItem.displayName = "FamilyMemberItem";

// ============================================================================
// FamilyCard - Expandable family card with members list
// ============================================================================

interface FamilyCardProps {
  family: Family;
  houseData?: HousePosition;
  isExpanded: boolean;
  onToggle: () => void;
  onTagSentiment: (voterId: number, sentiment: SentimentType) => void;
  allowTagging: boolean;
  listId: number;
  isHighlighted?: boolean;
}

/**
 * FamilyCard - Expandable family card with members list
 * Memoized to prevent re-renders when other cards update
 */
export const FamilyCard = memo(function FamilyCard({
  family,
  houseData,
  isExpanded,
  onToggle,
  onTagSentiment,
  allowTagging,
  listId,
  isHighlighted,
}: FamilyCardProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch members when expanded
  useEffect(() => {
    if (isExpanded && members.length === 0 && !loadingMembers) {
      setLoadingMembers(true);
      api
        .getFamilyMembers(family.ward_no, family.house_no, listId)
        .then((data) => {
          const mappedMembers: FamilyMember[] = (data.members || []).map(
            (m) => ({
              voter_id: m.voter_id,
              name: m.name,
              age: m.age,
              gender: m.gender,
              // Map neutral to unknown for UI consistency
              sentiment:
                m.sentiment === "neutral"
                  ? "unknown"
                  : m.sentiment || "unknown",
              is_manual: false,
              is_youth: m.age <= 30,
            })
          );
          setMembers(mappedMembers);
        })
        .catch((err) => {
          console.error("Failed to fetch family members:", err);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [
    isExpanded,
    family.ward_no,
    family.house_no,
    listId,
    members.length,
    loadingMembers,
  ]);

  const sentimentConfig = houseData
    ? SENTIMENT_COLORS[houseData.sentiment] || SENTIMENT_COLORS.unknown
    : SENTIMENT_COLORS.unknown;

  return (
    <div
      className={cn(
        "bg-card rounded-xl border overflow-hidden transition-all duration-200",
        isHighlighted
          ? "border-primary ring-2 ring-primary/30 shadow-md"
          : "border-border"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: sentimentConfig.light,
            borderLeft: `4px solid ${sentimentConfig.bg}`,
          }}
        >
          <Home size={18} style={{ color: sentimentConfig.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground">
              House {family.house_no}
            </p>
            {houseData?.has_manual_tag && (
              <Badge variant="outline" className="text-[10px] h-4">
                Tagged
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {family.mukhiya_name || "Unknown"} • {family.member_count} members
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {houseData && (
            <div className="flex gap-0.5">
              {houseData.support_count > 0 && (
                <div
                  className="w-2 h-2 rounded-full bg-green-500"
                  title={`${houseData.support_count} support`}
                />
              )}
              {houseData.oppose_count > 0 && (
                <div
                  className="w-2 h-2 rounded-full bg-red-500"
                  title={`${houseData.oppose_count} oppose`}
                />
              )}
              {houseData.swing_count > 0 && (
                <div
                  className="w-2 h-2 rounded-full bg-yellow-500"
                  title={`${houseData.swing_count} swing`}
                />
              )}
            </div>
          )}
          <ChevronRight
            size={16}
            className={cn(
              "text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expanded Members List */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 p-2">
          {loadingMembers ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-1">
              {members.map((member) => (
                <FamilyMemberItem
                  key={member.voter_id}
                  member={member}
                  onTagSentiment={onTagSentiment}
                  allowTagging={allowTagging}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No members found
            </p>
          )}
        </div>
      )}
    </div>
  );
});
FamilyCard.displayName = "FamilyCard";

// ============================================================================
// WardFamiliesPanel - Sidebar panel for ward families
// ============================================================================

interface WardFamiliesPanelProps {
  wardNo: string;
  listId: number;
  houses: HousePosition[];
  onClose: () => void;
  onTagSentiment: (voterId: number, sentiment: SentimentType) => Promise<void>;
  highlightedHouseNo?: string | null;
  onOpenWarRoom?: () => void;
}

export function WardFamiliesPanel({
  wardNo,
  listId,
  houses,
  onClose,
  onTagSentiment,
  highlightedHouseNo,
  onOpenWarRoom,
}: WardFamiliesPanelProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [allowTagging, setAllowTagging] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch families for the selected ward
  useEffect(() => {
    setLoading(true);
    api
      .getFamilies(1, 500, listId)
      .then((data) => {
        const wardFamilies = (data.families || []).filter(
          (f) => f.ward_no === wardNo
        );
        setFamilies(wardFamilies);
      })
      .catch((err) => {
        console.error("Failed to fetch families:", err);
        toast.error("Failed to load families");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [listId, wardNo]);

  // Filter families by search
  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return families;
    const query = searchQuery.toLowerCase();
    return families.filter(
      (f) =>
        f.house_no.toLowerCase().includes(query) ||
        f.mukhiya_name?.toLowerCase().includes(query)
    );
  }, [families, searchQuery]);

  // Create a map of house_no to HousePosition for quick lookup
  const housesMap = useMemo(() => {
    const map = new Map<string, HousePosition>();
    houses.forEach((h) => map.set(h.house_no, h));
    return map;
  }, [houses]);

  // Calculate ward stats from houses
  const wardStats = useMemo(() => {
    let support = 0,
      oppose = 0,
      swing = 0,
      unknown = 0;
    houses.forEach((h) => {
      support += h.support_count;
      oppose += h.oppose_count;
      swing += h.swing_count;
      const others =
        h.family_size - h.support_count - h.oppose_count - h.swing_count;
      unknown += Math.max(0, others);
    });
    return {
      support,
      oppose,
      swing,
      unknown,
      total: support + oppose + swing + unknown,
    };
  }, [houses]);

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h2 className="font-bold text-lg">Ward {wardNo}</h2>
              <p className="text-white/70 text-xs">
                {families.length} families
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenWarRoom && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={onOpenWarRoom}
                  >
                    <Maximize size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Open Ward War Room</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Badge className="bg-white/20 text-white border-0">
              {houses.length} houses
            </Badge>
          </div>
        </div>

        {/* Ward Stats Mini Bar */}
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/20">
          {wardStats.total > 0 && (
            <>
              <div
                className="bg-green-400 transition-all"
                style={{
                  width: `${(wardStats.support / wardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-red-400 transition-all"
                style={{
                  width: `${(wardStats.oppose / wardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-yellow-400 transition-all"
                style={{
                  width: `${(wardStats.swing / wardStats.total) * 100}%`,
                }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-[10px] text-white/60 mt-1">
          <span>{wardStats.support} support</span>
          <span>{wardStats.swing} swing</span>
          <span>{wardStats.oppose} oppose</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-border space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search house or mukhiya..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Allow Tagging Toggle */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor="allow-tagging"
            className="text-xs text-muted-foreground"
          >
            Enable quick tagging
          </Label>
          <Switch
            id="allow-tagging"
            checked={allowTagging}
            onCheckedChange={setAllowTagging}
          />
        </div>
      </div>

      {/* Families List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-2">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : filteredFamilies.length > 0 ? (
            filteredFamilies.map((family) => (
              <FamilyCard
                key={`${family.ward_no}-${family.house_no}`}
                family={family}
                houseData={housesMap.get(family.house_no)}
                isExpanded={expandedFamily === family.house_no}
                onToggle={() =>
                  setExpandedFamily(
                    expandedFamily === family.house_no ? null : family.house_no
                  )
                }
                onTagSentiment={onTagSentiment}
                allowTagging={allowTagging}
                listId={listId}
                isHighlighted={highlightedHouseNo === family.house_no}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No families match your search"
                  : "No families found"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with bulk action */}
      {allowTagging && (
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Hover on a family member to quick tag
          </p>
        </div>
      )}
    </div>
  );
}
