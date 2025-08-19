"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IdCard,
  FolderOpen,
  ArrowLeftRight,
  Key,
  Clock,
  CalendarCheck2,
  CalendarDays,
  Bell,
  FileText,
  Package,
  Gavel,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function EmployeeTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;

  const basePath = `/${workspaceSlug}/${companySlug}/hr/employees/${employeeId}`;
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
      key: "profile",
      label: "Personel Bilgileri",
      icon: IdCard,
      href: basePath,
      isActive:
        !pathname.includes(`${basePath}/files`) &&
        !pathname.includes(`${basePath}/position-changes`) &&
        !pathname.includes(`${basePath}/permissions`) &&
        !pathname.includes(`${basePath}/pdks`) &&
        !pathname.includes(`${basePath}/leave-rights`) &&
        !pathname.includes(`${basePath}/leave-requests`) &&
        !pathname.includes(`${basePath}/notifications`) &&
        !pathname.includes(`${basePath}/talepler`) &&
        !pathname.includes(`${basePath}/zimmet`) &&
        !pathname.includes(`${basePath}/icra`) &&
        !pathname.includes(`${basePath}/egitim`),
    },
    {
      key: "files",
      label: "Dosyalar",
      icon: FolderOpen,
      href: `${basePath}/files`,
      isActive: pathname.includes(`${basePath}/files`),
    },
    {
      key: "position-changes",
      label: "Pozisyon Değişiklikleri",
      icon: ArrowLeftRight,
      href: `${basePath}/position-changes`,
      isActive: pathname.includes(`${basePath}/position-changes`),
    },
    {
      key: "permissions",
      label: "Yetkiler",
      icon: Key,
      href: `${basePath}/permissions`,
      isActive: pathname.includes(`${basePath}/permissions`),
    },
    {
      key: "pdks",
      label: "PDKS",
      icon: Clock,
      href: `${basePath}/pdks`,
      isActive: pathname.includes(`${basePath}/pdks`),
    },
    {
      key: "leave-rights",
      label: "İzin Hakları",
      icon: CalendarCheck2,
      href: `${basePath}/leave-rights`,
      isActive: pathname.includes(`${basePath}/leave-rights`),
      disabled: true,
    },
    {
      key: "leave-requests",
      label: "İzin Talepleri",
      icon: CalendarDays,
      href: `${basePath}/leave-requests`,
      isActive: pathname.includes(`${basePath}/leave-requests`),
      disabled: true,
    },
    {
      key: "notifications",
      label: "Bildirimler",
      icon: Bell,
      href: `${basePath}/notifications`,
      isActive: pathname.includes(`${basePath}/notifications`),
      disabled: true,
    },
    {
      key: "talepler",
      label: "Talepler",
      icon: FileText,
      href: `${basePath}/talepler`,
      isActive: pathname.includes(`${basePath}/talepler`),
      disabled: true,
    },
    {
      key: "zimmet",
      label: "Zimmet",
      icon: Package,
      href: `${basePath}/zimmet`,
      isActive: pathname.includes(`${basePath}/zimmet`),
      disabled: true,
    },
    {
      key: "icra",
      label: "İcra",
      icon: Gavel,
      href: `${basePath}/icra`,
      isActive: pathname.includes(`${basePath}/icra`),
      disabled: true,
    },
    {
      key: "egitim",
      label: "Eğitim",
      icon: GraduationCap,
      href: `${basePath}/egitim`,
      isActive: pathname.includes(`${basePath}/egitim`),
      disabled: true,
    },
  ];

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
                  {tab.disabled ? (
                    <div
                      aria-disabled
                      title={tab.label}
                      className={cn(
                        "relative inline-flex items-center gap-2 px-4 first:pl-0 py-2 text-sm font-medium",
                        "border-b-2 text-muted-foreground/50 border-transparent cursor-not-allowed"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">{tab.label}</span>
                    </div>
                  ) : (
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
                  )}
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

export default EmployeeTabs;


