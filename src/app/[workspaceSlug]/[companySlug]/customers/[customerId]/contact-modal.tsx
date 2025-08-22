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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Phone, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface ContactModalProps {
  workspaceSlug: string;
  companySlug: string;
  customerId: string;
  contacts: CustomerContact[];
  onContactUpdate: (contacts: CustomerContact[]) => void;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  email: string;
  role: string;
  isPrimary: boolean;
}

const initialFormData: ContactFormData = {
  firstName: '',
  lastName: '',
  title: '',
  phone: '',
  email: '',
  role: 'contact',
  isPrimary: false,
};

export interface ContactModalRef {
  openCreate: () => void;
  openEdit: (contact: CustomerContact) => void;
}

export const ContactModal = forwardRef<ContactModalRef, ContactModalProps>(function ContactModal(
  { workspaceSlug, companySlug, customerId, contacts, onContactUpdate },
  ref
) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContact(null);
  };

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      resetForm();
      setOpen(true);
    },
    openEdit: (contact: CustomerContact) => {
      handleEdit(contact);
    }
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: 'Hata',
        description: 'Ad ve soyad alanları zorunludur',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingContact
        ? `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts/${editingContact.id}`
        : `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts`;

      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save contact');
      }

      const result = await response.json();

      if (editingContact) {
        const updatedContacts = contacts.map(contact =>
          contact.id === editingContact.id ? result.contact : contact
        );
        onContactUpdate(updatedContacts);
        toast({
          title: 'Başarılı',
          description: 'Kişi güncellendi',
        });
      } else {
        onContactUpdate([...contacts, result.contact]);
        toast({
          title: 'Başarılı',
          description: 'Kişi eklendi',
        });
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Hata',
        description: 'Kişi kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (contact: CustomerContact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || 'contact',
      isPrimary: contact.isPrimary,
    });
    setOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      const updatedContacts = contacts.filter(contact => contact.id !== contactId);
      onContactUpdate(updatedContacts);

      toast({
        title: 'Başarılı',
        description: 'Kişi silindi',
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Hata',
        description: 'Kişi silinirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };



  const roles = [
    { value: 'contact', label: 'İletişim Kişisi' },
    { value: 'decision_maker', label: 'Karar Verici' },
    { value: 'influencer', label: 'Etkileyici' },
    { value: 'user', label: 'Kullanıcı' },
    { value: 'other', label: 'Diğer' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="shopifyPrimary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Kişi Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContact ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri kişi bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Ad *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ad"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Soyad *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Soyad"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Ünvan</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Müdür, Asistan, vb."
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+90 216 555 1234"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div></div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: checked as boolean })
                }
              />
              <Label htmlFor="isPrimary">Ana kişi</Label>
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
              {editingContact ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>


      </DialogContent>
    </Dialog>
  );
});
