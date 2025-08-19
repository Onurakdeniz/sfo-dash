"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building, Edit3, Trash2, Loader2, Plus, Building2, User, Mail, Target, Code, Users, ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/page-wrapper";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Department {
  id: string;
  companyId: string;
  parentDepartmentId?: string;
  locationId?: string;
  code?: string;
  name: string;
  description?: string;
  responsibilityArea?: string;
  goals?: {
    shortTerm?: string | null;
    mediumTerm?: string | null;
    longTerm?: string | null;
  };
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  mailAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  unitCount?: number;
}

interface Unit {
  id: string;
  name: string;
  code?: string;
  description?: string;
  staffCount: number;
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface UpdateDepartmentData {
  name?: string;
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

interface CreateUnitData {
  name: string;
  code?: string;
  description?: string;
  staffCount?: number;
  leadId?: string;
}

interface UpdateUnitData {
  name?: string;
  code?: string;
  description?: string;
  staffCount?: number;
  leadId?: string;
}

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const companyId = params.companyId as string;
  const departmentId = params.departmentId as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [showDeleteUnitDialog, setShowDeleteUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UpdateDepartmentData>({});
  const [unitFormData, setUnitFormData] = useState<CreateUnitData>({ name: '', code: '', staffCount: 0 });
  const [editUnitFormData, setEditUnitFormData] = useState<UpdateUnitData>({});

  // Fetch all workspaces and find by slug
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces', workspaceSlug],
    queryFn: async () => {
      try {
        const res = await fetch('/api/workspaces', {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!workspaceSlug,
  });

  // Find current workspace by slug
  const workspace = workspacesData?.workspaces?.find((w: Workspace) => w.slug === workspaceSlug) || null;

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Company not found');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Fetch department details
  const { data: department, isLoading: isLoadingDepartment, error } = useQuery({
    queryKey: ['department', workspace?.id, companyId, departmentId],
    queryFn: async () => {
      if (!workspace?.id) return null;
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Department not found');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching department:', error);
        throw error;
      }
    },
    enabled: !!workspace?.id && !!companyId && !!departmentId,
  });

  // Fetch units for the department
  const { data: units = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units', workspace?.id, companyId, departmentId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}/units`, {
          credentials: 'include'
        });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching units:', error);
        return [];
      }
    },
    enabled: !!workspace?.id && !!companyId && !!departmentId,
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

  // Fetch locations for optional location assignment
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', workspace?.id, companyId],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/locations`, { credentials: 'include' });
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
      }
    },
    enabled: !!workspace?.id && !!companyId,
  });

  // Fetch other departments for parent selection
  const { data: allDepartments = [] } = useQuery({
    queryKey: ['all-departments', workspace?.id, companyId],
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

  // Update department mutation
  const updateDepartment = useMutation({
    mutationFn: async (data: UpdateDepartmentData) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error('Failed to update department');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department', workspace?.id, companyId, departmentId] });
      queryClient.invalidateQueries({ queryKey: ['departments', workspace?.id, companyId] });
      setIsEditing(false);
      setFormData({});
      toast.success('Departman başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error('Departman güncelleme başarısız');
      console.error('Update department error:', error);
    },
  });

  // Delete department mutation
  const deleteDepartment = useMutation({
    mutationFn: async () => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        let message = 'Failed to delete department';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', workspace?.id, companyId] });
      toast.success('Departman başarıyla silindi');
      router.push(`/${workspaceSlug}/${companySlug}/companies/${companyId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Departman silme başarısız');
      console.error('Delete department error:', error);
    },
  });

  // Create unit mutation
  const createUnit = useMutation({
    mutationFn: async (data: CreateUnitData) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}/units`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error('Failed to create unit');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', workspace?.id, companyId, departmentId] });
      queryClient.invalidateQueries({ queryKey: ['department', workspace?.id, companyId, departmentId] });
      setShowCreateUnitModal(false);
      setUnitFormData({ name: '', code: '', staffCount: 0 });
      toast.success('Birim başarıyla oluşturuldu');
    },
    onError: (error) => {
      toast.error('Birim oluşturma başarısız');
      console.error('Create unit error:', error);
    },
  });

  // Update unit mutation
  const updateUnit = useMutation({
    mutationFn: async (data: UpdateUnitData) => {
      if (!workspace?.id || !selectedUnit) throw new Error('Workspace or unit not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}/units/${selectedUnit.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error('Failed to update unit');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', workspace?.id, companyId, departmentId] });
      queryClient.invalidateQueries({ queryKey: ['department', workspace?.id, companyId, departmentId] });
      setShowEditUnitModal(false);
      setSelectedUnit(null);
      setEditUnitFormData({});
      toast.success('Birim başarıyla güncellendi');
    },
    onError: (error) => {
      toast.error('Birim güncelleme başarısız');
      console.error('Update unit error:', error);
    },
  });

  // Delete unit mutation
  const deleteUnit = useMutation({
    mutationFn: async (unitId: string) => {
      if (!workspace?.id) throw new Error('Workspace not found');
      const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${departmentId}/units/${unitId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        let message = 'Failed to delete unit';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', workspace?.id, companyId, departmentId] });
      queryClient.invalidateQueries({ queryKey: ['department', workspace?.id, companyId, departmentId] });
      setShowDeleteUnitDialog(false);
      setSelectedUnit(null);
      toast.success('Birim başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Birim silme başarısız');
      console.error('Delete unit error:', error);
    },
  });

  const handleEdit = () => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        responsibilityArea: department.responsibilityArea || '',
        goals: {
          shortTerm: department.goals?.shortTerm || '',
          mediumTerm: department.goals?.mediumTerm || '',
          longTerm: department.goals?.longTerm || ''
        },
        managerId: department.managerId || '',
        parentDepartmentId: department.parentDepartmentId || '',
        locationId: department.locationId || '',
        mailAddress: department.mailAddress || '',
        notes: department.notes || ''
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSaveEdit = () => {
    if (!formData.name?.trim()) {
      toast.error('Departman adı zorunludur');
      return;
    }

    const updateData: UpdateDepartmentData = {
      name: formData.name?.trim() || department.name,
      code: formData.code?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      responsibilityArea: formData.responsibilityArea?.trim() || undefined,
      goals: {
        shortTerm: formData.goals?.shortTerm?.trim() || undefined,
        mediumTerm: formData.goals?.mediumTerm?.trim() || undefined,
        longTerm: formData.goals?.longTerm?.trim() || undefined,
      },
      managerId: formData.managerId || undefined,
      parentDepartmentId: formData.parentDepartmentId || undefined,
      locationId: formData.locationId || undefined,
      mailAddress: formData.mailAddress?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    updateDepartment.mutate(updateData);
  };

  const handleInputChange = (field: keyof UpdateDepartmentData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateUnit = () => {
    if (!unitFormData.name?.trim()) {
      toast.error('Birim adı zorunludur');
      return;
    }

    const createData: CreateUnitData = {
      name: unitFormData.name.trim(),
      code: unitFormData.code?.trim() || undefined,
      description: unitFormData.description?.trim() || undefined,
      staffCount: unitFormData.staffCount || 0,
      leadId: unitFormData.leadId || undefined,
    };

    createUnit.mutate(createData);
  };

  const handleEditUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setEditUnitFormData({
      name: unit.name,
      code: unit.code || '',
      description: unit.description || '',
      staffCount: unit.staffCount,
      leadId: unit.leadId || '',
    });
    setShowEditUnitModal(true);
  };

  const handleUpdateUnit = () => {
    if (!editUnitFormData.name?.trim()) {
      toast.error('Birim adı zorunludur');
      return;
    }

    const updateData: UpdateUnitData = {
      name: editUnitFormData.name?.trim(),
      code: editUnitFormData.code?.trim() || undefined,
      description: editUnitFormData.description?.trim() || undefined,
      staffCount: editUnitFormData.staffCount || 0,
      leadId: editUnitFormData.leadId || undefined,
    };

    updateUnit.mutate(updateData);
  };

  const handleDeleteUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowDeleteUnitDialog(true);
  };

  const confirmDeleteUnit = () => {
    if (selectedUnit) {
      deleteUnit.mutate(selectedUnit.id);
    }
  };

  const handleUnitInputChange = (field: keyof CreateUnitData, value: string | number) => {
    setUnitFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditUnitInputChange = (field: keyof UpdateUnitData, value: string | number) => {
    setEditUnitFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoalChange = (goalType: 'shortTerm' | 'mediumTerm' | 'longTerm', value: string) => {
    setFormData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalType]: value
      }
    }));
  };

  // Show loading state
  if (isLoadingWorkspaces || isLoadingDepartment || isLoadingCompany) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erişim Reddedildi
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Bu çalışma alanına erişim izniniz yok veya çalışma alanı bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  // Show error if department not found
  if (error || !department) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Departman Bulunamadı
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Departman bulunamadı veya bu departmana erişim izniniz yok.
          </p>
          <Link href={`/${workspaceSlug}/${companySlug}/companies/${companyId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Şirket Detayına Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Create custom breadcrumbs with company name and department name
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
      label: department?.name || 'Departman',
      isLast: true
    }
  ];

  return (
    <PageWrapper
      title={department.name}
      description="Departman detayları ve birim yönetimi"
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button onClick={handleEdit} variant="outline">
                <Edit3 className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
              <Button 
                onClick={() => setShowDeleteDialog(true)} 
                variant="outline" 
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelEdit} variant="outline">
                İptal
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateDepartment.isPending}>
                {updateDepartment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-8">
            {/* Basic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
                <CardDescription>
                  Departmanın temel bilgilerini düzenleyin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Departman Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
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
                        {allDepartments.filter((d: Department) => d.id !== departmentId).map((dept: Department) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Bağlı Lokasyon</Label>
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

            {/* Goals Section - collapsible and less prominent (after management) */}
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
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Departman Bilgileri
              </CardTitle>
              <CardDescription>
                Departmanın detaylı bilgileri ve yapılandırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold">Temel Bilgiler</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Departman Adı</Label>
                      <p className="font-semibold">{department.name}</p>
                    </div>
                    {department.code && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Departman Kodu</Label>
                        <Badge variant="secondary" className="w-fit">
                          <Code className="h-3 w-3 mr-1" />
                          {department.code}
                        </Badge>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Birim Sayısı</Label>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{department.unitCount || 0} birim</span>
                      </div>
                    </div>
                  </div>

                  {department.locationId && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Bağlı Lokasyon</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{locations.find((l: any) => l.id === department.locationId)?.name || department.locationId}</span>
                      </div>
                    </div>
                  )}

                  {department.description && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Açıklama</Label>
                      <p className="text-sm whitespace-pre-wrap bg-muted/20 p-3 rounded-lg">{department.description}</p>
                    </div>
                  )}

                  {department.responsibilityArea && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Sorumluluk Alanı</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/20 p-3 rounded-lg">{department.responsibilityArea}</p>
                  </div>
                  )}
                </div>

                {/* Management & Contact first, Goals after and collapsible */}

                {/* Management & Contact */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-semibold">Yönetim & İletişim</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Departman Yöneticisi</Label>
                      {department.managerName ? (
                        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className="p-2 bg-muted rounded-full">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{department.managerName}</p>
                            {department.managerEmail && (
                              <p className="text-sm text-muted-foreground">{department.managerEmail}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">Atanmamış</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Departman E-posta</Label>
                      {department.mailAddress ? (
                        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className="p-2 bg-muted rounded-full">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="font-medium">{department.mailAddress}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">E-posta adresi yok</p>
                      )}
                    </div>
                  </div>

                  {department.notes && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Notlar</Label>
                      <p className="text-sm whitespace-pre-wrap bg-muted/20 p-3 rounded-lg">{department.notes}</p>
                    </div>
                  )}
                </div>

                {/* Goals Section - collapsed by default and placed after management */}
                {(department.goals?.shortTerm || department.goals?.mediumTerm || department.goals?.longTerm) && (
                  <Collapsible defaultOpen={false}>
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-4 justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-600" />
                          <h4 className="text-lg font-semibold">Hedefler</h4>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="gap-1">
                            Aç/Kapat
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="grid gap-4">
                          {department.goals?.shortTerm && (
                            <div className="p-4 bg-muted/20 rounded-lg">
                              <h5 className="font-semibold mb-2">Kısa Vadeli Hedefler</h5>
                              <p className="text-sm whitespace-pre-wrap">{department.goals.shortTerm}</p>
                            </div>
                          )}
                          {department.goals?.mediumTerm && (
                            <div className="p-4 bg-muted/20 rounded-lg">
                              <h5 className="font-semibold mb-2">Orta Vadeli Hedefler</h5>
                              <p className="text-sm whitespace-pre-wrap">{department.goals.mediumTerm}</p>
                            </div>
                          )}
                          {department.goals?.longTerm && (
                            <div className="p-4 bg-muted/20 rounded-lg">
                              <h5 className="font-semibold mb-2">Uzun Vadeli Hedefler</h5>
                              <p className="text-sm whitespace-pre-wrap">{department.goals.longTerm}</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Oluşturulma Tarihi</Label>
                    <p className="text-sm">{new Date(department.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Son Güncelleme</Label>
                    <p className="text-sm">{new Date(department.updatedAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Units Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Birimler
                </CardTitle>
                <CardDescription>
                  {units.length > 0 ? `${units.length} birim bulundu` : 'Henüz birim eklenmemiş'}
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateUnitModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Birim Oluştur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUnits ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <Building2 className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Henüz birim yok
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Bu departmanda henüz birim eklenmemiş. İlk biriminizi ekleyerek başlayın.
                </p>
                <Button onClick={() => setShowCreateUnitModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Biriminizi Ekleyin
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Birim Adı</TableHead>
                    <TableHead>Birim Kodu</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kapasite (Personel)</TableHead>
                    <TableHead>Birim Lideri</TableHead>
                    <TableHead>Oluşturma Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
          {units.map((unitItem: Unit) => (
            <TableRow key={unitItem.id}>
              <TableCell className="font-medium">{unitItem.name}</TableCell>
              <TableCell className="max-w-[120px] truncate">{unitItem.code || '-'}</TableCell>
              <TableCell className="max-w-xs truncate">{unitItem.description || 'Açıklama yok'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{unitItem.staffCount}</span>
                </div>
              </TableCell>
              <TableCell>
                {unitItem.leadName ? (
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-100 rounded-full">
                      <User className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{unitItem.leadName}</p>
                      {unitItem.leadEmail && (
                        <p className="text-xs text-muted-foreground">{unitItem.leadEmail}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Lider atanmamış</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(unitItem.createdAt).toLocaleDateString('tr-TR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUnit(unitItem)}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteUnit(unitItem)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Sil
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Unit Modal */}
      <Dialog open={showCreateUnitModal} onOpenChange={setShowCreateUnitModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Birim Oluştur</DialogTitle>
            <DialogDescription>
              Departman için yeni bir birim oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Birim Adı *</Label>
              <Input
                id="unit-name"
                value={unitFormData.name}
                onChange={(e) => handleUnitInputChange('name', e.target.value)}
                placeholder="Birim adını girin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-code">Birim Kodu</Label>
              <Input
                id="unit-code"
                value={unitFormData.code || ''}
                onChange={(e) => handleUnitInputChange('code', e.target.value)}
                placeholder="Örn: HR-REC, IT-NET"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-description">Açıklama</Label>
              <Textarea
                id="unit-description"
                value={unitFormData.description || ''}
                onChange={(e) => handleUnitInputChange('description', e.target.value)}
                placeholder="Birim açıklaması (opsiyonel)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-staff-count">Kapasite (Personel)</Label>
                <Input
                  id="unit-staff-count"
                  type="number"
                  min="0"
                  value={unitFormData.staffCount || 0}
                  onChange={(e) => handleUnitInputChange('staffCount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-lead">Birim Lideri</Label>
                <Select
                  value={unitFormData.leadId || 'unassigned'}
                  onValueChange={(value) => handleUnitInputChange('leadId', value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lider seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Lider atanmamış</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateUnitModal(false);
                setUnitFormData({ name: '', code: '', staffCount: 0 });
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={handleCreateUnit}
              disabled={createUnit.isPending || !unitFormData.name?.trim()}
            >
              {createUnit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                'Oluştur'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={showEditUnitModal} onOpenChange={setShowEditUnitModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Birim Düzenle</DialogTitle>
            <DialogDescription>
              Birim bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unit-name">Birim Adı *</Label>
              <Input
                id="edit-unit-name"
                value={editUnitFormData.name || ''}
                onChange={(e) => handleEditUnitInputChange('name', e.target.value)}
                placeholder="Birim adını girin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit-code">Birim Kodu</Label>
              <Input
                id="edit-unit-code"
                value={editUnitFormData.code || ''}
                onChange={(e) => handleEditUnitInputChange('code', e.target.value)}
                placeholder="Örn: HR-REC, IT-NET"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit-description">Açıklama</Label>
              <Textarea
                id="edit-unit-description"
                value={editUnitFormData.description || ''}
                onChange={(e) => handleEditUnitInputChange('description', e.target.value)}
                placeholder="Birim açıklaması (opsiyonel)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit-staff-count">Kapasite (Personel)</Label>
                <Input
                  id="edit-unit-staff-count"
                  type="number"
                  min="0"
                  value={editUnitFormData.staffCount || 0}
                  onChange={(e) => handleEditUnitInputChange('staffCount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit-lead">Birim Lideri</Label>
                <Select
                  value={editUnitFormData.leadId || 'unassigned'}
                  onValueChange={(value) => handleEditUnitInputChange('leadId', value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lider seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Lider atanmamış</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditUnitModal(false);
                setSelectedUnit(null);
                setEditUnitFormData({});
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={handleUpdateUnit}
              disabled={updateUnit.isPending || !editUnitFormData.name?.trim()}
            >
              {updateUnit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Güncelle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <AlertDialog open={showDeleteUnitDialog} onOpenChange={setShowDeleteUnitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Birimi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. "{selectedUnit?.name}" birimini kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteUnitDialog(false);
              setSelectedUnit(null);
            }}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUnit}
              disabled={deleteUnit.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUnit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Department Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, "{department.name}" departmanını kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDepartment.mutate()}
              disabled={deleteDepartment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDepartment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}