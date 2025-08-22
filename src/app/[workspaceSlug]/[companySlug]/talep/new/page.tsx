'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { ArrowLeft, Save, User, Phone, Mail } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  fullName: string | null;
  customerType: 'individual' | 'corporate';
  email: string | null;
  phone: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export default function NewTalepPage() {
  const { workspaceSlug, companySlug } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general_inquiry',
    category: '',
    priority: 'medium',
    customerId: '',
    assignedTo: 'unassigned',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    deadline: '',
    estimatedHours: '',
    estimatedCost: '',
    billingStatus: '',
    tags: [] as string[],
    notes: '',
    metadata: {},
  });

  // Fetch customers and users for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch(
          `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers?limit=1000`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.customers || []);
        }

        // Fetch employees for assignment selector
        const employeesRes = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/employees`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (employeesRes.ok) {
          const employees = await employeesRes.json();
          setUsers(
            (employees || []).map((e: any) => ({ id: e.id, name: e.name, email: e.email }))
          );
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [workspaceSlug, companySlug]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setFormData(prev => ({
      ...prev,
      customerId,
      contactName: customer?.name || '',
      contactEmail: customer?.email || '',
      contactPhone: customer?.phone || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        deadline: formData.deadline || null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        billingStatus: formData.billingStatus || null,
        notes: formData.notes || null,
        category: formData.category || null,
        assignedTo: formData.assignedTo === 'unassigned' ? null : formData.assignedTo || null,
      };

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create talep');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Talep başarıyla oluşturuldu',
      });

      router.push(`/${workspaceSlug}/${companySlug}/talep/${result.talep.id}`);

    } catch (error) {
      console.error('Error creating talep:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create talep',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <PageWrapper
      title="Yeni Talep"
      description="Yeni müşteri talebi oluşturun"
      className="max-w-4xl"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>
              Talep için temel bilgileri girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Talep Başlığı *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Talep başlığını girin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Müşteri *</Label>
                <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Talep açıklamasını girin"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Talep Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotation_request">Teklif Talebi</SelectItem>
                    <SelectItem value="price_request">Fiyat Talebi</SelectItem>
                    <SelectItem value="product_inquiry">Ürün Sorgusu</SelectItem>
                    <SelectItem value="order_request">Sipariş Talebi</SelectItem>
                    <SelectItem value="sample_request">Numune Talebi</SelectItem>
                    <SelectItem value="delivery_status">Teslimat Durumu</SelectItem>
                    <SelectItem value="return_request">İade Talebi</SelectItem>
                    <SelectItem value="billing">Fatura</SelectItem>
                    <SelectItem value="technical_support">Teknik Destek</SelectItem>
                    <SelectItem value="general_inquiry">Genel Soru</SelectItem>
                    <SelectItem value="complaint">Şikayet</SelectItem>
                    <SelectItem value="feature_request">Özellik Talebi</SelectItem>
                    <SelectItem value="bug_report">Hata Bildirimi</SelectItem>
                    <SelectItem value="installation">Kurulum</SelectItem>
                    <SelectItem value="training">Eğitim</SelectItem>
                    <SelectItem value="maintenance">Bakım</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Donanım</SelectItem>
                    <SelectItem value="software">Yazılım</SelectItem>
                    <SelectItem value="network">Ağ</SelectItem>
                    <SelectItem value="database">Veritabanı</SelectItem>
                    <SelectItem value="security">Güvenlik</SelectItem>
                    <SelectItem value="performance">Performans</SelectItem>
                    <SelectItem value="integration">Entegrasyon</SelectItem>
                    <SelectItem value="reporting">Raporlama</SelectItem>
                    <SelectItem value="user_access">Kullanıcı Erişimi</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        {selectedCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">İletişim Kişisi</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="İletişim kişisi adı"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Atanan Kişi</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Atanmamış</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefon</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Telefon numarası"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-posta</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduling and Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Zamanlama ve Finans</CardTitle>
            <CardDescription>
              İsteğe bağlı zamanlama ve finans bilgilerini girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Son Tarih</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Tahmini Saat</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Tahmini Maliyet</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Ek Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek notlar..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Etiketler</Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleTagRemove(tag)}>
                    {tag} ×
                  </Badge>
                ))}
                <Input
                  placeholder="Etiket ekleyin (Enter ile)"
                  className="w-32"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      handleTagAdd(target.value.trim());
                      target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}
            disabled={loading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Talebi Oluştur
              </>
            )}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}
