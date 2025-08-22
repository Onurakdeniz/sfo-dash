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
  MapPin,
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

interface Address {
  id: string;
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
  createdAt: string;
}

export default function SupplierAddressesPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaceSlug, companySlug, supplierId } = params;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, [supplierId]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/suppliers/${supplierId}/addresses`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch addresses');

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Adresler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getAddressTypeBadge = (type: string) => {
    const typeLabels = {
      billing: 'Fatura',
      shipping: 'Teslimat',
      warehouse: 'Depo',
      headquarters: 'Merkez',
      branch: 'Şube',
    };

    return <Badge variant="outline">{typeLabels[type as keyof typeof typeLabels] || type}</Badge>;
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
              <MapPin className="h-8 w-8" />
              Tedarikçi Adresleri
            </h1>
            <p className="text-muted-foreground">
              Tedarikçi adreslerini yönetin
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/addresses/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Adres
        </Button>
      </div>

      {/* Addresses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adres Listesi ({addresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz adres eklenmemiş</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/addresses/new`)}
              >
                İlk adresi ekle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Adres</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Varsayılan</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow key={address.id}>
                    <TableCell>
                      {getAddressTypeBadge(address.addressType)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{address.title}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{address.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {[address.district, address.city, address.postalCode].filter(Boolean).join(', ')}
                          {address.country && `, ${address.country}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {address.contactName && (
                          <div className="text-sm font-medium">{address.contactName}</div>
                        )}
                        {address.contactTitle && (
                          <div className="text-sm text-muted-foreground">{address.contactTitle}</div>
                        )}
                        {address.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {address.phone}
                          </div>
                        )}
                        {address.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {address.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {address.isDefault && <Badge>Varsayılan</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={address.isActive ? 'default' : 'secondary'}>
                        {address.isActive ? 'Aktif' : 'Pasif'}
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
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplierId}/addresses/${address.id}/edit`)}
                          >
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Handle set as default
                              toast.success('Varsayılan adres olarak ayarlandı');
                            }}
                          >
                            Varsayılan Yap
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
