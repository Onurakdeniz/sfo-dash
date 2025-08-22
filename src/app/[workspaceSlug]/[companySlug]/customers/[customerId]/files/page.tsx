"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, FolderOpen, ArrowLeft, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import CustomerTabs from "../customer-tabs";

type WorkspaceContext = { workspace: { id: string; slug: string; name: string }; currentCompany: { id: string; name: string; slug: string } };

type CustomerFile = {
  id: string;
  name: string;
  category: string | null;
  description?: string | null;
  size?: number;
  blobUrl?: string;
  createdAt: string;
  uploadedBy?: string | null;
};

export default function CustomerFilesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const customerId = params.customerId as string;
  const router = useRouter();
  const { toast } = useToast();
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

  const [search, setSearch] = useState("");

  const { data: files = [], isLoading } = useQuery<CustomerFile[]>({
    queryKey: ["customer-files", workspaceId, companyId, customerId, search],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [];
      const url = new URL(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files`, window.location.origin);
      if (search) url.searchParams.set("q", search);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workspaceId && !!companyId && !!customerId,
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [customMetadata, setCustomMetadata] = useState("");

  const buildMetadata = () => {
    let meta: any = {};
    if (customMetadata.trim()) {
      try {
        meta = JSON.parse(customMetadata.trim());
      } catch (e) {
        toast({ title: "Hata", description: "Geçersiz metadata JSON", variant: "destructive" });
        throw e;
      }
    }
    return meta;
  };

  const handleUpload = async () => {
    if (!workspaceId || !companyId) return;
    if (!selectedFiles.length) {
      toast({ title: "Uyarı", description: "Lütfen bir dosya seçin", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      let createdCount = 0;
      for (const file of selectedFiles) {
        const form = new FormData();
        form.append("file", file);
        form.append("filename", file.name);
        const uploadRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files/upload-url`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Yükleme hatası");
        const blob = await uploadRes.json();

        const meta = buildMetadata();
        const finalName = selectedFiles.length === 1 && name.trim() ? name.trim() : file.name;
        const finalCategory = category.trim() ? category.trim() : null;
        const finalDescription = description.trim() ? description.trim() : null;

        const createRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/customers/${customerId}/files`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            blobUrl: blob.url,
            blobPath: blob.pathname,
            contentType: file.type,
            size: file.size,
            metadata: meta,
            category: finalCategory,
            description: finalDescription,
          }),
        });
        if (!createRes.ok) throw new Error("Kayıt oluşturulamadı");
        createdCount += 1;
      }
      toast({ title: "Başarılı", description: `${createdCount} dosya yüklendi` });
      setSelectedFiles([]);
      setName("");
      setCategory("");
      setDescription("");
      setCustomMetadata("");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customer-files", workspaceId, companyId, customerId] });
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Hata oluştu", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CompanyPageLayout
      title="Dosyalar"
      description="Müşteri dosyalarını yönetin"
      className="p-0"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="shopifySecondary" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="shopifyPrimary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Dosya Yükle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Dosya</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <Input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                <div className="grid gap-2">
                  <Label>Ad</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dosya adı (tek dosyada isteğe bağlı)" />
                </div>
                <div className="grid gap-2">
                  <Label>Kategori</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Örn. Sözleşme" />
                </div>
                <div className="grid gap-2">
                  <Label>Açıklama</Label>
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Metadata (JSON)</Label>
                  <Textarea rows={4} value={customMetadata} onChange={(e) => setCustomMetadata(e.target.value)} placeholder='{"key": "value"}' />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>{isUploading ? "Yükleniyor..." : "Yükle"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
      tabs={<CustomerTabs />}
    >
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-12">Yükleniyor...</CardContent>
          </Card>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Henüz dosya yüklenmemiş</h3>
              <p className="text-sm text-muted-foreground mb-6">Bu müşteriye ait dosyalar henüz yüklenmemiş. İlk dosyayı yüklemek için butona tıklayın.</p>
              <Button variant="shopifyPrimary" size="lg" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                İlk Dosyayı Yükle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getFileEmoji(file.name)}</div>
                        <div className="space-y-2 flex-1">
                          <div>
                            <h4 className="font-medium text-sm truncate" title={file.name}>{file.name}</h4>
                            {file.category && <Badge variant="outline" className="text-xs mt-1">{file.category}</Badge>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Boyut: {formatFileSize(file.size)}</p>
                            <p className="text-xs text-muted-foreground">Yüklenme: {new Date(file.createdAt).toLocaleDateString("tr-TR")}</p>
                          </div>
                          {file.description && (<p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button variant="shopifyOutline" size="sm" className="flex-1" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/customers/${customerId}/files/${file.id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> Görüntüle
                      </Button>
                      {file.blobUrl && (
                        <a href={file.blobUrl} target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="shopifyOutline" size="sm" className="w-full"><Download className="h-4 w-4 mr-1" /> İndir</Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}


      </div>
    </CompanyPageLayout>
  );
}

function getFileEmoji(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
      return "📝";
    case "xls":
    case "xlsx":
      return "📊";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "🖼️";
    default:
      return "📄";
  }
}
