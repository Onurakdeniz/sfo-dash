"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, ArrowLeft, Mail, Crown, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";

interface Company {
  id: string;
  name: string;
  slug?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

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

export default function MembersPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

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

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Company not found');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

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

  // Show loading state
  if (isLoadingWorkspaces || isLoadingCompany || isLoadingMembers) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erişim Reddedildi
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  // Create custom breadcrumbs with company name
  const breadcrumbs = [
    {
      label: company?.name || 'Şirket',
      href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`,
      isLast: false
    },
    {
      label: 'Üyeler',
      isLast: true
    }
  ];

  return (
    <PageWrapper
      title="Üyeler"
      description={`${company?.name || 'Şirket'} - Üye yönetimi`}
      breadcrumbs={breadcrumbs}
      actions={
        <Button 
          variant="outline" 
          onClick={() => router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>
              {members.length > 0 ? `${members.length} üye bulundu` : 'Henüz üye eklenmemiş'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Henüz üye yok
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Bu çalışma alanında henüz üye bulunmuyor.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Üye</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Katılma Tarihi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: WorkspaceMember) => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.image} alt={member.user.name} />
                            <AvatarFallback>
                              {member.user.name?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {member.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.role === 'owner' ? 'default' : 'secondary'}
                        >
                          {member.role === 'owner' && <Crown className="mr-1 h-3 w-3" />}
                          {member.role === 'owner' ? 'Sahip' : 'Üye'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}