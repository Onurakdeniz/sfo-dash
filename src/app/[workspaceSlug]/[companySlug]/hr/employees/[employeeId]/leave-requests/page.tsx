"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";

export default function EmployeeLeaveRequestsPage() {
  return (
    <PageWrapper
      title="İzin Talepleri"
      description="Personelin izin talepleri ve onay süreçleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <Card>
        <CardHeader>
          <CardTitle>İzin Talepleri</CardTitle>
          <CardDescription>Bu bölüm yakında eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>İzin talep listesi ve detayları burada yer alacak.</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


