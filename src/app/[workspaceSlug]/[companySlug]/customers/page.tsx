'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';

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
  city: string | null;
  taxNumber: string | null;
  defaultCurrency: string;
  creditLimit: number | null;
  paymentTerms: string | null;
  primaryContactName: string | null;
  customerGroup: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function CustomersPage() {
  const { workspaceSlug, companySlug } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [workspaceSlug, companySlug]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCustomers(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter]);

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage);
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

  return (
    <PageWrapper
      title="Müşteriler"
      description="Müşteri bilgilerini yönetin ve takip edin"
      className="p-0"
      actions={
        <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/customers/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Müşteri
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Müşteri ara (ad, email, telefon, vergi no)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
                <SelectItem value="prospect">Potansiyel</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="individual">Bireysel</SelectItem>
                <SelectItem value="corporate">Kurumsal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi ({pagination.totalCount})</CardTitle>
          <CardDescription>
            Toplam {pagination.totalCount} müşteri bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz müşteri bulunmuyor.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/customers/new`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                İlk Müşteriyi Ekle
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/${workspaceSlug}/${companySlug}/customers/${customer.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.fullName && (
                            <div className="text-sm text-muted-foreground">
                              {customer.fullName}
                            </div>
                          )}
                          {customer.taxNumber && (
                            <div className="text-xs text-muted-foreground">
                              VKN: {customer.taxNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(customer.customerType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getCategoryLabel(customer.customerCategory)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(customer.status)}>
                          {getStatusLabel(customer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(customer.priority)}>
                          {customer.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.city && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {customer.city}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${workspaceSlug}/${companySlug}/customers/${customer.id}`);
                              }}
                            >
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${workspaceSlug}/${companySlug}/customers/${customer.id}/edit`);
                              }}
                            >
                              Düzenle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Sayfa {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
