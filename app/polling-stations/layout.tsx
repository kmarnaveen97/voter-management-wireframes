"use client";

import type React from "react";
import { ListProvider } from "@/contexts/list-context";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

/**
 * Polling Stations Page Layout (legacy route)
 * Primary route: /voters-management/polling-stations
 * This layout provides necessary context providers for standalone access
 */
export default function PollingStationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <ListProvider>
        <div className="flex min-h-screen bg-background">
          <main className="flex-1 p-6">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </ListProvider>
    </QueryProvider>
  );
}
