"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export function PermissionsAssignment({ 
  role, 
  workspaceContext, 
  onSave, 
  onCancel 
}: { 
  role: Role; 
  workspaceContext: any;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    queryKey: ["role-permissions", role.id, workspaceContext?.workspace?.id, role.companyId ?? null],
    queryFn: async () => {
      if (!workspaceContext?.workspace?.id) return [];
      const params = new URLSearchParams({
        roleId: role.id,
        workspaceId: workspaceContext.workspace.id,
      });
      if (role?.companyId) params.set("companyId", role.companyId);
      const res = await fetch(`/api/system/role-permissions?${params.toString()}`);
      if (!res.ok) throw new Error("Rol izinleri alınamadı");
      return res.json();
    },
    enabled: !!role?.id && !!workspaceContext?.workspace?.id,
  });

  const assignedPermissionIds = useMemo(() => new Set((currentAssignments || []).map((rp: any) => rp.permission?.id)), [currentAssignments]);

  // Get effective permission state (original + pending changes)
  const getEffectivePermissionState = (permissionId: string) => {
    if (pendingChanges.has(permissionId)) {
      return pendingChanges.get(permissionId);
    }
    return assignedPermissionIds.has(permissionId);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const changes = Array.from(pendingChanges.entries());
      const results = await Promise.allSettled(
        changes.map(async ([permissionId, isGranted]) => {
          const res = await fetch("/api/system/role-permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roleId: role.id,
              permissionId,
              workspaceId: workspaceContext.workspace.id,
              companyId: role?.companyId || undefined,
              isGranted,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({} as any));
            throw new Error(err.error || "Atama başarısız");
          }
          return res.json();
        })
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`${failed} izin ataması başarısız oldu`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      setPendingChanges(new Map());
      setHasUnsavedChanges(false);
      toast.success("Rol izinleri başarıyla güncellendi");
      onSave?.();
    },
    onError: (e: any) => toast.error(e?.message || "Hata"),
  });

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const originalState = assignedPermissionIds.has(permissionId);
    const newPendingChanges = new Map(pendingChanges);
    
    if (checked === originalState) {
      // Revert to original state - remove from pending changes
      newPendingChanges.delete(permissionId);
    } else {
      // Different from original - add to pending changes
      newPendingChanges.set(permissionId, checked);
    }
    
    setPendingChanges(newPendingChanges);
    setHasUnsavedChanges(newPendingChanges.size > 0);
  };

  const handleCancel = () => {
    setPendingChanges(new Map());
    setHasUnsavedChanges(false);
    onCancel?.();
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  // Expose functions to parent component
  React.useEffect(() => {
    if (onSave) {
      (window as any).permissionsAssignmentSave = handleSave;
    }
    if (onCancel) {
      (window as any).permissionsAssignmentCancel = handleCancel;
    }
  }, [onSave, onCancel]);

  // Return hasUnsavedChanges and saveMutation.isPending to parent
  React.useEffect(() => {
    (window as any).permissionsAssignmentState = {
      hasUnsavedChanges,
      isPending: saveMutation.isPending
    };
  }, [hasUnsavedChanges, saveMutation.isPending]);

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
          {permissions
            .slice()
            .sort((a: Permission, b: Permission) => {
              const aChecked = getEffectivePermissionState(a.id);
              const bChecked = getEffectivePermissionState(b.id);
              
              // Selected permissions first (true sorts before false)
              if (aChecked !== bChecked) {
                return bChecked ? 1 : -1;
              }
              
              // If same selection state, sort by display name
              return a.displayName.localeCompare(b.displayName);
            })
            .map((p: Permission) => {
            const checked = getEffectivePermissionState(p.id);
            const originalState = assignedPermissionIds.has(p.id);
            const hasChanged = checked !== originalState;
            const actionLabel = ACTION_LABEL_MAP[p.action] || p.action;
            return (
              <div key={p.id} className={`flex items-center justify-between gap-4 border rounded-md p-2 ${hasChanged ? 'border-orange-200 bg-orange-50' : ''}`}>
                <div>
                  <div className="text-sm font-medium">{p.displayName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.name} • {actionLabel}</div>
                  {hasChanged && (
                    <div className="text-xs text-orange-600 mt-1">
                      {checked ? 'Eklenecek' : 'Kaldırılacak'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => handlePermissionToggle(p.id, !!v)}
                  />
                </div>
              </div>
            );
          })}
          {permissions.length === 0 && (
            <div className="text-sm text-muted-foreground">Gösterilecek izin yok</div>
          )}
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              {pendingChanges.size} değişiklik kaydedilmedi
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PermissionsAssignment;
