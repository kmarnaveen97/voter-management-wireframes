"use client";

/**
 * ListGuard - Redirects to Import Data page if no list exists
 *
 * Use this in layouts for pages that require at least one list to function (e.g., Elections).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useListContext } from "@/contexts/list-context";
import { Loader2 } from "lucide-react";

interface ListGuardProps {
  children: React.ReactNode;
}

export function ListGuard({ children }: ListGuardProps) {
  const router = useRouter();
  const { availableLists, isLoading } = useListContext();

  const hasList = (availableLists?.length ?? 0) > 0;

  useEffect(() => {
    // Wait for data to load before redirecting
    if (isLoading) return;

    // If no list exists, redirect to import data page
    if (!hasList) {
      router.replace("/voters-management/upload");
    }
  }, [hasList, isLoading, router]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no list, show nothing (redirect is happening)
  if (!hasList) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Redirecting to Import Data...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
