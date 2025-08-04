"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Building2, 
  Home, 
  Users, 
  LogOut,
  Settings,
  Server,
  ChevronDown,
  User,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { AuthGuard } from "./auth-guard";
import { useState } from "react";
import React from "react";
import { motion } from "framer-motion";

import { useQuery } from "@tanstack/react-query";
// import { UserProfileModal } from "../../../../components/user-profile-modal";

// API calls will be made using fetch to local endpoints

interface DashboardLayoutProps {
  children: React.ReactNode;
}

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

interface WorkspaceContextData {
  workspace: Workspace;
  currentCompany: Company;
  companies: Company[];
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Get workspace and company slugs from URL
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  
  // Get user session data
  const { data: session } = useSession();
  const user = session?.user;

  // Fetch workspace and company context in a single request
  const { data: contextData, isLoading: contextLoading, error: contextError } = useQuery<WorkspaceContextData>({
    queryKey: ['workspace-context', workspaceSlug, companySlug],
    queryFn: async () => {
      try {
        console.log('Fetching workspace context for:', workspaceSlug, companySlug);
        const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, {
          credentials: 'include'
        });
        console.log('Context response:', res);
        if (!res.ok) {
          console.log('Context response not ok:', res.status);
          return null;
        }
        const data = await res.json();
        console.log('Context data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching workspace context:', error);
        return null;
      }
    },
    enabled: !!(workspaceSlug && companySlug),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const workspace = contextData?.workspace || null;
  const company = contextData?.currentCompany || null;
  const companies = contextData?.companies || [];
  
  // Debug logging (after all variables are initialized)
  console.log('Dashboard Layout Debug:', {
    workspaceSlug,
    companySlug,
    contextData,
    workspace,
    companies,
    company
  });

  // Show loading state while fetching context
  if (contextLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Çalışma alanı yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show error state if context failed to load
  if (contextError || !workspace || !company) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erişim Hatası</h2>
          <p className="text-gray-600 dark:text-gray-400">Bu çalışma alanına veya şirkete erişim yetkiniz yok.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Kontrol Paneli", href: `/${workspaceSlug}/${companySlug}`, icon: Home },
    { name: "Şirketler", href: `/${workspaceSlug}/${companySlug}/companies`, icon: Building2 },
    { name: "Kullanıcılar", href: `/${workspaceSlug}/${companySlug}/users`, icon: Users },
    { name: "Sistem", href: `/${workspaceSlug}/${companySlug}/system`, icon: Server },
    { name: "Ayarlar", href: `/${workspaceSlug}/${companySlug}/settings`, icon: Settings },
  ];

  const handleSignOut = async () => {
    const { signOut } = await import('@/lib/auth/client');
    await signOut();
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Get current page title based on pathname
  const getPageTitle = (pathname: string) => {
    const basePath = `/${workspaceSlug}/${companySlug}`;
    
    if (pathname === basePath) {
      return "Kontrol Paneli";
    } else if (pathname === `${basePath}/companies`) {
      return "Şirketler";
    } else if (pathname === `${basePath}/companies/add`) {
      return "Yeni Şirket Ekle";
    } else if (pathname === `${basePath}/users`) {
      return "Kullanıcılar";
    } else if (pathname === `${basePath}/system`) {
      return "Sistem";
    } else if (pathname === `${basePath}/settings`) {
      return "Ayarlar";
    } else if (pathname.startsWith(`${basePath}/companies/`) && pathname.includes('/edit')) {
      return "Şirket Düzenle";
    } else if (pathname.startsWith(`${basePath}/companies/`) && !pathname.includes('/add')) {
      // Extract company ID from pathname for company detail pages
      const companyIdMatch = pathname.match(`${basePath}/companies/([^/]+)`);
      if (companyIdMatch && companies) {
        const companyId = companyIdMatch[1];
        const detailCompany = companies.find((c: Company) => c.id === companyId);
        return detailCompany?.name || "Şirket Detayları";
      }
      return "Şirket Detayları";
    }
    
    return "Dashboard";
  };

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = (pathname: string) => {
    const basePath = `/${workspaceSlug}/${companySlug}`;
    const items = [
      {
        label: "Dashboard",
        href: basePath,
        isLast: false
      }
    ];

    if (pathname !== basePath) {
      // Handle companies section
      if (pathname.startsWith(`${basePath}/companies`)) {
        items.push({
          label: "Şirketler",
          href: `${basePath}/companies`,
          isLast: false
        });
        
        if (pathname === `${basePath}/companies/add`) {
          items.push({
            label: "Şirket Ekle",
            href: pathname,
            isLast: true
          });
        } else if (pathname.includes('/edit')) {
          items.push({
            label: "Düzenle",
            href: pathname,
            isLast: true
          });
        } else if (pathname !== `${basePath}/companies`) {
          // Extract company ID from pathname for company detail pages
          const companyIdMatch = pathname.match(`${basePath}/companies/([^/]+)`);
          if (companyIdMatch && companies) {
            const companyId = companyIdMatch[1];
            const detailCompany = companies.find((c: Company) => c.id === companyId);
            const companyName = detailCompany?.name || "Detaylar";
            items.push({
              label: companyName,
              href: pathname,
              isLast: true
            });
          } else {
            items.push({
              label: "Detaylar",
              href: pathname,
              isLast: true
            });
          }
        } else {
          items[items.length - 1].isLast = true;
        }
      }
      // Handle users section
      else if (pathname.startsWith(`${basePath}/users`)) {
        items.push({
          label: "Kullanıcılar",
          href: `${basePath}/users`,
          isLast: true
        });
      }
      // Handle system section
      else if (pathname.startsWith(`${basePath}/system`)) {
        items.push({
          label: "Sistem",
          href: `${basePath}/system`,
          isLast: true
        });
      }
      // Handle settings section
      else if (pathname.startsWith(`${basePath}/settings`)) {
        items.push({
          label: "Ayarlar",
          href: `${basePath}/settings`,
          isLast: true
        });
      }
      // Handle other navigation items
      else {
        const currentNav = navigation.find(item => item.href === pathname);
        if (currentNav) {
          items.push({
            label: currentNav.name,
            href: pathname,
            isLast: true
          });
        }
      }
    } else {
      items[0].isLast = true;
    }

    return items;
  };

  // Handle company selection
  const handleCompanySelect = (selectedCompany: Company) => {
    if (selectedCompany.slug !== companySlug) {
      // Navigate to the selected company
      window.location.href = `/${workspaceSlug}/${selectedCompany.slug}`;
    }
  };

  // Handle add company
  const handleAddCompany = () => {
    router.push(`/${workspaceSlug}/${companySlug}/companies/add`);
  };

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";
  const mainMargin = sidebarCollapsed ? "ml-16" : "ml-64";

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Fixed Sidebar - Left Side - Compact Modern ERP Style */}
        <motion.aside 
          className={cn("fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 shadow-sm", sidebarWidth)}
          initial={false}
          animate={{ 
            width: sidebarCollapsed ? 64 : 256,
            opacity: 1
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <div className="flex h-full flex-col">
            {/* Header with Collapse Toggle */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {workspace?.logo ? (
                        <img 
                          src={workspace.logo} 
                          alt={workspace.name} 
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">Luna Manager</span>
                    </div>
                      
                  </div>
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 border border-transparent transition-all duration-200 rounded-lg"
                  >
                    <motion.div
                      animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </motion.div>
                  </Button>
                </motion.div>
              </div>
            </div>

            

            {/* Company Selector */}
            <div className="p-3 border-b border-gray-100">
              {sidebarCollapsed ? (
                <motion.div 
                  className="flex justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-lg border border-transparent hover:border-blue-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="h-7 w-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                            whileHover={{ rotate: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Building2 className="h-3.5 w-3.5 text-white" />
                          </motion.div>
                          <div className="text-left overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {company?.name || "Şirket Seçin"}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {workspace?.name ? `${workspace.name} çalışma alanı` : `${companies?.length || 0} şirket`}
                            </p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: 0 }}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-2 backdrop-blur-sm"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500 font-semibold px-3 py-2 uppercase tracking-wider">
                      Şirketler
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="border-gray-100 my-2" />
                    {companies && companies.length > 0 ? (
                      companies.map((comp: Company, index: number) => (
                        <motion.div
                          key={comp.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.2 }}
                        >
                          <DropdownMenuItem
                            onClick={() => handleCompanySelect(comp)}
                            className="flex items-center justify-between px-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 rounded-lg mx-1 transition-all duration-200 cursor-pointer"
                          >
                            <motion.div 
                              className="flex items-center gap-3 px-3 py-2.5 w-full"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="h-5 w-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                                <Building2 className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{comp.name}</span>
                              {comp.slug === companySlug && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Check className="h-4 w-4 text-blue-600 ml-auto" />
                                </motion.div>
                              )}
                            </motion.div>
                          </DropdownMenuItem>
                        </motion.div>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="px-3 py-2 text-sm text-gray-400">
                        Şirket bulunamadı
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="border-gray-100 my-2" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DropdownMenuItem 
                        onClick={handleAddCompany}
                        className="px-0 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 focus:bg-gradient-to-r focus:from-green-50 focus:to-emerald-50 rounded-lg mx-1 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 w-full">
                          <div className="h-5 w-5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-md flex items-center justify-center shadow-sm">
                            <Plus className="h-3 w-3 text-white" />
                          </div>
                          <span>Şirket Ekle</span>
                        </div>
                      </DropdownMenuItem>
                    </motion.div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>



            <ScrollArea className="flex-1">
              <div className="flex-1 p-3">
                {/* Platform Section */}
                <div className="mb-4">
                  {!sidebarCollapsed && (
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                      Platform
                    </h3>
                  )}
                  <nav className="space-y-1">
                    {navigation.map((item, index) => {
                      const isActive = pathname === item.href;
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.1,
                            ease: "easeOut" 
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200",
                              sidebarCollapsed ? "justify-center" : "gap-3",
                              isActive
                                ? "bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-600"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                            )}
                            title={sidebarCollapsed ? item.name : undefined}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <item.icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isActive ? "text-blue-600" : "text-gray-500"
                              )} />
                            </motion.div>
                            {!sidebarCollapsed && (
                              <motion.span 
                                className="truncate"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </nav>
                </div>


              </div>
            </ScrollArea>

            {/* Bottom Section */}
            <div className="border-t border-gray-100">
              {/* Settings Link */}
              <div className="p-3">
                <nav className="space-y-1">
                  <Link
                    href={`/${workspaceSlug}/${companySlug}/settings`}
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150",
                      sidebarCollapsed ? "justify-center" : "gap-3"
                    )}
                    title={sidebarCollapsed ? "Ayarlar" : undefined}
                  >
                    <Settings className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    {!sidebarCollapsed && (
                      <span className="truncate">Ayarlar</span>
                    )}
                  </Link>
                </nav>
              </div>


            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main className={cn("flex-1 overflow-y-auto transition-all duration-300", mainMargin)}>
          <div className="h-full bg-gray-50">
            {/* Context Header - Shows current page title and breadcrumb */}
            <div className="bg-gradient-to-r from-white via-blue-50/20 to-white border-b border-gray-200 px-6 py-2">
              <div className="flex items-center justify-between">
                <motion.div 
                  className="flex flex-col space-y-2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md blur opacity-15 animate-pulse"></div>
                      <motion.div 
                        className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-md shadow-md"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {pathname === `/${workspaceSlug}/${companySlug}` ? (
                          <Home className="h-4 w-4 text-white" />
                        ) : pathname.startsWith(`/${workspaceSlug}/${companySlug}/companies`) ? (
                          <Building2 className="h-4 w-4 text-white" />
                        ) : pathname.startsWith(`/${workspaceSlug}/${companySlug}/users`) ? (
                          <Users className="h-4 w-4 text-white" />
                        ) : pathname.startsWith(`/${workspaceSlug}/${companySlug}/system`) ? (
                          <Server className="h-4 w-4 text-white" />
                        ) : pathname.startsWith(`/${workspaceSlug}/${companySlug}/settings`) ? (
                          <Settings className="h-4 w-4 text-white" />
                        ) : (
                          <Home className="h-4 w-4 text-white" />
                        )}
                      </motion.div>
                    </motion.div>
                    <div>
                      <motion.h1 
                        className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                      >
                        {getPageTitle(pathname)}
                      </motion.h1>
                      <motion.div 
                        className="h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-1"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "3rem", opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.7 }}
                  >
                    <Breadcrumb>
                      <BreadcrumbList>
                        {getBreadcrumbItems(pathname).map((item, index) => (
                          <React.Fragment key={item.href}>
                            <BreadcrumbItem>
                              {item.isLast ? (
                                <BreadcrumbPage className="text-gray-600 font-medium text-sm">
                                  {item.label}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink 
                                  asChild
                                  className="text-gray-500 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
                                >
                                  <Link href={item.href}>
                                    {item.label}
                                  </Link>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {!item.isLast && <BreadcrumbSeparator className="text-gray-300" />}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </motion.div>
                </motion.div>
                <div className="flex items-center space-x-4">
                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 p-2 h-auto hover:bg-gray-50 focus:outline-none">
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user?.name || user?.email || "Unknown User"}
                            </p>
                          </div>
                          <Avatar className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden">
                            <AvatarImage 
                              src={user?.image || ""} 
                              alt={user?.name || user?.email || ""} 
                              className="object-cover w-full h-full rounded-full"
                            />
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-medium rounded-full w-full h-full flex items-center justify-center">
                              {user ? getUserInitials(user.name, user.email) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
                      sideOffset={8}
                    >
                      <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-3 py-2">
                        {user?.name || "User"}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="border-gray-100 my-1" />
                      
                      <DropdownMenuItem 
                        className="px-0 hover:bg-gray-50 focus:bg-gray-50"
                        onSelect={(e: Event) => {
                          e.preventDefault();
                          setProfileModalOpen(true);
                        }}
                      >
                        <div className="flex items-center px-3 py-2 text-sm text-gray-700 w-full">
                          <User className="mr-2 h-4 w-4" />
                          Profil
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="border-gray-100 my-1" />
                      
                      <DropdownMenuItem 
                        className="px-0 hover:bg-gray-50 focus:bg-gray-50" 
                        onSelect={(e: Event) => {
                          e.preventDefault();
                          handleSignOut();
                        }}
                      >
                        <div className="flex items-center px-3 py-2 text-sm text-gray-700 w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Çıkış Yap
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            {children}
          </div>
        </main>

        {/* Test Modal */}
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setProfileModalOpen(false)} />
            <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">Test Profile Modal</h2>
              <p className="mb-4">This is a test modal to see if the basic structure works.</p>
              <p className="mb-4">User: {user?.name || user?.email || "No user"}</p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setProfileModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}