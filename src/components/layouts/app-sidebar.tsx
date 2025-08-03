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
} from "lucide-react"

import { STUDENT_SIDEBAR_MENU, ADMIN_SIDEBAR_MENU } from "@/lib/constants"
import { NavDocuments } from "@/components/ui/nav-documents"
import { NavMain } from "@/components/ui/nav-main"
import { NavSecondary } from "@/components/ui/nav-secondary"
import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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

export function AppSidebar({ role = "student", ...props }: { role?: "student" | "admin" } & React.ComponentProps<typeof Sidebar>) {
  const { user, navMain, documents, navSecondary } = getSidebarData(role)
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <CircleUser className="!size-5" />
                <span className="text-base font-semibold">
                  {role === "admin" ? "Sınav Platformu Yönetimi" : "Sınav Asistanım"}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}