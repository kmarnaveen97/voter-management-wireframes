"use client";

import { memo } from "react";
import { Home, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WardData, HouseData } from "./types";
import {
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
  WARD_STATUS_COLORS,
} from "./constants";
import { getWardHeatColor, getStrategicVerdict } from "./helpers";

// Intelligence Card - Shows strategic info on ward hover
export const IntelligenceCard = memo(function IntelligenceCard({
  ward,
}: {
  ward: WardData;
}) {
  const verdict = getStrategicVerdict(ward.win_margin_percent);
  const myVotes = ward.support_count;
  const opponentVotes = ward.oppose_count;
  const undecided =
    ward.swing_count +
    (ward.total_voters -
      ward.support_count -
      ward.oppose_count -
      ward.swing_count);

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg"
            style={{
              backgroundColor: getWardHeatColor(ward.win_margin_percent),
            }}
          >
            {ward.ward_no}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Ward {ward.ward_no}</h4>
            <p className="text-xs text-muted-foreground">
              {ward.total_voters} voters
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Verdict */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg bg-muted/50 mb-3",
          verdict.color
        )}
      >
        <span className="text-lg">{verdict.emoji}</span>
        <span className="font-semibold text-sm">{verdict.label}</span>
      </div>

      {/* Vote Comparison */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">My Votes</span>
          <span className="font-bold text-green-600">{myVotes}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Opponent</span>
          <span className="font-bold text-red-600">{opponentVotes}</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Undecided</span>
          <span className="font-bold text-yellow-600">{undecided}</span>
        </div>
      </div>

      {/* Margin Bar */}
      <div className="mt-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(myVotes / ward.total_voters) * 100}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${(opponentVotes / ward.total_voters) * 100}%` }}
          />
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{
              width: `${(ward.swing_count / ward.total_voters) * 100}%`,
            }}
          />
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1">
          Margin:{" "}
          <span
            className={
              ward.win_margin_percent >= 0 ? "text-green-600" : "text-red-600"
            }
          >
            {ward.win_margin_percent >= 0 ? "+" : ""}
            {ward.win_margin_percent.toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Action hint */}
      <p className="text-[10px] text-center text-primary mt-3 font-medium">
        Click to explore houses →
      </p>
    </div>
  );
});

// House Intelligence Card
export const HouseIntelligenceCard = memo(function HouseIntelligenceCard({
  house,
}: {
  house: HouseData;
}) {
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3 w-56 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: SENTIMENT_COLORS[house.sentiment] }}
        >
          <Home size={16} className="text-white" />
        </div>
        <div>
          <h4 className="font-bold text-foreground text-sm">
            House {house.house_no}
          </h4>
          <p className="text-xs text-muted-foreground">
            {house.family_size} members
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sentiment</span>
          <Badge
            variant="outline"
            className="text-[10px] h-5"
            style={{
              borderColor: SENTIMENT_COLORS[house.sentiment],
              color: SENTIMENT_COLORS[house.sentiment],
            }}
          >
            {SENTIMENT_LABELS[house.sentiment]}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">
            {Math.round(house.confidence * 100)}%
          </span>
        </div>
        <div className="flex gap-2 pt-1 border-t border-border text-[10px]">
          <span className="text-green-600">👍 {house.support_count}</span>
          <span className="text-red-600">👎 {house.oppose_count}</span>
          <span className="text-yellow-600">🎯 {house.swing_count}</span>
        </div>
      </div>

      {house.has_manual_tag && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
          <Check size={10} />
          <span>Has manual tags</span>
        </div>
      )}

      <p className="text-[10px] text-center text-primary mt-2 font-medium">
        Click to view family →
      </p>
    </div>
  );
});

// Ward Card for sidebar
export const WardCard = memo(function WardCard({
  ward,
  isSelected,
  onClick,
}: {
  ward: WardData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColor = WARD_STATUS_COLORS[ward.status];
  const marginSign = ward.win_margin_percent >= 0 ? "+" : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-xl border-2 transition-all duration-200 text-left group",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-transparent hover:bg-accent hover:border-accent-foreground/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            )}
            style={{ backgroundColor: statusColor }}
          >
            {ward.ward_no}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              Ward {ward.ward_no}
            </p>
            <p className="text-xs text-muted-foreground">
              {ward.total_voters} voters
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold",
              ward.status === "safe" && "border-green-500 text-green-600",
              ward.status === "battleground" &&
                "border-yellow-500 text-yellow-600",
              ward.status === "lost" && "border-red-500 text-red-600"
            )}
          >
            {marginSign}
            {ward.win_margin_percent.toFixed(1)}%
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1 capitalize">
            {ward.status}
          </p>
        </div>
      </div>

      {/* Mini sentiment bar */}
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500"
          style={{
            width: `${(ward.support_count / ward.total_voters) * 100}%`,
          }}
        />
        <div
          className="h-full bg-red-500"
          style={{ width: `${(ward.oppose_count / ward.total_voters) * 100}%` }}
        />
        <div
          className="h-full bg-yellow-500"
          style={{ width: `${(ward.swing_count / ward.total_voters) * 100}%` }}
        />
      </div>
    </button>
  );
});
