"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ChevronRight, ChevronLeft, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import ExampleModal from "@/components/shared/example-modal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// This is a mock of your 70+ routes
// You should replace this with your actual routes
const menuItems = [
  {
    id: "realistic_photo",
    label: "realistic_photo",
    path: "/generation/basic",
  },
  {
    id: "studio_portrait",
    label: "studio_portrait",
    path: "/generation/studio-portrait",
  },
  {
    id: "professional_portrait",
    label: "professional_portrait",
    path: "/generation/professional-portrait",
  },
  {
    id: "id_photo_normal",
    label: "id_photo_normal",
    path: "/generation/id-photo-normal",
  },
  {
    id: "black_and_white_portrait",
    label: "black_and_white_portrait",
    path: "/generation/black-and-white-portrait",
  },
  {
    id: "fashion_portrait",
    label: "fashion_portrait",
    path: "/generation/fashion-portrait",
  },
  {
    id: "museum_lost",
    label: "museum_lost",
    path: "/generation/museum-lost",
  },
  {
    id: "comic_portrait",
    label: "comic_portrait",
    path: "/generation/comic-portrait",
  },
  {
    id: "light-painting-portrait",
    label: "light-painting-portrait",
    path: "/generation/light-painting-portrait",
  },
  {
    id: "hair-style",
    label: "hair-style",
    path: "/generation/hair-style",
  },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("sidebar");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isNavigatingRef = useRef<boolean>(false);

  // Check if viewport is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Function to find scrollable element
  const findScrollableElement = () => {
    if (!sidebarRef.current) return null;
    return sidebarRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
  };

  // Preserve scroll position when pathname changes
  useEffect(() => {
    const restoreScrollPosition = () => {
      setTimeout(() => {
        const scrollableElement = findScrollableElement();
        if (scrollableElement) {
          scrollableElement.scrollTop = scrollPosRef.current;
          isNavigatingRef.current = false;
        }
      }, 200); // Ensure enough time for rendering
    };

    restoreScrollPosition();
  }, [pathname]);

  // Initial load - get saved position
  useEffect(() => {
    const savedPosition = localStorage.getItem("sidebarScrollPosition");
    if (savedPosition) {
      scrollPosRef.current = parseInt(savedPosition, 10);
    }
  }, []);

  // Custom Link component that sets navigation flag
  const NavLink = ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => {
    const handleClick = () => {
      isNavigatingRef.current = true;
      // Save current scroll position right before navigation
      const scrollableElement = findScrollableElement();
      if (scrollableElement) {
        scrollPosRef.current = scrollableElement.scrollTop;
        localStorage.setItem(
          "sidebarScrollPosition",
          scrollPosRef.current.toString()
        );
      }
      // Call original onClick if provided
      if (onClick) onClick();
    };

    // Convert string href to object if it's a string
    const linkHref = typeof href === "string" ? { pathname: href } : href;

    return (
      <Link href={linkHref} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Function to check if a route is active, considering locale in the URL
  const isRouteActive = (routePath: string) => {
    return pathname.endsWith(routePath);
  };

  // Mobile menu with drawer
  const MobileMenu = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 md:hidden"
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
        <SheetHeader className="border-b p-4">
          {/* <SheetTitle>{t("menu")}</SheetTitle> */}
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="p-2 pb-10">
            <NavLink
              href={`/${locale}/`}
              onClick={() => setIsOpen(false)}
              className="mb-3 flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Home size={16} className="mr-2" />
              <span className="flex-grow text-left">{t("home")}</span>
            </NavLink>
            <div className="my-2 border-t"></div>
            {menuItems.map((item) => {
              const isActive = isRouteActive(item.path);
              return (
                <NavLink
                  key={item.id}
                  href={`/${locale}${item.path}`}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "mb-1 flex w-full items-center rounded-md px-3 py-2 text-sm",
                    "transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-primary/10 text-primary" : "text-foreground"
                  )}
                >
                  <span className="flex-grow text-left">{t(item.label)}</span>
                  {isActive && <Check size={16} className="text-primary" />}
                </NavLink>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div
      className={cn(
        "relative hidden h-full flex-col border-r bg-background transition-all duration-300 md:flex",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )}
      ref={sidebarRef}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-4 top-20 z-10 h-8 w-8 rounded-full border bg-background shadow-sm"
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </Button>

      <ScrollArea className="h-[calc(100vh-200px)] pt-2" scrollHideDelay={0}>
        <div className="p-2">
          {isExpanded ? (
            <NavLink
              href={`/${locale}/`}
              className="mb-3 flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Home size={16} className="mr-2" />
              <span className="flex-grow text-left">{t("home")}</span>
            </NavLink>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    href={`/${locale}/`}
                    className="mb-3 flex w-full items-center justify-center rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Home size={20} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t("home")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="my-2 border-t"></div>
          {menuItems.map((item) => {
            const isActive = isRouteActive(item.path);

            return isExpanded ? (
              <NavLink
                key={item.id}
                href={`/${locale}${item.path}`}
                className={cn(
                  "mb-1 flex w-full items-center rounded-md px-3 py-2 text-sm",
                  "transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                <span className="flex-grow text-left">{t(item.label)}</span>
                {isActive && <Check size={16} className="text-primary" />}
              </NavLink>
            ) : (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      href={`/${locale}${item.path}`}
                      className={cn(
                        "mb-1 flex w-full items-center justify-center rounded-md p-2",
                        "transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                    >
                      <span className="text-xs">{t(item.label).charAt(0)}</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{t(item.label)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <ExampleModal />
      </ScrollArea>
    </div>
  );

  return (
    <>
      <MobileMenu />
      <DesktopSidebar />
    </>
  );
};

export default Sidebar;
