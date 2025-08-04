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

    // Since middleware already handles authentication and onboarding redirection,
    // if we reach this component, the user is authenticated and has completed onboarding
    if (!session?.user) {
      router.push('/signin');
      return;
    }

    setIsChecking(false);
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