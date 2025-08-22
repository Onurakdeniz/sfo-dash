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
  Download
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
  });
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

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
      const res = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/files`, { cache: 'no-store' });
      if (res.ok) {
        const rows = await res.json();
        setFiles(rows || []);
      }
    } catch (e) {
      console.error('Error fetching talep files:', e);
    }
  };

  useEffect(() => {
    fetchTalep();
    fetchFiles();
  }, [workspaceSlug, companySlug, talepId]);

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
        });
        if (!up.ok) throw new Error('Yükleme linki alınamadı');
        const { url, key } = await up.json();
        const meta = await fetch(`/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, blobUrl: url, blobPath: key, contentType: file.type, size: file.size })
        });
        if (!meta.ok) throw new Error('Kayıt oluşturulamadı');
      }
      await fetchFiles();
      setSelectedFiles(null);
      const input = document.getElementById('talep-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      toast({ title: 'Başarılı', description: 'Dosyalar yüklendi' });
    } catch (e) {
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
                    {talep.category && ` • ${talep.category}`}
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
                    <Input
                      value={editData.assignedTo}
                      onChange={(e) => setEditData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="Kullanıcı ID"
                    />
                  </div>

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
                <User className="h-5 w-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{talep.customer?.name}</p>
                {talep.customer?.fullName && (
                  <p className="text-sm text-muted-foreground">{talep.customer.fullName}</p>
                )}
                <Badge variant="outline" className="mt-1">
                  {talep.customer?.customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}
                </Badge>
              </div>

              <Separator />

              {talep.contactName && (
                <div>
                  <p className="text-sm font-medium">İletişim Kişisi</p>
                  <p className="text-sm text-muted-foreground">{talep.contactName}</p>
                </div>
              )}

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





