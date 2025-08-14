"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus,
  Settings,
  Shield,
  Users,
  Package,
  Key,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Globe
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
}

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
}

const MODULE_CATEGORIES: never[] = [];

const RESOURCE_TYPES = [
  { value: "page", label: "Sayfa" },
  { value: "api", label: "API" },
  { value: "feature", label: "Özellik" },
  { value: "report", label: "Rapor" },
  { value: "action", label: "Eylem" },
  { value: "widget", label: "Widget" }
];

const PERMISSION_ACTIONS = [
  { value: "view", label: "Görüntüle" },
  { value: "create", label: "Oluştur" },
  { value: "edit", label: "Düzenle" },
  { value: "delete", label: "Sil" },
  { value: "execute", label: "Çalıştır" },
  { value: "export", label: "Dışa Aktar" },
  { value: "import", label: "İçe Aktar" },
  { value: "approve", label: "Onayla" },
  { value: "manage", label: "Yönet" }
];

export default function SystemPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // State for dialogs
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  // Form states
  const [moduleForm, setModuleForm] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    icon: "",
    color: "",
    isCore: false,
    sortOrder: 0
  });

  const [resourceForm, setResourceForm] = useState({
    moduleId: "",
    code: "",
    name: "",
    displayName: "",
    description: "",
    resourceType: "page",
    path: "",
    isPublic: false,
    requiresApproval: false,
    sortOrder: 0
  });

  const [roleForm, setRoleForm] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    workspaceId: "",
    companyId: "",
    isSystem: false,
    sortOrder: 0
  });

  const [permissionForm, setPermissionForm] = useState({
    resourceId: "",
    action: "view",
    name: "",
    displayName: "",
    description: ""
  });

  // Fetch modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await fetch('/api/system/modules');
      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    }
  });

  // Fetch resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await fetch('/api/system/resources');
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    }
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/system/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/system/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    }
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/system/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create module');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setModuleDialogOpen(false);
      setModuleForm({
        code: "",
        name: "",
        displayName: "",
        description: "",
        icon: "",
        color: "",
        isCore: false,
        sortOrder: 0
      });
      toast.success("Başarılı", {
        description: "Modül başarıyla oluşturuldu"
      });
    },
    onError: (error: any) => {
      toast.error("Hata", {
        description: error.message || "Modül oluşturulurken hata oluştu"
      });
    }
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/system/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create resource');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setResourceDialogOpen(false);
      setResourceForm({
        moduleId: "",
        code: "",
        name: "",
        displayName: "",
        description: "",
        resourceType: "page",
        path: "",
        isPublic: false,
        requiresApproval: false,
        sortOrder: 0
      });
      toast.success("Başarılı", {
        description: "Kaynak başarıyla oluşturuldu"
      });
    },
    onError: (error: any) => {
      toast.error("Hata", {
        description: error.message || "Kaynak oluşturulurken hata oluştu"
      });
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/system/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleDialogOpen(false);
      setRoleForm({
        code: "",
        name: "",
        displayName: "",
        description: "",
        workspaceId: "",
        companyId: "",
        isSystem: false,
        sortOrder: 0
      });
      toast.success("Başarılı", {
        description: "Rol başarıyla oluşturuldu"
      });
    },
    onError: (error: any) => {
      toast.error("Hata", {
        description: error.message || "Rol oluşturulurken hata oluştu"
      });
    }
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/system/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create permission');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setPermissionDialogOpen(false);
      setPermissionForm({
        resourceId: "",
        action: "view",
        name: "",
        displayName: "",
        description: ""
      });
      toast.success("Başarılı", {
        description: "İzin başarıyla oluşturuldu"
      });
    },
    onError: (error: any) => {
      toast.error("Hata", {
        description: error.message || "İzin oluşturulurken hata oluştu"
      });
    }
  });

  const handleCreateModule = () => {
    createModuleMutation.mutate(moduleForm);
  };

  const handleCreateResource = () => {
    createResourceMutation.mutate(resourceForm);
  };

  const handleCreateRole = () => {
    createRoleMutation.mutate(roleForm);
  };

  const handleCreatePermission = () => {
    createPermissionMutation.mutate(permissionForm);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistem Yönetimi</h1>
          <p className="text-muted-foreground">
            Modülleri, kaynakları, rolleri ve izinleri yönetin
          </p>
        </div>
      </div>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Modüller
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Kaynaklar
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roller
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            İzinler
          </TabsTrigger>
          <TabsTrigger value="role-permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rol İzinleri
          </TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Modüller</CardTitle>
                <CardDescription>
                  Sistem modüllerini oluşturun ve yönetin
                </CardDescription>
              </div>
              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Modül Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Modül Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir sistem modülü oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code">Kod</Label>
                      <Input
                        id="code"
                        value={moduleForm.code}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="module_code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">İsim</Label>
                      <Input
                        id="name"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Modül İsmi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName">Görünen İsim</Label>
                      <Input
                        id="displayName"
                        value={moduleForm.displayName}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Görünen İsim"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Modül açıklaması"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="icon">İkon</Label>
                      <Input
                        id="icon"
                        value={moduleForm.icon}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="icon-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Renk</Label>
                      <Input
                        id="color"
                        value={moduleForm.color}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#000000"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isCore"
                        checked={moduleForm.isCore}
                        onCheckedChange={(checked) => setModuleForm(prev => ({ ...prev, isCore: !!checked }))}
                      />
                      <Label htmlFor="isCore">Çekirdek Modül</Label>
                    </div>
                    <div>
                      <Label htmlFor="sortOrder">Sıralama</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={moduleForm.sortOrder}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleCreateModule} disabled={createModuleMutation.isPending}>
                      {createModuleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Çekirdek</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module: Module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-mono">{module.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.displayName}</div>
                          <div className="text-sm text-muted-foreground">{module.name}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {module.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {module.isCore && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Çekirdek
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!module.isCore && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kaynaklar</CardTitle>
                <CardDescription>
                  Modül kaynaklarını oluşturun ve yönetin
                </CardDescription>
              </div>
              <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Kaynak Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Kaynak Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir modül kaynağı oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="moduleId">Modül</Label>
                      <Select value={resourceForm.moduleId} onValueChange={(value) => setResourceForm(prev => ({ ...prev, moduleId: value }))}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="resourceCode">Kod</Label>
                      <Input
                        id="resourceCode"
                        value={resourceForm.code}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="resource_code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resourceName">İsim</Label>
                      <Input
                        id="resourceName"
                        value={resourceForm.name}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Kaynak İsmi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resourceDisplayName">Görünen İsim</Label>
                      <Input
                        id="resourceDisplayName"
                        value={resourceForm.displayName}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Görünen İsim"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resourceDescription">Açıklama</Label>
                      <Textarea
                        id="resourceDescription"
                        value={resourceForm.description}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Kaynak açıklaması"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resourceType">Tür</Label>
                      <Select value={resourceForm.resourceType} onValueChange={(value) => setResourceForm(prev => ({ ...prev, resourceType: value }))}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="resourcePath">Yol</Label>
                      <Input
                        id="resourcePath"
                        value={resourceForm.path}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, path: e.target.value }))}
                        placeholder="/path/to/resource"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={resourceForm.isPublic}
                        onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, isPublic: !!checked }))}
                      />
                      <Label htmlFor="isPublic">Herkese Açık</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresApproval"
                        checked={resourceForm.requiresApproval}
                        onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, requiresApproval: !!checked }))}
                      />
                      <Label htmlFor="requiresApproval">Onay Gerektirir</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleCreateResource} disabled={createResourceMutation.isPending}>
                      {createResourceMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>Modül</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((item: any) => (
                    <TableRow key={item.resource.id}>
                      <TableCell className="font-mono">{item.resource.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.resource.displayName}</div>
                          <div className="text-sm text-muted-foreground">{item.resource.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.module?.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {RESOURCE_TYPES.find(t => t.value === item.resource.resourceType)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.resource.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roller</CardTitle>
                <CardDescription>
                  Kullanıcı rollerini oluşturun ve yönetin
                </CardDescription>
              </div>
              <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Rol Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Rol Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir kullanıcı rolü oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roleCode">Kod</Label>
                      <Input
                        id="roleCode"
                        value={roleForm.code}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="role_code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleName">İsim</Label>
                      <Input
                        id="roleName"
                        value={roleForm.name}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Rol İsmi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleDisplayName">Görünen İsim</Label>
                      <Input
                        id="roleDisplayName"
                        value={roleForm.displayName}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Görünen İsim"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleDescription">Açıklama</Label>
                      <Textarea
                        id="roleDescription"
                        value={roleForm.description}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Rol açıklaması"
                      />
                    </div>
                    <div>
                      <Label>Kapsam</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="workspace"
                            name="scope"
                            checked={!!roleForm.workspaceId}
                            onChange={() => setRoleForm(prev => ({ ...prev, workspaceId: "temp", companyId: "" }))}
                          />
                          <Label htmlFor="workspace" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Çalışma Alanı
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="company"
                            name="scope"
                            checked={!!roleForm.companyId}
                            onChange={() => setRoleForm(prev => ({ ...prev, companyId: "temp", workspaceId: "" }))}
                          />
                          <Label htmlFor="company" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Şirket
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isSystem"
                        checked={roleForm.isSystem}
                        onCheckedChange={(checked) => setRoleForm(prev => ({ ...prev, isSystem: !!checked }))}
                      />
                      <Label htmlFor="isSystem">Sistem Rolü</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                      {createRoleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>Kapsam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Sistem</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((item: any) => (
                    <TableRow key={item.role.id}>
                      <TableCell className="font-mono">{item.role.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.role.displayName}</div>
                          <div className="text-sm text-muted-foreground">{item.role.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.workspace && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Globe className="h-3 w-3 mr-1" />
                            {item.workspace.name}
                          </Badge>
                        )}
                        {item.company && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            <Building2 className="h-3 w-3 mr-1" />
                            {item.company.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.role.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.role.isSystem && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            Sistem
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!item.role.isSystem && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>İzinler</CardTitle>
                <CardDescription>
                  Kaynak izinlerini oluşturun ve yönetin
                </CardDescription>
              </div>
              <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    İzin Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni İzin Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni bir kaynak izni oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resourceId">Kaynak</Label>
                      <Select value={permissionForm.resourceId} onValueChange={(value) => setPermissionForm(prev => ({ ...prev, resourceId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kaynak seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {resources.map((item: any) => (
                            <SelectItem key={item.resource.id} value={item.resource.id}>
                              {item.resource.displayName} ({item.module?.displayName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="action">Eylem</Label>
                      <Select value={permissionForm.action} onValueChange={(value) => setPermissionForm(prev => ({ ...prev, action: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Eylem seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_ACTIONS.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="permissionName">İsim</Label>
                      <Input
                        id="permissionName"
                        value={permissionForm.name}
                        onChange={(e) => setPermissionForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="İzin İsmi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permissionDisplayName">Görünen İsim</Label>
                      <Input
                        id="permissionDisplayName"
                        value={permissionForm.displayName}
                        onChange={(e) => setPermissionForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Görünen İsim"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permissionDescription">Açıklama</Label>
                      <Textarea
                        id="permissionDescription"
                        value={permissionForm.description}
                        onChange={(e) => setPermissionForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="İzin açıklaması"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleCreatePermission} disabled={createPermissionMutation.isPending}>
                      {createPermissionMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Eylem</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Modül</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((item: any) => (
                    <TableRow key={item.permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.permission.displayName}</div>
                          <div className="text-sm text-muted-foreground">{item.permission.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PERMISSION_ACTIONS.find(a => a.value === item.permission.action)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.resource?.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.module?.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.permission.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Permissions Tab */}
        <TabsContent value="role-permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rol İzinleri</CardTitle>
              <CardDescription>
                Rollere izin atayın ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Rol izin yönetimi yakında eklenecek...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}