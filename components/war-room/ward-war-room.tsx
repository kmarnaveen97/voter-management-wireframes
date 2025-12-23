"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type WardMapSummary,
  type HousePosition,
  type SentimentType,
  type PollingBooth,
} from "@/lib/api";
import { SENTIMENT_COLORS, WARD_STATUS_COLORS } from "./constants";

// ============================================================================
// WardWarRoom - Full screen view of a single ward with houses grid
// ============================================================================

interface WardWarRoomProps {
  wardNo: string;
  wardData?: WardMapSummary;
  houses: HousePosition[];
  listId: number;
  onClose: () => void;
  onHouseClick: (house: HousePosition) => void;
  onTagSentiment: (
    wardNo: string,
    houseNo: string,
    sentiment: SentimentType
  ) => void;
}

export function WardWarRoom({
  wardNo,
  wardData,
  houses,
  listId,
  onClose,
  onHouseClick,
  onTagSentiment,
}: WardWarRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredHouse, setHoveredHouse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | "all">(
    "all"
  );
  const [expandedStations, setExpandedStations] = useState<Set<string>>(
    new Set()
  );
  const [expandedBooths, setExpandedBooths] = useState<Set<string>>(new Set());
  const [pollingBooths, setPollingBooths] = useState<PollingBooth[]>([]);

  // Fetch polling booth data for this ward
  useEffect(() => {
    const fetchBooths = async () => {
      try {
        const data = await api.getPollingBooths(listId, undefined, {
          ward_no: wardNo,
        });
        setPollingBooths(data.booths || []);
      } catch (e) {
        console.warn("Failed to fetch polling booths for ward", wardNo, e);
      }
    };
    fetchBooths();
  }, [listId, wardNo]);

  // Filter houses
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const matchesSearch =
        !searchQuery ||
        h.house_no.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSentiment =
        sentimentFilter === "all" || h.sentiment === sentimentFilter;
      return matchesSearch && matchesSentiment;
    });
  }, [houses, searchQuery, sentimentFilter]);

  // Build booth lookup from fetched polling booths
  const boothLookup = useMemo(() => {
    const lookup = new Map<
      string,
      {
        stationCode: string;
        stationName: string;
        boothCode: string;
        boothName: string;
      }
    >();
    pollingBooths.forEach((booth) => {
      const key = booth.code || booth.polling_booth_id?.toString() || "";
      if (key) {
        lookup.set(key, {
          stationCode: booth.station_code || "PS-1",
          stationName:
            booth.station_name ||
            `Polling Station ${booth.polling_station_id || 1}`,
          boothCode: booth.code || booth.polling_booth_id?.toString() || "",
          boothName: booth.name || `Booth ${booth.polling_booth_id || 1}`,
        });
      }
    });
    return lookup;
  }, [pollingBooths]);

  // Group houses by polling station and booth
  const groupedHouses = useMemo(() => {
    const stationMap = new Map<
      string,
      {
        ps_code: string;
        ps_name: string;
        booths: Map<
          string,
          {
            pb_code: string;
            pb_name: string;
            houses: HousePosition[];
            stats: {
              support: number;
              oppose: number;
              swing: number;
              unknown: number;
              total: number;
            };
          }
        >;
        stats: {
          support: number;
          oppose: number;
          swing: number;
          unknown: number;
          total: number;
        };
      }
    >();

    // If we have polling booth data, use that structure
    if (pollingBooths.length > 0) {
      // Group by station
      const stationGroups = new Map<string, PollingBooth[]>();
      pollingBooths.forEach((booth) => {
        const stationKey =
          booth.station_code || `station-${booth.polling_station_id || 1}`;
        if (!stationGroups.has(stationKey)) {
          stationGroups.set(stationKey, []);
        }
        stationGroups.get(stationKey)!.push(booth);
      });

      stationGroups.forEach((booths, stationKey) => {
        const firstBooth = booths[0];
        stationMap.set(stationKey, {
          ps_code: stationKey,
          ps_name: firstBooth.station_name || `Polling Station`,
          booths: new Map(),
          stats: { support: 0, oppose: 0, swing: 0, unknown: 0, total: 0 },
        });

        const station = stationMap.get(stationKey)!;

        booths.forEach((booth) => {
          const boothKey =
            booth.code || booth.polling_booth_id?.toString() || "default";
          station.booths.set(boothKey, {
            pb_code: boothKey,
            pb_name: booth.name || `Booth ${booth.polling_booth_id}`,
            houses: [],
            stats: {
              support: booth.sentiment_counts?.support || 0,
              oppose: booth.sentiment_counts?.oppose || 0,
              swing: booth.sentiment_counts?.swing || 0,
              unknown: booth.sentiment_counts?.unknown || 0,
              total: booth.voter_count || 0,
            },
          });
          // Update station stats from booth
          station.stats.support += booth.sentiment_counts?.support || 0;
          station.stats.oppose += booth.sentiment_counts?.oppose || 0;
          station.stats.swing += booth.sentiment_counts?.swing || 0;
          station.stats.unknown += booth.sentiment_counts?.unknown || 0;
          station.stats.total += booth.voter_count || 0;
        });
      });

      // Now assign houses to booths based on pb_code match
      // If house doesn't have pb_code, assign to first booth
      const firstStationKey = stationMap.keys().next().value;
      const firstStation = firstStationKey
        ? stationMap.get(firstStationKey)
        : null;
      const firstBoothKey = firstStation?.booths.keys().next().value;

      filteredHouses.forEach((house) => {
        const pbCode = house.pb_code;
        let assigned = false;

        if (pbCode) {
          // Try to find the booth by pb_code
          for (const [, station] of stationMap) {
            const booth = station.booths.get(pbCode);
            if (booth) {
              booth.houses.push(house);
              assigned = true;
              break;
            }
          }
        }

        // If not assigned and we have a first booth, assign there
        if (!assigned && firstStation && firstBoothKey) {
          const booth = firstStation.booths.get(firstBoothKey);
          if (booth) {
            booth.houses.push(house);
          }
        }
      });
    } else {
      // Fallback: group houses by their ps_code/pb_code if available
      filteredHouses.forEach((house) => {
        const psCode = house.ps_code || "default";
        const psName = house.ps_name || `Ward ${wardNo} Station`;
        const pbCode = house.pb_code || "default";
        const pbName = house.pb_name || `Ward ${wardNo} Booth`;

        if (!stationMap.has(psCode)) {
          stationMap.set(psCode, {
            ps_code: psCode,
            ps_name: psName,
            booths: new Map(),
            stats: { support: 0, oppose: 0, swing: 0, unknown: 0, total: 0 },
          });
        }

        const station = stationMap.get(psCode)!;

        if (!station.booths.has(pbCode)) {
          station.booths.set(pbCode, {
            pb_code: pbCode,
            pb_name: pbName,
            houses: [],
            stats: { support: 0, oppose: 0, swing: 0, unknown: 0, total: 0 },
          });
        }

        const booth = station.booths.get(pbCode)!;
        booth.houses.push(house);

        // Update booth stats
        booth.stats.support += house.support_count;
        booth.stats.oppose += house.oppose_count;
        booth.stats.swing += house.swing_count;
        booth.stats.unknown += Math.max(
          0,
          house.family_size -
            house.support_count -
            house.oppose_count -
            house.swing_count
        );
        booth.stats.total += house.family_size;

        // Update station stats
        station.stats.support += house.support_count;
        station.stats.oppose += house.oppose_count;
        station.stats.swing += house.swing_count;
        station.stats.unknown += Math.max(
          0,
          house.family_size -
            house.support_count -
            house.oppose_count -
            house.swing_count
        );
        station.stats.total += house.family_size;
      });
    }

    return stationMap;
  }, [filteredHouses, pollingBooths, wardNo]);

  // Calculate ward stats
  const wardStats = useMemo(() => {
    let support = 0,
      oppose = 0,
      swing = 0,
      unknown = 0,
      total = 0;
    houses.forEach((h) => {
      support += h.support_count;
      oppose += h.oppose_count;
      swing += h.swing_count;
      const others =
        h.family_size - h.support_count - h.oppose_count - h.swing_count;
      unknown += Math.max(0, others);
      total += h.family_size;
    });
    return {
      support,
      oppose,
      swing,
      unknown,
      total,
      houseCount: houses.length,
      stationCount: groupedHouses.size,
    };
  }, [houses, groupedHouses]);

  // Toggle station expansion
  const toggleStation = (psCode: string) => {
    setExpandedStations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(psCode)) {
        newSet.delete(psCode);
      } else {
        newSet.add(psCode);
      }
      return newSet;
    });
  };

  // Toggle booth expansion
  const toggleBooth = (boothKey: string) => {
    setExpandedBooths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boothKey)) {
        newSet.delete(boothKey);
      } else {
        newSet.add(boothKey);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    const allStations = new Set<string>();
    const allBooths = new Set<string>();
    groupedHouses.forEach((station, psCode) => {
      allStations.add(psCode);
      station.booths.forEach((_, pbCode) => {
        allBooths.add(`${psCode}-${pbCode}`);
      });
    });
    setExpandedStations(allStations);
    setExpandedBooths(allBooths);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedStations(new Set());
    setExpandedBooths(new Set());
  };

  const statusConfig = wardData
    ? WARD_STATUS_COLORS[wardData.status]
    : WARD_STATUS_COLORS.battleground;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <ChevronLeft size={24} />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">
                  Ward {wardNo} War Room
                </h1>
                <Badge
                  style={{
                    backgroundColor: statusConfig.fill,
                    color: statusConfig.stroke,
                  }}
                  className="border-0 font-semibold"
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-white/60 text-sm mt-0.5">
                {wardStats.stationCount} stations • {wardStats.houseCount}{" "}
                houses • {wardStats.total} voters
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search house..."
                className="pl-9 h-9 w-40 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter */}
            <Select
              value={sentimentFilter}
              onValueChange={(v) =>
                setSentimentFilter(v as SentimentType | "all")
              }
            >
              <SelectTrigger className="w-32 h-9 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="oppose">Oppose</SelectItem>
                <SelectItem value="swing">Swing</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                onClick={expandAll}
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                onClick={collapseAll}
              >
                Collapse
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white/80 text-sm">
              {wardStats.support} Support
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-white/80 text-sm">
              {wardStats.oppose} Oppose
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-white/80 text-sm">
              {wardStats.swing} Swing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-white/80 text-sm">
              {wardStats.unknown} Unknown
            </span>
          </div>
          <div className="ml-auto">
            <Progress
              value={(wardStats.support / (wardStats.total || 1)) * 100}
              className="w-32 h-2 bg-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Houses Grid View - Grouped by Polling Station & Booth */}
      <div ref={containerRef} className="flex-1 relative overflow-auto p-6">
        <div
          className="min-h-full space-y-4"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Grouped by Polling Station */}
          {Array.from(groupedHouses.entries()).map(([psCode, station]) => {
            const isStationExpanded = expandedStations.has(psCode);
            const stationHouses = Array.from(station.booths.values()).flatMap(
              (b) => b.houses
            );
            const stationStats = {
              total: stationHouses.length,
              support: stationHouses.filter((h) => h.sentiment === "support")
                .length,
              oppose: stationHouses.filter((h) => h.sentiment === "oppose")
                .length,
              swing: stationHouses.filter((h) => h.sentiment === "swing")
                .length,
            };

            return (
              <div
                key={psCode}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
              >
                {/* Polling Station Header */}
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                  onClick={() => {
                    setExpandedStations((prev) => {
                      const next = new Set(prev);
                      if (next.has(psCode)) {
                        next.delete(psCode);
                      } else {
                        next.add(psCode);
                      }
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-transform",
                        isStationExpanded ? "bg-blue-500/20" : "bg-slate-700"
                      )}
                    >
                      {isStationExpanded ? (
                        <ChevronDown size={18} className="text-blue-400" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">
                        {station.ps_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        PS Code: {psCode} • {station.booths.size}{" "}
                        {station.booths.size === 1 ? "booth" : "booths"} •{" "}
                        {stationStats.total} houses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Station Stats Mini */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400">
                        {stationStats.support} ✓
                      </span>
                      <span className="text-red-400">
                        {stationStats.oppose} ✗
                      </span>
                      <span className="text-yellow-400">
                        {stationStats.swing} ?
                      </span>
                    </div>
                    {/* Progress */}
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                      {stationStats.support > 0 && (
                        <div
                          className="bg-green-500 h-full"
                          style={{
                            width: `${
                              (stationStats.support / stationStats.total) * 100
                            }%`,
                          }}
                        />
                      )}
                      {stationStats.oppose > 0 && (
                        <div
                          className="bg-red-500 h-full"
                          style={{
                            width: `${
                              (stationStats.oppose / stationStats.total) * 100
                            }%`,
                          }}
                        />
                      )}
                      {stationStats.swing > 0 && (
                        <div
                          className="bg-yellow-500 h-full"
                          style={{
                            width: `${
                              (stationStats.swing / stationStats.total) * 100
                            }%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </button>

                {/* Polling Booths */}
                {isStationExpanded && (
                  <div className="border-t border-slate-700/50">
                    {Array.from(station.booths.entries()).map(
                      ([pbCode, booth]) => {
                        const isBoothExpanded = expandedBooths.has(
                          `${psCode}-${pbCode}`
                        );
                        const boothStats = {
                          total: booth.houses.length,
                          support: booth.houses.filter(
                            (h) => h.sentiment === "support"
                          ).length,
                          oppose: booth.houses.filter(
                            (h) => h.sentiment === "oppose"
                          ).length,
                          swing: booth.houses.filter(
                            (h) => h.sentiment === "swing"
                          ).length,
                        };

                        return (
                          <div
                            key={pbCode}
                            className="border-b border-slate-700/30 last:border-b-0"
                          >
                            {/* Polling Booth Header */}
                            <button
                              className="w-full flex items-center justify-between p-3 pl-8 hover:bg-slate-700/30 transition-colors"
                              onClick={() => {
                                setExpandedBooths((prev) => {
                                  const key = `${psCode}-${pbCode}`;
                                  const next = new Set(prev);
                                  if (next.has(key)) {
                                    next.delete(key);
                                  } else {
                                    next.add(key);
                                  }
                                  return next;
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center transition-transform",
                                    isBoothExpanded
                                      ? "bg-purple-500/20"
                                      : "bg-slate-700/50"
                                  )}
                                >
                                  {isBoothExpanded ? (
                                    <ChevronDown
                                      size={14}
                                      className="text-purple-400"
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={14}
                                      className="text-slate-400"
                                    />
                                  )}
                                </div>
                                <div className="text-left">
                                  <h4 className="font-medium text-white/90 text-sm">
                                    {booth.pb_name}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    Booth: {pbCode} • {boothStats.total} houses
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Booth Stats Mini */}
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-green-400">
                                    {boothStats.support}
                                  </span>
                                  <span className="text-red-400">
                                    {boothStats.oppose}
                                  </span>
                                  <span className="text-yellow-400">
                                    {boothStats.swing}
                                  </span>
                                </div>
                                {/* Mini Progress */}
                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
                                  {boothStats.support > 0 && (
                                    <div
                                      className="bg-green-500 h-full"
                                      style={{
                                        width: `${
                                          (boothStats.support /
                                            boothStats.total) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  )}
                                  {boothStats.oppose > 0 && (
                                    <div
                                      className="bg-red-500 h-full"
                                      style={{
                                        width: `${
                                          (boothStats.oppose /
                                            boothStats.total) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  )}
                                  {boothStats.swing > 0 && (
                                    <div
                                      className="bg-yellow-500 h-full"
                                      style={{
                                        width: `${
                                          (boothStats.swing /
                                            boothStats.total) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Houses Grid within Booth */}
                            {isBoothExpanded && (
                              <div className="p-4 pl-12 bg-slate-900/30">
                                <div
                                  className="grid gap-3"
                                  style={{
                                    gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))`,
                                  }}
                                >
                                  {booth.houses.map((house) => {
                                    const sentimentConfig =
                                      SENTIMENT_COLORS[house.sentiment] ||
                                      SENTIMENT_COLORS.unknown;
                                    const isHovered =
                                      hoveredHouse === house.house_no;

                                    return (
                                      <div
                                        key={house.house_no}
                                        className={cn(
                                          "relative bg-slate-800 rounded-lg border-2 p-3 cursor-pointer transition-all duration-200 min-h-[100px]",
                                          isHovered
                                            ? "border-white shadow-lg scale-[1.02]"
                                            : "border-slate-700 hover:border-slate-500 active:scale-95"
                                        )}
                                        style={{
                                          borderLeftWidth: "4px",
                                          borderLeftColor: sentimentConfig.bg,
                                        }}
                                        onMouseEnter={() =>
                                          setHoveredHouse(house.house_no)
                                        }
                                        onMouseLeave={() =>
                                          setHoveredHouse(null)
                                        }
                                        onClick={() => onHouseClick(house)}
                                      >
                                        {/* House Icon & Number */}
                                        <div className="flex items-start justify-between mb-2">
                                          <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{
                                              backgroundColor:
                                                sentimentConfig.bg + "30",
                                            }}
                                          >
                                            <Home
                                              size={16}
                                              style={{
                                                color: sentimentConfig.bg,
                                              }}
                                            />
                                          </div>
                                          {house.has_manual_tag && (
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] bg-slate-700 text-slate-300"
                                            >
                                              Tagged
                                            </Badge>
                                          )}
                                        </div>

                                        {/* House Details */}
                                        <h3 className="font-bold text-white text-base">
                                          #{house.house_no}
                                        </h3>
                                        <p className="text-slate-400 text-xs mt-0.5">
                                          {house.family_size}{" "}
                                          {house.family_size === 1
                                            ? "member"
                                            : "members"}
                                        </p>

                                        {/* Sentiment Breakdown Mini */}
                                        <div className="flex gap-0.5 mt-2">
                                          {house.support_count > 0 && (
                                            <div
                                              className="h-1 rounded-full bg-green-500"
                                              style={{
                                                width: `${
                                                  (house.support_count /
                                                    house.family_size) *
                                                  100
                                                }%`,
                                              }}
                                            />
                                          )}
                                          {house.oppose_count > 0 && (
                                            <div
                                              className="h-1 rounded-full bg-red-500"
                                              style={{
                                                width: `${
                                                  (house.oppose_count /
                                                    house.family_size) *
                                                  100
                                                }%`,
                                              }}
                                            />
                                          )}
                                          {house.swing_count > 0 && (
                                            <div
                                              className="h-1 rounded-full bg-yellow-500"
                                              style={{
                                                width: `${
                                                  (house.swing_count /
                                                    house.family_size) *
                                                  100
                                                }%`,
                                              }}
                                            />
                                          )}
                                          {house.family_size -
                                            house.support_count -
                                            house.oppose_count -
                                            house.swing_count >
                                            0 && (
                                            <div className="h-1 rounded-full bg-gray-500 flex-1" />
                                          )}
                                        </div>

                                        {/* Quick Tag Buttons - Show on Hover/Touch */}
                                        {isHovered && (
                                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900 rounded-full p-1.5 shadow-xl border border-slate-600">
                                            <button
                                              className="w-9 h-9 rounded-full bg-green-500/20 hover:bg-green-500/40 active:bg-green-500/60 flex items-center justify-center transition-colors touch-manipulation"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onTagSentiment(
                                                  wardNo,
                                                  house.house_no,
                                                  "support"
                                                );
                                              }}
                                              title="Support"
                                            >
                                              <CheckCircle2
                                                size={16}
                                                className="text-green-400"
                                              />
                                            </button>
                                            <button
                                              className="w-9 h-9 rounded-full bg-red-500/20 hover:bg-red-500/40 active:bg-red-500/60 flex items-center justify-center transition-colors touch-manipulation"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onTagSentiment(
                                                  wardNo,
                                                  house.house_no,
                                                  "oppose"
                                                );
                                              }}
                                              title="Oppose"
                                            >
                                              <XCircle
                                                size={16}
                                                className="text-red-400"
                                              />
                                            </button>
                                            <button
                                              className="w-9 h-9 rounded-full bg-yellow-500/20 hover:bg-yellow-500/40 active:bg-yellow-500/60 flex items-center justify-center transition-colors touch-manipulation"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onTagSentiment(
                                                  wardNo,
                                                  house.house_no,
                                                  "swing"
                                                );
                                              }}
                                              title="Swing"
                                            >
                                              <HelpCircle
                                                size={16}
                                                className="text-yellow-400"
                                              />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredHouses.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Home className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-lg">No houses found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "No houses in this ward"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Click a house card to view details • Hover to quick tag</span>
          <span>Press ESC to go back</span>
        </div>
      </div>
    </div>
  );
}
