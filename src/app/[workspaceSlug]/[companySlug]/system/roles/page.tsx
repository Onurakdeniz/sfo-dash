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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus,
  Users,
  Edit,
  Trash2,
  Search,
  Building2,
  Globe,
  Shield,
  Settings,
  ArrowLeft
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
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
  { value: "system", label: "Sistem", icon: Shield, description: "Tüm çalışma alanlarında mevcut" },
  { 
    value: "workspace", 
    label: "Çalışma Alanı", 
    icon: Globe, 
    description: workspaceContext ? `${workspaceContext.workspace.name} çalışma alanında mevcut` : "Bir çalışma alanı içinde mevcut"
  },
  { 
    value: "company", 
    label: "Şirket", 
    icon: Building2, 
    description: workspaceContext ? `${workspaceContext.currentCompany.name} şirketinde mevcut` : "Bir şirket içinde mevcut"
  }
];

export default function RolesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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

  // Fetch workspace context to get actual IDs
  const { data: workspaceContext } = useQuery({
    queryKey: ["workspace-context", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const response = await fetch(`/api/workspace-context/${params.workspaceSlug}/${params.companySlug}`);
      if (!response.ok) throw new Error("Failed to fetch workspace context");
      return response.json();
    }
  });

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", params.workspaceSlug, params.companySlug],
    queryFn: async () => {
      const response = await fetch("/api/system/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json();
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!workspaceContext) {
        throw new Error("Workspace context not loaded");
      }

      const roleData = {
        ...data,
        workspaceId: data.scope === "workspace" ? workspaceContext.workspace.id : 
                     data.scope === "company" ? workspaceContext.workspace.id : undefined,
        companyId: data.scope === "company" ? workspaceContext.currentCompany.id : undefined
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
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

  const filteredRoles = roles.filter((role: Role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.code.toLowerCase().includes(searchTerm.toLowerCase());
    const roleScope = getRoleScope(role);
    const matchesScope = selectedScope === "all" || roleScope === selectedScope;
    return matchesSearch && matchesScope;
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
    >
      <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rolleri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedScope} onValueChange={setSelectedScope}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tüm Kapsamlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kapsamlar</SelectItem>
                {getRoleScopes(workspaceContext).map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
          <CardDescription>
            Sistemdeki tüm rollerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Kapsam</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Sıralama Düzeni</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Roller yükleniyoru...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
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
        <DialogContent className="max-w-2xl">
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
                <Label htmlFor="name">İsim</Label>
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Rol açıklaması..."
                rows={3}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSystem"
                checked={formData.isSystem}
                onCheckedChange={(checked) => setFormData({ ...formData, isSystem: !!checked })}
                disabled={!!selectedRole}
              />
              <Label htmlFor="isSystem">Sistem Rolü (Silinemez)</Label>
            </div>
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
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>İzinleri Yönet - {selectedRole.displayName}</DialogTitle>
              <DialogDescription>
                Bu rol için izinleri yapılandırın
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto">
              {/* This would be implemented as a separate component */}
              <p className="text-center text-muted-foreground py-8">
                İzin yönetimi arayüzü burada uygulanacaktır
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPermissionsDialogOpen(false);
                  setSelectedRole(null);
                }}
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </PageWrapper>
  );
}