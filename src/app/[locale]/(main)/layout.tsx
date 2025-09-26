"use client";

import AppFooter from "@/components/global/app-footer";
import HomeHeader from "@/components/home/header";
import { useFromMulerun } from "@/hooks/useMulerun";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isMulerun } = useFromMulerun();
  return (
    <div className="flex min-h-screen flex-col">
      {!isMulerun && <HomeHeader className="mb-4 mt-6 h-12" />}
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <div className="grid flex-1">
          <div
            className={cn(
              "relative mx-auto flex h-auto w-full items-start rounded-lg border bg-background py-4",
              isMulerun ? "w-full" : "container max-w-[1440px]"
            )}
          >
            {children}
          </div>
        </div>
      </main>
      {!isMulerun && <AppFooter />}
    </div>
  );
}
