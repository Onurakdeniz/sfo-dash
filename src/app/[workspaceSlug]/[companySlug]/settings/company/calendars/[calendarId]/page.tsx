"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import SettingsTabs from "../../../settings-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar as CalendarIcon, ChevronLeft, Clock, Coffee, AlertCircle, CheckCircle } from "lucide-react";

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

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string };
  currentCompany: { id: string; name: string; slug: string };
  companies: { id: string; name: string; slug: string }[];
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

const DAYS_OF_WEEK = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" }
];

export default function CompanyCalendarDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const calendarId = params.calendarId as string;

  const [calendar, setCalendar] = useState<WorkCalendar | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch context");
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspace = contextData?.workspace;
  const company = contextData?.currentCompany;

  const { data: companySettings, isLoading: companySettingsLoading } = useQuery<CompanySettings>({
    queryKey: ["company-settings", company?.id, workspace?.id],
    queryFn: async () => {
      if (!company?.id || !workspace?.id) throw new Error("Company or workspace not found");
      const res = await fetch(`/api/settings/company?companyId=${company.id}&workspaceId=${workspace.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch company settings");
      return res.json();
    },
    enabled: !!(company?.id && workspace?.id)
  });

  useEffect(() => {
    if (companySettings && calendarId) {
      const list: WorkCalendar[] = companySettings.customSettings?.workCalendars || [];
      const found = list.find((c) => c.id === calendarId) || null;
      setCalendar(found);
    }
  }, [companySettings, calendarId]);

  const updateCompanySettings = useMutation({
    mutationFn: async (updatedCalendars: WorkCalendar[]) => {
      if (!company?.id || !workspace?.id) throw new Error("Company or workspace not found");
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId: workspace.id,
          companyId: company.id,
          customSettings: {
            ...(companySettings?.customSettings || {}),
            workCalendars: updatedCalendars
          }
        })
      });
      if (!res.ok) throw new Error("Failed to update company settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Takvim kaydedildi");
      setShowSuccessAlert(true);
      setAlertMessage("Çalışma takvimi başarıyla güncellendi!");
      setTimeout(() => setShowSuccessAlert(false), 4000);
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    },
    onError: () => {
      toast.error("Kaydetme hatası");
      setShowErrorAlert(true);
      setAlertMessage("Takvim kaydedilemedi. Lütfen tekrar deneyin.");
      setTimeout(() => setShowErrorAlert(false), 4000);
    }
  });

  const saveCalendar = () => {
    if (!calendar || !companySettings) return;
    const list: WorkCalendar[] = companySettings.customSettings?.workCalendars || [];
    const idx = list.findIndex((c) => c.id === calendar.id);
    const next = [...list];
    if (idx >= 0) next[idx] = { ...calendar, updatedAt: new Date().toISOString() };
    else next.push({ ...calendar, id: calendar.id || (globalThis as any).crypto?.randomUUID?.() });
    updateCompanySettings.mutate(next);
  };

  const updateDay = (dayKey: string, updater: (prev: DaySchedule) => DaySchedule) => {
    if (!calendar) return;
    setCalendar({
      ...calendar,
      days: { ...calendar.days, [dayKey]: updater(calendar.days[dayKey]) },
      updatedAt: new Date().toISOString()
    });
  };

  const actions = useMemo(() => (
    <>
      <Button onClick={saveCalendar} disabled={!calendar || updateCompanySettings.isPending}>
        {updateCompanySettings.isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings/company`}>
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
      </Link>
    </>
  ), [calendar, updateCompanySettings.isPending, workspaceSlug, companySlug]);

  if (contextLoading || companySettingsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace || !company) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>Workspace veya şirket bulunamadı.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Takvim bulunamadı</AlertTitle>
          <AlertDescription>İstenen şirket çalışma takvimi mevcut değil.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/${workspaceSlug}/${companySlug}/settings/company`}>
            <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-2" /> Ayarlara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Şirket Çalışma Takvimi"
      description={`${calendar.name || "Takvim"} için detay ve düzenleme ekranı`}
      actions={actions}
      secondaryNav={<SettingsTabs />}
    >
      {/* Alerts */}
      {showSuccessAlert && (
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Başarılı!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">{alertMessage}</AlertDescription>
        </Alert>
      )}
      {showErrorAlert && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">Hata!</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Takvim Bilgileri
            </CardTitle>
            <CardDescription>Ad ve açıklama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cal-name">Takvim Adı</Label>
                <Input id="cal-name" value={calendar.name} onChange={(e) => setCalendar({ ...calendar, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-desc">Açıklama</Label>
                <Input id="cal-desc" value={calendar.description || ""} placeholder="İsteğe bağlı" onChange={(e) => setCalendar({ ...calendar, description: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gün Bazında Ayarlar</CardTitle>
            <CardDescription>Çalışma günü, mesai ve mola aralıkları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = calendar.days[day.value];
                return (
                  <div key={day.value} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{day.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Çalışma Günü</span>
                        <Switch
                          checked={schedule.isWorkingDay}
                          onCheckedChange={(checked) => updateDay(day.value, (prev) => ({
                            ...prev,
                            isWorkingDay: !!checked,
                            workIntervals: !!checked ? (prev.workIntervals.length ? prev.workIntervals : [{ start: "09:00", end: "18:00" }]) : [],
                            breaks: !!checked ? prev.breaks : []
                          }))}
                        />
                      </div>
                    </div>
                    {schedule.isWorkingDay && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Mesai Saatleri</Label>
                          {schedule.workIntervals.map((rng, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input type="time" value={rng.start} onChange={(e) => updateDay(day.value, (prev) => {
                                const copy = { ...prev };
                                copy.workIntervals = [...copy.workIntervals];
                                copy.workIntervals[idx] = { ...copy.workIntervals[idx], start: e.target.value };
                                return copy;
                              })} />
                              <span className="text-sm">-</span>
                              <Input type="time" value={rng.end} onChange={(e) => updateDay(day.value, (prev) => {
                                const copy = { ...prev };
                                copy.workIntervals = [...copy.workIntervals];
                                copy.workIntervals[idx] = { ...copy.workIntervals[idx], end: e.target.value };
                                return copy;
                              })} />
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => updateDay(day.value, (prev) => ({
                            ...prev,
                            workIntervals: [...prev.workIntervals, { start: "09:00", end: "18:00" }]
                          }))}>
                            <Clock className="h-4 w-4 mr-2" /> Mesai Aralığı Ekle
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Molalar</Label>
                          {schedule.breaks.map((rng, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input type="time" value={rng.start} onChange={(e) => updateDay(day.value, (prev) => {
                                const copy = { ...prev };
                                copy.breaks = [...copy.breaks];
                                copy.breaks[idx] = { ...copy.breaks[idx], start: e.target.value };
                                return copy;
                              })} />
                              <span className="text-sm">-</span>
                              <Input type="time" value={rng.end} onChange={(e) => updateDay(day.value, (prev) => {
                                const copy = { ...prev };
                                copy.breaks = [...copy.breaks];
                                copy.breaks[idx] = { ...copy.breaks[idx], end: e.target.value };
                                return copy;
                              })} />
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => updateDay(day.value, (prev) => ({
                            ...prev,
                            breaks: [...prev.breaks, { start: "12:00", end: "13:00" }]
                          }))}>
                            <Coffee className="h-4 w-4 mr-2" /> Mola Ekle
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


