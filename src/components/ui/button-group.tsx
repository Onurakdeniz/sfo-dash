import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: "horizontal" | "vertical"
  attached?: boolean
  fullWidth?: boolean
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, direction = "horizontal", attached = true, fullWidth = false, children, ...props }, ref) => {
    const isVertical = direction === "vertical"

    const base = "inline-flex" + (isVertical ? " flex-col" : " flex-row")
    const attachClasses = attached
      ? isVertical
        ? "[&_[data-slot=button]]:rounded-none [&_[data-slot=button]:first-child]:rounded-t-lg [&_[data-slot=button]:last-child]:rounded-b-lg [&_[data-slot=button]:not(:first-child)]:-mt-px"
        : "[&_[data-slot=button]]:rounded-none [&_[data-slot=button]:first-child]:rounded-l-lg [&_[data-slot=button]:last-child]:rounded-r-lg [&_[data-slot=button]:not(:first-child)]:-ml-px"
      : ""

    return (
      <div
        ref={ref}
        className={cn(base, attachClasses, fullWidth ? "w-full" : "", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }


