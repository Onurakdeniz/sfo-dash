"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface WorkspaceContextResponse {
  workspace: { id: string; name: string; slug: string };
  currentCompany?: { id: string; name: string; fullName?: string; slug: string };
  companies: { id: string; name: string; fullName?: string; slug: string }[];
}

export function SystemScopeTabs({ className }: { className?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Context is no longer needed for tabs as we only show workspace-level tab

  // Derive suffix after /[workspaceSlug]/[companySlug]
  const basePrefix = `/${workspaceSlug}/${companySlug}`;
  const restOfPath = pathname.startsWith(basePrefix)
    ? pathname.slice(basePrefix.length)
    : "";

  const isWorkspaceScope = true;

  const tabs = [
    {
      key: "workspace",
      label: "Workspace",
      href: `/${workspaceSlug}/${companySlug}${restOfPath}?scope=workspace`,
      isActive: isWorkspaceScope,
    },
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

export default SystemScopeTabs;


