"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";

export default function EmployeeNotificationsPage() {
  return (
    <PageWrapper
      title="Bildirimler"
      description="Personel ile ilgili sistem bildirimleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <Card>
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
          <CardDescription>Bu bölüm yakında eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Personel bildirim geçmişi burada gösterilecek.</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


