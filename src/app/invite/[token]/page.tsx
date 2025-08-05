"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { AlertCircle, CheckCircle2, Users, Building } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface InvitationData {
  id: string;
  email: string;
  type: 'workspace' | 'company';
  role: string;
  workspaceId?: string;
  companyId?: string;
  message?: string;
  invitedBy: string;
  expiresAt: string;
  workspace?: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  inviter?: {
    name: string;
    email: string;
  };
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  // Fetch invitation details on mount
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Geçersiz davetiye bağlantısı");
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Fetching invitation for token:", token);
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        console.log("🔍 API Response:", {
          status: response.status,
          ok: response.ok,
          data: data
        });

        if (!response.ok) {
          console.error("❌ API Error:", data);
          setError(data.error || "Davetiye bilgileri alınamadı");
          setLoading(false);
          return;
        }

        console.log("✅ Invitation data received:", data.invitation);
        setInvitation(data.invitation);
      } catch (err) {
        console.error("❌ Network/Fetch Error:", err);
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSignupLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError("İsim alanı zorunludur");
      setSignupLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setSignupLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setSignupLoading(false);
      return;
    }

    if (!invitation) {
      setError("Davetiye bilgileri bulunamadı");
      setSignupLoading(false);
      return;
    }

    try {
      // Accept invitation and create user
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Hesap oluşturulurken bir hata oluştu");
        setSignupLoading(false);
        return;
      }

      // Sign in the user
      try {
        await authClient.signIn.email({
          email: invitation.email,
          password: formData.password,
        });

        setSuccess(true);
        
        // Redirect to workspace after a short delay
        setTimeout(() => {
          if (data.workspace && data.workspace.slug && data.company && data.company.slug) {
            // Redirect to workspace + company combination
            router.push(`/${data.workspace.slug}/${data.company.slug}`);
          } else if (data.workspace && data.workspace.slug) {
            // Fallback to workspace root if no company
            router.push(`/${data.workspace.slug}`);
          } else {
            router.push('/');
          }
        }, 2000);
      } catch (signInError) {
        console.error("Auto sign-in failed:", signInError);
        setSuccess(true);
        // Redirect to sign-in page if auto sign-in fails
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setSignupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Davetiye bilgileri yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Davetiye Geçersiz</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/signin')}>
                Giriş Sayfasına Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Hesabınız Oluşturuldu!</h2>
              <p className="text-muted-foreground mb-4">
                {invitation?.workspace?.name} çalışma alanına başarıyla katıldınız.
              </p>
              <p className="text-sm text-muted-foreground">
                Çalışma alanına yönlendiriliyorsunuz...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Luna<span className="text-blue-600">Manager</span>
            </h1>
          </div>
        </div>

        {/* Invitation Details */}
        {invitation && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                {invitation.type === 'workspace' ? (
                  <Users className="w-6 h-6 text-blue-600" />
                ) : (
                  <Building className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <CardTitle className="text-xl">Çalışma Alanı Davetiyesi</CardTitle>
              <CardDescription>
                <strong>{invitation.workspace?.name || invitation.company?.name}</strong> 
                {' '}takımına katılmak için davet edildiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm">
                  <p><strong>E-posta:</strong> {invitation.email}</p>
                  <p><strong>Rol:</strong> {invitation.role}</p>
                  {invitation.inviter && (
                    <p><strong>Davet Eden:</strong> {invitation.inviter.name}</p>
                  )}
                  {invitation.message && (
                    <div className="mt-2 p-2 bg-white rounded border-l-2 border-blue-400">
                      <p className="text-sm italic">"{invitation.message}"</p>
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Davetiyeniz <strong>{new Date(invitation.expiresAt).toLocaleDateString()}</strong> tarihine kadar geçerlidir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Signup Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Hesabınızı Oluşturun</CardTitle>
            <CardDescription className="text-center">
              Davetiyenizi kabul etmek için hesap bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                  type="email"
                  id="email"
                  value={invitation?.email || ''}
                  disabled
                  className="h-11 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrarı</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="h-11"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit" 
                disabled={signupLoading || !authClient}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
              >
                {signupLoading ? "Hesap Oluşturuluyor..." : "Davetiyeyi Kabul Et ve Hesap Oluştur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">Versiyon 2.0.0</p>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Tüm sistemler çalışıyor</span>
          </div>
        </div>
      </div>
    </div>
  );
}