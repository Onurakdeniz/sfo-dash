"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, Globe, Users, Trash2, Edit, Eye, MoreHorizontal } from "lucide-react";
import { createClient } from "@luna/api/client";
import { 
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Skeleton,
  toast
} from "@luna/ui";

const client = createClient('http://localhost:3002') as any;

interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface CreateCompanyData {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
}

export default function CompaniesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  // Fetch workspaces
  const { data: workspacesResponse, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      try {
        const res = await client.api.workspaces.$get();
        if (!res.ok) return { workspaces: [], total: 0 };
        return res.json();
      } catch {
        return { workspaces: [], total: 0 };
      }
    },
  });

  const workspaces = workspacesResponse?.workspaces || [];

  // Set default workspace when workspaces load
  if (workspaces.length > 0 && !selectedWorkspace) {
    setSelectedWorkspace(workspaces[0].id);
  }

  // Fetch companies for selected workspace
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', selectedWorkspace],
    queryFn: async () => {
      if (!selectedWorkspace) return [];
      try {
        const res = await client.api.workspaces[':workspaceId'].companies.$get({
          param: { workspaceId: selectedWorkspace },
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
    enabled: !!selectedWorkspace,
  });

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const res = await client.api.workspaces[':workspaceId'].companies.$post({
        param: { workspaceId: selectedWorkspace },
        json: data,
      });
      if (!res.ok) {
        throw new Error('Failed to create company');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', selectedWorkspace] });
      setShowCreateModal(false);
      toast.success('Şirket başarıyla oluşturuldu');
    },
    onError: (error) => {
      toast.error('Şirket oluşturma başarısız');
      console.error('Create company error:', error);
    },
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async (data: CreateCompanyData & { id: string }) => {
      const { id, ...updateData } = data;
      const res = await client.api.workspaces[':workspaceId'].companies[':companyId'].$patch({
        param: { workspaceId: selectedWorkspace, companyId: id },
        json: updateData,
      });
      if (!res.ok) {
        throw new Error('Failed to update company');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', selectedWorkspace] });
      setShowEditModal(false);
      setSelectedCompany(null);
      toast.success('Şirket başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error('Şirket güncelleme başarısız');
      console.error('Update company error:', error);
    },
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await client.api.workspaces[':workspaceId'].companies[':companyId'].$delete({
        param: { workspaceId: selectedWorkspace, companyId },
      });
      if (!res.ok) {
        throw new Error('Failed to delete company');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', selectedWorkspace] });
      setShowDeleteDialog(false);
      setSelectedCompany(null);
      toast.success('Şirket başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Şirket silme başarısız');
      console.error('Delete company error:', error);
    },
  });

  // Filter companies based on search
  const filteredCompanies = companies.filter((company: Company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    createCompany.mutate({
      name: formData.get('name') as string,
      domain: (formData.get('domain') as string) || undefined,
      industry: (formData.get('industry') as string) || undefined,
      size: (formData.get('size') as string) || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    updateCompany.mutate({
      id: selectedCompany.id,
      name: formData.get('name') as string,
      domain: (formData.get('domain') as string) || undefined,
      industry: (formData.get('industry') as string) || undefined,
      size: (formData.get('size') as string) || undefined,
    });
  };

  const companySizeOptions = [
    { value: '1-10', label: '1-10 çalışan' },
    { value: '11-50', label: '11-50 çalışan' },
    { value: '51-200', label: '51-200 çalışan' },
    { value: '201-500', label: '201-500 çalışan' },
    { value: '500+', label: '500+ çalışan' },
  ];

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Şirketler</h1>
          <p className="mt-2 text-muted-foreground">
            Çalışma alanlarınızdaki şirketleri yönetin
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
                        <Button disabled={!selectedWorkspace}>
              <Plus className="mr-2 h-4 w-4" />
              Şirket Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Şirket Ekle</DialogTitle>
              <DialogDescription>
                Çalışma alanınızda yeni bir şirket oluşturun
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Şirket Adı *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    name="domain"
                    placeholder="acme.com"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Sektör</Label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="Teknoloji"
                  />
                </div>
                <div>
                  <Label htmlFor="size">Şirket Büyüklüğü</Label>
                  <Select name="size">
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket büyüklüğünü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={createCompany.isPending}>
                  {createCompany.isPending ? 'Ekleniyor...' : 'Şirket Ekle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="workspace">Çalışma Alanı</Label>
              {isLoadingWorkspaces ? (
                <Skeleton className="h-10 w-full mt-1" />
              ) : (
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çalışma alanı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace: Workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex-1">
              <Label htmlFor="search">Arama</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Şirket ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Şirketler</CardTitle>
          <CardDescription>
            Seçilen çalışma alanındaki tüm şirketlerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCompanies ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Aramanızla eşleşen şirket bulunamadı' : 'Bu çalışma alanında şirket yok'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  İlk şirketinizi ekleyin
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Şirket</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Sektör</TableHead>
                  <TableHead>Büyüklük</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company: Company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground">{company.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.domain ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {company.domain}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.industry || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {company.size ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {company.size} çalışan
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.isActive ? "default" : "secondary"}>
                        {company.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detayları Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şirketi Düzenle</DialogTitle>
            <DialogDescription>
              Şirket bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Şirket Adı *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedCompany.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-domain">Domain</Label>
                  <Input
                    id="edit-domain"
                    name="domain"
                    defaultValue={selectedCompany.domain || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-industry">Sektör</Label>
                  <Input
                    id="edit-industry"
                    name="industry"
                    defaultValue={selectedCompany.industry || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-size">Şirket Büyüklüğü</Label>
                  <Select name="size" defaultValue={selectedCompany.size || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket büyüklüğünü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCompany(null);
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? 'Güncelleniyor...' : 'Şirketi Güncelle'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Company Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Şirket Detayları</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                  <p className="text-muted-foreground">{selectedCompany.slug}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={selectedCompany.isActive ? "default" : "secondary"}>
                    {selectedCompany.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </div>
              
                            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Domain</Label>
                  <p className="mt-1">{selectedCompany.domain || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sektör</Label>
                  <p className="mt-1">{selectedCompany.industry || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Şirket Büyüklüğü</Label>
                  <p className="mt-1">{selectedCompany.size ? `${selectedCompany.size} çalışan` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</Label>
                  <p className="mt-1">{new Date(selectedCompany.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
        </div>
      )}
          <DialogFooter>
            <Button onClick={() => setShowDetailModal(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, "{selectedCompany?.name}" şirketini kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompany(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCompany) {
                  deleteCompany.mutate(selectedCompany.id);
                }
              }}
              disabled={deleteCompany.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompany.isPending ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 