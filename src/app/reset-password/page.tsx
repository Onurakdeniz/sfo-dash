"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError("Invalid reset link. Please request a new password reset.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!mounted) {
            setError("Please wait for the page to load completely.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor");
            return;
        }

        if (password.length < 8) {
            setError("Şifre en az 8 karakter olmalıdır");
            return;
        }

        if (!token) {
            setError("Geçersiz sıfırlama bağlantısı. Yeni bir şifre sıfırlama isteği gönderin.");
            return;
        }

        setLoading(true);
        
        try {
            await authClient.resetPassword({
                newPassword: password,
                token: token,
            });
            
            setMessage("Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...");
            setTimeout(() => {
                router.push("/signin");
            }, 2000);
        } catch (error: any) {
            // Only log detailed errors in development
            if (process.env.NODE_ENV === 'development') {
                console.error("Reset password error:", error);
            }
            
            const message = error?.message?.toLowerCase() || "";
            
            if (message.includes("token") || message.includes("invalid") || message.includes("expired")) {
                setError("Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir sıfırlama isteği gönderin.");
            } else if (message.includes("password")) {
                setError("Şifre gereksinimlerini karşılamıyor. Lütfen daha güçlü bir şifre seçin.");
            } else {
                setError("Şifre sıfırlanırken bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <main className="container h-screen py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    if (!token && !error) {
        return (
            <main className="container h-screen py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Reset Your Password</h1>
                <p className="text-center text-gray-600 max-w-md">
                    Enter your new password below.
                </p>
                
                <form
                    className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3"
                    onSubmit={handleSubmit}
                >
                    <Label htmlFor="password">New Password</Label>
                    <Input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={8}
                        required
                    />
                    
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                    />
                    
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                            {error}
                        </div>
                    )}
                    
                    {message && (
                        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                            {message}
                            <br />
                            <span className="text-xs">Redirecting to sign in...</span>
                        </div>
                    )}
                    
                    <Button type="submit" disabled={loading || !token || !mounted}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                    
                    <div className="text-center">
                        <Link href="/signin" className="text-blue-500 hover:underline">
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
} 