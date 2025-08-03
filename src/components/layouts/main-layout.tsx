import React from "react";
import { SiteHeader } from "./site-header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {children}
      </div>
      </div>

     
    </div>
  );
} 