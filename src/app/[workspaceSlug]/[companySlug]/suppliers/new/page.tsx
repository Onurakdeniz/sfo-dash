'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NewSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaceSlug, companySlug } = params;

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    supplierType: 'individual',
    supplierCategory: 'standard',
    email: '',
    phone: '',
    website: '',
    fax: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
    country: 'Türkiye',
    taxOffice: '',
    taxNumber: '',
    mersisNumber: '',
    tradeRegistryNumber: '',
    supplierCode: '',
    leadTimeDays: '',
    minimumOrderQuantity: '',
    orderIncrement: '',
    primaryContactName: '',
    primaryContactTitle: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/suppliers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
            minimumOrderQuantity: formData.minimumOrderQuantity ? parseInt(formData.minimumOrderQuantity) : undefined,
            orderIncrement: formData.orderIncrement ? parseInt(formData.orderIncrement) : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create supplier');
      }

      const result = await response.json();
      toast.success('Tedarikçi başarıyla oluşturuldu');
      router.push(`/${workspaceSlug}/${companySlug}/suppliers/${result.supplier.id}`);
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error(error instanceof Error ? error.message : 'Tedarikçi oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Yeni Tedarikçi</h1>
          <p className="text-muted-foreground">
            Yeni bir tedarikçi ekleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tedarikçi Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Tam Adı</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierType">Tedarikçi Tipi</Label>
                <Select
                  value={formData.supplierType}
                  onValueChange={(value) => handleInputChange('supplierType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Bireysel</SelectItem>
                    <SelectItem value="corporate">Kurumsal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierCategory">Kategori</Label>
                <Select
                  value={formData.supplierCategory}
                  onValueChange={(value) => handleInputChange('supplierCategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic">Stratejik</SelectItem>
                    <SelectItem value="preferred">Tercih Edilen</SelectItem>
                    <SelectItem value="approved">Onaylı</SelectItem>
                    <SelectItem value="standard">Standart</SelectItem>
                    <SelectItem value="new">Yeni</SelectItem>
                    <SelectItem value="temporary">Geçici</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierCode">Tedarikçi Kodu</Label>
              <Input
                id="supplierCode"
                value={formData.supplierCode}
                onChange={(e) => handleInputChange('supplierCode', e.target.value)}
                placeholder="Otomatik oluşturulacak"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={formData.fax}
                  onChange={(e) => handleInputChange('fax', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Adres Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Posta Kodu</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vergi ve Resmi Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                <Input
                  id="taxOffice"
                  value={formData.taxOffice}
                  onChange={(e) => handleInputChange('taxOffice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Vergi Numarası</Label>
                <Input
                  id="taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mersisNumber">MERSIS Numarası</Label>
                <Input
                  id="mersisNumber"
                  value={formData.mersisNumber}
                  onChange={(e) => handleInputChange('mersisNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeRegistryNumber">Ticaret Sicil Numarası</Label>
                <Input
                  id="tradeRegistryNumber"
                  value={formData.tradeRegistryNumber}
                  onChange={(e) => handleInputChange('tradeRegistryNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Specific Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tedarikçi Özel Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadTimeDays">Teslim Süresi (Gün)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  value={formData.leadTimeDays}
                  onChange={(e) => handleInputChange('leadTimeDays', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumOrderQuantity">Minimum Sipariş Miktarı</Label>
                <Input
                  id="minimumOrderQuantity"
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) => handleInputChange('minimumOrderQuantity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderIncrement">Sipariş Artışı</Label>
                <Input
                  id="orderIncrement"
                  type="number"
                  value={formData.orderIncrement}
                  onChange={(e) => handleInputChange('orderIncrement', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Birincil İletişim Kişisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactName">Ad Soyad</Label>
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactTitle">Ünvan</Label>
                <Input
                  id="primaryContactTitle"
                  value={formData.primaryContactTitle}
                  onChange={(e) => handleInputChange('primaryContactTitle', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactPhone">Telefon</Label>
                <Input
                  id="primaryContactPhone"
                  value={formData.primaryContactPhone}
                  onChange={(e) => handleInputChange('primaryContactPhone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactEmail">E-posta</Label>
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Genel Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Tedarikçi hakkında ek bilgiler..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Kaydediliyor...' : 'Tedarikçiyi Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
