"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, IdCard, Phone, Briefcase, FileText, Settings2, Calendar } from "lucide-react";

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string } | null;
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

function EmployeeProfilesContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch workspace context");
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspaceId = contextData?.workspace?.id;

  const { data: members = [], isLoading: membersLoading } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as WorkspaceMember[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!workspaceId
  });

  const employees = (members || []).map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
    joinedAt: m.joinedAt
  }));

  const isLoading = contextLoading || membersLoading;

  const actions = (
    <>
      <Button variant="outline" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/users`)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Çalışan Davet Et
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="Personel Profilleri"
      description="Çalışanların kişisel, iletişim ve istihdam bilgilerini görüntüleyin ve yönetin"
      actions={actions}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kişisel Bilgiler</CardTitle>
              <IdCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Kimlik ve demografik veriler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">İletişim</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Adres ve acil durum kişiler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">İstihdam</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pozisyon, departman, çalışma türü</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Belgeler</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Sözleşme ve diğer evraklar</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Çalışan Listesi</CardTitle>
            <CardDescription>Şirket personelinin genel görünümü</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Katılma Tarihi</TableHead>
                    <TableHead className="text-right">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
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
                          <Skeleton className="h-6 w-14 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <p className="text-muted-foreground">Henüz personel bulunmuyor</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={emp.image} alt={emp.name} />
                              <AvatarFallback>{emp.name?.[0]?.toUpperCase() || emp.email?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-xs text-muted-foreground">{emp.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{emp.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString() : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">Aktif</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alt Bileşenler</CardTitle>
            <CardDescription>Personel Profilleri alt modülünün yetenekleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[ 
                { icon: IdCard, title: "Kişisel Bilgiler", desc: "Kimlik ve demografik veriler" },
                { icon: Phone, title: "İletişim Bilgileri", desc: "Adres ve acil durum kişi bilgileri" },
                { icon: Briefcase, title: "İstihdam Bilgileri", desc: "Pozisyon, departman, çalışma türü" },
                { icon: FileText, title: "Belge Yönetimi", desc: "Sözleşme ve kimlik gibi belgeler" },
                { icon: Settings2, title: "Self-Servis", desc: "Çalışanların kendi profilini güncellemesi" },
              ].map((f, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{f.title}</CardTitle>
                    </div>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default function EmployeeProfilesPage() {
  return (
    <RoleGuard requiredRoles={["owner", "admin"]} fallbackMessage="Personel yönetimine erişmek için yönetici yetkisi gereklidir.">
      <EmployeeProfilesContent />
    </RoleGuard>
  );
}


