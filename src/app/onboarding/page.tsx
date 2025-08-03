"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Building2, Briefcase, Check, Loader2, Users, Shield, Zap } from "lucide-react";
import { useSession } from "@/lib/auth/client";

// Using current app's base URL
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

interface OnboardingStatus {
  isComplete: boolean;
  hasWorkspace: boolean;
  hasCompany: boolean;
  currentStep: 'workspace' | 'company' | 'complete';
  workspaceId?: string;
  companyId?: string;
}

const industries = [
  { value: "Technology", label: "Teknoloji" },
  { value: "Healthcare", label: "Sağlık" },
  { value: "Finance", label: "Finans" },
  { value: "Education", label: "Eğitim" },
  { value: "Retail", label: "Perakende" },
  { value: "Manufacturing", label: "İmalat" },
  { value: "Services", label: "Hizmetler" },
  { value: "Other", label: "Diğer" },
];

const companySizes = [
  { value: "1-10", label: "1-10 çalışan" },
  { value: "11-50", label: "11-50 çalışan" },
  { value: "51-200", label: "51-200 çalışan" },
  { value: "201-500", label: "201-500 çalışan" },
  { value: "500+", label: "500+ çalışan" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<'workspace' | 'company' | 'complete'>('workspace');
  const [error, setError] = useState("");
  
  // Use the proper better-auth hook
  const { data: session, isPending: sessionLoading } = useSession();
  
  // Form data
  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    description: "",
  });
  
  const [companyData, setCompanyData] = useState({
    name: "",
    domain: "",
    industry: "",
    size: "",
  });

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      checkOnboardingStatus();
    }
  }, [session, sessionLoading]);

  // Additional check when status changes
  useEffect(() => {
    if (status?.isComplete || (status?.hasWorkspace && status?.hasCompany)) {
      console.log("Status indicates completion, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [status, router]);

  const checkOnboardingStatus = async () => {
    if (sessionLoading) return;
    
    try {
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/onboarding/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error("Kurulum durumu alınamadı");
      }
      
      const statusData = await response.json();
      console.log("Onboarding status:", statusData);
      setStatus(statusData as OnboardingStatus);
      
      // Check if onboarding is complete (both workspace and company exist)
      if (statusData.isComplete || (statusData.hasWorkspace && statusData.hasCompany)) {
        console.log("Onboarding is complete, redirecting to dashboard");
        router.push("/dashboard");
        return;
      } else {
        console.log("Onboarding not complete, current step:", statusData.currentStep);
        setCurrentStep(statusData.currentStep);
        if (statusData.hasWorkspace && statusData.workspaceId) {
          // Store workspace ID for company creation
          sessionStorage.setItem('onboardingWorkspaceId', statusData.workspaceId);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setError("Kurulum durumu yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/onboarding/workspace`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workspaceData.name,
          description: workspaceData.description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Çalışma alanı oluşturulamadı");
      }

      const workspace = await response.json();
      sessionStorage.setItem('onboardingWorkspaceId', workspace.id);
      
      // Move to company creation step
      setCurrentStep('company');
      
      // Update the status to reflect workspace creation
      if (status) {
        setStatus({
          ...status,
          hasWorkspace: true,
          workspaceId: workspace.id,
          currentStep: 'company'
        });
      }
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      setError(error.message || "Çalışma alanı oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const workspaceId = sessionStorage.getItem('onboardingWorkspaceId');
    if (!workspaceId) {
      setError("Çalışma alanı kimliği bulunamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/onboarding/workspace/${workspaceId}/company`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyData.name,
          domain: companyData.domain || undefined,
          industry: companyData.industry || undefined,
          size: companyData.size || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Company creation failed:", errorData);
        throw new Error(errorData.message || "Şirket oluşturulamadı");
      }

      const company = await response.json();
      console.log("Company created successfully:", company);
      
      // Update status to reflect completion
      setStatus(prev => prev ? {
        ...prev,
        hasCompany: true,
        companyId: company.id,
        isComplete: true,
        currentStep: 'complete'
      } : null);
      
      // Clear session storage
      sessionStorage.removeItem('onboardingWorkspaceId');
      
      // Small delay to ensure state update, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } catch (error: any) {
      console.error("Error creating company:", error);
      setError(error.message || "Şirket oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: 'workspace',
      name: 'Çalışma Alanı',
      description: 'Çalışma alanınızı oluşturun',
      icon: Briefcase,
    },
    {
      id: 'company',
      name: 'Şirket Bilgileri',
      description: 'Şirketinizi ekleyin',
      icon: Building2,
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding & Progress */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900">
                Luna<span className="text-blue-600">Manager</span>
              </h1>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>
          
          <h2 className="text-2xl xl:text-3xl font-semibold text-gray-900 mb-6 leading-tight">
            Hesabınızı kurarak güçlü yönetim deneyimine başlayın
          </h2>
          
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Luna Manager ile ekibinizi organize edin, projelerinizi yönetin ve hedeflerinize daha hızlı ulaşın. Kurulum sadece birkaç dakika sürer.
          </p>
          
          {/* Progress Steps */}
          <div className="space-y-6 mb-10">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = 
                (step.id === 'workspace' && status?.hasWorkspace) ||
                (step.id === 'company' && status?.hasCompany);
              
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5",
                    isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold mb-1",
                      isActive ? "text-gray-900" : isCompleted ? "text-green-600" : "text-gray-500"
                    )}>
                      {step.name}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Hızlı Kurulum</h3>
                <p className="text-gray-600">Sadece birkaç dakikada hesabınızı aktif hale getirin</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ekip Yönetimi</h3>
                <p className="text-gray-600">Ekip üyelerinizi kolayca organize edin ve yönetin</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-0.5">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Güvenli Platform</h3>
                <p className="text-gray-600">Verileriniz en yüksek güvenlik standartları ile korunur</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Adım {currentStepIndex + 1} / {steps.length}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Tüm sistemler aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 lg:border-l lg:border-gray-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Luna<span className="text-blue-600">Manager</span>
              </h1>
            </div>
          </div>

          <div className="mb-8">
            {currentStep === 'workspace' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Çalışma Alanı Oluşturun
                </h2>
                <p className="text-gray-600 text-lg">
                  Ekibinizi ve projelerinizi yönetmek için bir çalışma alanı oluşturun
                </p>
              </>
            )}
            {currentStep === 'company' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Şirket Bilgilerinizi Ekleyin
                </h2>
                <p className="text-gray-600 text-lg">
                  Kurulumu tamamlamak için şirket bilgilerinizi girin
                </p>
              </>
            )}
          </div>

          {/* Workspace Form */}
          {currentStep === 'workspace' && (
            <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspace-name" className="text-sm font-semibold text-gray-700">
                  Çalışma Alanı Adı *
                </Label>
                <Input
                  id="workspace-name"
                  type="text"
                  value={workspaceData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                  placeholder="Çalışma alanımız"
                  className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workspace-description" className="text-sm font-semibold text-gray-700">
                  Açıklama (isteğe bağlı)
                </Label>
                <Textarea
                  id="workspace-description"
                  value={workspaceData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                  placeholder="Çalışma alanınızı tanımlayın..."
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Çalışma Alanı Oluşturuluyor...
                  </>
                ) : (
                  "Çalışma Alanı Oluştur"
                )}
              </Button>
            </form>
          )}

          {/* Company Form */}
          {currentStep === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-semibold text-gray-700">
                  Şirket Adı *
                </Label>
                <Input
                  id="company-name"
                  type="text"
                  value={companyData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Şirket Adı Ltd. Şti."
                  className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-domain" className="text-sm font-semibold text-gray-700">
                  Web Sitesi Adresi
                </Label>
                <Input
                  id="company-domain"
                  type="text"
                  value={companyData.domain}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData({ ...companyData, domain: e.target.value })}
                  placeholder="ornek.com"
                  className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-industry" className="text-sm font-semibold text-gray-700">
                  Sektör
                </Label>
                <Select 
                  value={companyData.industry} 
                  onValueChange={(value: string) => setCompanyData({ ...companyData, industry: value })}
                >
                  <SelectTrigger className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:outline-none">
                    <SelectValue placeholder="Sektör seçin" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                    {industries.map((industry) => (
                      <SelectItem 
                        key={industry.value} 
                        value={industry.value}
                        className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-600 focus:outline-none px-3 py-2 border-0"
                      >
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-sm font-semibold text-gray-700">
                  Şirket Büyüklüğü
                </Label>
                <Select 
                  value={companyData.size} 
                  onValueChange={(value: string) => setCompanyData({ ...companyData, size: value })}
                >
                  <SelectTrigger className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:outline-none">
                    <SelectValue placeholder="Çalışan sayısı seçin" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                    {companySizes.map((size) => (
                      <SelectItem 
                        key={size.value} 
                        value={size.value}
                        className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-600 focus:outline-none px-3 py-2 border-0"
                      >
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('workspace')}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-semibold border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Geri
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kurulum Tamamlanıyor...
                    </>
                  ) : (
                    "Kurulumu Tamamla"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 