"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";

export default function EmployeeLeaveRightsPage() {
  return (
    <PageWrapper
      title="İzin Hakları"
      description="Yıllık ve diğer izin hakları"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <Card>
        <CardHeader>
          <CardTitle>İzin Hakları</CardTitle>
          <CardDescription>Bu bölüm yakında eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>İzin hakları ve bakiye bilgileri burada görünecek.</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


