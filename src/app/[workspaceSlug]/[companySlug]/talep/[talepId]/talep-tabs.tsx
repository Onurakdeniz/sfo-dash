"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FileText, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function TalepTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const talepId = params.talepId as string;

  const basePath = `/${workspaceSlug}/${companySlug}/talep/${talepId}`;

  const tabs = [
    {
      key: "detay",
      label: "Talep Bilgileri",
      shortLabel: "Detay",
      icon: FileText,
      href: `${basePath}/detay`,
      isActive: pathname.endsWith("/detay"),
    },
    {
      key: "aksiyonlar",
      label: "Aksiyonlar",
      shortLabel: "Aksiyonlar",
      icon: Zap,
      href: `${basePath}/aksiyonlar`,
      isActive: pathname.endsWith("/aksiyonlar"),
    },
    {
      key: "aktiviteler",
      label: "Aktiviteler",
      shortLabel: "Aktiviteler",
      icon: Activity,
      href: `${basePath}/aktiviteler`,
      isActive: pathname.endsWith("/aktiviteler"),
    },
  ];

  return (
    <div className={cn("flex items-center w-full mt-4", className)}>
      <nav className="flex items-center w-full border-b border-border/50">
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
                  <span className="font-medium whitespace-nowrap">{tab.shortLabel}</span>
                </Link>
                {i < tabs.length - 1 && (
                  <div className="mx-1 h-5 w-px bg-border/40" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default TalepTabs;



