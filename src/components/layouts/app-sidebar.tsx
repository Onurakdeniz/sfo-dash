"use client"

import * as React from "react"
import {
  Camera,
  BarChart3,
  LayoutDashboard,
  Database,
  FileText,
  FileSpreadsheet,
  Folder,
  HelpCircle,
  CircleUser,
  List,
  FileBarChart,
  Search,
  Settings,
  Users,
  Building2,
  GraduationCap,
} from "lucide-react"

import { STUDENT_SIDEBAR_MENU, ADMIN_SIDEBAR_MENU } from "@/lib/constants"
import { NavDocuments } from "@/components/ui/nav-documents"
import { NavMain } from "@/components/ui/nav-main"
import { NavSecondary } from "@/components/ui/nav-secondary"
import { NavUser } from "@/components/ui/nav-user"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type StudentMenu = typeof STUDENT_SIDEBAR_MENU
type AdminMenu = typeof ADMIN_SIDEBAR_MENU

// Map menu keys to icons for student and admin
const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  study_plan: List,
  ai_copilot: FileText,
  courses_topics: Folder,
  practice_assessment: FileText,
  performance_analytics: BarChart3,
  content_library: Database,
  personal_notes: FileSpreadsheet,
  saved_items: FileBarChart,
  study_groups: Users,
  more: HelpCircle,
  settings: Settings,
  help: HelpCircle,
  search: Search,
  dark_mode: CircleUser,
  // Admin
  user_management: Users,
  content_management: Folder,
  exam_management: FileText,
  ai_copilot_settings: FileText,
  question_generation: FileText,
  assessment_feedback: FileBarChart,
  personalized_study_plan: List,
  student_reports: FileBarChart,
  content_analytics: BarChart3,
  platform_stats: BarChart3,
  ai_performance: FileText,
  gamification: HelpCircle,
  forum_group_moderation: HelpCircle,
  announcements: HelpCircle,
  platform_settings: Settings,
  admin_help: HelpCircle,
  system_logs: FileBarChart,
}

function getSidebarData(role: "student" | "admin" = "student") {
  if (role === "admin") {
    const menu: AdminMenu = ADMIN_SIDEBAR_MENU;
    const user = {
      name: "Ayşe Kaya",
      email: "yonetici@platformadresi.com",
      avatar: "/avatars/default.jpg",
    }
    const navMain = menu.mainPanel.map((item: { label: string; key: string }) => ({
      title: item.label,
      url: "#",
      icon: ICONS[item.key] || LayoutDashboard,
    }))
    // For admin, you could also add aiModules, analytics, community, etc. as needed
    const documents: { name: string; url: string; icon: any }[] = [] // No direct resources for admin in your structure
    const navSecondary = menu.system.map((item: { label: string; key: string }) => ({
      title: item.label,
      url: "#",
      icon: ICONS[item.key] || Settings,
    }))
    return { user, navMain, documents, navSecondary }
  } else {
    const menu: StudentMenu = STUDENT_SIDEBAR_MENU;
    const user = {
      name: "Can Yılmaz",
      email: "kullanici@email.com",
      avatar: "/avatars/default.jpg",
    }
    const navMain = menu.mainNav.map((item: { label: string; key: string }) => ({
      title: item.label,
      url: "#",
      icon: ICONS[item.key] || LayoutDashboard,
    }))
    const documents = menu.resources.map((item: { label: string; key: string }) => ({
      name: item.label,
      url: "#",
      icon: ICONS[item.key] || Database,
    }))
    const navSecondary = menu.tools.map((item: { label: string; key: string }) => ({
      title: item.label,
      url: "#",
      icon: ICONS[item.key] || Settings,
    }))
    return { user, navMain, documents, navSecondary }
  }
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "student" | "admin";
  variant?: "default" | "compact" | "enhanced";
  showRoleBadge?: boolean;
}

export function AppSidebar({ 
  role = "student", 
  variant = "default",
  showRoleBadge = true,
  className,
  ...props 
}: AppSidebarProps) {
  const { user, navMain, documents, navSecondary } = getSidebarData(role)
  
  const getBrandIcon = (role: string) => {
    return role === "admin" ? Building2 : GraduationCap;
  };

  const getBrandTitle = (role: string) => {
    return role === "admin" ? "Sınav Platformu Yönetimi" : "Sınav Asistanım";
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "critical" : "info";
  };

  const BrandIcon = getBrandIcon(role);

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn("border-r border-border/50", className)}
      {...props}
    >
      <SidebarHeader className={cn(
        variant === "enhanced" && "border-b border-border/50 pb-4 mb-2"
      )}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "data-[slot=sidebar-menu-button]:!p-2",
                variant === "enhanced" && "data-[slot=sidebar-menu-button]:!p-3"
              )}
            >
              <a href="#" className="flex items-center gap-3">
                <BrandIcon className={cn(
                  "!size-5 text-primary",
                  variant === "enhanced" && "!size-6"
                )} />
                <div className="flex flex-col items-start">
                  <span className={cn(
                    "text-base font-semibold text-foreground",
                    variant === "compact" && "text-sm",
                    variant === "enhanced" && "text-lg"
                  )}>
                    {getBrandTitle(role)}
                  </span>
                  {showRoleBadge && variant === "enhanced" && (
                    <Badge 
                      variant={getRoleBadgeVariant(role)} 
                      size="sm"
                      className="mt-1"
                    >
                      {role === "admin" ? "Yönetici" : "Öğrenci"}
                    </Badge>
                  )}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {showRoleBadge && variant !== "enhanced" && (
          <>
            <Separator className="my-2" />
            <div className="px-3">
              <Badge 
                variant={getRoleBadgeVariant(role)} 
                size="sm"
                className="w-fit"
              >
                {role === "admin" ? "Yönetici Paneli" : "Öğrenci Paneli"}
              </Badge>
            </div>
          </>
        )}
      </SidebarHeader>
      
      <SidebarContent className="gap-2">
        <NavMain items={navMain} />
        {documents && documents.length > 0 && (
          <>
            <Separator className="mx-3" />
            <NavDocuments items={documents} />
          </>
        )}
        <div className="mt-auto">
          <Separator className="mx-3 mb-2" />
          <NavSecondary items={navSecondary} />
        </div>
      </SidebarContent>
      
      <SidebarFooter className={cn(
        "border-t border-border/50 pt-2",
        variant === "enhanced" && "pt-4"
      )}>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}