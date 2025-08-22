'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Users,
  Phone,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  fax: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function SupplierContactsPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaceSlug, companySlug, supplierId } = params;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [supplierId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/suppliers/${supplierId}/contacts`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch contacts');

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Kişiler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels = {
      sales_rep: 'Satış Temsilcisi',
      account_manager: 'Hesap Müdürü',
      technical_support: 'Teknik Destek',
      purchasing: 'Satın Alma',
      management: 'Yönetim',
      other: 'Diğer',
    };

    return <Badge variant="outline">{roleLabels[role as keyof typeof roleLabels] || role}</Badge>;
  };

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
              <Users className="h-8 w-8" />
              Tedarikçi Kişileri
            </h1>
            <p className="text-muted-foreground">
              Tedarikçi iletişim kişilerini yönetin
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/contacts/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kişi
        </Button>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kişi Listesi ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz kişi eklenmemiş</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/contacts/new`)}
              >
                İlk kişiyi ekle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kişi</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Birincil</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </div>
                        {contact.title && (
                          <div className="text-sm text-muted-foreground">{contact.title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(contact.role)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.mobile} (Cep)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{contact.department || '-'}</div>
                    </TableCell>
                    <TableCell>
                      {contact.isPrimary && <Badge>Birincil</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                        {contact.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/contacts/${contact.id}/edit`)}
                          >
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Handle set as primary
                              toast.success('Birincil kişi olarak ayarlandı');
                            }}
                          >
                            Birincil Yap
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
