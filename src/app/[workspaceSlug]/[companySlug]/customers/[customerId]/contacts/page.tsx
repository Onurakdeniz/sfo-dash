'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Users, Phone, Mail, ArrowLeft, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CompanyPageLayout from '@/components/layouts/company-page-layout';
import CustomerTabs from '../customer-tabs';
import { ContactModal, ContactModalRef } from '../contact-modal';

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

export default function CustomerContactsPage() {
  const { workspaceSlug, companySlug, customerId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<ContactModalRef>(null);

  useEffect(() => {
    fetchContacts();
  }, [workspaceSlug, companySlug, customerId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer contacts');
      }

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Hata',
        description: 'Kişiler yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CompanyPageLayout
        title="Kişiler"
        description="Müşteri kişileri yükleniyor..."
        className="p-0"
        actions={
          <Button variant="shopifySecondary" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        }
        tabs={<CustomerTabs />}
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CompanyPageLayout>
    );
  }

  const handleDelete = async (contactId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts/${contactId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete contact');
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast({ title: 'Başarılı', description: 'Kişi silindi' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Kişi silinirken bir hata oluştu', variant: 'destructive' });
    }
  };

  const handleMakePrimary = async (contactId: string) => {
    try {
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return;
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPrimary: true }),
        }
      );
      if (!response.ok) throw new Error('Failed to update primary contact');
      const result = await response.json();
      setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === result.contact.id })));
      toast({ title: 'Başarılı', description: 'Ana kişi güncellendi' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Ana kişi güncellenemedi', variant: 'destructive' });
    }
  };

  return (
    <CompanyPageLayout
      title="Kişiler"
      description="Müşteri kişilerini yönetin"
      className="p-0"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="shopifySecondary" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <ContactModal
            ref={modalRef}
            workspaceSlug={String(workspaceSlug)}
            companySlug={String(companySlug)}
            customerId={String(customerId)}
            contacts={contacts}
            onContactUpdate={(updated) => setContacts(updated)}
          />
        </div>
      }
      tabs={<CustomerTabs />}
    >
      <div className="space-y-6">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Henüz kişi eklenmemiş
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bu müşteriye ait iletişim kişileri henüz eklenmemiş. İlk kişiyi eklemek için butona tıklayın.
              </p>
              <Button variant="shopifyPrimary" size="lg" onClick={() => modalRef.current?.openCreate()}>
                <Plus className="h-5 w-5 mr-2" />
                İlk Kişiyi Ekle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Ünvan</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          Ana Kişi
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.title || "-"}
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.email || "-"}
                  </TableCell>
                  <TableCell>
                    {contact.role ? (
                      <Badge variant="secondary" className="text-xs">
                        {contact.role}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!contact.isPrimary && (
                        <Button
                          variant="shopifyOutline"
                          size="xs"
                          onClick={() => handleMakePrimary(contact.id)}
                        >
                          Ana Kişi Yap
                        </Button>
                      )}
                      <Button
                        variant="shopifyOutline"
                        size="xs"
                        onClick={() => modalRef.current?.openEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="shopifyDestructive"
                        size="xs"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}


      </div>
    </CompanyPageLayout>
  );
}
