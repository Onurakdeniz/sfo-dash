"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EmployeeTabs from "./employee-tabs";
import { Phone, Briefcase, Mail, Calendar, Building2 } from "lucide-react";

export default function EmployeeSecondaryNav() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string;

  const { data: contextData } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspaceId = contextData?.workspace?.id as string | undefined;
  const companyId = contextData?.currentCompany?.id as string | undefined;

  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!workspaceId
  });

  const employee = useMemo(() => {
    return (members as any[]).find((m) => m.user.id === employeeId);
  }, [members, employeeId]);

  // Fetch employee HR profile to display summary details
  const { data: profile } = useQuery<{
    position?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    startDate?: string | null;
    departmentId?: string | null;
    unitId?: string | null;
  } | null>({
    queryKey: ["employee-profile", workspaceId, companyId, employeeId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !employeeId) return null;
      const res = await fetch(
        `/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}`,
        { credentials: "include" }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch employee profile");
      return res.json();
    },
    enabled: !!(workspaceId && companyId && employeeId),
  });

  // Optionally fetch department name
  const departmentId = (profile as any)?.departmentId as string | undefined;
  const unitId = (profile as any)?.unitId as string | undefined;
  const { data: departmentData } = useQuery<{ name: string } | null>({
    queryKey: ["department", workspaceId, companyId, departmentId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !departmentId) return null;
      const res = await fetch(
        `/api/workspaces/${workspaceId}/companies/${companyId}/departments/${departmentId}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceId && companyId && departmentId),
  });

  const { data: unitData } = useQuery<{ name: string } | null>({
    queryKey: ["unit", workspaceId, companyId, departmentId, unitId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !departmentId || !unitId) return null;
      const res = await fetch(
        `/api/workspaces/${workspaceId}/companies/${companyId}/departments/${departmentId}/units/${unitId}`,
        { credentials: "include" }
      );
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceId && companyId && departmentId && unitId),
  });

  const formatDateTR = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    try {
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-muted/40">
        <CardHeader className="py-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10 shadow-sm">
                  <AvatarImage src={employee?.user?.image} alt={employee?.user?.name} />
                  <AvatarFallback>
                    {employee?.user?.name?.[0]?.toUpperCase() || employee?.user?.email?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm">
                  <div className="h-full w-full bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-semibold leading-tight truncate">{employee?.user?.name || "-"}</CardTitle>
                </div>
                <CardDescription className="truncate">{employee?.user?.email || ""}</CardDescription>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  {profile?.position ? (
                    <Badge variant="outline" className="gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {profile.position}
                    </Badge>
                  ) : null}
                  {departmentData?.name ? (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {departmentData.name}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="w-24 text-foreground/70">Telefon:</span>
                <span className="text-foreground">{profile?.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="w-24 text-foreground/70">E-Posta:</span>
                <span className="text-foreground">{employee?.user?.email || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="w-24 text-foreground/70">Doğum Tarihi:</span>
                <span className="text-foreground">{formatDateTR((profile as any)?.birthDate) || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="w-24 text-foreground/70">İşe Giriş:</span>
                <span className="text-foreground">{formatDateTR((profile as any)?.startDate) || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="w-24 text-foreground/70">Şirket:</span>
                <span className="text-foreground">{contextData?.currentCompany?.name || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="w-24 text-foreground/70">Departman:</span>
                <span className="text-foreground">{departmentData?.name || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="w-24 text-foreground/70">Birim:</span>
                <span className="text-foreground">{unitData?.name || "-"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EmployeeTabs />
    </div>
  );
}


