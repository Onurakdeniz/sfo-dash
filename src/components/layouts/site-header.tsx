"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const getTitleFromPath = (pathname: string): { title: string; badge?: string; description?: string } => {
  const segments = pathname.split('/').filter(Boolean);
  
  // Handle workspace/company structure
  if (segments.length >= 2) {
    const section = segments[segments.length - 1];
    
    switch (section) {
      case "dashboard":
        return { 
          title: "Gösterge Paneli", 
          description: "Sistem genel durumu ve önemli metriklere genel bakış"
        };
      case "plan":
        return { 
          title: "Plan", 
          description: "Çalışma planınızı yönetin ve takip edin"
        };
      case "system":
        return { 
          title: "Sistem Yönetimi", 
          badge: "Admin",
          description: "Sistem ayarları ve yönetim araçları"
        };
      case "users":
        return { 
          title: "Kullanıcı Yönetimi", 
          badge: "Admin",
          description: "Kullanıcıları yönetin ve izinleri düzenleyin"
        };
      case "profile":
        return { 
          title: "Profil", 
          description: "Hesap bilgilerinizi görüntüleyin ve düzenleyin"
        };
      case "settings":
        return { 
          title: "Ayarlar", 
          description: "Uygulama tercihlerinizi özelleştirin"
        };
      default:
        return { 
          title: section.charAt(0).toUpperCase() + section.slice(1),
          description: "Sayfa içeriği"
        };
    }
  }
  
  return { 
    title: "Belgeler", 
    description: "Sistem belgeleri ve kaynaklarına erişim"
  };
};

interface SiteHeaderProps {
  className?: string;
  variant?: "default" | "minimal" | "elevated";
  showDescription?: boolean;
}

export function SiteHeader({ 
  className,
  variant = "default",
  showDescription = false
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { title, badge, description } = getTitleFromPath(pathname);

  if (variant === "elevated") {
    return (
      <Card className={cn("rounded-none border-x-0 border-t-0", className)} variant="subdued">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              {badge && (
                <Badge variant="info" size="sm">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          {showDescription && description && (
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              {description}
            </p>
          )}
        </CardHeader>
      </Card>
    );
  }

  if (variant === "minimal") {
    return (
      <header className={cn(
        "flex h-10 shrink-0 items-center gap-2 px-4 lg:px-6",
        className
      )}>
        <SidebarTrigger className="-ml-1" size="sm" />
        <Separator orientation="vertical" className="h-3" />
        <h1 className="text-sm font-medium">{title}</h1>
        {badge && (
          <Badge variant="outline" size="sm">
            {badge}
          </Badge>
        )}
      </header>
    );
  }

  return (
    <header className={cn(
      "flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
      className
    )}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-base font-medium">{title}</h1>
          {badge && (
            <Badge variant="info" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {showDescription && description && (
          <p className="text-xs text-muted-foreground hidden md:block max-w-md truncate">
            {description}
          </p>
        )}
      </div>
    </header>
  )
} 