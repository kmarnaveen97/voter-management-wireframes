"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  MapPin,
  Home,
  User,
  X,
  Heart,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  TreeDeciduous,
  Filter,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
  Hash,
  SortAsc,
  Calendar,
  Phone,
  Mail,
  MapPinned,
  ExternalLink,
  UserCheck,
  Users2,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import { api, type Family, type Voter } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import shared tree utilities and components
import {
  type TreeMember,
  buildHouseTree,
  isFemaleGender,
} from "@/lib/tree-utils";
import { TreeNode } from "@/components/families/tree-node";
import { MemberDetailsPanel } from "@/components/families/member-details-panel";

// --- Components ---

// House Sidebar Component
function HouseSidebar({
  families,
  selectedFamily,
  onSelectFamily,
  searchTerm,
  setSearchTerm,
  selectedWard,
  setSelectedWard,
  wards,
  loading,
  isCollapsed,
  onToggleCollapse,
  isOnline,
  hasError,
}: {
  families: Family[];
  selectedFamily: Family | null;
  onSelectFamily: (family: Family) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedWard: string;
  setSelectedWard: (ward: string) => void;
  wards: string[];
  loading: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOnline: boolean;
  hasError: boolean;
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [sortBy, setSortBy] = useState<"house" | "members" | "name">("house");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredFamilies = useMemo(() => {
    const filtered = families.filter((f) => {
      if (selectedWard !== "all" && f.ward_no !== selectedWard) return false;
      if (!searchTerm) return true;
      return (
        f.mukhiya_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.house_no.includes(searchTerm)
      );
    });

    // Sort based on selected option
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "members":
          return (b.member_count || 0) - (a.member_count || 0);
        case "name":
          return (a.mukhiya_name || "").localeCompare(b.mukhiya_name || "");
        case "house":
        default:
          const wardDiff = parseInt(a.ward_no) - parseInt(b.ward_no);
          if (wardDiff !== 0) return wardDiff;
          return parseInt(a.house_no) - parseInt(b.house_no);
      }
    });
  }, [families, searchTerm, selectedWard, sortBy]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isCollapsed) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            Math.min(prev + 1, filteredFamilies.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (focusedIndex >= 0 && filteredFamilies[focusedIndex]) {
            onSelectFamily(filteredFamilies[focusedIndex]);
          }
          break;
        case "Escape":
          setSearchTerm("");
          inputRef.current?.blur();
          break;
      }
    },
    [filteredFamilies, focusedIndex, isCollapsed, onSelectFamily, setSearchTerm]
  );

  // Reset focus when filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm, selectedWard]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-family-item]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  // Calculate stats
  const totalMembers = useMemo(
    () => filteredFamilies.reduce((sum, f) => sum + (f.member_count || 0), 0),
    [filteredFamilies]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "bg-card border-r border-border flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out relative z-20 shrink-0",
          isCollapsed ? "w-16" : "w-80"
        )}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            "bg-gradient-to-br from-[#4A00B1] to-[#3a008d] text-white relative overflow-hidden",
            isCollapsed ? "p-3" : "p-5"
          )}
        >
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4A00B1] via-[#FF5E39] to-[#B7CF4F]" />
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex items-center gap-3",
                  isCollapsed && "justify-center w-full"
                )}
              >
                <div
                  className={cn(
                    "rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center",
                    isCollapsed ? "w-10 h-10" : "w-12 h-12"
                  )}
                >
                  <TreeDeciduous
                    className={cn(
                      "shrink-0 text-white",
                      isCollapsed ? "w-5 h-5" : "w-6 h-6"
                    )}
                  />
                </div>
                {!isCollapsed && (
                  <div className="flex-1" suppressHydrationWarning>
                    <h1 className="text-lg font-bold tracking-tight">
                      Family Mapping
                    </h1>
                    <p className="text-primary-foreground/70 text-xs">
                      Interactive Tree Explorer
                    </p>
                  </div>
                )}
                {!isCollapsed && !isOnline && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
                {!isCollapsed && isOnline && hasError && (
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 text-orange-600 border-orange-600"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Connection Issues
                  </Badge>
                )}
              </div>
              {!isCollapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleCollapse}
                      className="h-8 w-8 text-primary-foreground hover:bg-white/20 transition-colors"
                    >
                      <PanelLeftClose size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Collapse sidebar</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="w-full mt-3 text-primary-foreground hover:bg-white/20 transition-colors"
                  >
                    <PanelLeft size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                {/* Search with keyboard hint */}
                <div className="mt-4 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50 transition-colors group-focus-within:text-primary-foreground/70" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search by name or house..."
                    className="w-full bg-white/10 border-white/20 pl-9 pr-12 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:bg-white/20 focus:border-white/30 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search families"
                  />
                  {searchTerm ? (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] text-primary-foreground/60">
                      ⌘K
                    </kbd>
                  )}
                </div>

                {/* Filters Row */}
                <div className="mt-3 flex gap-2">
                  <Select value={selectedWard} onValueChange={setSelectedWard}>
                    <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-primary-foreground hover:bg-white/15 transition-colors h-9 text-xs">
                      <Filter className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      <SelectValue placeholder="Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {wards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          Ward {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as typeof sortBy)}
                  >
                    <SelectTrigger className="w-[100px] bg-white/10 border-white/20 text-primary-foreground hover:bg-white/15 transition-colors h-9 text-xs">
                      <SortAsc className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> House
                        </span>
                      </SelectItem>
                      <SelectItem value="members">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" /> Members
                        </span>
                      </SelectItem>
                      <SelectItem value="name">
                        <span className="flex items-center gap-1.5">
                          <UserCircle className="w-3 h-3" /> Name
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results count banner */}
        {!isCollapsed && (searchTerm || selectedWard !== "all") && (
          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {filteredFamilies.length}{" "}
              {filteredFamilies.length === 1 ? "result" : "results"}
              {searchTerm && (
                <span className="ml-1">
                  for "
                  <span className="font-medium text-foreground">
                    {searchTerm}
                  </span>
                  "
                </span>
              )}
            </span>
            {(searchTerm || selectedWard !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedWard("all");
                }}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* House List */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div
            ref={listRef}
            className={cn("space-y-1", isCollapsed ? "p-1.5" : "p-2")}
            role="listbox"
            aria-label="Family list"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading families...
                </p>
              </div>
            ) : filteredFamilies.length > 0 ? (
              filteredFamilies.map((family, index) => {
                const isSelected =
                  selectedFamily?.ward_no === family.ward_no &&
                  selectedFamily?.house_no === family.house_no;
                const isFocused = index === focusedIndex;

                return (
                  <Tooltip key={`${family.ward_no}-${family.house_no}`}>
                    <TooltipTrigger asChild>
                      <button
                        data-family-item
                        onClick={() => onSelectFamily(family)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "w-full flex items-center rounded-xl border-2 transition-all duration-200 group text-left",
                          isCollapsed
                            ? "justify-center p-2"
                            : "justify-between p-3",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10"
                            : isFocused
                            ? "bg-accent border-accent-foreground/10"
                            : "bg-card border-transparent hover:bg-accent hover:border-accent-foreground/5",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center",
                            isCollapsed ? "" : "gap-3"
                          )}
                        >
                          {/* House number badge */}
                          <div
                            className={cn(
                              "rounded-xl flex items-center justify-center font-bold transition-all relative",
                              isCollapsed
                                ? "w-9 h-9 text-sm"
                                : "w-12 h-12 text-base",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}
                          >
                            {family.house_no}
                            {/* Member count indicator for collapsed */}
                            {isCollapsed && (
                              <span
                                className={cn(
                                  "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                                  isSelected
                                    ? "bg-primary-foreground text-primary"
                                    : "bg-primary text-primary-foreground"
                                )}
                              >
                                {family.member_count}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span
                                className={cn(
                                  "font-semibold text-sm transition-colors truncate max-w-full",
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground"
                                )}
                              >
                                House No. {family.house_no}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-full mt-0.5">
                                {family.mukhiya_name || "Unknown Head"}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge
                                  variant={isSelected ? "default" : "secondary"}
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 h-5 font-medium",
                                    isSelected &&
                                      "bg-primary/20 text-primary hover:bg-primary/20"
                                  )}
                                >
                                  Ward {family.ward_no}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-5 font-medium"
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  {family.member_count}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isCollapsed && (
                          <ChevronRight
                            size={16}
                            className={cn(
                              "transition-all shrink-0 ml-2",
                              isSelected
                                ? "opacity-100 text-primary translate-x-0"
                                : "opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0"
                            )}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent
                        side="right"
                        className="flex flex-col gap-1"
                      >
                        <p className="font-semibold">House {family.house_no}</p>
                        <p className="text-xs text-muted-foreground">
                          {family.mukhiya_name || "Unknown"} • Ward{" "}
                          {family.ward_no}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {family.member_count} members
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })
            ) : (
              <div
                className={cn(
                  "text-center text-muted-foreground",
                  isCollapsed ? "p-2" : "py-12 px-4"
                )}
              >
                {isCollapsed ? (
                  <Search className="w-4 h-4 mx-auto opacity-50" />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Search className="w-7 h-7 opacity-40" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        No families found
                      </p>
                      <p className="text-sm mt-1">
                        {searchTerm
                          ? `Try a different search term`
                          : "No families available in this ward"}
                      </p>
                    </div>
                    {(searchTerm || selectedWard !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedWard("all");
                        }}
                        className="mt-2"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border bg-gradient-to-t from-muted/30 to-transparent">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <div className="w-8 h-8 rounded-lg bg-[#4A00B1]/10 flex items-center justify-center mx-auto mb-1.5">
                  <Home className="w-4 h-4 text-[#4A00B1]" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {filteredFamilies.length}
                </div>
                <div className="text-xs text-muted-foreground">Families</div>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <div className="w-8 h-8 rounded-lg bg-[#B7CF4F]/15 flex items-center justify-center mx-auto mb-1.5">
                  <Users className="w-4 h-4 text-[#7a8a35]" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {totalMembers}
                </div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <div className="w-8 h-8 rounded-lg bg-[#FF5E39]/10 flex items-center justify-center mx-auto mb-1.5">
                  <MapPin className="w-4 h-4 text-[#FF5E39]" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {selectedWard === "all" ? wards.length : 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedWard === "all" ? "Wards" : "Ward"}
                </div>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs font-mono">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs font-mono">
                  ↵
                </kbd>
                Select
              </span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// --- Main Page Component ---
export default function FamilyMappingPage() {
  const { selectedListId, isLoading: listLoading } = useListContext();

  // State
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [wards, setWards] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Network monitoring state
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Network monitoring effect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Canvas State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Build tree from members
  const familyTree = useMemo(
    () => buildHouseTree(familyMembers),
    [familyMembers]
  );

  // Fetch families with React Query
  const familiesQuery = useQuery({
    queryKey: ["family-mapping-families", selectedListId],
    queryFn: async () => {
      if (!selectedListId) return { families: [], wards: [] };

      // Fetch all families (with larger page size)
      const data = await api.getFamilies(1, 500, selectedListId);
      const families = data.families || [];

      // Extract unique wards
      const wardSet = new Set(families.map((f) => f.ward_no));
      const sortedWards = Array.from(wardSet).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );

      return { families, wards: sortedWards };
    },
    enabled: !!selectedListId && !listLoading,
    staleTime: 30_000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update families and wards when query data changes
  useEffect(() => {
    if (familiesQuery.data) {
      setFamilies(familiesQuery.data.families);
      setWards(familiesQuery.data.wards);
      setLastUpdated(new Date());
    }
  }, [familiesQuery.data]);

  // Update loading and error states
  useEffect(() => {
    setLoading(familiesQuery.isLoading);
    setError(
      familiesQuery.isError
        ? "Failed to load families. Please check your connection."
        : null
    );
  }, [familiesQuery.isLoading, familiesQuery.isError]);

  // Fetch family members with React Query
  const familyMembersQuery = useQuery({
    queryKey: [
      "family-members",
      selectedListId,
      selectedFamily?.ward_no,
      selectedFamily?.house_no,
    ],
    queryFn: async () => {
      if (!selectedListId || !selectedFamily) return [];

      const data = await api.getFamilyMembers(
        selectedFamily.ward_no,
        selectedFamily.house_no,
        selectedListId
      );
      return data.members || [];
    },
    enabled: !!selectedListId && !!selectedFamily,
    staleTime: 30_000,
    gcTime: 300 * 60_000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update family members when query data changes
  useEffect(() => {
    if (familyMembersQuery.data) {
      setFamilyMembers(familyMembersQuery.data);
      setLastUpdated(new Date());
    }
  }, [familyMembersQuery.data]);

  // Update loading members state
  useEffect(() => {
    setLoadingMembers(familyMembersQuery.isLoading);
  }, [familyMembersQuery.isLoading]);

  // Reset view when family changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setSelectedMember(null);
  }, [selectedFamily]);

  // Canvas handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(Math.max(0.5, s * delta), 2));
    } else {
      setPosition((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const endDrag = () => setIsDragging(false);

  const handleSelectFamily = (family: Family) => {
    setSelectedFamily(family);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <HouseSidebar
        families={families}
        selectedFamily={selectedFamily}
        onSelectFamily={handleSelectFamily}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedWard={selectedWard}
        setSelectedWard={setSelectedWard}
        wards={wards}
        loading={loading}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOnline={isOnline}
        hasError={familiesQuery.isError || familyMembersQuery.isError}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg p-4 flex justify-between items-center max-w-4xl mx-auto pointer-events-auto overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4A00B1] via-[#FF5E39] to-[#B7CF4F]" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#4A00B1]/10 flex items-center justify-center shrink-0">
                <Home size={22} className="text-[#4A00B1]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedFamily
                    ? `Family Tree: House ${selectedFamily.house_no}`
                    : "Select a Family"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Users size={14} />
                  <span>
                    {selectedFamily
                      ? `${familyMembers.length} Members • Ward ${selectedFamily.ward_no}`
                      : "Choose a family from the sidebar"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                onClick={() => {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                title="Reset View"
              >
                <Maximize size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Infinite Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 overflow-hidden relative bg-gradient-to-br from-background via-background to-muted/20",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onWheel={handleWheel}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                transform: `translate(${position.x % 60}px, ${
                  position.y % 60
                }px)`,
              }}
            />
          </div>

          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            className="w-full h-full flex items-center justify-center pt-20"
          >
            {loadingMembers ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-[#4A00B1]/10 flex items-center justify-center mb-4">
                  <Loader2 size={32} className="animate-spin text-[#4A00B1]" />
                </div>
                <p className="font-medium">Loading family tree...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-destructive" />
                </div>
                <p className="text-destructive font-medium">{error}</p>
              </div>
            ) : !selectedFamily ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <MapPin size={40} className="opacity-30" />
                </div>
                <p className="font-medium text-foreground">Select a Family</p>
                <p className="text-sm mt-1">
                  Choose a family from the sidebar to view the tree
                </p>
              </div>
            ) : familyTree.length > 0 ? (
              <div className="flex gap-8">
                {familyTree.map((root, idx) => (
                  <TreeNode
                    key={idx}
                    node={root}
                    onNodeClick={setSelectedMember}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Users size={40} className="opacity-30" />
                </div>
                <p className="font-medium">No family data found</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg pointer-events-auto">
            <div className="h-1 bg-gradient-to-r from-[#4A00B1] via-[#FF5E39] to-[#B7CF4F] rounded-full mb-3 -mt-1" />
            <h4 className="text-xs font-semibold text-foreground mb-3">
              Legend
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#4A00B1]"></div>
                <span className="text-muted-foreground">Male (पुरुष)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#FF5E39]"></div>
                <span className="text-muted-foreground">Female (महिला)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-muted-foreground/50"></div>
                <span className="text-muted-foreground">Virtual Head</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-0.5 bg-[#FF5E39]/50 rounded-full"></div>
                <span className="text-muted-foreground">Spouse Link</span>
              </div>
            </div>
          </div>
        </div>

        {/* Member Details Panel */}
        {selectedMember && (
          <MemberDetailsPanel
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </div>
    </div>
  );
}
