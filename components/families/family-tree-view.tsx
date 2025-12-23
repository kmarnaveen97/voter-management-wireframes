"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Users,
  ZoomIn,
  ZoomOut,
  Maximize,
  MapPin,
  Activity,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for family tree data
export interface FamilyTreeMember {
  id: number;
  name: string;
  hindiName?: string;
  age: number | null;
  gender: "Male" | "Female";
  role?: string;
  tag?: string;
  status?: "Deceased/Absent" | "Active";
  voter_id?: string;
  serial_no?: string;
  spouse?: FamilyTreeMember;
  children?: FamilyTreeMember[];
}

export interface FamilyTreeViewData {
  head: FamilyTreeMember;
  ward_no: string;
  house_no: string;
  member_count: number;
}

interface FamilyTreeViewProps {
  data: FamilyTreeViewData;
  onClose?: () => void;
}

export function FamilyTreeView({ data, onClose }: FamilyTreeViewProps) {
  const [zoom, setZoom] = useState(0.85);
  const [selectedMember, setSelectedMember] = useState<FamilyTreeMember | null>(
    null
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".tree-node")) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.4, prev + delta), 1.5));
  }, []);

  const resetView = useCallback(() => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  }, []);

  // Tree Node Component
  const TreeNode = ({
    node,
    level = 0,
  }: {
    node: FamilyTreeMember;
    level?: number;
  }) => {
    const isHead = level === 0;
    const isMale = node.gender === "Male";
    const isDeceased = node.status === "Deceased/Absent";

    return (
      <div className="flex flex-col items-center mx-3">
        {/* Connection Line Top */}
        {level > 0 && <div className="h-6 w-px bg-border" />}

        {/* Node Content */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMember(node);
          }}
          className={cn(
            "tree-node relative flex flex-col items-center group cursor-pointer transition-all duration-200",
            selectedMember?.id === node.id
              ? "scale-105 z-10"
              : "hover:-translate-y-1"
          )}
        >
          {/* Card */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl shadow-sm border min-w-[180px] bg-card",
              isDeceased &&
                "border-dashed border-muted-foreground/40 opacity-70",
              isHead && "border-primary border-2 shadow-md",
              selectedMember?.id === node.id && "ring-2 ring-primary"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm",
                isDeceased
                  ? "bg-muted-foreground"
                  : isMale
                  ? "bg-blue-500"
                  : "bg-pink-500"
              )}
            >
              {isMale ? "पु" : "म"}
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "text-sm font-bold truncate",
                  isDeceased && "text-muted-foreground italic"
                )}
              >
                {node.name}
              </span>
              {node.hindiName && (
                <span className="text-xs text-muted-foreground truncate">
                  {node.hindiName}
                </span>
              )}
              {node.age && (
                <span className="text-[10px] text-muted-foreground">
                  {node.age} वर्ष
                </span>
              )}
            </div>

            {/* Role/Tag Badge */}
            {(node.role || node.tag) && (
              <div className="absolute -top-2 -right-2">
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0"
                >
                  {node.role || node.tag}
                </Badge>
              </div>
            )}
          </div>

          {/* Spouse Card (Attached) */}
          {node.spouse && (
            <div className="absolute top-0 left-full -ml-2 z-[-1] pl-4 pt-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMember(node.spouse!);
                }}
                className={cn(
                  "tree-node flex items-center gap-2 p-2 rounded-r-xl border border-l-0 bg-muted/50 shadow-sm hover:bg-muted min-w-[140px] cursor-pointer transition-all",
                  selectedMember?.id === node.spouse.id &&
                    "ring-2 ring-pink-400 bg-background"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">
                  म
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">
                    {node.spouse.name}
                  </span>
                  {node.spouse.age && (
                    <span className="text-[10px] text-muted-foreground">
                      {node.spouse.age} वर्ष
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Children Container */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Connection Line Down */}
            <div className="h-5 w-px bg-border" />

            {/* Horizontal Bar for Multiple Children */}
            {node.children.length > 1 && (
              <div
                className="h-px bg-border"
                style={{
                  width: `calc(100% - 48px)`,
                  minWidth: `${(node.children.length - 1) * 200}px`,
                }}
              />
            )}

            {/* Recursive Children Render */}
            <div className="flex items-start justify-center">
              {node.children.map((child, idx) => (
                <div key={child.id || idx} className="relative">
                  {/* Hide edges of horizontal line for first/last */}
                  {node.children!.length > 1 && (
                    <>
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1/2 h-px bg-background -translate-y-px" />
                      )}
                      {idx === node.children!.length - 1 && (
                        <div className="absolute top-0 right-0 w-1/2 h-px bg-background -translate-y-px" />
                      )}
                    </>
                  )}
                  <TreeNode node={child} level={level + 1} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[600px] bg-muted/30 overflow-hidden rounded-lg border relative">
      {/* Sidebar - Member Details */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-50 w-72 bg-background shadow-2xl transform transition-transform duration-300 ease-in-out border-l",
          selectedMember ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedMember && (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b flex justify-between items-center bg-muted/50">
              <h2 className="font-bold text-sm">सदस्य विवरण</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedMember(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="flex flex-col items-center mb-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2",
                      selectedMember.gender === "Male"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-pink-100 text-pink-600"
                    )}
                  >
                    {selectedMember.gender === "Male" ? "पु" : "म"}
                  </div>
                  <h3 className="text-base font-bold text-center">
                    {selectedMember.name}
                  </h3>
                  {selectedMember.hindiName && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.hindiName}
                    </p>
                  )}
                  {selectedMember.status === "Deceased/Absent" && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      अनुपस्थित / मृत
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      मूल जानकारी
                    </span>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          आयु
                        </span>
                        <span className="text-sm font-medium">
                          {selectedMember.age || "N/A"} वर्ष
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          लिंग
                        </span>
                        <span className="text-sm font-medium">
                          {selectedMember.gender === "Male" ? "पुरुष" : "महिला"}
                        </span>
                      </div>
                      {selectedMember.voter_id && (
                        <div className="col-span-2">
                          <span className="block text-xs text-muted-foreground">
                            मतदाता ID
                          </span>
                          <span className="text-sm font-medium font-mono">
                            {selectedMember.voter_id}
                          </span>
                        </div>
                      )}
                      {selectedMember.serial_no && (
                        <div>
                          <span className="block text-xs text-muted-foreground">
                            क्रमांक
                          </span>
                          <span className="text-sm font-medium">
                            #{selectedMember.serial_no}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedMember.spouse ||
                    selectedMember.children?.length) && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        संबंध
                      </span>
                      <div className="mt-2 space-y-2">
                        {selectedMember.spouse && (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                            <span className="text-xs">
                              पति/पत्नी: <b>{selectedMember.spouse.name}</b>
                            </span>
                          </div>
                        )}
                        {selectedMember.children &&
                          selectedMember.children.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="text-xs">
                                  संतान ({selectedMember.children.length}):
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 ml-3">
                                {selectedMember.children.map((c) => (
                                  <Badge
                                    key={c.id}
                                    variant="outline"
                                    className="text-[10px] px-1.5"
                                  >
                                    {c.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 border-t bg-muted/50 text-center text-xs text-muted-foreground">
              घर नंबर {data.house_no}, वार्ड {data.ward_no}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border inline-flex flex-col pointer-events-auto">
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              परिवार वंशवृक्ष
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> घर {data.house_no}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" /> {data.member_count} सदस्य
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
          <div className="bg-background p-1 rounded-lg shadow-lg border flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleZoom(0.1)}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleZoom(-0.1)}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetView}
              title="Reset View"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-background px-2 py-1 rounded text-xs text-center border">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-background/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border text-[10px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> पुरुष
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" /> महिला
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />{" "}
              अनुमानित
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 border-2 border-primary rounded-sm" />{" "}
              मुखिया
            </div>
          </div>
        </div>

        {/* Close Button (if modal) */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-8 w-8 bg-background/80"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Draggable Canvas */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-hidden relative",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center top",
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            className="min-h-full min-w-full flex items-start justify-center pt-20 pb-20"
          >
            <TreeNode node={data.head} />
          </div>
        </div>
      </div>
    </div>
  );
}
