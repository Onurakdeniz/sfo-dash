"use client";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PolicyAssignPage() {
  return (
    <PageWrapper
      title="Politika Atama"
      description="Politikaları kullanıcılara, rollere veya birimlere atayın"
    >
      <Card>
        <CardHeader>
          <CardTitle>Politika Atama</CardTitle>
          <CardDescription>Bu alan henüz uygulanmadı.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Atama ekranı yakında eklenecek.</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}


