"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield, 
  Settings, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  Edit
} from "lucide-react";
import { toast } from "sonner";

interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  joinedAt: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const userId = params.userId as string;
  const queryClient = useQueryClient();

  // Fetch all workspaces and find by slug
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
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

  // Fetch workspace members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to fetch members');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching members:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Find the specific user
  const userMember = members.find((member: WorkspaceMember) => member.user.id === userId);
  const user: User | null = userMember ? {
    id: userMember.user.id,
    name: userMember.user.name,
    email: userMember.user.email,
    image: userMember.user.image,
    role: userMember.role,
    joinedAt: userMember.joinedAt,
  } : null;

  // Remove user mutation
  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/members?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace?.id] });
      toast.success('Kullanıcı başarıyla çıkarıldı');
      router.push(`/${workspaceSlug}/${companySlug}/users`);
    },
    onError: (error) => {
      toast.error(error.message || 'Kullanıcı çıkarılamadı');
      console.error('Remove user error:', error);
    },
  });

  const isLoading = isLoadingWorkspaces || isLoadingMembers;

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      case 'viewer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Çalışma alanı bulunamadı veya erişim izniniz yok.
          </p>
        </div>
      </div>
    );
  }

  // Show error if user not found
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Kullanıcı bulunamadı.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/users`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kullanıcılara Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Breadcrumb / Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/users`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kullanıcılara Geri Dön
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kullanıcı Detayları</h1>
            <p className="mt-2 text-muted-foreground">
              {workspace.name} çalışma alanındaki kullanıcı bilgileri
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                // TODO: Open role edit modal/page
                toast.info('Rol düzenleme yakında geliyor!');
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                if (confirm(`${user.name} kullanıcısını bu çalışma alanından çıkarmak istediğinizden emin misiniz?`)) {
                  removeUser.mutate(user.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Çıkar
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Bilgileri</CardTitle>
            <CardDescription>
              Kullanıcının temel bilgileri ve çalışma alanındaki rolü
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">{user.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <Badge className={getRoleColor(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Katılma Tarihi</p>
                      <p className="font-medium">{new Date(user.joinedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Çalışma Alanı</p>
                      <p className="font-medium">{workspace.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Yetki Seviyesi</p>
                      <p className="font-medium capitalize">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kullanıcı ID</p>
                      <p className="font-medium font-mono text-sm">{user.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rol İzinleri</CardTitle>
            <CardDescription>
              Bu rolün çalışma alanında sahip olduğu izinler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.role.toLowerCase() === 'owner' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Sahip (Owner)</h4>
                  </div>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Tüm çalışma alanı ayarlarını yönetebilir</li>
                    <li>• Üyeleri ekleyebilir ve çıkarabilir</li>
                    <li>• Rolleri değiştirebilir</li>
                    <li>• Çalışma alanını silebilir</li>
                  </ul>
                </div>
              )}

              {user.role.toLowerCase() === 'admin' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Yönetici (Admin)</h4>
                  </div>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Üyeleri ekleyebilir ve çıkarabilir</li>
                    <li>• Şirket bilgilerini düzenleyebilir</li>
                    <li>• Raporları görüntüleyebilir</li>
                    <li>• Ayarları değiştirebilir</li>
                  </ul>
                </div>
              )}

              {user.role.toLowerCase() === 'member' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Üye (Member)</h4>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Şirket bilgilerini görüntüleyebilir</li>
                    <li>• Raporları görüntüleyebilir</li>
                    <li>• Kendi profilini düzenleyebilir</li>
                  </ul>
                </div>
              )}

              {user.role.toLowerCase() === 'viewer' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Görüntüleyici (Viewer)</h4>
                  </div>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• Sadece okuma izni vardır</li>
                    <li>• Şirket bilgilerini görüntüleyebilir</li>
                    <li>• Raporları görüntüleyebilir</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}