"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Package,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Eye
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "../system-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Module {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isCore: boolean;
  sortOrder: number;
  settings?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface SubmoduleResource {
  id: string;
  moduleId: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  resourceType: string;
  isActive: boolean;
  sortOrder: number;
}

function ModuleIcon({ iconName, className }: { iconName?: string; className?: string }) {
  const mapping: Record<string, any> = {
    users: Package,
  };
  const IconComp = (iconName && mapping[iconName]) || Package;
  return <IconComp className={className} />;
}

export default function ModulesPage() {
  const params = useParams();
  // Modules are managed per company only
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  // category removed
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedCompanyIdsForAssign, setSelectedCompanyIdsForAssign] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    icon: "",
    color: "",
    isCore: false,
    sortOrder: 0,
    settings: {},
    metadata: {}
  });
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [isSubmoduleDialogOpen, setIsSubmoduleDialogOpen] = useState(false);
  const [parentModuleForSubmodule, setParentModuleForSubmodule] = useState<Module | null>(null);
  const [submoduleForm, setSubmoduleForm] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailModule, setDetailModule] = useState<Module | null>(null);
  const [isSubDetailOpen, setIsSubDetailOpen] = useState(false);
  const [detailSubmodule, setDetailSubmodule] = useState<SubmoduleResource | null>(null);
  const [subEdit, setSubEdit] = useState<Partial<SubmoduleResource> | null>(null);

  // Fetch workspace context to get IDs
  const { data: workspaceContext } = useQuery({
    queryKey: ["workspace-context", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const response = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!response.ok) throw new Error("Failed to fetch workspace context");
      return response.json();
    }
  });

  // Workspace companies for multi-assign UI
  const workspaceId = (workspaceContext as any)?.workspace?.id as string | undefined;
  const { data: workspaceCompanies = [] } = useQuery<any[]>({
    queryKey: ["workspace-companies", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies`, { credentials: "include" });
      if (!res.ok) return [] as any[];
      return res.json();
    },
    enabled: !!workspaceId,
  });

  // Fetch per-module company assignments for badges
  const { data: moduleAssignments } = useQuery<{ assignments: Record<string, Array<{ id: string; name: string; slug: string; logoUrl: string | null }>> } | undefined>({
    queryKey: ["module-assignments", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return undefined;
      const res = await fetch(`/api/system/modules/assignments?workspaceId=${workspaceId}`);
      if (!res.ok) return undefined;
      return res.json();
    },
    enabled: !!workspaceId,
  });

  // Helper: sync per-company assignments for a module based on selection
  const syncModuleAssignments = async (moduleId: string) => {
    try {
      if (!workspaceId) return;
      const currentAssigned = moduleAssignments?.assignments?.[moduleId]?.map((c) => c.id) || [];
      const nextSelected = selectedCompanyIdsForAssign || [];
      const toEnable = nextSelected.filter((id) => !currentAssigned.includes(id));
      const toDisable = currentAssigned.filter((id) => !nextSelected.includes(id));

      await Promise.all([
        ...toEnable.map((cid) =>
          fetch(`/api/system/modules/${moduleId}/toggle`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true, companyId: cid }),
          })
        ),
        ...toDisable.map((cid) =>
          fetch(`/api/system/modules/${moduleId}/toggle`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false, companyId: cid }),
          })
        ),
      ]);
      queryClient.invalidateQueries({ queryKey: ["module-assignments", workspaceId] });
    } catch (e) {
      console.error(e);
      toast.error("Şirket atamaları güncellenemedi");
    }
  };

  // Initialize selected company to current company for convenience
  useEffect(() => {
    if (!selectedCompanyId && workspaceContext?.currentCompany?.id) {
      setSelectedCompanyId(workspaceContext.currentCompany.id);
    }
  }, [workspaceContext, selectedCompanyId]);

  // Fetch modules with company enablement state
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules", selectedCompanyId],
    queryFn: async () => {
      const hasCompanySelected = !!(selectedCompanyId && selectedCompanyId !== 'global');
      const url = hasCompanySelected ? `/api/system/modules?companyId=${selectedCompanyId}` : "/api/system/modules";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
    enabled: true
  });

  // Fetch submodules (resources of type 'submodule')
  const { data: submodules = [] } = useQuery({
    queryKey: ["resources", "submodules", selectedCompanyId],
    queryFn: async () => {
      const url = selectedCompanyId
        ? `/api/system/resources?resourceType=submodule&companyId=${selectedCompanyId}`
        : "/api/system/resources?resourceType=submodule";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch submodules");
      return response.json();
    }
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: Partial<Module>) => {
      const response = await fetch("/api/system/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create module");
      }
      return response.json();
    },
    onSuccess: async (created: Module) => {
      // If user selected companies in the dialog, enable this module for them
      await syncModuleAssignments(created.id);
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Modül başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Module> & { id: string }) => {
      const response = await fetch(`/api/system/modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update module");
      }
      return response.json();
    },
    onSuccess: async () => {
      if (selectedModule?.id) {
        await syncModuleAssignments(selectedModule.id);
      }
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Modül başarıyla güncellendi");
      setIsEditDialogOpen(false);
      setSelectedModule(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system/modules/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete module");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Modül başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setSelectedModule(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle module status mutation
  const toggleModuleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const body: any = { isActive };
      if (selectedCompanyId && selectedCompanyId !== 'global') {
        body.companyId = selectedCompanyId;
      }
      const response = await fetch(`/api/system/modules/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle module status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Modül durumu güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle submodule status
  const toggleSubmoduleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/system/resources/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive, companyId: selectedCompanyId || undefined })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle submodule status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", "submodules"] });
      toast.success("Alt modül durumu güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete submodule mutation
  const deleteSubmoduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/system/resources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete submodule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", "submodules"] });
      toast.success("Alt modül silindi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Create submodule mutation
  const createSubmoduleMutation = useMutation({
    mutationFn: async (data: { moduleId: string; code: string; name: string; displayName: string; description?: string; sortOrder?: number; isActive?: boolean }) => {
      const response = await fetch("/api/system/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: data.moduleId,
          code: data.code,
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          resourceType: "submodule",
          path: null,
          parentResourceId: null,
          isActive: data.isActive ?? true,
          isPublic: false,
          requiresApproval: false,
          sortOrder: data.sortOrder ?? 0,
          metadata: {}
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create submodule");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", "submodules"] });
      toast.success("Alt modül oluşturuldu");
      setIsSubmoduleDialogOpen(false);
      setParentModuleForSubmodule(null);
      setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0, isActive: true });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const openSubmoduleDialog = (module: Module) => {
    setParentModuleForSubmodule(module);
    setIsSubmoduleDialogOpen(true);
  };

  const openDetailDialog = (module: Module) => {
    setDetailModule(module);
    setIsDetailDialogOpen(true);
  };

  

  const handleCreateSubmodule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentModuleForSubmodule) return;
    createSubmoduleMutation.mutate({
      moduleId: parentModuleForSubmodule.id,
      code: submoduleForm.code,
      name: submoduleForm.name,
      displayName: submoduleForm.displayName,
      description: submoduleForm.description,
      sortOrder: submoduleForm.sortOrder,
    });
  };

  const toggleExpand = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      displayName: "",
      description: "",
      icon: "",
      color: "",
      isCore: false,
      sortOrder: 0,
      settings: {},
      metadata: {}
    });
    setSelectedCompanyIdsForAssign([]);
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    // Prefill selected companies from assignments mapping
    const assigned = moduleAssignments?.assignments?.[module.id]?.map((c) => c.id) || [];
    setSelectedCompanyIdsForAssign(assigned);
    setFormData({
      code: module.code,
      name: module.name,
      displayName: module.displayName,
      description: module.description || "",
      icon: module.icon || "",
      color: module.color || "",
      isCore: module.isCore,
      sortOrder: module.sortOrder,
      settings: module.settings || {},
      metadata: module.metadata || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModule) {
      updateModuleMutation.mutate({ id: selectedModule.id, ...formData });
    } else {
      createModuleMutation.mutate(formData);
    }
  };

  

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
      label: "Modüller",
      isLast: true
    }
  ];

  const actions = (
    <>
      <Button
        variant="shopifySecondary"
        onClick={() => router.push(`/${params.workspaceSlug}/${params.companySlug}/system`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>
      <Button variant="shopifyPrimary" onClick={() => {
        setIsCreateDialogOpen(true);
      }}>
        <Plus className="w-4 h-4 mr-2" />
        Modül Ekle
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="Modül Yönetimi"
      description="Sistem modüllerini ve yapılandırmalarını yönetin"
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-6">

      

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Modüller</CardTitle>
          <CardDescription>
            Sistemdeki tüm modüllerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Görsel</TableHead>
                <TableHead>Alt Modüller</TableHead>
                <TableHead>Şirketler</TableHead>
                <TableHead>Sıralama Düzeni</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Modüller yükleniyoru...
                  </TableCell>
                </TableRow>
              ) : modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Modül bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((module: Module) => {
                  const moduleSubmodules: SubmoduleResource[] = (submodules as SubmoduleResource[]).filter((r) => r.moduleId === module.id);
                  const isExpanded = !!expandedModuleIds[module.id];
                  return (
                    <Fragment key={module.id}>
                      <TableRow>
                        <TableCell className="font-mono text-sm">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="inline-flex items-center h-6 px-1"
                            onClick={() => toggleExpand(module.id)}
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                            {module.code}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium"
                              onClick={() => openDetailDialog(module)}
                            >
                              {module.displayName}
                            </Button>
                            {module.description && (
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded" style={{ backgroundColor: module.color || '#e5e7eb' }} />
                            <div className="w-6 h-6 flex items-center justify-center rounded border">
                              <ModuleIcon iconName={module.icon} className="w-4 h-4" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{moduleSubmodules.length}</Badge>
                            <Button size="sm" variant="shopifySecondary" onClick={() => openSubmoduleDialog(module)}>
                              <Plus className="w-4 h-4 mr-1" /> Alt Modül
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(moduleAssignments?.assignments?.[module.id]?.length ?? 0) > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {(moduleAssignments!.assignments![module.id] || []).map((c) => (
                                <TooltipProvider key={c.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                                        <Avatar className="size-4">
                                          <AvatarImage src={c.logoUrl || undefined} alt={c.name} />
                                          <AvatarFallback className="text-[9px]">{c.name.slice(0,2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] truncate max-w-[140px]">{c.name}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{c.name}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Hiç şirket atanmamış</span>
                          )}
                        </TableCell>
                        <TableCell>{module.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="shopifySecondary"
                              size="icon"
                              onClick={() => handleEdit(module)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="shopifyOutline"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                              onClick={() => handleDelete(module)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${module.id}-submodules`}>
                          <TableCell colSpan={8}>
                            <div className="pl-6">
                              {moduleSubmodules.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Bu modül için alt modül yok.</p>
                              ) : (
                                <div className="space-y-2">
                                  {moduleSubmodules
                                    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
                                    .map((sub) => (
                                      <Card key={sub.id} className="border rounded-lg overflow-hidden">
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                <Badge variant={selectedCompanyId ? ((sub as any).isEnabledForCompany ? "secondary" : "outline") : (sub.isActive ? "secondary" : "outline")}>
                                                  {selectedCompanyId ? (((sub as any).isEnabledForCompany ? "Aktif" : "Pasif")) : (sub.isActive ? "Aktif" : "Pasif")}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">Sıra: {sub.sortOrder}</span>
                                              </div>
                                              <h4 className="font-semibold mt-1 truncate">{sub.displayName}</h4>
                                              <p className="text-xs text-muted-foreground font-mono truncate">{sub.code}</p>
                                              {sub.description && (
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sub.description}</p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <Button size="sm" variant="outline" onClick={() => {
                                                setDetailSubmodule(sub);
                                                setIsSubDetailOpen(true);
                                                setSubEdit(sub);
                                              }}>
                                                <Edit className="w-4 h-4 mr-1" /> Düzenle
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="shopifyOutline"
                                                className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                                                onClick={() => {
                                                  if (confirm(`'${sub.displayName}' alt modülünü silmek istiyor musunuz?`)) {
                                                    deleteSubmoduleMutation.mutate(sub.id);
                                                  }
                                                }}
                                              >
                                                <Trash2 className="w-4 h-4 mr-1" /> Sil
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
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
          setSelectedModule(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedModule ? "Modülü Düzenle" : "Yeni Modül Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {selectedModule ? "Modül bilgilerini güncelleyin" : "Sisteme yeni bir modül ekleyin"}
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
                  placeholder="e.g., hr_management"
                  disabled={!!selectedModule}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">İsim</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., HR Management"
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
                placeholder="e.g., Human Resources Management"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Modül açıklaması..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Simge</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., users"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Renk</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., #3B82F6"
                />
              </div>
            </div>
            {/* Workspace companies multi-select */}
            <div className="space-y-2">
              <Label>Şirketler</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-10 overflow-hidden">
                    {selectedCompanyIdsForAssign.length === 0 ? (
                      <span className="text-muted-foreground">Seçili şirket yok</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                        {selectedCompanyIdsForAssign.slice(0, 3).map((id) => {
                          const cmp = (workspaceCompanies as any[]).find((c) => c.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="text-[10px] font-medium shrink-0">
                              <span className="truncate max-w-[120px]">{cmp?.name || id}</span>
                            </Badge>
                          );
                        })}
                        {selectedCompanyIdsForAssign.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] font-medium shrink-0">+{selectedCompanyIdsForAssign.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-[360px] max-w-[calc(100vw-2rem)]">
                  <Command>
                    <CommandInput placeholder="Şirket ara..." />
                    <CommandList>
                      <CommandEmpty>Sonuç yok</CommandEmpty>
                      <CommandGroup>
                        {(workspaceCompanies as any[]).map((cmp) => {
                          const checked = selectedCompanyIdsForAssign.includes(cmp.id);
                          return (
                            <CommandItem
                              key={cmp.id}
                              value={cmp.name}
                              onSelect={() => setSelectedCompanyIdsForAssign((prev) => checked ? prev.filter((x) => x !== cmp.id) : [...prev, cmp.id])}
                            >
                              <span className="flex-1 truncate">{cmp.name}</span>
                              {checked && <CheckCircle className="h-4 w-4" />}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* Company assignment section removed */}
            <DialogFooter>
              <Button
                type="button"
                variant="shopifySecondary"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedModule(null);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" variant="shopifyPrimary" disabled={createModuleMutation.isPending || updateModuleMutation.isPending}>
                {selectedModule ? "Güncelle" : "Oluştur"} Modül
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Submodule Dialog */}
      <Dialog open={isSubmoduleDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsSubmoduleDialogOpen(false);
          setParentModuleForSubmodule(null);
          setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0, isActive: true });
        } else {
          setIsSubmoduleDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alt Modül Oluştur</DialogTitle>
            <DialogDescription>
              {parentModuleForSubmodule ? `${parentModuleForSubmodule.displayName} modülü altında yeni alt modül oluşturun` : "Bir modül seçin"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmodule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub_code">Kod</Label>
                <Input id="sub_code" value={submoduleForm.code} onChange={(e) => setSubmoduleForm({ ...submoduleForm, code: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_name">İsim</Label>
                <Input id="sub_name" value={submoduleForm.name} onChange={(e) => setSubmoduleForm({ ...submoduleForm, name: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_displayName">Görünen Ad</Label>
              <Input id="sub_displayName" value={submoduleForm.displayName} onChange={(e) => setSubmoduleForm({ ...submoduleForm, displayName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_description">Açıklama</Label>
              <Textarea id="sub_description" value={submoduleForm.description} onChange={(e) => setSubmoduleForm({ ...submoduleForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_sortOrder">Sıralama Düzeni</Label>
              <Input id="sub_sortOrder" type="number" value={submoduleForm.sortOrder} onChange={(e) => setSubmoduleForm({ ...submoduleForm, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Label>Aktif</Label>
              <Switch checked={submoduleForm.isActive} onCheckedChange={(checked) => setSubmoduleForm({ ...submoduleForm, isActive: checked })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsSubmoduleDialogOpen(false);
                setParentModuleForSubmodule(null);
                setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0, isActive: true });
              }}>İptal</Button>
              <Button type="submit" disabled={createSubmoduleMutation.isPending}>Alt Modül Oluştur</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDetailDialogOpen(false);
          setDetailModule(null);
        } else {
          setIsDetailDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-6xl w-[98vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>{detailModule?.displayName || "Modül Detayı"}</DialogTitle>
                <DialogDescription>
                  <span className="font-mono">{detailModule?.code}</span>
                  {detailModule?.isCore && (
                    <Badge variant="secondary" className="ml-2">Çekirdek</Badge>
                  )}
                </DialogDescription>
              </div>
              {detailModule && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="shopifySecondary"
                    size="sm"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleEdit(detailModule);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Düzenle
                  </Button>
                  <Button
                    variant="shopifyOutline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleDelete(detailModule);
                    }}
                    disabled={detailModule.isCore}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Sil
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Şirket Atamaları</CardTitle>
                <CardDescription>Bu modülün etkin olduğu şirketler</CardDescription>
              </CardHeader>
              <CardContent>
                {detailModule ? (
                  (() => {
                    const list = moduleAssignments?.assignments?.[detailModule.id] || [];
                    if (list.length === 0) return <p className="text-sm text-muted-foreground">Atama yok.</p>;
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {list.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 rounded-md border p-2">
                            <Avatar className="size-6">
                              <AvatarImage src={c.logoUrl || undefined} alt={c.name} />
                              <AvatarFallback>{c.name.slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <p>Yükleniyor...</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Genel Bilgiler</CardTitle>
                <CardDescription>Modül hakkında bilgiler</CardDescription>
              </CardHeader>
              <CardContent>
                {detailModule ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">İsim</p>
                      <p className="font-medium">{detailModule.displayName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kod</p>
                      <p className="font-mono">{detailModule.code}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Açıklama</p>
                      <p>{detailModule.description || "-"}</p>
                    </div>
                  </div>
                ) : (
                  <p>Yükleniyor...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alt Modüller</CardTitle>
                <CardDescription>Bu modüle bağlı alt modüller</CardDescription>
              </CardHeader>
              <CardContent>
                {detailModule ? (
                  (() => {
                    const detailsSubs = (submodules as SubmoduleResource[]).filter((r) => r.moduleId === detailModule.id);
                    if (detailsSubs.length === 0) {
                      return <p className="text-sm text-muted-foreground">Alt modül yok.</p>;
                    }
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Görünen Ad</TableHead>
                            <TableHead>Kod</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Sıralama</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailsSubs
                            .slice()
                            .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
                            .map((sub) => (
                              <TableRow key={sub.id}>
                                <TableCell className="font-medium">{sub.displayName}</TableCell>
                                <TableCell className="font-mono text-xs">{sub.code}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{sub.description || "-"}</TableCell>
                                <TableCell>
                                  {sub.isActive ? (
                                    <Badge variant="secondary">Aktif</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Pasif</span>
                                  )}
                                </TableCell>
                                <TableCell>{sub.sortOrder}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    );
                  })()
                ) : (
                  <p>Yükleniyor...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modülü Sil</DialogTitle>
            <DialogDescription>
              "{selectedModule?.displayName}" modülünü silmek istediğinizden emin misiniz?
              Bu eylem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="shopifySecondary"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedModule(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="shopifyDestructive"
              onClick={() => selectedModule && deleteModuleMutation.mutate(selectedModule.id)}
              disabled={deleteModuleMutation.isPending}
            >
              Modülü Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submodule Detail Dialog (View/Edit) */}
      <Dialog open={isSubDetailOpen} onOpenChange={(open) => {
        if (!open) {
          setIsSubDetailOpen(false);
          setDetailSubmodule(null);
          setSubEdit(null);
        } else {
          setIsSubDetailOpen(true);
        }
      }}>
        <DialogContent className="max-w-3xl w-[96vw]">
          <DialogHeader>
            <DialogTitle>{subEdit ? "Alt Modül Düzenle" : "Alt Modül Detayı"}</DialogTitle>
            <DialogDescription className="font-mono text-xs">{detailSubmodule?.code}</DialogDescription>
          </DialogHeader>
          {detailSubmodule && !subEdit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Görünen Ad</p>
                  <p className="font-medium">{detailSubmodule.displayName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sıra</p>
                  <p>{detailSubmodule.sortOrder}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Açıklama</p>
                  <p>{detailSubmodule.description || "-"}</p>
                </div>
              </div>
            </div>
          )}
          {detailSubmodule && subEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload = {
                  moduleId: detailSubmodule.moduleId,
                  name: subEdit.name || detailSubmodule.name,
                  displayName: subEdit.displayName || detailSubmodule.displayName,
                  description: subEdit.description ?? detailSubmodule.description,
                  resourceType: detailSubmodule.resourceType,
                  path: null,
                  parentResourceId: null,
                  isActive: typeof subEdit.isActive === 'boolean' ? subEdit.isActive : detailSubmodule.isActive,
                  isPublic: false,
                  requiresApproval: false,
                  sortOrder: typeof subEdit.sortOrder === 'number' ? subEdit.sortOrder : detailSubmodule.sortOrder,
                  metadata: detailSubmodule.metadata,
                } as any;
                fetch(`/api/system/resources/${detailSubmodule.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Alt modül güncellenemedi");
                    }
                    return res.json();
                  })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["resources", "submodules"] });
                    toast.success("Alt modül güncellendi");
                    setIsSubDetailOpen(false);
                    setDetailSubmodule(null);
                    setSubEdit(null);
                  })
                  .catch((e: any) => toast.error(e.message));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Görünen Ad</Label>
                  <Input
                    value={subEdit.displayName ?? detailSubmodule.displayName}
                    onChange={(e) => setSubEdit((prev) => ({ ...(prev || {}), displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sıralama</Label>
                  <Input
                    type="number"
                    value={(subEdit.sortOrder ?? detailSubmodule.sortOrder) as number}
                    onChange={(e) => setSubEdit((prev) => ({ ...(prev || {}), sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  rows={3}
                  value={subEdit.description ?? detailSubmodule.description ?? ""}
                  onChange={(e) => setSubEdit((prev) => ({ ...(prev || {}), description: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Aktif</Label>
                <Switch checked={(typeof subEdit.isActive === 'boolean' ? subEdit.isActive : detailSubmodule.isActive)} onCheckedChange={(checked) => setSubEdit((prev) => ({ ...(prev || {}), isActive: checked }))} />
              </div>
              <DialogFooter>
                <Button variant="shopifySecondary" type="button" onClick={() => { setIsSubDetailOpen(false); setDetailSubmodule(null); setSubEdit(null); }}>İptal</Button>
                <Button variant="shopifyPrimary" type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageWrapper>
  );
}