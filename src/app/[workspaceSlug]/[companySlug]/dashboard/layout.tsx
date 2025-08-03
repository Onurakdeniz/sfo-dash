"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Home, 
  Users, 
  Briefcase,
  LogOut,
  Settings,
  ChevronDown,
  User,
  Plus,
  Check,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth/client";
import { AuthGuard } from "./auth-guard";
import { useState, useEffect } from "react";
import { createClient } from "@luna/api/client";
import { useQuery } from "@tanstack/react-query";
// import { UserProfileModal } from "../../../../components/user-profile-modal";

const client = createClient('http://localhost:3002') as any;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const params = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Get workspace and company slugs from URL
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  
  // Get user session data
  const { data: session } = useSession();
  const user = session?.user;

  // Fetch all workspaces and find by slug
  const { data: workspacesData, isLoading: workspaceLoading, error: workspaceError } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      try {
        console.log('Fetching workspaces for slug:', workspaceSlug);
        const res = await client.api.workspaces.$get();
        console.log('Workspaces response:', res);
        if (!res.ok) {
          console.log('Workspaces response not ok:', res.status);
          return null;
        }
        const data = await res.json();
        console.log('Workspaces data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        return null;
      }
    },
    enabled: !!workspaceSlug,
  });

  // Find workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch companies for workspace
  const { data: companies, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['companies', workspace?.id, companySlug],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        console.log('Fetching companies for workspace:', workspace.id);
        const res = await client.api.workspaces[':workspaceId'].companies.$get({
          param: { workspaceId: workspace.id }
        });
        console.log('Companies response:', res);
        if (!res.ok) {
          console.log('Companies response not ok:', res.status);
          return [];
        }
        const data = await res.json();
        console.log('Companies data:', data);
        // Ensure each company has a slug field derived from its name
        return data.map((c: any) => ({
          ...c,
          slug: (c.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        }));
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Find company by slug
  const company = companies?.find((c: Company) => c.slug === companySlug) || null;

  const navigation = [
    { name: "Kontrol Paneli", href: `/${workspaceSlug}/${companySlug}/dashboard`, icon: Home },
    { name: "Çalışma Alanları", href: `/${workspaceSlug}/${companySlug}/dashboard/workspaces`, icon: Briefcase },
    { name: "Şirketler", href: `/${workspaceSlug}/${companySlug}/dashboard/companies`, icon: Building2 },
    { name: "Kullanıcılar", href: `/${workspaceSlug}/${companySlug}/dashboard/users`, icon: Users },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Handle company selection
  const handleCompanySelect = (selectedCompany: Company) => {
    if (selectedCompany.slug !== companySlug) {
      // Navigate to the selected company
      window.location.href = `/${workspaceSlug}/${selectedCompany.slug}/dashboard`;
    }
  };

  // Handle add company
  const handleAddCompany = () => {
    // Navigate to company creation page or open modal
    console.log('Add company clicked');
    // You can implement this functionality based on your needs
  };

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";
  const mainMargin = sidebarCollapsed ? "ml-16" : "ml-64";

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Fixed Sidebar - Left Side - Compact Modern ERP Style */}
        <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300", sidebarWidth)}>
          <div className="flex h-full flex-col">
            {/* Header with Collapse Toggle */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Luna Manager</span>
                    </div>
                    <div className="ml-0 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        {workspaceLoading ? (
                          "Yükleniyor..."
                        ) : workspaceError || !workspace ? (
                          "Çalışma alanı bulunamadı"
                        ) : (
                          workspace.name
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

                        {/* User Profile Section */}
            {!sidebarCollapsed && (
              <div className="p-3 border-b border-gray-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-gray-50 focus:outline-none">
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-7 w-7 flex-shrink-0 rounded-full overflow-hidden">
                          <AvatarImage 
                            src={user?.image || ""} 
                            alt={user?.name || user?.email || ""} 
                            className="object-cover w-full h-full rounded-full"
                          />
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-medium rounded-full w-full h-full flex items-center justify-center">
                            {user ? getUserInitials(user.name, user.email) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                        <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-3 py-2">
                      {user?.email || "user@example.com"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="border-gray-100 my-1" />
                    
                    <DropdownMenuItem 
                      className="px-0 hover:bg-gray-50 focus:bg-gray-50"
                      onSelect={(e) => {
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
                      onSelect={(e) => {
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
            )}

            {/* Company Selector */}
            <div className="p-3 border-b border-gray-100">
              {sidebarCollapsed ? (
                <div className="flex justify-center">
                  <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-indigo-600 rounded flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {company?.name || "Şirket Seçin"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {companies?.length || 0} şirket
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-3 py-2">
                      Şirketler
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="border-gray-100 my-1" />
                    {companies && companies.length > 0 ? (
                      companies.map((comp: Company) => (
                        <DropdownMenuItem
                          key={comp.id}
                          onClick={() => handleCompanySelect(comp)}
                          className="flex items-center justify-between px-0 hover:bg-gray-50 focus:bg-gray-50 rounded-md mx-1"
                        >
                          <div className="flex items-center gap-2 px-3 py-2 w-full">
                            <div className="h-4 w-4 bg-indigo-600 rounded flex items-center justify-center">
                              <Building2 className="h-2.5 w-2.5 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">{comp.name}</span>
                            {comp.slug === companySlug && (
                              <Check className="h-4 w-4 text-blue-600 ml-auto" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="px-3 py-2 text-sm text-gray-400">
                        Şirket bulunamadı
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="border-gray-100 my-1" />
                    <DropdownMenuItem 
                      onClick={handleAddCompany}
                      className="px-0 hover:bg-gray-50 focus:bg-gray-50 rounded-md mx-1"
                    >
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 w-full">
                        <Plus className="h-4 w-4" />
                        <span>Şirket Ekle</span>
                      </div>
                    </DropdownMenuItem>
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
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150",
                            sidebarCollapsed ? "justify-center" : "gap-3",
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive ? "text-blue-600" : "text-gray-500"
                          )} />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </Link>
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
                    href={`/${workspaceSlug}/${companySlug}/dashboard/settings`}
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

              {/* User Avatar in Collapsed Mode */}
              {sidebarCollapsed && (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex justify-center">
                    <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                      <AvatarImage 
                        src={user?.image || ""} 
                        alt={user?.name || user?.email || ""} 
                        className="object-cover w-full h-full rounded-full"
                      />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-medium rounded-full w-full h-full flex items-center justify-center">
                        {user ? getUserInitials(user.name, user.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn("flex-1 overflow-y-auto transition-all duration-300", mainMargin)}>
          <div className="h-full bg-gray-50">
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