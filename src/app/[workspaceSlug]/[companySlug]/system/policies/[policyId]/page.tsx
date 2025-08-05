"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  Calendar,
  User,
  Building,
  Users
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";

// API functions
const fetchPolicy = async (policyId: string) => {
  try {
    const response = await fetch(`/api/system/policies/${policyId}`);
    if (!response.ok) throw new Error('Failed to fetch policy');
    return await response.json();
  } catch (error) {
    console.error('Error fetching policy:', error);
    throw error;
  }
};

const updatePolicy = async (policyId: string, policyData: any) => {
  try {
    const response = await fetch(`/api/system/policies/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData)
    });
    if (!response.ok) throw new Error('Failed to update policy');
    return await response.json();
  } catch (error) {
    console.error('Error updating policy:', error);
    throw error;
  }
};

const deletePolicy = async (policyId: string) => {
  try {
    const response = await fetch(`/api/system/policies/${policyId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete policy');
    return await response.json();
  } catch (error) {
    console.error('Error deleting policy:', error);
    throw error;
  }
};

const policyTypes = [
  { value: "privacy", label: "Gizlilik Politikası" },
  { value: "terms", label: "Hizmet Şartları" },
  { value: "compliance", label: "Uyumluluk Politikası" },
  { value: "security", label: "Güvenlik Politikası" },
  { value: "data", label: "Veri Yönetimi Politikası" },
  { value: "other", label: "Diğer" }
];

const statusOptions = [
  { value: "draft", label: "Taslak" },
  { value: "published", label: "Yayınlandı" },
  { value: "archived", label: "Arşivlendi" }
];

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const typeIcons = {
  privacy: "🔒",
  terms: "📋",
  compliance: "✅",
  security: "🛡️",
  data: "💾",
  other: "📄"
};

export default function PolicyDetailPage() {
  const [policy, setPolicy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    content: "",
    status: "draft"
  });

  const params = useParams();
  const router = useRouter();
  const policyId = params.policyId as string;

  // Load policy on component mount
  useEffect(() => {
    if (policyId) {
      loadPolicy();
    }
  }, [policyId]);

  const loadPolicy = async () => {
    setIsLoading(true);
    try {
      const policyData = await fetchPolicy(policyId);
      setPolicy(policyData);
      setFormData({
        title: policyData.title || "",
        type: policyData.type || "",
        content: policyData.content || "",
        status: policyData.status || "draft"
      });
    } catch (error) {
      console.error('Failed to load policy:', error);
      // Could add error state here
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original policy data
    if (policy) {
      setFormData({
        title: policy.title || "",
        type: policy.type || "",
        content: policy.content || "",
        status: policy.status || "draft"
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedPolicy = await updatePolicy(policyId, formData);
      setPolicy(updatedPolicy);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update policy:', error);
      // Could add error notification here
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePolicy(policyId);
      // Navigate back to policies list
      router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies`);
    } catch (error) {
      console.error('Failed to delete policy:', error);
      setIsDeleting(false);
      // Could add error notification here
    }
  };

  const handleBack = () => {
    router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies`);
  };

  const handleAssign = () => {
    router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies/${policyId}/assign`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPolicyTypeLabel = (type: string) => {
    return policyTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  if (isLoading) {
    return (
      <PageWrapper
        title="Politika Detayı"
        description="Politika yükleniyor..."
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Politika yükleniyor...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!policy) {
    return (
      <PageWrapper
        title="Politika Bulunamadı"
        description="Aradığınız politika bulunamadı"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Politika Bulunamadı</h3>
            <p className="text-muted-foreground mb-4">Aradığınız politika mevcut değil veya erişim yetkiniz bulunmuyor.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={policy.title}
      description="Politika detayları ve düzenleme"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={handleBack} 
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Politikalara Dön
          </Button>

          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
                <Button onClick={handleAssign} variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Ata
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Politikayı Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu politikayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve 
                        tüm atamalar da silinecektir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Siliniyor..." : "Sil"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {isEditing && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button 
                  onClick={handleCancelEdit} 
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  İptal
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {typeIcons[policy.type as keyof typeof typeIcons] || "📄"}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {isEditing ? (
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Politika başlığı"
                            className="text-xl font-semibold"
                          />
                        ) : (
                          policy.title
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isEditing ? (
                          <Select 
                            value={formData.type} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="w-48 mt-2">
                              <SelectValue placeholder="Politika türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {policyTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          getPolicyTypeLabel(policy.type)
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={statusColors[policy.status as keyof typeof statusColors]}>
                    {getStatusLabel(policy.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">İçerik</Label>
                  {isEditing ? (
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Politika içeriği"
                      rows={15}
                      className="min-h-[400px]"
                    />
                  ) : (
                    <div className="border rounded-md p-4 min-h-[400px] bg-muted/20">
                      {policy.content ? (
                        <div className="whitespace-pre-wrap text-sm">
                          {policy.content}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">İçerik bulunmuyor</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-6">
            {/* Policy Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Politika Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Oluşturuldu</p>
                    <p className="text-muted-foreground">{formatDate(policy.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Son Güncelleme</p>
                    <p className="text-muted-foreground">{formatDate(policy.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Oluşturan</p>
                    <p className="text-muted-foreground">{policy.createdBy}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${policy.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-muted-foreground">
                    {policy.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atamalar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Çalışma Alanları</span>
                  </div>
                  <Badge variant="secondary">{policy.assignedWorkspaces || 0}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Şirketler</span>
                  </div>
                  <Badge variant="secondary">{policy.assignedCompanies || 0}</Badge>
                </div>

                <Button 
                  onClick={handleAssign} 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Atamaları Yönet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}