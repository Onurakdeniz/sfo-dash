"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Edit3, Trash2, Loader2, Phone, Mail, Globe, MapPin, FileText, Building, Calendar, Briefcase } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug?: string;
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
  createdAt: string;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface UpdateCompanyData {
  name?: string;
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

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<UpdateCompanyData>({});

  // Fetch all workspaces and find by slug
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      try {
        const res = await fetch('/api/workspaces', {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!workspaceSlug,
  });

  // Find current workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany, error } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Company not found');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error('Failed to update company');
      }
      return res.json();
    },
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(['company', workspace?.id, companyId], updatedCompany);
      queryClient.invalidateQueries({ queryKey: ['companies', workspace?.id] });
      setIsEditing(false);
      // Clear form data after successful update
      setFormData({});
      toast.success('Şirket başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error('Şirket güncelleme başarısız');
      console.error('Update company error:', error);
    },
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async () => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to delete company');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspace?.id] });
      toast.success('Şirket başarıyla silindi');
      router.push(`/${workspaceSlug}/${companySlug}/companies`);
    },
    onError: (error) => {
      toast.error('Şirket silme başarısız');
      console.error('Delete company error:', error);
    },
  });

  const handleEdit = () => {
    if (company) {
      // Initialize form data with all current company values to maintain state
      setFormData({
        name: company.name || '',
        fullName: company.fullName || '',
        companyType: company.companyType || '',
        industry: company.industry || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        address: company.address || '',
        district: company.district || '',
        city: company.city || '',
        postalCode: company.postalCode || '',
        taxOffice: company.taxOffice || '',
        taxNumber: company.taxNumber || '',
        mersisNumber: company.mersisNumber || '',
        notes: company.notes || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSaveEdit = () => {
    if (!formData.name?.trim()) {
      toast.error('Şirket adı zorunludur');
      return;
    }

    // Send complete form data to maintain all field values
    // Convert empty strings to null for optional fields, but keep all current values
    const updateData: UpdateCompanyData = {
      name: formData.name?.trim() || company.name,
      fullName: formData.fullName?.trim() || null,
      companyType: formData.companyType || null,
      industry: formData.industry || null,
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      website: formData.website?.trim() || null,
      address: formData.address?.trim() || null,
      district: formData.district?.trim() || null,
      city: formData.city || null,
      postalCode: formData.postalCode?.trim() || null,
      taxOffice: formData.taxOffice?.trim() || null,
      taxNumber: formData.taxNumber?.trim() || null,
      mersisNumber: formData.mersisNumber?.trim() || null,
      notes: formData.notes?.trim() || null,
    };

    updateCompany.mutate(updateData);
  };

  const handleInputChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading state
  if (isLoadingWorkspaces || isLoadingCompany) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  // Show error if company not found
  if (error || !company) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Şirket bulunamadı veya bu şirkete erişim izniniz yok.
          </p>
          <Link href={`/${workspaceSlug}/${companySlug}/companies`}>
            <Button className="mt-4" variant="outline">
              Şirketler Listesine Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getCompanyTypeLabel = (value?: string) => {
    return companyTypes.find(type => type.value === value)?.label || value;
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/${workspaceSlug}/${companySlug}/companies`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Şirket detayları ve bilgileri
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button onClick={handleEdit} variant="outline">
                      <Edit3 className="mr-2 h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button 
                      onClick={() => setShowDeleteDialog(true)} 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit} variant="outline">
                      İptal
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={updateCompany.isPending}>
                      {updateCompany.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        'Kaydet'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
                <CardDescription>
                  Şirketin temel bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Şirket Adı</Label>
                    {isEditing ? (
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Şirket adı"
                        required
                      />
                    ) : (
                      <p className="text-sm py-2">{company.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tam Unvan</Label>
                    {isEditing ? (
                      <Input
                        value={formData.fullName || ''}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Tam unvan"
                      />
                    ) : (
                      <p className="text-sm py-2">{company.fullName || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Şirket Türü</Label>
                    {isEditing ? (
                      <Select value={formData.companyType || ''} onValueChange={(value) => handleInputChange('companyType', value)}>
                        <SelectTrigger>
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
                    ) : (
                      <p className="text-sm py-2">{getCompanyTypeLabel(company.companyType) || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Sektör</Label>
                    {isEditing ? (
                      <Select value={formData.industry || ''} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger>
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
                    ) : (
                      <p className="text-sm py-2">{company.industry || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  İletişim Bilgileri
                </CardTitle>
                <CardDescription>
                  Şirketin iletişim bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Telefon numarası"
                      />
                    ) : (
                      <p className="text-sm py-2 flex items-center gap-2">
                        {company.phone ? (
                          <>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {company.phone}
                          </>
                        ) : (
                          'Belirtilmemiş'
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="E-posta adresi"
                      />
                    ) : (
                      <p className="text-sm py-2 flex items-center gap-2">
                        {company.email ? (
                          <>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {company.email}
                          </>
                        ) : (
                          'Belirtilmemiş'
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Web Sitesi</Label>
                  {isEditing ? (
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="Web sitesi adresi"
                    />
                  ) : (
                    <p className="text-sm py-2 flex items-center gap-2">
                      {company.website ? (
                        <>
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        </>
                      ) : (
                        'Belirtilmemiş'
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adres Bilgileri
                </CardTitle>
                <CardDescription>
                  Şirketin adres bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Adres</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Tam adres bilgisi"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm py-2">{company.address || 'Belirtilmemiş'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>İlçe</Label>
                    {isEditing ? (
                      <Input
                        value={formData.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        placeholder="İlçe"
                      />
                    ) : (
                      <p className="text-sm py-2">{company.district || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>İl</Label>
                    {isEditing ? (
                      <Select value={formData.city || ''} onValueChange={(value) => handleInputChange('city', value)}>
                        <SelectTrigger>
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
                    ) : (
                      <p className="text-sm py-2">{company.city || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Posta Kodu</Label>
                    {isEditing ? (
                      <Input
                        value={formData.postalCode || ''}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="Posta kodu"
                      />
                    ) : (
                      <p className="text-sm py-2">{company.postalCode || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Yasal Bilgiler
                </CardTitle>
                <CardDescription>
                  Şirketin yasal bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    {isEditing ? (
                      <Input
                        value={formData.taxOffice || ''}
                        onChange={(e) => handleInputChange('taxOffice', e.target.value)}
                        placeholder="Vergi dairesi"
                      />
                    ) : (
                      <p className="text-sm py-2">{company.taxOffice || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Numarası</Label>
                    {isEditing ? (
                      <Input
                        value={formData.taxNumber || ''}
                        onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                        placeholder="Vergi numarası"
                      />
                    ) : (
                      <p className="text-sm py-2">{company.taxNumber || 'Belirtilmemiş'}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>MERSİS Numarası</Label>
                  {isEditing ? (
                    <Input
                      value={formData.mersisNumber || ''}
                      onChange={(e) => handleInputChange('mersisNumber', e.target.value)}
                      placeholder="MERSİS numarası"
                    />
                  ) : (
                    <p className="text-sm py-2">{company.mersisNumber || 'Belirtilmemiş'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ek Notlar
                </CardTitle>
                <CardDescription>
                  Şirket hakkında ek bilgiler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Şirket hakkında ek bilgiler..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm py-2 whitespace-pre-wrap">{company.notes || 'Belirtilmemiş'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sistem Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Oluşturulma Tarihi</Label>
                    <p className="text-sm py-2">{new Date(company.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Son Güncelleme</Label>
                    <p className="text-sm py-2">{new Date(company.updatedAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, "{company.name}" şirketini kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCompany.mutate()}
              disabled={deleteCompany.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompany.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}