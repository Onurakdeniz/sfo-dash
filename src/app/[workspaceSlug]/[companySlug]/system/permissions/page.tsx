"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Key,
  Edit,
  Trash2,
  Search,
  Shield,
  Eye,
  Edit2,
  Trash,
  Download,
  Upload,
  Check,
  X,
  ArrowLeft
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
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
  { value: "create", label: "Oluştur", icon: Plus, color: "text-green-500" },
  { value: "update", label: "Güncelle", icon: Edit2, color: "text-yellow-500" },
  { value: "delete", label: "Sil", icon: Trash, color: "text-red-500" },
  { value: "export", label: "Dışa Aktar", icon: Download, color: "text-purple-500" },
  { value: "import", label: "İçe Aktar", icon: Upload, color: "text-indigo-500" },
  { value: "approve", label: "Onayla", icon: Check, color: "text-emerald-500" },
  { value: "reject", label: "Reddet", icon: X, color: "text-rose-500" }
];

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
    resourceId: "",
    action: "",
    name: "",
    displayName: "",
    description: "",
    conditions: {}
  });

  // Fetch modules for dropdown
  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await fetch("/api/system/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    }
  });

  // Fetch resources for dropdown
  const { data: resources = [] } = useQuery({
    queryKey: ["resources", selectedModule],
    queryFn: async () => {
      const url = selectedModule === "all" 
        ? "/api/system/resources"
        : `/api/system/resources?moduleId=${selectedModule}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch resources");
      return response.json();
    },
    enabled: true
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

  // Fetch roles for assignment
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await fetch("/api/system/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json();
    }
  });

  // Fetch role permissions
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/system/role-permissions");
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
      resourceId: "",
      action: "",
      name: "",
      displayName: "",
      description: "",
      conditions: {}
    });
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      resourceId: permission.resourceId,
      action: permission.action,
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
      updatePermissionMutation.mutate({ id: selectedPermission.id, ...formData });
    } else {
      createPermissionMutation.mutate(formData);
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
      <Button variant="outline" onClick={handleAssignPermissions}>
        <Shield className="w-4 h-4 mr-2" />
        Rollere Ata
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
                    <SelectValue placeholder="Tüm Modüller" />
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
                <Select value={selectedResource} onValueChange={setSelectedResource}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tüm Kaynaklar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kaynaklar</SelectItem>
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

          {/* Permissions by Resource */}
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                Loading permissions...
              </CardContent>
            </Card>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                No permissions found
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedPermissions).map(([resourceId, group]: [string, any]) => (
              <Card key={resourceId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {group.resource?.displayName || "Bilinmeyen Kaynak"}
                      </CardTitle>
                      <CardDescription>
                        Modül: {group.resource?.module?.displayName || "Bilinmeyen"} • 
                        Tür: {group.resource?.resourceType || "Bilinmeyen"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {group.permissions.length} izin
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
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
                                <span className="font-mono text-sm">{permission.action}</span>
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
                </CardContent>
              </Card>
            ))
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
                <Label htmlFor="resourceId">Kaynak</Label>
                <Select 
                  value={formData.resourceId} 
                  onValueChange={(value) => setFormData({ ...formData, resourceId: value })}
                  required
                  disabled={!!selectedPermission}
                >
                  <SelectTrigger id="resourceId">
                    <SelectValue placeholder="Kaynak seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((resource: Resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.displayName} ({resource.module?.displayName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Eylem</Label>
                <Select 
                  value={formData.action} 
                  onValueChange={(value) => setFormData({ ...formData, action: value })}
                  required
                  disabled={!!selectedPermission}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Eylem seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center gap-2">
                          <action.icon className={`w-4 h-4 ${action.color}`} />
                          <span>{action.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Özel Eylem</SelectItem>
                  </SelectContent>
                </Select>
                {formData.action === "custom" && (
                  <Input
                    placeholder="Özel eylem girin"
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">İzin Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., users.create"
                  required
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="İzin açıklaması..."
                rows={3}
              />
            </div>
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
            {/* This would be implemented as a comprehensive permission assignment matrix */}
            <p className="text-center text-muted-foreground py-8">
              İzin atama matrisi burada uygulanacaktır
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