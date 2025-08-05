"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { 
  Building2, 
  Home, 
  Users, 
  Settings,
  Server,
  UserCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { AuthGuard } from "./auth-guard";
import { WorkspaceSidebar } from "@/components/layouts/workspace-sidebar";
import React from "react";

import { useQuery } from "@tanstack/react-query";

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
  user: {
    role: string;
    permissions: any;
    isOwner: boolean;
  };
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  
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
  const userWorkspaceRole = contextData?.user || null;
  
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
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Çalışma Alanı Yükleniyor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if context failed to load
  if (contextError || !workspace || !company) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Erişim Hatası</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu çalışma alanına veya şirkete erişim yetkiniz yok.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="default"
              className="w-full"
            >
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Define navigation based on user role
  const getNavigationItems = (userRole: string | undefined, isOwner: boolean) => {
    const baseNavigation = [
      { name: "Kontrol Paneli", href: `/${workspaceSlug}/${companySlug}`, icon: Home },
    ];

    // Add profile for all users
    const profileNavigation = [
      { name: "Profil", href: `/${workspaceSlug}/${companySlug}/profile`, icon: UserCircle },
    ];

    // Admin/Owner only navigation
    const adminNavigation = [
      { name: "Şirketler", href: `/${workspaceSlug}/${companySlug}/companies`, icon: Building2 },
      { name: "Kullanıcılar", href: `/${workspaceSlug}/${companySlug}/users`, icon: Users },
      { name: "Sistem", href: `/${workspaceSlug}/${companySlug}/system`, icon: Server },
      { name: "Ayarlar", href: `/${workspaceSlug}/${companySlug}/settings`, icon: Settings },
    ];

    // Return navigation based on role
    if (isOwner || userRole === 'admin') {
      return [...baseNavigation, ...adminNavigation];
    } else {
      // Members and viewers get limited access
      return [...baseNavigation, ...profileNavigation];
    }
  };

  const navigation = getNavigationItems(userWorkspaceRole?.role, userWorkspaceRole?.isOwner || false);

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

  // Handle company selection
  const handleCompanySelect = (selectedCompany: Company) => {
    console.log('Company selected:', selectedCompany);
    if (selectedCompany.slug !== companySlug) {
      window.location.href = `/${workspaceSlug}/${selectedCompany.slug}`;
    }
  };

  // Handle add company
  const handleAddCompany = () => {
    console.log('Add company clicked');
    router.push(`/${workspaceSlug}/${companySlug}/companies/add`);
  };

  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full overflow-hidden">
          <WorkspaceSidebar 
            workspace={workspace}
            company={company}
            companies={companies}
            navigation={navigation}
            user={user}
            userWorkspaceRole={userWorkspaceRole}
            workspaceSlug={workspaceSlug}
            companySlug={companySlug}
            pathname={pathname}
            onCompanySelect={handleCompanySelect}
            onAddCompany={handleAddCompany}
            onSignOut={handleSignOut}
            getUserInitials={getUserInitials}
            router={router}
          />
          <SidebarInset className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}