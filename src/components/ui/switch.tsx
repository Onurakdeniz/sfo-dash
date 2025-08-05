"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=checked]:shadow-md data-[state=unchecked]:bg-input/60 data-[state=unchecked]:backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:data-[state=unchecked]:bg-input/40 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-sm ring-offset-background transition-all duration-200 outline-none hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background shadow-sm dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-all duration-200 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:shadow-md"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
