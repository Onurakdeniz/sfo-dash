"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth/client";
import { useState, useEffect } from "react";
import { AlertCircle, LogIn, UserPlus, ExternalLink, LogOut } from "lucide-react";

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
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="font-medium">Kimlik doğrulama hatası</div>
              <div className="mt-1 text-sm">{error.message}</div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-sm text-gray-600">Oturum kontrol ediliyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Başlayın</CardTitle>
          <CardDescription className="text-center">
            Hesabınızla giriş yapın veya yeni hesap oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Link href="/signin" className="w-full">
              <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                <LogIn className="w-4 h-4 mr-2" />
                Giriş Yap
              </Button>
            </Link>
            
            <Link href="/sign-up" className="w-full">
              <Button variant="outline" className="w-full h-11">
                <UserPlus className="w-4 h-4 mr-2" />
                Hesap Oluştur
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-center">Hoş geldiniz</CardTitle>
        <CardDescription className="text-center">
          {session.user.name || session.user.email} olarak giriş yaptınız
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Link href={dashboardUrl} className="w-full">
            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Çalışma Alanına Git
            </Button>
          </Link>
          
          <Button 
            variant="outline"
            className="w-full h-11"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 