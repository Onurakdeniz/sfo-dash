'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import CompanyPageLayout from '@/components/layouts/company-page-layout';
import TalepTabs from '../talep-tabs';
import { Activity, ArrowLeft } from 'lucide-react';

interface ActivityItem {
  id: string;
  activityType: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  performedByUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export default function TalepActivitiesPage() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [talepTitle, setTalepTitle] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/companies/${companySlug}/talep/${talepId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTalepTitle(data.talep?.title || 'Talep Aktiviteleri');
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({ title: 'Error', description: 'Aktiviteler yüklenemedi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [workspaceSlug, companySlug, talepId]);

  return (
    <CompanyPageLayout
      title={talepTitle || 'Talep Aktiviteleri'}
      description="Talebe ait işlem geçmişi"
      className="pt-0 px-4 md:px-6"
      tabs={<TalepTabs />}
      actions={
        <Button variant="outline" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz aktivite yok.</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.performedByUser?.name || activity.performedByUser?.email || 'Sistem'} • {new Date(activity.createdAt).toLocaleString('tr-TR')}
                    </p>
                    {(activity.oldValue || activity.newValue) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.oldValue && <span>Eski: {activity.oldValue}</span>}
                        {activity.oldValue && activity.newValue && ' → '}
                        {activity.newValue && <span>Yeni: {activity.newValue}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </CompanyPageLayout>
  );
}



