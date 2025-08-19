"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Mail, Crown, User as UserIcon } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  // Fetch all workspaces and find by slug
  const { data: workspacesData } = useQuery({
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

  return (
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
  );
}