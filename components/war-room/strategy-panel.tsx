"use client";

/**
 * Strategy Command Panel
 *
 * Interactive command interface for the Strategy Engine.
 * Can be embedded in War Room or used standalone.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Download,
  Copy,
  Trash2,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStrategy, type CommandHistoryItem } from "@/hooks/use-strategy";
import {
  getCommandSuggestions,
  isStrategyError,
  strategyExports,
  type StrategyResponse,
  type StrategyErrorResponse,
  type Recommendation,
  type BoothStatus,
} from "@/lib/api/strategy";

// ============================================================
// TYPES
// ============================================================

interface StrategyPanelProps {
  className?: string;
  defaultCommand?: string;
  onCommandExecuted?: (
    command: string,
    response: StrategyResponse | StrategyErrorResponse
  ) => void;
  compact?: boolean;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function StrategyPanel({
  className,
  defaultCommand,
  onCommandExecuted,
  compact = false,
}: StrategyPanelProps) {
  const [input, setInput] = useState(defaultCommand || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    execute,
    isLoading,
    lastResult,
    history,
    navigateHistory,
    clearHistory,
  } = useStrategy();

  const suggestions = getCommandSuggestions(input);

  // Auto-scroll to bottom when new results come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Handle command execution
  const handleExecute = useCallback(async () => {
    if (!input.trim()) return;

    const result = await execute(input);
    onCommandExecuted?.(input, result.result);
    setInput("");
    setShowSuggestions(false);
  }, [input, execute, onCommandExecuted]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleExecute();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = navigateHistory("up");
        if (prev) setInput(prev);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = navigateHistory("down");
        setInput(next || "");
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [handleExecute, navigateHistory]
  );

  // Handle suggestion click
  const handleSuggestionClick = (command: string) => {
    // Extract just the command part without description
    const cmdPart = command.split(" ")[0];
    setInput(cmdPart + " ");
    inputRef.current?.focus();
    setShowSuggestions(false);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className={cn("pb-3", compact && "py-3")}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="h-5 w-5" />
          Strategy Engine
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="ml-auto h-7 px-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 pt-0 overflow-auto">
        {/* Command History / Results */}
        <div
          ref={scrollRef}
          className="flex-1 rounded-md border bg-muted/30 overflow-y-auto"
        >
          <div className="p-2 space-y-2">
            {history.length === 0 ? (
              <EmptyState />
            ) : (
              history
                .slice()
                .reverse()
                .map((item) => <HistoryItem key={item.id} item={item} />)
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Command Input */}
        <div className="relative shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(
                    e.target.value.startsWith("/") || e.target.value === ""
                  );
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type a command (e.g., /ward 5)"
                className="pr-10 font-mono text-sm"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={handleExecute}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover shadow-lg z-50 max-h-[200px] overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-start gap-2 text-sm"
                  onMouseDown={() => handleSuggestionClick(s.command)}
                >
                  <code className="text-primary font-mono">{s.command}</code>
                  <span className="text-muted-foreground text-xs mt-0.5">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function EmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Type a command to analyze your voter data</p>
      <p className="text-xs mt-1">Try: /ward 5, /sentiment report, /dday</p>
    </div>
  );
}

function HistoryItem({ item }: { item: CommandHistoryItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1">
      {/* Command */}
      <div className="flex items-center gap-2">
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform cursor-pointer",
            expanded && "rotate-90"
          )}
          onClick={() => setExpanded(!expanded)}
        />
        <code className="text-sm font-mono text-primary">{item.command}</code>
        {item.success ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {item.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Response */}
      {expanded && item.response && (
        <div className="ml-5">
          {isStrategyError(item.response) ? (
            <ErrorDisplay error={item.response} />
          ) : (
            <ResultDisplay response={item.response} />
          )}
        </div>
      )}
    </div>
  );
}

function ErrorDisplay({ error }: { error: StrategyErrorResponse }) {
  return (
    <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <XCircle className="h-4 w-4" />
        {error.error}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
    </div>
  );
}

function ResultDisplay({ response }: { response: StrategyResponse }) {
  const command = String(response.command);
  const data = response.data as Record<string, unknown> | null;
  const analysis = response.analysis as Record<string, unknown>;
  const recommendations = response.recommendations;

  return (
    <div className="space-y-2">
      {/* Data Summary */}
      {data && typeof data === "object" && (
        <DataSummary command={command} data={data} />
      )}

      {/* Analysis */}
      {analysis && Object.keys(analysis).length > 0 && (
        <AnalysisSummary analysis={analysis} />
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <RecommendationsList recommendations={recommendations} />
      )}
    </div>
  );
}

function DataSummary({
  command,
  data,
}: {
  command: string;
  data: Record<string, unknown>;
}) {
  // Render key metrics based on command type
  const metrics: Array<{ label: string; value: string | number }> = [];

  if ("total_voters" in data) {
    metrics.push({
      label: "Total Voters",
      value: (data.total_voters as number).toLocaleString(),
    });
  }
  if ("sentiment" in data && typeof data.sentiment === "object") {
    const s = data.sentiment as Record<string, number>;
    metrics.push({
      label: "Support",
      value: s.support?.toLocaleString() || "0",
    });
    metrics.push({ label: "Swing", value: s.swing?.toLocaleString() || "0" });
  }
  if ("total_swing" in data) {
    metrics.push({
      label: "Swing Voters",
      value: (data.total_swing as number).toLocaleString(),
    });
  }
  if ("overall" in data && typeof data.overall === "object") {
    const o = data.overall as Record<string, number>;
    metrics.push({
      label: "Turnout",
      value: `${o.turnout_pct?.toFixed(1) || 0}%`,
    });
    metrics.push({ label: "Voted", value: o.voted?.toLocaleString() || "0" });
  }

  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-md bg-background p-2 text-center">
          <div className="text-lg font-semibold">{m.value}</div>
          <div className="text-xs text-muted-foreground">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function AnalysisSummary({ analysis }: { analysis: Record<string, unknown> }) {
  const items: Array<{
    label: string;
    value: string;
    type: "success" | "warning" | "danger" | "neutral";
  }> = [];

  if ("strength_score" in analysis) {
    const score = analysis.strength_score as number;
    items.push({
      label: "Strength",
      value: `${score}/100`,
      type: score >= 70 ? "success" : score >= 50 ? "warning" : "danger",
    });
  }
  if ("campaign_health_score" in analysis) {
    const score = analysis.campaign_health_score as number;
    items.push({
      label: "Health",
      value: `${score}/100`,
      type: score >= 70 ? "success" : score >= 50 ? "warning" : "danger",
    });
  }
  if ("status" in analysis) {
    const status = analysis.status as BoothStatus;
    items.push({
      label: "Status",
      value: status.toUpperCase(),
      type:
        status === "green"
          ? "success"
          : status === "yellow"
          ? "warning"
          : "danger",
    });
  }
  if ("momentum" in analysis) {
    const momentum = analysis.momentum as string;
    items.push({
      label: "Momentum",
      value: momentum,
      type:
        momentum === "positive"
          ? "success"
          : momentum === "negative"
          ? "danger"
          : "neutral",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Badge
          key={i}
          variant={
            item.type === "success"
              ? "default"
              : item.type === "warning"
              ? "secondary"
              : item.type === "danger"
              ? "destructive"
              : "outline"
          }
          className="gap-1"
        >
          {item.type === "success" && <TrendingUp className="h-3 w-3" />}
          {item.type === "danger" && <TrendingDown className="h-3 w-3" />}
          {item.type === "warning" && <AlertTriangle className="h-3 w-3" />}
          {item.type === "neutral" && <Minus className="h-3 w-3" />}
          {item.label}: {item.value}
        </Badge>
      ))}
    </div>
  );
}

function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Lightbulb className="h-3 w-3" />
        Recommendations
      </div>
      {recommendations.slice(0, 3).map((rec, i) => (
        <div
          key={i}
          className="flex items-start gap-1.5 text-sm bg-background rounded-md p-1.5"
        >
          <Badge
            variant="outline"
            className="h-5 w-5 p-0 justify-center shrink-0"
          >
            {rec.priority}
          </Badge>
          <span className="flex-1">{rec.action}</span>
          {rec.target && (
            <span className="text-xs text-muted-foreground">
              Target: {rec.target.toLocaleString()}
            </span>
          )}
          {rec.export_ready && (
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export default StrategyPanel;
