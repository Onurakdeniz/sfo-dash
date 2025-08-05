import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md active:scale-[0.98] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-[0.98] dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline active:scale-[0.98]",
        // Modern ERP-style variants
        polaris:
          "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
        critical:
          "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg active:scale-[0.98] focus-visible:ring-red-200 dark:focus-visible:ring-red-800",
        success:
          "bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg active:scale-[0.98] focus-visible:ring-green-200 dark:focus-visible:ring-green-800",
        warning:
          "bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg active:scale-[0.98] focus-visible:ring-amber-200 dark:focus-visible:ring-amber-800",
        minimal:
          "bg-transparent text-slate-700 hover:bg-slate-100/80 hover:shadow-sm active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800/80",
        plain:
          "bg-transparent text-primary hover:bg-primary/10 hover:shadow-sm active:scale-[0.98] shadow-none",
        monochrome:
          "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 hover:shadow-md active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        // Modern standard action button variants
        action:
          "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md hover:from-slate-800 hover:to-slate-700 hover:shadow-lg active:scale-[0.98] focus-visible:ring-slate-200 dark:from-slate-100 dark:to-slate-200 dark:text-slate-900 dark:hover:from-slate-200 dark:hover:to-slate-300 dark:focus-visible:ring-slate-800",
        actionSecondary:
          "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.98] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
