"use client";

import type { Candidate, CandidateProjection } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Star, TrendingUp } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  projection?: CandidateProjection;
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: number) => void;
  onSetPrimary?: (candidate: Candidate) => void;
  showProjections?: boolean;
}

export function CandidateCard({
  candidate,
  projection,
  onEdit,
  onDelete,
  onSetPrimary,
  showProjections = false,
}: CandidateCardProps) {
  const statusColors: Record<string, string> = {
    Active: "bg-green-500/10 text-green-700 dark:text-green-400",
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    Withdrawn: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    withdrawn: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    Disqualified: "bg-red-500/10 text-red-700 dark:text-red-400",
    disqualified: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  const displayStatus =
    candidate.status?.charAt(0).toUpperCase() + candidate.status?.slice(1) ||
    "Active";

  const getWinProbabilityColor = (probability?: number) => {
    if (!probability) return "text-muted-foreground";
    if (probability >= 70) return "text-green-600 dark:text-green-400";
    if (probability >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        candidate.is_our_candidate ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {candidate.party_symbol && (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                {candidate.party_symbol}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{candidate.name}</CardTitle>
                {candidate.is_our_candidate && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              {candidate.party_name && (
                <p className="text-xs text-muted-foreground">
                  {candidate.party_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={statusColors[candidate.status] || statusColors.active}
            >
              {displayStatus}
            </Badge>
            {candidate.is_our_candidate && (
              <Badge
                variant="outline"
                className="text-xs border-primary text-primary"
              >
                Your Candidate
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {candidate.ward_no && (
            <div>
              <p className="text-xs text-muted-foreground">Ward</p>
              <p className="font-medium">{candidate.ward_no}</p>
            </div>
          )}
          {candidate.age && (
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-medium">{candidate.age} yrs</p>
            </div>
          )}
          {candidate.gender && (
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-medium">{candidate.gender}</p>
            </div>
          )}
          {candidate.voter_id && (
            <div>
              <p className="text-xs text-muted-foreground">Voter ID</p>
              <p className="font-mono text-xs">#{candidate.voter_id}</p>
            </div>
          )}
        </div>

        {/* Projections section */}
        {showProjections && projection && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Projections
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vote Share</span>
                <span className="font-medium">
                  {projection.vote_share_percent.toFixed(1)}%
                </span>
              </div>
              <Progress value={projection.vote_share_percent} className="h-2" />

              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span className="text-muted-foreground">Projected Votes</span>
                  <p className="font-medium">
                    {projection.projected_votes.toLocaleString()}
                  </p>
                </div>
                {projection.win_probability !== undefined && (
                  <div>
                    <span className="text-muted-foreground">
                      Win Probability
                    </span>
                    <p
                      className={`font-medium ${getWinProbabilityColor(
                        projection.win_probability
                      )}`}
                    >
                      {projection.win_probability.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1 text-xs mt-2">
                <div className="text-center">
                  <div className="w-full h-1 bg-green-500 rounded mb-1"></div>
                  <span className="text-muted-foreground">
                    {projection.sentiment_counts.support}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-full h-1 bg-red-500 rounded mb-1"></div>
                  <span className="text-muted-foreground">
                    {projection.sentiment_counts.oppose}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-full h-1 bg-yellow-500 rounded mb-1"></div>
                  <span className="text-muted-foreground">
                    {projection.sentiment_counts.swing}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-full h-1 bg-gray-400 rounded mb-1"></div>
                  <span className="text-muted-foreground">
                    {projection.sentiment_counts.neutral}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
                  <span className="text-muted-foreground">
                    {projection.sentiment_counts.unknown}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!candidate.is_our_candidate && onSetPrimary && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => onSetPrimary(candidate)}
            >
              <Star className="mr-2 h-3 w-3" />
              Set Primary
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onEdit(candidate)}
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onDelete(candidate.candidate_id || candidate.id!)}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
