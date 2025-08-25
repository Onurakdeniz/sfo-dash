'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { TalepTabs } from './talep-tabs';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TalepDetailPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper 
      title="Request Details"
      description="View and manage request information"
    >
      <div className="space-y-6">
        <TalepTabs />
        {/* The tab content will be rendered by the child routes */}
      </div>
    </PageWrapper>
  );
}