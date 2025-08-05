"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Company {
  id: string;
  name: string;
  slug?: string;
}

interface Department {
  id: string;
  name: string;
}

interface CreateDepartmentData {
  name: string;
  code?: string;
  description?: string;
  responsibilityArea?: string;
  goals?: {
    shortTerm?: string;
    mediumTerm?: string;
    longTerm?: string;
  };
  managerId?: string;
  parentDepartmentId?: string;
  mailAddress?: string;
  notes?: string;
}

export default function AddDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;

  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: '',
    code: '',
    description: '',
    responsibilityArea: '',
    goals: {
      shortTerm: '',
      mediumTerm: '',
      longTerm: ''
    },
    managerId: '',
    parentDepartmentId: '',
    mailAddress: '',
    notes: ''
  });

  // Get workspace info
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Find current workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: any) => w.slug === workspaceSlug);

  // Get company info
  const { data: company } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Fetch users for manager selection
  const { data: users = [] } = useQuery({
    queryKey: ['users', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.members || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  // Fetch existing departments for parent selection
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Create department mutation
  const createDepartment = useMutation({
    mutationFn: async (data: CreateDepartmentData) => {
      if (!workspace?.id) {
        throw new Error('Workspace not found');
      }

      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create department');
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Departman başarıyla oluşturuldu');
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Departman oluşturma başarısız');
      console.error('Create department error:', error);
    },
  });

  const handleInputChange = (field: keyof CreateDepartmentData, value: string) =>
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

  const handleGoalChange = (goalType: 'shortTerm' | 'mediumTerm' | 'longTerm', value: string) => {
    setFormData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalType]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Departman adı zorunludur');
      return;
    }

    // Filter out empty strings and prepare goals
    const cleanData: Partial<CreateDepartmentData> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'goals') {
        // Handle goals object
        const goals = value as CreateDepartmentData['goals'];
        const cleanGoals = {
          shortTerm: goals?.shortTerm?.trim() || null,
          mediumTerm: goals?.mediumTerm?.trim() || null,
          longTerm: goals?.longTerm?.trim() || null,
        };
        if (cleanGoals.shortTerm || cleanGoals.mediumTerm || cleanGoals.longTerm) {
          cleanData.goals = cleanGoals;
        }
      } else if (value && typeof value === 'string' && value.trim() !== '') {
        (cleanData as any)[key] = value.trim();
      }
    });

    // Ensure required fields are present
    if (!cleanData.name) {
      toast.error('Departman adı zorunludur');
      return;
    }

    createDepartment.mutate(cleanData as CreateDepartmentData);
  };

  // Create custom breadcrumbs
  const breadcrumbs = [
    {
      label: company?.name || 'Şirket',
      href: `/${workspaceSlug}/${companySlug}/companies/${companyId}`,
      isLast: false
    },
    {
      label: 'Departmanlar',
      href: `/${workspaceSlug}/${companySlug}/companies/${companyId}/departments`,
      isLast: false
    },
    {
      label: 'Yeni Departman',
      isLast: true
    }
  ];

  return (
    <PageWrapper
      title="Yeni Departman Oluştur"
      description={`${company?.name || 'Şirket'} için yeni departman ekleyin`}
      breadcrumbs={breadcrumbs}
      actions={
        <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
            <CardDescription>
              Departmanın temel bilgilerini girin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Departman Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Departman adını girin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Departman Kodu</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="HR, IT, SALES vb."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Departmanın genel açıklaması"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibility-area">Sorumluluk Alanı</Label>
              <Textarea
                id="responsibility-area"
                value={formData.responsibilityArea || ''}
                onChange={(e) => handleInputChange('responsibilityArea', e.target.value)}
                placeholder="Departmanın sorumluluk alanını detaylıca açıklayın"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hedefler</CardTitle>
            <CardDescription>
              Departmanın kısa, orta ve uzun vadeli hedeflerini belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="short-term-goals">Kısa Vadeli Hedefler</Label>
              <Textarea
                id="short-term-goals"
                value={formData.goals?.shortTerm || ''}
                onChange={(e) => handleGoalChange('shortTerm', e.target.value)}
                placeholder="Bu yıl içinde gerçekleştirilmesi hedeflenen amaçlar"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medium-term-goals">Orta Vadeli Hedefler</Label>
              <Textarea
                id="medium-term-goals"
                value={formData.goals?.mediumTerm || ''}
                onChange={(e) => handleGoalChange('mediumTerm', e.target.value)}
                placeholder="1-3 yıl içinde ulaşılması hedeflenen amaçlar"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="long-term-goals">Uzun Vadeli Hedefler</Label>
              <Textarea
                id="long-term-goals"
                value={formData.goals?.longTerm || ''}
                onChange={(e) => handleGoalChange('longTerm', e.target.value)}
                placeholder="3+ yıl içinde gerçekleştirilmesi hedeflenen stratejik amaçlar"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Management & Communication Section */}
        <Card>
          <CardHeader>
            <CardTitle>Yönetim & İletişim</CardTitle>
            <CardDescription>
              Departman yöneticisi, üst departman ve iletişim bilgilerini belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="manager-select">Departman Yöneticisi</Label>
                <Select
                  value={formData.managerId || 'unassigned'}
                  onValueChange={(value) => handleInputChange('managerId', value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yönetici seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Yönetici atanmamış</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parent-department">Bağlı Olduğu Departman</Label>
                <Select
                  value={formData.parentDepartmentId || 'none'}
                  onValueChange={(value) => handleInputChange('parentDepartmentId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Üst departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Üst departman yok</SelectItem>
                    {departments.map((dept: Department) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mail-address">Departman E-posta Adresi</Label>
              <Input
                id="mail-address"
                type="email"
                value={formData.mailAddress || ''}
                onChange={(e) => handleInputChange('mailAddress', e.target.value)}
                placeholder="departman@sirket.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Departman hakkında ek notlar"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}/departments`}>
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={createDepartment.isPending || !formData.name.trim()}
          >
            {createDepartment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              'Departman Oluştur'
            )}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}