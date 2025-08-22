"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  Building2, 
  ChevronDown,
  Clock,
  User,
  Users,
  Plus,
  Check,
  Shield,
  Calendar,
  UserPlus,
  Settings,
  LogOut,
  Briefcase,
  FileText
} from "lucide-react";
import { Package } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceSidebarProps {
  workspace: Workspace | null;
  company: Company | null;
  companies: Company[];
  navigation: Array<{ name: string; href: string; icon: any }>;
  user: any;
  userWorkspaceRole: {
    role: string;
    permissions: any;
    isOwner: boolean;
  } | null;
  workspaceSlug: string;
  companySlug: string;
  pathname: string;
  onCompanySelect: (company: Company) => void;
  onAddCompany: () => void;
  onSignOut: () => void;
  getUserInitials: (name: string | null | undefined, email: string) => string;
  router: any;
}

export function WorkspaceSidebar({ 
  workspace, 
  company, 
  companies, 
  navigation, 
  user, 
  userWorkspaceRole,
  workspaceSlug, 
  companySlug, 
  pathname,
  onCompanySelect,
  onAddCompany,
  onSignOut,
  getUserInitials,
  router
}: WorkspaceSidebarProps) {
  const hrBaseHref = `/${workspaceSlug}/${companySlug}/hr`;
  const personelHref = `${hrBaseHref}/employees`;
  const attendanceHref = `${hrBaseHref}/attendance`;
  const leavesHref = `${hrBaseHref}/leaves`;
  const performanceHref = `${hrBaseHref}/performance`;
  const recruitmentHref = `${hrBaseHref}/recruitment`;
  const canManagePersonnel = !!(userWorkspaceRole?.isOwner || userWorkspaceRole?.role === 'admin');
  const [adminGroupOpen, setAdminGroupOpen] = useState(true);
  const [hrOpen, setHrOpen] = useState(Boolean(pathname && pathname.startsWith(hrBaseHref)));

  useEffect(() => {
    if (pathname && pathname.startsWith(hrBaseHref)) {
      setHrOpen(true);
    }
  }, [pathname, hrBaseHref]);
  
  const fullCompanyName = company?.name || "Şirket Seçin";
  const shortCompanyName = fullCompanyName.length > 16 ? `${fullCompanyName.slice(0, 16)}…` : fullCompanyName;
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        {/* Logo - Always at top center when collapsed */}
        <div className="flex justify-center group-data-[collapsible=icon]:block group-data-[state=expanded]:hidden px-2 py-1">
          <Tooltip>
            <TooltipTrigger asChild>
              {workspace?.logo ? (
                <img 
                  src={workspace.logo} 
                  alt={workspace.name} 
                  className="h-8 w-8 rounded-lg object-cover cursor-pointer"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center cursor-pointer">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>{workspace?.name || "Yönetim Sistemi"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Sidebar Trigger - Centered when collapsed */}
        <div className="flex justify-center group-data-[collapsible=icon]:block group-data-[state=expanded]:hidden px-2 pb-1">
          <SidebarTrigger className="h-8 w-8" />
        </div>
        
        {/* Logo and Title - Only when expanded */}
        <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            {workspace?.logo ? (
              <img 
                src={workspace.logo} 
                alt={workspace.name} 
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-semibold text-sidebar-foreground">Yönetim Sistemi</span>
          </div>
          <SidebarTrigger className="h-8 w-8" />
        </div>

        {/* Access Restrictions Indicator */}
        {userWorkspaceRole?.permissions &&
         typeof userWorkspaceRole.permissions === 'object' &&
         'restrictedToCompany' in userWorkspaceRole.permissions && (
          <div className="mx-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-amber-800">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium">Kısıtlı Erişim</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Sadece {company?.name} şirketine erişiminiz var
            </p>
          </div>
        )}

        {/* Company Selector */}
        <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between h-auto p-2 border-dashed hover:border-solid transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-sidebar-accent"
                title={(typeof window !== 'undefined' && window.innerWidth) ? undefined : company?.name || "Şirket Seçin"}
              >
                <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-6 w-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center shadow-sm group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4">
                        <Building2 className="h-3.5 w-3.5 text-white group-data-[collapsible=icon]:h-3 group-data-[collapsible=icon]:w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="group-data-[state=expanded]:hidden">
                      <p>{company?.name || "Şirket Seçin"}</p>
                      <p className="text-xs text-muted-foreground">{companies?.length || 0} şirket</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium truncate">
                          {shortCompanyName}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        <p>{fullCompanyName}</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xs text-muted-foreground">
                      {workspace?.name || `${companies?.length || 0} şirket`}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-64 z-50 border bg-background/95 backdrop-blur-sm shadow-lg group-data-[collapsible=icon]:ml-2" 
                side="bottom" 
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider">
                  Şirketler ({companies?.length || 0})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {companies && companies.length > 0 ? (
                  companies.map((comp: Company) => (
                    <DropdownMenuItem
                      key={comp.id}
                      onClick={() => onCompanySelect(comp)}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="h-4 w-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-sm flex items-center justify-center">
                        <Building2 className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{comp.name}</span>
                      {comp.slug === companySlug && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Şirket bulunamadı
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {(userWorkspaceRole?.isOwner || userWorkspaceRole?.role === 'admin') && (
                  <DropdownMenuItem onClick={onAddCompany} className="flex items-center gap-3 p-3">
                    <div className="h-4 w-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-sm flex items-center justify-center">
                      <Plus className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">Şirket Ekle</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel asChild className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminGroupOpen((v) => !v)}
              aria-expanded={adminGroupOpen}
              className="flex items-center gap-2 w-full text-left"
            >
              <Shield className="h-4 w-4" />
              {userWorkspaceRole?.isOwner || userWorkspaceRole?.role === 'admin' 
                ? 'Yönetici Paneli' 
                : 'Üye Paneli'
              }
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden",
                  adminGroupOpen ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
          </SidebarGroupLabel>
          {adminGroupOpen && (
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {navigation.map((item) => {
                // Check if current path starts with the nav item href for hierarchical matching
                const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== `/${workspaceSlug}/${companySlug}`);
                return (
                  <SidebarMenuItem key={item.name} className={cn(
                    // Only center inactive items when collapsed
                    !isActive && "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  )}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        "relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer",
                        isActive && "bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm",
                        // For inactive items: center and make small when collapsed
                        !isActive && "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10",
                        !isActive && "group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-sidebar-accent",
                        // For active items: keep full width when collapsed to show text
                        isActive && "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10",
                        isActive && "group-data-[collapsible=icon]:bg-primary group-data-[collapsible=icon]:text-primary-foreground group-data-[collapsible=icon]:shadow-md"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                        <div className={cn(
                          "w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0",
                          isActive 
                            ? "text-primary group-data-[collapsible=icon]:text-primary" 
                            : "text-muted-foreground"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "font-medium transition-colors duration-200",
                          isActive ? "text-primary" : "text-foreground",
                          // Hide text when collapsed
                          "group-data-[collapsible=icon]:hidden"
                        )}>
                          {item.name}
                        </span>
                        {isActive && (
                          <div className="ml-auto flex items-center group-data-[collapsible=icon]:hidden">
                            <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Modüller
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {canManagePersonnel ? (
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {/* Static module entries styled like Personel Yönetimi */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/${workspaceSlug}/${companySlug}/talep`)}
                    tooltip="Talep Yönetimi"
                    className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
                  >
                    <Link href={`/${workspaceSlug}/${companySlug}/talep`} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Talep Yönetimi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Sipariş Yönetimi</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="relative transition-all duration-200 hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Belge Yönetimi</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/${workspaceSlug}/${companySlug}/customers`)}
                    tooltip="Müşteri Yönetimi"
                    className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
                  >
                    <Link href={`/${workspaceSlug}/${companySlug}/customers`} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Müşteri Yönetimi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/${workspaceSlug}/${companySlug}/suppliers`)}
                    tooltip="Tedarikçi Yönetimi"
                    className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
                  >
                    <Link href={`/${workspaceSlug}/${companySlug}/suppliers`} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Tedarikçi Yönetimi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(hrBaseHref)}
                    tooltip="Personel Yönetimi"
                    aria-expanded={hrOpen}
                    className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
                    onClick={() => setHrOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">
                        Personel Yönetimi
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-auto h-4 w-4 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden",
                          hrOpen ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Submenu for HR module */}
                {hrOpen && (
                <SidebarMenuItem>
                  <SidebarMenuSub className="space-y-2">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(personelHref)}
                        className={cn(
                          pathname.startsWith(personelHref) && "bg-primary/15 text-primary font-medium",
                          "cursor-pointer"
                        )}
                      >
                        <Link href={personelHref} aria-current={pathname.startsWith(personelHref) ? "page" : undefined}>
                          <Users className="h-4 w-4" />
                          <span>Personel Yönetimi</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(attendanceHref)}
                        className={cn(
                          pathname.startsWith(attendanceHref) && "bg-primary/15 text-primary font-medium",
                          "cursor-pointer"
                        )}
                      >
                        <Link href={attendanceHref} aria-current={pathname.startsWith(attendanceHref) ? "page" : undefined}>
                          <Clock className="h-4 w-4" />
                          <span>Mesai Yönetimi</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(leavesHref)}
                        className={cn(
                          pathname.startsWith(leavesHref) && "bg-primary/15 text-primary font-medium",
                          "cursor-pointer"
                        )}
                      >
                        <Link href={leavesHref} aria-current={pathname.startsWith(leavesHref) ? "page" : undefined}>
                          <Calendar className="h-4 w-4" />
                          <span>İzin Yönetimi</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>


                  </SidebarMenuSub>
                </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Ürün Yönetimi</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="relative transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
                    <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                      <div className="w-7 h-7 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-data-[collapsible=icon]:hidden">Ofis Yönetimi</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground italic group-data-[collapsible=icon]:hidden">
                Henüz modül yok
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 border-t border-border/50 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-3 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:border-primary/20 border border-transparent transition-all duration-200 group rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:hover:bg-sidebar-accent"
              >
                <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-200 shadow-sm group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                      <AvatarImage 
                        src={user?.image || ""} 
                        alt={user?.name || user?.email || ""} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold text-sm">
                        {user ? getUserInitials(user.name, user.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm group-data-[collapsible=icon]:h-2.5 group-data-[collapsible=icon]:w-2.5">
                      <div className="h-full w-full bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-left overflow-hidden flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {user?.name || "User"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="success" size="sm" className="text-xs px-1.5 py-0.5">
                        Çevrimiçi
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-20">
                        {user?.email || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all duration-200 flex-shrink-0 group-data-[collapsible=icon]:hidden" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-64 mb-2 shadow-lg border bg-background/95 backdrop-blur-sm z-50"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="pb-3 pt-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarImage src={user?.image || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold">
                        {user ? getUserInitials(user.name, user.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Aktif</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem 
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/profile`)}
                className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-md mx-1 transition-all duration-200"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Profil Ayarları</p>
                  <p className="text-xs text-muted-foreground">Hesap bilgilerini düzenle</p>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/settings`)}
                className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-md mx-1 transition-all duration-200"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-md flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ayarlar</p>
                  <p className="text-xs text-muted-foreground">Uygulama tercihlerini yönet</p>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem 
                onClick={onSignOut}
                className="flex items-center gap-3 p-3 text-destructive hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 focus:text-destructive rounded-md mx-1 transition-all duration-200"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-md flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Çıkış Yap</p>
                  <p className="text-xs text-muted-foreground">Hesabından güvenli çıkış</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}