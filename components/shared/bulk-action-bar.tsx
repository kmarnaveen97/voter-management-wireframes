"use client";

import { X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface BulkAction {
  /**
   * Action label
   */
  label: string;

  /**
   * Action icon
   */
  icon?: LucideIcon;

  /**
   * Action callback
   */
  onClick: () => void;

  /**
   * Button variant
   */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";

  /**
   * Whether action is disabled
   */
  disabled?: boolean;

  /**
   * Loading state for this action
   */
  isLoading?: boolean;
}

export interface BulkActionBarProps {
  /**
   * Number of selected items
   */
  selectedCount: number;

  /**
   * Callback to clear selection
   */
  onClearSelection: () => void;

  /**
   * Whether any action is in progress
   */
  isLoading?: boolean;

  /**
   * Primary actions (shown as buttons)
   */
  actions?: BulkAction[];

  /**
   * Secondary actions (shown in dropdown)
   */
  dropdownActions?: BulkAction[];

  /**
   * Bar position
   * @default "bottom"
   */
  position?: "bottom" | "top";

  /**
   * Custom className
   */
  className?: string;

  /**
   * Label for items (e.g., "voters", "families")
   * @default "items"
   */
  itemLabel?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  isLoading = false,
  actions = [],
  dropdownActions = [],
  position = "bottom",
  className,
  itemLabel = "items",
}: BulkActionBarProps) {
  // Don't render if nothing is selected
  if (selectedCount === 0) return null;

  const positionClasses = {
    bottom: "fixed bottom-6 left-1/2 -translate-x-1/2",
    top: "fixed top-20 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "z-50 flex items-center gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60",
        positionClasses[position],
        className
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount.toLocaleString()} {itemLabel} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClearSelection}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Divider */}
      {(actions.length > 0 || dropdownActions.length > 0) && (
        <div className="h-6 w-px bg-border" />
      )}

      {/* Primary actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || isLoading || action.isLoading}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "mr-1.5 h-4 w-4",
                      action.isLoading && "animate-spin"
                    )}
                  />
                )}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Dropdown actions */}
      {dropdownActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              More actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {dropdownActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    action.variant === "destructive" &&
                      "text-destructive focus:text-destructive"
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
