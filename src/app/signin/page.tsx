"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            await signIn.email({
                email,
                password,
            });
            router.push("/");
        } catch (error: any) {
            console.error("Sign in error:", error);
            setError(error.message || "An error occurred during sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Sign In</h1>
                <form
                    className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3"
                    onSubmit={handleSubmit}
                >
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Label htmlFor="password">Password</Label>
                    <Input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                            {error}
                        </div>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                    <div className="text-center space-y-2">
                        <p>
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="text-blue-500 hover:underline">
                                Sign Up
                            </Link>
                        </p>
                        <p>
                            <Link href="/forgot-password" className="text-blue-500 hover:underline">
                                Forgot your password?
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
} 