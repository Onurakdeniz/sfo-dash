"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, FileText, Trash2, UploadCloud } from "lucide-react";
import EmployeeSecondaryNav from "../employee-secondary-nav";

type Workspace = { id: string; slug: string; name: string };

type EmployeeFile = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  blobUrl: string;
  contentType?: string | null;
  size: number;
  createdAt: string;
};

export default function EmployeeFilesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;
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

  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [customMetadata, setCustomMetadata] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contextData } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });
  const companyId = contextData?.currentCompany?.id as string | undefined;

  const { data: files = [], isLoading } = useQuery<EmployeeFile[]>({
    queryKey: ["employee-files", workspace?.id, companyId, employeeId, search],
    queryFn: async () => {
      if (!workspace?.id || !companyId) return [] as EmployeeFile[];
      const url = new URL(`/api/workspaces/${workspace.id}/companies/${companyId}/employees/${employeeId}/files`, window.location.origin);
      if (search) url.searchParams.set("q", search);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [] as EmployeeFile[];
      return res.json();
    },
    enabled: !!(workspace?.id && companyId && employeeId),
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!workspace?.id || !companyId) throw new Error("Workspace/company not found");
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/employees/${employeeId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Silme başarısız");
    },
    onSuccess: () => {
      toast.success("Dosya silindi");
      queryClient.invalidateQueries({ queryKey: ["employee-files", workspace?.id, companyId, employeeId] });
    },
    onError: () => toast.error("Silme başarısız"),
  });

  const buildMetadata = (): Record<string, any> => {
    const meta: Record<string, any> = {};
    if (customMetadata.trim()) {
      try {
        const parsed = JSON.parse(customMetadata);
        if (parsed && typeof parsed === "object") Object.assign(meta, parsed);
      } catch (e) {
        toast.error("Geçersiz özel metadata JSON");
        throw e;
      }
    }
    return meta;
  };

  const handleUpload = async () => {
    if (!workspace?.id || !companyId) return;
    if (!selectedFiles.length) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }
    setIsUploading(true);
    try {
      let createdCount = 0;
      for (const file of selectedFiles) {
        const form = new FormData();
        form.append("file", file);
        form.append("filename", file.name);
        const uploadRes = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/employees/${employeeId}/files/upload-url`, {
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

        const createRes = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/employees/${employeeId}/files`, {
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
      toast.success(`${createdCount} dosya yüklendi`);
      setSelectedFiles([]);
      setName("");
      setCategory("");
      setDescription("");
      setCustomMetadata("");
      queryClient.invalidateQueries({ queryKey: ["employee-files", workspace?.id, companyId, employeeId] });
      setIsDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageWrapper
      title="Personel Dosyaları"
      description="Çalışanın dosyalarını görüntüleyin ve yönetin"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dosyalar</CardTitle>
              <CardDescription>İş sözleşmesi, kimlik fotokopisi, diploma vb. belgeleri yükleyin ve güvenle saklayın.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UploadCloud className="mr-2 h-4 w-4" /> Dosya Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Dosya Ekle</DialogTitle>
                    <DialogDescription>Dosyayı seçin ve detayları doldurun</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid gap-2">
                      <Label>Dosyalar</Label>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedFiles(files);
                          if (files.length === 1 && !name) setName(files[0].name);
                        }}
                      />
                      {selectedFiles.length > 0 && (
                        <div className="text-xs text-muted-foreground">{selectedFiles.length} dosya seçildi</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Ad (tek dosya için)</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Örn: Kimlik Fotokopisi.pdf"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Kategori</Label>
                        <Input
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Örn: Sözleşme, Diploma, Kimlik"
                        />
                      </div>
                      <div className="md:col-span-2 grid gap-2">
                        <Label>Açıklama</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Belge hakkında kısa açıklama"
                        />
                      </div>
                      <div className="md:col-span-2 grid gap-2">
                        <Label>Özel Metadata (JSON)</Label>
                        <Textarea
                          value={customMetadata}
                          onChange={(e) => setCustomMetadata(e.target.value)}
                          placeholder='Örn: {"origin":"e-imza","priority":"high"}'
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">İptal</Button>
                    </DialogClose>
                    <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
                      <UploadCloud className="mr-2 h-4 w-4" /> {isUploading ? "Yükleniyor..." : "Yükle"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
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
                    <TableHead>Ad</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Boyut</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(files || []).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <a href={f.blobUrl} target="_blank" rel="noreferrer" className="hover:underline">{f.name}</a>
                        </div>
                      </TableCell>
                      <TableCell>{f.category || "-"}</TableCell>
                      <TableCell title={f.contentType || undefined}>{(f.contentType || "-")}</TableCell>
                      <TableCell>{Math.ceil((f.size || 0) / 1024)} KB</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={f.blobUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-4 w-4" /> İndir
                            </Button>
                          </a>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteFileMutation.mutate(f.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isLoading && <div className="py-6 text-sm text-muted-foreground">Yükleniyor...</div>}
              {!isLoading && files?.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">Henüz dosya yok</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


