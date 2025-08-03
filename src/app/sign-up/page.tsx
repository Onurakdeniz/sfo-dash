"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const [gender, setGender] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            await signUp.email({
                email,
                password,
                name: email, // Use email as name for now
                gender,
            });
            // Redirect to verification page instead of showing email sent message
            router.push('/verify-email');
        } catch (error: any) {
            console.error("Sign up error:", error);
            setError(error.message || "An error occurred during sign up. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <main className="container h-screen py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3 text-center">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                            <h1 className="text-2xl font-bold text-green-800 mb-4">Check Your Email!</h1>
                            <p className="text-green-700 mb-4">
                                We've sent a verification email to <strong>{email}</strong>
                            </p>
                            <p className="text-green-600 text-sm mb-4">
                                Please click the verification link in your email to complete your registration.
                            </p>
                            <p className="text-green-600 text-sm">
                                Don't see the email? Check your spam folder or{" "}
                                <button 
                                    onClick={() => setEmailSent(false)}
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                        <p className="text-center">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-blue-500">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        );
    }

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
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
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