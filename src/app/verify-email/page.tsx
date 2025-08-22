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
    const [success, setSuccess] = useState(() => {
        return searchParams.get("success") === "true";
    });
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

    // Handle error parameters from URL
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            switch (errorParam) {
                case "missing_params":
                    setError("Missing verification parameters. Please try again.");
                    break;
                case "invalid_token":
                    setError("Invalid verification link. Please request a new verification email.");
                    break;
                case "expired_token":
                    setError("Verification link has expired. Please request a new verification email.");
                    break;
                case "server_error":
                    setError("Server error occurred. Please try again later.");
                    break;
                default:
                    setError("An error occurred during verification. Please try again.");
            }
        }
    }, [searchParams]);

    // Countdown timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [countdown]);

    const handleResend = async () => {
        if (!email) {
            setResendMessage("Please enter your email first");
            return;
        }

        if (countdown > 0) {
            setResendMessage(`Please wait ${countdown} seconds before requesting another email.`);
            return;
        }

        setResendLoading(true);
        setResendMessage(null);
        setError(""); // Clear any existing errors

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
                setResendMessage('✅ Verification email sent successfully! Please check your inbox.');
                setCountdown(60); // 60 second countdown
            } else {
                if (response.status === 404) {
                    setResendMessage('❌ Email not found. Please check your email address and try again.');
                } else if (response.status === 400 && data.message?.includes('already verified')) {
                    setResendMessage('✅ Your email is already verified! You can sign in now.');
                    setTimeout(() => {
                        router.push('/signin');
                    }, 2000);
                } else if (response.status === 429) {
                    setResendMessage('❌ Rate limit exceeded. Please wait before requesting another email.');
                    setCountdown(60); // Set countdown to prevent immediate retries
                } else {
                    setResendMessage(`❌ ${data.message || 'Failed to send verification email. Please try again.'}`);
                }
            }
        } catch (error: unknown) {
            console.error('Resend error:', error);
            setResendMessage('❌ Network error. Please check your connection and try again.');
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
        } catch (error: unknown) {
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
                                Welcome to our platform! You can now sign in to access your account.
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
                            We've sent a verification email to your email address.
                            You can either click the verification link in the email or enter the 4-digit code below to verify your account.
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
                    
                    <div className="text-center text-sm text-gray-600 space-y-3">
                        <div className="border-t pt-4">
                            <p className="mb-3">Didn't receive the verification email?</p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResend}
                                disabled={resendLoading || countdown > 0}
                                className="w-full sm:w-auto"
                            >
                                {resendLoading ? (
                                    'Sending...'
                                ) : countdown > 0 ? (
                                    `Resend available in ${countdown}s`
                                ) : (
                                    '📧 Resend Verification Email'
                                )}
                            </Button>
                            {countdown > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Please wait before requesting another email
                                </p>
                            )}
                        </div>
                        {resendMessage && (
                            <div className={`text-xs p-2 rounded border ${
                                resendMessage.includes('✅')
                                    ? 'text-green-700 bg-green-50 border-green-200'
                                    : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                                {resendMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}