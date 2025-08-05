"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageWrapper } from "@/components/page-wrapper";
import { ArrowLeft, Save } from "lucide-react";

interface PolicyFormData {
  title: string;
  type: string;
  content: string;
  status: string;
}

export default function NewPolicyPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<PolicyFormData>({
    title: "",
    type: "",
    content: "",
    status: "draft"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/system/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create policy');
      }

      // Redirect back to policies list
      router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies`);
    } catch (error) {
      console.error('Error creating policy:', error);
      // You might want to add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies`);
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Politikalara Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Politika</h1>
            <p className="text-muted-foreground">Yeni bir organizasyon politikası oluşturun</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Politika Detayları</CardTitle>
            <CardDescription>
              Yeni politika için detayları doldurun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Politika Başlığı</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Politika başlığını girin"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Politika Türü</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Politika türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privacy">Gizlilik Politikası</SelectItem>
                      <SelectItem value="terms">Hizmet Şartları</SelectItem>
                      <SelectItem value="security">Güvenlik Politikası</SelectItem>
                      <SelectItem value="compliance">Uyumluluk Politikası</SelectItem>
                      <SelectItem value="hr">İK Politikası</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="review">İnceleme Altında</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="published">Yayınlandı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Politika İçeriği</Label>
                <Textarea
                  id="content"
                  placeholder="Politika içeriğini girin..."
                  className="min-h-64"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.type || !formData.content}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Oluşturuluyor...' : 'Politika Oluştur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}