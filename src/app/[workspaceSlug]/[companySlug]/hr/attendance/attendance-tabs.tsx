"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function AttendanceTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const basePath = `/${workspaceSlug}/${companySlug}/hr/attendance`;

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollIndicators();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateScrollIndicators();
    el.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => updateScrollIndicators();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollByAmount = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const tabs = [
    {
      key: "attendance",
      label: "Giriş-Çıkışlar",
      icon: Clock,
      href: basePath,
      isActive: !pathname.includes(`${basePath}/profiles`),
    },
    {
      key: "profiles",
      label: "Mesai Profilleri",
      icon: CalendarDays,
      href: `${basePath}/profiles`,
      isActive: pathname.includes(`${basePath}/profiles`),
    },
  ] as const;

  return (
    <div className={cn("relative w-full mt-4", className)}>
      <nav className="relative w-full border-b border-border/50 overflow-hidden">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Sola kaydır"
            onClick={() => scrollByAmount(-240)}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md",
              "bg-background/80 border border-border shadow-sm hover:bg-background"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Sağa kaydır"
            onClick={() => scrollByAmount(240)}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md",
              "bg-background/80 border border-border shadow-sm hover:bg-background"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background to-transparent" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background to-transparent" />
        )}
        <div
          ref={scrollerRef}
          className={cn(
            "flex items-center w-full overflow-x-auto scroll-smooth",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          <div className="flex items-center">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <React.Fragment key={tab.key}>
                  <Link
                    href={tab.href}
                    className={cn(
                      "relative inline-flex items-center gap-2 px-4 first:pl-0 py-2 text-sm font-medium transition-colors",
                      "border-b-2",
                      tab.isActive
                        ? "text-foreground border-primary"
                        : "text-muted-foreground/70 border-transparent hover:text-foreground/90 hover:border-border/60"
                    )}
                    title={tab.label}
                    style={{ outline: "none", boxShadow: "none" }}
                    onFocus={(e) => (e.target as HTMLElement).blur()}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap">{tab.label}</span>
                  </Link>
                  {i < tabs.length - 1 && (
                    <div className="mx-1 h-5 w-px bg-border/40" aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}


