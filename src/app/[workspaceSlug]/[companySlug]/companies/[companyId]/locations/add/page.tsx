"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Türkçe lokasyon türleri
const locationTypes = ["Ofis", "Depo", "Fabrika", "Mağaza", "Diğer"];

interface Workspace { id: string; name: string; slug: string; }

interface CreateLocationData {
  name: string;
  code?: string;
  locationType?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isHeadquarters?: boolean;
  notes?: string;
}

export default function AddLocationPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  const [form, setForm] = useState<CreateLocationData>({ name: '', country: 'Türkiye', isHeadquarters: false });

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  const createLocation = useMutation({
    mutationFn: async (data: CreateLocationData) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create location');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Lokasyon oluşturuldu');
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`);
    },
    onError: (e: any) => toast.error(e?.message || 'Lokasyon oluşturma başarısız'),
  });

  const handleChange = (field: keyof CreateLocationData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
  };

  const breadcrumbs = [
    { label: 'Şirket', href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
    { label: 'Lokasyonlar', href: `/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`, isLast: false },
    { label: 'Yeni Lokasyon', isLast: true },
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Lokasyon adı zorunludur');
      return;
    }
    const clean: CreateLocationData = {
      ...form,
      name: form.name.trim(),
      code: form.code?.trim() || undefined,
      locationType: form.locationType || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
      district: form.district?.trim() || undefined,
      city: form.city?.trim() || undefined,
      postalCode: form.postalCode?.trim() || undefined,
      country: form.country?.trim() || 'Türkiye',
      notes: form.notes?.trim() || undefined,
    };
    createLocation.mutate(clean);
  };

  return (
    <PageWrapper
      title="Yeni Lokasyon Oluştur"
      description="Şirket için yeni ofis/lokasyon ekleyin"
      breadcrumbs={breadcrumbs}
      actions={(
        <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </Link>
      )}
    >
      <form onSubmit={onSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
            <CardDescription>Lokasyon bilgilerini girin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Lokasyon Adı *</Label>
                <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Örn: Genel Merkez" required />
              </div>
              <div className="space-y-2">
                <Label>Kod</Label>
                <Input value={form.code || ''} onChange={(e) => handleChange('code', e.target.value)} placeholder="Örn: HQ, MSLK" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select value={form.locationType || ''} onValueChange={(v) => handleChange('locationType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Merkez</Label>
                <select className="bg-background border rounded px-3 py-2 text-sm" value={form.isHeadquarters ? 'yes' : 'no'} onChange={(e) => handleChange('isHeadquarters', e.target.value === 'yes')}>
                  <option value="no">Hayır</option>
                  <option value="yes">Evet</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ülke</Label>
                <Input value={form.country || ''} onChange={(e) => handleChange('country', e.target.value)} placeholder="Örn: Türkiye" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İletişim & Adres</CardTitle>
            <CardDescription>İletişim ve adres bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Örn: +90 555 555 55 55" />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="Örn: ofis@sirket.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea rows={3} value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Tam adres" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>İlçe</Label>
                <Input value={form.district || ''} onChange={(e) => handleChange('district', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>İl</Label>
                <Input value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Posta Kodu</Label>
                <Input value={form.postalCode || ''} onChange={(e) => handleChange('postalCode', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Notlar" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`}>
            <Button type="button" variant="outline">İptal</Button>
          </Link>
          <Button type="submit" disabled={createLocation.isPending || !form.name.trim()}>
            {createLocation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Oluşturuluyor...</>) : 'Lokasyon Oluştur'}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}


