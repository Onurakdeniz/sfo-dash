"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Plus, Building2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import CompanyTabs from "../company-tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface Workspace { id: string; name: string; slug: string; }
interface Company { id: string; name: string; slug?: string; }
interface Location {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  locationType?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  isHeadquarters: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyLocationsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Location | null>(null);

  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspaceSlug,
  });

  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Company not found');
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  const deleteLocation = useMutation({
    mutationFn: async (locationId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations/${locationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', workspace?.id, companyId] });
      setSelected(null);
      toast.success('Lokasyon silindi');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Lokasyon silme başarısız');
    }
  });

  if (isLoadingWorkspaces || isLoadingCompany) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbs = [
    { label: company?.name || 'Şirket', href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`, isLast: false },
    { label: 'Lokasyonlar', isLast: true },
  ];

  return (
    <CompanyPageLayout
      title="Lokasyonlar"
      description={`${company?.name || 'Şirket'} - Ofis/Birim lokasyonları`}
      breadcrumbs={breadcrumbs}
      actions={(
        <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations/add`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Lokasyon Ekle
          </Button>
        </Link>
      )}
      tabs={<CompanyTabs />}
    >
      <div className="space-y-6">
        <Card className="border-none shadow-none ring-0 bg-transparent" padding="none">
          <CardContent className="p-0">
            {isLoadingLocations ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <MapPin className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Henüz lokasyon yok</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Bu şirkete ait ofis/lokasyon ekleyin.</p>
                <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations/add`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    İlk Lokasyonu Ekleyin
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table unstyledContainer className="w-full table-fixed min-w-[900px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60">
                      <TableHead className="min-w-[320px] w-[320px] font-semibold text-foreground/80 py-4">Lokasyon Bilgileri</TableHead>
                      <TableHead className="min-w-[220px] w-[220px] font-semibold text-foreground/80 py-4">İletişim</TableHead>
                      <TableHead className="min-w-[160px] w-[160px] font-semibold text-foreground/80 py-4">Tür</TableHead>
                      <TableHead className="min-w-[150px] w-[150px] text-right font-semibold text-foreground/80 py-4">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc: Location) => (
                      <TableRow key={loc.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/40">
                        <TableCell className="py-6 w-[320px]">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground mb-1 break-words">{loc.name}</span>
                                {loc.isHeadquarters && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Merkez</span>
                                )}
                              </div>
                              {loc.code && (
                                <div className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded mb-1 inline-block">{loc.code}</div>
                              )}
                              <div className="text-sm text-muted-foreground break-words line-clamp-2">{loc.address || 'Adres yok'}</div>
                              <div className="text-xs text-muted-foreground">{[loc.district, loc.city, loc.country].filter(Boolean).join(', ')}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 w-[220px]">
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{loc.phone || '-'}</div>
                            <div>{loc.email || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 w-[160px]">
                          <div className="text-sm text-muted-foreground">{(() => {
                            if (!loc.locationType) return '-';
                            const map: Record<string, string> = {
                              office: 'Ofis',
                              warehouse: 'Depo',
                              factory: 'Fabrika',
                              store: 'Mağaza',
                              other: 'Diğer',
                              Ofis: 'Ofis',
                              Depo: 'Depo',
                              Fabrika: 'Fabrika',
                              Mağaza: 'Mağaza',
                              Diğer: 'Diğer',
                            };
                            return map[loc.locationType] ?? loc.locationType;
                          })()}</div>
                        </TableCell>
                        <TableCell className="text-right py-6 w-[150px]">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/locations/${loc.id}`}>
                              <Button variant="outline" size="icon-sm" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="icon-sm" className="h-8 w-8 text-destructive" onClick={() => setSelected(loc)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <AlertDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selected?.name}" lokasyonunu silmek üzeresiniz. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="shopifySecondary">İptal</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="shopifyDestructive" onClick={() => selected && deleteLocation.mutate(selected.id)} disabled={deleteLocation.isPending}>
                Sil
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyPageLayout>
  );
}


