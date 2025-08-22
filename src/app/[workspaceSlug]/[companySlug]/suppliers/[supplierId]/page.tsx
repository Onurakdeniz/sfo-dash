'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  User,
  FileText,
  Users,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  fullName: string;
  supplierType: 'individual' | 'corporate';
  supplierCategory: 'strategic' | 'preferred' | 'approved' | 'standard' | 'new' | 'temporary';
  status: 'active' | 'inactive' | 'prospect' | 'suspended' | 'blacklisted' | 'closed';
  email: string;
  phone: string;
  website: string;
  fax: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  taxOffice: string;
  taxNumber: string;
  mersisNumber: string;
  tradeRegistryNumber: string;
  supplierCode: string;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  orderIncrement: number;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaceSlug, companySlug, supplierId } = params;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/suppliers/${supplierId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Tedarikçi bulunamadı');
          router.push(`/${workspaceSlug}/${companySlug}/suppliers`);
          return;
        }
        throw new Error('Failed to fetch supplier');
      }

      const data = await response.json();
      setSupplier(data.supplier);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      toast.error('Tedarikçi bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Aktif', variant: 'default' as const },
      inactive: { label: 'Pasif', variant: 'secondary' as const },
      prospect: { label: 'Potansiyel', variant: 'outline' as const },
      suspended: { label: 'Askıya Alınmış', variant: 'destructive' as const },
      blacklisted: { label: 'Kara Liste', variant: 'destructive' as const },
      closed: { label: 'Kapalı', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      strategic: { label: 'Stratejik', variant: 'default' as const },
      preferred: { label: 'Tercih Edilen', variant: 'secondary' as const },
      approved: { label: 'Onaylı', variant: 'outline' as const },
      standard: { label: 'Standart', variant: 'secondary' as const },
      new: { label: 'Yeni', variant: 'outline' as const },
      temporary: { label: 'Geçici', variant: 'outline' as const },
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.standard;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Tedarikçi bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {supplier.supplierType === 'corporate' ? (
                <Building className="h-8 w-8" />
              ) : (
                <User className="h-8 w-8" />
              )}
              {supplier.name}
            </h1>
            <p className="text-muted-foreground">
              {supplier.fullName || 'Tedarikçi Detayları'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Status and Category Badges */}
      <div className="flex gap-2">
        {getStatusBadge(supplier.status)}
        {getCategoryBadge(supplier.supplierCategory)}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="contact">İletişim</TabsTrigger>
          <TabsTrigger value="business">İş Bilgileri</TabsTrigger>
          <TabsTrigger value="notes">Notlar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tedarikçi Kodu</p>
                    <p className="font-medium">{supplier.supplierCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tip</p>
                    <p className="font-medium">
                      {supplier.supplierType === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                    </p>
                  </div>
                </div>
                {supplier.primaryContactName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Birincil İletişim</p>
                    <p className="font-medium">{supplier.primaryContactName}</p>
                    {supplier.primaryContactTitle && (
                      <p className="text-sm text-muted-foreground">{supplier.primaryContactTitle}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Specific Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tedarikçi Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.leadTimeDays && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teslim Süresi</p>
                    <p className="font-medium">{supplier.leadTimeDays} gün</p>
                  </div>
                )}
                {supplier.minimumOrderQuantity && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Min. Sipariş Miktarı</p>
                    <p className="font-medium">{supplier.minimumOrderQuantity}</p>
                  </div>
                )}
                {supplier.orderIncrement && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sipariş Artışı</p>
                    <p className="font-medium">{supplier.orderIncrement}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/addresses`)}
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm">Adresler</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/contacts`)}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Kişiler</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/files`)}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Dosyalar</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/orders`)}
                >
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Siparişler</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">E-posta</p>
                      <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                        {supplier.email}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Telefon</p>
                      <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.fax && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Fax</p>
                      <p>{supplier.fax}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Adres Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Adres</p>
                      <p>{supplier.address}</p>
                      {(supplier.district || supplier.city || supplier.postalCode) && (
                        <p className="text-muted-foreground">
                          {[supplier.district, supplier.city, supplier.postalCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {supplier.country && (
                        <p className="text-muted-foreground">{supplier.country}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Primary Contact */}
            {(supplier.primaryContactName || supplier.primaryContactPhone || supplier.primaryContactEmail) && (
              <Card>
                <CardHeader>
                  <CardTitle>Birincil İletişim Kişisi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.primaryContactName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ad Soyad</p>
                      <p className="font-medium">{supplier.primaryContactName}</p>
                    </div>
                  )}
                  {supplier.primaryContactTitle && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ünvan</p>
                      <p>{supplier.primaryContactTitle}</p>
                    </div>
                  )}
                  {supplier.primaryContactPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                      <a href={`tel:${supplier.primaryContactPhone}`} className="text-blue-600 hover:underline">
                        {supplier.primaryContactPhone}
                      </a>
                    </div>
                  )}
                  {supplier.primaryContactEmail && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">E-posta</p>
                      <a href={`mailto:${supplier.primaryContactEmail}`} className="text-blue-600 hover:underline">
                        {supplier.primaryContactEmail}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vergi Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.taxOffice && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vergi Dairesi</p>
                    <p className="font-medium">{supplier.taxOffice}</p>
                  </div>
                )}
                {supplier.taxNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vergi Numarası</p>
                    <p className="font-medium">{supplier.taxNumber}</p>
                  </div>
                )}
                {supplier.mersisNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">MERSIS Numarası</p>
                    <p className="font-medium">{supplier.mersisNumber}</p>
                  </div>
                )}
                {supplier.tradeRegistryNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticaret Sicil Numarası</p>
                    <p className="font-medium">{supplier.tradeRegistryNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>İş Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tedarikçi Kodu</p>
                  <p className="font-medium">{supplier.supplierCode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                  <p className="font-medium">{getCategoryBadge(supplier.supplierCategory)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <p className="font-medium">{getStatusBadge(supplier.status)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Metrics */}
            {(supplier.leadTimeDays || supplier.minimumOrderQuantity) && (
              <Card>
                <CardHeader>
                  <CardTitle>Tedarikçi Metrikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.leadTimeDays && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teslim Süresi</p>
                        <p className="font-medium">{supplier.leadTimeDays} gün</p>
                      </div>
                    </div>
                  )}
                  {supplier.minimumOrderQuantity && (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Min. Sipariş Miktarı</p>
                        <p className="font-medium">{supplier.minimumOrderQuantity}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.notes ? (
                <p className="whitespace-pre-wrap">{supplier.notes}</p>
              ) : (
                <p className="text-muted-foreground">Henüz not eklenmemiş</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
