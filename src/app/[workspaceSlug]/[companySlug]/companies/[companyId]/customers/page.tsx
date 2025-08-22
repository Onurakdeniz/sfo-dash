'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CompanyCustomersPage() {
  const { workspaceSlug, companySlug, companyId } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main customers page for this workspace/company
    router.replace(`/${workspaceSlug}/${companySlug}/customers`);
  }, [workspaceSlug, companySlug, router]);

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Müşteri sayfasına yönlendiriliyor...</p>
      </div>
    </div>
  );
}
