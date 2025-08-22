'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AddressModalProps {
  workspaceSlug: string;
  companySlug: string;
  customerId: string;
  addresses: CustomerAddress[];
  onAddressUpdate: (addresses: CustomerAddress[]) => void;
}

export interface AddressModalRef {
  openCreate: () => void;
  openEdit: (address: CustomerAddress) => void;
}

interface AddressFormData {
  addressType: string;
  title: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  contactName: string;
  contactTitle: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormData: AddressFormData = {
  addressType: 'home',
  title: '',
  address: '',
  district: '',
  city: '',
  postalCode: '',
  country: 'Türkiye',
  phone: '',
  email: '',
  contactName: '',
  contactTitle: '',
  isDefault: false,
  isActive: true,
};

export const AddressModal = forwardRef<AddressModalRef, AddressModalProps>(function AddressModal(
  { workspaceSlug, companySlug, customerId, addresses, onAddressUpdate },
  ref
) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingAddress(null);
  };

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      resetForm();
      setOpen(true);
    },
    openEdit: (address: CustomerAddress) => {
      handleEdit(address);
    }
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      toast({
        title: 'Hata',
        description: 'Adres alanı zorunludur',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingAddress
        ? `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/addresses/${editingAddress.id}`
        : `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/addresses`;

      const response = await fetch(url, {
        method: editingAddress ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      const result = await response.json();

      if (editingAddress) {
        const updatedAddresses = addresses.map(addr =>
          addr.id === editingAddress.id ? result.address : addr
        );
        onAddressUpdate(updatedAddresses);
        toast({
          title: 'Başarılı',
          description: 'Adres güncellendi',
        });
      } else {
        onAddressUpdate([...addresses, result.address]);
        toast({
          title: 'Başarılı',
          description: 'Adres eklendi',
        });
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: 'Hata',
        description: 'Adres kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFormData({
      addressType: address.addressType,
      title: address.title || '',
      address: address.address,
      district: address.district || '',
      city: address.city || '',
      postalCode: address.postalCode || '',
      country: address.country,
      phone: address.phone || '',
      email: address.email || '',
      contactName: address.contactName || '',
      contactTitle: address.contactTitle || '',
      isDefault: address.isDefault,
      isActive: address.isActive,
    });
    setOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/addresses/${addressId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      onAddressUpdate(updatedAddresses);

      toast({
        title: 'Başarılı',
        description: 'Adres silindi',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Hata',
        description: 'Adres silinirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const addressTypes = [
    { value: 'home', label: 'Ev Adresi' },
    { value: 'work', label: 'İş Adresi' },
    { value: 'billing', label: 'Fatura Adresi' },
    { value: 'shipping', label: 'Teslimat Adresi' },
    { value: 'other', label: 'Diğer' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="shopifyPrimary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adres Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri adres bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="addressType">Adres Tipi</Label>
              <Select
                value={formData.addressType}
                onValueChange={(value) => setFormData({ ...formData, addressType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {addressTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Başlık (Opsiyonel)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ev, İş, vb."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adres *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Tam adres bilgisi"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="district">İlçe</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="İlçe"
              />
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Şehir"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Posta Kodu</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="34000"
              />
            </div>
            <div>
              <Label htmlFor="country">Ülke</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Türkiye"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactName">İletişim Kişisi</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
            <div>
              <Label htmlFor="contactTitle">Ünvan</Label>
              <Input
                id="contactTitle"
                value={formData.contactTitle}
                onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                placeholder="Müdür, Asistan, vb."
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked as boolean })
                }
              />
              <Label htmlFor="isDefault">Varsayılan adres</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button type="submit" variant="shopifyPrimary">
              {editingAddress ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>

        {addresses.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-3">Mevcut Adresler</h4>
            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">
                          {address.title || `${address.addressType} Adresi`}
                        </h5>
                        {address.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Varsayılan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                      {(address.district || address.city) && (
                        <p className="text-sm text-muted-foreground">
                          {[address.district, address.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {(address.phone || address.email) && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {address.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {address.phone}
                            </div>
                          )}
                          {address.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {address.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
