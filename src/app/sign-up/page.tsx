"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        if (!authClient) {
            setError("Authentication system is loading. Please wait.");
            setLoading(false);
            return;
        }
        
        try {
            await authClient.signUp.email({
                email,
                password,
                name: email, // Use email as name for now
            });
            router.push("/");
        } catch (error: any) {
            console.error("Sign up error:", error);
            setError(error.message || "An error occurred during sign up. Please try again.");
        } finally {
            setLoading(false);
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
                            Luna<span className="text-blue-600">Manager</span>
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
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="ornek@akdeniz.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                    {error}
                                </div>
                            )}
                            <Button 
                                type="submit" 
                                disabled={loading || !authClient}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
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