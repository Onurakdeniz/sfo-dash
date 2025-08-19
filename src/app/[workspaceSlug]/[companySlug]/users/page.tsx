"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Mail, Calendar, Shield, UserCheck, UserX, Edit, Trash2, MoreHorizontal, UserPlus, Settings, Eye, MapPin, Clock, Users, Send, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";

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

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message?: string;
  invitedAt: string;
  expiresAt: string;
  respondedAt?: string;
  inviterName?: string;
  inviterEmail?: string;
  type?: 'workspace' | 'company';
  companyId?: string;
  companyName?: string;
}

function UsersPageContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [selectedInvitationType, setSelectedInvitationType] = useState<'workspace' | 'company'>('workspace');
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

  // Fetch companies in the workspace for invitation selection
  const { data: companiesData = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['workspace-companies', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies`, {
          credentials: 'include'
        });
        if (!res.ok) {
          console.error('Companies API error:', res.status, res.statusText);
          return [];
        }
        const data = await res.json();
        console.log('Companies API response:', data); // Debug log
        // The API returns companies array directly, not wrapped in an object
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Find current company by slug
  const currentCompany = companiesData.find((c: any) => c.slug === companySlug);

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

  const isLoading = isLoadingWorkspaces || isLoadingMembers;

  // Assign existing workspace user to current company (auto-create employee profile)
  const assignUserToCompany = useMutation({
    mutationFn: async (userId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      if (!currentCompany?.id) throw new Error('Company not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${currentCompany.id}/employees/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok && res.status !== 201) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kullanıcı şirkete atanamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Kullanıcı şirkete atandı ve çalışan profili oluşturuldu');
      // Çalışan listesi sayfalarında kullanılmak üzere geçerli sorgular varsa tazelensin
      queryClient.invalidateQueries({ queryKey: ['company-employees', workspace?.id, currentCompany?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'İşlem başarısız oldu');
    },
  });

  // Fetch workspace invitations
  const { data: invitationsData = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['workspace-invitations', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/invitations`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to fetch invitations');
        }
        const data = await res.json();
        return data.invitations || [];
      } catch (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Transform members data for easier use
  const users: User[] = members.map((member: WorkspaceMember) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    image: member.user.image,
    role: member.role,
    joinedAt: member.joinedAt,
  }));

  // Invite user mutation
  const inviteUser = useMutation({
    mutationFn: async (data: { 
      email: string; 
      role: string;
      message?: string;
      invitationType: 'workspace' | 'company';
      companyId?: string;
    }) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      
      // Choose endpoint based on invitation type
      const endpoint = data.invitationType === 'company' && data.companyId
        ? `/api/workspaces/${workspace.id}/companies/${data.companyId}/members`
        : `/api/workspaces/${workspace.id}/members`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          role: data.role,
          message: data.message
        })
      });
      
      // Handle both success (200) and partial success (207) as successful responses
      if (!res.ok && res.status !== 207) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to invite user');
      }
      
      return res.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspace?.id] });
      setShowCreateModal(false);
      setActiveTab('invitations'); // Switch to invitations tab to show the new invitation
      
      // Handle different response scenarios
      if (response.emailSent) {
        toast.success('Davetiye başarıyla gönderildi');
      } else {
        toast.warning('Davetiye oluşturuldu ancak e-posta gönderilemedi. Davetiyeyi üyeler listesinden yeniden gönderebilirsiniz.');
      }
    },
    onError: (error) => {
      // Handle 207 status (partial success) as a special case
      if (error.message.includes('Invitation created but email could not be sent')) {
        queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace?.id] });
        queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspace?.id] });
        setShowCreateModal(false);
        setActiveTab('invitations');
        toast.warning('Davetiye oluşturuldu ancak e-posta gönderilemedi. Davetiyeyi üyeler listesinden yeniden gönderebilirsiniz.');
      } else {
        toast.error(error.message || 'Kullanıcı davet edilemedi');
      }
      console.error('Invite user error:', error);
    },
  });

  // Update user role mutation
  const updateUserRole = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspace?.id] });
      toast.success('Kullanıcı rolü başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error(error.message || 'Kullanıcı rolü güncellenemedi');
      console.error('Update user role error:', error);
    },
  });

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
    },
    onError: (error) => {
      toast.error(error.message || 'Kullanıcı çıkarılamadı');
      console.error('Remove user error:', error);
    },
  });

  // Resend invitation mutation
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/invitations/${invitationId}/resend`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspace?.id] });
      toast.success('Davetiye başarıyla yeniden gönderildi');
    },
    onError: (error) => {
      toast.error(error.message || 'Davetiye yeniden gönderilemedi');
      console.error('Resend invitation error:', error);
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter((user: User) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter invitations based on search
  const filteredInvitations = invitationsData.filter((invitation: InvitationData) =>
    invitation.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (user: User) => {
    router.push(`/${workspaceSlug}/${companySlug}/users/${user.id}`);
  };

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

  const getInvitationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock3 className="h-3 w-3" />;
      case 'accepted':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'declined':
        return <XCircle className="h-3 w-3" />;
      case 'expired':
        return <AlertTriangle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock3 className="h-3 w-3" />;
    }
  };

  const isInvitationExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  // Show loading state if workspace is still loading
  if (isLoadingWorkspaces) {
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

  return (
    <PageWrapper
      title="Takım Yönetimi"
      description="Çalışma alanınızdaki üyeleri ve davetleri yönetin"
      actions={
        <Button variant="shopifyPrimary" size="sm" onClick={() => setShowCreateModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Üye Davet Et
        </Button>
      }
    >
      <div className="space-y-6">

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Üye</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Davetler</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invitationsData.filter((inv: InvitationData) => inv.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yöneticiler</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => ['owner', 'admin'].includes(u.role.toLowerCase())).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Üyeler</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role.toLowerCase() === 'member').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Members and Invitations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Üyeler</span>
              <div className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {users.length}
              </div>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Davetler</span>
              <div className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {invitationsData.length}
              </div>
              {invitationsData.filter((inv: InvitationData) => inv.status === 'pending').length > 0 && (
                <div className="ml-1 h-2 w-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Üyeler</CardTitle>
                <CardDescription>
                  {filteredUsers.length} / {users.length} üye
                </CardDescription>
              </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Üyeleri isim veya e-posta ile arayın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Üyeler tablosu */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Üye</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Katılma Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoadingMembers ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Aramanızla eşleşen üye bulunamadı' : 'Bu çalışma alanında henüz üye yok'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow 
                      key={user.id} 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleUserClick(user)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback>
                              {user.name[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(user);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detayları Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Open role edit modal
                              toast.info('Rol düzenleme yakında geliyor!');
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Rol Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!currentCompany?.id) {
                                  toast.error('Geçerli şirket bulunamadı');
                                  return;
                                }
                                assignUserToCompany.mutate(user.id);
                              }}
                              disabled={assignUserToCompany.isPending || !currentCompany?.id}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Şirkete Ata
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`${user.name} kullanıcısını bu çalışma alanından çıkarmak istediğinizden emin misiniz?`)) {
                                  removeUser.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Üyeyi Çıkar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="invitations" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Davetler</CardTitle>
          <CardDescription>
            {filteredInvitations.length} / {invitationsData.length} davet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Davetleri e-posta ile arayın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Invitations table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Davet Tarihi</TableHead>
                  <TableHead>Son Geçerlilik</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvitations ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Send className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchQuery ? 'Aramanızla eşleşen davet bulunamadı' : 'Henüz davet gönderilmemiş'}
                        </p>
                        {!searchQuery && (
                          <Button 
                            onClick={() => setShowCreateModal(true)}
                            variant="shopifyPrimary"
                            size="sm"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            İlk Davetinizi Gönderin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation: InvitationData) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{invitation.email}</div>
                          {invitation.inviterName && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              {invitation.inviterName} tarafından davet edildi
                            </div>
                          )}
                          {invitation.type === 'company' && invitation.companyName && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {invitation.companyName} şirketi için
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(invitation.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getInvitationStatusColor(invitation.status)}>
                          {getInvitationStatusIcon(invitation.status)}
                          <span className="ml-1 capitalize">{invitation.status}</span>
                        </Badge>
                        {invitation.status === 'pending' && isInvitationExpired(invitation.expiresAt) && (
                          <div className="mt-1">
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Süresi Dolmuş
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(invitation.invitedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            {invitation.status === 'pending' && !isInvitationExpired(invitation.expiresAt) && (
                              <DropdownMenuItem 
                                onClick={() => resendInvitation.mutate(invitation.id)}
                                disabled={resendInvitation.isPending}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Yeniden Gönder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(invitation.email);
                              toast.success('E-posta kopyalandı');
                            }}>
                              <Mail className="mr-2 h-4 w-4" />
                              E-posta Kopyala
                            </DropdownMenuItem>
                            {invitation.message && (
                              <DropdownMenuItem onClick={() => {
                                toast.info(`Mesaj: "${invitation.message}"`);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Mesajı Görüntüle
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

        {/* Üye Davet Et Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Takım Üyesi Davet Et</DialogTitle>
              <DialogDescription>
                {workspace?.name} çalışma alanına katılmak için davetiye gönder.
              </DialogDescription>
              {selectedInvitationType === 'company' && companiesData.length > 0 && (
                <div className="text-sm text-blue-600 dark:text-blue-400 -mt-2 mb-4">
                  Kullanıcı sadece seçilen şirkete erişim sahibi olacak.
                </div>
              )}
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                inviteUser.mutate({
                  email: formData.get('email') as string,
                  role: formData.get('role') as string,
                  invitationType: selectedInvitationType,
                  companyId: selectedInvitationType === 'company' ? (formData.get('companyId') as string) : undefined,
                });
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    E-posta
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="invitationType" className="text-right">
                    Davet Türü
                  </Label>
                  <select
                    id="invitationType"
                    value={selectedInvitationType}
                    onChange={(e) => setSelectedInvitationType(e.target.value as 'workspace' | 'company')}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="workspace">Çalışma Alanı (Tüm şirketlere erişim)</option>
                    <option value="company">Belirli Şirket</option>
                  </select>
                </div>
                {selectedInvitationType === 'company' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="companyId" className="text-right">
                      Şirket
                    </Label>
                    <select
                      id="companyId"
                      name="companyId"
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required={selectedInvitationType === 'company'}
                      defaultValue={currentCompany?.id || ''}
                      disabled={isLoadingCompanies}
                    >
                      {isLoadingCompanies ? (
                        <option value="">Şirketler yükleniyor...</option>
                      ) : companiesData.length === 0 ? (
                        <option value="">Bu çalışma alanında şirket bulunamadı</option>
                      ) : (
                        <>
                          <option value="">Şirket seçin...</option>
                          {companiesData.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Rol
                  </Label>
                  <select
                    id="role"
                    name="role"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="member">Üye</option>
                    <option value="admin">Yönetici</option>
                    <option value="viewer">Görüntüleyici</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="shopifySecondary" onClick={() => setShowCreateModal(false)}>
                  İptal
                </Button>
                <Button type="submit" variant="shopifyPrimary" disabled={inviteUser.isPending}>
                  {inviteUser.isPending ? 'Gönderiliyor...' : 'Davetiye Gönder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}

export default function UsersPage() {
  return (
    <RoleGuard 
      requiredRoles={['owner', 'admin']}
      fallbackMessage="Kullanıcı yönetimi sayfasına erişmek için yönetici yetkisi gereklidir."
    >
      <UsersPageContent />
    </RoleGuard>
  );
}