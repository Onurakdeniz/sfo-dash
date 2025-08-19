"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import CompanyPageLayout from "@/components/layouts/company-page-layout";
import CompanyTabs from "../company-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationalChartCompany } from "./organizational-chart-company";

interface Company {
  id: string;
  name: string;
  slug?: string;
  fullName?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export default function OrganizationalChartPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companyId = params.companyId as string;

  // Fetch all workspaces and find by slug (same pattern as other company pages)
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces", workspaceSlug],
    queryFn: async () => {
      try {
        const res = await fetch("/api/workspaces", {
          credentials: "include",
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
  const workspace: Workspace | null =
    workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch company details using workspace.id and companyId
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useQuery<Company | null>({
    queryKey: ["company", workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Company not found");
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  if (isLoadingWorkspaces || isLoadingCompany) {
    return (
      <CompanyPageLayout
        title="Organizasyon Şeması"
        description="Şirket ve departman hiyerarşisini görüntüleyin"
        tabs={<CompanyTabs />}
      >
        <div className="space-y-6 p-2">
          <Skeleton className="h-[60vh] min-h-[420px] w-full" />
        </div>
      </CompanyPageLayout>
    );
  }

  if (!workspace || !company || companyError) {
    return (
      <CompanyPageLayout
        title="Organizasyon Şeması"
        description="Şirket ve departman hiyerarşisini görüntüleyin"
        tabs={<CompanyTabs />}
      >
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground">Hata Oluştu</h2>
            <p className="mt-2 text-muted-foreground">
              Veriler yüklenirken bir hata oluştu veya çalışma alanı/şirket bulunamadı.
            </p>
          </div>
        </div>
      </CompanyPageLayout>
    );
  }

  return (
    <CompanyPageLayout
      title="Organizasyon Şeması"
      description={`${company.name} şirketinin hiyerarşisi`}
      tabs={<CompanyTabs />}
    >
      <div className="flex-1 w-full">
        <OrganizationalChartCompany company={company} workspace={workspace} />
      </div>
    </CompanyPageLayout>
  );
}
