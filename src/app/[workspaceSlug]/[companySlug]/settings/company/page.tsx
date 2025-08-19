"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Building2, 
  Loader2, 
  Plus, 
  Trash2, 
  Settings,
  Globe,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SettingsTabs from "../settings-tabs";
import Link from "next/link";

interface CompanySettings {
  id: string;
  companyId: string;
  fiscalYearStart: string;
  taxRate: string;
  invoicePrefix: string;
  invoiceNumbering: string;
  publicHolidays?: { date: string; name?: string }[];
  customSettings: Record<string, any>;
}

type TimeRange = { start: string; end: string };
type DaySchedule = { isWorkingDay: boolean; workIntervals: TimeRange[]; breaks: TimeRange[] };
type WorkCalendar = {
  id: string;
  name: string;
  description?: string;
  days: Record<string, DaySchedule>;
  createdAt: string;
  updatedAt: string;
};

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string };
  currentCompany: { id: string; name: string; slug: string };
  companies: { id: string; name: string; slug: string }[];
}

// Takvimler gün bazında çalışma ve mola aralıklarını içerir

const INVOICE_NUMBERING_TYPES = [
  { value: "sequential", label: "Sıralı (1, 2, 3...)" },
  { value: "yearly", label: "Yıllık (2024-001, 2024-002...)" },
  { value: "monthly", label: "Aylık (2024-01-001, 2024-01-002...)" }
];

export default function CompanySettingsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Form states
  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  const [policies, setPolicies] = useState<any[]>([]);

  // Get workspace and company context
  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
    queryKey: ['workspace-context', workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch context');
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });

  const workspace = contextData?.workspace;
  const company = contextData?.currentCompany;

  // Fetch company settings for selected company
  const { data: companySettings, isLoading: companySettingsLoading, error: companySettingsError } = useQuery<CompanySettings>({
    queryKey: ['company-settings', company?.id, workspace?.id],
    queryFn: async () => {
      if (!company?.id || !workspace?.id) throw new Error('Company or workspace not found');
      const res = await fetch(`/api/settings/company?companyId=${company.id}&workspaceId=${workspace.id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch company settings: ${res.status} ${errorText}`);
      }
      return res.json();
    },
    enabled: !!(company?.id && workspace?.id),
  });

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('CompanySettingsPage render:', {
      companyForm,
      contextData,
      workspace,
      companySettingsLoading: companySettingsLoading,
      companySettings,
    });
  }

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (companySettings) {
      console.log('Setting company form data:', companySettings);
      setCompanyForm({
        ...companySettings,
        fiscalYearStart: companySettings.fiscalYearStart || '',
        taxRate: companySettings.taxRate || '',
        invoicePrefix: companySettings.invoicePrefix || '',
        invoiceNumbering: companySettings.invoiceNumbering || '',
        publicHolidays: Array.isArray(companySettings.publicHolidays) ? companySettings.publicHolidays : [],
        customSettings: {
          ...(companySettings.customSettings || {}),
          workCalendars: Array.isArray(companySettings.customSettings?.workCalendars)
            ? companySettings.customSettings.workCalendars
            : []
        }
      });
    }
  }, [companySettings]);

  // Load policies for embedded section
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const response = await fetch('/api/system/policies');
        if (!response.ok) throw new Error('Failed to fetch policies');
        const data = await response.json();
        setPolicies(data || []);
      } catch (e) {
        setPolicies([]);
      }
    };
    loadPolicies();
  }, []);

  // Company settings mutation
  const updateCompanySettings = useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      if (!company?.id || !workspace?.id) throw new Error('Company or workspace not found');
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, companyId: company.id, workspaceId: workspace.id })
      });
      if (!res.ok) throw new Error('Failed to update company settings');
      return res.json();
    },
    onSuccess: () => {
      toast.success("Başarılı!", {
        description: "Şirket ayarları kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
    onError: (error) => {
      toast.error("Hata!", {
        description: "Şirket ayarları kaydedilemedi.",
      });
    },
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings.mutate(companyForm);
  };

  const addHoliday = () => {
    const newHoliday = { date: '', name: '' };
    const currentHolidays = companyForm.publicHolidays || [];
    setCompanyForm(prev => ({ ...prev, publicHolidays: [...currentHolidays, newHoliday] }));
  };

  const updateHoliday = (index: number, field: 'date' | 'name', value: string) => {
    const currentHolidays = [...(companyForm.publicHolidays || [])];
    currentHolidays[index] = { ...currentHolidays[index], [field]: value };
    setCompanyForm(prev => ({ ...prev, publicHolidays: currentHolidays }));
  };

  const removeHoliday = (index: number) => {
    const currentHolidays = companyForm.publicHolidays || [];
    const newHolidays = currentHolidays.filter((_, i) => i !== index);
    setCompanyForm(prev => ({ ...prev, publicHolidays: newHolidays }));
  };

  // Show loading state if workspace is still loading
  if (contextLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace || !company) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Bu çalışma alanına veya şirkete erişim izniniz yok ya da bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  const actions = (
    <>
        <Button 
          type="submit" 
          form="company-settings-form"
        disabled={updateCompanySettings.isPending || companySettingsLoading || !companySettings}
        >
          {updateCompanySettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            'Kaydet'
          )}
        </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings`}>
        <Button variant="outline">
          <Globe className="mr-2 h-4 w-4" />
          Workspace
        </Button>
      </Link>
    </>
  );

  return (
    <TooltipProvider>
      <PageWrapper
        title="Şirket Ayarları"
        description={`${workspace.name} çalışma alanındaki şirketler için ayarlar`}
        actions={actions}
        secondaryNav={<SettingsTabs />}
      >
        <div className="space-y-6">
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertTitle>Şirket Ayarları</AlertTitle>
            <AlertDescription>
              Bu ayarlar sadece seçili şirket için geçerlidir ve workspace ayarlarını geçersiz kılar.
              Değişiklikler sadece bu şirketi etkiler.
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {companySettingsError && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 dark:text-red-200">Hata!</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                Şirket ayarları yüklenemedi: {companySettingsError.message}
              </AlertDescription>
            </Alert>
          )}

          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Şirket Ayarları
                </CardTitle>
                <CardDescription>
                  Bu şirkete özel ayarları yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="company-settings-form" onSubmit={handleCompanySubmit} className="space-y-6">
                  {companySettingsLoading || !companySettings ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Business Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">İş Ayarları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="fiscalYearStart">Mali Yıl Başlangıcı</Label>
                            <Input
                              id="fiscalYearStart"
                              placeholder="01/01"
                              value={companyForm.fiscalYearStart || ''}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxRate">Vergi Oranı (%)</Label>
                            <Input
                              id="taxRate"
                              placeholder="18"
                              value={companyForm.taxRate || ''}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, taxRate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invoicePrefix">Fatura Öneki</Label>
                            <Input
                              id="invoicePrefix"
                              placeholder="INV"
                              value={companyForm.invoicePrefix || ''}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invoiceNumbering">Fatura Numaralandırma</Label>
                            <Select 
                              key={`invoiceNumbering-${companyForm.invoiceNumbering}`}
                              value={companyForm.invoiceNumbering || ''} 
                              onValueChange={(value) => setCompanyForm(prev => ({ ...prev, invoiceNumbering: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Numaralandırma türü seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {INVOICE_NUMBERING_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Çalışma Takvimi - Şirket */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Çalışma Takvimi (Şirket)
                          </CardTitle>
                          <CardDescription>Gün bazında mesai ve mola saatlerini içeren şirket takvimleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-muted-foreground">
                              {Array.isArray(companyForm.customSettings?.workCalendars) && (companyForm.customSettings as any).workCalendars.length > 0
                                ? `${(companyForm.customSettings as any).workCalendars.length} takvim`
                                : 'Henüz takvim oluşturulmadı'}
                          </div>
                            <Link href={`/${workspaceSlug}/${companySlug}/settings/company/calendars/new`}>
                              <Button type="button">
                                <Plus className="h-4 w-4 mr-2" /> Yeni Takvim
                              </Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {((companyForm.customSettings?.workCalendars as WorkCalendar[]) || []).map((cal) => {
                              const activeDays = Object.entries(cal.days)
                                .filter(([_, d]) => (d as DaySchedule).isWorkingDay)
                                .map(([k]) => k)
                                .join(', ');
                              return (
                                <div key={cal.id} className="p-4 border rounded-lg">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-medium">{cal.name || 'İsimsiz Takvim'}</div>
                                      {cal.description && (
                                        <div className="text-sm text-muted-foreground mt-1">{cal.description}</div>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{activeDays || 'Çalışma günü tanımlı değil'}</span>
                        </div>
                      </div>
                                    <Link href={`/${workspaceSlug}/${companySlug}/settings/company/calendars/${cal.id}`} className="inline-flex items-center text-sm">
                                      Detaylar <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                        </div>
                                </div>
                              );
                            })}
                                </div>
                        </CardContent>
                      </Card>

                      {/* Şirket Özel Tatilleri ayrı kart olarak aşağıda */}
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Şirket Özel Tatilleri - Ayrı Bölüm */}
          <Card>
            <CardHeader>
              <CardTitle>Şirket Özel Tatilleri</CardTitle>
              <CardDescription>Bu şirkete özel tatilleri ekleyin ve yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground"></div>
                <Button type="button" variant="outline" size="sm" onClick={() => addHoliday()} disabled={companySettingsLoading || !companySettings}>
                  <Plus className="h-4 w-4 mr-2" /> Tatil Ekle
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(companyForm.publicHolidays || []).map((holiday, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`company-holiday-date-${index}`}>Tarih</Label>
                          <Input id={`company-holiday-date-${index}`} type="date" value={holiday.date} onChange={(e) => updateHoliday(index, 'date', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`company-holiday-name-${index}`}>Tatil Adı</Label>
                          <Input id={`company-holiday-name-${index}`} placeholder="Örn: Şirket Kuruluş Günü" value={holiday.name || ''} onChange={(e) => updateHoliday(index, 'name', e.target.value)} />
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={() => removeHoliday(index)} className="shrink-0" aria-label="Sil">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Embedded Platform Policies Section */}
            <Card>
            <CardHeader>
              <CardTitle>Platform Politikaları</CardTitle>
              <CardDescription>Politikaları görüntüleyin ve yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">Toplam {policies.length} politika</div>
                <Link href={`/${workspaceSlug}/${companySlug}/settings/company/policies/new`}>
                  <Button type="button">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Politika
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {policies.map((p: any) => (
                  <Link key={p.id} href={`/${workspaceSlug}/${companySlug}/settings/company/policies/${p.id}`} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.type}</div>
                    <div className="text-xs text-muted-foreground mt-1">Durum: {p.status}</div>
                  </Link>
                ))}
                </div>
              </CardContent>
            </Card>

          {contextLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
    </TooltipProvider>
  );
}