"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Plus, Loader2, ArrowLeft, User, Mail, Target, Code, Users, Eye, MoreHorizontal, Trash2, Building2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Department {
  id: string;
  companyId: string;
  parentDepartmentId?: string;
  code?: string;
  name: string;
  description?: string;
  responsibilityArea?: string;
  goals?: {
    shortTerm?: string | null;
    mediumTerm?: string | null;
    longTerm?: string | null;
  };
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  mailAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  unitCount?: number;
}



export default function DepartmentsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Fetch all workspaces and find by slug
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

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Company not found');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Fetch departments for the company
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Fetch users for manager selection
  const { data: users = [] } = useQuery({
    queryKey: ['users', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.members || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });



  // Delete department mutation
  const deleteDepartment = useMutation({
    mutationFn: async (departmentId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete department');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', workspace?.id, companyId] });
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
      toast.success('Departman başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Departman silme başarısız');
      console.error('Delete department error:', error);
    },
  });



  // Show loading state
  if (isLoadingWorkspaces || isLoadingCompany) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-muted-foreground/60" />
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

  // Create custom breadcrumbs with company name
  const breadcrumbs = [
    {
      label: company?.name || 'Şirket',
      href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`,
      isLast: false
    },
    {
      label: 'Departmanlar',
      isLast: true
    }
  ];

  return (
    <PageWrapper
      title="Departmanlar"
      description={`${company?.name || 'Şirket'} - Departman yönetimi`}
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/add`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Departman Ekle
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>
              {departments.length > 0 ? `${departments.length} departman bulundu` : 'Henüz departman eklenmemiş'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDepartments ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <Building className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Henüz departman yok
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Bu şirkette henüz departman eklenmemiş. İlk departmanınızı ekleyerek başlayın.
                </p>
                <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/add`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    İlk Departmanınızı Ekleyin
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full table-fixed min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60">
                      <TableHead className="min-w-[250px] w-[250px] font-semibold text-foreground/80 py-4">Departman Bilgileri</TableHead>
                      <TableHead className="min-w-[200px] w-[200px] font-semibold text-foreground/80 py-4">Yönetici</TableHead>
                      <TableHead className="min-w-[250px] w-[250px] font-semibold text-foreground/80 py-4">Sorumluluk Alanı</TableHead>
                      <TableHead className="min-w-[150px] w-[150px] font-semibold text-foreground/80 py-4">Birimler</TableHead>
                      <TableHead className="min-w-[200px] w-[200px] font-semibold text-foreground/80 py-4">İletişim</TableHead>
                      <TableHead className="min-w-[150px] w-[150px] text-right font-semibold text-foreground/80 py-4">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department: Department) => (
                      <TableRow key={department.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/40">
                        <TableCell className="py-6 w-[250px]">
                          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/${department.id}`}>
                            <div className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-3 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/60 group">
                              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-200">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                                                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-1 break-words">{department.name}</div>
                        {department.code && (
                          <div className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded mb-1 inline-block">
                            {department.code}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground break-words line-clamp-2">{department.description || 'Açıklama yok'}</div>
                      </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-6 w-[200px]">
                          {department.managerName ? (
                            <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg border border-green-200/60">
                              <div className="p-1 bg-green-100 rounded">
                                <User className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium break-words">{department.managerName}</div>
                                {department.managerEmail && (
                                  <div className="text-xs text-green-600/80 break-words">{department.managerEmail}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-muted">
                              <div className="p-1 bg-muted rounded">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span className="text-sm text-muted-foreground">Atanmamış</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-6 w-[250px]">
                          {department.responsibilityArea ? (
                            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200/60">
                              <div className="text-sm font-medium break-words line-clamp-3">{department.responsibilityArea}</div>
                            </div>
                          ) : (
                            <div className="p-2 bg-muted/30 rounded-lg border border-muted">
                              <span className="text-sm text-muted-foreground">Belirtilmemiş</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-6 w-[150px]">
                          <div className="flex items-center gap-2 p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/60">
                            <div className="p-1 bg-indigo-100 rounded">
                              <Building className="h-3 w-3" />
                            </div>
                            <span className="text-sm font-semibold">{department.unitCount || 0} birim</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 w-[200px]">
                          {department.mailAddress ? (
                            <div className="flex items-center gap-2 p-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200/60">
                              <div className="p-1 bg-orange-100 rounded">
                                <Mail className="h-3 w-3" />
                              </div>
                              <span className="text-sm font-medium break-words">{department.mailAddress}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-muted">
                              <div className="p-1 bg-muted rounded">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span className="text-sm text-muted-foreground">E-posta yok</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-6 w-[150px]">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-right">
                              <div className="text-xs font-medium text-muted-foreground mb-0.5">Oluşturma</div>
                              <div className="text-sm font-semibold text-foreground">
                                {new Date(department.createdAt).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/60 rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/${department.id}`}>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Detaylar
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedDepartment(department);
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
      </div>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. "{selectedDepartment?.name}" departmanını kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDepartment) {
                  deleteDepartment.mutate(selectedDepartment.id);
                }
              }}
              disabled={deleteDepartment.isPending}
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white focus:text-white"
            >
              {deleteDepartment.isPending ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}