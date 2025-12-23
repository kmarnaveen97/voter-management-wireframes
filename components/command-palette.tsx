"use client";

/**
 * Global Command Palette (⌘K)
 *
 * A VS Code / Linear style command palette for quick access
 * to strategy commands from anywhere in the app.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  Search,
  Loader2,
  MapPin,
  Users,
  Home,
  TrendingUp,
  Calendar,
  MessageSquare,
  BarChart3,
  GitCompare,
  AlertTriangle,
  Terminal,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStrategy } from "@/hooks/use-strategy";
import {
  getCommandSuggestions,
  isStrategyError,
  type StrategyResponse,
  type StrategyErrorResponse,
} from "@/lib/api/strategy";

// ============================================================
// TYPES
// ============================================================

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CommandItem {
  command: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

// ============================================================
// COMMAND DEFINITIONS
// ============================================================

const COMMANDS: CommandItem[] = [
  // Analysis
  {
    command: "/ward",
    description: "Analyze ward demographics & sentiment",
    icon: <MapPin className="h-4 w-4" />,
    category: "Analysis",
  },
  {
    command: "/booth",
    description: "Booth-level voter breakdown",
    icon: <Home className="h-4 w-4" />,
    category: "Analysis",
  },
  {
    command: "/family",
    description: "Family influence analysis",
    icon: <Users className="h-4 w-4" />,
    category: "Analysis",
  },
  {
    command: "/swing",
    description: "List swing voters by influence",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Analysis",
  },

  // Reports
  {
    command: "/sentiment report",
    description: "Global campaign health score",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "Reports",
  },
  {
    command: "/turnout predict",
    description: "Turnout forecast for ward",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Reports",
  },
  {
    command: "/compare",
    description: "Compare two voter lists",
    icon: <GitCompare className="h-4 w-4" />,
    category: "Reports",
  },

  // Operations
  {
    command: "/dday",
    description: "Election day monitoring",
    icon: <Calendar className="h-4 w-4" />,
    category: "Operations",
  },
  {
    command: "/warroom status",
    description: "Campaign status overview",
    icon: <Terminal className="h-4 w-4" />,
    category: "Operations",
  },
  {
    command: "/warroom alert",
    description: "Critical alerts",
    icon: <AlertTriangle className="h-4 w-4" />,
    category: "Operations",
  },

  // Messaging
  {
    command: "/message caste",
    description: "Caste-targeted messages",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Messaging",
  },
  {
    command: "/message sentiment",
    description: "Sentiment-based scripts",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Messaging",
  },
  {
    command: "/message ward",
    description: "Ward-specific talking points",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Messaging",
  },
];

// ============================================================
// HOOK
// ============================================================

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return { open, setOpen };
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult] = useState<
    StrategyResponse | StrategyErrorResponse | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { execute, isLoading } = useStrategy();

  // Filter commands
  const filteredCommands = input.startsWith("/")
    ? COMMANDS.filter(
        (c) =>
          c.command.toLowerCase().includes(input.toLowerCase()) ||
          c.description.toLowerCase().includes(input.toLowerCase())
      )
    : COMMANDS;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reset on open
  useEffect(() => {
    if (open) {
      setInput("");
      setSelectedIndex(0);
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (input.startsWith("/") && input.includes(" ")) {
          // Execute full command
          handleExecute(input);
        } else if (filteredCommands[selectedIndex]) {
          // Select command and add space for params
          const cmd = filteredCommands[selectedIndex].command;
          setInput(cmd + " ");
        }
      } else if (e.key === "Escape") {
        onOpenChange?.(false);
      }
    },
    [filteredCommands, selectedIndex, input, onOpenChange]
  );

  // Execute command
  const handleExecute = async (command: string) => {
    if (!command.trim()) return;
    const res = await execute(command);
    setResult(res.result);
  };

  // Handle command click
  const handleCommandClick = (command: string) => {
    setInput(command + " ");
    inputRef.current?.focus();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />

      {/* Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-background border rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 p-4 border-b">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <Command className="h-5 w-5 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSelectedIndex(0);
                setResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              esc
            </kbd>
          </div>

          {/* Results or Commands */}
          {result ? (
            <ResultView result={result} onBack={() => setResult(null)} />
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {category}
                    </div>
                    {commands.map((cmd, i) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.command}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                            globalIndex === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                          onClick={() => handleCommandClick(cmd.command)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <div className="shrink-0 text-muted-foreground">
                            {cmd.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm">
                              {cmd.command}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border px-1">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> select
              </span>
            </div>
            <span>Strategy Engine</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================
// RESULT VIEW
// ============================================================

function ResultView({
  result,
  onBack,
}: {
  result: StrategyResponse | StrategyErrorResponse;
  onBack: () => void;
}) {
  if (isStrategyError(result)) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <div className="flex items-center gap-2 text-red-500 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            {result.error}
          </div>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
        <button
          onClick={onBack}
          className="mt-3 text-sm text-primary hover:underline"
        >
          ← Back to commands
        </button>
      </div>
    );
  }

  const commandStr = String(result.command);
  const data = result.data as Record<string, unknown> | null;
  const recommendations = result.recommendations;

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="font-mono">
            /{commandStr}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(result.generated_at).toLocaleTimeString()}
          </span>
        </div>

        {/* Key Metrics */}
        {data && typeof data === "object" && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data)
              .filter(
                ([k, v]) =>
                  typeof v === "number" ||
                  (typeof v === "object" &&
                    v !== null &&
                    "count" in (v as object))
              )
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold">
                    {typeof value === "number"
                      ? value.toLocaleString()
                      : (value as { count: number }).count?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-muted/50 rounded-lg p-2"
                >
                  <Badge variant="outline" className="shrink-0">
                    {rec.priority}
                  </Badge>
                  <span className="text-sm">{rec.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline"
        >
          ← Back to commands
        </button>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

export default CommandPalette;
