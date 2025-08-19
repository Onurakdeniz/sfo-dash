"use client";

import { useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Plus, Loader2, ArrowLeft, User, Mail, Target, Code, Users, Eye, MoreHorizontal, Trash2, Building2, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import CompanyTabs from "../company-tabs";

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
  locationId?: string;
  locationName?: string;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [unitsByDepartment, setUnitsByDepartment] = useState<Record<string, { loading: boolean; data: any[] }>>({});

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  const timeAgo = (isoDate?: string) => {
    if (!isoDate) return "";
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = Math.max(0, now - then);
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `${day} gün önce`;
    if (hr > 0) return `${hr} saat önce`;
    if (min > 0) return `${min} dk önce`;
    return "şimdi";
  };

  const formatFullDate = (isoDate?: string) => {
    if (!isoDate) return "";
    return new Date(isoDate).toLocaleString('tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

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
        let message = 'Failed to delete department';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
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
    <CompanyPageLayout
      title="Departmanlar"
      description={`${company?.name || 'Şirket'} - Departman yönetimi`}
      breadcrumbs={breadcrumbs}
      actions={(
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/add`}>
                <Button variant="default" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Departman Ekle
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Departman Ekle</TooltipContent>
          </Tooltip>
        </div>
      )}
      tabs={<CompanyTabs />}
    >
      <div className="space-y-6">
        <Card className="border-none shadow-none ring-0 bg-transparent" padding="none">
          <CardContent className="p-0">
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
                  <Button variant="default" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    İlk Departmanınızı Ekleyin
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full table-fixed min-w-[900px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60">
                      <TableHead className="min-w-[320px] w-[320px] font-semibold text-foreground/80 py-4">Departman Bilgileri</TableHead>
                      <TableHead className="min-w-[220px] w-[220px] font-semibold text-foreground/80 py-4">Lokasyon</TableHead>
                      <TableHead className="min-w-[220px] w-[220px] font-semibold text-foreground/80 py-4">Yönetici</TableHead>
                      <TableHead className="min-w-[160px] w-[160px] font-semibold text-foreground/80 py-4">Birimler</TableHead>
                      <TableHead className="min-w-[150px] w-[150px] text-right font-semibold text-foreground/80 py-4">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department: Department) => (
                      <Fragment key={department.id}>
                        <TableRow key={department.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/40">
                          <TableCell className="py-6 w-[320px]">
                            <div className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-3 transition-all duration-200 group">
                              <button
                                type="button"
                                aria-label={expanded[department.id] ? 'Kapat' : 'Aç'}
                                className="p-2 bg-muted/30 rounded-lg transition-transform duration-200"
                                onClick={async () => {
                                  setExpanded((prev) => ({ ...prev, [department.id]: !prev[department.id] }));
                                  const alreadyLoaded = unitsByDepartment[department.id]?.data;
                                  if (!alreadyLoaded && workspace?.id) {
                                    setUnitsByDepartment((prev) => ({ ...prev, [department.id]: { loading: true, data: [] } }));
                                    try {
                                      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${department.id}/units`, { credentials: 'include' });
                                      const data = res.ok ? await res.json() : [];
                                      setUnitsByDepartment((prev) => ({ ...prev, [department.id]: { loading: false, data } }));
                                    } catch {
                                      setUnitsByDepartment((prev) => ({ ...prev, [department.id]: { loading: false, data: [] } }));
                                    }
                                  }
                                }}
                              >
                                <span className={expanded[department.id] ? 'block rotate-180 transition-transform duration-200' : 'block rotate-0 transition-transform duration-200'}>
                                  {expanded[department.id] ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                              </button>
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/${department.id}`} className="font-semibold text-foreground mb-1 break-words hover:underline">
                                  {department.name}
                                </Link>
                                {department.code && (
                                  <Badge variant="outline" size="sm" tone="subdued" className="mb-1">
                                    <Code className="h-3 w-3 mr-1" />
                                    {department.code}
                                  </Badge>
                                )}
                                <div className="text-sm text-muted-foreground break-words line-clamp-2">{department.description || 'Açıklama yok'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 w-[220px]">
                            {department.locationName ? (
                              <Badge variant="info" size="sm" tone="subdued" className="gap-1.5">
                                <Building className="h-3 w-3" />
                                {department.locationName}
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm" tone="subdued">Atanmamış</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-6 w-[220px]">
                            {department.managerName ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="size-8">
                                  <AvatarImage alt={department.managerName} />
                                  <AvatarFallback>{getInitials(department.managerName)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium break-words">{department.managerName}</div>
                                  {department.managerEmail && (
                                    <div className="text-xs text-muted-foreground break-words">{department.managerEmail}</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline" size="sm" tone="subdued">Atanmamış</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-6 w-[160px]">
                            <Badge variant="secondary" size="sm" className="gap-1.5">
                              <Building className="h-3 w-3" />
                              {(department.unitCount || 0) + ' birim'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-6 w-[150px]">
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-right">
                                <div className="text-xs font-medium text-muted-foreground mb-0.5">Oluşturma</div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm font-semibold text-foreground cursor-default">{timeAgo(department.createdAt)}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{formatFullDate(department.createdAt)}</TooltipContent>
                                </Tooltip>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon-sm" className="h-8 w-8">
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
                        {expanded[department.id] && (
                          <TableRow key={`${department.id}-units`} className="bg-muted/10">
                            <TableCell colSpan={5} className="py-0">
                              <div className="p-4">
                                <div className="flex items-center justify-between pb-3">
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Birimler</span>
                                    <Badge variant="outline" size="sm">{unitsByDepartment[department.id]?.data?.length ?? 0}</Badge>
                                  </div>
                                  <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments/${department.id}`}>
                                    <Button variant="ghost" size="sm">Tümünü Gör</Button>
                                  </Link>
                                </div>
                                {unitsByDepartment[department.id]?.loading ? (
                                  <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                                ) : (unitsByDepartment[department.id]?.data?.length ?? 0) === 0 ? (
                                  <div className="text-sm text-muted-foreground">Bu departmanda birim yok</div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <Table unstyledContainer className="w-full">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="min-w-[240px]">Birim</TableHead>
                                          <TableHead className="min-w-[200px]">Sorumlu</TableHead>
                                          <TableHead className="min-w-[120px]">Personel</TableHead>
                                          <TableHead className="min-w-[160px]">Oluşturma</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {unitsByDepartment[department.id]?.data?.map((u: any) => (
                                          <TableRow key={u.id}>
                                            <TableCell>
                                              <div className="flex flex-col">
                                                <span className="font-medium">{u.name}</span>
                                                {u.code && (
                                                  <span className="text-xs text-muted-foreground">{u.code}</span>
                                                )}
                                                {u.description && (
                                                  <span className="text-xs text-muted-foreground line-clamp-2">{u.description}</span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              {u.leadName ? (
                                                <div className="flex items-center gap-3">
                                                  <Avatar className="size-7">
                                                    <AvatarImage alt={u.leadName} />
                                                    <AvatarFallback>{getInitials(u.leadName)}</AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate max-w-[220px]">{u.leadName}</span>
                                                    {u.leadEmail && <span className="text-xs text-muted-foreground truncate max-w-[220px]">{u.leadEmail}</span>}
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-sm text-muted-foreground">Atanmamış</span>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1.5">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{u.staffCount ?? 0}</span>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-sm cursor-default">{timeAgo(u.createdAt)}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>{formatFullDate(u.createdAt)}</TooltipContent>
                                              </Tooltip>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
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
            <AlertDialogCancel asChild>
              <Button variant="shopifySecondary" onClick={() => setSelectedDepartment(null)}>
                İptal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="shopifyDestructive"
                onClick={() => {
                  if (selectedDepartment) {
                    deleteDepartment.mutate(selectedDepartment.id);
                  }
                }}
                disabled={deleteDepartment.isPending}
              >
                {deleteDepartment.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyPageLayout>
  );
}