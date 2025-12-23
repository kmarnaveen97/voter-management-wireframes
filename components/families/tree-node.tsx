"use client";

import React from "react";
import { User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeMember } from "@/lib/tree-utils";
import { isFemaleGender } from "@/lib/tree-utils";

interface TreeNodeProps {
  node: TreeMember;
  level?: number;
  onNodeClick: (node: TreeMember) => void;
}

/**
 * Tree Node Component - Renders a single node in a family tree
 * Used by both family-mapping and war-room pages
 */
export function TreeNode({ node, level = 0, onNodeClick }: TreeNodeProps) {
  const isFemale = isFemaleGender(node.gender);
  const hasSpouse = !!node.spouse;

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        // Add extra margin for nodes with spouses to prevent overlap
        hasSpouse ? "mx-12" : "mx-6"
      )}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick(node);
        }}
        className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1 z-10"
      >
        {/* Connection Line (Top) */}
        {level > 0 && <div className="h-6 w-0.5 bg-border -mt-6 mb-2"></div>}

        {/* Card */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border-2 min-w-[180px] bg-card shadow-sm hover:shadow-md transition-all",
            node.isVirtual
              ? "border-dashed border-muted-foreground/30 bg-muted/50"
              : "border-border",
            level === 0 &&
              !node.isVirtual &&
              "border-primary ring-4 ring-primary/10"
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
              node.isVirtual
                ? "bg-muted-foreground"
                : isFemale
                ? "bg-pink-500"
                : "bg-primary"
            )}
          >
            {node.isVirtual ? "P" : <User size={18} />}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span
              className={cn(
                "font-bold text-sm",
                node.isVirtual
                  ? "text-muted-foreground italic"
                  : "text-foreground"
              )}
            >
              {node.name}
            </span>
            {!node.isVirtual && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{node.age} वर्ष</span>
                {node.relType && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      node.relType === "पत्नी"
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {node.relType}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Spouse Card (Attached) */}
        {node.spouse && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.spouse!);
            }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-4 flex items-center group/spouse cursor-pointer"
          >
            {/* Connector */}
            <div className="w-4 h-0.5 bg-pink-300"></div>
            <div className="bg-card border border-pink-200 dark:border-pink-800 p-2 rounded-lg shadow-sm flex items-center gap-2 hover:border-pink-400 hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Heart size={14} fill="currentColor" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground">
                  {node.spouse.name}
                </div>
                <div className="text-muted-foreground">
                  {node.spouse.age}Y • {node.spouse.relType || "पत्नी"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-2">
          {/* Vertical line down from parent */}
          <div className="h-8 w-0.5 bg-border"></div>

          <div className="flex items-start relative pt-6 gap-4">
            {/* Horizontal Bar for multiple children */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-border"
                style={{ width: `calc(100% - 2rem)` }}
              ></div>
            )}

            {/* Individual Children */}
            {node.children.map((child, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Connection from horizontal bar to child top */}
                <div className="h-6 w-0.5 bg-border absolute top-0"></div>
                <div className="pt-6">
                  <TreeNode
                    node={child}
                    level={level + 1}
                    onNodeClick={onNodeClick}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TreeNode;
