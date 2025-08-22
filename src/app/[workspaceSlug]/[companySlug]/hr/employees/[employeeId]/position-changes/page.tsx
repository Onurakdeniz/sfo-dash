"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmployeeSecondaryNav from "../employee-secondary-nav";
import { ArrowLeftRight, Briefcase, Building2, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";

type PositionChange = {
  id: string;
  previousPosition?: string | null;
  newPosition?: string | null;
  previousDepartmentId?: string | null;
  newDepartmentId?: string | null;
  previousDepartmentName?: string | null;
  newDepartmentName?: string | null;
  previousUnitId?: string | null;
  newUnitId?: string | null;
  previousUnitName?: string | null;
  newUnitName?: string | null;
  reason?: string | null;
  effectiveDate: string;
  createdAt: string;
};

type EmployeeProfile = {
  position?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
  employmentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type AssignForm = {
  position?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
  effectiveDate?: string | null;
  reason?: string | null;
};

export default function EmployeePositionChangesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;

  const queryClient = useQueryClient();

  const { data: contextData } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });
  const workspaceId = contextData?.workspace?.id as string | undefined;
  const companyId = contextData?.currentCompany?.id as string | undefined;

  // Current employee assignment
  const { data: profile } = useQuery<EmployeeProfile | null>({
    queryKey: ["employee-profile", workspaceId, companyId, employeeId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !employeeId) return null;
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceId && companyId && employeeId),
  });

  const { data: changes = [], isLoading } = useQuery<PositionChange[]>({
    queryKey: ["employee-position-changes", workspaceId, companyId, employeeId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !employeeId) return [] as PositionChange[];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}/position-changes`, { credentials: "include" });
      if (!res.ok) return [] as PositionChange[];
      return res.json();
    },
    enabled: !!(workspaceId && companyId && employeeId),
  });

  const items = useMemo(() => changes, [changes]);

  // Departments and dependent units for selection
  const { data: departments = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["departments", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId),
  });

  const form = useForm<AssignForm>({
    defaultValues: {
      position: profile?.position ?? "",
      departmentId: profile?.departmentId ?? "",
      unitId: profile?.unitId ?? "",
      effectiveDate: "",
      reason: "",
    },
    values: {
      position: profile?.position ?? "",
      departmentId: profile?.departmentId ?? "",
      unitId: profile?.unitId ?? "",
      effectiveDate: "",
      reason: "",
    },
  });

  const watchedDepartmentId = form.watch("departmentId");
  const { data: units = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["units", workspaceId, companyId, watchedDepartmentId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !watchedDepartmentId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments/${watchedDepartmentId}/units`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId && watchedDepartmentId),
  });

  // Units for the employee's current department (for stable display)
  const currentDepartmentId = profile?.departmentId || "";
  const { data: currentUnits = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["units-current", workspaceId, companyId, currentDepartmentId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !currentDepartmentId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments/${currentDepartmentId}/units`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId && currentDepartmentId),
  });

  // Clear unit if department changes (skip initial mount to preserve current assignment)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    form.setValue("unitId", "");
  }, [watchedDepartmentId]);

  const assignMutation = useMutation({
    mutationFn: async (values: AssignForm) => {
      if (!workspaceId || !companyId || !employeeId) throw new Error("Missing context");
      const payload: any = {
        position: values.position || null,
        departmentId: values.departmentId || null,
        unitId: values.unitId || null,
        startDate: values.effectiveDate || null,
        metadata: { positionChangeReason: values.reason || null },
      };
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to assign position");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profile", workspaceId, companyId, employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employee-position-changes", workspaceId, companyId, employeeId] });
      setOpen(false);
      form.reset({
        position: "",
        departmentId: "",
        unitId: "",
        effectiveDate: "",
        reason: "",
      });
    },
  });

  const formatDateTR = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    try {
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <PageWrapper
      title="Pozisyon Değişiklikleri"
      description="Çalışanın geçmiş ve planlanan pozisyon hareketleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Mevcut Atama</CardTitle>
          <CardDescription>Şu anki pozisyon, departman ve birim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {profile?.position || "-"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {(() => {
                const d = departments.find((x) => x.id === (profile?.departmentId || ""));
                return d?.name || "-";
              })()}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {(() => {
                const u = currentUnits.find((x) => x.id === (profile?.unitId || ""));
                return u?.name || "-";
              })()}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>Çalışma Tipi: <span className="text-foreground">{profile?.employmentType || "-"}</span></div>
            <div>Başlangıç Tarihi: <span className="text-foreground">{formatDateTR(profile?.startDate) || "-"}</span></div>
            <div>Bitiş Tarihi: <span className="text-foreground">{formatDateTR(profile?.endDate) || "-"}</span></div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>Yeni pozisyon ata</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Atama</DialogTitle>
            <DialogDescription>Eski kayıtlar korunarak yeni pozisyon/yer değişikliği oluşturun.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => assignMutation.mutate(values))}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozisyon</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn. Kıdemli Yazılım Geliştirici" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={(v) => field.onChange(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={(v) => field.onChange(v)} disabled={!watchedDepartmentId}>
                        <SelectTrigger>
                          <SelectValue placeholder={watchedDepartmentId ? "Birim seçin" : "Önce departman seçin"} />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etkin Tarih</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nedeni</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Atama nedenini belirtin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="md:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>İptal</Button>
                <Button type="submit" disabled={assignMutation.isPending}>Kaydet</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Pozisyon Hareketleri</CardTitle>
          <CardDescription>Terfi, transfer ve atama kayıtları</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="py-6 text-sm text-muted-foreground">Yükleniyor...</div>}
          {!isLoading && items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">Henüz bir pozisyon değişikliği kaydı yok</div>
          )}
          <div className="space-y-4">
            {items.map((c) => {
              const positionChanged = (c.previousPosition || "") !== (c.newPosition || "");
              const departmentChanged = (c.previousDepartmentId || "") !== (c.newDepartmentId || "");
              const unitChanged = (c.previousUnitId || "") !== (c.newUnitId || "");
              return (
                <div key={c.id} className="rounded-lg border p-4 bg-card/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ArrowLeftRight className="h-4 w-4 text-primary" /> Etkin Tarih: {formatDateTR(c.effectiveDate) || "-"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {positionChanged && (
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {(c.previousPosition || "-") + " → " + (c.newPosition || "-")}
                          </Badge>
                        )}
                        {departmentChanged && (
                          <Badge variant="secondary" className="gap-1">
                            <Building2 className="h-3.5 w-3.5" /> {(c.previousDepartmentName || "-") + " → " + (c.newDepartmentName || "-")}
                          </Badge>
                        )}
                        {unitChanged && (
                          <Badge variant="secondary" className="gap-1">
                            <Building2 className="h-3.5 w-3.5" /> {(c.previousUnitName || "-") + " → " + (c.newUnitName || "-")}
                          </Badge>
                        )}
                        {!positionChanged && !departmentChanged && !unitChanged && (
                          <Badge variant="outline">Bilgi güncellemesi</Badge>
                        )}
                      </div>
                      {c.reason && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {c.reason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Kayıt: {formatDateTR(c.createdAt) || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


