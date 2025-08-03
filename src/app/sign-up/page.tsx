"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth/client";

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
        
        try {
            await signUp.email({
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
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Sign Up</h1>
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
                    />
                    <Label htmlFor="password">Password</Label>
                    <Input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                            {error}
                        </div>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Signing Up..." : "Sign Up"}
                    </Button>
                    <p className="text-center">
                        Already have an account?{" "}
                        <Link href="/signin" className="text-blue-500">
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
} 