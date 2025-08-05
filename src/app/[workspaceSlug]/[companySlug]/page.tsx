"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Briefcase, TrendingUp, Activity, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";
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

interface WorkspaceContextData {
  user: {
    role: string;
    permissions: any;
    isOwner: boolean;
  };
}



function StatCard({ title, value, description, icon: Icon, trend }: StatCard) {
  return (
    <Card variant="elevated" className="group hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{value}</span>
              {trend && (
                <Badge 
                  variant={trend.isPositive ? "success" : "critical"} 
                  size="sm"
                  className="gap-1"
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {trend.value}%
                </Badge>
              )}
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
      </CardHeader>
    </Card>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Fetch workspace context to get user role
  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
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

  const isLoading = workspaceLoading || companiesLoading || membersLoading || contextLoading;

  // Get user role information
  const userRole = contextData?.user?.role;
  const isOwner = contextData?.user?.isOwner;
  const isAdminOrOwner = isOwner || userRole === 'admin';

  const stats = [
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
    <PageWrapper
      title={isAdminOrOwner ? "Kontrol Paneli" : "Etkinlikler"}
      description={isAdminOrOwner 
        ? `${workspace?.name} çalışma alanı için genel bakış`
        : `${workspace?.name} çalışma alanı etkinlikleri`
      }
    >
      <div className="space-y-8">
        {/* Overview Section with Statistics and Quick Actions - Only for Admin/Owner */}
        {isAdminOrOwner && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">Genel Bakış</h2>
              <p className="text-sm text-muted-foreground">
                {workspace?.name} çalışma alanı için temel istatistikler
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Statistics Grid */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <StatCardSkeleton key={i} />
                    ))
                  ) : (
                    stats.map((stat) => (
                      <StatCard key={stat.title} {...stat} />
                    ))
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="lg:col-span-1">
             
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 h-full">
                  <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full" variant="elevated">
                      <CardHeader className="h-full">
                        <div className="flex flex-col items-center justify-center text-center gap-3 h-full">
                          <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                            <Building2 className="h-6 w-6 text-success" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold group-hover:text-success transition-colors">
                              Şirket Ekle
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Yeni şirket ekleyin
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href={`/${workspaceSlug}/${companySlug}/users`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full" variant="elevated">
                      <CardHeader className="h-full">
                        <div className="flex flex-col items-center justify-center text-center gap-3 h-full">
                          <div className="p-3 bg-info/10 rounded-xl group-hover:bg-info/20 transition-colors">
                            <Users className="h-6 w-6 text-info" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold group-hover:text-info transition-colors">
                              Üye Davet Et
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Yeni üyeler ekleyin
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isAdminOrOwner ? "Son Etkinlikler" : "Etkinlikler"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAdminOrOwner 
                  ? "Sistem etkinliklerini ve güncellemeleri takip edin"
                  : "Çalışma alanındaki etkinlikleri takip edin"
                }
              </p>
            </div>
            {isAdminOrOwner && (
              <Button variant="outline" size="sm">
                Tümünü Görüntüle
              </Button>
            )}
          </div>
          <Card variant="subdued">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg mb-2">
                {isAdminOrOwner ? "Etkinlik takibi yakında geliyor" : "Henüz etkinlik bulunmuyor"}
              </CardTitle>
              <CardDescription className="text-center max-w-md">
                {isAdminOrOwner 
                  ? "Kullanıcı etkileşimini ve sistem performansını takip etmenize yardımcı olacak güçlü analitikler geliştiriyoruz."
                  : "Çalışma alanında etkinlik gerçekleştikçe burada görüntülenecek. Bildirimler ve güncellemeler için bu alanı takip edebilirsiniz."
                }
              </CardDescription>
              <Badge variant="info" className="mt-4">
                {isAdminOrOwner ? "Geliştirme Aşamasında" : "Etkinlik Bekleniyor"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}