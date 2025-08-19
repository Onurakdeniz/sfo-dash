"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";
import { ArrowLeft, UploadCloud, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Workspace { id: string; slug: string; name: string }
interface Company { id: string; name: string }

export default function AddCompanyFilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [customMetadata, setCustomMetadata] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileOverrides, setFileOverrides] = useState<{ displayName: string }[]>([]);

  // Prefill code from query parameter for versioning flows
  useEffect(() => {
    const codeFromQuery = searchParams.get("code");
    if (codeFromQuery && !code) {
      setCode(codeFromQuery);
    }
  }, [searchParams, code]);

  type Department = { id: string; name: string };
  type Unit = { id: string; name: string };

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments", workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [] as Department[];
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments`, { credentials: "include" });
      if (!res.ok) return [] as Department[];
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["units", workspace?.id, companyId, departmentId],
    queryFn: async () => {
      if (!workspace?.id || !departmentId) return [] as Unit[];
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}/units`, { credentials: "include" });
      if (!res.ok) return [] as Unit[];
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId && !!departmentId,
  });

  const buildMetadata = (): any => {
    const meta: Record<string, any> = {};
    if (description.trim()) meta.description = description.trim();
    if (code.trim()) meta.code = code.trim();
    if (version.trim()) meta.version = version.trim();
    if (category.trim()) meta.category = category.trim();
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagList.length) meta.tags = tagList;
    if (departmentId) {
      meta.departmentId = departmentId;
      const dep = departments.find((d) => d.id === departmentId);
      if (dep) meta.departmentName = dep.name;
    }
    if (unitId) {
      meta.unitId = unitId;
      const u = units.find((x) => x.id === unitId);
      if (u) meta.unitName = u.name;
    }
    if (effectiveDate) meta.effectiveDate = effectiveDate.toISOString().slice(0, 10);
    if (expiryDate) meta.expiryDate = expiryDate.toISOString().slice(0, 10);
    if (notes.trim()) meta.notes = notes.trim();
    if (customMetadata.trim()) {
      try {
        const parsed = JSON.parse(customMetadata);
        if (parsed && typeof parsed === "object") {
          Object.assign(meta, parsed);
        }
      } catch (e) {
        toast.error("Geçersiz özel metadata JSON");
        throw e;
      }
    }
    return meta;
  };

  const handleSubmit = async () => {
    if (!workspace?.id) return;
    if (!selectedFiles.length) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }
    // name is optional when multiple files are selected
    setIsSubmitting(true);
    try {
      const meta = buildMetadata();
      let createdCount = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const form = new FormData();
        form.append("file", file);
        form.append("filename", file.name);
        // access omitted; route defaults to public

        const uploadRes = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files/upload-url`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Yükleme hatası");
        const blob = await uploadRes.json();

        const overrideName = (fileOverrides[i]?.displayName || "").trim();
        const finalName = overrideName || (selectedFiles.length === 1 && name.trim() ? name.trim() : file.name);

        const createRes = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/files`, {
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
          }),
        });
        if (!createRes.ok) throw new Error("Kayıt oluşturulamadı");
        createdCount += 1;
      }

      toast.success(`${createdCount} dosya oluşturuldu`);
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) toast.error(err.message);
      else toast.error("Hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: companyData?.name || "Şirket", href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
    { label: "Dosyalar", href: `/${workspaceSlug}/${companySlug}/companies/${companyId}/files`, isLast: false },
    { label: "Yeni Dosya", isLast: true },
  ];

  return (
    <PageWrapper
      title="Yeni Dosya"
      description="Şirkete yeni bir dosya yükleyin ve detaylarını ekleyin"
      breadcrumbs={breadcrumbs}
      actions={
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Geri</TooltipContent>
        </Tooltip>
      }
    >
      <TooltipProvider>
      <div className="space-y-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-9">
        <Card>
          <CardHeader>
            <CardTitle>Dosya Bilgileri</CardTitle>
            <CardDescription>Dosyayı seçin ve detayları doldurun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Dosyalar</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bir veya birden çok dosya seçin</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                    setFileOverrides(files.map(() => ({ displayName: "" })));
                    if (files.length === 1 && !name) setName(files[0].name);
                  }}
                />
                {selectedFiles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {selectedFiles.length} dosya seçildi
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedFiles.map((f, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                        <div className="text-xs truncate md:col-span-1">{f.name}</div>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <Input
                            placeholder="Örn: PDF, Düzenlenebilir"
                            value={fileOverrides[idx]?.displayName || ""}
                            onChange={(e) => {
                              const next = [...fileOverrides];
                              if (!next[idx]) next[idx] = { displayName: "" };
                              next[idx].displayName = e.target.value;
                              setFileOverrides(next);
                            }}
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const next = [...fileOverrides];
                            if (!next[idx]) next[idx] = { displayName: "" };
                            next[idx].displayName = "PDF";
                            setFileOverrides(next);
                          }}>PDF</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const next = [...fileOverrides];
                            if (!next[idx]) next[idx] = { displayName: "" };
                            next[idx].displayName = "Düzenlenebilir";
                            setFileOverrides(next);
                          }}>Düzenlenebilir</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Ad (tek dosya için)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tek dosya seçildiğinde görünecek ad</TooltipContent>
                  </Tooltip>
                </div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Personel Politikaları 2025.pdf" />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Kod</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dosya için kurum içi benzersiz kod</TooltipContent>
                  </Tooltip>
                </div>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Örn: DOC-2025-001" />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Versiyon</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belgenin sürüm bilgisi</TooltipContent>
                  </Tooltip>
                </div>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Örn: v1.0.0" />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Kategori</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belgenin türü (Sözleşme, Fatura vb.)</TooltipContent>
                  </Tooltip>
                </div>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Örn: Sözleşme, Fatura" />
              </div>

              {/* Department, Unit & Tags grouped section (full-width controls) */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Label>Departman</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belgenin ait olduğu departman</TooltipContent>
                  </Tooltip>
                  </div>
                  <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setUnitId(""); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Departman seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Label>Birim</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Seçili departmanın bağlı birimi</TooltipContent>
                  </Tooltip>
                  </div>
                  <Select value={unitId} onValueChange={(v) => setUnitId(v)} disabled={!departmentId || units.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={departmentId ? (units.length ? "Birim seçin" : "Bu departmanda birim yok") : "Önce departman seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Label>Etiketler</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Virgülle ayırarak etiket ekleyin</TooltipContent>
                  </Tooltip>
                  </div>
                  <Input className="w-full" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Örn: insan kaynakları, gizli" />
                  <div className="text-xs text-muted-foreground">Virgülle ayırın</div>
                </div>
              </div>

              <div className="md:col-span-2 grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Açıklama</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belge hakkında kısa açıklama</TooltipContent>
                  </Tooltip>
                </div>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Örn: Tedarik sözleşmesi (taslak)" />
              </div>

              <div className="md:col-span-2 grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Notlar</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>İç iletişim için notlar</TooltipContent>
                  </Tooltip>
                </div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Örn: İmza bekliyor" />
              </div>

              <div className="md:col-span-2 grid gap-2">
                <div className="flex items-center gap-2">
                  <Label>Özel Metadata (JSON)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>İsteğe bağlı ekstra alanları JSON olarak ekleyin</TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  value={customMetadata}
                  onChange={(e) => setCustomMetadata(e.target.value)}
                  placeholder='Örn: {"origin":"e-imza","priority":"high"}'
                />
                <div className="text-xs text-muted-foreground">Geçerli bir JSON girin. Çakışan anahtarlar üstteki alanları geçersiz kılar.</div>
              </div>

              {/* Dates moved to the bottom */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label>Başlangıç Tarihi</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belgenin geçerli olmaya başladığı tarih</TooltipContent>
                  </Tooltip>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start w-full">
                        {effectiveDate ? format(effectiveDate, "PPP") : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={effectiveDate}
                        onSelect={setEffectiveDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label>Bitiş Tarihi</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50" aria-label="Bilgi">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Belgenin geçerliliğinin bittiği tarih</TooltipContent>
                  </Tooltip>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start w-full">
                        {expiryDate ? format(expiryDate, "PPP") : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/files`}>
                    <Button variant="outline">İptal</Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>İptal</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSubmit} disabled={isSubmitting || selectedFiles.length === 0}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Yükleniyor..." : selectedFiles.length > 1 ? "Hepsini Yükle" : "Yükle"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Yükle</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
        </div>
        <div className="hidden md:block md:col-span-3" />
      </div>
      </TooltipProvider>
    </PageWrapper>
  );
}


