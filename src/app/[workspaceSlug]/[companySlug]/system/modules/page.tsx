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
import { 
  Plus,
  Package,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
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
  description?: string;
  category: string;
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

const MODULE_CATEGORIES = [
  { value: "core", label: "Çekirdek", icon: Package, color: "bg-red-500" },
  { value: "hr", label: "İnsan Kaynakları", icon: Package, color: "bg-blue-500" },
  { value: "finance", label: "Finans", icon: Package, color: "bg-green-500" },
  { value: "inventory", label: "Envanter", icon: Package, color: "bg-yellow-500" },
  { value: "crm", label: "CRM", icon: Package, color: "bg-purple-500" },
  { value: "project", label: "Proje Yönetimi", icon: Package, color: "bg-indigo-500" },
  { value: "document", label: "Doküman Yönetimi", icon: Package, color: "bg-pink-500" },
  { value: "reporting", label: "Raporlama", icon: Package, color: "bg-teal-500" },
  { value: "integration", label: "Entegrasyon", icon: Package, color: "bg-orange-500" },
  { value: "security", label: "Güvenlik", icon: Package, color: "bg-gray-500" },
  { value: "settings", label: "Ayarlar", icon: Package, color: "bg-slate-500" }
];

export default function ModulesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    displayName: "",
    description: "",
    category: "",
    icon: "",
    color: "",
    isCore: false,
    sortOrder: 0,
    settings: {},
    metadata: {}
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

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      displayName: "",
      description: "",
      category: "",
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
      category: module.category,
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
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {MODULE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <TableHead>Kategori</TableHead>
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
                filteredModules.map((module: Module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-mono text-sm">{module.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{module.displayName}</p>
                        {module.description && (
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MODULE_CATEGORIES.find(c => c.value === module.category)?.label}
                      </Badge>
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
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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