"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";

export default function PerformancePage() {
  return (
    <RoleGuard requiredRoles={["owner", "admin"]} fallbackMessage="Performans yönetimine erişmek için yönetici yetkisi gereklidir.">
      <PageWrapper
        title="Performans"
        description="Hedefler, değerlendirmeler ve geri bildirimler"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Performans modülü yakında. Hedef belirleme, periyodik değerlendirmeler ve 360 geri bildirim planlandı.</p>
        </div>
      </PageWrapper>
    </RoleGuard>
  );
}


