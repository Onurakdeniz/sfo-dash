'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Building,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  city: string;
  supplierCode: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaceSlug, companySlug } = params;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter, typeFilter, categoryFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (typeFilter !== 'all') queryParams.append('type', typeFilter);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/suppliers?${queryParams}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Tedarikçileri yüklerken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers();
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

  const getTypeIcon = (type: string) => {
    return type === 'corporate' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tedarikçiler</h1>
          <p className="text-muted-foreground">
            Tedarikçi bilgilerini yönetin ve takip edin
          </p>
        </div>
        <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Tedarikçi
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tedarikçi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
                <SelectItem value="prospect">Potansiyel</SelectItem>
                <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                <SelectItem value="blacklisted">Kara Liste</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="individual">Bireysel</SelectItem>
                <SelectItem value="corporate">Kurumsal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="strategic">Stratejik</SelectItem>
                <SelectItem value="preferred">Tercih Edilen</SelectItem>
                <SelectItem value="approved">Onaylı</SelectItem>
                <SelectItem value="standard">Standart</SelectItem>
                <SelectItem value="new">Yeni</SelectItem>
                <SelectItem value="temporary">Geçici</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Listesi ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz tedarikçi bulunmuyor</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/new`)}
              >
                İlk tedarikçiyi ekle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Şehir</TableHead>
                  <TableHead>Tedarikçi Kodu</TableHead>
                  <TableHead className="w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(supplier.supplierType)}
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.fullName && (
                            <div className="text-sm text-muted-foreground">
                              {supplier.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.supplierType === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(supplier.supplierCategory)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          {supplier.city}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {supplier.supplierCode || '-'}
                      </code>
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
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplier.id}`)}
                          >
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplier.id}/edit`)}
                          >
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplier.id}/addresses`)}
                          >
                            Adresler
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/suppliers/${supplier.id}/contacts`)}
                          >
                            Kişiler
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
