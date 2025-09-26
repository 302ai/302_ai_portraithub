"use client";

import { usePathname } from "next/navigation";

export function useHideMulerunElements() {
  const pathname = usePathname();
  return pathname.includes("mulerun");
}
