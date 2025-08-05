"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import Link from "next/link";

interface CompanySettings {
  id: string;
  companyId: string;
  fiscalYearStart: string;
  taxRate: string;
  invoicePrefix: string;
  invoiceNumbering: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string[];
  publicHolidays?: { date: string; name?: string }[];
  customSettings: Record<string, any>;
}

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string };
  currentCompany: { id: string; name: string; slug: string };
  companies: { id: string; name: string; slug: string }[];
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" }
];

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

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

  // Fetch company settings for selected company
  const { data: companySettings, isLoading: companySettingsLoading, error: companySettingsError } = useQuery<CompanySettings>({
    queryKey: ['company-settings', selectedCompanyId, workspace?.id],
    queryFn: async () => {
      if (!selectedCompanyId || !workspace?.id) throw new Error('Company or workspace not found');
      const res = await fetch(`/api/settings/company?companyId=${selectedCompanyId}&workspaceId=${workspace.id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch company settings: ${res.status} ${errorText}`);
      }
      return res.json();
    },
    enabled: !!(selectedCompanyId && workspace?.id),
  });

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('CompanySettingsPage render:', {
      companyForm,
      selectedCompanyId,
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
        workingHoursStart: companySettings.workingHoursStart || '',
        workingHoursEnd: companySettings.workingHoursEnd || '',
        workingDays: Array.isArray(companySettings.workingDays) ? companySettings.workingDays : [],
        publicHolidays: Array.isArray(companySettings.publicHolidays) ? companySettings.publicHolidays : []
      });
    }
  }, [companySettings]);

  // Initialize selected company when context loads
  useEffect(() => {
    if (contextData?.companies && contextData.companies.length > 0) {
      // Default to current company if available, otherwise first company
      const defaultCompany = contextData.currentCompany || contextData.companies[0];
      setSelectedCompanyId(defaultCompany.id);
    }
  }, [contextData]);

  // Reset company form when selected company changes but keep the fetched data
  useEffect(() => {
    if (selectedCompanyId && companySettings) {
      setCompanyForm({
        ...companySettings,
        fiscalYearStart: companySettings.fiscalYearStart || '',
        taxRate: companySettings.taxRate || '',
        invoicePrefix: companySettings.invoicePrefix || '',
        invoiceNumbering: companySettings.invoiceNumbering || '',
        workingHoursStart: companySettings.workingHoursStart || '',
        workingHoursEnd: companySettings.workingHoursEnd || '',
        workingDays: Array.isArray(companySettings.workingDays) ? companySettings.workingDays : [],
        publicHolidays: Array.isArray(companySettings.publicHolidays) ? companySettings.publicHolidays : []
      });
    }
  }, [selectedCompanyId, companySettings]);

  // Company settings mutation
  const updateCompanySettings = useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      if (!selectedCompanyId || !workspace?.id) throw new Error('Company or workspace not found');
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, companyId: selectedCompanyId, workspaceId: workspace.id })
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
    if (!selectedCompanyId) {
      toast.error("Hata!", {
        description: "Lütfen önce bir şirket seçin.",
      });
      return;
    }
    updateCompanySettings.mutate(companyForm);
  };

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    const currentDays = companyForm.workingDays || [];
    const newDays = checked 
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    setCompanyForm(prev => ({ ...prev, workingDays: newDays }));
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
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  const actions = (
    <>
      {selectedCompanyId && (
        <Button 
          type="submit" 
          form="company-settings-form"
          disabled={updateCompanySettings.isPending || companySettingsLoading || !selectedCompanyId || !companySettings}
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
      )}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Şirket Seçimi
              </CardTitle>
              <CardDescription>
                Ayarlarını düzenlemek istediğiniz şirketi seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-select">Şirket</Label>
                  <Select 
                    value={selectedCompanyId} 
                    onValueChange={setSelectedCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {contextData?.companies?.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            <span>{company.name}</span>
                            {contextData.currentCompany?.id === company.id && (
                              <Badge variant="secondary" className="text-xs">
                                Mevcut
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompanyId && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">
                        {contextData?.companies?.find(c => c.id === selectedCompanyId)?.name}
                      </span>
                      <Badge variant="outline">Seçili</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedCompanyId && (
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

                      {/* Working Hours Override */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Çalışma Saatleri (İsteğe Bağlı)</h3>
                        <p className="text-sm text-muted-foreground">Boş bırakırsanız workspace ayarları kullanılır</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="companyWorkingHoursStart">Başlangıç Saati</Label>
                            <Input
                              id="companyWorkingHoursStart"
                              type="time"
                              value={companyForm.workingHoursStart || ''}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="companyWorkingHoursEnd">Bitiş Saati</Label>
                            <Input
                              id="companyWorkingHoursEnd"
                              type="time"
                              value={companyForm.workingHoursEnd || ''}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Working Days Override */}
                      <div className="space-y-4">
                        <Label>Çalışma Günleri (İsteğe Bağlı Üzerine Yazma)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                          {DAYS_OF_WEEK.map(day => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`company-${day.value}`}
                                checked={companyForm.workingDays?.includes(day.value) || false}
                                onCheckedChange={(checked) => handleWorkingDayChange(day.value, checked as boolean)}
                              />
                              <Label htmlFor={`company-${day.value}`} className="text-sm">
                                {day.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Company Holidays */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Şirket Özel Tatilleri</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addHoliday()}
                            disabled={companySettingsLoading || !companySettings}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tatil Ekle
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {(companyForm.publicHolidays || []).map((holiday, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`company-holiday-date-${index}`}>Tarih</Label>
                                  <Input
                                    id={`company-holiday-date-${index}`}
                                    type="date"
                                    value={holiday.date}
                                    onChange={(e) => updateHoliday(index, 'date', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`company-holiday-name-${index}`}>Tatil Adı</Label>
                                  <Input
                                    id={`company-holiday-name-${index}`}
                                    placeholder="Örn: Şirket Kuruluş Günü"
                                    value={holiday.name || ''}
                                    onChange={(e) => updateHoliday(index, 'name', e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeHoliday(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {!selectedCompanyId && !contextLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  {contextData?.companies && contextData.companies.length === 0 ? (
                    <>
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Henüz şirket bulunmuyor</h3>
                      <p className="text-sm text-muted-foreground">Bu workspace'de henüz şirket oluşturulmamış</p>
                    </>
                  ) : (
                    <>
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Şirket seçin</h3>
                      <p className="text-sm text-muted-foreground">Ayarlarını düzenlemek istediğiniz şirketi yukarıdan seçin</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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