"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeSecondaryNav from "../employee-secondary-nav";

export default function EmployeePositionChangesPage() {
  return (
    <PageWrapper
      title="Pozisyon Değişiklikleri"
      description="Çalışanın geçmiş ve planlanan pozisyon hareketleri"
      secondaryNav={<EmployeeSecondaryNav />}
    >
      <Card>
        <CardHeader>
          <CardTitle>Pozisyon Hareketleri</CardTitle>
          <CardDescription>Bu bölüm yakında eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Atama, terfi, transfer ve ayrılış kayıtları burada listelenecek.</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


