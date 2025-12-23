"use client";

import type React from "react";
import { ListSelector } from "./list-selector";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showListSelector?: boolean;
  selectedListId?: number;
  onListChange?: (listId: number) => void;
}

export function PageHeader({
  title,
  description,
  children,
  showListSelector = false,
  selectedListId,
  onListChange,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {showListSelector && onListChange && (
          <ListSelector value={selectedListId} onChange={onListChange} />
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {children}
        </div>
      )}
    </div>
  );
}
