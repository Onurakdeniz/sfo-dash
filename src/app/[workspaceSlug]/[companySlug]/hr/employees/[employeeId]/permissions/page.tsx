"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeePermissionsPage() {
  const params = useParams();
  const queryClient = useQueryClient();

  const workspaceSlug = String(params.workspaceSlug);
  const companySlug = String(params.companySlug);
  const employeeId = String(params.employeeId);

  const { data: workspaceContext, isLoading: isCtxLoading } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`);
      if (!res.ok) throw new Error("Çalışma alanı bilgisi alınamadı");
      return res.json();
    }
  });

  const workspaceId: string | undefined = workspaceContext?.workspace?.id;
  const companyId: string | undefined = workspaceContext?.currentCompany?.id;

  // Role assignment UI removed per request; keep only direct permission assignments and effective permissions.

  // Effective permissions for current company (from assigned company roles + direct grants)
  const { data: effectivePermissions = [], isLoading: isPermsLoading } = useQuery({
    enabled: !!workspaceId && !!companyId && !!employeeId,
    queryKey: ["effective-permissions", employeeId, workspaceId, companyId],
    queryFn: async () => {
      // 1) Assigned company roles
      const assignedRes = await fetch(`/api/users/${employeeId}/roles?workspaceId=${workspaceId}&companyId=${companyId}`);
      if (!assignedRes.ok) throw new Error("Kullanıcı rolleri alınamadı");
      const assigned = await assignedRes.json();
      const roleIds: string[] = (assigned as any[]).map((r) => r.roleId);

      // 2) Role-based permissions (include workspace-level and company-level, then filter)
      const rolePermResults = await Promise.all(
        roleIds.map(async (rid) => {
          const resp = await fetch(`/api/system/role-permissions?roleId=${rid}&workspaceId=${workspaceId}`);
          if (!resp.ok) return [] as any[];
          const data = await resp.json();
          return (data as any[]).filter((rp: any) => !rp.rolePermission || rp.rolePermission.companyId == null || rp.rolePermission.companyId === companyId);
        })
      );
      const rolePermsFlat = rolePermResults.flat();

      // 3) Direct user grants for this company
      const directRes = await fetch(`/api/users/${employeeId}/permissions?workspaceId=${workspaceId}&companyId=${companyId}`);
      const directRows = directRes.ok ? await directRes.json() : [];

      // 3a) Fetch permission details for direct grants
      const directDetails = await Promise.all(
        (directRows as any[]).map(async (row) => {
          const p = await fetch(`/api/system/permissions/${row.permissionId}`);
          if (!p.ok) return null;
          const perm = await p.json();
          return perm ? { type: "direct", permission: perm } : null;
        })
      );

      // Normalize role-based shape to common format
      const roleBased = rolePermsFlat.map((rp: any) => ({ type: "role", role: rp.role, permission: {
        id: rp.permission.id,
        action: rp.permission.action,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        resource: {
          id: rp.resource.id,
          displayName: rp.resource.displayName,
          module: { id: rp.module.id, displayName: rp.module.displayName }
        }
      }}));

      // Normalize direct shape to same
      const directBased = directDetails.filter(Boolean).map((d: any) => ({ type: "direct", permission: d.permission || d }));

      // Merge & dedupe by permission.id; collect sources
      const byId: Record<string, { id: string; module: string; resource: string; action: string; displayName: string; sources: string[] }> = {};
      for (const item of [...roleBased, ...directBased]) {
        const perm = item.permission;
        const id = perm.id;
        const moduleName = perm.resource?.module?.displayName || "";
        const resourceName = perm.resource?.displayName || "";
        const displayName = perm.displayName || perm.name;
        if (!byId[id]) {
          byId[id] = { id, module: moduleName, resource: resourceName, action: perm.action, displayName, sources: [] };
        }
        if (item.type === "role") {
          const roleName = item.role?.displayName || item.role?.name || "Rol";
          if (!byId[id].sources.includes(roleName)) byId[id].sources.push(roleName);
        } else {
          if (!byId[id].sources.includes("Doğrudan")) byId[id].sources.push("Doğrudan");
        }
      }

      // Sort by module/resource/action
      const list = Object.values(byId).sort((a, b) => (a.module + a.resource + a.action).localeCompare(b.module + b.resource + b.action));
      return list;
    }
  });

  const isAdmin = !!(workspaceContext?.user?.isOwner || workspaceContext?.user?.role === "admin");
  // Minimal role assignment widget state
  const [assignScope, setAssignScope] = useState<"workspace" | "company">("company");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  // Fetch roles to select from (by scope)
  const { data: workspaceAssignableRoles = [], isLoading: isWsAssignRolesLoading } = useQuery({
    enabled: !!workspaceId,
    queryKey: ["assignable-roles", "workspace", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/system/roles?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Workspace rolleri alınamadı");
      return res.json();
    }
  });
  const { data: companyAssignableRoles = [], isLoading: isCompAssignRolesLoading } = useQuery({
    enabled: !!companyId,
    queryKey: ["assignable-roles", "company", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/system/roles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Şirket rolleri alınamadı");
      return res.json();
    }
  });

  // Current assignments (for chosen scope)
  const { data: assignedRolesWorkspace = [] } = useQuery({
    enabled: !!workspaceId && !!employeeId,
    queryKey: ["user-roles", { employeeId, scope: "workspace", workspaceId }],
    queryFn: async () => {
      const res = await fetch(`/api/users/${employeeId}/roles?workspaceId=${workspaceId}`);
      if (!res.ok) return [];
      return res.json();
    }
  });
  const { data: assignedRolesCompany = [] } = useQuery({
    enabled: !!workspaceId && !!companyId && !!employeeId,
    queryKey: ["user-roles", { employeeId, scope: "company", workspaceId, companyId }],
    queryFn: async () => {
      const res = await fetch(`/api/users/${employeeId}/roles?workspaceId=${workspaceId}&companyId=${companyId}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const availableRoles = assignScope === "company" ? (companyAssignableRoles as any[]) : (workspaceAssignableRoles as any[]);
  const assignedRoleIds = useMemo(() => new Set(((assignScope === "company" ? (assignedRolesCompany as any[]) : (assignedRolesWorkspace as any[])) || []).map((r: any) => r.roleId)), [assignScope, assignedRolesCompany, assignedRolesWorkspace]);
  const isSelectedAssigned = !!selectedRoleId && assignedRoleIds.has(selectedRoleId);

  // Mutations to assign/unassign a role
  const assignUserRole = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !selectedRoleId) throw new Error("Eksik bilgi");
      const body: any = { roleId: selectedRoleId, workspaceId };
      if (assignScope === "company") body.companyId = companyId;
      const res = await fetch(`/api/users/${employeeId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Rol atama başarısız");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Rol atandı");
      queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: assignScope, workspaceId, companyId }] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", employeeId, workspaceId, companyId] });
    },
    onError: (error: any) => toast.error(error?.message || "Rol atama başarısız")
  });

  const unassignUserRole = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !selectedRoleId) throw new Error("Eksik bilgi");
      const params = new URLSearchParams();
      params.set("roleId", selectedRoleId);
      params.set("workspaceId", workspaceId);
      if (assignScope === "company" && companyId) params.set("companyId", companyId);
      const res = await fetch(`/api/users/${employeeId}/roles?${params.toString()}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Rol kaldırma başarısız");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Rol kaldırıldı");
      queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: assignScope, workspaceId, companyId }] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", employeeId, workspaceId, companyId] });
    },
    onError: (error: any) => toast.error(error?.message || "Rol kaldırma başarısız")
  });

  // Custom user permissions (direct grants) state and queries
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await fetch("/api/system/modules");
      if (!res.ok) throw new Error("Modüller alınamadı");
      return res.json();
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources", selectedModuleId, companyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedModuleId !== "all") params.set("moduleId", selectedModuleId);
      if (companyId) params.set("companyId", companyId);
      const url = params.toString() ? `/api/system/resources?${params.toString()}` : "/api/system/resources";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Kaynaklar alınamadı");
      return res.json();
    },
  });

  const { data: allPermissions = [], isLoading: isAllPermissionsLoading } = useQuery({
    queryKey: ["permissions", selectedResourceId, selectedModuleId],
    queryFn: async () => {
      const url = selectedResourceId === "all" ? "/api/system/permissions" : `/api/system/permissions?resourceId=${selectedResourceId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("İzinler alınamadı");
      return res.json();
    },
  });

  const { data: userDirectPermissions = [], isLoading: isUserDirectLoading } = useQuery({
    enabled: !!workspaceId && !!employeeId,
    queryKey: ["user-direct-permissions", employeeId, workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const params = new URLSearchParams({ workspaceId });
      if (companyId) params.set("companyId", companyId);
      const res = await fetch(`/api/users/${employeeId}/permissions?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const grantedPermissionIds = useMemo(
    () => new Set((userDirectPermissions as any[]).map((up) => up.permissionId)),
    [userDirectPermissions]
  );

  const handleTogglePending = (permissionId: string, nextChecked: boolean) => {
    const current = grantedPermissionIds.has(permissionId);
    setPendingChanges((prev) => {
      const copy = { ...prev };
      if (nextChecked === current) {
        delete copy[permissionId];
      } else {
        copy[permissionId] = nextChecked;
      }
      return copy;
    });
  };

  const handleSavePending = async () => {
    if (!workspaceId) {
      toast.error("workspaceId yok");
      return;
    }
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;
    try {
      setIsSaving(true);
      const grants = entries
        .map(([permissionId, desired]) => {
          const current = grantedPermissionIds.has(permissionId);
          if (desired === current) return null;
          return { permissionId, isGranted: desired };
        })
        .filter(Boolean);

      const res = await fetch(`/api/users/${employeeId}/permissions/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, companyId, grants }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Toplu kaydetme başarısız");
      }
      setPendingChanges({});
      queryClient.invalidateQueries({ queryKey: ["user-direct-permissions", employeeId, workspaceId, companyId] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", employeeId, workspaceId, companyId] });
      toast.success("Değişiklikler kaydedildi");
    } catch (e: any) {
      toast.error(e?.message || "Kaydetme sırasında hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Yetkiler"
      description="Kullanıcının uygulama ve şirket içi erişim izinleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <div className="space-y-6">

        {/* Role assignment UI removed */}

        <Card>
          <CardHeader>
            <CardTitle>Rol Ata</CardTitle>
            <CardDescription>Sistem &gt; Roller sayfasında tanımlı bir rolü bu kullanıcıya ata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              <Select value={assignScope} onValueChange={(v) => { setAssignScope(v as any); setSelectedRoleId(""); }}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kapsam" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Şirket</SelectItem>
                  <SelectItem value="workspace">Workspace</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Rol seçin" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.displayName || r.name} ({r.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => assignUserRole.mutate()}
                disabled={!selectedRoleId || assignUserRole.isPending || isWsAssignRolesLoading || isCompAssignRolesLoading}
              >
                {assignUserRole.isPending ? "Atanıyor..." : "Rol Ata"}
              </Button>
                <Button
                variant="outline"
                onClick={() => unassignUserRole.mutate()}
                disabled={!selectedRoleId || !isSelectedAssigned || unassignUserRole.isPending}
              >
                {unassignUserRole.isPending ? "Kaldırılıyor..." : "Rolden Kaldır"}
                </Button>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Özel Yetkiler</CardTitle>
            <CardDescription>Şirkete özel, kullanıcıya doğrudan verilebilecek izinler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Select value={selectedModuleId} onValueChange={(v) => { setSelectedModuleId(v); setSelectedResourceId("all"); }}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Modül" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Modüller</SelectItem>
                  {(modules as any[]).map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.displayName || m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                <SelectTrigger className="w-[260px]"><SelectValue placeholder="Alt Modül" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Alt Modüller</SelectItem>
                  {(resources as any[]).map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.displayName || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {isAllPermissionsLoading || isUserDirectLoading ? (
                <p>Yükleniyor...</p>
              ) : (
                (() => {
                  const enabledResourceIds = new Set((resources as any[]).filter((r: any) => r.isEnabledForCompany !== false).map((r: any) => r.id));
                  return (allPermissions as any[])
                    .filter((p: any) => enabledResourceIds.size === 0 || enabledResourceIds.has(p.resourceId))
                    .map((p: any) => {
                      const baseChecked = grantedPermissionIds.has(p.id);
                      const checked = (p.id in pendingChanges) ? pendingChanges[p.id] : baseChecked;
                      const actionLabel = ({ view: "Görüntüle", edit: "Düzenle", manage: "Tüm Yetki", approve: "Onay" } as Record<string, string>)[p.action] || p.action;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-4 border rounded-md p-2">
                          <div>
                            <div className="text-sm font-medium">{p.displayName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.name} • {actionLabel}</div>
                          </div>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => handleTogglePending(p.id, !!v)}
                          />
                        </div>
                      );
                    });
                })()
              )}
              {(allPermissions as any[]).length === 0 && !isAllPermissionsLoading && (
                <div className="text-sm text-muted-foreground">Gösterilecek izin yok</div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSavePending} disabled={isSaving || Object.keys(pendingChanges).length === 0}>
                {isSaving ? "Kaydediliyor..." : `Kaydet (${Object.keys(pendingChanges).length})`}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yetkiler (Bu Şirket)</CardTitle>
            <CardDescription>Rol atamaları ve doğrudan verilen izinler</CardDescription>
          </CardHeader>
          <CardContent>
            {isPermsLoading ? (
              <p>Yükleniyor...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modül</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>İzin</TableHead>
                    <TableHead>Kaynak (Nereden)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(effectivePermissions as any[]).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.module}</TableCell>
                      <TableCell>{p.resource}</TableCell>
                      <TableCell>{p.displayName} ({p.action})</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(p.sources || []).join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


