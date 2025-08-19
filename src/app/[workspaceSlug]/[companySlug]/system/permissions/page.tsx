"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Eye,
  Edit2,
  Check,
  ArrowLeft
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "../system-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface Module {
  id: string;
  code: string;
  name: string;
  displayName: string;
}

interface Resource {
  id: string;
  moduleId: string;
  code: string;
  name: string;
  displayName: string;
  resourceType: string;
  module?: Module;
}

interface Permission {
  id: string;
  resourceId: string;
  action: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  conditions?: any;
  createdAt: Date;
  updatedAt: Date;
  resource?: Resource;
}

interface Role {
  id: string;
  code: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  isActive: boolean;
}

const COMMON_ACTIONS = [
  { value: "view", label: "Görüntüle", icon: Eye, color: "text-blue-500" },
  { value: "edit", label: "Düzenle", icon: Edit2, color: "text-yellow-500" },
  { value: "manage", label: "Tüm Yetki", icon: Shield, color: "text-purple-500" },
  { value: "approve", label: "Onay", icon: Check, color: "text-emerald-500" }
];

const ACTION_LABEL_MAP: Record<string, string> = {
  view: "Görüntüle",
  edit: "Düzenle",
  manage: "Tüm Yetki",
  approve: "Onay"
};

const RESOURCE_TYPE_LABEL_TR: Record<string, string> = {
  page: "Sayfa",
  api: "API",
  feature: "Özellik",
  report: "Rapor",
  action: "Eylem",
  widget: "Widget",
  submodule: "Alt Modül"
};

export default function PermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [activeTab, setActiveTab] = useState("permissions");
  const [formData, setFormData] = useState({
    moduleId: "",
    submoduleId: "",
    name: "",
    displayName: "",
    description: "",
    conditions: {}
  });
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [actionDescriptions, setActionDescriptions] = useState<Record<string, string>>({});

  // Fetch modules for dropdown
  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await fetch("/api/system/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    }
  });

  // Lookup maps for quick access (must be after modules query is declared)
  const moduleById = useMemo(() => {
    const map: Record<string, Module> = {};
    (modules || []).forEach((m: Module) => { map[m.id] = m; });
    return map;
  }, [modules]);

  // Fetch resources for top-level filters
  const { data: resources = [] } = useQuery({
    queryKey: ["resources", selectedModule],
    queryFn: async () => {
      const url = selectedModule === "all" 
        ? "/api/system/resources?resourceType=submodule"
        : `/api/system/resources?moduleId=${selectedModule}&resourceType=submodule`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch resources");
      return response.json();
    },
    enabled: true
  });

  // Fetch submodules for the selected module in the form
  const { data: submodules = [] } = useQuery({
    queryKey: ["submodules", formData.moduleId],
    queryFn: async () => {
      if (!formData.moduleId) return [];
      const response = await fetch(`/api/system/resources?moduleId=${formData.moduleId}&resourceType=submodule`);
      if (!response.ok) throw new Error("Failed to fetch submodules");
      return response.json();
    },
    enabled: !!formData.moduleId
  });

  // Fetch permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await fetch("/api/system/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    }
  });

  // Fetch roles for assignment (scoped)
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const ctxRes = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!ctxRes.ok) throw new Error("Failed to fetch workspace context");
      const ctx = await ctxRes.json();
      const response = await fetch(`/api/system/roles?workspaceId=${ctx.workspace.id}&companyId=${ctx.currentCompany.id}`);
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json();
    }
  });

  // Fetch role permissions
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const ctxRes = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!ctxRes.ok) throw new Error("Failed to fetch workspace context");
      const ctx = await ctxRes.json();
      const response = await fetch(`/api/system/role-permissions?workspaceId=${ctx.workspace.id}&companyId=${ctx.currentCompany.id}`);
      if (!response.ok) throw new Error("Failed to fetch role permissions");
      return response.json();
    }
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: Partial<Permission>) => {
      const response = await fetch("/api/system/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create permission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("İzin başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Permission> & { id: string }) => {
      const response = await fetch(`/api/system/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("İzin başarıyla güncellendi");
      setIsEditDialogOpen(false);
      setSelectedPermission(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system/permissions/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete permission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("İzin başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setSelectedPermission(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle permission status mutation
  const togglePermissionStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/system/permissions/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle permission status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("İzin durumu güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      moduleId: "",
      submoduleId: "",
      name: "",
      displayName: "",
      description: "",
      conditions: {}
    });
    setSelectedActions([]);
    setActionDescriptions({});
  };

  // Keep edit mode fields in sync if action or selection changes (edit-only)
  useEffect(() => {
    if (!selectedPermission) return;
    if (!formData.moduleId) return;
    const module = moduleById[formData.moduleId];
    const selectedSubmodule = (submodules as Resource[]).find((s) => s.id === formData.submoduleId);
    const baseCode = selectedSubmodule?.code || module?.code || "";
    const baseDisplay = selectedSubmodule?.displayName || module?.displayName || "";
    if (!baseCode) return;

    // For edit we use the existing action on the permission
    const actionValue = selectedPermission?.action;
    if (!actionValue) return;
    const nextName = `${baseCode}.${actionValue}`;
    const actionLabel = ACTION_LABEL_MAP[actionValue] || actionValue;
    const nextDisplay = `${baseDisplay} - ${actionLabel}`;
    if (formData.name !== nextName || formData.displayName !== nextDisplay) {
      setFormData((prev) => ({ ...prev, name: nextName, displayName: nextDisplay }));
    }
  }, [selectedPermission, formData.moduleId, formData.submoduleId, moduleById, submodules]);

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      moduleId: permission.resource?.moduleId || "",
      submoduleId: permission.resourceId,
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description || "",
      conditions: permission.conditions || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteDialogOpen(true);
  };

  const handleAssignPermissions = () => {
    setIsAssignDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermission) {
      // Only updatable fields on edit
      updatePermissionMutation.mutate({
        id: selectedPermission.id,
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        conditions: formData.conditions,
      });
      return;
    }

    // Determine or create the target resourceId
    let targetResourceId = formData.submoduleId;
    const currentModule = moduleById[formData.moduleId];
    if (!currentModule) {
      toast.error("Lütfen modül seçin");
      return;
    }
    const hasSubmodules = (submodules as any[]).length > 0;
    if (hasSubmodules) {
      if (!targetResourceId) {
        toast.error("Lütfen alt modül seçin");
        return;
      }
    } else if (!targetResourceId) {
      // If module has no submodules: create or reuse a module-level submodule
      let moduleLevelSubmodule = (submodules as Resource[]).find((sm) => sm.code === currentModule.code);
      if (!moduleLevelSubmodule) {
        try {
          const res = await fetch("/api/system/resources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId: currentModule.id,
              code: currentModule.code,
              name: currentModule.name,
              displayName: currentModule.displayName,
              resourceType: "submodule",
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({} as any));
            throw new Error(err.error || "Modül düzeyi alt modül oluşturulamadı");
          }
          moduleLevelSubmodule = await res.json();
        } catch (error: any) {
          toast.error(error?.message || "Alt modül oluşturma hatası");
          return;
        }
      }
      targetResourceId = moduleLevelSubmodule!.id;
    }

    // Bulk create for selected actions
    if (!selectedActions || selectedActions.length === 0) {
      toast.error("En az bir eylem seçin");
      return;
    }

    const selectedSubmodule = (submodules as Resource[]).find((s) => s.id === formData.submoduleId);
    const baseCode = selectedSubmodule?.code || currentModule.code;
    const baseDisplay = selectedSubmodule?.displayName || currentModule.displayName;

    try {
      const results = await Promise.allSettled(
        selectedActions.map(async (action) => {
          const name = `${baseCode}.${action}`;
          const displayName = `${baseDisplay} - ${ACTION_LABEL_MAP[action] || action}`;
          const description = actionDescriptions[action] || undefined;
          const response = await fetch("/api/system/permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resourceId: targetResourceId,
              action,
              name,
              displayName,
              description,
              conditions: formData.conditions,
            })
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({} as any));
            throw new Error(err.error || `İzin oluşturulamadı: ${action}`);
          }
          return response.json();
        })
      );

      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      if (succeeded > 0) {
        toast.success(`${succeeded} izin oluşturuldu`);
      }
      if (failed > 0) {
        toast.error(`${failed} izin oluşturulamadı`);
      }
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || "Toplu oluşturma hatası");
    }
  };

  const filteredPermissions = permissions.filter((permission: Permission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === "all" || permission.resource?.moduleId === selectedModule;
    const matchesResource = selectedResource === "all" || permission.resourceId === selectedResource;
    return matchesSearch && matchesModule && matchesResource;
  });

  // Group permissions by resource for better visualization
  const groupedPermissions = filteredPermissions.reduce((acc: any, permission: Permission) => {
    const key = permission.resourceId;
    if (!acc[key]) {
      acc[key] = {
        resource: permission.resource,
        permissions: []
      };
    }
    acc[key].permissions.push(permission);
    return acc;
  }, {});

  // Group permissions by main module, then by submodule (resource)
  const permissionsByModule = filteredPermissions.reduce((acc: Record<string, {
    module: Module | undefined;
    submodules: Record<string, { resource: Resource | undefined; permissions: Permission[] }>;
  }>, permission: Permission) => {
    const moduleId = permission.resource?.module?.id as string | undefined;
    if (!moduleId) return acc;
    if (!acc[moduleId]) {
      acc[moduleId] = {
        module: permission.resource?.module as any,
        submodules: {}
      };
    }
    const resId = permission.resourceId;
    if (!acc[moduleId].submodules[resId]) {
      acc[moduleId].submodules[resId] = {
        resource: permission.resource,
        permissions: []
      };
    }
    acc[moduleId].submodules[resId].permissions.push(permission);
    return acc;
  }, {});

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
      label: "İzinler",
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
        İzin Ekle
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="İzin Yönetimi"
      description="Sistem izinlerini ve rol atamalarını yönetin"
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-6">

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions">İzinler</TabsTrigger>
          <TabsTrigger value="role-assignments">Rol Atamaları</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                                      placeholder="İzinleri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedModule} onValueChange={(value) => {
                  setSelectedModule(value);
                  setSelectedResource("all");
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tüm Ana Modüller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Ana Modüller</SelectItem>
                    {modules.map((module: Module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedResource} onValueChange={setSelectedResource}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tüm Alt Modüller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Alt Modüller</SelectItem>
                    {resources.map((resource: Resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Permissions grouped by Main Module -> Submodules */}
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                Loading permissions...
              </CardContent>
            </Card>
          ) : Object.keys(permissionsByModule).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                No permissions found
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(permissionsByModule)}>
              {Object.entries(permissionsByModule).map(([moduleId, modGroup]: [string, any]) => {
                const modInfo: Module | undefined = modGroup.module;
                const submods: Record<string, { resource?: Resource; permissions: Permission[] }> = modGroup.submodules || {};
                const totalPerms: number = Object.values(submods).reduce((sum: number, sm: any) => sum + sm.permissions.length, 0);
                return (
                  <AccordionItem key={moduleId} value={moduleId}>
                    <AccordionTrigger>
                      <div className="flex w-full items-start justify-between pr-2">
                        <div>
                          <div className="text-base font-medium">{modInfo?.displayName || "Ana Modül"}</div>
                          <div className="text-xs text-muted-foreground">Ana Modül altında alt modül izinleri</div>
                        </div>
                        <Badge variant="outline">{totalPerms} izin</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(submods)}>
                          {Object.entries(submods).map(([resourceId, group]: [string, any]) => (
                            <AccordionItem key={resourceId} value={resourceId}>
                              <AccordionTrigger>
                                <div className="flex w-full items-start justify-between pr-2">
                                  <div>
                                    <div className="font-medium">
                                      {group.resource?.displayName || "Bilinmeyen Alt Modül"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Tür: {group.resource?.resourceType ? (RESOURCE_TYPE_LABEL_TR[group.resource.resourceType] || group.resource.resourceType) : "Bilinmeyen"}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{group.permissions.length} izin</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Eylem</TableHead>
                                      <TableHead>İzin Adı</TableHead>
                                      <TableHead>Açıklama</TableHead>
                                      <TableHead>Durum</TableHead>
                                      <TableHead className="text-right">Eylemler</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.permissions.map((permission: Permission) => {
                                      const actionInfo = COMMON_ACTIONS.find(a => a.value === permission.action);
                                      return (
                                        <TableRow key={permission.id}>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              {actionInfo && (
                                                <actionInfo.icon className={`w-4 h-4 ${actionInfo.color}`} />
                                              )}
                                              <span className="text-sm">{actionInfo ? actionInfo.label : permission.action}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div>
                                              <p className="font-medium">{permission.displayName}</p>
                                              <p className="text-sm text-muted-foreground font-mono">
                                                {permission.name}
                                              </p>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {permission.description || "-"}
                                          </TableCell>
                                          <TableCell>
                                            <Switch
                                              checked={permission.isActive}
                                              onCheckedChange={(checked) => 
                                                togglePermissionStatusMutation.mutate({ 
                                                  id: permission.id, 
                                                  isActive: checked 
                                                })
                                              }
                                            />
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEdit(permission)}
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(permission)}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="role-assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rol İzin Atamaları</CardTitle>
              <CardDescription>
                Her role hangi izinlerin atandığını görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would show a matrix of roles and their assigned permissions */}
              <p className="text-center text-muted-foreground py-8">
                Rol izin atama matrisi burada uygulanacaktır
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedPermission(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPermission ? "İzni Düzenle" : "Yeni İzin Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {selectedPermission ? "İzin bilgilerini güncelleyin" : "Sisteme yeni bir izin ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moduleId">Ana Modül</Label>
                <Select 
                  value={formData.moduleId}
                  onValueChange={(value) => setFormData({ ...formData, moduleId: value, submoduleId: "" })}
                  required
                  disabled={!!selectedPermission}
                >
                  <SelectTrigger id="moduleId">
                    <SelectValue placeholder="Modül seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m: Module) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="submoduleId">Alt Modül</Label>
                <Select 
                  value={formData.submoduleId}
                  onValueChange={(value) => setFormData({ ...formData, submoduleId: value })}
                  disabled={!!selectedPermission || !formData.moduleId || (submodules as any[]).length === 0}
                >
                  <SelectTrigger id="submoduleId">
                    <SelectValue placeholder={(submodules as any[]).length > 0 ? "Alt modül seçin (opsiyonel)" : "Alt modül yok"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(submodules as Resource[]).map((sm: Resource) => (
                      <SelectItem key={sm.id} value={sm.id}>
                        {sm.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!selectedPermission && (
              <div className="space-y-3">
                <Label>Eylemler</Label>
                <div className="space-y-4">
                  {COMMON_ACTIONS.map((a) => {
                    const isChecked = selectedActions.includes(a.value);
                    return (
                      <div key={a.value} className="space-y-2 w-full">
                        <div className="flex items-center gap-2 w-full">
                          <Checkbox
                            id={`action-${a.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setSelectedActions((prev) => {
                                const set = new Set(prev);
                                if (checked) set.add(a.value); else set.delete(a.value);
                                return Array.from(set);
                              });
                            }}
                          />
                          <label htmlFor={`action-${a.value}`} className="flex items-center gap-2 cursor-pointer select-none">
                            <a.icon className={`w-4 h-4 ${a.color}`} />
                            <span>{a.label}</span>
                          </label>
                        </div>
                        {isChecked && (
                          <Textarea
                            rows={2}
                            className="w-full"
                            placeholder="Açıklama (opsiyonel)"
                            value={actionDescriptions[a.value] || ''}
                            onChange={(e) => setActionDescriptions((prev) => ({ ...prev, [a.value]: e.target.value }))}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedPermission ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">İzin Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., users.create"
                  required
                    disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Görünen Ad</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Create Users"
                  required
                    disabled
                />
              </div>
            </div>
            ) : (
              <div className="space-y-3">
                <Label>Oluşturulacak İzinler</Label>
                <div className="space-y-1">
                  {selectedActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Eylem seçin</p>
                  ) : (
                    selectedActions.map((a) => {
                      const mod = moduleById[formData.moduleId];
                      const sm = (submodules as Resource[]).find((s) => s.id === formData.submoduleId);
                      const baseCode = sm?.code || mod?.code || "";
                      const baseDisplay = sm?.displayName || mod?.displayName || "";
                      const name = baseCode ? `${baseCode}.${a}` : "";
                      const displayName = baseDisplay ? `${baseDisplay} - ${ACTION_LABEL_MAP[a] || a}` : "";
                      return (
                        <div key={a} className="grid grid-cols-4 gap-3 items-center">
                          <div className="col-span-2 font-mono text-xs">{name || '-'}</div>
                          <div className="col-span-2 text-sm">{displayName || '-'}</div>
                        </div>
                      );
                    })
                  )}
                </div>
            </div>
            )}
            {/* Global description removed; per-action descriptions are used */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedPermission(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}>
                {selectedPermission ? "Update" : "Create"} Permission
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İzni Sil</DialogTitle>
            <DialogDescription>
              "{selectedPermission?.displayName}" iznini silmek istediğinizden emin misiniz?
              Bu işlem onu tüm rollerden kaldıracaktır. Bu eylem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedPermission(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPermission && deletePermissionMutation.mutate(selectedPermission.id)}
              disabled={deletePermissionMutation.isPending}
            >
              İzni Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Rollere İzin Ata</DialogTitle>
            <DialogDescription>
              Her rol için izinleri seçin
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            {/* Minimal scoped assignment placeholder */}
            <p className="text-center text-muted-foreground py-8">
              Şirket bazlı atamalar etkin. Rol-izin atamaları, mevcut şirket kapsamı ile kaydedilecektir.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Kapat
            </Button>
            <Button>
              Atamaları Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageWrapper>
  );
}