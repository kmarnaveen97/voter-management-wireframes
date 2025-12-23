"use client";

import { MultipleListsGuard } from "@/components/guards/multiple-lists-guard";

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MultipleListsGuard>{children}</MultipleListsGuard>;
}
