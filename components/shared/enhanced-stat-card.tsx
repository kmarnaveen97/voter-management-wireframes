"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export interface EnhancedStatCardProps {
  /**
   * Icon to display
   */
  icon: LucideIcon;

  /**
   * Card title/label
   */
  title: string;

  /**
   * Main value to display
   */
  value: string | number;

  /**
   * Optional description text below the value
   */
  description?: string;

  /**
   * Size variant
   */
  variant?: "default" | "compact" | "large";

  /**
   * Optional link - makes the card clickable
   */
  href?: string;

  /**
   * Trend indicator
   */
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };

  /**
   * Progress/percentage indicator
   */
  percentage?: {
    value: number;
    total: number;
    showBar?: boolean;
  };

  /**
   * Custom icon color class
   * @default "text-muted-foreground"
   */
  iconClassName?: string;

  /**
   * Custom value color class
   */
  valueClassName?: string;

  /**
   * Custom className for the card
   */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EnhancedStatCard({
  icon: Icon,
  title,
  value,
  description,
  variant = "default",
  href,
  trend,
  percentage,
  iconClassName = "text-muted-foreground",
  valueClassName,
  className,
}: EnhancedStatCardProps) {
  // Calculate percentage if provided
  const percentValue = percentage
    ? Math.round((percentage.value / percentage.total) * 100)
    : null;

  // Trend color
  const trendColor =
    trend?.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : trend?.direction === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  // Trend arrow
  const trendArrow =
    trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  // Size classes
  const sizeClasses = {
    compact: {
      card: "p-4",
      icon: "h-4 w-4",
      title: "text-xs",
      value: "text-xl",
      description: "text-xs",
    },
    default: {
      card: "p-6",
      icon: "h-5 w-5",
      title: "text-sm",
      value: "text-2xl",
      description: "text-xs",
    },
    large: {
      card: "p-8",
      icon: "h-6 w-6",
      title: "text-base",
      value: "text-4xl",
      description: "text-sm",
    },
  }[variant];

  const content = (
    <>
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          variant === "compact" && "pb-1"
        )}
      >
        <CardTitle className={cn("font-medium", sizeClasses.title)}>
          {title}
        </CardTitle>
        <Icon className={cn(sizeClasses.icon, iconClassName)} />
      </CardHeader>
      <CardContent className={variant === "compact" ? "pt-0" : undefined}>
        <div className="flex items-baseline gap-2">
          <div className={cn("font-bold", sizeClasses.value, valueClassName)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {trend && (
            <span className={cn("text-xs font-medium", trendColor)}>
              {trendArrow} {Math.abs(trend.value)}%
              {trend.label && (
                <span className="ml-1 text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Percentage bar */}
        {percentage?.showBar && percentValue !== null && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {percentage.value.toLocaleString()} /{" "}
                {percentage.total.toLocaleString()}
              </span>
              <span>{percentValue}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(percentValue, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className={cn(
              "text-muted-foreground mt-1",
              sizeClasses.description
            )}
          >
            {description}
          </p>
        )}

        {/* Simple percentage (no bar) */}
        {percentage && !percentage.showBar && percentValue !== null && (
          <p
            className={cn(
              "text-muted-foreground mt-1",
              sizeClasses.description
            )}
          >
            {percentValue}% of {percentage.total.toLocaleString()}
          </p>
        )}
      </CardContent>
    </>
  );

  // Wrap in Link if href provided
  if (href) {
    return (
      <Link href={href} className="block">
        <Card
          className={cn(
            "transition-colors hover:bg-muted/50 cursor-pointer",
            className
          )}
        >
          {content}
        </Card>
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}
