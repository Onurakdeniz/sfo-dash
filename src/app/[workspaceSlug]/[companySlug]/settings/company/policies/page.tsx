"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import SettingsTabs from "../../settings-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Edit, Trash2, Eye, Archive, CheckSquare } from "lucide-react";

const fetchPolicies = async (workspaceId?: string, companyId?: string) => {
  try {
    const qp = new URLSearchParams();
    if (workspaceId) qp.set("workspaceId", workspaceId);
    if (companyId) qp.set("companyId", companyId);
    const response = await fetch(`/api/system/policies?${qp.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch policies");
    return await response.json();
  } catch (error) {
    console.error("Error fetching policies:", error);
    return [];
  }
};

const policyTypes = [
  { value: "privacy", label: "Gizlilik Politikası" },
  { value: "terms", label: "Hizmet Şartları" },
  { value: "compliance", label: "Uyumluluk Politikası" },
  { value: "security", label: "Güvenlik Politikası" },
  { value: "data", label: "Veri Yönetimi Politikası" },
  { value: "other", label: "Diğer" }
];

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function CompanyPoliciesPage() {
  const params = useParams();
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: contextData } = useQuery<any>({
    queryKey: ["workspace-context", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!res.ok) throw new Error("Failed to load context");
      return res.json();
    }
  });

  useEffect(() => {
    loadPolicies();
  }, [contextData]);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const workspaceId = contextData?.workspace?.id;
      const companyId = contextData?.currentCompany?.id;
      const policiesData = await fetchPolicies(workspaceId, companyId);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper title="Platform Politikaları" description="Seçili şirket için politikaları yönetin" secondaryNav={<SettingsTabs />}> 
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Politikalar</h2>
            <p className="text-muted-foreground">Bu şirket için geçerli politikaları oluşturun ve yönetin</p>
          </div>
          <Button onClick={() => router.push(`/${params.workspaceSlug}/${params.companySlug}/settings/company/policies/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Politika
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Politika</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yayınlanan</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.filter((p: any) => p.status === 'published').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taslak</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.filter((p: any) => p.status === 'draft').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atanmış</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.filter((p: any) => (p.assignedCompanies || 0) > 0).length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Politika Listesi</CardTitle>
            <CardDescription>Şirkete atanmış politikalar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Atamalar</TableHead>
                  <TableHead>Son Güncelleme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>
                ) : policies.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>Kayıt bulunamadı</TableCell></TableRow>
                ) : (
                  policies.map((policy: any) => (
                    <TableRow key={policy.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{policy.title}</TableCell>
                      <TableCell>{policyTypes.find((t) => t.value === policy.type)?.label || policy.type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[policy.status] || ''}>
                          {policy.status === 'draft' && 'Taslak'}
                          {policy.status === 'published' && 'Yayınlandı'}
                          {policy.status === 'archived' && 'Arşivlendi'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{policy.assignedCompanies || 0} Şirket</span>
                      </TableCell>
                      <TableCell>{policy.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${params.workspaceSlug}/${params.companySlug}/settings/company/policies/${policy.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${params.workspaceSlug}/${params.companySlug}/settings/company/policies/${policy.id}/assign`);
                          }}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


