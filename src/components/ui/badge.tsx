import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground shadow-sm [a&]:hover:bg-primary [a&]:hover:shadow-md",
        secondary:
          "border-transparent bg-secondary/90 text-secondary-foreground shadow-sm [a&]:hover:bg-secondary [a&]:hover:shadow-md",
        destructive:
          "border-transparent bg-destructive/90 text-white shadow-sm [a&]:hover:bg-destructive [a&]:hover:shadow-md focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "text-foreground border-border/60 bg-background/50 shadow-sm [a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:hover:shadow-md",
        // Modern ERP-style variants with enhanced styling
        success:
          "border-transparent bg-green-100/80 text-green-800 shadow-sm dark:bg-green-900/60 dark:text-green-200 [a&]:hover:bg-green-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-green-800/80",
        warning:
          "border-transparent bg-amber-100/80 text-amber-800 shadow-sm dark:bg-amber-900/60 dark:text-amber-200 [a&]:hover:bg-amber-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-amber-800/80",
        critical:
          "border-transparent bg-red-100/80 text-red-800 shadow-sm dark:bg-red-900/60 dark:text-red-200 [a&]:hover:bg-red-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-red-800/80",
        info:
          "border-transparent bg-blue-100/80 text-blue-800 shadow-sm dark:bg-blue-900/60 dark:text-blue-200 [a&]:hover:bg-blue-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-blue-800/80",
        attention:
          "border-transparent bg-purple-100/80 text-purple-800 shadow-sm dark:bg-purple-900/60 dark:text-purple-200 [a&]:hover:bg-purple-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-purple-800/80",
        new:
          "border-transparent bg-teal-100/80 text-teal-800 shadow-sm dark:bg-teal-900/60 dark:text-teal-200 [a&]:hover:bg-teal-200/90 [a&]:hover:shadow-md dark:[a&]:hover:bg-teal-800/80",
        "read-only":
          "border-transparent bg-slate-100/60 text-slate-600 shadow-sm dark:bg-slate-800/60 dark:text-slate-400 cursor-not-allowed opacity-75",
        enabled:
          "border-transparent bg-emerald-100/80 text-emerald-800 shadow-sm dark:bg-emerald-900/60 dark:text-emerald-200",
        disabled:
          "border-transparent bg-slate-100/60 text-slate-500 shadow-sm dark:bg-slate-800/60 dark:text-slate-500 opacity-75",
      },
      size: {
        default: "px-2.5 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-full",
        lg: "px-3.5 py-1.5 text-sm rounded-full",
        xl: "px-4 py-2 text-sm rounded-full",
      },
      tone: {
        default: "",
        subdued: "opacity-80 saturate-50",
        strong: "font-semibold shadow-md",
        minimal: "bg-transparent border-current text-current shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      tone: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  tone,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
