"use client";

import { AuthShowcase } from "./_components/auth-showcase";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

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

  const LoadingSpinner = () => (
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
      <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 opacity-50"></div>
    </div>
  );

  const ProgressDots = ({ active }: { active: number }) => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            index <= active ? 'bg-blue-600 scale-110' : 'bg-gray-300'
          }`}
          style={{
            animationDelay: `${index * 200}ms`,
            animation: index <= active ? 'pulse 1.5s infinite' : 'none'
          }}
        />
      ))}
    </div>
  );

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'checking':
        return 'Oturum kontrol ediliyor...';
      case 'loading-workspace':
        return 'Workspace yükleniyor...';
      case 'redirecting':
        return 'Yönlendiriliyor...';
      default:
        return 'Yükleniyor...';
    }
  };

  const getProgressStep = () => {
    switch (loadingStage) {
      case 'checking':
        return 0;
      case 'loading-workspace':
        return 1;
      case 'redirecting':
        return 2;
      default:
        return 0;
    }
  };

  // Show loading state while checking session or redirecting
  if (isPending || (session?.user && isRedirecting)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 text-white p-3 rounded-xl mr-3 shadow-lg animate-pulse">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Luna<span className="text-blue-600">Manager</span>
              </h1>
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800 animate-fade-in">
                {session?.user ? `Merhaba, ${session.user.name || session.user.email}` : 'Hoş geldiniz'}
              </h2>
              <p className="text-gray-600 animate-fade-in" style={{ animationDelay: '200ms' }}>
                {getLoadingText()}
              </p>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="space-y-6">
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: '400ms' }}>
              <LoadingSpinner />
            </div>

            {/* Progress Indicator */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <ProgressDots active={getProgressStep()} />
              
              {/* Progress Steps */}
              <div className="flex justify-center space-x-8 text-xs text-gray-500">
                <div className={`flex items-center space-x-1 transition-colors ${loadingStage === 'checking' ? 'text-blue-600' : loadingStage === 'loading-workspace' || loadingStage === 'redirecting' ? 'text-green-600' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${loadingStage === 'checking' ? 'bg-blue-600 animate-pulse' : loadingStage === 'loading-workspace' || loadingStage === 'redirecting' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span>Oturum</span>
                </div>
                <div className={`flex items-center space-x-1 transition-colors ${loadingStage === 'loading-workspace' ? 'text-blue-600' : loadingStage === 'redirecting' ? 'text-green-600' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${loadingStage === 'loading-workspace' ? 'bg-blue-600 animate-pulse' : loadingStage === 'redirecting' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span>Workspace</span>
                </div>
                <div className={`flex items-center space-x-1 transition-colors ${loadingStage === 'redirecting' ? 'text-blue-600' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${loadingStage === 'redirecting' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span>Yönlendirme</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-200 rounded-full animate-float opacity-40"></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-indigo-200 rounded-full animate-float-delayed opacity-40"></div>
            <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-blue-300 rounded-full animate-float opacity-30"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(-180deg); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
            opacity: 0;
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 5s ease-in-out infinite 1s;
          }
        `}</style>
      </div>
    );
  }

  // Only show auth showcase for unauthenticated users
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 text-white p-3 rounded-xl mr-3 shadow-lg">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                Luna<span className="text-blue-600">Manager</span>
              </h1>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">Çalışma alanınızı düzenleyin,</h2>
              <p className="text-gray-600">üretkenliğinizi artırın</p>
            </div>
          </div>
          <AuthShowcase />
        </div>
      </div>
    );
  }

  // If we reach here, something went wrong with redirection
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-600 text-white p-3 rounded-xl mr-3 shadow-lg">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Luna<span className="text-blue-600">Manager</span>
            </h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Bir sorun oluştu</h2>
            <p className="text-gray-600 mb-6">Workspace yüklenirken bir hata meydana geldi. Lütfen tekrar deneyin.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}