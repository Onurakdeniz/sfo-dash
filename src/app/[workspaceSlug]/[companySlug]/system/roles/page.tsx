"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus,
  Users,
  Edit,
  Trash2,
  Building2,
  Globe,
  Shield,
  Settings,
  ArrowLeft
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "../system-tabs";
import PermissionsAssignment from "./permissions-assignment";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Role {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  workspaceId?: string;
  companyId?: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const getRoleScopes = (workspaceContext: any) => [
  { value: "system", label: "Sistem Genel", icon: Shield, description: "Tüm çalışma alanlarında geçerli" },
  { 
    value: "workspace", 
    label: "Tüm Workspace", 
    icon: Globe, 
    description: workspaceContext ? `${workspaceContext.workspace.name} workspace'inde geçerli` : "Workspace genelinde geçerli"
  },
  { 
    value: "company", 
    label: "Tek Şirket", 
    icon: Building2, 
    description: workspaceContext ? `${workspaceContext.currentCompany.name} şirketinde geçerli` : "Seçilen şirket içinde geçerli"
  }
];

const ACTION_LABEL_MAP: Record<string, string> = {
  view: "Görüntüle",
  edit: "Düzenle",
  manage: "Tüm Yetki",
  approve: "Onay"
};

type Module = { id: string; displayName: string; isEnabledForCompany?: boolean };
type Resource = { id: string; displayName: string; moduleId: string };
type Permission = { id: string; action: string; name: string; displayName: string; resourceId: string };

export default function RolesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [listFilter, setListFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    scope: "workspace",
    isSystem: false,
    sortOrder: 0,
    metadata: {}
  });
  const [showPermissionStep, setShowPermissionStep] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  // Data for permission selection step
  const { data: modulesForCreate = [] } = useQuery({
    queryKey: ["modules", formData.scope, selectedCompanyId],
    queryFn: async () => {
      const shouldFilterByCompany = formData.scope === "company" && selectedCompanyId && selectedCompanyId !== "global";
      const url = shouldFilterByCompany
        ? `/api/system/modules?companyId=${selectedCompanyId}`
        : "/api/system/modules";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Modüller alınamadı");
      return res.json();
    }
  });
  const [permModuleId, setPermModuleId] = useState<string>("all");
  const [permResourceId, setPermResourceId] = useState<string>("all");
  const { data: permResources = [] } = useQuery({
    queryKey: ["resources", permModuleId],
    queryFn: async () => {
      const url = permModuleId === "all" ? "/api/system/resources" : `/api/system/resources?moduleId=${permModuleId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Alt modüller alınamadı");
      return res.json();
    }
  });
  const { data: permPermissions = [] } = useQuery({
    queryKey: ["permissions", permResourceId],
    queryFn: async () => {
      const url = permResourceId === "all" ? "/api/system/permissions" : `/api/system/permissions?resourceId=${permResourceId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("İzinler alınamadı");
      return res.json();
    }
  });

  const modulesAvailableForPermissions: Module[] = useMemo(() => {
    if (!Array.isArray(modulesForCreate)) return [] as Module[];
    if (formData.scope === "company") {
      return (modulesForCreate as Module[]).filter((m) => m.isEnabledForCompany !== false);
    }
    return modulesForCreate as Module[];
  }, [modulesForCreate, formData.scope]);

  const resourcesAvailableForPermissions: Resource[] = useMemo(() => {
    if (!Array.isArray(permResources)) return [] as Resource[];
    if (formData.scope === "company" && permModuleId === "all") {
      const allowedModuleIds = new Set((modulesAvailableForPermissions as Module[]).map((m) => m.id));
      return (permResources as Resource[]).filter((r) => allowedModuleIds.has(r.moduleId));
    }
    return permResources as Resource[];
  }, [permResources, formData.scope, permModuleId, modulesAvailableForPermissions]);

  const permissionsAvailableForCompany: Permission[] = useMemo(() => {
    if (!Array.isArray(permPermissions)) return [] as Permission[];
    if (formData.scope === "company" && permResourceId === "all") {
      const allowedResourceIds = new Set((resourcesAvailableForPermissions as Resource[]).map((r) => r.id));
      return (permPermissions as Permission[]).filter((p) => allowedResourceIds.has(p.resourceId));
    }
    return permPermissions as Permission[];
  }, [permPermissions, formData.scope, permResourceId, resourcesAvailableForPermissions]);

  // Fetch workspace context to get actual IDs
  const { data: workspaceContext } = useQuery({
    queryKey: ["workspace-context", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const response = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!response.ok) throw new Error("Failed to fetch workspace context");
      return response.json();
    }
  });

  // Fetch system-level roles (global)
  const { data: systemRoles = [] } = useQuery({
    queryKey: ["roles", "system"],
    queryFn: async () => {
      const response = await fetch(`/api/system/roles?isSystem=true`);
      if (!response.ok) throw new Error("Failed to fetch system roles");
      return response.json();
    }
  });

  // Fetch workspace-level roles
  const { data: workspaceRoles = [] } = useQuery({
    queryKey: ["roles", workspaceContext?.workspace?.id, "workspace"],
    queryFn: async () => {
      if (!workspaceContext?.workspace?.id) return [];
      const response = await fetch(`/api/system/roles?workspaceId=${workspaceContext.workspace.id}`);
      if (!response.ok) throw new Error("Failed to fetch workspace roles");
      return response.json();
    },
    enabled: !!workspaceContext?.workspace?.id
  });

  // Fetch roles for all companies in the current workspace
  const { data: allCompanyRoles = [] } = useQuery({
    queryKey: ["roles", workspaceContext?.workspace?.id, "companies"],
    queryFn: async () => {
      if (!workspaceContext?.companies) return [];
      const companies: any[] = workspaceContext.companies;
      if (companies.length === 0) return [];
      const results = await Promise.all(
        companies.map(async (c) => {
          const res = await fetch(`/api/system/roles?companyId=${c.id}`);
          if (!res.ok) throw new Error("Failed to fetch company roles");
          return res.json();
        })
      );
      return results.flat();
    },
    enabled: Array.isArray(workspaceContext?.companies)
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!workspaceContext) {
        throw new Error("Workspace context not loaded");
      }

      // Validate company selection for company-scoped role
      if (data.scope === "company" && !(selectedCompanyId && selectedCompanyId !== "global")) {
        throw new Error("Lütfen şirket seçin");
      }

      const roleData = {
        ...data,
        workspaceId: data.scope === "workspace" ? workspaceContext.workspace.id : undefined,
        companyId: data.scope === "company" ? selectedCompanyId || workspaceContext.currentCompany?.id : undefined
      };
      delete roleData.scope;
      const response = await fetch("/api/system/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create role");
      }
      const created = await response.json();

      // If there are selected permissions, assign them
      if (selectedPermissionIds.size > 0) {
        const assignments = await Promise.allSettled(
          Array.from(selectedPermissionIds).map(async (permissionId) => {
            const body: any = {
              roleId: created.id,
              permissionId,
              workspaceId: workspaceContext.workspace.id,
              companyId: formData.scope === "company" ? (selectedCompanyId || workspaceContext.currentCompany?.id) : undefined,
              isGranted: true,
            };
            const res = await fetch("/api/system/role-permissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({} as any));
              throw new Error(err.error || "İzin ataması başarısız");
            }
            return res.json();
          })
        );
        const failed = assignments.filter((a) => a.status === "rejected").length;
        if (failed > 0) {
          toast.error(`${failed} izin ataması başarısız oldu`);
        }
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      setShowPermissionStep(false);
      setSelectedPermissionIds(new Set());
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/system/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla güncellendi");
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system/roles/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle role status mutation
  const toggleRoleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/system/roles/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle role status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol durumu güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      displayName: "",
      description: "",
      scope: "workspace",
      isSystem: false,
      sortOrder: 0,
      metadata: {}
    });
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    const scope = role.companyId ? "company" : role.workspaceId ? "workspace" : "system";
    setFormData({
      code: role.code,
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      scope,
      isSystem: role.isSystem,
      sortOrder: role.sortOrder,
      metadata: role.metadata || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      const { scope, ...updateData } = formData;
      updateRoleMutation.mutate({ id: selectedRole.id, ...updateData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const getRoleScope = (role: Role) => {
    if (role.companyId) return "company";
    if (role.workspaceId) return "workspace";
    return "system";
  };

  const getAssignmentName = (role: Role) => {
    if (role.companyId) {
      const comp = (workspaceContext?.companies || []).find((c: any) => c.id === role.companyId);
      return comp?.name || comp?.fullName || role.companyId;
    }
    if (role.workspaceId) {
      return workspaceContext?.workspace?.name || "Workspace";
    }
    return "Sistem";
  };

  const allRoles = useMemo(() => {
    const combined = [...(systemRoles as any[]), ...(workspaceRoles as any[]), ...(allCompanyRoles as any[])];
    const map = new Map<string, any>();
    combined.forEach((r: any) => { if (r && r.id) map.set(r.id, r); });
    const arr = Array.from(map.values());
    return arr.sort((a: any, b: any) => (a.sortOrder - b.sortOrder) || String(a.name).localeCompare(String(b.name)));
  }, [systemRoles, workspaceRoles, allCompanyRoles]);

  const filteredRoles = useMemo(() => {
    if (!Array.isArray(allRoles)) return [] as Role[];
    if (listFilter === "all") return allRoles as Role[];
    if (listFilter === "system") return (allRoles as Role[]).filter((r: any) => r.isSystem && !r.workspaceId && !r.companyId);
    if (listFilter === "workspace") return (allRoles as Role[]).filter((r: any) => !!r.workspaceId);
    if (listFilter.startsWith("company:")) {
      const cid = listFilter.slice("company:".length);
      return (allRoles as Role[]).filter((r: any) => r.companyId === cid);
    }
    return allRoles as Role[];
  }, [allRoles, listFilter]);

  const breadcrumbs = [
    {
      label: "Dashboard",
      href: `/${params.workspaceSlug}/${params.companySlug}`,
      isLast: false
    },
    {
      label: "Sistem",
      href: `/${params.workspaceSlug}/${params.companySlug}/system`,
      isLast: false
    },
    {
      label: "Roller",
      isLast: true
    }
  ];

  const actions = (
    <>
      <Button
        variant="outline"
        onClick={() => router.push(`/${params.workspaceSlug}/${params.companySlug}/system`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Rol Ekle
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="Rol Yönetimi"
      description="Sistem rollerini ve izinlerini yönetin"
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-6">

      

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
          <CardDescription>
            Sistemdeki tüm rollerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end mb-3 gap-2">
            <Label>Kaynağa göre filtrele</Label>
            <Select value={listFilter} onValueChange={setListFilter}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Kaynak seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hepsi</SelectItem>
                <SelectItem value="workspace">Workspace - {workspaceContext?.workspace?.name ?? "Workspace"}</SelectItem>
                {(workspaceContext?.companies || []).map((c: any) => (
                  <SelectItem key={c.id} value={`company:${c.id}`}>Şirket - {c.name || c.fullName}</SelectItem>
                ))}
                <SelectItem value="system">Sistem Rolleri</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Kapsam</TableHead>
                <TableHead>Atandığı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Sıralama Düzeni</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!(workspaceContext?.workspace?.id) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Bağlam yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Rol bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role: Role) => {
                  const scope = getRoleScope(role);
                  const scopeInfo = getRoleScopes(workspaceContext).find(s => s.value === scope);
                  
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-mono text-sm">{role.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.displayName}</p>
                          {role.description && (
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {scopeInfo && <scopeInfo.icon className="w-4 h-4" />}
                          <span>{scopeInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAssignmentName(role)}
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge>Sistem</Badge>
                        ) : (
                          <Badge variant="secondary">Özel</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={role.isActive}
                          onCheckedChange={(checked) => 
                            toggleRoleStatusMutation.mutate({ id: role.id, isActive: checked })
                          }
                          disabled={role.isSystem}
                        />
                      </TableCell>
                      <TableCell>{role.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleManagePermissions(role)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(role)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(role)}
                            disabled={role.isSystem}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedRole(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Rolü Düzenle" : "Yeni Rol Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole ? "Rol bilgilerini güncelleyin" : "Sisteme yeni bir rol ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kod</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., admin"
                  disabled={!!selectedRole}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Rol Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Administrator"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Görünen Ad</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., System Administrator"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Rol açıklaması (opsiyonel)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Kapsam</Label>
                <Select 
                  value={formData.scope} 
                  onValueChange={(value) => setFormData({ ...formData, scope: value })}
                  disabled={!!selectedRole}
                >
                  <SelectTrigger id="scope">
                    <SelectValue placeholder="Kapsam seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRoleScopes(workspaceContext).map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        <div className="flex items-center gap-2">
                          <scope.icon className="w-4 h-4" />
                          <div>
                            <p>{scope.label}</p>
                            <p className="text-xs text-muted-foreground">{scope.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sıralama Düzeni</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            {formData.scope === "company" && (
              <div className="space-y-2">
                <Label htmlFor="roleCompany">Şirket Seç</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} disabled={!!selectedRole}>
                  <SelectTrigger id="roleCompany">
                    <SelectValue placeholder="Şirket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspaceContext?.companies || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSystem"
                checked={formData.isSystem}
                onCheckedChange={(checked) => setFormData({ ...formData, isSystem: !!checked })}
                disabled={!!selectedRole}
              />
              <Label htmlFor="isSystem">Sistem Rolü (Silinemez)</Label>
            </div>
            {/* Permission selection step for new roles */}
            {!selectedRole && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>İzinler (opsiyonel)</Label>
                    <p className="text-xs text-muted-foreground">Rol oluşturulurken izinleri seçebilirsiniz</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowPermissionStep((v) => !v)}>
                    {showPermissionStep ? "İzin Seçimini Gizle" : "İzin Seç"}
                  </Button>
                </div>
                {showPermissionStep && (
                  <div className="space-y-3 border rounded-md p-3">
                    <div className="flex gap-3">
                      <Select value={permModuleId} onValueChange={(v) => { setPermModuleId(v); setPermResourceId("all"); }}>
                        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Modül" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Modüller</SelectItem>
                          {modulesAvailableForPermissions.map((m: Module) => (
                            <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={permResourceId} onValueChange={setPermResourceId}>
                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Alt Modül" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Alt Modüller</SelectItem>
                          {resourcesAvailableForPermissions.map((r: Resource) => (
                            <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="max-h-64 overflow-auto space-y-2">
                      {permissionsAvailableForCompany.map((p: Permission) => {
                        const key = p.id;
                        const checked = selectedPermissionIds.has(key);
                        const actionLabel = ACTION_LABEL_MAP[p.action] || p.action;
                        return (
                          <div key={key} className="flex items-center justify-between gap-4 border rounded p-2">
                            <div>
                              <div className="text-sm font-medium">{p.displayName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{p.name} • {actionLabel}</div>
                            </div>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                setSelectedPermissionIds((prev) => {
                                  const next = new Set(prev);
                                  if (v) next.add(key); else next.delete(key);
                                  return next;
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                      {permissionsAvailableForCompany.length === 0 && (
                        <div className="text-sm text-muted-foreground">Gösterilecek izin yok</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedRole(null);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {selectedRole ? "Güncelle" : "Oluştur"} Rol
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolü Sil</DialogTitle>
            <DialogDescription>
              "{selectedRole?.displayName}" rolünü silmek istediğinizden emin misiniz?
              Bu işlem bu role atanan tüm izinleri kaldıracaktır. Bu eylem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedRole(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRole && deleteRoleMutation.mutate(selectedRole.id)}
              disabled={deleteRoleMutation.isPending}
            >
              Rolü Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      {selectedRole && (
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>İzinleri Yönet - {selectedRole.displayName}</DialogTitle>
              <DialogDescription>
                Bu rol için izinleri yapılandırın
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto space-y-6 max-h-[65vh] pr-1">
              <PermissionsAssignment 
                role={selectedRole} 
                workspaceContext={workspaceContext}
                onSave={() => {
                  setIsPermissionsDialogOpen(false);
                  setSelectedRole(null);
                }}
                onCancel={() => {}}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if ((window as any).permissionsAssignmentCancel) {
                    (window as any).permissionsAssignmentCancel();
                  }
                  setIsPermissionsDialogOpen(false);
                  setSelectedRole(null);
                }}
              >
                İptal
              </Button>
              <Button
                onClick={() => {
                  if ((window as any).permissionsAssignmentSave) {
                    (window as any).permissionsAssignmentSave();
                  }
                }}
                disabled={(window as any).permissionsAssignmentState?.isPending}
              >
                {(window as any).permissionsAssignmentState?.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </PageWrapper>
  );
}