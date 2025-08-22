'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Phone, Mail, MapPin, User, Calendar, Tag, FileText, Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CompanyPageLayout from '@/components/layouts/company-page-layout';
import CustomerTabs from '../customer-tabs';
import { AddressModal, AddressModalRef } from '../address-modal';
import { NoteModal, NoteModalRef } from '../note-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Customer {
  id: string;
  name: string;
  fullName: string | null;
  customerType: 'individual' | 'corporate';
  customerCategory: 'vip' | 'premium' | 'standard' | 'basic' | 'wholesale' | 'retail' | null;
  status: 'active' | 'inactive' | 'prospect' | 'lead' | 'suspended' | 'closed';
  priority: 'low' | 'medium' | 'high';
  industry: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  fax: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  taxOffice: string | null;
  taxNumber: string | null;
  mersisNumber: string | null;
  tradeRegistryNumber: string | null;
  defaultCurrency: string;
  creditLimit: number | null;
  paymentTerms: string | null;
  discountRate: number | null;
  primaryContactName: string | null;
  primaryContactTitle: string | null;
  primaryContactPhone: string | null;
  primaryContactEmail: string | null;
  customerGroup: string | null;
  tags: string[];
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerAddress {
  id: string;
  addressType: string;
  title: string | null;
  address: string;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  contactTitle: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface CustomerNote {
  id: string;
  title: string | null;
  content: string;
  noteType: string;
  isInternal: boolean;
  priority: string;
  createdAt: string;
  updatedAt?: string;
}



export default function CustomerDetayPage() {
  const { workspaceSlug, companySlug, customerId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const handleNavigateToEdit = () => {
    router.push(`/${workspaceSlug}/${companySlug}/customers/${customerId}/edit`);
  };

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit states
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editBasic, setEditBasic] = useState<any>({});
  const [editContact, setEditContact] = useState<any>({});

  // Modals for address and notes
  const addressModalRef = React.useRef<AddressModalRef>(null);
  const noteModalRef = React.useRef<NoteModalRef>(null);

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
          return;
        }
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setAddresses(data.addresses || []);
      setNotes(data.notes || []);
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

  const saveCustomerPart = async (data: Record<string, any>) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Güncelleme başarısız');
      }
      await fetchCustomer();
      toast({ title: 'Başarılı', description: 'Bilgiler güncellendi' });
    } catch (e) {
      toast({ title: 'Hata', description: e instanceof Error ? e.message : 'Güncelleme sırasında hata', variant: 'destructive' });
      throw e;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'prospect':
        return 'outline';
      case 'lead':
        return 'outline';
      case 'suspended':
        return 'destructive';
      case 'closed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      case 'prospect':
        return 'Potansiyel';
      case 'lead':
        return 'Lead';
      case 'suspended':
        return 'Askıya Alınmış';
      case 'closed':
        return 'Kapalı';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Bireysel';
      case 'corporate':
        return 'Kurumsal';
      default:
        return type;
    }
  };

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case 'vip':
        return 'VIP';
      case 'premium':
        return 'Premium';
      case 'standard':
        return 'Standart';
      case 'basic':
        return 'Temel';
      case 'wholesale':
        return 'Toptan';
      case 'retail':
        return 'Perakende';
      default:
        return '-';
    }
  };

  const getNoteTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'general':
        return 'default';
      case 'meeting':
        return 'outline';
      case 'reminder':
        return 'secondary';
      case 'follow-up':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };
  const getNoteTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'general':
        return 'Genel';
      case 'meeting':
        return 'Toplantı';
      case 'reminder':
        return 'Hatırlatma';
      case 'follow-up':
        return 'Takip';
      default:
        return type;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/notes/${noteId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Silme başarısız');
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: 'Başarılı', description: 'Not silindi' });
    } catch (e) {
      toast({ title: 'Hata', description: e instanceof Error ? e.message : 'Not silinirken hata', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <CompanyPageLayout
        title="Müşteri Detayları"
        description="Müşteri detayları yükleniyor..."
        className="pt-0 px-4 md:px-6"
        tabs={<CustomerTabs />}
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CompanyPageLayout>
    );
  }

  if (!customer) {
    return (
      <CompanyPageLayout
        title="Müşteri Bulunamadı"
        description="Müşteri detayları bulunamadı"
        className="pt-0 px-4 md:px-6"
        tabs={<CustomerTabs />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground">Müşteri bulunamadı.</p>
        </div>
      </CompanyPageLayout>
    );
  }

  return (
    <CompanyPageLayout
      title={customer.name}
      description="Müşteri detayları ve bilgileri"
      className="pt-0 px-4 md:px-6"
      tabs={<CustomerTabs />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Temel Bilgiler</CardTitle>
              {isEditingBasic ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditingBasic(false); setEditBasic({}); }}>
                    İptal
                  </Button>
                  <Button size="sm" onClick={async () => {
                    const payload: any = { ...editBasic };
                    if (typeof payload.tagsString === 'string') {
                      payload.tags = payload.tagsString.split(',').map((t: string) => t.trim()).filter(Boolean);
                      delete payload.tagsString;
                    }
                    await saveCustomerPart(payload);
                    setIsEditingBasic(false);
                    setEditBasic({});
                  }}>
                    Kaydet
                  </Button>
                </div>
              ) : (
                <Button variant="shopifyOutline" size="sm" onClick={() => {
                  if (!customer) return;
                  setEditBasic({
                    name: customer.name,
                    fullName: customer.fullName || '',
                    customerType: customer.customerType,
                    customerCategory: customer.customerCategory || undefined,
                    priority: customer.priority,
                    status: customer.status,
                    industry: customer.industry || '',
                    customerGroup: customer.customerGroup || '',
                    taxNumber: customer.taxNumber || '',
                    taxOffice: customer.taxOffice || '',
                    mersisNumber: customer.mersisNumber || '',
                    tradeRegistryNumber: customer.tradeRegistryNumber || '',
                    tagsString: (customer.tags || []).join(', '),
                  });
                  setIsEditingBasic(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Müşteri Adı</Label>
                  {isEditingBasic ? (
                    <Input value={editBasic.name || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, name: e.target.value }))} />
                  ) : (
                    <p className="text-sm font-medium">{customer.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Tam Adı</Label>
                  {isEditingBasic ? (
                    <Input value={editBasic.fullName || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, fullName: e.target.value }))} />
                  ) : (
                    <p className={`text-sm ${customer.fullName ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {customer.fullName || 'Henüz girilmedi'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Müşteri Tipi</Label>
                  {isEditingBasic ? (
                    <Select value={editBasic.customerType} onValueChange={(v) => setEditBasic((p: any) => ({ ...p, customerType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Bireysel</SelectItem>
                        <SelectItem value="corporate">Kurumsal</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant="outline" className="font-medium">
                        {getTypeLabel(customer.customerType)}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Müşteri Kategorisi</Label>
                  {isEditingBasic ? (
                    <Select value={editBasic.customerCategory || ''} onValueChange={(v) => setEditBasic((p: any) => ({ ...p, customerCategory: v || undefined }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="standard">Standart</SelectItem>
                        <SelectItem value="basic">Temel</SelectItem>
                        <SelectItem value="wholesale">Toptan</SelectItem>
                        <SelectItem value="retail">Perakende</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className={`text-sm ${customer.customerCategory ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {getCategoryLabel(customer.customerCategory) || 'Henüz girilmedi'}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Öncelik</Label>
                  {isEditingBasic ? (
                    <Select value={editBasic.priority} onValueChange={(v) => setEditBasic((p: any) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant={getPriorityBadgeVariant(customer.priority)} className="font-medium">
                        {getPriorityLabel(customer.priority)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Müşteri Durumu</Label>
                  {isEditingBasic ? (
                    <Select value={editBasic.status} onValueChange={(v) => setEditBasic((p: any) => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Pasif</SelectItem>
                        <SelectItem value="prospect">Potansiyel</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                        <SelectItem value="closed">Kapalı</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(customer.status)} className="font-medium">
                        {getStatusLabel(customer.status)}
                      </Badge>
                    </div>
                  )}
                </div>
                {/* Sektör alanı kaldırıldı */}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Etiketler</Label>
                {isEditingBasic ? (
                  <Input value={editBasic.tagsString || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, tagsString: e.target.value }))} placeholder="Etiketleri virgülle ayırın" />
                ) : (
                  <div className="mt-1">
                    {customer.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="font-medium">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Henüz etiket eklenmedi</p>
                    )}
                  </div>
                )}
              </div>

              {/* Company Information Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tax ID
                  </Label>
                  {isEditingBasic ? (
                    <Input value={editBasic.taxNumber || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, taxNumber: e.target.value }))} />
                  ) : (
                    <p className={`text-sm ${customer.taxNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {customer.taxNumber || 'Henüz girilmedi'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Vergi Dairesi</Label>
                  {isEditingBasic ? (
                    <Input value={editBasic.taxOffice || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, taxOffice: e.target.value }))} />
                  ) : (
                    <p className={`text-sm ${customer.taxOffice ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {customer.taxOffice || 'Henüz girilmedi'}
                    </p>
                  )}
                </div>
              </div>

              {(isEditingBasic ? editBasic.customerType : customer.customerType) === 'corporate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Mersis Numarası</Label>
                    {isEditingBasic ? (
                      <Input value={editBasic.mersisNumber || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, mersisNumber: e.target.value }))} />
                    ) : (
                      <p className={`text-sm ${customer.mersisNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                        {customer.mersisNumber || 'Henüz girilmedi'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Ticaret Sicil No</Label>
                    {isEditingBasic ? (
                      <Input value={editBasic.tradeRegistryNumber || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, tradeRegistryNumber: e.target.value }))} />
                    ) : (
                      <p className={`text-sm ${customer.tradeRegistryNumber ? 'font-medium' : 'text-muted-foreground italic'}`}>
                        {customer.tradeRegistryNumber || 'Henüz girilmedi'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Müşteri Grubu</Label>
                  {isEditingBasic ? (
                    <Input value={editBasic.customerGroup || ''} onChange={(e) => setEditBasic((p: any) => ({ ...p, customerGroup: e.target.value }))} />
                  ) : (
                    <p className={`text-sm ${customer.customerGroup ? 'font-medium' : 'text-muted-foreground italic'}`}>
                      {customer.customerGroup || 'Henüz girilmedi'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>İletişim Bilgileri</CardTitle>
              {isEditingContact ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditingContact(false); setEditContact({}); }}>
                    İptal
                  </Button>
                  <Button size="sm" onClick={async () => {
                    await saveCustomerPart(editContact);
                    setIsEditingContact(false);
                    setEditContact({});
                  }}>
                    Kaydet
                  </Button>
                </div>
              ) : (
                <Button variant="shopifyOutline" size="sm" onClick={() => {
                  if (!customer) return;
                  setEditContact({
                    phone: customer.phone || '',
                    email: customer.email || '',
                    website: customer.website || '',
                  });
                  setIsEditingContact(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingContact ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                    <Input value={editContact.phone || ''} onChange={(e) => setEditContact((p: any) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <Input type="email" value={editContact.email || ''} onChange={(e) => setEditContact((p: any) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Web Sitesi</Label>
                    <Input value={editContact.website || ''} onChange={(e) => setEditContact((p: any) => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                        <p className={`text-sm ${customer.phone ? 'font-medium' : 'text-muted-foreground italic'}`}>
                          {customer.phone || 'Henüz girilmedi'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className={`text-sm ${customer.email ? 'font-medium' : 'text-muted-foreground italic'}`}>
                          {customer.email || 'Henüz girilmedi'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Web Sitesi</p>
                    {customer.website ? (
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{customer.website}</a>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Henüz girilmedi</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Adresler</CardTitle>
              <AddressModal
                ref={addressModalRef}
                workspaceSlug={workspaceSlug as string}
                companySlug={companySlug as string}
                customerId={customerId as string}
                addresses={addresses}
                onAddressUpdate={setAddresses}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Henüz adres eklenmemiş</p>
                  <Button variant="shopifyOutline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Adresi Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address, index) => (
                    <div key={address.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">
                                {address.title || `${address.addressType} Adresi`}
                              </h4>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs font-medium">
                                  Varsayılan
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">{address.address}</p>
                            {(address.district || address.city || address.postalCode) && (
                              <p className="text-sm text-muted-foreground">
                                {[address.district, address.city, address.postalCode].filter(Boolean).join(', ')}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{address.country}</p>
                            {(address.phone || address.email) && (
                              <div className="flex flex-wrap gap-4 pt-2">
                                {address.phone && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {address.phone}
                                  </div>
                                )}
                                {address.email && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {address.email}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="shopifyOutline" size="sm" className="flex-shrink-0" onClick={() => addressModalRef.current?.openEdit(address)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>



        </div>

        <div className="space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Notlar</CardTitle>
              <NoteModal
                ref={noteModalRef}
                customerId={customerId as string}
                workspaceSlug={workspaceSlug as string}
                companySlug={companySlug as string}
                notes={notes}
                onNoteUpdate={setNotes}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Henüz not eklenmemiş</p>
                  <Button variant="shopifyOutline" size="sm" onClick={() => noteModalRef.current?.openCreate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Not Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">
                              {note.title || 'Başlıksız Not'}
                            </h4>
                            <Badge variant={getNoteTypeBadgeVariant(note.noteType)} className="font-medium">
                              {getNoteTypeLabel(note.noteType)}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(note.priority)} className="font-medium">
                              {getPriorityLabel(note.priority)}
                            </Badge>

                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap font-medium">{note.content}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => noteModalRef.current?.openEdit(note)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

    </CompanyPageLayout>
  );
}


