"use client";

import {
  Search,
  RefreshCcw,
  Download,
  Printer,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface DataTableToolbarProps {
  /**
   * Search input value
   */
  searchValue?: string;

  /**
   * Search input change handler
   */
  onSearchChange?: (value: string) => void;

  /**
   * Placeholder text for search input
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * Refresh data callback
   */
  onRefresh?: () => void;

  /**
   * Export data callback
   */
  onExport?: () => void;

  /**
   * Print callback
   */
  onPrint?: () => void;

  /**
   * Whether refresh is in progress
   */
  isRefreshing?: boolean;

  /**
   * Slot for filter components (dropdowns, chips, etc.)
   */
  filtersSlot?: React.ReactNode;

  /**
   * Slot for additional action buttons
   */
  actionsSlot?: React.ReactNode;

  /**
   * Dropdown menu items for overflow actions
   */
  menuItems?: Array<{
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    separator?: boolean;
  }>;

  /**
   * Hide the search input
   */
  hideSearch?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onRefresh,
  onExport,
  onPrint,
  isRefreshing = false,
  filtersSlot,
  actionsSlot,
  menuItems,
  hideSearch = false,
  className,
}: DataTableToolbarProps) {
  const hasStandardActions = onRefresh || onExport || onPrint;
  const hasMenu = menuItems && menuItems.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Left side: Search + Filters */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        {!hideSearch && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Filters slot */}
        {filtersSlot && (
          <div className="flex flex-wrap items-center gap-2">{filtersSlot}</div>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Custom actions slot */}
        {actionsSlot}

        {/* Standard actions */}
        {hasStandardActions && (
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh"
              >
                <RefreshCcw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
              </Button>
            )}
            {onExport && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                title="Export"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onPrint && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrint}
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Overflow menu */}
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, index) => {
                if (item.separator) {
                  return <DropdownMenuSeparator key={index} />;
                }
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={cn(
                      item.destructive &&
                        "text-destructive focus:text-destructive"
                    )}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
