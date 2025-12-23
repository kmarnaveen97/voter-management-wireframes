"use client";

import { useMemo } from "react";
import type { ProjectionsResponse, CandidateProjection } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Trophy,
  Users,
  Target,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ProjectionsDashboardProps {
  projections: ProjectionsResponse;
  className?: string;
}

export function ProjectionsDashboard({
  projections,
  className = "",
}: ProjectionsDashboardProps) {
  const { our_candidate, leader, margin, total_voters, projected_turnout } =
    projections;

  const sortedProjections = useMemo(() => {
    return [...projections.projections].sort(
      (a, b) => b.vote_share_percent - a.vote_share_percent
    );
  }, [projections.projections]);

  const getWinProbabilityBadge = (probability?: number) => {
    if (!probability) return null;
    if (probability >= 70) {
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
          Likely Win ({probability.toFixed(0)}%)
        </Badge>
      );
    }
    if (probability >= 50) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          Toss-up ({probability.toFixed(0)}%)
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
        Trailing ({probability.toFixed(0)}%)
      </Badge>
    );
  };

  const isLeading =
    our_candidate && leader
      ? our_candidate.candidate_id === leader.candidate_id
      : false;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total Voters
              </span>
            </div>
            <p className="text-2xl font-bold mt-1" suppressHydrationWarning>
              {total_voters.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Projected Turnout
              </span>
            </div>
            <p className="text-2xl font-bold mt-1" suppressHydrationWarning>
              {projected_turnout.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {our_candidate && (
          <Card className="border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">
                  Your Votes
                </span>
              </div>
              <p className="text-2xl font-bold mt-1" suppressHydrationWarning>
                {our_candidate.projected_votes.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {our_candidate.vote_share_percent.toFixed(1)}% share
              </p>
            </CardContent>
          </Card>
        )}

        {leader && margin !== undefined && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Margin</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold" suppressHydrationWarning>
                  {isLeading ? "+" : "-"}
                  {Math.abs(margin).toLocaleString()}
                </p>
                {isLeading ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Your Candidate Status */}
      {our_candidate && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                {our_candidate.candidate_name}
                {our_candidate.party_symbol && (
                  <span className="text-xl">{our_candidate.party_symbol}</span>
                )}
              </CardTitle>
              {getWinProbabilityBadge(our_candidate.win_probability)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Vote Share</span>
              <span className="font-medium">
                {our_candidate.vote_share_percent.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={our_candidate.vote_share_percent}
              className="h-3"
            />

            <div className="grid grid-cols-5 gap-2 mt-3">
              <div className="text-center p-2 bg-green-500/10 rounded">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {our_candidate.sentiment_counts.support}
                </p>
                <p className="text-xs text-muted-foreground">Support</p>
              </div>
              <div className="text-center p-2 bg-red-500/10 rounded">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                  {our_candidate.sentiment_counts.oppose}
                </p>
                <p className="text-xs text-muted-foreground">Oppose</p>
              </div>
              <div className="text-center p-2 bg-yellow-500/10 rounded">
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                  {our_candidate.sentiment_counts.swing}
                </p>
                <p className="text-xs text-muted-foreground">Swing</p>
              </div>
              <div className="text-center p-2 bg-gray-500/10 rounded">
                <p className="text-lg font-bold text-gray-700 dark:text-gray-400">
                  {our_candidate.sentiment_counts.neutral}
                </p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
              <div className="text-center p-2 bg-gray-300/10 rounded">
                <p className="text-lg font-bold text-gray-600 dark:text-gray-500">
                  {our_candidate.sentiment_counts.unknown}
                </p>
                <p className="text-xs text-muted-foreground">Unknown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Candidates Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Candidate Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedProjections.map((candidate, index) => (
            <ProjectionRow
              key={candidate.candidate_id}
              candidate={candidate}
              rank={index + 1}
              maxVoteShare={sortedProjections[0]?.vote_share_percent || 100}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface ProjectionRowProps {
  candidate: CandidateProjection;
  rank: number;
  maxVoteShare: number;
}

function ProjectionRow({ candidate, rank, maxVoteShare }: ProjectionRowProps) {
  const relativeWidth = (candidate.vote_share_percent / maxVoteShare) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-6">#{rank}</span>
          {candidate.party_symbol && (
            <span className="text-lg">{candidate.party_symbol}</span>
          )}
          <span className="font-medium">{candidate.candidate_name}</span>
          {candidate.is_our_candidate && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
          {candidate.party_name && (
            <span className="text-xs text-muted-foreground">
              ({candidate.party_name})
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {candidate.projected_votes.toLocaleString()} votes
          </span>
          <span className="font-bold w-16 text-right">
            {candidate.vote_share_percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${
            candidate.is_our_candidate
              ? "bg-primary"
              : rank === 1
              ? "bg-green-500"
              : "bg-gray-400"
          }`}
          style={{ width: `${relativeWidth}%` }}
        />
      </div>
    </div>
  );
}
