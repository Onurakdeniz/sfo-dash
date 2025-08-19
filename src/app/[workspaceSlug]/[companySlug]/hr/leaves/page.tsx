"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";

export default function LeavesPage() {
  return (
    <RoleGuard requiredRoles={["owner", "admin"]} fallbackMessage="İzin yönetimine erişmek için yönetici yetkisi gereklidir.">
      <PageWrapper
        title="İzinler"
        description="Yıllık izin, rapor ve diğer izin süreçleri"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>İzin modülü yakında. Başvurular, onay akışları ve bakiye takipleri burada olacak.</p>
        </div>
      </PageWrapper>
    </RoleGuard>
  );
}


