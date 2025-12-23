"use client";

import { ListGuard } from "@/components/guards/list-guard";

export default function ElectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ListGuard>{children}</ListGuard>;
}
