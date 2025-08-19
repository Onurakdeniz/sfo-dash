"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import CompanyTabs from "../../company-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Türkçe lokasyon türleri ve görüntüleme eşlemesi
const locationTypes = ["Ofis", "Depo", "Fabrika", "Mağaza", "Diğer"];
const displayType = (value?: string) => {
  if (!value) return '-';
  const map: Record<string, string> = {
    office: 'Ofis',
    warehouse: 'Depo',
    factory: 'Fabrika',
    store: 'Mağaza',
    other: 'Diğer',
    Ofis: 'Ofis',
    Depo: 'Depo',
    Fabrika: 'Fabrika',
    Mağaza: 'Mağaza',
    Diğer: 'Diğer',
  };
  return map[value] ?? value;
};

interface Workspace { id: string; name: string; slug: string; }
interface Company { id: string; name: string; slug?: string; }

interface LocationForm {
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

export default function LocationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const locationId = params.locationId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<LocationForm>({ name: "" });

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  const { data: company } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const { data: location } = useQuery({
    queryKey: ['location', workspace?.id, companyId, locationId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations/${locationId}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId && !!locationId,
  });

  useEffect(() => {
    if (location) {
      setForm({
        name: location.name || "",
        code: location.code || "",
        locationType: location.locationType || "",
        phone: location.phone || "",
        email: location.email || "",
        address: location.address || "",
        district: location.district || "",
        city: location.city || "",
        postalCode: location.postalCode || "",
        country: location.country || "Türkiye",
        isHeadquarters: Boolean(location.isHeadquarters),
        notes: location.notes || "",
      });
    }
  }, [location]);

  const updateLocation = useMutation({
    mutationFn: async (data: LocationForm) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations/${locationId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update location');
      }
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['location', workspace?.id, companyId, locationId], updated);
      queryClient.invalidateQueries({ queryKey: ['locations', workspace?.id, companyId] });
      setIsEditing(false);
      toast.success('Lokasyon güncellendi');
    },
    onError: (e: any) => toast.error(e?.message || 'Lokasyon güncelleme başarısız'),
  });

  const breadcrumbs = [
    { label: company?.name || 'Şirket', href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
    { label: 'Lokasyonlar', href: `/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`, isLast: false },
    { label: location?.name || 'Lokasyon', isLast: true },
  ];

  const handleChange = (field: keyof LocationForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
  };

  const headerActions = !isEditing ? (
    <div className="flex items-center gap-2">
      <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations`}>
        <Button variant="shopifySecondary" size="sm" className="rounded-md">
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
      </Link>
      <Button variant="shopifySecondary" size="sm" onClick={() => setIsEditing(true)} className="rounded-md">Düzenle</Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="shopifySecondary" size="sm" onClick={() => { setIsEditing(false); }} className="rounded-md">
        <X className="h-4 w-4" />
        İptal
      </Button>
      <Button variant="shopifySuccess" size="sm" disabled={updateLocation.isPending} onClick={() => updateLocation.mutate(form)} className="rounded-md">
        {updateLocation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor...</>) : (<><Check className="h-4 w-4" /> Kaydet</>)}
      </Button>
    </div>
  );

  return (
    <CompanyPageLayout
      title="Lokasyon Detayı"
      description="Şirket lokasyon bilgilerini görüntüleyin ve güncelleyin"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
      tabs={<CompanyTabs />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
            <CardDescription>Lokasyonun temel bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Lokasyon Adı</Label>
                {isEditing ? (
                  <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Kod</Label>
                {isEditing ? (
                  <Input value={form.code || ''} onChange={(e) => handleChange('code', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.code || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tür</Label>
                {isEditing ? (
                  <Select value={form.locationType || ''} onValueChange={(v) => handleChange('locationType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm py-2">{displayType(location?.locationType)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Merkez</Label>
                {isEditing ? (
                  <select className="bg-background border rounded px-3 py-2 text-sm" value={form.isHeadquarters ? 'yes' : 'no'} onChange={(e) => handleChange('isHeadquarters', e.target.value === 'yes')}>
                    <option value="no">Hayır</option>
                    <option value="yes">Evet</option>
                  </select>
                ) : (
                  <p className="text-sm py-2">{location?.isHeadquarters ? 'Evet' : 'Hayır'}</p>
                )}
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
                {isEditing ? (
                  <Input value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.phone || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                {isEditing ? (
                  <Input type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.email || '-'}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adres</Label>
              {isEditing ? (
                <Textarea rows={3} value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
              ) : (
                <p className="text-sm py-2">{location?.address || '-'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>İlçe</Label>
                {isEditing ? (
                  <Input value={form.district || ''} onChange={(e) => handleChange('district', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.district || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>İl</Label>
                {isEditing ? (
                  <Input value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.city || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Posta Kodu</Label>
                {isEditing ? (
                  <Input value={form.postalCode || ''} onChange={(e) => handleChange('postalCode', e.target.value)} />
                ) : (
                  <p className="text-sm py-2">{location?.postalCode || '-'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
            <CardDescription>İç notlar</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea rows={4} value={form.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} />
            ) : (
              <p className="text-sm py-2 whitespace-pre-wrap">{location?.notes || '-'}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyPageLayout>
  );
}


