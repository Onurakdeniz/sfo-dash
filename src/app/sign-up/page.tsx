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
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

interface PasswordRequirement {
    regex: RegExp;
    message: string;
    met: boolean;
}

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const passwordRequirements: PasswordRequirement[] = [
        { regex: /.{8,}/, message: "En az 8 karakter", met: false },
        { regex: /[A-Z]/, message: "En az 1 büyük harf", met: false },
        { regex: /[a-z]/, message: "En az 1 küçük harf", met: false },
        { regex: /\d/, message: "En az 1 rakam", met: false },
        { regex: /[!@#$%^&*(),.?":{}|<>]/, message: "En az 1 özel karakter", met: false },
    ];

    // Update password requirements when password changes
    useEffect(() => {
        passwordRequirements.forEach((req) => {
            req.met = req.regex.test(password);
        });
    }, [password]);

    // Validation functions
    const validateEmail = (email: string): string | undefined => {
        if (!email) return "E-posta adresi gereklidir";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Geçerli bir e-posta adresi girin";
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return "Şifre gereklidir";
        
        const unmetRequirements = passwordRequirements.filter(req => !req.regex.test(password));
        if (unmetRequirements.length > 0) {
            return "Şifre güvenlik gereksinimlerini karşılamıyor";
        }
        
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

    const getErrorMessage = (error: any): string => {
        const message = error?.message?.toLowerCase() || "";
        
        if (message.includes("user already exists") || message.includes("already registered")) {
            return "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.";
        }
        
        if (message.includes("invalid email")) {
            return "Geçersiz e-posta adresi. Lütfen doğru formatta girin.";
        }
        
        if (message.includes("weak password") || message.includes("password")) {
            return "Şifre güvenlik gereksinimlerini karşılamıyor.";
        }
        
        if (message.includes("network") || message.includes("connection")) {
            return "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
        }
        
        if (message.includes("rate limit") || message.includes("too many")) {
            return "Çok fazla deneme. Lütfen birkaç dakika bekleyin.";
        }
        
        return "Hesap oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
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
            await authClient.signUp.email({
                email: email.trim(),
                password,
                name: email.split('@')[0], // Use email prefix as name
            });
            
            setSuccessMessage("✅ Hesabınız başarıyla oluşturuldu! E-posta adresinizi doğrulamak için lütfen gelen kutunuzu kontrol edin.");

            // Redirect to verification page after a short delay
            setTimeout(() => {
                router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
            }, 2000);
            
        } catch (error: any) {
            // Only log detailed errors in development, not in production
            if (process.env.NODE_ENV === 'development') {
                console.error("Sign up error:", error);
            } else {
                // In production, only log essential information
                console.error("Sign up failed for user:", email.split('@')[0] + '@***');
            }
            
            const errorMessage = getErrorMessage(error);
            setErrors({ general: errorMessage });
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
        
        // Show requirements when user starts typing
        setShowPasswordRequirements(value.length > 0);
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Çalışma alanınızı düzenleyin,</h2>
                    <p className="text-gray-600">üretkenliğinizi artırın</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl text-center">Hesap Oluşturun</CardTitle>
                        <CardDescription className="text-center">
                            Hesabınızı oluşturmak için bilgilerinizi girin
                        </CardDescription>
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
                                    placeholder="ornek@akdeniz.com"
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
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`h-11 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.password}
                                    </p>
                                )}

                                {/* Password Requirements */}
                                {showPasswordRequirements && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">Şifre Gereksinimleri:</span>
                                        </div>
                                        <div className="space-y-1">
                                            {passwordRequirements.map((req, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    {req.regex.test(password) ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    ) : (
                                                        <div className="h-3 w-3 rounded-full border border-gray-300" />
                                                    )}
                                                    <span className={req.regex.test(password) ? "text-green-700" : "text-gray-600"}>
                                                        {req.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading || !authClient || !!successMessage}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Hesap Oluşturuluyor...
                                    </div>
                                ) : successMessage ? (
                                    "Yönlendiriliyor..."
                                ) : (
                                    "Hesap Oluştur"
                                )}
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Zaten hesabınız var mı?{" "}
                                <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Giriş Yap
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