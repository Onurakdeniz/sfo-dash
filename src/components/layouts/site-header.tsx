"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle"

const getTitleFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  // Assuming the structure is /indiviual/[kullaniciId]/[section]
  // We are interested in the segment after [kullaniciId]
  if (segments.length > 2 && segments[0] === "indiviual") {
    const section = segments[2];
    switch (section) {
      case "dashboard":
        return "Gösterge Paneli";
      case "plan":
        return "Plan";
      // Add more cases here for other sections
      default:
        return "Sayfa"; // Default title if section not matched
    }
  }
  return "Belgeler"; // Default title if path doesn't match expected structure
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
} 