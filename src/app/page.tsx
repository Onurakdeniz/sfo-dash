"use client";

import { AuthShowcase } from "./_components/auth-showcase";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent infinite loops by checking if already redirected
    if (isPending || !session?.user || isRedirecting || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;
    setIsRedirecting(true);

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

  // Show loading state while checking session or redirecting
  if (isPending || (session?.user && isRedirecting)) {
    return (
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Luna <span className="text-primary">Manager</span>
          </h1>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          {session?.user && (
            <p className="text-gray-600 dark:text-gray-400">Yönlendiriliyor...</p>
          )}
        </div>
      </main>
    );
  }

  // Only show auth showcase for unauthenticated users
  if (!session?.user) {
    return (
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Luna <span className="text-primary">Manager</span>
          </h1>
          <AuthShowcase />
        </div>
      </main>
    );
  }

  // If we reach here, something went wrong with redirection
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Luna <span className="text-primary">Manager</span>
        </h1>
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bir sorun oluştu. Lütfen tekrar deneyin.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>
    </main>
  );
}
