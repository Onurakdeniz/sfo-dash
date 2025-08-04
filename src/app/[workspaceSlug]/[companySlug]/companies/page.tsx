"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Globe, Users, Trash2, Eye, MoreHorizontal } from "lucide-react";
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
import { toast } from "sonner";

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

export default function CompaniesPage() {
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
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error if workspace not found (user doesn't own this workspace)
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }







  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Şirketler</h1>
          <p className="mt-2 text-muted-foreground">
            {workspace.name} çalışma alanındaki şirketleri yönetin
          </p>
        </div>
        <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Şirket Ekle
          </Button>
        </Link>
      </div>

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
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Bu çalışma alanında şirket yok
              </p>
              <Link href={`/${workspaceSlug}/${companySlug}/companies/add`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  İlk şirketinizi ekleyin
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed min-w-[1240px]">
                <TableHeader>
                  <TableRow className="border-b border-border/60">
                    <TableHead className="min-w-[300px] w-[300px] font-semibold text-foreground/80 py-4">Şirket Bilgileri</TableHead>
                    <TableHead className="min-w-[280px] w-[280px] font-semibold text-foreground/80 py-4">Vergi Bilgileri</TableHead>
                    <TableHead className="min-w-[180px] w-[180px] font-semibold text-foreground/80 py-4">Sektör</TableHead>
                    <TableHead className="min-w-[200px] w-[200px] font-semibold text-foreground/80 py-4">Şirket Büyüklüğü</TableHead>
                    <TableHead className="min-w-[120px] w-[120px] font-semibold text-foreground/80 py-4">Durum</TableHead>
                    <TableHead className="min-w-[160px] w-[160px] text-right font-semibold text-foreground/80 py-4">Oluşturma Tarihi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company: Company) => (
                    <TableRow key={company.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/40">
                      <TableCell className="py-6 w-[300px]">
                        <Link href={`/${workspaceSlug}/${companySlug}/companies/${company.id}`}>
                          <div className="flex items-center gap-4 hover:bg-muted/30 rounded-lg p-4 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/60 group">
                            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground mb-1 break-words">{company.slug}</div>
                              <div className="text-sm text-muted-foreground break-words">{company.name}</div>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="py-6 w-[280px]">
                        <div className="space-y-2.5">
                          {company.taxNumber ? (
                            <div className="flex items-center gap-2 p-2.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-200/60 shadow-sm">
                              <span className="text-xs font-semibold bg-orange-100 px-1.5 py-0.5 rounded">VN</span>
                              <span className="text-sm font-medium">{company.taxNumber}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border border-muted">
                              <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">VN</span>
                              <span className="text-sm text-muted-foreground">Belirtilmemiş</span>
                            </div>
                          )}
                          {company.taxOffice ? (
                            <div className="flex items-center gap-2 p-2.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200/60 shadow-sm">
                              <span className="text-xs font-semibold bg-purple-100 px-1.5 py-0.5 rounded">VD</span>
                              <span className="text-sm font-medium break-words">{company.taxOffice}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border border-muted">
                              <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">VD</span>
                              <span className="text-sm text-muted-foreground">Belirtilmemiş</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 w-[180px]">
                        {company.industry ? (
                          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200/60 shadow-sm">
                            <span className="break-words">{company.industry}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-4 py-2 bg-muted/30 text-muted-foreground rounded-full text-sm border border-muted">
                            Belirtilmemiş
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-6 w-[200px]">
                        {company.employeeCount ? (
                          <div className="flex items-center gap-2.5 p-2.5 bg-green-50 text-green-700 rounded-lg border border-green-200/60 shadow-sm">
                            <div className="p-1 bg-green-100 rounded">
                              <Users className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-semibold">{company.employeeCount} çalışan</span>
                          </div>
                        ) : company.size ? (
                          <div className="flex items-center gap-2.5 p-2.5 bg-green-50 text-green-700 rounded-lg border border-green-200/60 shadow-sm">
                            <div className="p-1 bg-green-100 rounded">
                              <Users className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-semibold">{company.size} çalışan</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-muted">
                            <div className="p-1 bg-muted rounded">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">Belirsiz</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-6 w-[120px]">
                        <Badge 
                          variant={company.isActive ? "default" : "secondary"}
                          className={company.isActive 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1.5 font-semibold shadow-sm" 
                            : "bg-gray-100 text-gray-700 border-gray-300 px-3 py-1.5 font-semibold shadow-sm"
                          }
                        >
                          {company.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-6 w-[160px]">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-right">
                            <div className="text-xs font-medium text-muted-foreground mb-0.5">Oluşturma Tarihi</div>
                            <div className="text-sm font-semibold text-foreground">
                              {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted/60 rounded-lg">
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
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCompany.slug}</h3>
                  <p className="text-muted-foreground">{selectedCompany.name}</p>
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
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white focus:text-white"
            >
              {deleteCompany.isPending ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 