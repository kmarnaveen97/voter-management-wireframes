"use client";

import type React from "react";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ListProvider } from "@/contexts/list-context";
import { QueryProvider } from "@/lib/query-client";
import { Sidebar } from "@/components/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

function WebsiteManagementContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default function WebsiteManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <SidebarProvider>
        <ListProvider>
          <WebsiteManagementContent>{children}</WebsiteManagementContent>
        </ListProvider>
      </SidebarProvider>
    </QueryProvider>
  );
}
