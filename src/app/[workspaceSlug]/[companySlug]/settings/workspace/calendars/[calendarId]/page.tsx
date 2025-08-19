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

export default function CalendarDetailPage() {
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

  const { data: workspaceSettings, isLoading: workspaceSettingsLoading } = useQuery<WorkspaceSettings>({
    queryKey: ["workspace-settings", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) throw new Error("Workspace not found");
      const res = await fetch(`/api/settings/workspace?workspaceId=${workspace.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspace settings");
      return res.json();
    },
    enabled: !!workspace?.id
  });

  useEffect(() => {
    if (workspaceSettings && calendarId) {
      const list: WorkCalendar[] = workspaceSettings.customSettings?.workCalendars || [];
      const found = list.find((c) => c.id === calendarId) || null;
      setCalendar(found);
    }
  }, [workspaceSettings, calendarId]);

  const updateWorkspaceSettings = useMutation({
    mutationFn: async (updatedCalendars: WorkCalendar[]) => {
      if (!workspace?.id) throw new Error("Workspace not found");
      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId: workspace.id,
          customSettings: {
            ...(workspaceSettings?.customSettings || {}),
            workCalendars: updatedCalendars
          }
        })
      });
      if (!res.ok) throw new Error("Failed to update workspace settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Takvim kaydedildi");
      setShowSuccessAlert(true);
      setAlertMessage("Çalışma takvimi başarıyla güncellendi!");
      setTimeout(() => setShowSuccessAlert(false), 4000);
      queryClient.invalidateQueries({ queryKey: ["workspace-settings"] });
    },
    onError: () => {
      toast.error("Kaydetme hatası");
      setShowErrorAlert(true);
      setAlertMessage("Takvim kaydedilemedi. Lütfen tekrar deneyin.");
      setTimeout(() => setShowErrorAlert(false), 4000);
    }
  });

  const saveCalendar = () => {
    if (!calendar || !workspaceSettings) return;
    const list: WorkCalendar[] = workspaceSettings.customSettings?.workCalendars || [];
    const idx = list.findIndex((c) => c.id === calendar.id);
    const next = [...list];
    if (idx >= 0) next[idx] = { ...calendar, updatedAt: new Date().toISOString() };
    else next.push({ ...calendar, id: calendar.id || (globalThis as any).crypto?.randomUUID?.() });
    updateWorkspaceSettings.mutate(next);
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
      <Button onClick={saveCalendar} disabled={!calendar || updateWorkspaceSettings.isPending}>
        {updateWorkspaceSettings.isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings`}>
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
      </Link>
    </>
  ), [calendar, updateWorkspaceSettings.isPending, workspaceSlug, companySlug]);

  if (contextLoading || workspaceSettingsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>Workspace bulunamadı.</AlertDescription>
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
          <AlertDescription>İstenen çalışma takvimi mevcut değil.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/${workspaceSlug}/${companySlug}/settings`}>
            <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-2" /> Ayarlara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Çalışma Takvimi"
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
                            workIntervals: !!checked ? (prev.workIntervals.length ? prev.workIntervals : [{ start: workspaceSettings?.workingHoursStart || "09:00", end: workspaceSettings?.workingHoursEnd || "18:00" }]) : [],
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
                            workIntervals: [...prev.workIntervals, { start: workspaceSettings?.workingHoursStart || "09:00", end: workspaceSettings?.workingHoursEnd || "18:00" }]
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


