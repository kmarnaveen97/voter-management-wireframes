"use client";

import React, { useState, memo } from "react";
import {
  Target,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Crosshair,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TargetVoter } from "@/lib/api";

interface FloatingPriorityTargetsProps {
  targets: TargetVoter[];
  onSelectTarget: (target: TargetVoter) => void;
}

/**
 * Floating overlay panel showing priority target voters to convert
 * Used as a map overlay in the war room view
 * Memoized to prevent re-renders when map state changes
 */
export const FloatingPriorityTargets = memo(function FloatingPriorityTargets({
  targets,
  onSelectTarget,
}: FloatingPriorityTargetsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (targets.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute top-14 sm:top-4 right-2 sm:right-4 z-30 transition-all duration-300 ease-in-out",
        isMinimized ? "w-auto" : "w-64 sm:w-80"
      )}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header - Always visible */}
        <button
          className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            {!isMinimized && (
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-semibold text-white">
                  Priority Targets
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  {targets.length} swing voters
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {targets.length}
              </Badge>
            )}
            {isMinimized ? (
              <ChevronLeft size={16} className="text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </div>
        </button>

        {/* Expandable Content */}
        {!isMinimized && (
          <>
            {/* Collapse/Expand List Toggle */}
            <button
              className="w-full px-4 py-2 flex items-center justify-between bg-slate-800/50 border-y border-slate-700/50 hover:bg-slate-800 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-xs text-slate-400">
                {isExpanded ? "Collapse list" : "Show targets"}
              </span>
              {isExpanded ? (
                <ChevronDown size={14} className="text-slate-400" />
              ) : (
                <ChevronRight size={14} className="text-slate-400" />
              )}
            </button>

            {/* Target List */}
            {isExpanded && (
              <ScrollArea className="h-[250px] sm:h-[350px]">
                <div className="divide-y divide-slate-700/50">
                  {targets.map((target, idx) => (
                    <button
                      key={target.voter_id}
                      onClick={() => onSelectTarget(target)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/70 transition-colors text-left group"
                    >
                      {/* Priority Rank */}
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0",
                          idx < 3 &&
                            "bg-gradient-to-br from-red-500 to-red-600",
                          idx >= 3 &&
                            idx < 7 &&
                            "bg-gradient-to-br from-orange-500 to-orange-600",
                          idx >= 7 &&
                            "bg-gradient-to-br from-yellow-500 to-yellow-600"
                        )}
                      >
                        {idx + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                          {target.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          W{target.ward_no} • H#{target.house_no} • {target.age}
                          Y
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            target.priority_score >= 70 && "text-red-400",
                            target.priority_score >= 40 &&
                              target.priority_score < 70 &&
                              "text-orange-400",
                            target.priority_score < 40 && "text-yellow-400"
                          )}
                        >
                          {target.priority_score}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          score
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Quick Stats Footer */}
            <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Avg Score</span>
                <span className="text-white font-medium">
                  {targets.length > 0
                    ? Math.round(
                        targets.reduce((sum, t) => sum + t.priority_score, 0) /
                          targets.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
FloatingPriorityTargets.displayName = "FloatingPriorityTargets";

interface TargetListProps {
  targets: TargetVoter[];
  onSelectTarget: (target: TargetVoter) => void;
}

/**
 * Sidebar target list component
 * Shows priority voters to focus campaign efforts on
 * Memoized to prevent re-renders when other sidebar state changes
 */
export const TargetList = memo(function TargetList({
  targets,
  onSelectTarget,
}: TargetListProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Priority Targets
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {targets.length}
        </Badge>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="divide-y divide-border">
          {targets.slice(0, 10).map((target, idx) => (
            <button
              key={target.voter_id}
              onClick={() => onSelectTarget(target)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                  target.priority_score >= 70 && "bg-red-500",
                  target.priority_score >= 40 &&
                    target.priority_score < 70 &&
                    "bg-yellow-500",
                  target.priority_score < 40 && "bg-blue-500"
                )}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {target.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ward {target.ward_no} • House {target.house_no} • {target.age}
                  Y
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] shrink-0",
                  target.sentiment === "swing" &&
                    "bg-yellow-100 text-yellow-700"
                )}
              >
                {target.relationship || target.sentiment}
              </Badge>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});
TargetList.displayName = "TargetList";
