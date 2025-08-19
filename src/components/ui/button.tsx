import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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
        // Shopify-inspired button variants
        shopifyPrimary:
          "bg-slate-900 text-white border border-slate-900 shadow-sm hover:bg-slate-800 hover:border-slate-800 hover:shadow-md active:bg-slate-950 active:shadow-sm transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 dark:hover:bg-slate-200 dark:hover:border-slate-200",
        shopifySecondary:
          "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400 hover:shadow-md active:bg-slate-100 active:shadow-sm transition-all duration-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-slate-500",
        shopifyOutline:
          "bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400 hover:shadow-sm active:bg-slate-100 transition-all duration-200 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:hover:border-slate-500",
        shopifyDestructive:
          "bg-red-600 text-white border border-red-600 shadow-sm hover:bg-red-700 hover:border-red-700 hover:shadow-md active:bg-red-800 active:shadow-sm transition-all duration-200 focus-visible:ring-red-200 dark:focus-visible:ring-red-800",
        shopifySuccess:
          "bg-green-600 text-white border border-green-600 shadow-sm hover:bg-green-700 hover:border-green-700 hover:shadow-md active:bg-green-800 active:shadow-sm transition-all duration-200 focus-visible:ring-green-200 dark:focus-visible:ring-green-800",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 rounded-md gap-1.5 px-2.5 text-xs has-[>svg]:px-2",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
      // ERP-style standardization axes
      emphasis: {
        solid: "",
        soft: "",
        outline: "border",
        ghost: "",
        link: "underline-offset-4",
      },
      tone: {
        primary: "",
        neutral: "",
        success: "",
        warning: "",
        critical: "",
        info: "",
      },
      shape: {
        round: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-md",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // solid
      { emphasis: "solid", tone: "primary", class: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md" },
      { emphasis: "solid", tone: "neutral", class: "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" },
      { emphasis: "solid", tone: "success", class: "bg-green-600 text-white hover:bg-green-700" },
      { emphasis: "solid", tone: "warning", class: "bg-amber-500 text-white hover:bg-amber-600" },
      { emphasis: "solid", tone: "critical", class: "bg-red-600 text-white hover:bg-red-700" },
      { emphasis: "solid", tone: "info", class: "bg-blue-600 text-white hover:bg-blue-700" },
      // soft
      { emphasis: "soft", tone: "primary", class: "bg-primary/15 text-primary hover:bg-primary/20" },
      { emphasis: "soft", tone: "neutral", class: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800" },
      { emphasis: "soft", tone: "success", class: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50" },
      { emphasis: "soft", tone: "warning", class: "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50" },
      { emphasis: "soft", tone: "critical", class: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50" },
      { emphasis: "soft", tone: "info", class: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50" },
      // outline
      { emphasis: "outline", tone: "primary", class: "border-primary/60 text-primary hover:bg-primary/10" },
      { emphasis: "outline", tone: "neutral", class: "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" },
      { emphasis: "outline", tone: "success", class: "border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-900/20" },
      { emphasis: "outline", tone: "warning", class: "border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/20" },
      { emphasis: "outline", tone: "critical", class: "border-red-600 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20" },
      { emphasis: "outline", tone: "info", class: "border-blue-600 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20" },
      // ghost
      { emphasis: "ghost", tone: "primary", class: "text-primary hover:bg-primary/10" },
      { emphasis: "ghost", tone: "neutral", class: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" },
      { emphasis: "ghost", tone: "success", class: "text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/20" },
      { emphasis: "ghost", tone: "warning", class: "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20" },
      { emphasis: "ghost", tone: "critical", class: "text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20" },
      { emphasis: "ghost", tone: "info", class: "text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20" },
      // link
      { emphasis: "link", tone: "primary", class: "text-primary hover:underline" },
      { emphasis: "link", tone: "neutral", class: "text-slate-700 hover:underline dark:text-slate-200" },
      { emphasis: "link", tone: "success", class: "text-green-700 hover:underline dark:text-green-300" },
      { emphasis: "link", tone: "warning", class: "text-amber-700 hover:underline dark:text-amber-300" },
      { emphasis: "link", tone: "critical", class: "text-red-700 hover:underline dark:text-red-300" },
      { emphasis: "link", tone: "info", class: "text-blue-700 hover:underline dark:text-blue-300" },
    ],
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
  emphasis,
  tone,
  shape,
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
      className={cn(buttonVariants({ variant, size, fullWidth, emphasis, tone, shape, className }))}
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
