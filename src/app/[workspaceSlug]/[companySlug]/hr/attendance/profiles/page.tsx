"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AttendanceTabs from "../attendance-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string } | null;
  currentCompany?: { id: string; name: string; slug: string } | null;
}

type TimeRange = { start: string; end: string };
type DaySchedule = { isWorkingDay: boolean; workIntervals: TimeRange[]; breaks: TimeRange[] };
type WorkCalendar = {
  id: string;
  name: string;
  description?: string;
  days: Record<string, DaySchedule>;
  createdAt: string;
  updatedAt: string;
};

interface CompanySettings {
  id: string;
  companyId: string;
  customSettings: {
    workCalendars?: WorkCalendar[];
  };
}

export default function MesaiProfilesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch context");
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspaceId = contextData?.workspace?.id;
  const companyId = contextData?.currentCompany?.id;

  const { data: companySettings, isLoading: companySettingsLoading } = useQuery<CompanySettings>({
    queryKey: ["company-settings", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) throw new Error("missing ids");
      const res = await fetch(`/api/settings/company?companyId=${companyId}&workspaceId=${workspaceId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch company settings");
      return res.json();
    },
    enabled: !!(workspaceId && companyId)
  });

  const calendars = companySettings?.customSettings?.workCalendars || [];

  const [query, setQuery] = useState("");
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calendars.filter((c) => !q || (c.name || "").toLowerCase().includes(q));
  }, [calendars, query]);

  const secondaryNav = <AttendanceTabs />;

  const actions = (
    <div className="flex items-center gap-2">
      <Link href={`/${workspaceSlug}/${companySlug}/settings/company/calendars/new`}>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Ekle</Button>
      </Link>
    </div>
  );

  const loading = contextLoading || companySettingsLoading;

  return (
    <RoleGuard requiredRoles={["owner", "admin"]} fallbackMessage="Mesai profillerine erişmek için yönetici yetkisi gereklidir.">
      <PageWrapper
        title="Mesai Profilleri"
        description="Bu sayfada çalışanlar için genel mesai profilleri ekleyebilir ve mesai profillerini yönetebilirsiniz."
        actions={actions}
        secondaryNav={secondaryNav}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Mesai Profilleri
              </CardTitle>
              <CardDescription>
                Şirket çalışma takvimleri birer mesai profili olarak listelenir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Başlıkta ara" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead className="w-[160px] text-center">Personel Sayısı</TableHead>
                        <TableHead className="w-[120px] text-center">Durum</TableHead>
                        <TableHead className="w-[64px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">Kayıt bulunamadı</TableCell>
                        </TableRow>
                      ) : (
                        data.map((cal) => (
                          <TableRow key={cal.id}>
                            <TableCell>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{cal.name || "İsimsiz Takvim"}</div>
                                  {cal.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{cal.description}</div>
                                  )}
                                </div>
                                <Link href={`/${workspaceSlug}/${companySlug}/settings/company/calendars/${cal.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                                  Detay <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">0</TableCell>
                            <TableCell className="text-center"><Badge variant="secondary">Aktif</Badge></TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Link href={`/${workspaceSlug}/${companySlug}/settings/company/calendars/${cal.id}`}>
                                    <DropdownMenuItem>Profili Aç</DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem disabled>İlişkili Çalışanlar (yakında)</DropdownMenuItem>
                                  <DropdownMenuItem disabled>Sil (yakında)</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </RoleGuard>
  );
}


