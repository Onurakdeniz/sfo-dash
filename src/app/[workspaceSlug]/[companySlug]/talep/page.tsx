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
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, User, Calendar, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';

interface Talep {
  code?: string;
  id: string;
  title: string;
  description: string;
  type: 'technical_support' | 'billing' | 'general_inquiry' | 'complaint' | 'feature_request' | 'bug_report' | 'installation' | 'training' | 'maintenance' | 'other';
  category: 'hardware' | 'software' | 'network' | 'database' | 'security' | 'performance' | 'integration' | 'reporting' | 'user_access' | 'other' | null;
  status: 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  assignedTo: string | null;
  deadline: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignedToUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function TalepPage() {
  const { workspaceSlug, companySlug } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');

  const fetchTalepler = async (page = 1) => {
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
      if (assignedToFilter) params.append('assignedTo', assignedToFilter);

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch talepler');
      }

      const data = await response.json();
      setTalepler(data.talepler);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching talepler:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch talepler. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalepler();
  }, [workspaceSlug, companySlug]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTalepler(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter, assignedToFilter]);

  const handlePageChange = (newPage: number) => {
    fetchTalepler(newPage);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'waiting':
        return 'outline';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
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
      case 'new':
        return 'Yeni';
      case 'in_progress':
        return 'İşlemde';
      case 'waiting':
        return 'Beklemede';
      case 'resolved':
        return 'Çözüldü';
      case 'closed':
        return 'Kapandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quotation_request':
        return 'Teklif Talebi';
      case 'price_request':
        return 'Fiyat Talebi';
      case 'product_inquiry':
        return 'Ürün Sorgusu';
      case 'order_request':
        return 'Sipariş Talebi';
      case 'sample_request':
        return 'Numune Talebi';
      case 'delivery_status':
        return 'Teslimat Durumu';
      case 'return_request':
        return 'İade Talebi';
      case 'technical_support':
        return 'Teknik Destek';
      case 'billing':
        return 'Fatura';
      case 'general_inquiry':
        return 'Genel Soru';
      case 'complaint':
        return 'Şikayet';
      case 'feature_request':
        return 'Özellik Talebi';
      case 'bug_report':
        return 'Hata Bildirimi';
      case 'installation':
        return 'Kurulum';
      case 'training':
        return 'Eğitim';
      case 'maintenance':
        return 'Bakım';
      case 'other':
        return 'Diğer';
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Düşük';
      case 'medium':
        return 'Orta';
      case 'high':
        return 'Yüksek';
      case 'urgent':
        return 'Acil';
      default:
        return priority;
    }
  };

  return (
    <PageWrapper
      title="Talepler"
      description="Müşteri taleplerini yönetin ve takip edin"
      className="p-0"
      actions={
        <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Talep
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
                  placeholder="Talep ara (başlık, açıklama, müşteri adı)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" key="all">Tümü</SelectItem>
                <SelectItem value="new" key="new">Yeni</SelectItem>
                <SelectItem value="in_progress" key="in_progress">İşlemde</SelectItem>
                <SelectItem value="waiting" key="waiting">Beklemede</SelectItem>
                <SelectItem value="resolved" key="resolved">Çözüldü</SelectItem>
                <SelectItem value="closed" key="closed">Kapandı</SelectItem>
                <SelectItem value="cancelled" key="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" key="all">Tümü</SelectItem>
                <SelectItem value="technical_support" key="technical_support">Teknik Destek</SelectItem>
                <SelectItem value="billing" key="billing">Fatura</SelectItem>
                <SelectItem value="general_inquiry" key="general_inquiry">Genel Soru</SelectItem>
                <SelectItem value="complaint" key="complaint">Şikayet</SelectItem>
                <SelectItem value="feature_request" key="feature_request">Özellik Talebi</SelectItem>
                <SelectItem value="bug_report" key="bug_report">Hata Bildirimi</SelectItem>
                <SelectItem value="installation" key="installation">Kurulum</SelectItem>
                <SelectItem value="training" key="training">Eğitim</SelectItem>
                <SelectItem value="maintenance" key="maintenance">Bakım</SelectItem>
                <SelectItem value="other" key="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" key="all">Tümü</SelectItem>
                <SelectItem value="urgent" key="urgent">Acil</SelectItem>
                <SelectItem value="high" key="high">Yüksek</SelectItem>
                <SelectItem value="medium" key="medium">Orta</SelectItem>
                <SelectItem value="low" key="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Talep Listesi ({pagination.totalCount})</CardTitle>
          <CardDescription>
            Toplam {pagination.totalCount} talep bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : talepler.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz talep bulunmuyor.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep/new`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                İlk Talebi Ekle
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talep</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Atanan</TableHead>
                    <TableHead>Son Tarih</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talepler.map((talep) => (
                    <TableRow
                      key={talep.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep/${talep.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{talep.title} {talep.code ? <span className="text-xs text-muted-foreground">({talep.code})</span> : null}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {talep.description}
                          </div>
                          {talep.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {talep.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {talep.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{talep.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{talep.customer?.name}</div>
                          {talep.customer?.phone && (
                            <div className="text-xs text-muted-foreground">
                              {talep.customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(talep.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(talep.status)}>
                          {getStatusLabel(talep.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(talep.priority)}>
                          {getPriorityLabel(talep.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {talep.assignedToUser?.name || 'Atanmamış'}
                      </TableCell>
                      <TableCell>
                        {talep.deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(talep.deadline).toLocaleDateString('tr-TR')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(talep.createdAt).toLocaleDateString('tr-TR')}
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
                                router.push(`/${workspaceSlug}/${companySlug}/talep/${talep.id}`);
                              }}
                            >
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${workspaceSlug}/${companySlug}/talep/${talep.id}/edit`);
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
