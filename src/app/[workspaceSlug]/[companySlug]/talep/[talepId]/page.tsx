'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TalepRedirectPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${workspaceSlug}/${companySlug}/talep/${talepId}/detay`);
  }, [workspaceSlug, companySlug, talepId, router]);

  return null;
}
