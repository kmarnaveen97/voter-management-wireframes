"use client";

import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { ListProvider } from "@/contexts/list-context";
import { UploadProvider } from "@/contexts/upload-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { MainContent } from "@/components/main-content";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";
import { PageErrorBoundary } from "@/components/shared";
import { CommandPaletteProvider } from "@/components/command-palette";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function VotersManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <ListProvider>
        <UploadProvider>
          <SidebarProvider>
            <CommandPaletteProvider>
              <TooltipProvider>
                <Sidebar />
                <MainContent>
                  <PageErrorBoundary pageName="Voters Management">
                    {children}
                  </PageErrorBoundary>
                </MainContent>
                <OnboardingDialog />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </CommandPaletteProvider>
          </SidebarProvider>
        </UploadProvider>
      </ListProvider>
    </QueryProvider>
  );
}
