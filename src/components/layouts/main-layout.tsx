import React from "react";
import { SiteHeader } from "./site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "card" | "minimal";
  headerVariant?: "default" | "minimal" | "elevated";
  showHeaderDescription?: boolean;
}

export function MainLayout({ 
  children, 
  className,
  contentClassName,
  variant = "default",
  headerVariant = "default",
  showHeaderDescription = false
}: MainLayoutProps) {
  const renderContent = () => {
    switch (variant) {
      case "card":
        return (
          <Card className={cn("flex-1 m-4 md:m-6", contentClassName)} variant="subdued">
            <CardContent className="p-6 md:p-8">
              {children}
            </CardContent>
          </Card>
        );
      
      case "minimal":
        return (
          <div className={cn("flex-1 p-2 md:p-4", contentClassName)}>
            {children}
          </div>
        );
      
      default:
        return (
          <div className={cn(
            "@container/main flex flex-1 flex-col",
            contentClassName
          )}>
            <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      <SiteHeader 
        variant={headerVariant} 
        showDescription={showHeaderDescription}
      />
      {headerVariant === "elevated" && <Separator />}
      {renderContent()}
    </div>
  );
} 