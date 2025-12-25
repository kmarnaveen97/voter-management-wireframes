"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type WardMapSummary,
  type HousePosition,
  type SentimentType,
} from "@/lib/api";
import { SENTIMENT_COLORS, WARD_STATUS_COLORS } from "./constants";

// Turnout-based colors (matching sentiment color style)
const getTurnoutColor = (supportPercent: number): string => {
  if (supportPercent >= 80) return "#22c55e"; // green-500 - High
  if (supportPercent >= 60) return "#06b6d4"; // cyan-500 - Good
  if (supportPercent >= 40) return "#f59e0b"; // amber-500 - Medium
  if (supportPercent >= 20) return "#6b7280"; // gray-500 - Low
  return "#ef4444"; // red-500 - Critical
};

// ============================================================================
// Map-based Geo Functions (specific to VillageMap)
// ============================================================================

function generateWardPositions(
  wardIds: string[],
  centerX: number,
  centerY: number,
  baseRadius: number
): Map<string, { x: number; y: number; angle: number }> {
  const positions = new Map<string, { x: number; y: number; angle: number }>();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const minSpacing = 120; // Tight spacing between wards
  const startRadius = 100; // Start close to center

  wardIds.forEach((wardId, i) => {
    const radius = startRadius + minSpacing * Math.sqrt(i);
    const angle = i * goldenAngle;
    positions.set(wardId, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle,
    });
  });
  return positions;
}

function generateHouseSpiral(
  houseCount: number,
  centerX: number,
  centerY: number,
  maxRadius: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < houseCount; i++) {
    const radius = (maxRadius * Math.sqrt(i + 1)) / Math.sqrt(houseCount);
    const angle = i * goldenAngle;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return positions;
}

function generateHexagonPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

// ============================================================================
// VillageMap - SVG Map visualization of wards and houses
// ============================================================================

interface VillageMapProps {
  wards: WardMapSummary[];
  houses: Map<string, HousePosition[]>;
  onWardHover: (ward: WardMapSummary, e: React.MouseEvent) => void;
  onWardLeave: () => void;
  onHouseClick: (house: HousePosition) => void;
  onHouseHover: (houseNo: string | null) => void;
  hoveredWard: string | null;
  selectedWard: string | null;
  selectedHouse: HousePosition | null;
  rippleHouse: { wardNo: string; houseNo: string } | null;
  onSelectWard: (wardNo: string | null) => void;
  sentimentFilters: Set<SentimentType>;
  displayMode?: "sentiment" | "turnout";
}

export function VillageMap({
  wards,
  houses,
  onWardHover,
  onWardLeave,
  onHouseClick,
  onHouseHover,
  hoveredWard,
  selectedWard,
  selectedHouse,
  rippleHouse,
  onSelectWard,
  sentimentFilters,
  displayMode = "sentiment",
}: VillageMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const viewBox = useMemo(() => {
    const size = 800;
    const halfSize = size / 2;
    return {
      width: size,
      height: size,
      centerX: halfSize,
      centerY: halfSize,
    };
  }, []);

  // Generate ward positions
  const wardPositions = useMemo(() => {
    const wardIds = wards.map((w) => w.ward_no);
    return generateWardPositions(
      wardIds,
      viewBox.centerX,
      viewBox.centerY,
      250
    );
  }, [wards, viewBox]);

  // Generate house positions for each ward
  const housePositionsByWard = useMemo(() => {
    const result = new Map<string, Array<{ x: number; y: number }>>();

    wards.forEach((ward) => {
      const wardPos = wardPositions.get(ward.ward_no);
      if (!wardPos) return;

      const wardHouses = houses.get(ward.ward_no) || [];
      const positions = generateHouseSpiral(
        wardHouses.length,
        wardPos.x,
        wardPos.y,
        50
      );
      result.set(ward.ward_no, positions);
    });

    return result;
  }, [wards, wardPositions, houses]);

  // Zoom to ward when selected
  useEffect(() => {
    if (selectedWard && containerRef.current) {
      const wardPos = wardPositions.get(selectedWard);
      if (wardPos) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        // Calculate pan to center the ward
        const targetScale = 1.5;
        const panX = containerCenterX - wardPos.x * targetScale;
        const panY = containerCenterY - wardPos.y * targetScale;

        setScale(targetScale);
        setPan({ x: panX, y: panY });
      }
    } else if (!selectedWard) {
      // Reset view when deselecting
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedWard, wardPositions]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(0.5, s * delta), 3));
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden"
    >
      {/* Controls - Responsive positioning */}
      <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
          className="bg-white/90 hover:bg-white shadow-lg h-8 w-8 sm:h-10 sm:w-10"
        >
          <ZoomIn className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
          className="bg-white/90 hover:bg-white shadow-lg h-8 w-8 sm:h-10 sm:w-10"
        >
          <ZoomOut className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={resetView}
          className="bg-white/90 hover:bg-white shadow-lg h-8 w-8 sm:h-10 sm:w-10"
        >
          <Maximize className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>
      </div>

      {/* Legend - Responsive sizing */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg max-w-[140px] sm:max-w-none">
        <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
          {displayMode === "sentiment" ? "Sentiment" : "Turnout"}
        </h4>
        {displayMode === "sentiment" ? (
          <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                style={{ backgroundColor: SENTIMENT_COLORS.support.bg }}
              />
              <span className="text-slate-700">Support</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                style={{ backgroundColor: SENTIMENT_COLORS.oppose.bg }}
              />
              <span className="text-slate-700">Oppose</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                style={{ backgroundColor: SENTIMENT_COLORS.swing.bg }}
              />
              <span className="text-slate-700">Swing</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                style={{ backgroundColor: SENTIMENT_COLORS.unknown.bg }}
              />
              <span className="text-slate-700">Unknown</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500" />
              <span className="text-slate-700">High (80%+)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-cyan-500" />
              <span className="text-slate-700">Good (60-80%)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500" />
              <span className="text-slate-700">Medium (40-60%)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-500" />
              <span className="text-slate-700">Low (20-40%)</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500" />
              <span className="text-slate-700">Critical (&lt;20%)</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Map */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className={cn(
          "w-full h-full",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Definitions */}
        <defs>
          {/* Farm field pattern - tilled agricultural rows */}
          <pattern
            id="farmFields"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Dark earth tone base */}
            <rect width="80" height="80" fill="#1a1410" />

            {/* Tilled field rows - horizontal lines simulating plowed land */}
            {[0, 10, 20, 30, 40, 50, 60, 70].map((y) => (
              <line
                key={`row-${y}`}
                x1="0"
                y1={y}
                x2="80"
                y2={y}
                stroke="#2d2418"
                strokeWidth="1.5"
                opacity="0.6"
              />
            ))}

            {/* Subtle crop texture - small irregular dots */}
            <circle cx="15" cy="5" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="45" cy="15" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="65" cy="25" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="25" cy="35" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="55" cy="45" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="10" cy="55" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="70" cy="65" r="0.8" fill="#3d3420" opacity="0.4" />
            <circle cx="35" cy="75" r="0.8" fill="#3d3420" opacity="0.4" />
          </pattern>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Transform group for pan/zoom */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}
          style={{ transformOrigin: "center" }}
        >
          {/* Background - farm fields */}
          <rect
            x="0"
            y="0"
            width={viewBox.width}
            height={viewBox.height}
            fill="url(#farmFields)"
          />

          {/* Arterial roads (decorative lines from center) */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const endX = viewBox.centerX + 380 * Math.cos(rad);
            const endY = viewBox.centerY + 380 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={viewBox.centerX}
                y1={viewBox.centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                strokeDasharray="8,8"
              />
            );
          })}

          {/* Ward Polygons */}
          {wards.map((ward) => {
            const pos = wardPositions.get(ward.ward_no);
            if (!pos) return null;

            const statusConfig = WARD_STATUS_COLORS[ward.status];
            const isHovered = hoveredWard === ward.ward_no;
            const isSelected = selectedWard === ward.ward_no;

            // Calculate ward fill based on displayMode
            const wardSupportPercent =
              ward.total_voters > 0
                ? (ward.support_count / ward.total_voters) * 100
                : 50;
            const wardFill =
              displayMode === "turnout"
                ? getTurnoutColor(wardSupportPercent)
                : statusConfig.fill;

            return (
              <g key={ward.ward_no}>
                {/* Ward hexagon */}
                <polygon
                  points={generateHexagonPoints(pos.x, pos.y, 90)}
                  fill={wardFill}
                  stroke={statusConfig.stroke}
                  strokeWidth={isHovered || isSelected ? 3 : 1.5}
                  opacity={isHovered || isSelected ? 1 : 0.85}
                  filter={isHovered ? "url(#glow)" : undefined}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={(e) => onWardHover(ward, e)}
                  onMouseLeave={onWardLeave}
                  onClick={() =>
                    onSelectWard(
                      selectedWard === ward.ward_no ? null : ward.ward_no
                    )
                  }
                />

                {/* Ward label */}
                <text
                  x={pos.x}
                  y={pos.y - 65}
                  textAnchor="middle"
                  className="text-xs font-bold fill-slate-600 pointer-events-none select-none"
                  style={{ fontSize: "11px" }}
                >
                  WARD {ward.ward_no}
                </text>

                {/* House dots (spiral) - scaled by family size */}
                {(houses.get(ward.ward_no) || []).map((house, hIdx) => {
                  const housePositions = housePositionsByWard.get(ward.ward_no);
                  if (!housePositions || !housePositions[hIdx]) return null;

                  // Filter by sentiment
                  if (!sentimentFilters.has(house.sentiment)) return null;

                  const housePos = housePositions[hIdx];
                  // Calculate house color based on displayMode
                  const houseSupportPercent =
                    house.family_size > 0
                      ? (house.support_count / house.family_size) * 100
                      : 50;
                  const houseColor =
                    displayMode === "turnout"
                      ? getTurnoutColor(houseSupportPercent)
                      : SENTIMENT_COLORS[house.sentiment]?.bg || "#9ca3af";
                  // Scale dot size based on family size (min 8, max 16 for better touch targets)
                  const dotRadius = Math.min(
                    16,
                    Math.max(8, 5 + (house.family_size || 1) * 0.9)
                  );
                  const isSelectedHouse =
                    selectedHouse?.house_no === house.house_no &&
                    selectedHouse?.ward_no === house.ward_no;

                  const isRippling =
                    rippleHouse?.wardNo === ward.ward_no &&
                    rippleHouse?.houseNo === house.house_no;

                  return (
                    <g key={`${ward.ward_no}-${house.house_no}`}>
                      {/* Pulse animation for selected house */}
                      {isSelectedHouse && (
                        <circle
                          cx={housePos.x}
                          cy={housePos.y}
                          r={dotRadius + 4}
                          fill="none"
                          stroke={houseColor}
                          strokeWidth={2}
                          opacity={0.5}
                          className="animate-ping"
                        />
                      )}
                      {/* Ripple animation when sentiment is tagged */}
                      {isRippling && (
                        <>
                          <circle
                            cx={housePos.x}
                            cy={housePos.y}
                            r={dotRadius}
                            fill="none"
                            stroke={houseColor}
                            strokeWidth={3}
                            className="animate-[ripple_0.8s_ease-out_forwards]"
                          />
                          <circle
                            cx={housePos.x}
                            cy={housePos.y}
                            r={dotRadius}
                            fill="none"
                            stroke={houseColor}
                            strokeWidth={2}
                            className="animate-[ripple_0.8s_ease-out_0.2s_forwards]"
                          />
                        </>
                      )}
                      <circle
                        cx={housePos.x}
                        cy={housePos.y}
                        r={isSelectedHouse ? dotRadius + 2 : dotRadius}
                        fill={houseColor}
                        stroke="white"
                        strokeWidth={isSelectedHouse ? 2 : 1}
                        className="cursor-pointer transition-all duration-200 hover:opacity-80"
                        style={{
                          filter: isSelectedHouse
                            ? "drop-shadow(0 0 4px rgba(0,0,0,0.3))"
                            : undefined,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onHouseClick(house);
                        }}
                        onMouseEnter={() => onHouseHover(house.house_no)}
                        onMouseLeave={() => onHouseHover(null)}
                      >
                        <title>
                          House {house.house_no} - {house.family_size} members (
                          {displayMode === "turnout"
                            ? `${Math.round(houseSupportPercent)}% support`
                            : house.sentiment}
                          )
                        </title>
                      </circle>
                      {/* House number label - shown when ward is selected */}
                      {isSelected && (
                        <text
                          x={housePos.x}
                          y={housePos.y + dotRadius + 10}
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                          style={{
                            fontSize: "8px",
                            fill: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {house.house_no}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Village Center */}
          <g>
            <circle
              cx={viewBox.centerX}
              cy={viewBox.centerY}
              r={50}
              fill="rgba(100, 116, 139, 0.3)"
              stroke="rgba(100, 116, 139, 0.5)"
              strokeWidth="2"
            />
            <text
              x={viewBox.centerX}
              y={viewBox.centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-semibold fill-slate-400 pointer-events-none select-none"
              style={{ fontSize: "10px" }}
            >
              VILLAGE CENTER
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
