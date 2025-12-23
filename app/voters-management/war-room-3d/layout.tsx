"use client";

import { ListGuard } from "@/components/guards/list-guard";
import { CandidateGuard } from "@/components/guards/candidate-guard";

export default function WarRoom3DLayout({
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
