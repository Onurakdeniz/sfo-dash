"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";
import { UploadCloud, Trash2, Eye, FileText, ArrowLeft } from "lucide-react";

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

export default function CompanyFilesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const { data: files = [], isLoading } = useQuery<CompanyFile[]>({
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

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
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
    },
    onError: () => toast.error("Silme başarısız"),
  });

  const onFileChosen = async (file: File) => {
    if (!workspace?.id) return;
    try {
      // Ask server for a signed upload URL
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files/upload-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, access: "public" }),
      });
      if (!res.ok) throw new Error("Upload URL alınamadı");
      const { uploadUrl, pathname, key } = await res.json();

      // Upload directly to Blob
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Blob yükleme başarısız");
      const blob = await uploadRes.json();

      // Persist metadata
      const metaRes = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          blobUrl: blob.url,
          blobPath: blob.pathname ?? pathname ?? key,
          contentType: file.type,
          size: file.size,
          metadata: { lastModified: file.lastModified },
        }),
      });
      if (!metaRes.ok) throw new Error("Failed to save metadata");

      toast.success("Dosya yüklendi");
      queryClient.invalidateQueries({ queryKey: ["company-files", workspace.id, companyId] });
    } catch (err) {
      console.error(err);
      toast.error("Yükleme başarısız");
    }
  };

  return (
    <PageWrapper
      title="Şirket Dosyaları"
      description="Vercel Blob ile şirket dosyalarını yönetin"
      actions={
        <div className="flex gap-2">
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
          </Link>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChosen(f);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" /> Dosya Yükle
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dosyalar</CardTitle>
            <CardDescription>Şirkete ait yüklenen dosyalar</CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dosya</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Boyut</TableHead>
                    <TableHead>Yüklenme</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(files || []).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <a href={f.blobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                            {f.name}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{f.contentType || "-"}</TableCell>
                      <TableCell>{Math.ceil((f.size || 0) / 1024)} KB</TableCell>
                      <TableCell>{new Date(f.createdAt).toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files/${f.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" /> Detay
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => deleteFileMutation.mutate(f.id)}
                          >
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


