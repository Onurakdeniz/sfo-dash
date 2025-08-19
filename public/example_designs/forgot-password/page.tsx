"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
// NOTE: Replaced external UI imports; keep API helper if present in project or adjust to local
// import { createApiUtils } from "@lunamanager/api/client";
const createApiUtils = (...args: any[]) => ({
  auth: {
    forgotPassword: async (_: any) => ({ message: "OK" }),
  },
});

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        
        if (!mounted) {
            setError("Please wait for the page to load completely.");
            setLoading(false);
            return;
        }
        
        try {
            // Create API client only when needed
            const api = createApiUtils('/api/v1');
            const result = await api.auth.forgotPassword({ email }) as { message: string };
            setMessage(result.message);
            setEmail("");
        } catch (error: any) {
            console.error("Forgot password error:", error);
            setError(error.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Reset Your Password</h1>
                <p className="text-center text-gray-600 max-w-md">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form
                    className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3"
                    onSubmit={handleSubmit}
                >
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
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
                        </div>
                    )}
                    
                    <Button type="submit" disabled={loading || !mounted}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    
                    <div className="text-center space-y-2">
                        <p>
                            Remember your password?{" "}
                            <Link href="/signin" className="text-blue-500 hover:underline">
                                Sign In
                            </Link>
                        </p>
                        <p>
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="text-blue-500 hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}