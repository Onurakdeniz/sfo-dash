'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CustomerDetailPage() {
  const { workspaceSlug, companySlug, customerId } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to detay page by default
    router.replace(`/${workspaceSlug}/${companySlug}/customers/${customerId}/detay`);
  }, [workspaceSlug, companySlug, customerId, router]);

  return null;
}
