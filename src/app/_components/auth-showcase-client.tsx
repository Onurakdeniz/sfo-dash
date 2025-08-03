"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth/client";

export function AuthShowcaseClient() {
  // Use the session hook directly
  const { data: session, isPending, error } = useSession();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-xl text-red-600">Auth error:</p>
        <p className="text-center text-sm text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-xl">Loading session...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Welcome to Luna Manager</h2>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link href="/signin">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
          
          <Link href="/sign-up">
            <Button variant="outline" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name || session.user.email}</span>
      </p>

      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button size="lg">
            Go to Dashboard
          </Button>
        </Link>
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
} 