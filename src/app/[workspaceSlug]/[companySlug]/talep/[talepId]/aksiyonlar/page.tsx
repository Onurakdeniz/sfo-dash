'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import CompanyPageLayout from '@/components/layouts/company-page-layout';
import TalepTabs from '../talep-tabs';
import { Activity, ArrowLeft, Plus, Clock, Phone, Mail, Calendar, CheckCircle, AlertCircle, User } from 'lucide-react';

interface Action {
  id: string;
  actionType: string;
  actionCategory?: string;
  title: string;
  description: string;
  communicationType?: string;
  contactPerson?: string;
  contactCompany?: string;
  contactEmail?: string;
  contactPhone?: string;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  duration?: number;
  actionDate: string;
  performedByUser?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  createdAt: string;
}

export default function TalepActionsPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [talepTitle, setTalepTitle] = useState<string | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [actionForm, setActionForm] = useState({
    actionType: '',
    actionCategory: '',
    title: '',
    description: '',
    communicationType: '',
    contactPerson: '',
    contactCompany: '',
    contactEmail: '',
    contactPhone: '',
    outcome: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    duration: '',
    actionDate: new Date().toISOString().slice(0, 16),
  });

  const fetchActions = async () => {
    setLoading(true);
    try {
      // Fetch talep details
      const talepResponse = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (talepResponse.ok) {
        const talepData = await talepResponse.json();
        setTalepTitle(talepData.talep?.title || 'Talep Aksiyonları');
      }

      // Fetch actions
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/actions`,
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({ title: 'Error', description: 'Aksiyonlar yüklenemedi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [workspaceSlug, companySlug, talepId]);

  const handleSubmit = async () => {
    if (!actionForm.actionType || !actionForm.title || !actionForm.description) {
      toast({
        title: 'Hata',
        description: 'Lütfen zorunlu alanları doldurun',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}/actions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...actionForm,
            duration: actionForm.duration ? parseInt(actionForm.duration) : null,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create action');

      toast({
        title: 'Başarılı',
        description: 'Aksiyon başarıyla kaydedildi',
      });

      setShowActionDialog(false);
      setActionForm({
        actionType: '',
        actionCategory: '',
        title: '',
        description: '',
        communicationType: '',
        contactPerson: '',
        contactCompany: '',
        contactEmail: '',
        contactPhone: '',
        outcome: '',
        followUpRequired: false,
        followUpDate: '',
        followUpNotes: '',
        duration: '',
        actionDate: new Date().toISOString().slice(0, 16),
      });
      fetchActions();
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: 'Hata',
        description: 'Aksiyon kaydedilemedi',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getActionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      email_sent: 'E-posta Gönderildi',
      call_made: 'Telefon Görüşmesi',
      meeting_held: 'Toplantı Yapıldı',
      quote_requested: 'Fiyat Teklifi İstendi',
      quote_sent: 'Fiyat Teklifi Gönderildi',
      document_sent: 'Doküman Gönderildi',
      document_received: 'Doküman Alındı',
      site_visit: 'Saha Ziyareti',
      technical_support: 'Teknik Destek',
      follow_up: 'Takip',
      other: 'Diğer',
    };
    return types[type] || type;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'communication':
        return <Phone className="h-4 w-4" />;
      case 'documentation':
        return <Mail className="h-4 w-4" />;
      case 'procurement':
        return <Activity className="h-4 w-4" />;
      case 'technical':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'successful':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Başarılı</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Beklemede</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Başarısız</Badge>;
      case 'follow_up_required':
        return <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" /> Takip Gerekli</Badge>;
      default:
        return null;
    }
  };

  return (
    <CompanyPageLayout
      title={talepTitle || 'Talep Aksiyonları'}
      description="Talep için yapılan aksiyonları görüntüleyin ve yeni aksiyon ekleyin"
      className="pt-0 px-4 md:px-6"
      tabs={<TalepTabs />}
      actions={
        <div className="flex gap-2">
          <Button onClick={() => setShowActionDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Aksiyon
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aksiyonlar
          </CardTitle>
          <CardDescription>
            Talep için yapılan tüm aksiyonlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Henüz aksiyon kaydı yok.</p>
              <Button onClick={() => setShowActionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Aksiyonu Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(action.actionCategory)}
                        <h4 className="font-medium">{action.title}</h4>
                        <Badge variant="outline">{getActionTypeLabel(action.actionType)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    {getOutcomeBadge(action.outcome)}
                  </div>

                  {(action.contactPerson || action.contactCompany) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {action.contactPerson && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {action.contactPerson}
                        </div>
                      )}
                      {action.contactCompany && (
                        <div>{action.contactCompany}</div>
                      )}
                      {action.contactPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {action.contactPhone}
                        </div>
                      )}
                      {action.contactEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {action.contactEmail}
                        </div>
                      )}
                    </div>
                  )}

                  {action.followUpRequired && action.followUpDate && (
                    <div className="bg-muted/50 rounded p-2 text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-3 w-3" />
                        Takip Tarihi: {new Date(action.followUpDate).toLocaleDateString('tr-TR')}
                      </div>
                      {action.followUpNotes && (
                        <p className="text-muted-foreground mt-1">{action.followUpNotes}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div>
                      {action.performedByUser?.name || action.performedByUser?.email || 'Sistem'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(action.actionDate).toLocaleString('tr-TR')}
                    </div>
                    {action.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {action.duration} dk
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Aksiyon Ekle</DialogTitle>
            <DialogDescription>
              Talep için yapılan aksiyonu kaydedin
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionType">Aksiyon Tipi *</Label>
                <Select
                  value={actionForm.actionType}
                  onValueChange={(value) => setActionForm(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aksiyon tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_sent">E-posta Gönderildi</SelectItem>
                    <SelectItem value="call_made">Telefon Görüşmesi</SelectItem>
                    <SelectItem value="meeting_held">Toplantı Yapıldı</SelectItem>
                    <SelectItem value="quote_requested">Fiyat Teklifi İstendi</SelectItem>
                    <SelectItem value="quote_sent">Fiyat Teklifi Gönderildi</SelectItem>
                    <SelectItem value="document_sent">Doküman Gönderildi</SelectItem>
                    <SelectItem value="document_received">Doküman Alındı</SelectItem>
                    <SelectItem value="site_visit">Saha Ziyareti</SelectItem>
                    <SelectItem value="technical_support">Teknik Destek</SelectItem>
                    <SelectItem value="follow_up">Takip</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionCategory">Kategori</Label>
                <Select
                  value={actionForm.actionCategory}
                  onValueChange={(value) => setActionForm(prev => ({ ...prev, actionCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communication">İletişim</SelectItem>
                    <SelectItem value="documentation">Dokümantasyon</SelectItem>
                    <SelectItem value="procurement">Satın Alma</SelectItem>
                    <SelectItem value="technical">Teknik</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={actionForm.title}
                onChange={(e) => setActionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Aksiyon başlığı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={actionForm.description}
                onChange={(e) => setActionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Aksiyonun detaylı açıklaması"
                rows={3}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">İletişim Kişisi</Label>
                <Input
                  id="contactPerson"
                  value={actionForm.contactPerson}
                  onChange={(e) => setActionForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="İletişim kurduğunuz kişi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactCompany">Firma</Label>
                <Input
                  id="contactCompany"
                  value={actionForm.contactCompany}
                  onChange={(e) => setActionForm(prev => ({ ...prev, contactCompany: e.target.value }))}
                  placeholder="İletişim kurduğunuz firma"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  value={actionForm.contactPhone}
                  onChange={(e) => setActionForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="İletişim telefonu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">E-posta</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={actionForm.contactEmail}
                  onChange={(e) => setActionForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="İletişim e-postası"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outcome">Sonuç</Label>
                <Select
                  value={actionForm.outcome}
                  onValueChange={(value) => setActionForm(prev => ({ ...prev, outcome: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aksiyon sonucu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">Başarılı</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                    <SelectItem value="follow_up_required">Takip Gerekli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Süre (dakika)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={actionForm.duration}
                  onChange={(e) => setActionForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Harcanan süre"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionDate">Aksiyon Tarihi</Label>
                <Input
                  id="actionDate"
                  type="datetime-local"
                  value={actionForm.actionDate}
                  onChange={(e) => setActionForm(prev => ({ ...prev, actionDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpRequired">Takip Gerekli mi?</Label>
                <Select
                  value={actionForm.followUpRequired ? 'true' : 'false'}
                  onValueChange={(value) => setActionForm(prev => ({ ...prev, followUpRequired: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Hayır</SelectItem>
                    <SelectItem value="true">Evet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {actionForm.followUpRequired && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Takip Tarihi</Label>
                  <Input
                    id="followUpDate"
                    type="datetime-local"
                    value={actionForm.followUpDate}
                    onChange={(e) => setActionForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpNotes">Takip Notları</Label>
                  <Textarea
                    id="followUpNotes"
                    value={actionForm.followUpNotes}
                    onChange={(e) => setActionForm(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    placeholder="Takip için notlar"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={submitting}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CompanyPageLayout>
  );
}