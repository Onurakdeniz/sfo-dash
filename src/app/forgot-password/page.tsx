"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const validateEmail = (email: string): string | undefined => {
        if (!email) return "E-posta adresi gereklidir";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Geçerli bir e-posta adresi girin";
        return undefined;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setMessage("");
        
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }
        
        if (!mounted || !authClient) {
            setError("Sayfa yükleniyor. Lütfen bekleyin.");
            return;
        }
        
        setLoading(true);
        
        try {
            await authClient.forgetPassword({
                email: email.trim(),
                redirectTo: `${window.location.origin}/reset-password`,
            });
            
            setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-posta kutunuzu kontrol edin.");
            setEmail("");
            
        } catch (error: any) {
            // Only log detailed errors in development
            if (process.env.NODE_ENV === 'development') {
                console.error("Forgot password error:", error);
            }
            
            const message = error?.message?.toLowerCase() || "";
            
            if (message.includes("user not found") || message.includes("email not found")) {
                setError("Bu e-posta adresi ile kayıtlı hesap bulunamadı. Doğru e-posta adresini girdiğinizden emin olun.");
            } else if (message.includes("too many requests") || message.includes("rate limit")) {
                setError("Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.");
            } else if (message.includes("network") || message.includes("connection")) {
                setError("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
            } else {
                setError("Şifre sıfırlama isteği gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Clear error when user starts typing
        if (error) setError("");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 8A6 6 0 006 8v1H3a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1h-1V8zM8 8a4 4 0 118 0v1H8V8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Luna<span className="text-blue-600">Manager</span>
                        </h1>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Şifrenizi Sıfırlayın</h2>
                    <p className="text-gray-600">
                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </p>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6">
                    {/* Success Message */}
                    {message && (
                        <Alert className="mb-4 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert className="mb-4 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                                {error}
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
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="ornek@akdeniz.com"
                                className="h-11"
                                disabled={loading || !mounted}
                            />
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={loading || !mounted || !authClient}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Gönderiliyor...
                                </div>
                            ) : (
                                "Sıfırlama Bağlantısı Gönder"
                            )}
                        </Button>
                    </form>
                    
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-sm text-gray-600">
                            Şifrenizi hatırladınız mı?{" "}
                            <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                                Giriş Yap
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600">
                            Hesabınız yok mu?{" "}
                            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                                Kayıt Ol
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500">Versiyon 2.0.0</p>
                    <div className="flex items-center justify-center mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-500">Tüm sistemler çalışıyor</span>
                    </div>
                </div>
            </div>
        </main>
    );
} 