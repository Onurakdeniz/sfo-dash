'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RequestDetailView } from './request-detail-view';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { RequestService } from '@/actions/talep/request-service';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RequestDetailPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch request details
  const fetchRequestDetails = useCallback(async () => {
    if (!talepId) return;
    
    setLoading(true);
    try {
      const result = await RequestService.getRequestWithDetails(talepId as string);
      setRequest(result);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load request details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [talepId, toast]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Request not found</h2>
          <p className="text-muted-foreground mb-4">
            The request you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}>
            Back to Requests
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <RequestDetailView
        request={request}
        onRefresh={fetchRequestDetails}
        workspaceSlug={workspaceSlug as string}
        companySlug={companySlug as string}
      />
    </PageWrapper>
  );
}