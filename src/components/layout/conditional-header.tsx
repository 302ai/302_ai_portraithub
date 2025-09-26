"use client";

import { useHideMulerunElements } from "@/hooks/global/use-hide-mulerun-elements";
import AppHeader from "@/components/global/app-header";

export default function ConditionalHeader() {
  const hideElements = useHideMulerunElements();

  if (hideElements) {
    return null;
  }

  return <AppHeader />;
}
