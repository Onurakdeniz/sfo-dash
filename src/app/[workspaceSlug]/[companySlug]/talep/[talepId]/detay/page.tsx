'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import CompanyPageLayout from '@/components/layouts/company-page-layout';
import TalepTabs from '../talep-tabs';
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Tag,
  Upload,
  FolderOpen,
  Download,
  Package,
  Zap,
  Building2,
  UserCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
}

interface Talep {
  id: string;
  code?: string;
  title: string;
  description: string;
  type: string;
  category: string | null;
  status: string;
  priority: string;
  customerId: string;
  customerContactId: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  deadline: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  billingStatus: string | null;
  resolution: string | null;
  resolutionDate: string | null;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    customerType: string;
  } | null;
  customerContact: CustomerContact | null;
  assignedToUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  createdByUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface TalepProduct {
  id: string;
  productName: string;
  productCode?: string;
  manufacturer?: string;
  model?: string;
  requestedQuantity: number;
  unitOfMeasure: string;
  targetPrice?: number;
  currency: string;
  status: string;
  exportControlled: boolean;
  itar: boolean;
  certificationRequired?: string[];
}

interface TalepAction {
  id: string;
  actionType: string;
  title: string;
  description: string;
  actionDate: string;
  performedByUser?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export default function TalepDetayPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [talep, setTalep] = useState<Talep | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    resolution: '',
    actualHours: '',
    actualCost: '',
    billingStatus: '',
    customerContactId: '',
  });
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [products, setProducts] = useState<TalepProduct[]>([]);
  const [recentActions, setRecentActions] = useState<TalepAction[]>([]);
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const fetchTalep = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch talep');
      }

      const data = await response.json();
      setTalep(data.talep);

      // Set initial edit data
      setEditData({
        status: data.talep.status,
        priority: data.talep.priority,
        assignedTo: data.talep.assignedTo || '',
        resolution: data.talep.resolution || '',
        actualHours: data.talep.actualHours?.toString() || '',
        actualCost: data.talep.actualCost?.toString() || '',
        billingStatus: data.talep.billingStatus || '',
        customerContactId: data.talep.customerContactId || '',
      });

    } catch (error) {
      console.error('Error fetching talep:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch talep details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/files`, { 
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const rows = await res.json();
        setFiles(rows || []);
      }
    } catch (e) {
      console.error('Error fetching talep files:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  const fetchRecentActions = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/actions`);
      if (res.ok) {
        const data = await res.json();
        setRecentActions(data.actions?.slice(0, 5) || []);
      }
    } catch (e) {
      console.error('Error fetching actions:', e);
    }
  };

  const fetchCustomerContacts = async (customerId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/contacts`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCustomerContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching customer contacts:', error);
      setCustomerContacts([]);
    }
  };

  const fetchUsers = async () => {
    try {
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
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchTalep();
    fetchFiles();
    fetchProducts();
    fetchRecentActions();
    fetchUsers();
  }, [workspaceSlug, companySlug, talepId]);

  // Fetch customer contacts when talep is loaded
  useEffect(() => {
    if (talep?.customerId) {
      fetchCustomerContacts(talep.customerId);
    }
  }, [talep?.customerId]);

  const handleUpdate = async () => {
    if (!talep) return;

    setUpdating(true);
    try {
      const updatePayload = {
        status: editData.status,
        priority: editData.priority,
        assignedTo: editData.assignedTo || null,
        resolution: editData.resolution || null,
        actualHours: editData.actualHours ? parseFloat(editData.actualHours) : null,
        actualCost: editData.actualCost ? parseFloat(editData.actualCost) : null,
        billingStatus: editData.billingStatus || null,
        customerContactId: editData.customerContactId || null,
      };

      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update talep');
      }

      const result = await response.json();
      setTalep(result.talep);
      setEditMode(false);

      toast({
        title: 'Success',
        description: 'Talep başarıyla güncellendi',
      });

      // Refresh
      fetchTalep();

    } catch (error) {
      console.error('Error updating talep:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update talep',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    try {
      setUploading(true);
      for (const file of Array.from(selectedFiles)) {
        const form = new FormData();
        form.append('file', file);
        form.append('filename', file.name);
        const up = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/files/upload-url`, {
          method: 'POST',
          body: form,
          credentials: 'include',
        });
        if (!up.ok) {
          const error = await up.text();
          throw new Error(`Yükleme linki alınamadı: ${error}`);
        }
        const { url, key } = await up.json();
        const meta = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, blobUrl: url, blobPath: key, contentType: file.type, size: file.size }),
          credentials: 'include',
        });
        if (!meta.ok) {
          const error = await meta.text();
          throw new Error(`Kayıt oluşturulamadı: ${error}`);
        }
      }
      await fetchFiles();
      setSelectedFiles(null);
      const input = document.getElementById('talep-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      toast({ title: 'Başarılı', description: 'Dosyalar yüklendi' });
    } catch (e) {
      console.error('Upload error:', e);
      toast({ title: 'Hata', description: e instanceof Error ? e.message : 'Yükleme hatası', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
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
    const types: Record<string, string> = {
      'quotation_request': 'Teklif Talebi',
      'price_request': 'Fiyat Talebi',
      'product_inquiry': 'Ürün Sorgusu',
      'order_request': 'Sipariş Talebi',
      'sample_request': 'Numune Talebi',
      'delivery_status': 'Teslimat Durumu',
      'return_request': 'İade Talebi',
      'technical_support': 'Teknik Destek',
      'billing': 'Fatura',
      'general_inquiry': 'Genel Soru',
      'complaint': 'Şikayet',
      'feature_request': 'Özellik Talebi',
      'bug_report': 'Hata Bildirimi',
      'installation': 'Kurulum',
      'training': 'Eğitim',
      'maintenance': 'Bakım',
      'rfq': 'RFQ (Fiyat Talebi)',
      'rfi': 'RFI (Bilgi Talebi)',
      'rfp': 'RFP (Teklif Talebi)',
      'certification_req': 'Sertifika Talebi',
      'compliance_inquiry': 'Uygunluk Sorgulama',
      'export_license': 'İhracat Lisansı',
      'end_user_cert': 'Son Kullanıcı Sertifikası',
      'other': 'Diğer'
    };
    return types[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'hardware': 'Donanım',
      'software': 'Yazılım',
      'network': 'Ağ',
      'database': 'Veritabanı',
      'security': 'Güvenlik',
      'performance': 'Performans',
      'integration': 'Entegrasyon',
      'reporting': 'Raporlama',
      'user_access': 'Kullanıcı Erişimi',
      'weapon_systems': 'Silah Sistemleri',
      'ammunition': 'Mühimmat',
      'avionics': 'Aviyonik',
      'radar_systems': 'Radar Sistemleri',
      'communication': 'Haberleşme',
      'electronic_warfare': 'Elektronik Harp',
      'naval_systems': 'Deniz Sistemleri',
      'land_systems': 'Kara Sistemleri',
      'air_systems': 'Hava Sistemleri',
      'cyber_security': 'Siber Güvenlik',
      'simulation': 'Simülasyon',
      'c4isr': 'C4ISR',
      'other': 'Diğer'
    };
    return categories[category] || category;
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

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'successful':
        return <Badge variant="default">Başarılı</Badge>;
      case 'pending':
        return <Badge variant="secondary">Beklemede</Badge>;
      case 'failed':
        return <Badge variant="destructive">Başarısız</Badge>;
      case 'follow_up_required':
        return <Badge variant="outline">Takip Gerekli</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <CompanyPageLayout
        title="Talep Detayı"
        description="Talep detayları yükleniyor..."
        className="pt-0 px-4 md:px-6"
        tabs={<TalepTabs />}
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CompanyPageLayout>
    );
  }

  if (!talep) {
    return (
      <CompanyPageLayout
        title="Talep Bulunamadı"
        description="Talep detayları bulunamadı"
        className="pt-0 px-4 md:px-6"
        tabs={<TalepTabs />}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground">Talep bulunamadı.</p>
        </div>
      </CompanyPageLayout>
    );
  }

  return (
    <CompanyPageLayout
      title={`${talep.title}${talep.code ? ` • ${talep.code}` : ''}`}
      description="Talep detayları ve bilgileri"
      className="pt-0 px-4 md:px-6"
      tabs={<TalepTabs />}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          {!editMode && (
            <Button
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Talep Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {talep.title}
                  </CardTitle>
                  <CardDescription>
                    {getTypeLabel(talep.type)}
                    {talep.category && ` • ${getCategoryLabel(talep.category)}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(talep.status)}>
                    {getStatusLabel(talep.status)}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(talep.priority)}>
                    {getPriorityLabel(talep.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Açıklama</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {talep.description}
                </p>
              </div>

              {talep.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Etiketler
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {talep.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {talep.resolution && (
                <div>
                  <h4 className="font-medium mb-2">Çözüm</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {talep.resolution}
                  </p>
                  {talep.resolutionDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Çözüldüğü tarih: {new Date(talep.resolutionDate).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Talep Edilen Ürünler
                  </CardTitle>
                  <CardDescription>Bu talep için istenen ürünler</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep/${talepId}/urunler`)}
                >
                  Ürünleri Yönet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz ürün eklenmemiş.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{product.productName}</h5>
                          {product.productCode && (
                            <p className="text-sm text-muted-foreground">Kod: {product.productCode}</p>
                          )}
                          {product.manufacturer && (
                            <p className="text-sm text-muted-foreground">Üretici: {product.manufacturer}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.requestedQuantity} {product.unitOfMeasure}</p>
                          {product.targetPrice && (
                            <p className="text-sm text-muted-foreground">
                              Hedef: {product.currency} {product.targetPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      {(product.exportControlled || product.itar) && (
                        <div className="flex gap-2">
                          {product.exportControlled && (
                            <Badge variant="outline" className="text-xs">İhracat Kontrolü</Badge>
                          )}
                          {product.itar && (
                            <Badge variant="outline" className="text-xs">ITAR</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Son Aksiyonlar
                  </CardTitle>
                  <CardDescription>Bu talep için yapılan son işlemler</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep/${talepId}/aksiyonlar`)}
                >
                  Tüm Aksiyonlar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz aksiyon kaydı yok.</p>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div key={action.id} className="border-l-2 border-muted pl-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-sm">{action.title}</h5>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        {getOutcomeBadge(action.outcome)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{action.performedByUser?.name || action.performedByUser?.email || 'Sistem'}</span>
                        <span>{new Date(action.actionDate).toLocaleDateString('tr-TR')}</span>
                        {action.followUpRequired && (
                          <Badge variant="outline" className="text-xs">Takip Gerekli</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Ekler
              </CardTitle>
              <CardDescription>Talep ile ilgili belgeleri yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input id="talep-file-input" type="file" multiple onChange={handleFileChange} />
                <Button variant="default" onClick={handleUpload} disabled={uploading || !selectedFiles || selectedFiles.length === 0}>
                  <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Yükleniyor...' : 'Yükle'}
                </Button>
              </div>
              <div className="space-y-2">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz dosya yok.</p>
                ) : (
                  files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="text-sm font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString('tr-TR')}</div>
                      </div>
                      <a href={f.blobUrl} target="_blank" rel="noreferrer" className="text-primary flex items-center text-sm">
                        <Download className="h-4 w-4 mr-1" /> İndir
                      </a>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Mode */}
          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle>Talebi Güncelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Yeni</SelectItem>
                        <SelectItem value="in_progress">İşlemde</SelectItem>
                        <SelectItem value="waiting">Beklemede</SelectItem>
                        <SelectItem value="resolved">Çözüldü</SelectItem>
                        <SelectItem value="closed">Kapandı</SelectItem>
                        <SelectItem value="cancelled">İptal Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Öncelik</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Atanan Kişi</Label>
                    <Select
                      value={editData.assignedTo}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, assignedTo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kullanıcı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Atanmamış</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>İletişim Kişisi</Label>
                    <Select
                      value={editData.customerContactId}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, customerContactId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="İletişim kişisi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                            {contact.title && ` (${contact.title})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fatura Durumu</Label>
                    <Input
                      value={editData.billingStatus}
                      onChange={(e) => setEditData(prev => ({ ...prev, billingStatus: e.target.value }))}
                      placeholder="Fatura durumu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gerçekleşen Saat</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editData.actualHours}
                      onChange={(e) => setEditData(prev => ({ ...prev, actualHours: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gerçekleşen Maliyet</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.actualCost}
                      onChange={(e) => setEditData(prev => ({ ...prev, actualCost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Çözüm</Label>
                  <Textarea
                    value={editData.resolution}
                    onChange={(e) => setEditData(prev => ({ ...prev, resolution: e.target.value }))}
                    placeholder="Çözüm açıklaması..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      if (!talep) return;
                      setEditData({
                        status: talep.status,
                        priority: talep.priority,
                        assignedTo: talep.assignedTo || '',
                        resolution: talep.resolution || '',
                        actualHours: talep.actualHours?.toString() || '',
                        actualCost: talep.actualCost?.toString() || '',
                        billingStatus: talep.billingStatus || '',
                        customerContactId: talep.customerContactId || '',
                      });
                    }}
                    disabled={updating}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Güncelleniyor...
                      </>
                    ) : (
                      'Güncelle'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{talep.customer?.name}</p>
                  {talep.customer?.fullName && (
                    <p className="text-sm text-muted-foreground">{talep.customer.fullName}</p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {talep.customer?.customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}
                  </Badge>
                </div>

                {talep.customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{talep.customer.phone}</p>
                  </div>
                )}

                {talep.customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{talep.customer.email}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Contact Person Section */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  İletişim Kişisi
                </h4>
                {talep.customerContact ? (
                  <>
                    <div>
                      <p className="font-medium text-sm">
                        {[talep.customerContact.firstName, talep.customerContact.lastName].filter(Boolean).join(' ')}
                      </p>
                      {talep.customerContact.title && (
                        <p className="text-xs text-muted-foreground">{talep.customerContact.title}</p>
                      )}
                    </div>

                    {talep.customerContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{talep.customerContact.phone}</p>
                      </div>
                    )}

                    {talep.customerContact.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{talep.customerContact.mobile} (Mobil)</p>
                      </div>
                    )}

                    {talep.customerContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{talep.customerContact.email}</p>
                      </div>
                    )}
                  </>
                ) : talep.contactName ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">{talep.contactName}</p>
                    </div>

                    {talep.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{talep.contactPhone}</p>
                      </div>
                    )}

                    {talep.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{talep.contactEmail}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">İletişim kişisi atanmamış</p>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Atama Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Atanan Kişi</p>
                <p className="text-sm text-muted-foreground">
                  {talep.assignedToUser?.name || talep.assignedToUser?.email || 'Atanmamış'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Oluşturan</p>
                <p className="text-sm text-muted-foreground">
                  {talep.createdByUser?.name || talep.createdByUser?.email || 'Bilinmiyor'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Time and Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Zaman ve Finans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Oluşturulma</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(talep.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {talep.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Son Tarih</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(talep.deadline).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tahmini Saat</span>
                  <span className="text-sm font-medium">{talep.estimatedHours || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gerçekleşen Saat</span>
                  <span className="text-sm font-medium">{talep.actualHours || '-'}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm">Tahmini Maliyet</span>
                    <span className="text-sm font-medium">₺{talep.estimatedCost || '0'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm">Gerçekleşen Maliyet</span>
                    <span className="text-sm font-medium">₺{talep.actualCost || '0'}</span>
                  </div>
                </div>
              </div>

              {talep.billingStatus && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Fatura Durumu</p>
                    <p className="text-sm text-muted-foreground">{talep.billingStatus}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </CompanyPageLayout>
  );
}





