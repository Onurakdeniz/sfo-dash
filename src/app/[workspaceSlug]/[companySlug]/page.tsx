"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Briefcase, TrendingUp, Activity, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// API calls will be made using fetch to local endpoints

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

// Unused interface - commented out
// interface WorkspaceMember {
//   workspaceId: string;
//   userId: string;
//   role: string;
//   user?: {
//     id: string;
//     name?: string;
//     email: string;
//   };
// }

function StatCard({ title, value, description, icon: Icon }: StatCard) {
  return (
    <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{description}</p>
            
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="bg-white border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 flex items-center">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-12 ml-2" />
              <Skeleton className="h-3 w-20 ml-2" />
            </div>
          </div>
          <div className="ml-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  // const companySlug = params.companySlug as string; // Unused in this component

  // Fetch all workspaces and find by slug
  const { data: workspacesData, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      try {
        const res = await fetch('/api/workspaces', {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!workspaceSlug,
  });

  // Find current workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch companies for the current workspace
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Fetch workspace members for the current workspace
  const { data: workspaceMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Fetch user's workspaces count
  const { data: userWorkspacesData, isLoading: userWorkspacesLoading } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/workspaces', {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const isLoading = workspaceLoading || companiesLoading || membersLoading || userWorkspacesLoading;

  const stats = [
    {
      title: "Toplam Çalışma Alanları",
      value: userWorkspacesData?.workspaces?.length || 0,
      description: "Erişiminiz olan çalışma alanları",
      icon: Briefcase,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Toplam Şirketler",
      value: companies.length || 0,
      description: `${workspace?.name || ''} çalışma alanındaki şirketler`,
      icon: Building2,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Çalışma Alanı Üyeleri",
      value: workspaceMembers.length || 0,
      description: `${workspace?.name || ''} çalışma alanı üyeleri`,
      icon: Users,
      trend: { value: 5, isPositive: false },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">


        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          ) : (
            stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Son Etkinlikler</h2>
            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-gray-900">
              Tümünü Görüntüle
            </Button>
          </div>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">Etkinlik takibi yakında geliyor</p>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Kullanıcı etkileşimini ve sistem performansını takip etmenize yardımcı olacak güçlü analitikler geliştiriyoruz.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Hızlı İşlemler</h2>
            <p className="text-sm text-gray-500">Bu yaygın görevlerle başlayın</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Çalışma Alanı Oluştur</h3>
                    <p className="text-sm text-gray-600">Ekibiniz için yeni bir çalışma alanı kurun</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Şimdi Oluştur
                </Button>
              </CardContent>
            </Card>

            <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
              <Card className="bg-white border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Şirket Ekle</h3>
                      <p className="text-sm text-gray-600">Bu çalışma alanına yeni bir şirket ekleyin</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Şirket Ekle
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-white border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Üye Davet Et</h3>
                    <p className="text-sm text-gray-600">Çalışma alanına yeni üyeler ekleyin</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Davet Gönder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}