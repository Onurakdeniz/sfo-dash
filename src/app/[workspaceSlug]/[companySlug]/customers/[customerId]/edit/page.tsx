'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';

interface CustomerFormData {
  name: string;
  fullName: string;
  customerType: 'individual' | 'corporate';
  customerCategory: 'vip' | 'premium' | 'standard' | 'basic' | 'wholesale' | 'retail' | '';
  status: 'active' | 'inactive' | 'prospect' | 'lead' | 'suspended' | 'closed';
  priority: 'low' | 'medium' | 'high';
  industry: string;

  // Contact information
  phone: string;
  email: string;
  website: string;
  fax: string;

  // Address
  address: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;

  // Turkish business identifiers
  taxOffice: string;
  taxNumber: string;
  mersisNumber: string;
  tradeRegistryNumber: string;

  // Financial
  creditLimit: string;
  paymentTerms: string;
  discountRate: string;

  // Primary contact
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactPhone: string;
  primaryContactEmail: string;

  // Additional fields
  customerGroup: string;
  notes: string;
  internalNotes: string;
  tags: string[];
}

export default function EditCustomerPage() {
  const { workspaceSlug, companySlug, customerId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    fullName: '',
    customerType: 'corporate',
    customerCategory: '',
    status: 'active',
    priority: 'medium',
    industry: '',
    phone: '',
    email: '',
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
    creditLimit: '',
    paymentTerms: '',
    discountRate: '',
    primaryContactName: '',
    primaryContactTitle: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    customerGroup: '',
    notes: '',
    internalNotes: '',
    tags: [],
  });

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchCustomer();
  }, [workspaceSlug, companySlug, customerId]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Hata',
            description: 'Müşteri bulunamadı',
            variant: 'destructive',
          });
          router.push(`/${workspaceSlug}/${companySlug}/customers`);
          return;
        }
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      const customer = data.customer;

      setFormData({
        name: customer.name || '',
        fullName: customer.fullName || '',
        customerType: customer.customerType || 'corporate',
        customerCategory: customer.customerCategory || '',
        status: customer.status || 'active',
        priority: customer.priority || 'medium',
        industry: customer.industry || '',
        phone: customer.phone || '',
        email: customer.email || '',
        website: customer.website || '',
        fax: customer.fax || '',
        address: customer.address || '',
        district: customer.district || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'Türkiye',
        taxOffice: customer.taxOffice || '',
        taxNumber: customer.taxNumber || '',
        mersisNumber: customer.mersisNumber || '',
        tradeRegistryNumber: customer.tradeRegistryNumber || '',
        creditLimit: customer.creditLimit?.toString() || '',
        paymentTerms: customer.paymentTerms || '',
        discountRate: customer.discountRate?.toString() || '',
        primaryContactName: customer.primaryContactName || '',
        primaryContactTitle: customer.primaryContactTitle || '',
        primaryContactPhone: customer.primaryContactPhone || '',
        primaryContactEmail: customer.primaryContactEmail || '',
        customerGroup: customer.customerGroup || '',
        notes: customer.notes || '',
        internalNotes: customer.internalNotes || '',
        tags: customer.tags || [],
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'Hata',
        description: 'Müşteri bilgileri yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof CustomerFormData]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'tag') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Müşteri adı zorunludur';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (formData.website && !/^https?:\/\/.*\..*/.test(formData.website)) {
      newErrors.website = 'Geçerli bir web sitesi adresi girin';
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    if (formData.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryContactEmail)) {
      newErrors.primaryContactEmail = 'Geçerli bir email adresi girin';
    }

    if (formData.primaryContactPhone && !/^\+?[1-9]\d{1,14}$/.test(formData.primaryContactPhone.replace(/\s/g, ''))) {
      newErrors.primaryContactPhone = 'Geçerli bir telefon numarası girin';
    }

    if (formData.taxNumber && !/^\d{10,11}$/.test(formData.taxNumber)) {
      newErrors.taxNumber = 'Vergi numarası 10-11 haneli olmalıdır';
    }

    if (formData.mersisNumber && !/^\d{16}$/.test(formData.mersisNumber)) {
      newErrors.mersisNumber = 'Mersis numarası 16 haneli olmalıdır';
    }

    if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Posta kodu 5 haneli olmalıdır';
    }

    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      newErrors.creditLimit = 'Kredi limiti sayısal bir değer olmalıdır';
    }

    if (formData.discountRate && (isNaN(Number(formData.discountRate)) || Number(formData.discountRate) < 0 || Number(formData.discountRate) > 100)) {
      newErrors.discountRate = 'İndirim oranı 0-100 arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Hata',
        description: 'Lütfen formu doğru şekilde doldurun',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        ...formData,
        customerCategory: formData.customerCategory || null,
        creditLimit: formData.creditLimit ? Number(formData.creditLimit) : null,
        discountRate: formData.discountRate ? Number(formData.discountRate) : null,
        tags: formData.tags,
        securityClearances: formData.securityClearances,
        projectCodes: formData.projectCodes,
        metadata: {},
      };

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      const result = await response.json();

      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla güncellendi',
      });

      router.push(`/${workspaceSlug}/${companySlug}/customers/${customerId}`);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Müşteri güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Müşteri Düzenle"
      description="Müşteri bilgilerini güncelleyin"
      className="p-0"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>
                Müşterinin temel bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Müşteri Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fullName">Tam Adı</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerType">Müşteri Tipi</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(value) => handleInputChange('customerType', value as any)}
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
                <div>
                  <Label htmlFor="customerCategory">Müşteri Kategorisi</Label>
                  <Select
                    value={formData.customerCategory}
                    onValueChange={(value) => handleInputChange('customerCategory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Seçin</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="standard">Standart</SelectItem>
                      <SelectItem value="basic">Temel</SelectItem>
                      <SelectItem value="wholesale">Toptan</SelectItem>
                      <SelectItem value="retail">Perakende</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="prospect">Potansiyel</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                      <SelectItem value="closed">Kapalı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="industry">Sektör</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
              <CardDescription>
                Müşterinin iletişim bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Web Sitesi</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive mt-1">{errors.website}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => handleInputChange('fax', e.target.value)}
                    className={errors.fax ? 'border-destructive' : ''}
                  />
                  {errors.fax && (
                    <p className="text-sm text-destructive mt-1">{errors.fax}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Adres Bilgileri</CardTitle>
              <CardDescription>
                Müşterinin adres bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={errors.postalCode ? 'border-destructive' : ''}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="country">Ülke</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Güncelle'}
            </Button>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
