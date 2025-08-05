"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
// API calls will be made using fetch to local endpoints
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";
import { RoleGuard } from "@/components/layouts/role-guard";

// API calls will be made using fetch to local endpoints

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
  taxNumber?: string;
  taxOffice?: string;
  employeeCount?: number;
  departmentCount?: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface CreateCompanyData {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
}

function CompaniesPageContent() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  // Fetch all workspaces and find by slug (already filtered to owner only)
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      try {
        const res = await fetch('/api/workspaces', {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!workspaceSlug,
  });

  // Find current workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch companies for the current workspace
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });





  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to delete company');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspace?.id] });
      setShowDeleteDialog(false);
      setSelectedCompany(null);
      toast.success('Şirket başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Şirket silme başarısız');
      console.error('Delete company error:', error);
    },
  });

  // Show loading state if workspace is still loading
  if (isLoadingWorkspaces) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if workspace not found (user doesn't own this workspace)
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erişim Reddedildi
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }







  return (
    <PageWrapper
      title="Şirketler"
      description={`${workspace.name} çalışma alanındaki şirketleri yönetin`}
      actions={
        <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
          <Button variant="action" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Şirket Ekle
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">

      {/* Companies Table */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Şirket Listesi</CardTitle>
          <CardDescription>
            {companies.length > 0 ? `${companies.length} şirket bulundu` : 'Henüz şirket eklenmemiş'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCompanies ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz şirket yok
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Bu çalışma alanında henüz şirket eklenmemiş. İlk şirketinizi ekleyerek başlayın.
              </p>
              <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Şirketinizi Ekleyin
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Vergi Bilgileri</TableHead>
                    <TableHead>Sektör</TableHead>
                    <TableHead>Departmanlar</TableHead>
                    <TableHead>Çalışan Sayısı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Oluşturma Tarihi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company: Company) => (
                    <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-6">
                        <Link href={`/${workspaceSlug}/${companySlug}/companies/${company.id}`}>
                          <div className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-foreground">{company.name}</div>
                              <div className="text-sm text-muted-foreground">{company.slug}</div>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-muted-foreground">VN: </span>
                            <span>{company.taxNumber || 'Belirtilmemiş'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">VD: </span>
                            <span>{company.taxOffice || 'Belirtilmemiş'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-sm">{company.industry || 'Belirtilmemiş'}</span>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-sm">{company.departmentCount || 0} departman</span>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-sm">
                          {company.employeeCount 
                            ? `${company.employeeCount} çalışan`
                            : company.size 
                            ? `${company.size} çalışan`
                            : 'Belirsiz'
                          }
                        </span>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge 
                          variant={company.isActive ? "default" : "secondary"}
                          className={company.isActive 
                            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200"
                          }
                        >
                          {company.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-6">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-sm text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                              <Link href={`/${workspaceSlug}/${companySlug}/companies/${company.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Company Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Şirket Detayları</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Building2 className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                  <p className="text-muted-foreground">{selectedCompany.slug}</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-sm font-medium ${
                    selectedCompany.isActive 
                      ? 'text-green-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {selectedCompany.isActive ? 'Aktif' : 'Pasif'}
                  </span>
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
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white focus:text-white"
            >
              {deleteCompany.isPending ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageWrapper>
  );
}

export default function CompaniesPage() {
  return (
    <RoleGuard 
      requiredRoles={['owner', 'admin']}
      fallbackMessage="Şirket yönetimi sayfasına erişmek için yönetici yetkisi gereklidir."
    >
      <CompaniesPageContent />
    </RoleGuard>
  );
} 