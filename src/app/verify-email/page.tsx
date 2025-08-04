"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [verificationCode, setVerificationCode] = useState("");
    const [email, setEmail] = useState<string>(() => {
        const paramEmail = searchParams.get("email");
        return paramEmail ? paramEmail : "";
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    const handleResend = async () => {
        if (!email) {
            setResendMessage("Please enter your email first");
            return;
        }
        setResendLoading(true);
        setResendMessage(null);
        try {
            const response = await fetch('/api/auth/email-verification/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setResendMessage('Verification code sent. Please check your email.');
            } else {
                setResendMessage(data.message || 'Failed to resend code.');
            }
        } catch (error:any) {
            console.error('Resend error:', error);
            setResendMessage('An error occurred. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            // Use Better Auth API to verify email with the code
            const response = await fetch(`/api/auth/email-verification/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    token: verificationCode,
                }),
            });

            if (response.ok) {
                setSuccess(true);
                
                // Redirect to sign in page after a short delay
                setTimeout(() => {
                    router.push('/signin');
                }, 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Invalid verification code. Please try again.");
            }
        } catch (error: any) {
            console.error("Email verification error:", error);
            setError("An error occurred during verification. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="container h-screen py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3 text-center">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                            <h1 className="text-2xl font-bold text-green-800 mb-4">Email Verified Successfully!</h1>
                            <p className="text-green-700 mb-4">
                                Your email has been verified and your account is now active.
                            </p>
                            <p className="text-green-600 text-sm mb-4">
                                You will be redirected to the sign-in page in a few seconds...
                            </p>
                            <Button onClick={() => router.push('/signin')} className="w-full">
                                Continue to Sign In
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container h-screen py-16">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
                <div className="flex w-full flex-col justify-center gap-4 sm:w-1/2 lg:w-1/3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
                        <p className="text-blue-800 text-sm">
                            We've sent a 4-digit verification code to your email address. 
                            Please enter the code below to verify your account.
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="verificationCode">Verification Code</Label>
                            <Input
                                type="text"
                                id="verificationCode"
                                name="verificationCode"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 4-digit code"
                                maxLength={4}
                                pattern="[0-9]{4}"
                                className="text-center text-lg tracking-widest"
                                required
                            />
                            <p className="text-sm text-gray-600 mt-1">
                                Enter the 4-digit code sent to your email
                            </p>
                        </div>
                        
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                {error}
                            </div>
                        )}
                        
                        <Button 
                            type="submit" 
                            disabled={loading || verificationCode.length !== 4}
                            className="w-full"
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </Button>
                    </form>
                    
                    <div className="text-center text-sm text-gray-600 space-y-2">
                        <p>Didn't receive the code?</p>
                        <Button type="button" variant="outline" onClick={handleResend} disabled={resendLoading}>
                            {resendLoading ? 'Sending...' : 'Resend Code'}
                        </Button>
                        {resendMessage && <p className="text-xs text-gray-600">{resendMessage}</p>}
                    </div>
                </div>
            </div>
        </main>
    );
}