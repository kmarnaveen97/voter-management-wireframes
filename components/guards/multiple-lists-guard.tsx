"use client";

/**
 * MultipleListsGuard - Redirects to Elections page if less than 2 lists exist
 *
 * Use this in layouts for pages that require multiple lists to function (e.g., Compare Lists).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useListContext } from "@/contexts/list-context";
import { Loader2 } from "lucide-react";

interface MultipleListsGuardProps {
  children: React.ReactNode;
}

export function MultipleListsGuard({ children }: MultipleListsGuardProps) {
  const router = useRouter();
  const { availableLists, isLoading } = useListContext();

  const hasMultipleLists = (availableLists?.length ?? 0) > 1;

  useEffect(() => {
    // Wait for data to load before redirecting
    if (isLoading) return;

    // If not enough lists, redirect to elections page
    if (!hasMultipleLists) {
      router.replace("/voters-management/elections");
    }
  }, [hasMultipleLists, isLoading, router]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not enough lists, show nothing (redirect is happening)
  if (!hasMultipleLists) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Redirecting to Elections...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
