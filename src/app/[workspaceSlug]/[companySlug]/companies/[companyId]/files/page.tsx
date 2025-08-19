"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PageWrapper } from "@/components/page-wrapper";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { FileText, Plus, Download } from "lucide-react";
import CompanyTabs from "../company-tabs";

interface Workspace { id: string; slug: string; name: string }
interface Company { id: string; name: string }
  interface TemplateListItem {
    id: string;
    companyId: string;
    code?: string | null;
    name: string;
    category?: string | null;
    description?: string | null;
    updatedAt: string;
    currentVersion?: {
      id: string;
      version?: string | null;
      contentType?: string | null;
      size: number;
      createdAt: string;
    } | null;
  }

export default function CompanyFilesPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces", workspaceSlug],
    queryFn: async () => {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const workspace: Workspace | null = useMemo(() => {
    return workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;
  }, [workspacesData, workspaceSlug]);

  const { data: templates = [], isLoading } = useQuery<TemplateListItem[]>({
    queryKey: ["company-files", workspace?.id, companyId, search],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const url = new URL(`/api/workspaces/${workspace.id}/companies/${companyId}/files`, window.location.origin);
      if (search) url.searchParams.set("q", search);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const { data: companyData } = useQuery<Company | null>({
    queryKey: ["company", workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const breadcrumbs = [
    { label: companyData?.name || "Şirket", href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
    { label: "Dosyalar", isLast: true },
  ];

  // Delete kept only on the detail page per UX change

  

  return (
    <CompanyPageLayout
      title="Şirket Dosyaları"
      breadcrumbs={breadcrumbs}
      actions={(
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files/add`}>
                <Button variant="default" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Yeni Dosya
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Yeni Dosya</TooltipContent>
          </Tooltip>
        </div>
      )}
      tabs={<CompanyTabs />}
    >
      <div className="space-y-6">
        <Card className="border-none shadow-none ring-0 bg-transparent" padding="none">
          <CardHeader className="p-0 hidden" />
          <CardContent className="p-0">
            <div className="flex items-center gap-3 mb-4">
              <Input
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="overflow-x-auto">
              <Table unstyledContainer>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dosya Adı</TableHead>
                    <TableHead>Versiyon</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">İndir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(templates || []).map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/files/${t.id}`)}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">{t?.currentVersion?.version ?? "-"}</TableCell>
                      <TableCell>{t?.code ?? "-"}</TableCell>
                      <TableCell>{t?.category ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {t?.currentVersion?.id && (
                          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files/${t.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-4 w-4" /> Görüntüle
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isLoading && <div className="py-6 text-sm text-muted-foreground">Yükleniyor...</div>}
              {!isLoading && templates?.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">Henüz dosya yok</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CompanyPageLayout>
  );
}


