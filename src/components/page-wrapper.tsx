"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Home, 
  Building2, 
  Users, 
  Server, 
  Settings,
  User,
  Shield
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isLast?: boolean;
}

interface PageWrapperProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  secondaryNav?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions, 
  secondaryNav,
  children,
  className 
}: PageWrapperProps) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Auto-generate breadcrumbs if not provided
  const finalBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : generateBreadcrumbs(pathname, workspaceSlug, companySlug);

  // Get page icon based on pathname
  const getPageIcon = (pathname: string) => {
    const basePath = `/${workspaceSlug}/${companySlug}`;
    
    if (pathname === basePath) {
      return <Home className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/companies`)) {
      return <Building2 className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/users`)) {
      return <Users className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/system`)) {
      return <Server className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/settings`)) {
      return <Settings className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/profile`)) {
      return <User className="h-5 w-5 text-primary" />;
    } else if (pathname.startsWith(`${basePath}/workspaces`)) {
      return <Shield className="h-5 w-5 text-primary" />;
    }
    
    return <Home className="h-5 w-5 text-primary" />;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 bg-background px-4 md:px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col space-y-2">
              {/* Title with Icon */}
              <div className="flex items-center space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 cursor-help">
                      {getPageIcon(pathname)}
                    </div>
                  </TooltipTrigger>
                  {description && (
                    <TooltipContent>
                      <p>{description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-xl font-semibold text-foreground cursor-help">
                      {title}
                    </h1>
                  </TooltipTrigger>
                  {description && (
                    <TooltipContent>
                      <p>{description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
              
              {/* Breadcrumbs */}
              {finalBreadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {finalBreadcrumbs.map((item, index) => (
                      <React.Fragment key={item.href || item.label}>
                        <BreadcrumbItem>
                          {item.isLast || !item.href ? (
                            <BreadcrumbPage className="text-muted-foreground font-medium text-xs">
                              {item.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink 
                              asChild
                              className="text-muted-foreground hover:text-foreground transition-colors font-medium text-xs"
                            >
                              <Link href={item.href}>
                                {item.label}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!item.isLast && index < finalBreadcrumbs.length - 1 && (
                          <BreadcrumbSeparator className="text-muted-foreground/50" />
                        )}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
            
            {/* Actions */}
            {actions && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Secondary navigation under header (e.g., tabs) */}
        {secondaryNav && (
          <div className="flex-shrink-0 bg-background px-4 md:px-6 pt-2 pb-2">
            <div className="flex items-center">{secondaryNav}</div>
          </div>
        )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={cn("px-6 pb-6 pt-6", className)}>
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
    </TooltipProvider>
  );
}

// Helper function to generate breadcrumbs automatically
function generateBreadcrumbs(pathname: string, workspaceSlug: string, companySlug: string): BreadcrumbItem[] {
  const basePath = `/${workspaceSlug}/${companySlug}`;
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      href: basePath,
      isLast: false
    }
  ];

  if (pathname !== basePath) {
    // Handle companies section
    if (pathname.startsWith(`${basePath}/companies`)) {
      breadcrumbs.push({
        label: "Şirketler",
        href: `${basePath}/companies`,
        isLast: false
      });
      
      if (pathname === `${basePath}/companies/add`) {
        breadcrumbs.push({
          label: "Şirket Ekle",
          isLast: true
        });
      } else if (pathname.includes('/edit')) {
        breadcrumbs.push({
          label: "Düzenle",
          isLast: true
        });
      } else if (pathname !== `${basePath}/companies`) {
        // Company detail page
        const companyIdMatch = pathname.match(`${basePath}/companies/([^/]+)`);
        if (companyIdMatch) {
          breadcrumbs.push({
            label: "Şirket Bilgileri",
            isLast: true
          });
        }
      } else {
        breadcrumbs[breadcrumbs.length - 1].isLast = true;
      }
    }
    // Handle users section
    else if (pathname.startsWith(`${basePath}/users`)) {
      breadcrumbs.push({
        label: "Kullanıcılar",
        href: `${basePath}/users`,
        isLast: pathname === `${basePath}/users`
      });
      
      if (pathname !== `${basePath}/users`) {
        breadcrumbs.push({
          label: "Detaylar",
          isLast: true
        });
      }
    }
    // Handle system section
    else if (pathname.startsWith(`${basePath}/system`)) {
      breadcrumbs.push({
        label: "Sistem",
        href: `${basePath}/system`,
        isLast: false
      });
      
      if (pathname === `${basePath}/system/modules`) {
        breadcrumbs.push({
          label: "Modüller",
          isLast: true
        });
      } else if (pathname === `${basePath}/system/permissions`) {
        breadcrumbs.push({
          label: "İzinler",
          isLast: true
        });
      } else if (pathname === `${basePath}/system/roles`) {
        breadcrumbs.push({
          label: "Roller",
          isLast: true
        });
      } else if (pathname === `${basePath}/system/resources`) {
        breadcrumbs.push({
          label: "Kaynaklar",
          isLast: true
        });
      } else if (pathname === `${basePath}/system`) {
        breadcrumbs[breadcrumbs.length - 1].isLast = true;
      } else {
        breadcrumbs[breadcrumbs.length - 1].isLast = true;
      }
    }
    // Handle settings section
    else if (pathname.startsWith(`${basePath}/settings`)) {
      breadcrumbs.push({
        label: "Ayarlar",
        isLast: true
      });
    }
    // Handle profile section
    else if (pathname.startsWith(`${basePath}/profile`)) {
      breadcrumbs.push({
        label: "Profil",
        isLast: true
      });
    }
    // Handle workspaces section
    else if (pathname.startsWith(`${basePath}/workspaces`)) {
      breadcrumbs.push({
        label: "Çalışma Alanları",
        isLast: true
      });
    }
  } else {
    breadcrumbs[0].isLast = true;
  }

  return breadcrumbs;
}