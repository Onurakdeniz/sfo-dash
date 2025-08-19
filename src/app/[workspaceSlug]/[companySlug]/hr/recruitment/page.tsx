"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { User, Briefcase, Phone, CreditCard, GraduationCap, Award, Heart, FileText, Shield, CheckCircle2, Circle, Users, UserCheck } from "lucide-react";

type ProfileData = {
  fullName?: string | null;
  nationalId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  position?: string | null;
  employmentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  metadata?: any;
};

export default function RecruitmentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const { data: contextData } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });
  const workspaceId = contextData?.workspace?.id as string | undefined;
  const companyId = contextData?.currentCompany?.id as string | undefined;

  // Members in the workspace
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  // Fetch all employee profiles for onboarding status
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["all-employee-profiles", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [];
      const profilePromises = (members as any[]).map(async (member) => {
        try {
          const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${member.user.id}`, { credentials: "include" });
          if (res.status === 404) return { userId: member.user.id, profile: null };
          if (!res.ok) return { userId: member.user.id, profile: null };
          const profile = await res.json();
          return { userId: member.user.id, profile };
        } catch {
          return { userId: member.user.id, profile: null };
        }
      });
      return Promise.all(profilePromises);
    },
    enabled: !!(workspaceId && companyId && members.length > 0),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: ProfileData }) => {
      if (!workspaceId || !companyId || !employeeId) throw new Error("Missing IDs");
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}` ,{
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-profiles", workspaceId, companyId] });
    }
  });

  // Compute onboarding status for all members
  const membersWithOnboarding = useMemo(() => {
    return (members as any[]).map((member) => {
      const profileData = (allProfiles as any[]).find(p => p.userId === member.user.id)?.profile;
      const normalizedProfile = profileData ? {
        fullName: profileData.fullName ?? member.user.name ?? "",
        nationalId: profileData.nationalId ?? null,
        birthDate: profileData.birthDate ?? null,
        gender: profileData.gender ?? null,
        address: profileData.address ?? null,
        phone: profileData.phone ?? null,
        position: profileData.position ?? null,
        employmentType: profileData.employmentType ?? null,
        startDate: profileData.startDate ?? null,
        endDate: profileData.endDate ?? null,
        metadata: {
          ...(profileData.metadata || {}),
          workHistory: Array.isArray(profileData.metadata?.workHistory) ? profileData.metadata.workHistory : [],
          educations: Array.isArray(profileData.metadata?.educations) ? profileData.metadata.educations : [],
          certificates: Array.isArray(profileData.metadata?.certificates) ? profileData.metadata.certificates : [],
          bankAccounts: Array.isArray(profileData.metadata?.bankAccounts) ? profileData.metadata.bankAccounts : [],
          health: profileData.metadata?.health || {},
          onboarding: profileData.metadata?.onboarding || {},
        },
      } : null;

      const md = normalizedProfile?.metadata || {};
      const steps = [
        { done: Boolean(normalizedProfile?.birthDate && normalizedProfile?.gender) },
        { done: Boolean(normalizedProfile?.nationalId) },
        { done: Boolean(normalizedProfile?.position && normalizedProfile?.startDate && normalizedProfile?.employmentType) },
        { done: Boolean(normalizedProfile?.address && normalizedProfile?.phone) },
        { done: (md?.bankAccounts?.length ?? 0) > 0 },
        { done: (md?.educations?.length ?? 0) > 0 },
        { done: (md?.certificates?.length ?? 0) > 0 },
        { done: Boolean(md?.health?.bloodType || md?.health?.isDisabled || md?.health?.notes) },
        { done: Boolean(md?.onboarding?.filesPrepared) },
        { done: Boolean(md?.onboarding?.roleAssigned) },
      ];
      const completed = steps.filter(s => s.done).length;
      const total = steps.length;
      const isCompleted = completed >= total;

      return {
        ...member,
        profile: normalizedProfile,
        onboarding: { completed, total, isCompleted },
      };
    });
  }, [members, allProfiles]);

  const completedMembers = useMemo(() => membersWithOnboarding.filter(m => m.onboarding.isCompleted), [membersWithOnboarding]);
  const uncompletedMembers = useMemo(() => membersWithOnboarding.filter(m => !m.onboarding.isCompleted), [membersWithOnboarding]);

  const [selectedTab, setSelectedTab] = useState("uncompleted");

  const setOnboardingFlag = (employeeId: string, key: "filesPrepared" | "roleAssigned", value: boolean) => {
    const memberData = membersWithOnboarding.find(m => m.user.id === employeeId);
    if (!memberData?.profile) return;
    const next = {
      ...memberData.profile,
      metadata: {
        ...(memberData.profile.metadata || {}),
        onboarding: {
          ...((memberData.profile.metadata || {}).onboarding || {}),
          [key]: value,
        },
      },
    } as any;
    saveMutation.mutate({ employeeId, data: next });
  };

  return (
    <RoleGuard requiredRoles={["owner", "admin"]} fallbackMessage="İşe alım yönetimine erişmek için yönetici yetkisi gereklidir.">
      <PageWrapper
        title="İşe Alım"
        description="Aday süreçleri ve yeni personel onboarding adımları"
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="uncompleted" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tamamlanmamış ({uncompletedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Tamamlanan ({completedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uncompleted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Tamamlanmamış Personel</CardTitle>
                <CardDescription>İşe alım sürecini tamamlamamış personeller</CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : uncompletedMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Tüm personeller onboarding sürecini tamamlamış!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personel</TableHead>
                        <TableHead>İlerleme</TableHead>
                        <TableHead>Pozisyon</TableHead>
                        <TableHead>Dosyalar</TableHead>
                        <TableHead>Roller</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uncompletedMembers.map((member) => (
                        <TableRow key={member.user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.image || undefined} />
                                <AvatarFallback>{(member.user.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.profile?.fullName || member.user.name || member.user.email}</div>
                                <div className="text-xs text-muted-foreground">{member.user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-24">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>{member.onboarding.completed}/{member.onboarding.total}</span>
                                <span>{Math.round((member.onboarding.completed / member.onboarding.total) * 100)}%</span>
                              </div>
                              <Progress value={(member.onboarding.completed / member.onboarding.total) * 100} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{member.profile?.position || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {member.profile?.metadata?.onboarding?.filesPrepared ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Switch
                                size="sm"
                                checked={Boolean(member.profile?.metadata?.onboarding?.filesPrepared)}
                                onCheckedChange={(checked) => setOnboardingFlag(member.user.id, "filesPrepared", checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {member.profile?.metadata?.onboarding?.roleAssigned ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Switch
                                size="sm"
                                checked={Boolean(member.profile?.metadata?.onboarding?.roleAssigned)}
                                onCheckedChange={(checked) => setOnboardingFlag(member.user.id, "roleAssigned", checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/hr/employees/${member.user.id}`)}>
                              Profil
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Tamamlanan Personel</CardTitle>
                <CardDescription>İşe alım sürecini başarıyla tamamlayan personeller</CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : completedMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz onboarding tamamlayan personel yok.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {completedMembers.map((member) => (
                      <Card key={member.user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.user.image || undefined} />
                              <AvatarFallback>{(member.user.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{member.profile?.fullName || member.user.name || member.user.email}</div>
                              <div className="text-xs text-muted-foreground truncate">{member.profile?.position || "Pozisyon belirtilmemiş"}</div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>Dosyalar</span>
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Rol Ataması</span>
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Başlama Tarihi</span>
                              <span>{member.profile?.startDate ? new Date(member.profile.startDate).toLocaleDateString('tr-TR') : "-"}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <Button size="sm" variant="outline" className="w-full" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/hr/employees/${member.user.id}`)}>
                              Profili Görüntüle
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
        </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageWrapper>
    </RoleGuard>
  );
}