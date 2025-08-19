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

export default function NewCompanyCalendarPage() {
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

  const buildDefaultCalendar = (): WorkCalendar => {
    // No company-level base hours now; default to 09:00-18:00 for working days Mon-Fri
    const start = "09:00";
    const end = "18:00";
    const workingDaysSet = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);
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
    if (companySettings && !calendar) {
      setCalendar(buildDefaultCalendar());
    }
  }, [companySettings]);

  const updateCompanySettings = useMutation({
    mutationFn: async (newCalendarObj: WorkCalendar) => {
      if (!company?.id || !workspace?.id) throw new Error("Company or workspace not found");
      const current: WorkCalendar[] = companySettings?.customSettings?.workCalendars || [];
      const next = [...current, newCalendarObj];
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId: workspace.id,
          companyId: company.id,
          customSettings: {
            ...(companySettings?.customSettings || {}),
            workCalendars: next
          }
        })
      });
      if (!res.ok) throw new Error("Failed to save company calendar");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast.success("Takvim oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      router.push(`/${workspaceSlug}/${companySlug}/settings/company/calendars/${variables.id}`);
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
    updateCompanySettings.mutate({ ...calendar, id: calendar.id || (globalThis as any).crypto?.randomUUID?.() });
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
        {updateCompanySettings.isPending ? "Kaydediliyor..." : "Oluştur"}
      </Button>
      <Link href={`/${workspaceSlug}/${companySlug}/settings/company`}>
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
      </Link>
    </>
  ), [calendar, updateCompanySettings.isPending, workspaceSlug, companySlug]);

  if (contextLoading || companySettingsLoading || !calendar) {
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
      title="Şirket Çalışma Takvimi Oluştur"
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


