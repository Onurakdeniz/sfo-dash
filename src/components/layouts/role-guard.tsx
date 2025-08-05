"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: string[]; // ['owner', 'admin'] for admin-only pages
  fallbackMessage?: string;
}

interface WorkspaceContextData {
  user: {
    role: string;
    permissions: any;
    isOwner: boolean;
  };
}

export function RoleGuard({ children, requiredRoles, fallbackMessage }: RoleGuardProps) {
  const router = useRouter();
  const params = useParams();
  
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Fetch workspace context to get user role
  const { data: contextData, isLoading, error } = useQuery<WorkspaceContextData>({
    queryKey: ['workspace-context', workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch workspace context');
      }
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Yetki Kontrolü</CardTitle>
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

  // Show error state
  if (error || !contextData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Erişim Hatası</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu sayfaya erişim yetkiniz bulunmuyor.
            </p>
            <Button 
              onClick={() => router.back()}
              variant="default"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = contextData.user?.role;
  const isOwner = contextData.user?.isOwner;

  // Check if user has required role
  const hasRequiredRole = isOwner || (userRole && requiredRoles.includes(userRole));

  if (!hasRequiredRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-warning/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-warning">Yetkisiz Erişim</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {fallbackMessage || 
                `Bu sayfaya erişmek için ${requiredRoles.includes('admin') ? 'yönetici' : 'sahip'} yetkisi gereklidir.`
              }
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Mevcut Rolünüz:</strong> {isOwner ? 'Sahip' : (userRole === 'admin' ? 'Yönetici' : userRole === 'member' ? 'Üye' : 'İzleyici')}
              </p>
            </div>
            <Button 
              onClick={() => router.push(`/${workspaceSlug}/${companySlug}`)}
              variant="default"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kontrol Paneline Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required role, render the protected content
  return <>{children}</>;
}