"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import CustomerTabs from "../../customer-tabs";

type WorkspaceContext = {
  workspace: { id: string; name: string; slug: string };
  currentCompany: { id: string; name: string; slug: string };
};

type CustomerFile = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  blobUrl: string;
  contentType?: string | null;
  size: number;
  metadata?: any;
  createdAt: string;
  updatedAt?: string | null;
  uploadedBy?: string | null;
  updatedBy?: string | null;
};

export default function CustomerFileDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const customerId = params.customerId as string;
  const fileId = params.fileId as string;
  const queryClient = useQueryClient();

  const { data: contextData } = useQuery<WorkspaceContext | null>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspaceSlug && !!companySlug,
  });
  const workspaceId = contextData?.workspace?.id;
  const companyId = contextData?.currentCompany?.id;

  const { data: file, isLoading } = useQuery<CustomerFile | null>({
    queryKey: ["customer-file", workspaceId, companyId, customerId, fileId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return null;
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files/${fileId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspaceId && !!companyId && !!customerId && !!fileId,
  });

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !companyId) throw new Error("Workspace/company not found");
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Silme başarısız");
    },
    onSuccess: () => {
      toast.success("Dosya silindi");
      queryClient.invalidateQueries({ queryKey: ["customer-files", workspaceId, companyId, customerId] });
      router.push(`/${workspaceSlug}/${companySlug}/customers/${customerId}/files`);
    },
    onError: () => toast.error("Silme başarısız"),
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const openEditWithCurrent = () => {
    if (!file) return;
    setEditName(file.name || "");
    setEditCategory(String(file.category || ""));
    setEditDescription(String(file.description || ""));
    setIsEditOpen(true);
  };

  const handleSaveMeta = async () => {
    if (!workspaceId || !companyId || !fileId) return;
    setIsSavingMeta(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files/${fileId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          category: editCategory.trim() || null,
          description: editDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Güncelleme başarısız");
      }
      toast.success("Dosya bilgileri güncellendi");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customer-file", workspaceId, companyId, customerId, fileId] });
      queryClient.invalidateQueries({ queryKey: ["customer-files", workspaceId, companyId, customerId] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link href={`/${workspaceSlug}/${companySlug}/customers/${customerId}/files`}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri
        </Button>
      </Link>
      {file?.blobUrl && (
        <a href={file.blobUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> İndir/Görüntüle
          </Button>
        </a>
      )}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={openEditWithCurrent}>
            Düzenle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dosya Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Ad</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Örn. Sözleşme" />
            </div>
            <div className="grid gap-2">
              <Label>Açıklama</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>İptal</Button>
            <Button onClick={handleSaveMeta} disabled={isSavingMeta || !editName.trim()}>
              {isSavingMeta ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteFileMutation.mutate()}>
        <Trash2 className="mr-2 h-4 w-4" /> Sil
      </Button>
    </div>
  );

  return (
    <CompanyPageLayout
      title="Dosya Detayları"
      description="Dosya bilgilerini görüntüleyin"
      actions={headerActions}
      tabs={<CustomerTabs />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> {file?.name || "Dosya"}
              </CardTitle>
              <CardDescription>Dosya meta bilgileri</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
            {!isLoading && !file && (
              <div className="text-sm text-muted-foreground">Kayıt bulunamadı veya erişim yok.</div>
            )}
            {!isLoading && file && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ad</Label>
                  <div className="text-sm py-1">{file.name}</div>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <div className="text-sm py-1">{file.category || "-"}</div>
                </div>
                <div>
                  <Label>Tür</Label>
                  <div className="text-sm py-1">{file.contentType || "-"}</div>
                </div>
                <div>
                  <Label>Boyut</Label>
                  <div className="text-sm py-1">{Math.ceil((file.size || 0) / 1024)} KB</div>
                </div>
                {file.description && (
                  <div className="md:col-span-2">
                    <Label>Açıklama</Label>
                    <div className="text-sm py-1 whitespace-pre-wrap">{file.description}</div>
                  </div>
                )}
                {file.blobUrl && (
                  <div className="md:col-span-2">
                    <Label>URL</Label>
                    <div className="text-sm py-1 break-all">
                      <a href={file.blobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {file.blobUrl}
                      </a>
                    </div>
                  </div>
                )}
                {file.metadata && (
                  <div className="md:col-span-2">
                    <Label>Metadata</Label>
                    <pre className="text-xs p-3 rounded-md bg-muted overflow-auto max-h-64">{JSON.stringify(file.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyPageLayout>
  );
}


