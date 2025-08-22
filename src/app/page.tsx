"use client";

import { AuthShowcase } from "./_components/auth-showcase";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'checking' | 'loading-workspace' | 'redirecting'>('checking');
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent infinite loops by checking if already redirected
    if (isPending || !session?.user || isRedirecting || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;
    setIsRedirecting(true);
    setLoadingStage('loading-workspace');

    // Check if user has completed onboarding and redirect
    const checkAndRedirect = async () => {
      try {
        const response = await fetch("/api/onboarding/complete", {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Onboarding complete response:", data);
          
          // Handle the correct data structure from GET /api/onboarding/complete
          if (data.isComplete && data.workspaces?.length > 0) {
            const firstWorkspace = data.workspaces[0];
            if (firstWorkspace.workspace?.slug && firstWorkspace.company?.slug) {
              setLoadingStage('redirecting');
              // Add a small delay for better UX
              await new Promise(resolve => setTimeout(resolve, 800));
              console.log(`Redirecting to: /${firstWorkspace.workspace.slug}/${firstWorkspace.company.slug}`);
              router.replace(`/${firstWorkspace.workspace.slug}/${firstWorkspace.company.slug}`);
              return;
            } else {
              console.log("Missing workspace slug or company slug:", {
                workspaceSlug: firstWorkspace.workspace?.slug,
                companySlug: firstWorkspace.company?.slug,
                workspace: firstWorkspace.workspace,
                company: firstWorkspace.company
              });
            }
          } else {
            console.log("Onboarding not complete or no workspaces:", {
              isComplete: data.isComplete,
              workspacesLength: data.workspaces?.length
            });
          }
        } else {
          console.log("Onboarding complete response not OK:", response.status);
        }
        
        // Check onboarding status as fallback
        const statusResponse = await fetch("/api/onboarding/status", {
          credentials: 'include',
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log("Onboarding status response:", statusData);
          
          if (!statusData.isComplete) {
            setLoadingStage('redirecting');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log("Onboarding not complete, redirecting to /onboarding");
            router.replace("/onboarding");
            return;
          } else {
            console.log("Onboarding is complete but no workspace/company data available");
          }
        } else {
          console.log("Onboarding status response not OK:", statusResponse.status);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
        hasRedirected.current = false;
        setIsRedirecting(false);
      }
    };
    
    checkAndRedirect();
  }, [session?.user?.id, isPending, router]); // Only depend on user ID, not the entire session object

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'checking':
        return 'Oturum kontrol ediliyor...';
      case 'loading-workspace':
        return 'Çalışma alanı yükleniyor...';
      case 'redirecting':
        return 'Yönlendiriliyor...';
      default:
        return 'Yükleniyor...';
    }
  };

  // Show loading state while checking session or redirecting
  if (isPending || (session?.user && isRedirecting)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Yönetim Sistemi
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {session?.user ? `Merhaba, ${session.user.name || session.user.email}` : 'Hoş geldiniz'}
            </h2>
            <p className="text-gray-600">{getLoadingText()}</p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">{getLoadingText()}</span>
                </div>
                
                {/* Progress Indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: loadingStage === 'checking' ? '33%' : 
                             loadingStage === 'loading-workspace' ? '66%' : 
                             loadingStage === 'redirecting' ? '100%' : '33%'
                    }}
                  ></div>
                </div>

                <div className="flex justify-between w-full text-xs text-gray-500">
                  <span className={loadingStage === 'checking' ? 'text-blue-600 font-medium' : ''}>
                    Oturum Kontrolü
                  </span>
                  <span className={loadingStage === 'loading-workspace' ? 'text-blue-600 font-medium' : ''}>
                    Çalışma Alanı
                  </span>
                  <span className={loadingStage === 'redirecting' ? 'text-blue-600 font-medium' : ''}>
                    Yönlendirme
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">Versiyon 2.0.0</p>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-500">Tüm sistemler çalışıyor</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show auth showcase for unauthenticated users
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Yönetim Sistemi
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Çalışma alanınızı düzenleyin,</h2>
            <p className="text-gray-600">üretkenliğinizi artırın</p>
          </div>

          <AuthShowcase />

          <div className="text-center">
            <p className="text-xs text-gray-500">Versiyon 2.0.0</p>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-500">Tüm sistemler çalışıyor</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we reach here, something went wrong with redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Yönetim Sistemi
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bir sorun oluştu</h2>
          <p className="text-gray-600">Çalışma alanı yüklenirken bir hata meydana geldi</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Yönlendirme işlemi başarısız oldu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 text-center">
              <Button onClick={() => window.location.reload()} className="w-full">
                Sayfayı Yenile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">Versiyon 2.0.0</p>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Sistem hatası</span>
          </div>
        </div>
      </div>
    </div>
  );
}