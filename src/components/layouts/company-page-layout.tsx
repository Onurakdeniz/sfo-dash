"use client";

import React from "react";
import { PageWrapper } from "@/components/page-wrapper";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isLast?: boolean;
}

interface CompanyPageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function CompanyPageLayout({
  title,
  description,
  breadcrumbs = [],
  actions,
  tabs,
  children,
  className,
}: CompanyPageLayoutProps) {
  return (
    <PageWrapper
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={tabs}
      className={className}
    >
      {children}
    </PageWrapper>
  );
}


