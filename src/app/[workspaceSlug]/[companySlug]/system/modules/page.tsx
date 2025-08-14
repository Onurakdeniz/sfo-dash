"use client";

import { useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { } from "@/components/ui/select";
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
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  // category removed
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
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
  });

  // Fetch modules
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await fetch("/api/system/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    }
  });

  // Fetch submodules (resources of type 'submodule')
  const { data: submodules = [] } = useQuery({
    queryKey: ["resources", "submodules"],
    queryFn: async () => {
      const response = await fetch("/api/system/resources?resourceType=submodule");
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
    onSuccess: () => {
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
    onSuccess: () => {
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
      const response = await fetch(`/api/system/modules/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
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
        body: JSON.stringify({ isActive })
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

  // Create submodule mutation
  const createSubmoduleMutation = useMutation({
    mutationFn: async (data: { moduleId: string; code: string; name: string; displayName: string; description?: string; sortOrder?: number }) => {
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
      setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0 });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const openSubmoduleDialog = (module: Module) => {
    setParentModuleForSubmodule(module);
    setIsSubmoduleDialogOpen(true);
  };

  // Quick action: Seed HR module (development only)
  const seedHr = async () => {
    try {
      const res = await fetch('/api/debug/seed/hr', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Seeding failed');
      }
      await queryClient.invalidateQueries({ queryKey: ['modules'] });
      await queryClient.invalidateQueries({ queryKey: ['resources', 'submodules'] });
      toast.success('HR modülü başarıyla oluşturuldu');
    } catch (e: any) {
      toast.error(e.message || 'HR modülü oluşturulamadı');
    }
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
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
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

  const filteredModules = modules.filter((module: Module) => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
        variant="outline"
        onClick={() => router.push(`/${params.workspaceSlug}/${params.companySlug}/system`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>
      <Button variant="secondary" onClick={seedHr}>
        <Plus className="w-4 h-4 mr-2" /> HR Modülünü Ekle (Dev)
      </Button>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
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
    >
      <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Modülleri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                <TableHead>Durum</TableHead>
                <TableHead>Çekirdek</TableHead>
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
              ) : filteredModules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Modül bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredModules.map((module: Module) => {
                  const moduleSubmodules: SubmoduleResource[] = (submodules as SubmoduleResource[]).filter((r) => r.moduleId === module.id);
                  const isExpanded = !!expandedModuleIds[module.id];
                  return (
                    <Fragment key={module.id}>
                      <TableRow>
                        <TableCell className="font-mono text-sm">
                          <button className="inline-flex items-center" onClick={() => toggleExpand(module.id)}>
                            {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                            {module.code}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{module.displayName}</p>
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
                            <Button size="sm" variant="outline" onClick={() => openSubmoduleDialog(module)}>
                              <Plus className="w-4 h-4 mr-1" /> Alt Modül
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={module.isActive}
                            onCheckedChange={(checked) => 
                              toggleModuleStatusMutation.mutate({ id: module.id, isActive: checked })
                            }
                            disabled={module.isCore}
                          />
                        </TableCell>
                        <TableCell>
                          {module.isCore ? (
                            <Badge variant="secondary">Çekirdek</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{module.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(module)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(module)}
                              disabled={module.isCore}
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
                                      <div key={sub.id} className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                          <p className="font-medium">{sub.displayName}</p>
                                          <p className="text-xs text-muted-foreground font-mono">{sub.code}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Switch
                                            checked={sub.isActive}
                                            onCheckedChange={(checked) => toggleSubmoduleStatusMutation.mutate({ id: sub.id, isActive: checked })}
                                          />
                                        </div>
                                      </div>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="isCore"
                checked={formData.isCore}
                onCheckedChange={(checked) => setFormData({ ...formData, isCore: checked })}
                disabled={!!selectedModule}
              />
              <Label htmlFor="isCore">Çekirdek Modül</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedModule(null);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={createModuleMutation.isPending || updateModuleMutation.isPending}>
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
          setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0 });
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsSubmoduleDialogOpen(false);
                setParentModuleForSubmodule(null);
                setSubmoduleForm({ code: "", name: "", displayName: "", description: "", sortOrder: 0 });
              }}>İptal</Button>
              <Button type="submit" disabled={createSubmoduleMutation.isPending}>Alt Modül Oluştur</Button>
            </DialogFooter>
          </form>
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
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedModule(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedModule && deleteModuleMutation.mutate(selectedModule.id)}
              disabled={deleteModuleMutation.isPending}
            >
              Modülü Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageWrapper>
  );
}