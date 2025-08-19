"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface WorkspaceContextResponse {
  workspace: { id: string; name: string; slug: string };
  currentCompany?: { id: string; name: string; slug: string };
  companies: { id: string; name: string; slug: string }[];
}

export default function SettingsTabs({ className }: { className?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const { data } = useQuery<WorkspaceContextResponse>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`);
      if (!res.ok) throw new Error("Failed to load workspace context");
      return res.json();
    }
  });

  const isCompanySettings = pathname.includes(`/${workspaceSlug}/${companySlug}/settings/company`);

  const tabs = [
    {
      key: "workspace",
      label: "Workspace",
      href: `/${workspaceSlug}/${companySlug}/settings`,
      isActive: !isCompanySettings && (pathname.includes(`/${workspaceSlug}/${companySlug}/settings`) || pathname.includes(`/${workspaceSlug}/${companySlug}/settings/workspace`)),
    },
    ...(data?.companies || []).map((c) => ({
      key: c.id,
      label: c.name,
      href: `/${workspaceSlug}/${c.slug}/settings/company?companyId=${c.id}`,
      isActive: pathname.includes(`/${workspaceSlug}/${c.slug}/settings/company`),
    })),
  ];

  return (
    <div className={cn("flex items-center w-full mt-2", className)}>
      <nav className="flex items-center w-full border-b border-border/50">
        <div className="flex items-center">
          {tabs.map((tab, i) => (
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
                style={{ outline: "none", boxShadow: "none" }}
                onFocus={(e) => (e.target as HTMLElement).blur()}
              >
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
              </Link>
              {i < tabs.length - 1 && (
                <div className="mx-1 h-5 w-px bg-border/40" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>
    </div>
  );
}


