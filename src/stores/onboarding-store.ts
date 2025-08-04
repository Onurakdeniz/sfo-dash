import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WorkspaceData {
  name: string;
  slug: string;
  description: string;
}

interface WorkspaceSettings {
  timezone: string;
  language: string;
}

interface CompanyData {
  // Basic company information
  name: string;
  fullName: string;
  companyType: string;
  industry: string;
  employeesCount: string;
  
  // Contact information
  phone: string;
  email: string;
  website: string;
  
  // Address
  address: string;
  district: string;
  city: string;
  postalCode: string;
  
  // Turkish-specific business information
  taxOffice: string;
  taxNumber: string;
  mersisNumber: string;
  
  // Additional info
  notes: string;
}

interface OnboardingState {
  // Current step
  currentStep: 'workspace' | 'company' | 'complete';
  
  // Form data
  workspaceData: WorkspaceData;
  workspaceSettings: WorkspaceSettings;
  companyData: CompanyData;
  
  // Status flags
  workspaceId: string | null;
  companyId: string | null;
  workspaceCompleted: boolean;
  companyCompleted: boolean;
  
  // Actions
  setCurrentStep: (step: 'workspace' | 'company' | 'complete') => void;
  setWorkspaceData: (data: Partial<WorkspaceData>) => void;
  setWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => void;
  setCompanyData: (data: Partial<CompanyData>) => void;
  setWorkspaceId: (id: string) => void;
  setCompanyId: (id: string) => void;
  setWorkspaceCompleted: (completed: boolean) => void;
  setCompanyCompleted: (completed: boolean) => void;
  
  // Form validation helpers
  isWorkspaceValid: () => boolean;
  isCompanyValid: () => boolean;
  
  // Reset functions
  resetWorkspaceData: () => void;
  resetCompanyData: () => void;
  resetAll: () => void;
}

const initialWorkspaceData: WorkspaceData = {
  name: "",
  slug: "",
  description: "",
};

const initialWorkspaceSettings: WorkspaceSettings = {
  timezone: "Europe/Istanbul",
  language: "tr",
};

const initialCompanyData: CompanyData = {
  name: "",
  fullName: "",
  companyType: "",
  industry: "",
  employeesCount: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  district: "",
  city: "",
  postalCode: "",
  taxOffice: "",
  taxNumber: "",
  mersisNumber: "",
  notes: "",
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'workspace',
      workspaceData: initialWorkspaceData,
      workspaceSettings: initialWorkspaceSettings,
      companyData: initialCompanyData,
      workspaceId: null,
      companyId: null,
      workspaceCompleted: false,
      companyCompleted: false,
      
      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setWorkspaceData: (data) => set((state) => ({
        workspaceData: { ...state.workspaceData, ...data }
      })),
      
      setWorkspaceSettings: (settings) => set((state) => ({
        workspaceSettings: { ...state.workspaceSettings, ...settings }
      })),
      
      setCompanyData: (data) => set((state) => ({
        companyData: { ...state.companyData, ...data }
      })),
      
      setWorkspaceId: (id) => set({ workspaceId: id }),
      setCompanyId: (id) => set({ companyId: id }),
      setWorkspaceCompleted: (completed) => set({ workspaceCompleted: completed }),
      setCompanyCompleted: (completed) => set({ companyCompleted: completed }),
      
      // Validation helpers
      isWorkspaceValid: () => {
        const { workspaceData } = get();
        const slugRegex = /^[a-z0-9-]+$/;
        return (
          workspaceData.name.trim() !== '' &&
          workspaceData.slug.trim() !== '' &&
          slugRegex.test(workspaceData.slug)
        );
      },
      
      isCompanyValid: () => {
        const { companyData } = get();
        return companyData.name.trim() !== '';
      },
      
      // Reset functions
      resetWorkspaceData: () => set({
        workspaceData: initialWorkspaceData,
        workspaceSettings: initialWorkspaceSettings,
        workspaceId: null,
        workspaceCompleted: false,
      }),
      
      resetCompanyData: () => set({
        companyData: initialCompanyData,
        companyId: null,
        companyCompleted: false,
      }),
      
      resetAll: () => set({
        currentStep: 'workspace',
        workspaceData: initialWorkspaceData,
        workspaceSettings: initialWorkspaceSettings,
        companyData: initialCompanyData,
        workspaceId: null,
        companyId: null,
        workspaceCompleted: false,
        companyCompleted: false,
      }),
    }),
    {
      name: 'onboarding-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only necessary data
        workspaceData: state.workspaceData,
        workspaceSettings: state.workspaceSettings,
        companyData: state.companyData,
        workspaceId: state.workspaceId,
        companyId: state.companyId,
        workspaceCompleted: state.workspaceCompleted,
        companyCompleted: state.companyCompleted,
        currentStep: state.currentStep,
      }),
    }
  )
);