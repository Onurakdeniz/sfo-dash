import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground dark:bg-input/20 border-input flex w-full min-w-0 rounded-lg border bg-background/50 backdrop-blur-sm px-3 py-2 text-base shadow-sm ring-offset-background transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring hover:shadow-md",
  {
    variants: {
      variant: {
        default: "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        error: "border-red-500/60 bg-red-50/50 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:bg-red-950/20 dark:focus-visible:ring-red-400/20",
        success: "border-green-500/60 bg-green-50/50 focus-visible:border-green-500 focus-visible:ring-green-500/20 dark:bg-green-950/20 dark:focus-visible:ring-green-400/20",
        warning: "border-amber-500/60 bg-amber-50/50 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:bg-amber-950/20 dark:focus-visible:ring-amber-400/20",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-muted/50",
      },
      inputSize: {
        sm: "h-8 px-3 py-1 text-sm rounded-md",
        default: "h-10 px-3 py-2",
        lg: "h-11 px-4 py-2 rounded-xl",
        xl: "h-12 px-4 py-3 text-base rounded-xl",
      },
      hasPrefix: {
        true: "pl-10",
        false: "",
      },
      hasSuffix: {
        true: "pr-10",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      hasPrefix: false,
      hasSuffix: false,
    },
  }
)

interface InputProps extends React.ComponentProps<"input">, VariantProps<typeof inputVariants> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, hasPrefix, hasSuffix, prefix, suffix, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          inputVariants({ 
            variant, 
            inputSize, 
            hasPrefix: hasPrefix || !!prefix, 
            hasSuffix: hasSuffix || !!suffix 
          }), 
          className
        )}
        {...props}
      />
    )

    if (prefix || suffix) {
      return (
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none flex items-center">
              {prefix}
            </div>
          )}
          {inputElement}
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none flex items-center">
              {suffix}
            </div>
          )}
        </div>
      )
    }

    return inputElement
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
