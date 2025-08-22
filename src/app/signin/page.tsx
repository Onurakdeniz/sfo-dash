"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [attemptCount, setAttemptCount] = useState(0);

    // Validation functions
    const validateEmail = (email: string): string | undefined => {
        if (!email) return "E-posta adresi gereklidir";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Geçerli bir e-posta adresi girin";
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return "Şifre gereklidir";
        if (password.length < 1) return "Şifre gereklidir";
        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;
        
        const passwordError = validatePassword(password);
        if (passwordError) newErrors.password = passwordError;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getErrorMessage = (error: any, attemptCount: number): string => {
        const message = error?.message?.toLowerCase() || "";
        const statusCode = error?.status || error?.response?.status || 0;
        
        // Handle 401 Unauthorized specifically (which includes invalid password)
        if (statusCode === 401 || message.includes("invalid password") || message.includes("wrong password") || message.includes("unauthorized")) {
            if (attemptCount >= 3) {
                return "Çok fazla hatalı deneme. Şifrenizi unuttuysanız sıfırlama linkini kullanın.";
            }
            return `Yanlış şifre. ${Math.max(0, 3 - attemptCount)} deneme hakkınız kaldı.`;
        }
        
        // Handle 404 Not Found (user doesn't exist)
        if (statusCode === 404 || message.includes("user not found") || message.includes("invalid email") || message.includes("email not found")) {
            return "Bu e-posta adresi ile kayıtlı hesap bulunamadı. Kayıt olmayı deneyin.";
        }
        
        // Handle 403 Forbidden (account issues)
        if (statusCode === 403) {
            if (message.includes("not verified") || message.includes("email not verified")) {
                return "E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin ve doğrulama kodunu girin.";
            }
            if (message.includes("suspended") || message.includes("blocked")) {
                return "Hesabınız askıya alınmış. Destek ekibi ile iletişime geçin.";
            }
            return "Bu hesaba erişim engellenmiş. Destek ekibi ile iletişime geçin.";
        }
        
        // Handle email verification specifically
        if (message.includes("email not verified") || message.includes("account not verified") || message.includes("verify")) {
            return "E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin ve doğrulama bağlantısına tıklayın veya kodu girin.";
        }
        
        // Handle 429 Too Many Requests
        if (statusCode === 429 || message.includes("too many requests") || message.includes("rate limit")) {
            return "Çok fazla deneme. Lütfen 5 dakika bekleyin.";
        }
        
        // Handle network errors
        if (message.includes("network") || message.includes("connection") || message.includes("fetch")) {
            return "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
        }
        
        // Handle server errors
        if (statusCode >= 500 || message.includes("server") || message.includes("internal")) {
            return "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
        }
        
        // Handle authentication failed
        if (message.includes("authentication failed")) {
            return "Giriş bilgileri hatalı. E-posta ve şifrenizi kontrol edin.";
        }
        
        // Default error message
        return "Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.";
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        if (!authClient) {
            setErrors({ general: "Kimlik doğrulama sistemi yükleniyor. Lütfen bekleyin." });
            setLoading(false);
            return;
        }
        
        try {
            const response = await authClient.signIn.email({
                email: email.trim(),
                password,
            });
            
            // Only set success message if we actually got a successful response
            if (response && !response.error) {
                setSuccessMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
                setAttemptCount(0); // Reset attempt count on success
                
                // Redirect after a short delay to show success message
                setTimeout(() => {
                    router.push("/");
                }, 1000);
            } else {
                // Handle case where response exists but contains an error
                throw new Error(response?.error?.message || "Authentication failed");
            }
            
        } catch (error: any) {
            // Only log detailed errors in development, not in production
            if (process.env.NODE_ENV === 'development') {
                console.error("Sign in error:", error);
                console.error("Error details:", {
                    message: error?.message,
                    status: error?.status,
                    response: error?.response
                });
            } else {
                // In production, only log essential information
                console.error("Sign in failed for user:", email.split('@')[0] + '@***');
            }
            
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const errorMessage = getErrorMessage(error, newAttemptCount);
            setErrors({ general: errorMessage });
            
            // Ensure success message is cleared
            setSuccessMessage("");
            
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        
        // Clear email error on change
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        
        // Clear password error on change
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
    };

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
                            Yönetim Sistemi
                        </h1>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tekrar hoş geldiniz</h2>
                    <p className="text-gray-600">Lütfen hesabınıza giriş yapın</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl text-center">Giriş Yap</CardTitle>
                        <CardDescription className="text-center">
                            Hesabınıza erişmek için giriş yapın
                        </CardDescription>
                        {!errors.general && (
                            <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <strong>💡 İpucu:</strong> E-posta adresinizi doğrulamadıysanız, giriş yapmadan önce doğrulama e-postasındaki bağlantıya tıklayın.
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Success Message */}
                        {successMessage && (
                            <Alert className="mb-4 border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                    {successMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* General Error Message */}
                        {errors.general && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">
                                    {errors.general}
                                    {errors.general.includes("doğrulanmamış") && (
                                        <div className="mt-3">
                                            <Link
                                                href={`/verify-email?email=${encodeURIComponent(email)}`}
                                                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                E-postamı Doğrula
                                            </Link>
                                        </div>
                                    )}
                                    {attemptCount >= 3 && !errors.general.includes("doğrulanmamış") && (
                                        <div className="mt-2">
                                            <Link 
                                                href="/forgot-password" 
                                                className="text-blue-600 hover:text-blue-700 font-medium underline"
                                            >
                                                Şifremi Unuttum
                                            </Link>
                                        </div>
                                    )}
                                    {errors.general.includes("doğrulanmamış") && (
                                        <div className="mt-2">
                                            <Link 
                                                href="/verify-email" 
                                                className="text-blue-600 hover:text-blue-700 font-medium underline"
                                            >
                                                E-posta Doğrulama Sayfasına Git
                                            </Link>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="onur@akdeniz.com"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`h-11 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="••••••••••"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={`h-11 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 h-8 w-8"
                                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading || !authClient || !!successMessage || attemptCount >= 5}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Giriş Yapılıyor...
                                    </div>
                                ) : successMessage ? (
                                    "Yönlendiriliyor..."
                                ) : attemptCount >= 5 ? (
                                    "Çok Fazla Deneme"
                                ) : (
                                    "Giriş Yap"
                                )}
                            </Button>

                            {attemptCount >= 5 && (
                                <div className="text-center text-sm text-red-600">
                                    Güvenlik nedeniyle giriş geçici olarak engellenmiştir.
                                </div>
                            )}
                        </form>
                        
                        <div className="mt-6 text-center space-y-3">
                            <p className="text-sm text-gray-600">
                                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Şifrenizi mi unuttunuz?
                                </Link>
                            </p>
                            <p className="text-sm text-gray-600">
                                Hesabınız yok mu?{" "}
                                <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Kayıt ol
                                </Link>
                            </p>
                        </div>
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