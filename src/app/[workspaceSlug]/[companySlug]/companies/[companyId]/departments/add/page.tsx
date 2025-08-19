"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2, ChevronDown, Info } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

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
  locationId?: string;
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
    locationId: '',
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

  // Fetch locations for optional location assignment
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching locations:', error);
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
      <TooltipProvider>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="name">Departman Adı *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Departman adını girin. Bu alan zorunludur.</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Örn: İnsan Kaynakları"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="code">Departman Kodu</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Kısa kod (örn. HR, IT, SALES). Raporlama ve filtrelemede kullanılır.</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Örn: HR (İnsan Kaynakları)"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Departmanın genel amacı ve kapsamını kısaca açıklayın.</TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Örn: Çalışan yaşam döngüsü yönetimi, işe alım, eğitim ve performans."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="responsibility-area">Sorumluluk Alanı</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Departmanın sorumlu olduğu iş, süreç ve teslimleri detaylandırın.</TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="responsibility-area"
                value={formData.responsibilityArea || ''}
                onChange={(e) => handleInputChange('responsibilityArea', e.target.value)}
                placeholder="Örn: İşe alım, oryantasyon, bordro koordinasyonu, performans değerlendirme ve yan haklar."
                rows={4}
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="manager-select">Departman Yöneticisi</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Bu departmandan sorumlu ana kişi.</TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="parent-department">Bağlı Olduğu Departman</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Hiyerarşide üst/bağlı olunan departman.</TooltipContent>
                  </Tooltip>
                </div>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="location">Bağlı Lokasyon</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Opsiyonel: Departmanı bir lokasyona bağlayın.</TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.locationId || 'none'}
                onValueChange={(value) => handleInputChange('locationId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lokasyon seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Lokasyon yok</SelectItem>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} {loc.isHeadquarters ? '(Merkez)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mail-address">Departman E-posta Adresi</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Departmanın ortak e-posta adresi (örn. departman@sirket.com).</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="mail-address"
                type="email"
                value={formData.mailAddress || ''}
                onChange={(e) => handleInputChange('mailAddress', e.target.value)}
                placeholder="Örn: ik@sirket.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="notes">Notlar</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Departman hakkında ek notlar (iç kullanım).</TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Örn: 2025 İK bütçesi onay sürecinde."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goals Section - moved to bottom and collapsible */}
        <Collapsible defaultOpen={false}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hedefler</CardTitle>
                <CardDescription>
                  Departmanın kısa, orta ve uzun vadeli hedeflerini belirleyin.
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="gap-1">
                  Aç/Kapat
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="short-term-goals">Kısa Vadeli Hedefler</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Önümüzdeki 0-12 ay içinde ulaşılacak hedefler.</TooltipContent>
                  </Tooltip>
                  </div>
                  <Textarea
                    id="short-term-goals"
                    value={formData.goals?.shortTerm || ''}
                    onChange={(e) => handleGoalChange('shortTerm', e.target.value)}
                    placeholder="Örn: Q4 sonuna kadar işe alım süresini ortalama 30 güne düşürmek."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="medium-term-goals">Orta Vadeli Hedefler</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">1-3 yıl aralığındaki hedefler.</TooltipContent>
                  </Tooltip>
                  </div>
                  <Textarea
                    id="medium-term-goals"
                    value={formData.goals?.mediumTerm || ''}
                    onChange={(e) => handleGoalChange('mediumTerm', e.target.value)}
                    placeholder="Örn: 12 ay içinde çalışan memnuniyet skorunu %10 artırmak."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="long-term-goals">Uzun Vadeli Hedefler</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/50">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">3+ yıl ufkunda stratejik hedefler.</TooltipContent>
                  </Tooltip>
                  </div>
                  <Textarea
                    id="long-term-goals"
                    value={formData.goals?.longTerm || ''}
                    onChange={(e) => handleGoalChange('longTerm', e.target.value)}
                    placeholder="Örn: 3 yıl içinde yetenek yönetimi programını devreye almak."
                    rows={3}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
      </TooltipProvider>
    </PageWrapper>
  );
}