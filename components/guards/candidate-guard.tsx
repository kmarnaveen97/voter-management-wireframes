"use client";

/**
 * CandidateGuard - Redirects to Elections page if no candidate exists for the current list
 *
 * Use this in layouts for pages that require a candidate to function.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useListContext } from "@/contexts/list-context";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface CandidateGuardProps {
  children: React.ReactNode;
}

export function CandidateGuard({ children }: CandidateGuardProps) {
  const router = useRouter();
  const { selectedListId, isLoading: listLoading } = useListContext();

  // Fetch candidates for the current list
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ["candidates", selectedListId],
    queryFn: () => api.getCandidates({ list_id: selectedListId }),
    enabled: !!selectedListId,
    staleTime: 60 * 1000,
  });

  const hasCandidate = (candidatesData?.candidates?.length ?? 0) > 0;
  const isLoading = listLoading || candidatesLoading;

  useEffect(() => {
    // Wait for data to load before redirecting
    if (isLoading) return;

    // If no candidate exists, redirect to elections page
    if (!hasCandidate) {
      router.replace("/voters-management/elections");
    }
  }, [hasCandidate, isLoading, router]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no candidate, show nothing (redirect is happening)
  if (!hasCandidate) {
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
