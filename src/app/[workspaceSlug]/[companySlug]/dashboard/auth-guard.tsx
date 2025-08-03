"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Use the proper better-auth hook
  const { data: session, isPending: sessionLoading } = useSession();

  useEffect(() => {
    if (sessionLoading) {
      return; // Session not ready yet
    }

    const checkAuth = async () => {
      try {
        if (!session?.user) {
          router.push('/signin');
          return;
        }

        // Check onboarding status
        try {
          const response = await fetch('/api/onboarding/status', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const status = await response.json();
            if (!status.isComplete) {
              router.push('/onboarding');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/signin');
      }
    };

    checkAuth();
  }, [router, session, sessionLoading]);

  if (isChecking || sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Kimlik doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 