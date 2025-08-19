"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Building2, Building, FolderOpen, Network, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompanyTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  const basePath = `/${workspaceSlug}/${companySlug}/companies/${companyId}`;

  const tabs = [
    {
      key: "details",
      label: "Şirket Detayları",
      shortLabel: "Şirket Bilgileri",
      icon: Building2,
      href: basePath,
      isActive: !pathname.includes(`${basePath}/departments`) && 
                !pathname.includes(`${basePath}/files`) && 
                !pathname.includes(`${basePath}/org-chart`) &&
                !pathname.includes(`${basePath}/locations`)
    },
    {
      key: "departments",
      label: "Departman Yönetimi",
      shortLabel: "Departmanlar",
      icon: Building,
      href: `${basePath}/departments`,
      isActive: pathname.includes(`${basePath}/departments`)
    },
    {
      key: "locations",
      label: "Lokasyon Yönetimi",
      shortLabel: "Lokasyonlar",
      icon: MapPin,
      href: `${basePath}/locations`,
      isActive: pathname.includes(`${basePath}/locations`)
    },
    {
      key: "org-chart",
      label: "Organizasyon Şeması",
      shortLabel: "Organizasyon",
      icon: Network,
      href: `${basePath}/org-chart`,
      isActive: pathname.includes(`${basePath}/org-chart`)
    },
    {
      key: "files",
      label: "Dosya Yönetimi",
      shortLabel: "Dosyalar",
      icon: FolderOpen,
      href: `${basePath}/files`,
      isActive: pathname.includes(`${basePath}/files`)
    },
  ];

  return (
    <div className={cn("flex items-center w-full mt-4", className)}>
      {/* ERP-style underlined tabs with no container borders */}
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
                  style={{ outline: 'none', boxShadow: 'none' }}
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

export default CompanyTabs;


