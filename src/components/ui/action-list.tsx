import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "./badge"

const actionListVariants = cva(
  "min-w-[200px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "",
        compact: "min-w-[160px] p-0.5",
        wide: "min-w-[240px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const actionListItemVariants = cva(
  "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        destructive: "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300",
        success: "text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300",
        warning: "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ActionListProps extends VariantProps<typeof actionListVariants> {
  className?: string
  children: React.ReactNode
}

const ActionList = React.forwardRef<HTMLDivElement, ActionListProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(actionListVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ActionList.displayName = "ActionList"

interface ActionListItemProps extends VariantProps<typeof actionListItemVariants> {
  className?: string
  children: React.ReactNode
  disabled?: boolean
  icon?: React.ReactNode
  suffix?: React.ReactNode
  badge?: {
    label: string
    variant?: "default" | "secondary" | "success" | "warning" | "critical" | "info"
  }
  onClick?: () => void
}

const ActionListItem = React.forwardRef<HTMLDivElement, ActionListItemProps>(
  ({ className, variant, size, children, disabled, icon, suffix, badge, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(actionListItemVariants({ variant, size }), className)}
        data-disabled={disabled}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {icon && (
          <div className="mr-3 flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {badge && (
          <Badge variant={badge.variant} size="sm" className="ml-2 flex-shrink-0">
            {badge.label}
          </Badge>
        )}
        {suffix && (
          <div className="ml-3 flex-shrink-0 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
            {suffix}
          </div>
        )}
      </div>
    )
  }
)

ActionListItem.displayName = "ActionListItem"

const ActionListSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("my-1 h-px bg-border", className)}
        {...props}
      />
    )
  }
)

ActionListSeparator.displayName = "ActionListSeparator"

const ActionListSection = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & {
  title?: string
}>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {title && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </div>
        )}
        {children}
      </div>
    )
  }
)

ActionListSection.displayName = "ActionListSection"

export {
  ActionList,
  ActionListItem,
  ActionListSeparator,
  ActionListSection,
  actionListVariants,
  actionListItemVariants,
}

export type { ActionListProps, ActionListItemProps }