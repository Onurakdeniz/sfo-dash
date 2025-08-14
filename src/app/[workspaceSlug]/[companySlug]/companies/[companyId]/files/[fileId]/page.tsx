"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Download, FileText, Trash2 } from "lucide-react";

interface Workspace { id: string; slug: string; name: string }
interface CompanyFile {
  id: string;
  companyId: string;
  uploadedBy?: string | null;
  name: string;
  blobUrl: string;
  blobPath?: string | null;
  contentType?: string | null;
  size: number;
  metadata?: any;
  createdAt: string;
}

export default function FileDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const fileId = params.fileId as string;
  const queryClient = useQueryClient();

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

  const { data: file, isLoading } = useQuery<CompanyFile | null>({
    queryKey: ["company-file", workspace?.id, companyId, fileId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files/${fileId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId && !!fileId,
  });

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      if (!workspace?.id) throw new Error("Workspace not found");
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      toast.success("Dosya silindi");
      queryClient.invalidateQueries({ queryKey: ["company-files", workspace?.id, companyId] });
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`);
    },
    onError: () => toast.error("Silme başarısız"),
  });

  return (
    <PageWrapper
      title="Dosya Detayları"
      description="Dosya bilgilerini görüntüleyin"
      actions={
        <div className="flex gap-2">
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
          </Link>
          {file?.blobUrl && (
            <a href={file.blobUrl} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> İndir/Görüntüle
              </Button>
            </a>
          )}
          <Button variant="outline" className="text-destructive" onClick={() => deleteFileMutation.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" /> Sil
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {file?.name || "Dosya"}
            </CardTitle>
            <CardDescription>Dosya meta bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
            {!isLoading && file && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ad</Label>
                  <div className="text-sm py-1">{file.name}</div>
                </div>
                <div>
                  <Label>Tür</Label>
                  <div className="text-sm py-1">{file.contentType || "-"}</div>
                </div>
                <div>
                  <Label>Boyut</Label>
                  <div className="text-sm py-1">{Math.ceil((file.size || 0) / 1024)} KB</div>
                </div>
                <div>
                  <Label>Yol</Label>
                  <div className="text-sm py-1 break-all">{file.blobPath || "-"}</div>
                </div>
                <div>
                  <Label>URL</Label>
                  <div className="text-sm py-1 break-all">
                    <a href={file.blobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {file.blobUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">{new Date(file.createdAt).toLocaleString("tr-TR")}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


