"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Edit3, Trash2, Loader2, Phone, Mail, Globe, MapPin, FileText, Calendar, Briefcase, X, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
// import { PageWrapper } from "@/components/page-wrapper";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import { toast } from "sonner";
import { handleApiResponse, showErrorToast } from "@/lib/api-error-handler";
import CompanyTabs from "./company-tabs";

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
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
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

      const responseData = await res.json();

      // Handle API response with proper error parsing
      if (!res.ok) {
        // If it's a database constraint violation, handleApiResponse will show the error toast
        handleApiResponse(responseData, {
          showSuccessToast: false, // We'll handle success toast manually
        });

        // Re-throw to trigger onError
        throw new Error(responseData.error?.userMessage || 'Failed to update company');
      }

      return responseData;
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
      // Error toast is already shown by handleApiResponse in mutationFn
      // This prevents duplicate error toasts
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

      const responseData = await res.json();

      // Handle API response with proper error parsing
      if (!res.ok) {
        handleApiResponse(responseData, {
          showSuccessToast: false, // We'll handle success toast manually
        });

        // Re-throw to trigger onError
        throw new Error(responseData.error?.userMessage || 'Failed to delete company');
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspace?.id] });
      toast.success('Şirket başarıyla silindi');
      router.push(`/${workspaceSlug}/${companySlug}/companies`);
    },
    onError: (error: Error) => {
      // Error toast is already shown by handleApiResponse in mutationFn
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
      fullName: formData.fullName?.trim() || undefined,
      companyType: formData.companyType || undefined,
      industry: formData.industry || undefined,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      district: formData.district?.trim() || undefined,
      city: formData.city || undefined,
      postalCode: formData.postalCode?.trim() || undefined,
      taxOffice: formData.taxOffice?.trim() || undefined,
      taxNumber: formData.taxNumber?.trim() || undefined,
      mersisNumber: formData.mersisNumber?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    updateCompany.mutate(updateData);
  };

  const handleInputChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteDialogOpen = () => {
    setDeleteConfirmationText('');
    setShowDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteConfirmationText('');
    setShowDeleteDialog(false);
  };

  const isDeleteConfirmed = deleteConfirmationText === company?.name;



  // Show loading state
  if (isLoadingWorkspaces || isLoadingCompany) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erişim Reddedildi
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
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
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Şirket Bulunamadı
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Şirket bulunamadı veya bu şirkete erişim izniniz yok.
          </p>
          <Link href={`/${workspaceSlug}/${companySlug}/companies`}>
            <Button variant="shopifySecondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
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

  const headerActions = !isEditing ? (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Düzenle" onClick={handleEdit} variant="shopifySecondary" size="sm" className="rounded-md">
            <Edit3 className="h-4 w-4" />
            Düzenle
          </Button>
        </TooltipTrigger>
        <TooltipContent>Düzenle</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Sil" onClick={handleDeleteDialogOpen} variant="shopifyDestructive" size="sm" className="rounded-md">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sil</TooltipContent>
      </Tooltip>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="İptal" onClick={handleCancelEdit} variant="shopifySecondary" size="sm" className="rounded-md">
            <X className="h-4 w-4" />
            İptal
          </Button>
        </TooltipTrigger>
        <TooltipContent>İptal</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Kaydet" onClick={handleSaveEdit} variant="shopifySuccess" size="sm" disabled={updateCompany.isPending} className="rounded-md">
            {updateCompany.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Kaydet
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Kaydet</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <CompanyPageLayout
      title="Şirket Bilgileri"
      description={`${company.name} - Şirket detayları ve bilgileri`}
      actions={headerActions}
      tabs={<CompanyTabs />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Temel Bilgiler
              </CardTitle>
              <CardDescription>Şirketin temel bilgileri</CardDescription>
            </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  İletişim Bilgileri
                </CardTitle>
                <CardDescription>
                  Şirketin iletişim bilgileri
                </CardDescription>
                </div>
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

            {/* Metadata hidden per request: Sistem Bilgileri */}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, "{company.name}" şirketini kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirmation" className="text-sm font-medium">
              Onaylamak için şirket adını yazın: <span className="font-bold">{company.name}</span>
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder={company.name}
              className="mt-2"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="shopifySecondary" onClick={handleDeleteDialogClose}>
                İptal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="shopifyDestructive"
                onClick={() => deleteCompany.mutate()}
                disabled={deleteCompany.isPending || !isDeleteConfirmed}
              >
                {deleteCompany.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  'Sil'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyPageLayout>
  );
}