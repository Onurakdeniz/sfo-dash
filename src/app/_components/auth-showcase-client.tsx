"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth/client";
import { useState, useEffect } from "react";

export function AuthShowcaseClient() {
  // Use the session hook directly
  const { data: session, isPending, error } = useSession();
  const [dashboardUrl, setDashboardUrl] = useState("/");
  
  // Check for onboarding completion and get proper dashboard URL - only once per session
  useEffect(() => {
    let isMounted = true;
    
    const getDashboardUrl = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch("/api/onboarding/complete", {
          credentials: 'include',
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const completionData = await response.json();
          if (completionData.workspaceSlug && completionData.company?.slug) {
            setDashboardUrl(`/${completionData.workspaceSlug}/${completionData.company.slug}`);
          }
        }
      } catch (error) {
        console.error("Error getting dashboard URL:", error);
        // Keep default dashboard URL
      }
    };
    
    // Only fetch once when session user ID is available
    if (session?.user?.id) {
      getDashboardUrl();
    }
    
    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]); // Only depend on user ID, not entire session object

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
        <Link href={dashboardUrl}>
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