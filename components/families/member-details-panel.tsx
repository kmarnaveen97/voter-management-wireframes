"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  User,
  Heart,
  Home,
  Calendar,
  Hash,
  Users,
  Users2,
  UserCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TreeMember } from "@/lib/tree-utils";
import { isFemaleGender } from "@/lib/tree-utils";
import { VoterProfilePanel } from "@/components/voters/voter-profile-panel";

interface MemberDetailsPanelProps {
  member: TreeMember | null;
  onClose: () => void;
}

/**
 * Info Row Component for displaying member details
 */
function InfoRow({
  icon,
  label,
  value,
  badge = false,
  badgeColor = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: "default" | "pink" | "blue";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {badge ? (
          <span
            className={cn(
              "inline-flex text-xs font-semibold px-2 py-0.5 rounded-md mt-0.5",
              badgeColor === "pink" &&
                "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
              badgeColor === "blue" &&
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
              badgeColor === "default" && "bg-muted text-foreground"
            )}
          >
            {value}
          </span>
        ) : (
          <p className="font-medium text-sm text-foreground truncate mt-0.5">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Member Details Panel - Slide-out panel for viewing tree member details
 * Used by both family-mapping and war-room pages
 */
export function MemberDetailsPanel({
  member,
  onClose,
}: MemberDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close on escape key - with proper cleanup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close on click outside - with proper cleanup for both timeout and listener
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding the listener to prevent immediate close on open
    timeout = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!member) return null;

  const isFemale = isFemaleGender(member.gender);
  const currentYear = new Date().getFullYear();
  const birthYear = member.age ? currentYear - member.age : null;

  // Count relations
  const relationsCount =
    (member.relative_name ? 1 : 0) +
    (member.spouse ? 1 : 0) +
    (member.children?.length || 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-details-title"
        className="fixed right-4 top-4 bottom-4 w-90 max-w-[calc(100vw-2rem)] bg-card shadow-2xl z-50 border border-border rounded-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header with gradient */}
        <div
          className={cn(
            "relative overflow-hidden shrink-0",
            isFemale
              ? "bg-linear-to-br from-pink-500 via-pink-500 to-rose-600"
              : "bg-linear-to-br from-primary via-primary to-blue-600"
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
          >
            <X size={16} />
          </Button>

          {/* Profile section */}
          <div className="relative z-10 p-5 pb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white/20",
                    isFemale ? "bg-pink-400/80" : "bg-blue-500/80"
                  )}
                >
                  {member.isVirtual ? (
                    <span className="text-xl">P</span>
                  ) : (
                    <User size={28} strokeWidth={1.5} />
                  )}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shadow-md",
                    isFemale
                      ? "bg-pink-600 text-white"
                      : "bg-blue-600 text-white"
                  )}
                >
                  {isFemale ? "F" : "M"}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2
                  id="member-details-title"
                  className="font-bold text-white text-lg leading-tight line-clamp-2"
                >
                  {member.name}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-0 text-[11px] h-6 px-2 backdrop-blur-sm"
                  >
                    <Home size={11} className="mr-1.5" />
                    House {member.house_no}
                  </Badge>
                  {member.relType && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-0 text-[11px] h-6 px-2 backdrop-blur-sm"
                    >
                      {member.relType}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/90">
                <Calendar size={14} className="opacity-70" />
                <span className="text-sm font-medium">
                  {member.age || "?"} years
                </span>
              </div>
              {member.serial_no && (
                <div className="flex items-center gap-2 text-white/90">
                  <Hash size={14} className="opacity-70" />
                  <span className="text-sm font-medium">
                    {member.serial_no}
                  </span>
                </div>
              )}
              {relationsCount > 0 && (
                <div className="flex items-center gap-2 text-white/90">
                  <Users size={14} className="opacity-70" />
                  <span className="text-sm font-medium">
                    {relationsCount} relations
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Personal Information */}
            <div className="bg-linear-to-br from-muted/60 to-muted/30 rounded-xl border border-border/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <h4 className="text-xs font-bold text-foreground">
                  Personal Details
                </h4>
              </div>
              <div className="p-4 space-y-3">
                <InfoRow
                  icon={<User size={14} />}
                  label="Full Name"
                  value={member.name}
                />
                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Age"
                  value={member.age ? `${member.age} Years` : "N/A"}
                />
                <InfoRow
                  icon={<UserCheck size={14} />}
                  label="Gender"
                  value={isFemale ? "Female (महिला)" : "Male (पुरुष)"}
                  badge
                  badgeColor={isFemale ? "pink" : "blue"}
                />
                {birthYear && (
                  <InfoRow
                    icon={<Calendar size={14} />}
                    label="Birth Year"
                    value={`~${birthYear} (est.)`}
                  />
                )}
                {member.serial_no && (
                  <InfoRow
                    icon={<Hash size={14} />}
                    label="Serial No."
                    value={member.serial_no}
                  />
                )}
                <InfoRow
                  icon={<Home size={14} />}
                  label="House No."
                  value={member.house_no}
                />
              </div>
            </div>

            {/* Virtual Node Notice */}
            {member.isVirtual && (
              <div className="bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-4 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/50 dark:bg-amber-800/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                    Virtual Head (पितृपुरुष)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                    This is an inferred ancestor created to connect family
                    members who share the same parent name.
                  </p>
                </div>
              </div>
            )}

            {/* Family Relations Section */}
            {(member.relative_name ||
              member.spouse ||
              (member.children && member.children.length > 0)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Users2 size={14} className="text-muted-foreground" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Family Relations
                  </h4>
                </div>

                {/* Parent/Guardian */}
                {member.relative_name && (
                  <div className="bg-linear-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-200 to-blue-100 dark:from-blue-800/40 dark:to-blue-900/20 flex items-center justify-center shadow-sm shrink-0">
                        <User size={18} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">
                          Father / Guardian
                        </p>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {member.relative_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spouse */}
                {member.spouse && (
                  <div className="bg-linear-to-br from-pink-50 to-pink-100/30 dark:from-pink-950/30 dark:to-pink-900/10 rounded-xl border border-pink-200/50 dark:border-pink-800/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-200 to-pink-100 dark:from-pink-800/40 dark:to-pink-900/20 flex items-center justify-center shadow-sm shrink-0">
                        <Heart
                          size={18}
                          className="text-pink-500"
                          fill="currentColor"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium uppercase tracking-wider">
                          Spouse
                        </p>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {member.spouse.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0 text-[10px] h-5"
                          >
                            {member.spouse.age}Y
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0 text-[10px] h-5"
                          >
                            {member.spouse.relType || "पत्नी"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Children */}
                {member.children && member.children.length > 0 && (
                  <div className="bg-linear-to-br from-muted/60 to-muted/30 rounded-xl border border-border/50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                          <Users size={12} className="text-green-500" />
                        </div>
                        <h4 className="text-xs font-bold text-foreground">
                          Children
                        </h4>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 text-[10px] h-5"
                      >
                        {member.children.length}
                      </Badge>
                    </div>
                    <div className="divide-y divide-border/50">
                      {member.children.map((child, idx) => {
                        const isChildFemale = isFemaleGender(child.gender);
                        return (
                          <div
                            key={idx}
                            className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0",
                                isChildFemale
                                  ? "bg-linear-to-br from-pink-400 to-pink-500"
                                  : "bg-linear-to-br from-blue-400 to-blue-500"
                              )}
                            >
                              {child.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {child.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {child.age}Y •{" "}
                                <span
                                  className={cn(
                                    "font-medium",
                                    isChildFemale
                                      ? "text-pink-600 dark:text-pink-400"
                                      : "text-blue-600 dark:text-blue-400"
                                  )}
                                >
                                  {child.relType ||
                                    (isChildFemale ? "पुत्री" : "पुत्र")}
                                </span>
                              </p>
                            </div>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                isChildFemale
                                  ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              )}
                            >
                              {isChildFemale ? "F" : "M"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">
                Esc
              </kbd>
              to close
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setProfileOpen(true)}
                className="h-8 text-xs"
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                View Full Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
      <VoterProfilePanel
        voterId={member?.voter_id ?? null}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  );
}

export default MemberDetailsPanel;
