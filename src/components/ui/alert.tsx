import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border border-border/50 px-6 py-4 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-4 gap-y-1 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-card/60 text-card-foreground",
        destructive:
          "text-destructive bg-red-50/80 border-red-200/60 dark:bg-red-950/20 dark:border-red-800/40 [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success:
          "text-green-800 bg-green-50/80 border-green-200/60 dark:bg-green-950/20 dark:border-green-800/40 dark:text-green-200 [&>svg]:text-current *:data-[slot=alert-description]:text-green-700/90 dark:*:data-[slot=alert-description]:text-green-200/90",
        warning:
          "text-amber-800 bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-200 [&>svg]:text-current *:data-[slot=alert-description]:text-amber-700/90 dark:*:data-[slot=alert-description]:text-amber-200/90",
        info:
          "text-blue-800 bg-blue-50/80 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-200 [&>svg]:text-current *:data-[slot=alert-description]:text-blue-700/90 dark:*:data-[slot=alert-description]:text-blue-200/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground/80 col-start-2 grid justify-items-start gap-1.5 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
