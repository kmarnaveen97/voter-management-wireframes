"use client";

import { useEffect, useState } from "react";
import { api, type Candidate } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";
import { useListContext } from "@/contexts/list-context";

interface CandidateSelectorProps {
  value: number | null;
  onChange: (candidateId: number | null) => void;
  disabled?: boolean;
  className?: string;
  showOurCandidateFirst?: boolean;
  allowNull?: boolean;
  placeholder?: string;
}

export function CandidateSelector({
  value,
  onChange,
  disabled = false,
  className,
  showOurCandidateFirst = true,
  allowNull = false,
  placeholder = "Select candidate",
}: CandidateSelectorProps) {
  const { selectedListId } = useListContext();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedListId) return;

      try {
        setLoading(true);
        const data = await api.getCandidates({
          list_id: selectedListId,
          status: "active",
        });
        let candidateList = data.candidates || [];
        
        // Sort to show our candidate first if enabled
        if (showOurCandidateFirst) {
          candidateList = candidateList.sort((a, b) => {
            if (a.is_our_candidate && !b.is_our_candidate) return -1;
            if (!a.is_our_candidate && b.is_our_candidate) return 1;
            return 0;
          });
        }
        
        setCandidates(candidateList);
        
        // Auto-select our candidate if no value is set
        if (value === null && !allowNull) {
          const ourCandidate = candidateList.find(c => c.is_our_candidate);
          if (ourCandidate) {
            onChange(ourCandidate.candidate_id ?? ourCandidate.id ?? null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedListId, showOurCandidateFirst]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading candidates...
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No candidates available
      </div>
    );
  }

  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={(val) => onChange(val ? parseInt(val) : null)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNull && (
          <SelectItem value="">
            <span className="text-muted-foreground">All Candidates (Default)</span>
          </SelectItem>
        )}
        {candidates.map((candidate) => (
          <SelectItem
            key={candidate.candidate_id || candidate.id}
            value={(candidate.candidate_id || candidate.id)!.toString()}
          >
            <div className="flex items-center gap-2">
              {candidate.is_our_candidate && (
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              )}
              {candidate.party_symbol && (
                <span className="text-base">{candidate.party_symbol}</span>
              )}
              <span>{candidate.name}</span>
              {candidate.is_our_candidate && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary text-primary">
                  Your Candidate
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
