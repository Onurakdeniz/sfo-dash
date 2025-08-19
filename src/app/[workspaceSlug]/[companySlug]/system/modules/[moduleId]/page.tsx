"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "../../system-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Module {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  // core flag removed
  sortOrder: number;
}

interface SubmoduleResource {
  id: string;
  moduleId: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  resourceType: string;
  isActive: boolean;
  sortOrder: number;
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const { data: moduleData, isLoading: isModuleLoading } = useQuery<Module>({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/system/modules/${moduleId}`);
      if (!res.ok) throw new Error("Failed to fetch module");
      return res.json();
    },
    enabled: !!moduleId,
  });

  const { data: submodules = [], isLoading: isSubmodulesLoading } = useQuery<SubmoduleResource[]>({
    queryKey: ["resources", "submodules", moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/system/resources?moduleId=${moduleId}&resourceType=submodule`);
      if (!res.ok) throw new Error("Failed to fetch submodules");
      return res.json();
    },
    enabled: !!moduleId,
  });

  const breadcrumbs = [
    { label: "Dashboard", href: `/${params.workspaceSlug}/${params.companySlug}`, isLast: false },
    { label: "Sistem", href: `/${params.workspaceSlug}/${params.companySlug}/system`, isLast: false },
    { label: "Modüller", href: `/${params.workspaceSlug}/${params.companySlug}/system/modules`, isLast: false },
    { label: moduleData?.displayName || "Modül", isLast: true },
  ];

  const actions = (
    <>
      <Button
        variant="shopifySecondary"
        onClick={() => router.push(`/${params.workspaceSlug}/${params.companySlug}/system/modules`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>
    </>
  );

  return (
    <PageWrapper
      title={moduleData?.displayName || "Modül Detayı"}
      description={moduleData?.description || "Modül detaylarını ve alt modülleri görüntüleyin"}
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{moduleData?.displayName || "Modül"}</CardTitle>
            <CardDescription>
              <span className="font-mono">{moduleData?.code}</span>
              {/* core flag removed */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isModuleLoading ? (
              <p>Modül yükleniyor...</p>
            ) : !moduleData ? (
              <p>Modül bulunamadı.</p>
            ) : (
              <div className="text-sm text-muted-foreground">
                {moduleData.description || "Açıklama yok."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alt Modüller</CardTitle>
            <CardDescription>Bu modüle bağlı alt modüller</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmodulesLoading ? (
              <p>Alt modüller yükleniyor...</p>
            ) : submodules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Alt modül yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Görünen Ad</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Sıralama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submodules
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
                    .map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.displayName}</TableCell>
                        <TableCell className="font-mono text-xs">{sub.code}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{sub.description || "-"}</TableCell>
                        <TableCell>
                          {sub.isActive ? (
                            <Badge variant="secondary">Aktif</Badge>
                          ) : (
                            <span className="text-muted-foreground">Pasif</span>
                          )}
                        </TableCell>
                        <TableCell>{sub.sortOrder}</TableCell>
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


