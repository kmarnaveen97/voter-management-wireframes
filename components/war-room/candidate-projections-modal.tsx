"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api, type CandidateProjection } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { Loader2, Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CandidateProjectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateProjectionsModal({
  open,
  onOpenChange,
}: CandidateProjectionsModalProps) {
  const { selectedListId } = useListContext();
  const [loading, setLoading] = useState(false);
  const [projections, setProjections] = useState<CandidateProjection[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [projectedTurnout, setProjectedTurnout] = useState(0);

  useEffect(() => {
    if (open && selectedListId) {
      fetchProjections();
    }
  }, [open, selectedListId]);

  const fetchProjections = async () => {
    if (!selectedListId) return;
    setLoading(true);
    try {
      const data = await api.getProjections(selectedListId);
      if (data && data.projections) {
        let processedProjections = [...data.projections];

        // Find System Default (candidate_id: 0) and Our Candidate
        const systemDefaultIndex = processedProjections.findIndex(
          (p) => p.candidate_id === 0
        );
        const ourCandidateIndex = processedProjections.findIndex(
          (p) => p.is_our_candidate
        );

        // If both exist, merge System Default votes into Our Candidate
        if (systemDefaultIndex !== -1 && ourCandidateIndex !== -1) {
          const systemDefault = processedProjections[systemDefaultIndex];
          const ourCandidate = processedProjections[ourCandidateIndex];

          // Merge vote counts
          ourCandidate.projected_votes += systemDefault.projected_votes;
          ourCandidate.sentiment_counts.support +=
            systemDefault.sentiment_counts.support;
          ourCandidate.sentiment_counts.swing +=
            systemDefault.sentiment_counts.swing;

          // Recalculate vote share (will be recalculated after filtering)

          // Remove System Default from the array
          processedProjections = processedProjections.filter(
            (p) => p.candidate_id !== 0
          );
        } else if (systemDefaultIndex !== -1 && ourCandidateIndex === -1) {
          // If only System Default exists (no primary candidate), remove it
          // This prevents showing a "System" candidate in projections
          processedProjections = processedProjections.filter(
            (p) => p.candidate_id !== 0
          );
        }

        // Recalculate vote share percentages for all candidates
        const totalProjectedVotes = processedProjections.reduce(
          (sum, p) => sum + p.projected_votes,
          0
        );
        if (totalProjectedVotes > 0) {
          processedProjections.forEach((p) => {
            p.vote_share_percent =
              (p.projected_votes / totalProjectedVotes) * 100;
          });
        }

        // Sort by projected votes descending
        const sorted = processedProjections.sort(
          (a, b) => b.projected_votes - a.projected_votes
        );

        setProjections(sorted);
        setTotalVotes(data.total_voters || 0);
        setProjectedTurnout(data.projected_turnout || 0);
      }
    } catch (error) {
      console.error("Failed to fetch projections", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-white mb-1">{data.candidate_name}</p>
          <p className="text-xs text-slate-400 mb-2">{data.party_name}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">Projected Votes:</span>
              <span
                className="font-mono font-bold text-white"
                suppressHydrationWarning
              >
                {data.projected_votes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">Vote Share:</span>
              <span className="font-mono font-bold text-white">
                {data.vote_share_percent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (entry: CandidateProjection, index: number) => {
    if (entry.is_our_candidate) return "#22c55e"; // Green for us
    if (index === 0) return "#ef4444"; // Red for leader (if not us)
    return "#64748b"; // Slate for others
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            Live Election Projections
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Real-time vote projections based on current sentiment analysis.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projections.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  Total Voters
                </div>
                <div
                  className="text-2xl font-bold font-mono"
                  suppressHydrationWarning
                >
                  {totalVotes.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  Projected Turnout
                </div>
                <div
                  className="text-2xl font-bold font-mono text-blue-400"
                  suppressHydrationWarning
                >
                  {projectedTurnout.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projections}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#334155"
                    opacity={0.5}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="candidate_name"
                    type="category"
                    width={100}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) =>
                      value.length > 15 ? `${value.substring(0, 15)}...` : value
                    }
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar
                    dataKey="projected_votes"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  >
                    {projections.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry, index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Leader Badge */}
            {projections.length > 0 && (
              <div className="flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-amber-200 font-medium">
                  Leading:{" "}
                  <span className="font-bold text-amber-400">
                    {projections[0].candidate_name}
                  </span>{" "}
                  with {projections[0].vote_share_percent.toFixed(1)}% share
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-slate-500">
            <p>No projection data available.</p>
            <p className="text-sm mt-2">
              Add candidates and tag voters to see projections.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
