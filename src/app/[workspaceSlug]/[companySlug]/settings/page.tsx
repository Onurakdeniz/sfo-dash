"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// base çalışma saatleri kaldırıldığı için checkbox/switch burada kullanılmıyor
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Settings, 
  Palette,
  Info,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SettingsTabs from "./settings-tabs";
import Link from "next/link";
import { RoleGuard } from "@/components/layouts/role-guard";
// takvim oluşturma modalı kaldırıldı; ayrı sayfa kullanılıyor

interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  publicHolidays: { date: string; name?: string }[];
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

const DAYS_OF_WEEK = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" }
];

const TIMEZONES = [
  { value: "Europe/Istanbul", label: "Türkiye (GMT+3)" },
  { value: "Europe/London", label: "Londra (GMT+0)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" }
];

const CURRENCIES = [
  { value: "TRY", label: "Türk Lirası (₺)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" }
];

const LANGUAGES = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" }
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
];

function SettingsPageContent() {
  const params = useParams();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // Form states
  const [workspaceForm, setWorkspaceForm] = useState<Partial<WorkspaceSettings>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  // takvim oluşturma ayrı sayfada yapılır

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

  // Fetch workspace settings
  const { data: workspaceSettings, isLoading: workspaceSettingsLoading, error: workspaceSettingsError } = useQuery<WorkspaceSettings>({
    queryKey: ['workspace-settings', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) throw new Error('Workspace not found');
      console.log('Fetching workspace settings for workspace ID:', workspace.id);
      const res = await fetch(`/api/settings/workspace?workspaceId=${workspace.id}`, {
        credentials: 'include'
      });
      console.log('Workspace settings response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Workspace settings API error:', errorText);
        throw new Error(`Failed to fetch workspace settings: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('Workspace settings data received:', data);
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('SettingsPage render:', {
      workspaceForm,
      contextData,
      workspace,
      workspaceSettingsLoading: workspaceSettingsLoading,
      workspaceSettings,
      workspaceSettingsError: workspaceSettingsError?.message,
    });
  }

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (workspaceSettings) {
      console.log('Setting workspace form data:', workspaceSettings);
      setWorkspaceForm({
        ...workspaceSettings,
        timezone: workspaceSettings.timezone || '',
        currency: workspaceSettings.currency || '',
        language: workspaceSettings.language || '',
        dateFormat: workspaceSettings.dateFormat || '',
        workingHoursStart: workspaceSettings.workingHoursStart || '',
        workingHoursEnd: workspaceSettings.workingHoursEnd || '',
        workingDays: Array.isArray(workspaceSettings.workingDays) ? workspaceSettings.workingDays : [],
        publicHolidays: Array.isArray(workspaceSettings.publicHolidays) ? workspaceSettings.publicHolidays : [],
        customSettings: {
          ...(workspaceSettings.customSettings || {}),
          workCalendars: Array.isArray(workspaceSettings.customSettings?.workCalendars)
            ? workspaceSettings.customSettings.workCalendars
            : []
        }
      });
    }
  }, [workspaceSettings]);

  // Workspace settings mutation
  const updateWorkspaceSettings = useMutation({
    mutationFn: async (data: Partial<WorkspaceSettings>) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, workspaceId: workspace.id })
      });
      if (!res.ok) throw new Error('Failed to update workspace settings');
      return res.json();
    },
    onSuccess: () => {
      toast.success("Başarılı!", {
        description: "Workspace ayarları kaydedildi.",
      });
      setShowSuccessAlert(true);
      setAlertMessage("Workspace ayarları başarıyla kaydedildi!");
      setTimeout(() => setShowSuccessAlert(false), 5000);
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] });
    },
    onError: (error) => {
      toast.error("Hata!", {
        description: "Workspace ayarları kaydedilemedi.",
      });
      setShowErrorAlert(true);
      setAlertMessage("Workspace ayarları kaydedilemedi. Lütfen tekrar deneyin.");
      setTimeout(() => setShowErrorAlert(false), 5000);
    },
  });

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceSettings.mutate(workspaceForm);
  };

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    const currentDays = workspaceForm.workingDays || [];
    const newDays = checked 
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    setWorkspaceForm(prev => ({ ...prev, workingDays: newDays }));
  };

  const addHoliday = () => {
    const newHoliday = { date: '', name: '' };
    const currentHolidays = workspaceForm.publicHolidays || [];
    setWorkspaceForm(prev => ({ ...prev, publicHolidays: [...currentHolidays, newHoliday] }));
  };

  const updateHoliday = (index: number, field: 'date' | 'name', value: string) => {
    const currentHolidays = [...(workspaceForm.publicHolidays || [])];
    currentHolidays[index] = { ...currentHolidays[index], [field]: value };
    setWorkspaceForm(prev => ({ ...prev, publicHolidays: currentHolidays }));
  };

  const removeHoliday = (index: number) => {
    const currentHolidays = workspaceForm.publicHolidays || [];
    const newHolidays = currentHolidays.filter((_, i) => i !== index);
    setWorkspaceForm(prev => ({ ...prev, publicHolidays: newHolidays }));
  };

  // modal ile takvim oluşturma kaldırıldı

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
      <Button 
        type="submit" 
        form="workspace-settings-form"
        disabled={updateWorkspaceSettings.isPending || workspaceSettingsLoading || !workspaceSettings}
      >
        {updateWorkspaceSettings.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          'Kaydet'
        )}
      </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings/company`}>
        <Button variant="outline">
          <Building2 className="mr-2 h-4 w-4" />
          Şirketler
        </Button>
      </Link>
    </>
  );

  return (
    <TooltipProvider>
      <PageWrapper
        title="Workspace Ayarları"
        description={`${workspace.name} çalışma alanı için sistem ayarları`}
        actions={actions}
        secondaryNav={<SettingsTabs />}
      >
        {/* Success/Error Alerts */}
        {showSuccessAlert && (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">Başarılı!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {showErrorAlert && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-200">Hata!</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Workspace Ayarları</AlertTitle>
            <AlertDescription>
              Bu ayarlar tüm workspace içindeki şirketler için varsayılan değerler olarak kullanılır. 
              Şirket özel ayarları bu değerleri geçersiz kılabilir.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workspace Ayarları
              </CardTitle>
              <CardDescription>
                Workspace genelinde geçerli olan temel ayarları yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="workspace-settings-form" onSubmit={handleWorkspaceSubmit} className="space-y-6">
                {workspaceSettingsLoading || !workspaceSettings ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Saat Dilimi</Label>
                        <Select 
                          key={`timezone-${workspaceForm.timezone}`}
                          value={workspaceForm.timezone || ''} 
                          onValueChange={(value) => {
                            console.log('Timezone changed to:', value);
                            setWorkspaceForm(prev => ({ ...prev, timezone: value }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Saat dilimi seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map(tz => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Para Birimi</Label>
                        <Select 
                          key={`currency-${workspaceForm.currency}`}
                          value={workspaceForm.currency || ''} 
                          onValueChange={(value) => setWorkspaceForm(prev => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Para birimi seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(currency => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Dil</Label>
                        <Select 
                          key={`language-${workspaceForm.language}`}
                          value={workspaceForm.language || ''} 
                          onValueChange={(value) => setWorkspaceForm(prev => ({ ...prev, language: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Dil seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Tarih Formatı</Label>
                        <Select 
                          key={`dateFormat-${workspaceForm.dateFormat}`}
                          value={workspaceForm.dateFormat || ''} 
                          onValueChange={(value) => setWorkspaceForm(prev => ({ ...prev, dateFormat: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tarih formatı seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATE_FORMATS.map(format => (
                              <SelectItem key={format.value} value={format.value}>
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Çalışma saatleri ve günleri takvimlerle yönetiliyor */}
                    {/* Özel Tatiller bölümü aşağıya taşındı */}
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Work Calendars Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Çalışma Takvimi
              </CardTitle>
              <CardDescription>
                Gün bazında mesai ve mola saatlerini içeren bir veya birden fazla takvim tanımlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {Array.isArray(workspaceForm.customSettings?.workCalendars) && workspaceForm.customSettings.workCalendars.length > 0
                    ? `${workspaceForm.customSettings.workCalendars.length} takvim`
                    : 'Henüz takvim oluşturulmadı'}
                        </div>
                <Link href={`/${workspaceSlug}/${companySlug}/settings/workspace/calendars/new`}>
                  <Button type="button">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Takvim
                  </Button>
                </Link>
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(workspaceForm.customSettings?.workCalendars || []).map((cal: WorkCalendar) => {
                  const activeDays = Object.entries(cal.days)
                    .filter(([_, d]) => d.isWorkingDay)
                    .map(([k]) => DAYS_OF_WEEK.find(dw => dw.value === k)?.label || k)
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
                        <Link href={`/${workspaceSlug}/${companySlug}/settings/workspace/calendars/${cal.id}`} className="inline-flex items-center text-sm">
                          Detaylar <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Özel Tatiller - takvimlerden sonra */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Özel Tatiller</CardTitle>
              <CardDescription>Resmi olmayan, workspace'e özel tatilleri ekleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground"></div>
                <Button type="button" variant="outline" size="sm" onClick={() => addHoliday()} disabled={workspaceSettingsLoading || !workspaceSettings}>
                  <Plus className="h-4 w-4 mr-2" /> Tatil Ekle
                        </Button>
                      </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(workspaceForm.publicHolidays || []).map((holiday, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`workspace-holiday-date-${index}`}>Tarih</Label>
                          <Input id={`workspace-holiday-date-${index}`} type="date" value={holiday.date} onChange={(e) => updateHoliday(index, 'date', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`workspace-holiday-name-${index}`}>Tatil Adı</Label>
                          <Input id={`workspace-holiday-name-${index}`} placeholder="Örn: Kurban Bayramı" value={holiday.name || ''} onChange={(e) => updateHoliday(index, 'name', e.target.value)} />
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

          {/* Theme Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema Ayarları
              </CardTitle>
              <CardDescription>
                Workspace için tema tercihlerini yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Aktif Tema</h4>
                  <p className="text-sm text-muted-foreground">
                    Workspace genelinde kullanılacak temayı seçin
                  </p>
                </div>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </TooltipProvider>
  );
}

export default function SettingsPage() {
  return (
    <RoleGuard 
      requiredRoles={['owner', 'admin']}
      fallbackMessage="Ayarlar sayfasına erişmek için yönetici yetkisi gereklidir."
    >
      <SettingsPageContent />
    </RoleGuard>
  );
}