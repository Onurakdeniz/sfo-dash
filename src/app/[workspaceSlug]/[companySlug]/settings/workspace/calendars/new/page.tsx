"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Calendar as CalendarIcon, ChevronLeft, Clock, Coffee, AlertCircle } from "lucide-react";

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

export default function NewCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const [calendar, setCalendar] = useState<WorkCalendar | null>(null);

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

  const buildDefaultCalendar = (): WorkCalendar => {
    const start = workspaceSettings?.workingHoursStart || "09:00";
    const end = workspaceSettings?.workingHoursEnd || "18:00";
    const workingDaysSet = new Set(workspaceSettings?.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"]);
    const def = (isWorking: boolean): DaySchedule => ({
      isWorkingDay: isWorking,
      workIntervals: isWorking ? [{ start, end }] : [],
      breaks: []
    });
    const days: Record<string, DaySchedule> = {
      monday: def(workingDaysSet.has("monday")),
      tuesday: def(workingDaysSet.has("tuesday")),
      wednesday: def(workingDaysSet.has("wednesday")),
      thursday: def(workingDaysSet.has("thursday")),
      friday: def(workingDaysSet.has("friday")),
      saturday: def(workingDaysSet.has("saturday")),
      sunday: def(workingDaysSet.has("sunday"))
    };
    const nowIso = new Date().toISOString();
    return {
      id: (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
      name: "",
      description: "",
      days,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  };

  useEffect(() => {
    if (workspaceSettings && !calendar) {
      setCalendar(buildDefaultCalendar());
    }
  }, [workspaceSettings]);

  const updateWorkspaceSettings = useMutation({
    mutationFn: async (newCalendarObj: WorkCalendar) => {
      if (!workspace?.id) throw new Error("Workspace not found");
      const current: WorkCalendar[] = workspaceSettings?.customSettings?.workCalendars || [];
      const next = [...current, newCalendarObj];
      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId: workspace.id,
          customSettings: {
            ...(workspaceSettings?.customSettings || {}),
            workCalendars: next
          }
        })
      });
      if (!res.ok) throw new Error("Failed to save calendar");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast.success("Takvim oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["workspace-settings"] });
      router.push(`/${workspaceSlug}/${companySlug}/settings/workspace/calendars/${variables.id}`);
    },
    onError: () => {
      toast.error("Takvim kaydedilemedi");
    }
  });

  const saveCalendar = () => {
    if (!calendar || !calendar.name.trim()) {
      toast.error("Takvim adı gerekli");
      return;
    }
    updateWorkspaceSettings.mutate({ ...calendar, id: calendar.id || (globalThis as any).crypto?.randomUUID?.() });
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
        {updateWorkspaceSettings.isPending ? "Kaydediliyor..." : "Oluştur"}
      </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings`}>
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
      </Link>
    </>
  ), [calendar, updateWorkspaceSettings.isPending, workspaceSlug, companySlug]);

  if (contextLoading || workspaceSettingsLoading || !calendar) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <PageWrapper
      title="Çalışma Takvimi Oluştur"
      description="Gün bazında mesai ve molaları tanımlayın"
      actions={actions}
      secondaryNav={<SettingsTabs />}
    >
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
                <Input id="cal-name" placeholder="Örn: Genel Mesai" value={calendar.name} onChange={(e) => setCalendar({ ...calendar, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-desc">Açıklama</Label>
                <Input id="cal-desc" placeholder="İsteğe bağlı açıklama" value={calendar.description || ""} onChange={(e) => setCalendar({ ...calendar, description: e.target.value })} />
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


