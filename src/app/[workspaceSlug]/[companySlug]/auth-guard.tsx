"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield } from "lucide-react";

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
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Kimlik Doğrulanıyor</CardTitle>
            <CardDescription>
              Güvenlik kontrolü yapılıyor, lütfen bekleyin...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}