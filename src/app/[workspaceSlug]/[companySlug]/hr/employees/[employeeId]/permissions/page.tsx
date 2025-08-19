"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

  const { data: companyRoles = [], isLoading: isCompanyRolesLoading } = useQuery({
    enabled: !!companyId,
    queryKey: ["roles", { scope: "company", companyId }],
    queryFn: async () => {
      const res = await fetch(`/api/system/roles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Şirket rolleri alınamadı");
      return res.json();
    }
  });

  const { data: assignedWorkspaceRoles = [], isLoading: isAssignedWsLoading } = useQuery({
    enabled: !!workspaceId && !!employeeId,
    queryKey: ["user-roles", { employeeId, scope: "workspace", workspaceId }],
    queryFn: async () => {
      const res = await fetch(`/api/users/${employeeId}/roles?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Kullanıcı rolleri alınamadı");
      return res.json();
    }
  });

  const { data: assignedCompanyRoles = [], isLoading: isAssignedCompanyLoading } = useQuery({
    enabled: !!workspaceId && !!companyId && !!employeeId,
    queryKey: ["user-roles", { employeeId, scope: "company", workspaceId, companyId }],
    queryFn: async () => {
      const res = await fetch(`/api/users/${employeeId}/roles?workspaceId=${workspaceId}&companyId=${companyId}`);
      if (!res.ok) throw new Error("Kullanıcı şirket rolleri alınamadı");
      return res.json();
    }
  });

  const assignedCompanyRoleIds: Set<string> = useMemo(() => new Set((assignedCompanyRoles as any[]).map((r) => r.roleId)), [assignedCompanyRoles]);

  const assignRole = useMutation({
    mutationFn: async ({ roleId, scope }: { roleId: string; scope: "workspace" | "company" }) => {
      const body: any = { roleId, workspaceId };
      if (scope === "company") body.companyId = companyId;
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
    onSuccess: (_data, variables) => {
      toast.success("Rol atandı");
      if (variables.scope === "company") {
        queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: "company", workspaceId, companyId }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: "workspace", workspaceId }] });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Rol atama başarısız");
    }
  });

  const unassignRole = useMutation({
    mutationFn: async ({ roleId, scope }: { roleId: string; scope: "workspace" | "company" }) => {
      const params = new URLSearchParams();
      params.set("roleId", roleId);
      if (workspaceId) params.set("workspaceId", workspaceId);
      if (scope === "company" && companyId) params.set("companyId", companyId);
      const res = await fetch(`/api/users/${employeeId}/roles?${params.toString()}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Rol kaldırma başarısız");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast.success("Rol kaldırıldı");
      if (variables.scope === "company") {
        queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: "company", workspaceId, companyId }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["user-roles", { employeeId, scope: "workspace", workspaceId }] });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Rol kaldırma başarısız");
    }
  });

  const isLoading = isCtxLoading || isCompanyRolesLoading || isAssignedCompanyLoading;

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
  const hasNoCompanyRoles = (assignedCompanyRoleIds.size === 0);
  const userRoleInCompany = useMemo(() => {
    const list = (companyRoles as any[]);
    return list.find((r) => String(r.code).toLowerCase() === "user");
  }, [companyRoles]);

  return (
    <PageWrapper
      title="Yetkiler"
      description="Kullanıcının uygulama ve şirket içi erişim izinleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Şirket</CardTitle>
            <CardDescription>Geçerli şirket bağlamı</CardDescription>
          </CardHeader>
          <CardContent>
            {isCtxLoading ? <p>Yükleniyor...</p> : (
              <div className="text-sm">
                <div><span className="font-medium">Şirket:</span> {workspaceContext?.currentCompany?.name || workspaceContext?.currentCompany?.fullName}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şirket Rolleri</CardTitle>
            <CardDescription>Seçili şirket içinde geçerli roller</CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin && !isLoading && hasNoCompanyRoles && (
              <div className="mb-4 p-3 rounded-md border bg-muted/30 flex items-center justify-between">
                <div className="text-sm">
                  Bu kullanıcının bu şirkette atanmış bir rolü yok. Temel kullanıcı rolünü atayabilirsiniz.
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const role = userRoleInCompany;
                    if (!role) {
                      toast.error("Şirkete ait 'user' kodlu rol bulunamadı. Lütfen Sistem > Roller bölümünden oluşturun.");
                      return;
                    }
                    assignRole.mutate({ roleId: role.id, scope: "company" });
                  }}
                >
                  Kullanıcı Rolü Ver
                </Button>
              </div>
            )}
            {isLoading ? (
              <p>Yükleniyor...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-right">Atanmış</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(companyRoles as any[]).map((role) => {
                    const checked = assignedCompanyRoleIds.has(role.id);
                    return (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{role.displayName || role.name}</span>
                            {role.isSystem ? <Badge variant="outline">Sistem</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell>{role.code}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={checked}
                            onCheckedChange={(next) => {
                              if (!workspaceId || !companyId) return;
                              if (next) {
                                assignRole.mutate({ roleId: role.id, scope: "company" });
                              } else {
                                unassignRole.mutate({ roleId: role.id, scope: "company" });
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
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


