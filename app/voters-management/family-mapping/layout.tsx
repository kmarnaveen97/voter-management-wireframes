"use client";

import { ListGuard } from "@/components/guards/list-guard";
import { CandidateGuard } from "@/components/guards/candidate-guard";

export default function FamilyMappingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ListGuard>
      <CandidateGuard>{children}</CandidateGuard>
    </ListGuard>
  );
}
