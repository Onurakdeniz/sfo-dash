"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";

interface CreateCompanyData {
  name: string;
  fullName?: string;
  companyType?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  taxOffice?: string;
  taxNumber?: string;
  mersisNumber?: string;
  notes?: string;
}

const companyTypes = [
  { value: 'anonim_sirket', label: 'Anonim Şirket (A.Ş.)' },
  { value: 'limited_sirket', label: 'Limited Şirket (Ltd. Şti.)' },
  { value: 'kolektif_sirket', label: 'Kollektif Şirket' },
  { value: 'komandit_sirket', label: 'Komandit Şirket' },
  { value: 'sermayesi_paylara_bolunmus_komandit_sirket', label: 'Sermayesi Paylara Bölünmüş Komandit Şirket' },
  { value: 'kooperatif', label: 'Kooperatif' },
  { value: 'dernek', label: 'Dernek' },
  { value: 'vakif', label: 'Vakıf' },
  { value: 'sahis_isletmesi', label: 'Şahıs İşletmesi' },
  { value: 'diger', label: 'Diğer' }
];

const industries = [
  'Teknoloji',
  'Finans',
  'Sağlık',
  'Eğitim',
  'İmalat',
  'İnşaat',
  'Turizm',
  'Gıda',
  'Tekstil',
  'Otomotiv',
  'Enerji',
  'Tarım',
  'Lojistik',
  'Perakende',
  'Medya',
  'Danışmanlık',
  'Diğer'
];

const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Şanlıurfa', 
  'Gaziantep', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Gebze',
  'Denizli', 'Samsun', 'Kahramanmaraş', 'Van', 'Batman', 'Elazığ', 'Erzurum',
  'Malatya', 'Manisa', 'Sivas', 'Aydın', 'Balıkesir', 'Sakarya', 'Ordu',
  'Muğla', 'Tekirdağ', 'Zonguldak', 'Çorum', 'Kütahya', 'Trabzon', 'Afyon',
  'Hatay', 'Isparta', 'Karabük', 'Edirne', 'Kırklareli', 'Yalova', 'Bolu',
  'Tokat', 'Amasya', 'Çankırı', 'Kastamonu', 'Sinop', 'Bartın', 'Artvin',
  'Rize', 'Giresun', 'Gümüşhane', 'Bayburt', 'Erzincan', 'Tunceli', 'Bingöl',
  'Muş', 'Bitlis', 'Hakkari', 'Şırnak', 'Mardin', 'Siirt', 'Kilis', 'Osmaniye',
  'Düzce', 'Yozgat', 'Karaman', 'Niğde', 'Nevşehir', 'Kırşehir',
  'Aksaray', 'Kırıkkale', 'Burdur', 'Uşak', 'Bilecik', 'Çanakkale'
];

export default function AddCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    fullName: '',
    companyType: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
    taxOffice: '',
    taxNumber: '',
    mersisNumber: '',
    notes: ''
  });

  // Get workspace info to get the workspace ID
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      if (!workspace?.id) {
        throw new Error('Workspace not found');
      }

      const res = await fetch(`/api/onboarding/workspace/${workspace.id}/company`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Şirket başarıyla oluşturuldu');
      router.push(`/${workspaceSlug}/${companySlug}/companies`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Şirket oluşturma başarısız');
      console.error('Create company error:', error);
    },
  });

  const handleInputChange = (field: keyof CreateCompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Şirket adı zorunludur');
      return;
    }

    // Filter out empty strings
    const cleanData: Partial<CreateCompanyData> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        cleanData[key as keyof CreateCompanyData] = value.trim();
      }
    });

    // Ensure required fields are present
    if (!cleanData.name) {
      toast.error('Şirket adı zorunludur');
      return;
    }

    createCompany.mutate(cleanData as CreateCompanyData);
  };

  const workspace = workspacesData?.workspaces?.find((w: any) => w.slug === workspaceSlug);

  return (
    <PageWrapper
      title="Yeni Şirket Ekle"
      description="Şirket bilgilerini doldurarak yeni bir şirket oluşturun"
      actions={
        <Link href={`/${workspaceSlug}/${companySlug}/companies`}>
          <Button variant="actionSecondary" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">

          {/* Form Content */}
          <form onSubmit={handleSubmit} id="company-form" className="space-y-6 pb-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
                <CardDescription>
                  Şirketin temel bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Şirket Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Acme Corporation"
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Tam Unvan</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Acme Corporation Anonim Şirketi"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Şirket Türü</Label>
                    <Select value={formData.companyType} onValueChange={(value) => handleInputChange('companyType', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Şirket türünü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Sektör</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Sektör seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
                <CardDescription>
                  Şirketin iletişim bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+90 212 555 0123"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@acme.com"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Web Sitesi</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.acme.com"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Adres Bilgileri</CardTitle>
                <CardDescription>
                  Şirketin adres bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Tam adres bilgisi"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      placeholder="Beşiktaş"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">İl</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="İl seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="34349"
                      className="h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Yasal Bilgiler</CardTitle>
                <CardDescription>
                  Şirketin yasal bilgilerini girin (Türkiye özelinde)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input
                      id="taxOffice"
                      value={formData.taxOffice}
                      onChange={(e) => handleInputChange('taxOffice', e.target.value)}
                      placeholder="Beşiktaş Vergi Dairesi"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Numarası</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      placeholder="1234567890"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mersisNumber">MERSİS Numarası</Label>
                  <Input
                    id="mersisNumber"
                    value={formData.mersisNumber}
                    onChange={(e) => handleInputChange('mersisNumber', e.target.value)}
                    placeholder="0123456789012345"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Notlar</CardTitle>
                <CardDescription>
                  Şirket hakkında ek bilgiler ekleyebilirsiniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Şirket hakkında ek bilgiler..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

      {/* Fixed Footer */}
      <div className="border-t bg-background px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end gap-4">
          <Link href={`/${workspaceSlug}/${companySlug}/companies`}>
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>
          <Button 
            type="submit"
            form="company-form"
            disabled={createCompany.isPending || !formData.name.trim()}
            className="min-w-[120px]"
          >
            {createCompany.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ekleniyor...
              </>
            ) : (
              'Şirket Ekle'
            )}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}