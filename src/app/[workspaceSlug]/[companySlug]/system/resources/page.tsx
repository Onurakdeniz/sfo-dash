"use client";

import { useEffect, useState } from "react";
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
  Shield,
  Edit,
  Trash2,
  Search,
  Globe,
  Lock,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "../system-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  description?: string;
  resourceType: string;
  path?: string;
  parentResourceId?: string;
  isActive: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  sortOrder: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  module?: Module;
  parentResource?: Resource;
}

const RESOURCE_TYPES = [
  { value: "page", label: "Sayfa/Rota" },
  { value: "api", label: "API Uç Noktası" },
  { value: "feature", label: "Özellik/Bileşen" },
  { value: "action", label: "Eylem" },
  { value: "report", label: "Rapor" },
  { value: "widget", label: "Widget" },
  { value: "submodule", label: "Alt Modül" }
];

export default function ResourcesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    moduleId: "",
    code: "",
    name: "",
    displayName: "",
    description: "",
    resourceType: "feature",
    path: "",
    parentResourceId: "",
    isActive: true,
    isPublic: false,
    requiresApproval: false,
    sortOrder: 0,
    metadata: {}
  });

  // Fetch workspace context to list companies for selection
  const { data: workspaceContext } = useQuery({
    queryKey: ["workspace-context", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const response = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!response.ok) throw new Error("Failed to fetch workspace context");
      return response.json();
    }
  });

  useEffect(() => {
    if (!selectedCompanyId && workspaceContext?.currentCompany?.id) {
      setSelectedCompanyId(workspaceContext.currentCompany.id);
    }
  }, [workspaceContext, selectedCompanyId]);

  // Fetch modules for dropdown
  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await fetch("/api/system/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    }
  });

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources", selectedCompanyId],
    queryFn: async () => {
      const hasCompanySelected = !!(selectedCompanyId && selectedCompanyId !== 'global');
      const url = hasCompanySelected ? `/api/system/resources?companyId=${selectedCompanyId}` : "/api/system/resources";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch resources");
      return response.json();
    }
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: Partial<Resource>) => {
      const response = await fetch("/api/system/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Kaynak başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Resource> & { id: string }) => {
      const response = await fetch(`/api/system/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Kaynak başarıyla güncellendi");
      setIsEditDialogOpen(false);
      setSelectedResource(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system/resources/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Kaynak başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setSelectedResource(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle resource status mutation
  const toggleResourceStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/system/resources/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive, companyId: selectedCompanyId && selectedCompanyId !== 'global' ? selectedCompanyId : undefined })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle resource status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Kaynak durumu güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      moduleId: "",
      code: "",
      name: "",
      displayName: "",
      description: "",
      resourceType: "feature",
      path: "",
      parentResourceId: "",
      isActive: true,
      isPublic: false,
      requiresApproval: false,
      sortOrder: 0,
      metadata: {}
    });
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setFormData({
      moduleId: resource.moduleId,
      code: resource.code,
      name: resource.name,
      displayName: resource.displayName,
      description: resource.description || "",
      resourceType: resource.resourceType,
      path: resource.path || "",
      parentResourceId: resource.parentResourceId || "none",
      isActive: resource.isActive,
      isPublic: resource.isPublic,
      requiresApproval: resource.requiresApproval,
      sortOrder: resource.sortOrder,
      metadata: resource.metadata || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parentResourceId: formData.parentResourceId === "none" ? null : formData.parentResourceId
    };
    if (selectedResource) {
      updateResourceMutation.mutate({ id: selectedResource.id, ...submitData });
    } else {
      createResourceMutation.mutate(submitData);
    }
  };

  const filteredResources = resources.filter((resource: Resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === "all" || resource.moduleId === selectedModule;
    const matchesType = selectedType === "all" || resource.resourceType === selectedType;
    return matchesSearch && matchesModule && matchesType;
  });

  // Get available parent resources for the selected module
  const availableParentResources = resources.filter((r: Resource) => 
    r.moduleId === formData.moduleId && r.id !== selectedResource?.id
  );

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
      label: "Kaynaklar",
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
      <div className="w-[260px]">
        <Label htmlFor="companySelect">Şirket</Label>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger id="companySelect">
            <SelectValue placeholder="Workspace (Global)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Workspace (Global)</SelectItem>
            {(workspaceContext?.companies || []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name || c.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="shopifySecondary"
        onClick={async () => {
          try {
            const res = await fetch('/api/debug/seed/hr', { method: 'POST' });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || 'Seeding failed');
            }
            await queryClient.invalidateQueries({ queryKey: ['modules'] });
            await queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('HR kaynakları eklendi (Dev)');
          } catch (e: any) {
            toast.error(e.message || 'Seeding başarısız');
          }
        }}
      >
        <Plus className="w-4 h-4 mr-2" /> HR Kaynaklarını Ekle (Dev)
      </Button>
      <Button variant="shopifyPrimary" onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Kaynak Ekle
      </Button>
    </>
  );

  return (
    <PageWrapper
      title="Kaynak Yönetimi"
      description="Sistem kaynaklarını ve izinlerini yönetin"
      breadcrumbs={breadcrumbs}
      actions={actions}
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Kaynakları ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Modüller</SelectItem>
                {modules.map((module: Module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kaynaklar</CardTitle>
          <CardDescription>
            Sistemdeki tüm kaynakların listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Modül</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Şirket Etkin</TableHead>
                <TableHead>Erişim</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Onay</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Kaynaklar yükleniyoru...
                  </TableCell>
                </TableRow>
              ) : filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Kaynak bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource: any) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-mono text-sm">{resource.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{resource.displayName}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {resource.module?.displayName || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {RESOURCE_TYPES.find(t => t.value === resource.resourceType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {selectedCompanyId ? (
                        <Badge variant={resource.isEnabledForCompany ? "secondary" : "outline"}>
                          {resource.isEnabledForCompany ? "Aktif" : "Pasif"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.isPublic ? (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Herkese Açık</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Lock className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">Özel</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={selectedCompanyId ? !!resource.isEnabledForCompany : resource.isActive}
                        onCheckedChange={(checked) => 
                          toggleResourceStatusMutation.mutate({ id: resource.id, isActive: checked })
                        }
                        disabled={!!selectedCompanyId && resource.resourceType !== 'submodule'}
                      />
                    </TableCell>
                    <TableCell>
                      {resource.requiresApproval ? (
                        <Badge variant="secondary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Gerekli
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="shopifySecondary"
                          size="icon"
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="shopifyOutline"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDelete(resource)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
          setSelectedResource(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedResource ? "Kaynağı Düzenle" : "Yeni Kaynak Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {selectedResource ? "Kaynak bilgilerini güncelleyin" : "Sisteme yeni bir kaynak ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moduleId">Modül</Label>
                <Select 
                  value={formData.moduleId} 
                  onValueChange={(value) => setFormData({ ...formData, moduleId: value, parentResourceId: "" })}
                  required
                >
                  <SelectTrigger id="moduleId">
                    <SelectValue placeholder="Modül seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module: Module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceType">Tür</Label>
                <Select 
                  value={formData.resourceType} 
                  onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
                  required
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kod</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., create_user"
                  disabled={!!selectedResource}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">İsim</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Create User"
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
                placeholder="e.g., Create New User"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kaynak açıklaması..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="path">Yol/Uç Nokta</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="e.g., /api/users/create"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentResourceId">Üst Kaynak</Label>
                <Select 
                  value={formData.parentResourceId} 
                  onValueChange={(value) => setFormData({ ...formData, parentResourceId: value })}
                >
                  <SelectTrigger id="parentResourceId">
                    <SelectValue placeholder="Üst kaynağı seçin (isteğe bağlı)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableParentResources.map((resource: Resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
                />
                <Label htmlFor="isPublic">Herkese Açık Kaynak (Kimlik doğrulama gerekli değil)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: !!checked })}
                />
                <Label htmlFor="requiresApproval">Onay Gerektirir</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="shopifySecondary"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedResource(null);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" variant="shopifyPrimary" disabled={createResourceMutation.isPending || updateResourceMutation.isPending}>
                {selectedResource ? "Güncelle" : "Oluştur"} Kaynak
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kaynağı Sil</DialogTitle>
            <DialogDescription>
              "{selectedResource?.displayName}" kaynağını silmek istediğinizden emin misiniz?
              Bu işlem aynı zamanda ilişkili tüm izinleri de kaldıracaktır. Bu eylem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="shopifySecondary"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedResource(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="shopifyDestructive"
              onClick={() => selectedResource && deleteResourceMutation.mutate(selectedResource.id)}
              disabled={deleteResourceMutation.isPending}
            >
              Kaynağı Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageWrapper>
  );
}