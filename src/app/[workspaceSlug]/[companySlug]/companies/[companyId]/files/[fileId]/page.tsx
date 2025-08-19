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
import { PageWrapper } from "@/components/page-wrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Download, FileText, Trash2, GitBranchPlus, User, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CompanyTabs from "../../company-tabs";

interface Workspace { id: string; slug: string; name: string }
interface WorkspaceContext {
  workspace: { id: string; name: string; slug: string };
  currentCompany: { id: string; name: string; slug: string };
}
  interface Attachment { id: string; name: string; blobUrl: string; contentType?: string | null; size: number }
  interface Version { id: string; version?: string | null; name: string; blobUrl: string; contentType?: string | null; size: number; createdAt: string; updatedAt?: string; createdByName?: string | null; metadata?: any; attachments: Attachment[] }
  interface TemplateDetails { template: { id: string; name: string; code?: string | null; category?: string | null; description?: string | null; createdAt: string; updatedAt: string }; versions: Version[]; uploadedByName?: string | null; updatedByName?: string | null }

export default function FileDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const fileId = params.fileId as string;
  const queryClient = useQueryClient();

  const { data: contextData, isLoading: isContextLoading } = useQuery<WorkspaceContext | null>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspaceSlug && !!companySlug,
  });
  const workspaceId = contextData?.workspace?.id;

  const { data: details, isLoading } = useQuery<TemplateDetails | null>({
    queryKey: ["company-file", workspaceId, companyId, fileId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspaceId && !!companyId && !!fileId,
  });

  // Current file version (latest)
  const file = details?.versions?.find(v => (v as any).isCurrent) || details?.versions?.[0];

  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<{ file: File; name: string }[]>([]);
  const [newVersion, setNewVersion] = useState("");
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isSubmittingAttachments, setIsSubmittingAttachments] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const openEditWithCurrent = () => {
    if (!details?.template) return;
    setEditName(details.template.name || "");
    setEditCode(String(details.template.code || ""));
    setEditCategory(String(details.template.category || ""));
    setEditDescription(String(details.template.description || ""));
    setIsEditOpen(true);
  };

  const handleSaveMeta = async () => {
    if (!workspaceId || !companyId || !fileId) return;
    setIsSavingMeta(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          code: editCode.trim() || null,
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
      queryClient.invalidateQueries({ queryKey: ["company-file", workspaceId, companyId, fileId] });
      queryClient.invalidateQueries({ queryKey: ["company-files", workspaceId, companyId] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!workspaceId || !newVersionFile || !file) return;
    setIsSubmittingVersion(true);
    try {
      const form = new FormData();
      form.append("file", newVersionFile);
      form.append("filename", newVersionFile.name);
      const uploadRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/upload-url`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("Yükleme hatası");
      const blob = await uploadRes.json();

      const putRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVersionFile.name,
          blobUrl: blob.url,
          blobPath: blob.pathname,
          size: newVersionFile.size,
          contentType: newVersionFile.type,
          version: newVersion.trim() || undefined,
          metadata: newVersion.trim() ? { version: newVersion.trim() } : {},
        }),
      });
      if (!putRes.ok) throw new Error("Yeni versiyon oluşturulamadı");
      const created = await putRes.json();
      toast.success("Yeni versiyon oluşturuldu");
      setIsVersionOpen(false);
      setNewVersionFile(null);
      setNewVersion("");
      // Refresh details and file lists
      queryClient.invalidateQueries({ queryKey: ["company-file", workspaceId, companyId, fileId] });
      queryClient.invalidateQueries({ queryKey: ["company-files", workspaceId, companyId] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  const handleAddAttachments = async () => {
    if (!workspaceId || !file || attachmentFiles.length === 0) return;
    setIsSubmittingAttachments(true);
    try {
      let createdCount = 0;
      for (const item of attachmentFiles) {
        const f = item.file;
        const form = new FormData();
        form.append("file", f);
        form.append("filename", f.name);
        const uploadRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/upload-url`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Yükleme hatası");
        const blob = await uploadRes.json();

        const putRes = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}/attachments`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            blobUrl: blob.url,
            blobPath: blob.pathname,
            size: f.size,
            contentType: f.type,
            versionId: file.id,
            version: file.version || file.metadata?.version,
          }),
        });
        if (!putRes.ok) throw new Error("Ek oluşturulamadı");
        createdCount += 1;
      }
      toast.success(`${createdCount} ek yüklendi`);
      setAttachmentFiles([]);
      setIsAttachmentsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["company-file", workspaceId, companyId, fileId] });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setIsSubmittingAttachments(false);
    }
  };

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Workspace not found");
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      toast.success("Dosya silindi");
      queryClient.invalidateQueries({ queryKey: ["company-files", workspaceId, companyId] });
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`);
    },
    onError: () => toast.error("Silme başarısız"),
  });

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri
        </Button>
      </Link>
      {details?.versions?.[0]?.blobUrl && (
        <a href={details.versions[0].blobUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> İndir/Görüntüle
          </Button>
        </a>
      )}
      <Dialog open={isVersionOpen} onOpenChange={setIsVersionOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <GitBranchPlus className="mr-2 h-4 w-4" /> Yeni Versiyon
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Versiyon Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Dosya</Label>
              <Input type="file" onChange={(e) => setNewVersionFile((e.target.files && e.target.files[0]) || null)} />
            </div>
            <div className="grid gap-2">
              <Label>Versiyon</Label>
              <Input value={newVersion} onChange={(e) => setNewVersion(e.target.value)} placeholder={String(file?.version || file?.metadata?.version || "v1.0.1")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionOpen(false)}>İptal</Button>
            <Button onClick={handleCreateVersion} disabled={!newVersionFile || isSubmittingVersion || !newVersion.trim() || newVersion.trim() === String(file?.version || file?.metadata?.version || "")}>
              <UploadCloud className="mr-2 h-4 w-4" /> {isSubmittingVersion ? "Yükleniyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAttachmentsOpen} onOpenChange={setIsAttachmentsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UploadCloud className="mr-2 h-4 w-4" /> Ek Ekle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ek Dosyalar Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Dosyalar</Label>
              <Input type="file" multiple onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []).map(f => ({ file: f, name: f.name })))} />
              {attachmentFiles.length > 0 && (
                <div className="text-xs text-muted-foreground">{attachmentFiles.length} dosya seçildi</div>
              )}
            </div>
            {attachmentFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Ek İsimleri</Label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {attachmentFiles.map((att, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate" title={att.file.name}>Dosya: {att.file.name}</span>
                      </div>
                      <Input
                        value={att.name}
                        onChange={(e) =>
                          setAttachmentFiles(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))
                        }
                        placeholder="Ek adı"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">Bu ekler aynı kod ve versiyon altında ilişkilendirilecektir.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttachmentsOpen(false)}>İptal</Button>
            <Button onClick={handleAddAttachments} disabled={attachmentFiles.length === 0 || attachmentFiles.some(a => !a.name.trim()) || isSubmittingAttachments}>
              <UploadCloud className="mr-2 h-4 w-4" /> {isSubmittingAttachments ? "Yükleniyor..." : "Yükle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              <Label>Kod</Label>
              <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} placeholder="Opsiyonel benzersiz kod" />
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Örn. İnsan Kaynakları" />
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
    <PageWrapper
      title="Dosya Detayları"
      description="Dosya bilgilerini görüntüleyin"
      breadcrumbs={[
        { label: contextData?.currentCompany?.name || "Şirket", href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
        { label: "Dosyalar", href: `/${workspaceSlug}/${companySlug}/companies/${companyId}/files`, isLast: false },
        { label: "Detaylar", isLast: true },
      ]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> {details?.template?.name || "Dosya"}
              </CardTitle>
              <CardDescription>Dosya meta bilgileri</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openEditWithCurrent}>Düzenle</Button>
            </div>
          </CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* Title duplicated above for header layout; keep for structure or remove if desired */}
            </CardTitle>
          <CardContent className="space-y-4">
            {(isContextLoading || isLoading) && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
            {!isContextLoading && !isLoading && !details && (
              <div className="text-sm text-muted-foreground">Kayıt bulunamadı veya erişim yok.</div>
            )}
            {!isContextLoading && !isLoading && details && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ad</Label>
                  <div className="text-sm py-1">{details.template.name}</div>
                </div>
                <div>
                  <Label>Oluşturan</Label>
                  <div className="text-sm py-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{details.uploadedByName || "-"}</span>
                  </div>
                </div>
                {details.template.code && (
                  <div>
                    <Label>Kod</Label>
                    <div className="text-sm py-1">{String(details.template.code)}</div>
                  </div>
                )}
                {details.versions?.[0]?.version && (
                  <div>
                    <Label>Versiyon</Label>
                    <div className="text-sm py-1">{String(details.versions?.[0]?.version)}</div>
                  </div>
                )}
                {details.template.category && (
                  <div>
                    <Label>Kategori</Label>
                    <div className="text-sm py-1">{String(details.template.category)}</div>
                  </div>
                )}
                <div>
                  <Label>Tür</Label>
                  <div className="text-sm py-1">{details.versions?.[0]?.contentType || "-"}</div>
                </div>
                <div>
                  <Label>Boyut</Label>
                  <div className="text-sm py-1">{Math.ceil((details.versions?.[0]?.size || 0) / 1024)} KB</div>
                </div>
                {Array.isArray(details.versions?.[0]?.metadata?.tags) && details.versions?.[0]?.metadata?.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <Label>Etiketler</Label>
                    <div className="text-sm py-1 flex flex-wrap gap-2">
                      {details.versions?.[0]?.metadata?.tags.map((t: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs">{String(t)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {details.template.description && (
                  <div className="md:col-span-2">
                    <Label>Açıklama</Label>
                    <div className="text-sm py-1 whitespace-pre-wrap">{String(details.template.description)}</div>
                  </div>
                )}
                {file?.metadata?.referenceNumber && (
                  <div>
                    <Label>Referans No</Label>
                    <div className="text-sm py-1">{String(file?.metadata?.referenceNumber)}</div>
                  </div>
                )}
                {(file?.metadata?.departmentName || file?.metadata?.departmentId) && (
                  <div>
                    <Label>Departman</Label>
                    <div className="text-sm py-1">{String(file?.metadata?.departmentName || file?.metadata?.departmentId)}</div>
                  </div>
                )}
                {(file?.metadata?.unitName || file?.metadata?.unitId) && (
                  <div>
                    <Label>Birim</Label>
                    <div className="text-sm py-1">{String(file?.metadata?.unitName || file?.metadata?.unitId)}</div>
                  </div>
                )}
                {file?.metadata?.effectiveDate && (
                  <div>
                    <Label>Başlangıç Tarihi</Label>
                    <div className="text-sm py-1">{String(file?.metadata?.effectiveDate)}</div>
                  </div>
                )}
                {file?.metadata?.expiryDate && (
                  <div>
                    <Label>Bitiş Tarihi</Label>
                    <div className="text-sm py-1">{String(file?.metadata?.expiryDate)}</div>
                  </div>
                )}
                <div>
                  <Label>URL</Label>
                  <div className="text-sm py-1 break-all">
                    <a href={details.versions?.[0]?.blobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {details.versions?.[0]?.blobUrl}
                    </a>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Versiyonlar</Label>
                  <div className="mt-2">
                    <Table containerClassName="overflow-x-visible">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Durum</TableHead>
                          <TableHead>Versiyon</TableHead>
                          <TableHead>Oluşturan</TableHead>
                          <TableHead>Oluşturulma</TableHead>
                          <TableHead>Tür</TableHead>
                          <TableHead>Boyut</TableHead>
                          <TableHead>Dosya Adı</TableHead>
                          <TableHead>İndir</TableHead>
                          <TableHead>Ekler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.versions.map(v => {
                          const isLive = (v as any).isCurrent;
                          const typeText = v.contentType || "-";
                          const typeTruncated = typeText && typeText.length > 20 ? typeText.slice(0, 20) + "…" : typeText;
                          return (
                          <TableRow key={v.id}>
                            <TableCell>
                              {isLive ? (
                                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-500/10 text-green-600">Canlı</span>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="xs" variant="outline">Canlı Yap</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Bu versiyonu canlı yapmak istiyor musunuz?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu işlem mevcut canlı versiyonu devre dışı bırakır ve bu versiyonu canlı yapar.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/${fileId}/versions/${v.id}/make-current`, { method: "POST", credentials: "include" });
                                            if (!res.ok) throw new Error("Versiyon canlı yapılamadı");
                                            toast.success("Versiyon canlı yapıldı");
                                            queryClient.invalidateQueries({ queryKey: ["company-file", workspaceId, companyId, fileId] });
                                          } catch (err) {
                                            console.error(err);
                                            toast.error(err instanceof Error ? err.message : "Hata oluştu");
                                          }
                                        }}
                                      >Onayla</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{v.version || "-"}</TableCell>
                            <TableCell>{v.createdByName || "-"}</TableCell>
                            <TableCell>{new Date(v.createdAt).toLocaleString("tr-TR")}</TableCell>
                            <TableCell title={typeText}>{typeTruncated}</TableCell>
                            <TableCell>{Math.ceil((v.size || 0) / 1024)} KB</TableCell>
                            <TableCell className="max-w-[240px] truncate" title={v.name}>{v.name}</TableCell>
                            <TableCell>
                              <a href={v.blobUrl} target="_blank" rel="noreferrer" className="text-xs underline">İndir</a>
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              {v.attachments.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Ek yok</span>
                              ) : (
                                <div className="flex flex-col gap-1">
                          {v.attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-3 text-xs">
                                      <span className="inline-flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate max-w-[220px]" title={att.name}>Ek Adı: {att.name}</span>
                                      </span>
                                      <a href={att.blobUrl} target="_blank" rel="noreferrer" className="underline">İndir</a>
                                      <span className="text-muted-foreground">({Math.ceil((att.size || 0) / 1024)} KB{att.contentType ? ` · ${att.contentType}` : ''})</span>
                      </div>
                    ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">Oluşturma: {new Date(details.template.createdAt).toLocaleString("tr-TR")}</div>
                  </div>
                  {details.template.updatedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">Güncelleme: {new Date(details.template.updatedAt).toLocaleString("tr-TR")} {details.updatedByName ? `(by ${details.updatedByName})` : ""}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


