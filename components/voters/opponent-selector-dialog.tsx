"use client";

import { useEffect, useState } from "react";
import { api, type Candidate } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Users, Check } from "lucide-react";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";

interface OpponentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (candidateId: number) => void;
  voterCount?: number; // Number of voters being tagged
  title?: string;
}

export function OpponentSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  voterCount = 1,
  title = "Select Opponent Candidate",
}: OpponentSelectorDialogProps) {
  const { selectedListId } = useListContext();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedListId || !open) return;

      try {
        setLoading(true);
        const data = await api.getCandidates({
          list_id: selectedListId,
          status: "active",
        });

        // Filter out our candidate and System Default (ID 0)
        const opponents = (data.candidates || []).filter(
          (c) => !c.is_our_candidate && c.candidate_id !== 0 && c.id !== 0
        );
        setCandidates(opponents);

        // Auto-select first opponent if only one exists
        if (opponents.length === 1) {
          setSelectedCandidateId(
            opponents[0].candidate_id ?? opponents[0].id ?? null
          );
        } else {
          setSelectedCandidateId(null);
        }
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCandidates();
    }
  }, [selectedListId, open]);

  const handleConfirm = () => {
    if (selectedCandidateId) {
      onSelect(selectedCandidateId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {voterCount === 1
              ? "Which candidate does this voter support?"
              : `Which candidate do these ${voterCount} voters support?`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading opponents...
              </span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No opponent candidates found.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add candidates in the Elections section first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {candidates.map((candidate) => {
                const candidateId = candidate.candidate_id ?? candidate.id;
                const isSelected = selectedCandidateId === candidateId;

                return (
                  <button
                    key={candidateId}
                    onClick={() => setSelectedCandidateId(candidateId ?? null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                      isSelected
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-border hover:border-red-300 hover:bg-muted/50"
                    )}
                  >
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-red-500 bg-red-500"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Candidate info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {candidate.party_symbol && (
                          <span className="text-lg">
                            {candidate.party_symbol}
                          </span>
                        )}
                        <span className="font-medium truncate">
                          {candidate.name || `Candidate #${candidateId}`}
                        </span>
                      </div>
                      {candidate.party_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {candidate.party_name}
                        </p>
                      )}
                    </div>

                    {/* Ward badge */}
                    {candidate.ward_no && (
                      <Badge variant="outline" className="text-xs">
                        Ward {candidate.ward_no}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCandidateId || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {voterCount === 1
              ? "Tag as Oppose"
              : `Tag ${voterCount} Voters as Oppose`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
