import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader, PageHeaderActions, PageHeaderContent } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  variant?: "default" | "card" | "header" | "minimal" | "sectioned";
  // Page header props
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "success" | "warning" | "critical" | "info" | "attention" | "new" | "read-only";
  };
  // Card props
  cardVariant?: "default" | "subdued" | "sectioned" | "elevated" | "outlined" | "glass";
  padding?: "none" | "sm" | "default" | "lg" | "xl";
  fullWidth?: boolean;
}

/**
 * Enhanced PageLayout component that provides various layout patterns using our UI components.
 * Supports different variants for different page types and use cases.
 */
export function PageLayout({ 
  children, 
  className = "", 
  containerClassName = "",
  variant = "default",
  title,
  description,
  actions,
  breadcrumbs,
  badge,
  cardVariant = "default",
  padding = "default",
  fullWidth = true
}: PageLayoutProps) {
  
  const renderContent = () => {
    switch (variant) {
      case "card":
        return (
          <div className={cn("p-4 md:p-6 lg:p-8", containerClassName)}>
            <Card 
              variant={cardVariant} 
              padding={padding}
              fullWidth={fullWidth}
              className={className}
            >
              <CardContent>
                {children}
              </CardContent>
            </Card>
          </div>
        );
      
      case "header":
        if (!title) {
          console.warn("PageLayout: title is required when using 'header' variant");
          return children;
        }
        return (
          <div className={cn("space-y-6", containerClassName)}>
            <PageHeader
              title={title}
              description={description}
              breadcrumbs={breadcrumbs}
              badge={badge}
              actions={actions}
              className="px-4 md:px-6 lg:px-8"
            />
            <div className={cn("px-4 md:px-6 lg:px-8", className)}>
              {children}
            </div>
          </div>
        );
      
      case "sectioned":
        return (
          <div className={cn("space-y-6 p-4 md:p-6 lg:p-8", containerClassName)}>
            {title && (
              <>
                <PageHeader
                  title={title}
                  description={description}
                  breadcrumbs={breadcrumbs}
                  badge={badge}
                  actions={actions}
                  variant="minimal"
                />
                <Separator />
              </>
            )}
            <Card variant="sectioned" fullWidth={fullWidth} className={className}>
              <CardContent className="divide-y divide-border/50">
                {children}
              </CardContent>
            </Card>
          </div>
        );
      
      case "minimal":
        return (
          <div className={cn("p-2 md:p-4", containerClassName)}>
            <div className={className}>
              {children}
            </div>
          </div>
        );
      
      default:
        // Default behavior - just custom spacing with optional container
        return (
          <div className={cn(containerClassName)}>
            <div className={cn(className)}>
              {children}
            </div>
          </div>
        );
    }
  };

  return renderContent();
}

// Compound components for better composition
export const PageLayoutSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  }
>(({ className, title, description, actions, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
});

PageLayoutSection.displayName = "PageLayoutSection"; 