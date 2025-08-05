import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

const pageHeaderVariants = cva(
  "flex flex-col gap-3 pb-4",
  {
    variants: {
      variant: {
        default: "border-b border-border",
        minimal: "",
        elevated: "bg-card rounded-lg border p-4 shadow-sm",
      },
      size: {
        sm: "gap-2 pb-3",
        default: "gap-3 pb-4",
        lg: "gap-4 pb-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps extends VariantProps<typeof pageHeaderVariants> {
  className?: string
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: {
    label: string
    variant?: "default" | "secondary" | "success" | "warning" | "critical" | "info" | "attention" | "new" | "read-only"
  }
  actions?: React.ReactNode
  children?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, variant, size, title, description, breadcrumbs, badge, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(pageHeaderVariants({ variant, size }), className)}
        {...props}
      >
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Header Content */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Title and Badge */}
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-xl font-semibold text-foreground truncate cursor-help">
                      {title}
                    </h1>
                  </TooltipTrigger>
                  {description && (
                    <TooltipContent>
                      <p>{description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {badge && (
                <Badge variant={badge.variant} size="sm">
                  {badge.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Additional Content */}
        {children}
      </div>
    )
  }
)

PageHeader.displayName = "PageHeader"

// Compound components for better composition
const PageHeaderActions = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

PageHeaderActions.displayName = "PageHeaderActions"

const PageHeaderContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-4 space-y-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

PageHeaderContent.displayName = "PageHeaderContent"

export { PageHeader, PageHeaderActions, PageHeaderContent, pageHeaderVariants }
export type { PageHeaderProps, BreadcrumbItem }