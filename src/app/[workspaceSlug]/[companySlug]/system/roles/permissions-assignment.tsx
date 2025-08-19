"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Role = {
  id: string;
  code: string;
  name: string;
  displayName: string;
};

type Module = { id: string; displayName: string };
type Resource = { id: string; displayName: string; moduleId: string };
type Permission = { id: string; action: string; name: string; displayName: string; resourceId: string };

const ACTION_LABEL_MAP: Record<string, string> = {
  view: "Görüntüle",
  edit: "Düzenle",
  manage: "Tüm Yetki",
  approve: "Onay",
};

export function PermissionsAssignment({ role, workspaceContext }: { role: Role; workspaceContext: any }) {
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all");

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await fetch("/api/system/modules");
      if (!res.ok) throw new Error("Modüller alınamadı");
      return res.json();
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources", selectedModuleId],
    queryFn: async () => {
      const url = selectedModuleId === "all" ? "/api/system/resources" : `/api/system/resources?moduleId=${selectedModuleId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Alt modüller alınamadı");
      return res.json();
    },
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions", selectedResourceId],
    queryFn: async () => {
      const url = selectedResourceId === "all" ? "/api/system/permissions" : `/api/system/permissions?resourceId=${selectedResourceId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("İzinler alınamadı");
      return res.json();
    },
  });

  const { data: currentAssignments = [] } = useQuery({
    queryKey: ["role-permissions", role.id, workspaceContext?.workspace?.id, workspaceContext?.currentCompany?.id],
    queryFn: async () => {
      if (!workspaceContext?.workspace?.id) return [];
      const params = new URLSearchParams({
        roleId: role.id,
        workspaceId: workspaceContext.workspace.id,
      });
      if (workspaceContext?.currentCompany?.id) params.set("companyId", workspaceContext.currentCompany.id);
      const res = await fetch(`/api/system/role-permissions?${params.toString()}`);
      if (!res.ok) throw new Error("Rol izinleri alınamadı");
      return res.json();
    },
    enabled: !!role?.id && !!workspaceContext?.workspace?.id,
  });

  const assignedPermissionIds = useMemo(() => new Set((currentAssignments || []).map((rp: any) => rp.permission?.id)), [currentAssignments]);

  const assignMutation = useMutation({
    mutationFn: async ({ permissionId, isGranted }: { permissionId: string; isGranted: boolean }) => {
      const res = await fetch("/api/system/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role.id,
          permissionId,
          workspaceId: workspaceContext.workspace.id,
          companyId: workspaceContext?.currentCompany?.id,
          isGranted,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Atama başarısız");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Rol izinleri güncellendi");
    },
    onError: (e: any) => toast.error(e?.message || "Hata"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>İzin Atamaları</CardTitle>
        <CardDescription>Modül ve Alt Modül filtresi ile izinleri seçin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedModuleId} onValueChange={(v) => { setSelectedModuleId(v); setSelectedResourceId("all"); }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Modül" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Modüller</SelectItem>
              {modules.map((m: Module) => (
                <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Alt Modül" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Alt Modüller</SelectItem>
              {resources.map((r: Resource) => (
                <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {permissions.map((p: Permission) => {
            const checked = assignedPermissionIds.has(p.id);
            const actionLabel = ACTION_LABEL_MAP[p.action] || p.action;
            return (
              <div key={p.id} className="flex items-center justify-between gap-4 border rounded-md p-2">
                <div>
                  <div className="text-sm font-medium">{p.displayName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.name} • {actionLabel}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => assignMutation.mutate({ permissionId: p.id, isGranted: !!v })}
                  />
                </div>
              </div>
            );
          })}
          {permissions.length === 0 && (
            <div className="text-sm text-muted-foreground">Gösterilecek izin yok</div>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["role-permissions"] })}>Yenile</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionsAssignment;
