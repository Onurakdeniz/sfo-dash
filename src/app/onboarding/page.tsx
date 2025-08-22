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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { Building2, Briefcase, Check, Loader2, Users, Shield, Zap, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "sonner";

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
  { value: "0-2", label: "0-2" },
  { value: "2-10", label: "2-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "200+", label: "200+" },
];

const companyTypes = [
  { value: "anonim_sirket", label: "A.Ş. (Anonim Şirket)" },
  { value: "limited_sirket", label: "Ltd. Şti. (Limited Şirket)" },
  { value: "kolektif_sirket", label: "Kolektif Şirket" },
  { value: "komandit_sirket", label: "Komandit Şirket" },
  { value: "sermayesi_paylara_bolunmus_komandit_sirket", label: "Sermayesi Paylara Bölünmüş Komandit Şirket" },
  { value: "kooperatif", label: "Kooperatif" },
  { value: "dernek", label: "Dernek" },
  { value: "vakif", label: "Vakıf" },
  { value: "sahis_isletmesi", label: "Şahıs İşletmesi" },
  { value: "diger", label: "Diğer" },
];

const turkishCities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Isparta",
  "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
  "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt",
  "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak",
  "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman",
  "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].map(city => ({ value: city, label: city }));

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  
  // Use the proper better-auth hook
  const { data: session, isPending: sessionLoading } = useSession();
  
  // Get state and actions from Zustand store
  const {
    currentStep,
    workspaceData,
    workspaceSettings,
    companyData,
    workspaceId,
    workspaceCompleted,
    setCurrentStep,
    setWorkspaceData,
    setWorkspaceSettings,
    setCompanyData,
    setWorkspaceId,
    setCompanyId,
    setWorkspaceCompleted,
    setCompanyCompleted,
    isWorkspaceValid,
    isCompanyValid,
    resetAll,
  } = useOnboardingStore();

  // Auto-generate slug from workspace name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Update slug when workspace name changes
  useEffect(() => {
    if (workspaceData.name) {
      const newSlug = generateSlug(workspaceData.name);
      setWorkspaceData({ slug: newSlug });
    }
  }, [workspaceData.name, setWorkspaceData]);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      checkOnboardingStatus();
    } else if (!sessionLoading && !session?.user) {
      router.push("/signin");
    }
  }, [session, sessionLoading]);

  // Additional check when status changes - but only once per status change
  useEffect(() => {
    let isMounted = true;
    
    const handleCompleteRedirect = async () => {
      if (!status) return; // Don't run if no status yet
      
      if (status.isComplete || (status.hasWorkspace && status.hasCompany)) {
        console.log("Status indicates completion, getting completion details for redirect");
        
        try {
          // Get completion details with workspace and company information
          const response = await fetch(`${API_BASE_URL}/api/onboarding/complete`, {
            credentials: 'include',
          });
          
          if (!isMounted) return;
          
          if (response.ok) {
            const completionData = await response.json();
            console.log("Completion data:", completionData);
            
            if (completionData.workspaceSlug && completionData.company?.slug) {
              // Clear onboarding data since it's complete
              resetAll();
              router.push(`/${completionData.workspaceSlug}/${completionData.company.slug}`);
              return;
            }
          }
        } catch (error) {
          console.error("Error getting completion details:", error);
        }
        
        // Fallback: if we can't get proper slugs, redirect to generic dashboard
        console.log("Falling back to generic dashboard redirect");
        resetAll();
        router.push("/");
      } else if (status.hasWorkspace && !status.hasCompany) {
        // User has completed workspace but not company, go to company step
        setCurrentStep('company');
        setWorkspaceCompleted(true);
        if (status.workspaceId) {
          setWorkspaceId(status.workspaceId);
        }
      }
    };

    // Only run if status has meaningful data and is different from previous
    if (status && (status.isComplete || status.hasWorkspace || status.hasCompany)) {
      handleCompleteRedirect();
    }
    
    return () => {
      isMounted = false;
    };
  }, [status?.isComplete, status?.hasWorkspace, status?.hasCompany]); // Only depend on specific status flags

  const checkOnboardingStatus = async () => {
    try {
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
      
      // Sync with persisted state if workspace was already created
      if (statusData.hasWorkspace && statusData.workspaceId) {
        setWorkspaceId(statusData.workspaceId);
        setWorkspaceCompleted(true);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setError("Kurulum durumu yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Check if workspace already exists
      if (status?.hasWorkspace && status?.workspaceId) {
        console.log("Workspace already exists, skipping creation");
        setWorkspaceCompleted(true);
        setCurrentStep('company');
        setWorkspaceId(status.workspaceId);
        return;
      }

      // Validate workspace data
      if (!isWorkspaceValid()) {
        throw new Error("URL adı sadece küçük harf, rakam ve tire (-) içerebilir");
      }

      const response = await fetch(`${API_BASE_URL}/api/onboarding/workspace`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workspaceData.name,
          slug: workspaceData.slug,
          description: workspaceData.description || undefined,
          settings: {
            ...workspaceSettings,
            theme: "light" // Default theme
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Çalışma alanı oluşturulamadı");
      }

      const result = await response.json();
      console.log("Workspace created successfully:", result);
      
      // Update store
      setWorkspaceCompleted(true);
      setCurrentStep('company');
      
      if (result.id) {
        setWorkspaceId(result.id);
      }
      
      toast.success("Çalışma alanı başarıyla oluşturuldu!");
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      setError(error.message || "Çalışma alanı oluşturulamadı");
      toast.error(error.message || "Çalışma alanı oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanySubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (!workspaceId) {
        throw new Error("Çalışma alanı ID'si bulunamadı");
      }

      // Validate company data
      if (!isCompanyValid()) {
        throw new Error("Şirket adı zorunludur.");
      }

      const response = await fetch(`${API_BASE_URL}/api/onboarding/workspace/${workspaceId}/company`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyData.name,
          fullName: companyData.fullName || undefined,
          companyType: companyData.companyType || undefined,
          industry: companyData.industry || undefined,
          employeesCount: companyData.employeesCount || undefined,
          phone: companyData.phone || undefined,
          email: companyData.email || undefined,
          website: companyData.website || undefined,
          address: companyData.address || undefined,
          district: companyData.district || undefined,
          city: companyData.city || undefined,
          postalCode: companyData.postalCode || undefined,
          taxOffice: companyData.taxOffice || undefined,
          taxNumber: companyData.taxNumber || undefined,
          mersisNumber: companyData.mersisNumber || undefined,
          notes: companyData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Şirket oluşturulamadı");
      }

      const result = await response.json();
      console.log("Company created successfully:", result);
      
      // Update store
      setCompanyCompleted(true);
      if (result.id) {
        setCompanyId(result.id);
      }
      
      toast.success("Şirket başarıyla oluşturuldu!");
      
      // Get workspace slug and create company slug from first word
      const workspaceSlug = workspaceData.slug;
      const companySlug = slugifyCompanyFirstWord(companyData.name) || result.id; // Fallback to ID if name is invalid
      
      // Complete onboarding - clear persisted data
      resetAll();
      
      // Redirect to the dashboard with proper URL structure
      router.push(`/${workspaceSlug}/${companySlug}`);
    } catch (error: any) {
      console.error("Error creating company:", error);
      setError(error.message || "Şirket oluşturulamadı");
      toast.error(error.message || "Şirket oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 'workspace') {
      handleWorkspaceSubmit();
    } else if (currentStep === 'company') {
      handleCompanySubmit();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'company') {
      setCurrentStep('workspace');
      setError("");
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
    <div className="h-full flex overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Left Side - Branding & Progress */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-center px-8 xl:px-16 relative bg-gradient-to-br from-blue-50 to-indigo-100">
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
                Yönetim<span className="text-blue-600">Platformu</span>
              </h1>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>

                    <h2 className="text-2xl xl:text-3xl font-semibold text-gray-900 mb-6 leading-tight">
            Hesabınızı kurarak güçlü yönetim deneyimine başlayın
          </h2>

          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Ekibinizi organize edin, projelerinizi yönetin ve hedeflerinize daha hızlı ulaşın. Kurulum sadece birkaç dakika sürer.
          </p>
          
          {/* Progress Steps */}
          <div className="space-y-6 mb-10">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = 
                (step.id === 'workspace' && (status?.hasWorkspace || workspaceCompleted)) ||
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
          
          <div className="sticky bottom-0 bg-transparent pt-4 pb-4 border-t border-gray-200">
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
      <div className="w-full lg:w-3/5 flex lg:border-l lg:border-gray-200">
        <div className="w-full flex flex-col h-screen overflow-y-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center px-6 pt-6 pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Yönetim<span className="text-blue-600">Platformu</span>
              </h1>
            </div>
          </div>

          <div className="flex-1 bg-white px-6 lg:px-12 py-8 pb-40">
            <div className="max-w-3xl mx-auto">
                {currentStep === 'workspace' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Çalışma Alanı Oluşturun
                      </h2>
                      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Ekibinizi ve projelerinizi yönetmek için bir çalışma alanı oluşturun
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="workspace-name" className="text-sm font-semibold text-gray-900">
                          Çalışma Alanı Adı *
                        </Label>
                        <Input
                          id="workspace-name"
                          type="text"
                          value={workspaceData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceData({ name: e.target.value })}
                          placeholder="Çalışma alanımız"
                          className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="workspace-slug" className="text-sm font-semibold text-gray-900">
                          URL Adı (Slug) *
                        </Label>
                        <Input
                          id="workspace-slug"
                          type="text"
                          value={workspaceData.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkspaceData({ slug: e.target.value })}
                          placeholder="calisma-alanim"
                          className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                          required
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Bu adres çalışma alanınızın URL'inde kullanılacak. Sadece küçük harf, rakam ve tire (-) kullanın.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="workspace-description" className="text-sm font-semibold text-gray-900">
                          Açıklama (isteğe bağlı)
                        </Label>
                        <Textarea
                          id="workspace-description"
                          value={workspaceData.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkspaceData({ description: e.target.value })}
                          placeholder="Çalışma alanınızı tanımlayın..."
                          className="h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400 resize-none"
                          rows={4}
                        />
                      </div>

                    </div>

                    {/* Workspace Settings */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Çalışma Alanı Ayarları
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="workspace-timezone" className="text-sm font-semibold text-gray-900">
                            Saat Dilimi
                          </Label>
                          <Select 
                            value={workspaceSettings.timezone} 
                            onValueChange={(value: string) => setWorkspaceSettings({ timezone: value })}
                          >
                            <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Europe/Istanbul">Türkiye (UTC+3)</SelectItem>
                              <SelectItem value="Europe/London">Londra (UTC+0)</SelectItem>
                              <SelectItem value="Europe/Berlin">Berlin (UTC+1)</SelectItem>
                              <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="workspace-language" className="text-sm font-semibold text-gray-900">
                            Dil
                          </Label>
                          <Select 
                            value={workspaceSettings.language} 
                            onValueChange={(value: string) => setWorkspaceSettings({ language: value })}
                          >
                            <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tr">Türkçe</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'company' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Şirket Bilgilerinizi Ekleyin
                      </h2>
                      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Kurulumu tamamlamak için şirket bilgilerinizi girin
                      </p>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Basic Company Information */}
                      <div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="company-name" className="text-sm font-semibold text-gray-900">
                              Şirket Adı *
                            </Label>
                            <Input
                              id="company-name"
                              type="text"
                              value={companyData.name}
                              onChange={(e) => setCompanyData({ name: e.target.value })}
                              placeholder="Şirket Adı"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-full-name" className="text-sm font-semibold text-gray-900">
                              Tam Şirket Adı
                            </Label>
                            <Input
                              id="company-full-name"
                              type="text"
                              value={companyData.fullName}
                              onChange={(e) => setCompanyData({ fullName: e.target.value })}
                              placeholder="Şirket Adı Ltd. Şti."
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>
                        </div>
                          </div>

                      {/* Legal Information */}
                      <div className="border-t border-gray-200 pt-8">
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="company-tax-number" className="text-sm font-semibold text-gray-900">
                              Vergi Numarası
                            </Label>
                            <Input
                              id="company-tax-number"
                              type="text"
                              value={companyData.taxNumber}
                              onChange={(e) => setCompanyData({ taxNumber: e.target.value })}
                              placeholder="1234567890"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-tax-office" className="text-sm font-semibold text-gray-900">
                              Vergi Dairesi
                            </Label>
                            <Input
                              id="company-tax-office"
                              type="text"
                              value={companyData.taxOffice}
                              onChange={(e) => setCompanyData({ taxOffice: e.target.value })}
                              placeholder="Beşiktaş Vergi Dairesi"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Trade Registry */}
                      <div className="border-t border-gray-200 pt-8">
                        
     
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="company-mersis-number" className="text-sm font-semibold text-gray-900">
                              Ticaret Sicil Numarası / MERSİS Numarası
                            </Label>
                            <Input
                              id="company-mersis-number"
                              type="text"
                              value={companyData.mersisNumber}
                              onChange={(e) => setCompanyData({ mersisNumber: e.target.value })}
                              placeholder="0123456789012345"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-type" className="text-sm font-semibold text-gray-900">
                              Şirket Türü (A.Ş., LTD, vb.)
                            </Label>
                            <Select 
                              value={companyData.companyType} 
                              onValueChange={(value) => setCompanyData({ companyType: value })}
                            >
                              <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400">
                                <SelectValue placeholder="Şirket türü seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>



                      {/* Address Information */}
                      <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Adres Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="company-address" className="text-sm font-semibold text-gray-900">
                              Adres
                            </Label>
                            <Textarea
                              id="company-address"
                              value={companyData.address}
                              onChange={(e) => setCompanyData({ address: e.target.value })}
                              placeholder="Mahalle, Sokak, No vb."
                              className="h-20 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400 resize-none"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-district" className="text-sm font-semibold text-gray-900">
                              İlçe
                            </Label>
                            <Input
                              id="company-district"
                              type="text"
                              value={companyData.district}
                              onChange={(e) => setCompanyData({ district: e.target.value })}
                              placeholder="İlçe"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-city" className="text-sm font-semibold text-gray-900">
                              İl
                            </Label>
                            <Select 
                              value={companyData.city} 
                              onValueChange={(value) => setCompanyData({ city: value })}
                            >
                              <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400 w-full">
                                <SelectValue placeholder="İl seçin" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60 overflow-auto min-w-[200px]">
                                {turkishCities.map((city) => (
                                  <SelectItem key={city.value} value={city.value}>
                                    {city.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-postal-code" className="text-sm font-semibold text-gray-900">
                              Posta Kodu
                            </Label>
                            <Input
                              id="company-postal-code"
                              type="text"
                              value={companyData.postalCode}
                              onChange={(e) => setCompanyData({ postalCode: e.target.value })}
                              placeholder="34000"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Telefon, E-posta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="company-phone" className="text-sm font-semibold text-gray-900">
                              Telefon
                            </Label>
                            <Input
                              id="company-phone"
                              type="tel"
                              value={companyData.phone}
                              onChange={(e) => setCompanyData({ phone: e.target.value })}
                              placeholder="+90 555 123 4567"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-email" className="text-sm font-semibold text-gray-900">
                              E-posta
                            </Label>
                            <Input
                              id="company-email"
                              type="email"
                              value={companyData.email}
                              onChange={(e) => setCompanyData({ email: e.target.value })}
                              placeholder="info@sirket.com"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>

                          <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="company-website" className="text-sm font-semibold text-gray-900">
                              Web Sitesi <span className="text-sm font-normal text-gray-500">(İsteğe Bağlı)</span>
                            </Label>
                            <Input
                              id="company-website"
                              type="url"
                              value={companyData.website}
                              onChange={(e) => setCompanyData({ website: e.target.value })}
                              placeholder="https://www.sirket.com"
                              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Field */}
                      <div className="border-t border-gray-200 pt-8">
                      
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="company-industry" className="text-sm font-semibold text-gray-900">
                              Faaliyet Alanı (Sektör)
                            </Label>
                            <Select 
                              value={companyData.industry} 
                              onValueChange={(value) => setCompanyData({ industry: value })}
                            >
                              <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400">
                                <SelectValue placeholder="Sektör seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry.value} value={industry.value}>
                                    {industry.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="company-employees" className="text-sm font-semibold text-gray-900">
                              Çalışan Sayısı
                            </Label>
                            <Select
                              value={companyData.employeesCount}
                              onValueChange={(value) => setCompanyData({ employeesCount: value })}
                            >
                              <SelectTrigger className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-400">
                                <SelectValue placeholder="Çalışan sayısı seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {companySizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              
              {/* Navigation Buttons */}
              <div className="fixed inset-x-0 lg:left-2/5 bottom-0 bg-white py-4 px-6 lg:px-12 border-t border-gray-200 z-50">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 mb-6 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between items-center">
                  {currentStep === 'company' && (
                    <Button 
                      type="button"
                      onClick={goToPreviousStep}
                      variant="outline"
                      className="h-14 px-8 text-base font-semibold border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 rounded-lg"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Önceki
                    </Button>
                  )}
                  
                  <Button 
                    onClick={goToNextStep}
                    disabled={
                      isSubmitting || 
                      (currentStep === 'workspace' && !isWorkspaceValid()) ||
                      (currentStep === 'company' && !isCompanyValid())
                    }
                    className={cn(
                      "h-14 px-8 text-base font-semibold transition-all duration-200 rounded-lg",
                      currentStep === 'workspace' ? "ml-auto" : "",
                      (currentStep === 'workspace' && isWorkspaceValid()) ||
                      (currentStep === 'company' && isCompanyValid())
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-100" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {currentStep === 'workspace' ? 'Çalışma Alanı Oluşturuluyor...' : 'Şirket Oluşturuluyor...'}
                      </>
                    ) : (
                      <>
                        {currentStep === 'workspace' ? 'Devam Et' : 'Kurulumu Tamamla'}
                        {currentStep === 'workspace' && <ArrowRight className="ml-2 h-5 w-5" />}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}