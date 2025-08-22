"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { AlertCircle, CheckCircle2, Users, Building, Mail, Shield, Clock, Sparkles, Phone } from "lucide-react";
export const runtime = 'edge';

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

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);

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

    if (!phoneVerified) {
      setError("Lütfen telefon numaranızı doğrulayın");
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
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Hesap oluşturulurken bir hata oluştu");
        setSignupLoading(false);
        return;
      }

      // If a new user was created, attempt sign-in with the provided password; otherwise route to sign-in
      if (data.createdNewUser) {
        try {
          await authClient.signIn.email({
            email: invitation.email,
            password: formData.password,
          });
          setSuccess(true);
          setTimeout(() => {
            if (data.workspace && data.workspace.slug && data.company && data.company.slug) {
              router.push(`/${data.workspace.slug}/${data.company.slug}`);
            } else if (data.workspace && data.workspace.slug) {
              router.push(`/${data.workspace.slug}`);
            } else {
              router.push('/');
            }
          }, 2000);
        } catch (signInError) {
          console.error("Auto sign-in failed:", signInError);
          setSuccess(true);
          setTimeout(() => {
            router.push('/signin');
          }, 2000);
        }
      } else {
        // Existing users won't have a new password set here; route them to sign-in
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 1500);
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setSignupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-purple-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-lg font-medium text-slate-800">Davetiye Yükleniyor</p>
                <p className="text-sm text-slate-500">Bilgilerinizi alıyoruz...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-pink-100">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800">Davetiye Geçersiz</h2>
                <p className="text-slate-600 leading-relaxed">{error}</p>
              </div>
              <Button 
                onClick={() => router.push('/signin')}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">Hoş Geldiniz! 🎉</h2>
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">
                    <span className="text-green-600 font-semibold">{invitation?.workspace?.name}</span> çalışma alanına başarıyla katıldınız.
                  </p>
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Çalışma alanına yönlendiriliyorsunuz...
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto space-y-8">
        {/* Modern Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-3 rounded-2xl shadow-lg mr-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Luna<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Manager</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Çalışma Alanı Yönetim Sistemi</p>
            </div>
          </div>
        </div>

        {/* Invitation Details */}
        {invitation && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  {invitation.type === 'workspace' ? (
                    <Users className="w-8 h-8 text-white" />
                  ) : (
                    <Building className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Davetiye</h2>
                  <p className="text-blue-100">
                    <strong>{invitation.workspace?.name || invitation.company?.name}</strong> 
                    {' '}takımına katılmaya davet edildiniz
                  </p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">E-posta Adresiniz</p>
                      <p className="font-medium text-slate-800">{invitation.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Rolünüz</p>
                      <p className="font-medium text-slate-800 capitalize">{invitation.role}</p>
                    </div>
                  </div>
                </div>

                {invitation.inviter && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Sizi Davet Eden</p>
                        <p className="font-medium text-slate-800">{invitation.inviter.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {invitation.message && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-2">Özel Mesaj</p>
                    <p className="text-slate-700 italic font-medium">"{invitation.message}"</p>
                  </div>
                )}
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Bu davetiye <strong>{new Date(invitation.expiresAt).toLocaleDateString('tr-TR')}</strong> tarihine kadar geçerlidir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Signup Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-800">Hesabınızı Oluşturun</CardTitle>
              <CardDescription className="text-slate-600">
                Davetiyenizi kabul etmek için hesap bilgilerinizi girin
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Ad Soyad</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Adınız ve Soyadınız"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-slate-200 bg-white/50 focus:bg-white transition-colors duration-200 rounded-lg"
                />
              </div>
              
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-posta Adresi</Label>
                <div className="relative">
                  <Input
                    type="email"
                    id="email"
                    value={invitation?.email || ''}
                    disabled
                    className="h-12 bg-slate-50 border-slate-200 text-slate-600 rounded-lg pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefon Numarası</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Örn: +90555XXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 border-slate-200 bg-white/50 focus:bg-white transition-colors duration-200 rounded-lg pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      setPhoneMessage(null);
                      setError("");
                      setPhoneSending(true);
                      try {
                        const res = await fetch('/api/auth/phone-verification/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setError(data.message || 'Kod gönderilemedi');
                        } else {
                          if (data.debugToken) {
                            setPhoneMessage(`Geliştirme modunda kod: ${data.debugToken}`);
                            setPhoneCode(data.debugToken);
                          } else {
                            setPhoneMessage('Doğrulama kodu gönderildi');
                          }
                        }
                      } catch (err) {
                        setError('Beklenmeyen bir hata oluştu');
                      } finally {
                        setPhoneSending(false);
                      }
                    }}
                    disabled={phoneSending || !phone || phoneVerified}
                    className="h-12"
                  >
                    {phoneSending ? 'Gönderiliyor...' : (phoneVerified ? 'Doğrulandı' : 'Kodu Gönder')}
                  </Button>
                </div>
                {phoneMessage && (
                  <p className="text-sm text-green-600">{phoneMessage}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="phoneCode" className="text-sm font-medium text-slate-700">SMS Doğrulama Kodu</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    id="phoneCode"
                    name="phoneCode"
                    placeholder="4 haneli kod"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="h-12 border-slate-200 bg-white/50 focus:bg-white transition-colors duration-200 rounded-lg"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      setError("");
                      setPhoneVerifying(true);
                      try {
                        const res = await fetch('/api/auth/phone-verification/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone, token: phoneCode }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setError(data.message || 'Kod doğrulanamadı');
                          setPhoneVerified(false);
                        } else {
                          setPhoneVerified(true);
                          setPhoneMessage('Telefon numarası doğrulandı');
                        }
                      } catch (err) {
                        setError('Beklenmeyen bir hata oluştu');
                        setPhoneVerified(false);
                      } finally {
                        setPhoneVerifying(false);
                      }
                    }}
                    disabled={phoneVerifying || !phone || !phoneCode || phoneVerified}
                    className="h-12"
                  >
                    {phoneVerifying ? 'Doğrulanıyor...' : (phoneVerified ? 'Doğrulandı' : 'Doğrula')}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Şifre</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-slate-200 bg-white/50 focus:bg-white transition-colors duration-200 rounded-lg"
                />
              </div>
              
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Şifre Tekrarı</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Şifrenizi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-slate-200 bg-white/50 focus:bg-white transition-colors duration-200 rounded-lg"
                />
              </div>
              
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                disabled={signupLoading || !authClient || !phoneVerified}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {signupLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Hesap Oluşturuluyor...</span>
                  </div>
                ) : (
                  "Davetiyeyi Kabul Et ve Hesap Oluştur"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 pt-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-600">Sistem Durumu: Aktif</span>
              </div>
              <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
              <span className="text-slate-500">v2.0.0</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            © 2024 Yönetim Sistemi. Güvenli bağlantı ile korunmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}