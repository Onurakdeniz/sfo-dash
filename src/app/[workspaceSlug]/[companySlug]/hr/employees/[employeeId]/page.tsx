"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageWrapper } from "@/components/page-wrapper";
import EmployeeSecondaryNav from "./employee-secondary-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { useRef } from "react";
import { Plus, Trash2, Edit, GraduationCap, Building2, Award, CalendarDays, Upload, Briefcase, User, Phone, CreditCard, Heart, FileText, Shield, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

type ProfileForm = {
  fullName?: string | null;
  nationalId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  position?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
  employmentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  metadata?: any;
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;
  const employeeId = params.employeeId as string; // userId

  const { data: contextData } = useQuery({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });

  const workspaceId = contextData?.workspace?.id as string | undefined;
  const companyId = contextData?.currentCompany?.id as string | undefined;

  // Basic user info from workspace members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const employee = useMemo(() => {
    return (members as any[]).find((m) => m.user.id === employeeId);
  }, [members, employeeId]);

  // Employee profile data (HR table)
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileForm | null>({
    queryKey: ["employee-profile", workspaceId, companyId, employeeId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !employeeId) return null;
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch employee profile");
      return res.json();
    },
    enabled: !!(workspaceId && companyId && employeeId),
  });

  const normalizedProfile = useMemo<ProfileForm | null>(() => {
    if (!profile) return { fullName: employee?.user?.name || "", metadata: { workHistory: [], educations: [], certificates: [], bankAccounts: [] } } as any;
    const md = (profile.metadata ?? {}) as any;
    return {
      ...profile,
      fullName: (profile as any)?.fullName ?? employee?.user?.name ?? "",
      metadata: {
        ...md,
        workHistory: Array.isArray(md?.workHistory) ? md.workHistory : [],
        educations: Array.isArray(md?.educations) ? md.educations : [],
        certificates: Array.isArray(md?.certificates) ? md.certificates : [],
        bankAccounts: Array.isArray(md?.bankAccounts) ? md.bankAccounts : [],
      },
    } as any;
  }, [profile, employee]);

  const form = useForm<ProfileForm>({
    defaultValues: normalizedProfile ?? { metadata: { workHistory: [], educations: [], certificates: [] } } as any,
    values: normalizedProfile ?? { metadata: { workHistory: [], educations: [], certificates: [] } } as any,
  });

  // Departments and dependent units for selection
  const { data: departments = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["departments", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId),
  });

  const watchedDepartmentId = form.watch("departmentId");
  const { data: units = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["units", workspaceId, companyId, watchedDepartmentId],
    queryFn: async () => {
      if (!workspaceId || !companyId || !watchedDepartmentId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments/${watchedDepartmentId}/units`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId && watchedDepartmentId),
  });

  const workHistoryArray = useFieldArray({ control: form.control as any, name: "metadata.workHistory" as any });
  const educationsArray = useFieldArray({ control: form.control as any, name: "metadata.educations" as any });
  const certificatesArray = useFieldArray({ control: form.control as any, name: "metadata.certificates" as any });
  const bankAccountsArray = useFieldArray({ control: form.control as any, name: "metadata.bankAccounts" as any });

  // Helpers for year/month based work history dates
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 60 }, (_, i) => String(currentYear - i));
  const monthOptions = [
    { value: "01", label: "01" },
    { value: "02", label: "02" },
    { value: "03", label: "03" },
    { value: "04", label: "04" },
    { value: "05", label: "05" },
    { value: "06", label: "06" },
    { value: "07", label: "07" },
    { value: "08", label: "08" },
    { value: "09", label: "09" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
  ];

  const parseYearMonth = (value?: string | null): { year: string; month: string } => {
    if (!value) return { year: "", month: "" };
    const [y, m] = String(value).split("-");
    return { year: y || "", month: m || "" };
  };

  const joinYearMonth = (year?: string, month?: string): string => {
    if (!year) return "";
    return month ? `${year}-${month}` : year;
  };

  const formatYearMonthDisplay = (value?: string | null): string => {
    const { year, month } = parseYearMonth(value);
    if (!year) return "";
    return month ? `${year}/${month}` : year;
  };

  const buildRangeDisplay = (start?: string | null, end?: string | null): string => {
    const parts = [formatYearMonthDisplay(start), formatYearMonthDisplay(end)].filter(Boolean);
    return parts.length ? parts.join(" → ") : "-";
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      if (!workspaceId || !companyId || !employeeId) throw new Error("Missing IDs");
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}` ,{
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profile", workspaceId, companyId, employeeId] });
    }
  });

  const loading = membersLoading || profileLoading;

  // Photo upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file || !workspaceId || !companyId || !employee) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("access", "public");
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/upload-url`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      const up = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${employeeId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!up.ok) throw new Error("Failed to update image");
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (inputEl) inputEl.value = "";
    }
  };
  const uploadGenericFile = async (file: File): Promise<string> => {
    if (!workspaceId || !companyId) throw new Error("Missing IDs");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("access", "public");
    const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/files/upload-url`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    return url as string;
  };

  type SectionKey =
    | "personal-info"
    | "employee-info"
    | "contact-info"
    | "bank-info"
    | "health-info"
    | "education-info"
    | "certificate-info";

  // Removed tab-based navigation; sections are now stacked vertically on a single page.
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editingCertificateIndex, setEditingCertificateIndex] = useState<number | null>(null);
  const [editingWorkHistoryIndex, setEditingWorkHistoryIndex] = useState<number | null>(null);
  const [isAddEducationOpen, setIsAddEducationOpen] = useState<boolean>(false);
  const [isAddCertificateOpen, setIsAddCertificateOpen] = useState<boolean>(false);
  const [newEducation, setNewEducation] = useState<{ degree: string; institution: string; department: string; startYear: string; endYear: string; type?: string; fileUrl?: string; fileType?: string }>({ degree: "", institution: "", department: "", startYear: "", endYear: "", type: "", fileUrl: "" });
  const [newCertificate, setNewCertificate] = useState<{ name: string; issuer: string; date: string; expiresAt: string; description: string; fileUrl?: string; fileType?: string }>({ name: "", issuer: "", date: "", expiresAt: "", description: "", fileUrl: "" });
  const [isAddWorkHistoryOpen, setIsAddWorkHistoryOpen] = useState<boolean>(false);
  const [newWorkHistory, setNewWorkHistory] = useState<{ company: string; title: string; startDate: string; endDate: string }>({ company: "", title: "", startDate: "", endDate: "" });
  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);
  const [newBankAccount, setNewBankAccount] = useState<{ bankName: string; iban: string }>({ bankName: "", iban: "" });

  const watchedEducations = form.watch("metadata.educations") as any[];
  const watchedCertificates = form.watch("metadata.certificates") as any[];
  const watchedBankAccounts = form.watch("metadata.bankAccounts") as any[];
  const watchedWorkHistory = form.watch("metadata.workHistory") as any[];

  // Onboarding guidance state & computed steps
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const isNewHire = !profile && !profileLoading;

  // Watch commonly used fields for reactive completion tracking
  const watchedBirthDate = form.watch("birthDate");
  const watchedGender = form.watch("gender");
  const watchedNationalId = form.watch("nationalId");
  const watchedPosition = form.watch("position");
  const watchedEmploymentType = form.watch("employmentType");
  const watchedStartDate = form.watch("startDate");
  const watchedAddress = form.watch("address");
  const watchedPhone = form.watch("phone");
  const watchedHealthBloodType = form.watch("metadata.health.bloodType");
  const watchedHealthIsDisabled = form.watch("metadata.health.isDisabled");
  const watchedHealthNotes = form.watch("metadata.health.notes");
  const watchedOnboarding = form.watch("metadata.onboarding") as any;

  const onboardingSteps = useMemo(() => {
    // Part 1: Personnel Information
    const part1 = [
      { key: "personal-info", title: "Temel Bilgiler", description: "Ad, doğum tarihi ve cinsiyet bilgilerini girin", icon: User, done: Boolean(watchedBirthDate && watchedGender) },
      { key: "id-info", title: "Kimlik Bilgileri", description: "T.C. Kimlik No bilgisini girin", icon: CreditCard, done: Boolean(watchedNationalId) },
      { key: "employee-info", title: "Çalışan Bilgileri", description: "Pozisyon, başlama tarihi ve istihdam türünü girin", icon: Briefcase, done: Boolean(watchedPosition && watchedStartDate && watchedEmploymentType) },
      { key: "contact-info", title: "İletişim Bilgileri", description: "Adres ve telefon bilgisini girin", icon: Phone, done: Boolean(watchedAddress && watchedPhone) },
      { key: "bank-info", title: "Banka Bilgileri", description: "En az bir banka hesabı ekleyin", icon: CreditCard, done: (watchedBankAccounts?.length ?? 0) > 0 },
      { key: "education-info", title: "Eğitim Bilgileri", description: "Diploma ve eğitim bilgilerini ekleyin", icon: GraduationCap, done: (watchedEducations?.length ?? 0) > 0 },
      { key: "certificate-info", title: "Sertifika Bilgileri", description: "Varsa sertifikaları ekleyin", icon: Award, done: (watchedCertificates?.length ?? 0) > 0 },
      { key: "health-info", title: "Sağlık Bilgileri", description: "Kan grubu ve gerekli sağlık bilgilerini girin", icon: Heart, done: Boolean(watchedHealthBloodType || watchedHealthIsDisabled || watchedHealthNotes) },
    ] as any[];
    // Part 2: Files preparation (manual toggle)
    const part2 = [
      { key: "files-prepare", title: "Dosyaları Hazırla", description: "Sözleşmeler ve gerekli belgeleri yükleyin", icon: FileText, done: Boolean(watchedOnboarding?.filesPrepared) },
    ] as any[];
    // Part 3: Role assignment (manual toggle)
    const part3 = [
      { key: "role-assign", title: "Rol Ataması Yap", description: "Pozisyon ve sistem rolleri atayın", icon: Shield, done: Boolean(watchedOnboarding?.roleAssigned) },
    ] as any[];
    return { part1, part2, part3 } as const;
  }, [
    watchedBirthDate,
    watchedGender,
    watchedNationalId,
    watchedPosition,
    watchedEmploymentType,
    watchedStartDate,
    watchedAddress,
    watchedPhone,
    watchedBankAccounts,
    watchedEducations,
    watchedCertificates,
    watchedHealthBloodType,
    watchedHealthIsDisabled,
    watchedHealthNotes,
    watchedOnboarding,
  ]);
  const completedOnboardingSteps = useMemo(() => {
    const all = [...onboardingSteps.part1, ...onboardingSteps.part2, ...onboardingSteps.part3] as any[];
    return all.filter((s: any) => s.done).length;
  }, [onboardingSteps]);
  const totalOnboardingSteps = useMemo(() => {
    return onboardingSteps.part1.length + onboardingSteps.part2.length + onboardingSteps.part3.length;
  }, [onboardingSteps]);
  const allOnboardingDone = useMemo(() => totalOnboardingSteps > 0 && completedOnboardingSteps >= totalOnboardingSteps, [completedOnboardingSteps, totalOnboardingSteps]);
  const needsAttention = !allOnboardingDone;

  const setOnboardingFlag = (key: "filesPrepared" | "roleAssigned", value: boolean) => {
    const current = form.getValues();
    const next = {
      ...(current as any),
      metadata: {
        ...((current as any).metadata || {}),
        onboarding: {
          ...(((current as any).metadata || {}).onboarding || {}),
          [key]: value,
        },
      },
    } as any;
    form.reset(next);
    saveMutation.mutate(next);
  };

  const computeCertificateStatus = (expiresAt?: string) => {
    if (!expiresAt) return { label: "Süresiz", variant: "secondary" as const, className: "" };
    const exp = new Date(expiresAt);
    if (isNaN(exp.getTime())) return { label: "Geçerlilik: -", variant: "secondary" as const, className: "" };
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "Süresi doldu", variant: "destructive" as const, className: "" };
    if (daysLeft <= 30) return { label: `Yakında (${daysLeft}g)`, variant: "default" as const, className: "bg-amber-100 text-amber-800 border border-amber-200" };
    return { label: "Geçerli", variant: "secondary" as const, className: "" };
  };

  const formatDateTR = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    try {
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  };

  const [editMode, setEditMode] = useState<Record<SectionKey, boolean>>({
    "personal-info": false,
    "employee-info": false,
    "contact-info": false,
    "bank-info": false,
    "health-info": false,
    "education-info": false,
    "certificate-info": false,
  } as Record<SectionKey, boolean>);

  // Edit mode stored per section; toggled independently for each section

  return (
    <PageWrapper
      title="Personel Profili"
      description="Çalışanın kişisel, iletişim ve istihdam bilgileri"
      secondaryNav={<EmployeeSecondaryNav />}
      actions={
        <>
          <div className="flex gap-2">
            {!allOnboardingDone && (
              <Button variant="actionSecondary" onClick={() => setIsOnboardingOpen(true)}>
                <span className="relative mr-2 inline-flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-5 w-5 rounded-full bg-amber-400/30 animate-ping" />
                  <span className="absolute inline-flex h-5 w-5 rounded-full ring-2 ring-amber-500/70" />
                  <Briefcase className="w-4 h-4 relative text-amber-700" />
                </span>
                İşe Giriş & Çıkış Süreci ({completedOnboardingSteps}/{totalOnboardingSteps})
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/hr/employees`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </div>
          {!allOnboardingDone && (
            <Sheet open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>İşe Giriş & Çıkış Süreci</SheetTitle>
                  <SheetDescription>Adım adım tamamlayın</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">İlerleme</div>
                    <div className="text-sm font-medium">{completedOnboardingSteps}/{totalOnboardingSteps}</div>
                  </div>
                  <Progress value={(completedOnboardingSteps / totalOnboardingSteps) * 100} />

                  <Accordion type="multiple" className="rounded-md border">
                    <AccordionItem value="part1">
                      <AccordionTrigger className="px-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="font-medium">1. Personel Bilgileri</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="divide-y">
                          {onboardingSteps.part1.map((step: any, idx: number) => (
                            <div key={step.key} className="flex items-start gap-3 py-3">
                              {step.done ? (
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{idx + 1}. {step.title}</div>
                                <div className="text-sm text-muted-foreground">{step.description}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={step.done ? "secondary" : "outline"}>{step.done ? "Tamamlandı" : "Beklemede"}</Badge>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  const el = document.querySelector(`[data-section="${step.key}"]`);
                                  if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setIsOnboardingOpen(false); }
                                }}>Git</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="part2">
                      <AccordionTrigger className="px-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div className="font-medium">2. Dosyaları Hazırla</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">Sözleşmeler ve gerekli belgeleri personel dosyalarına yükleyin.</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {Boolean((form.getValues() as any)?.metadata?.onboarding?.filesPrepared) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="text-sm">Belgeler hazırlandı olarak işaretle</div>
                            </div>
                            <Switch
                              checked={Boolean((form.getValues() as any)?.metadata?.onboarding?.filesPrepared)}
                              onCheckedChange={(checked) => setOnboardingFlag("filesPrepared", Boolean(checked))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              if (!workspaceId || !companyId || !employeeId) return;
                              router.push(`/${workspaceSlug}/${companySlug}/hr/employees/${employeeId}/files`);
                            }}>Personel Dosyalarını Aç</Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              const el = document.querySelector(`[data-section="certificate-info"]`);
                              if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setIsOnboardingOpen(false); }
                            }}>Sertifikalara Git</Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="part3">
                      <AccordionTrigger className="px-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <div className="font-medium">3. Rol Ataması Yap</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">Pozisyonu belirleyin ve gerekli sistem rollerini atayın.</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {Boolean((form.getValues() as any)?.metadata?.onboarding?.roleAssigned) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="text-sm">Rol ataması tamamlandı olarak işaretle</div>
                            </div>
                            <Switch
                              checked={Boolean((form.getValues() as any)?.metadata?.onboarding?.roleAssigned)}
                              onCheckedChange={(checked) => setOnboardingFlag("roleAssigned", Boolean(checked))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                              const el = document.querySelector(`[data-section="employee-info"]`);
                              if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setIsOnboardingOpen(false); }
                            }}>Pozisyona Git</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              router.push(`/${workspaceSlug}/${companySlug}/system/roles`);
                            }}>Rolleri Yönet</Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !employee ? (
        <Card>
          <CardHeader>
            <CardTitle>Çalışan bulunamadı</CardTitle>
            <CardDescription>Seçilen kullanıcı bu çalışma alanında değil.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="pt-6 space-y-8">
          <Form {...form}>
            {/* Kişisel Bilgiler Section */}
            <Card data-section="personal-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
            </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Kişisel Bilgiler</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Kimlik ve demografik bilgiler</CardDescription>
                    </div>
                  </div>
                  {!editMode["employee-info"] && !editMode["contact-info"] && !editMode["health-info"] && (
                    !editMode["personal-info"] ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="actionSecondary"
                          onClick={() => setEditMode((prev) => ({ ...prev, ["personal-info"]: true } as any))}
                        >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              form.reset(normalizedProfile ?? ({} as any));
                            setEditMode((prev) => ({ ...prev, ["personal-info"]: false } as any)); 
                            }}
                          >
                            İptal
                          </Button>
                                                    <Button
                            type="button"
                            size="sm"
                            variant="actionSecondary"
                            onClick={form.handleSubmit((d) => {
                              saveMutation.mutate(d);
                            setEditMode((prev) => ({ ...prev, ["personal-info"]: false } as any)); 
                            })}
                          >
                            Kaydet
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </CardHeader>
              <CardContent className="p-6">
                {(
                  editMode["personal-info"] ? (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="md:col-span-2 flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={employee?.user?.image} alt={employee?.user?.name} />
                              <AvatarFallback>{employee?.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
                              </Button>
                            </div>
                          </div>
                          <FormField name="fullName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ad Soyad</FormLabel>
                              <FormControl>
                                <Input placeholder="Ad Soyad" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField
                            name="nationalId"
                            rules={{
                              validate: (val: string | null | undefined) => {
                                if (!val || val === "") return true;
                                return /^\d{11}$/.test(val) || "11 haneli olmalı";
                              },
                            }}
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel>T.C. Kimlik No</FormLabel>
                              <FormControl>
                                  <Input
                                    placeholder="11111111111"
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                                      field.onChange(digits);
                                    }}
                                  />
                              </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                          />
                          <FormField name="birthDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Doğum Tarihi</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Tarih seçin"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(d) => field.onChange(d ? d.toISOString().slice(0,10) : '')}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )} />
                          <FormField name="gender" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cinsiyet</FormLabel>
                              <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
                              <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seçin" />
                                  </SelectTrigger>
                              </FormControl>
                                <SelectContent>
                                  <SelectItem value="Kadın">Kadın</SelectItem>
                                  <SelectItem value="Erkek">Erkek</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField name="notes" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Notlar</FormLabel>
                              <FormControl>
                                <Textarea rows={4} placeholder="Ek notlar" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="md:col-span-2 flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={employee?.user?.image} alt={employee?.user?.name} />
                              <AvatarFallback>{employee?.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{form.getValues().fullName || employee?.user?.name || '-'}</div>
                              <div className="text-sm text-muted-foreground">{employee?.user?.email || ''}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">T.C. Kimlik No</div>
                            <div className="text-foreground">
                              {form.getValues().nationalId ? (
                                form.getValues().nationalId
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Doğum Tarihi</div>
                            <div className="text-foreground">{formatDateTR(form.getValues().birthDate)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Cinsiyet</div>
                            <div className="text-foreground">
                              {form.getValues().gender ? (
                                form.getValues().gender
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground">Notlar</div>
                            <div className="text-foreground whitespace-pre-wrap">
                              {form.getValues().notes ? (
                                form.getValues().notes
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Not eklenmemiş</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
              </CardContent>
            </Card>

            {/* Çalışan Bilgileri Section */}
            <Card data-section="employee-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Çalışan Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">İş pozisyonu ve çalışma detayları</CardDescription>
                    </div>
                  </div>
                  {!editMode["personal-info"] && !editMode["contact-info"] && !editMode["health-info"] && (
                    !editMode["employee-info"] ? (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="actionSecondary"
                        onClick={() => setEditMode((prev) => ({ ...prev, ["employee-info"]: true } as any))}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => { 
                            form.reset(normalizedProfile ?? ({} as any)); 
                            setEditMode((prev) => ({ ...prev, ["employee-info"]: false } as any)); 
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          variant="actionSecondary"
                          onClick={form.handleSubmit((d) => { 
                            saveMutation.mutate(d); 
                            setEditMode((prev) => ({ ...prev, ["employee-info"]: false } as any)); 
                          })}
                        >
                          Kaydet
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {(
                  editMode["employee-info"] ? (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField name="departmentId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Departman</FormLabel>
                              <FormControl>
                                <Select value={(field.value as string) ?? ''} onValueChange={(v) => { field.onChange(v); form.setValue('unitId', null as any); }}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Departman seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="unitId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birim</FormLabel>
                              <FormControl>
                                <Select value={(field.value as string) ?? ''} onValueChange={field.onChange} disabled={!watchedDepartmentId || units.length === 0}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={watchedDepartmentId ? (units.length ? "Birim seçin" : "Bu departmanda birim yok") : "Önce departman seçin"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {units.map((u) => (
                                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="position" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pozisyon</FormLabel>
                              <FormControl>
                                <Input placeholder="Pozisyon" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="employmentType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Çalışma Türü</FormLabel>
                              <FormControl>
                                <Input placeholder="tam zamanlı / yarı zamanlı / stajyer" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="startDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>İşe Başlangıç</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Tarih seçin"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(d) => field.onChange(d ? d.toISOString().slice(0,10) : '')}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )} />
                          <FormField name="endDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>İşten Ayrılış</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Tarih seçin"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(d) => field.onChange(d ? d.toISOString().slice(0,10) : '')}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-base">İş Geçmişi</FormLabel>
                            <Button
                              type="button"
                              size="sm"
                              variant="actionSecondary"
                              onClick={() => {
                                setNewWorkHistory({ company: "", title: "", startDate: "", endDate: "" });
                                setIsAddWorkHistoryOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Ekle
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {(form.getValues().metadata?.workHistory?.length ?? 0) === 0 && (
                              <Card className="border-dashed border-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors">
                                <CardContent className="p-6 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                      <Briefcase className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Henüz iş geçmişi kaydı yok</p>
                                      <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir iş geçmişi eklemek için yukarıdaki butonu kullanın</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                              {(form.watch("metadata.workHistory") as any[] | undefined)?.map((wh, index) => {
                                const range = buildRangeDisplay(wh?.startDate, wh?.endDate);
                                return (
                                  <Card key={workHistoryArray.fields[index]?.id ?? index} className="overflow-hidden">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                            <div className="font-medium truncate">{wh?.title || "-"}</div>
                                          </div>
                                          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-1">
                                              <Building2 className="h-3.5 w-3.5" />
                                              <span className="truncate">{wh?.company || "-"}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                              <CalendarDays className="h-3.5 w-3.5" />
                                              <span>{range}</span>
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button type="button" variant="ghost" size="icon" onClick={() => setEditingWorkHistoryIndex(index)} aria-label="Düzenle">
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => workHistoryArray.remove(index)} aria-label="Sil">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        {/* Work History Add Modal */}
                        <Dialog open={isAddWorkHistoryOpen} onOpenChange={(open) => { if (!open) setIsAddWorkHistoryOpen(false); }}>
                          <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>İş Geçmişi Ekle</DialogTitle>
                              <DialogDescription>Önceki çalışma bilgilerini girin</DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                              <div>
                                <Label>Şirket</Label>
                                <Input placeholder="Örn: X A.Ş." value={newWorkHistory.company} onChange={(e) => setNewWorkHistory((p) => ({ ...p, company: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Ünvan</Label>
                                <Input placeholder="Örn: Yazılım Uzmanı" value={newWorkHistory.title} onChange={(e) => setNewWorkHistory((p) => ({ ...p, title: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Başlangıç</Label>
                                <div className="flex gap-2">
                                  <Select
                                    value={parseYearMonth(newWorkHistory.startDate).year}
                                    onValueChange={(year) => {
                                      const { month } = parseYearMonth(newWorkHistory.startDate);
                                      setNewWorkHistory((p) => ({ ...p, startDate: joinYearMonth(year, month) }));
                                    }}
                                  >
                                    <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                    <SelectContent>
                                      {yearOptions.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={parseYearMonth(newWorkHistory.startDate).month || "none"}
                                    onValueChange={(m) => {
                                      const month = m === "none" ? "" : m;
                                      const { year } = parseYearMonth(newWorkHistory.startDate);
                                      setNewWorkHistory((p) => ({ ...p, startDate: joinYearMonth(year, month) }));
                                    }}
                                  >
                                    <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Ay (yok)</SelectItem>
                                      {monthOptions.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label>Bitiş</Label>
                                <div className="flex gap-2">
                                  <Select
                                    value={parseYearMonth(newWorkHistory.endDate).year}
                                    onValueChange={(year) => {
                                      const { month } = parseYearMonth(newWorkHistory.endDate);
                                      setNewWorkHistory((p) => ({ ...p, endDate: joinYearMonth(year, month) }));
                                    }}
                                  >
                                    <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                    <SelectContent>
                                      {yearOptions.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={parseYearMonth(newWorkHistory.endDate).month || "none"}
                                    onValueChange={(m) => {
                                      const month = m === "none" ? "" : m;
                                      const { year } = parseYearMonth(newWorkHistory.endDate);
                                      setNewWorkHistory((p) => ({ ...p, endDate: joinYearMonth(year, month) }));
                                    }}
                                  >
                                    <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Ay (yok)</SelectItem>
                                      {monthOptions.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="flex justify-end mt-4">
                              <Button type="button" variant="outline" onClick={() => setIsAddWorkHistoryOpen(false)}>İptal</Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  const current = form.getValues();
                                  const next = [ ...(current.metadata?.workHistory ?? []), { ...newWorkHistory } ];
                                  workHistoryArray.replace(next as any);
                                  const payload = { ...current, metadata: { ...(current.metadata || {}), workHistory: next } } as any;
                                  saveMutation.mutate(payload);
                                  setIsAddWorkHistoryOpen(false);
                                }}
                              >
                                Ekle
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {/* Work History Edit Modal */}
                        <Dialog open={editingWorkHistoryIndex !== null} onOpenChange={(open) => { if (!open) setEditingWorkHistoryIndex(null); }}>
                          {typeof editingWorkHistoryIndex === "number" && editingWorkHistoryIndex >= 0 && (
                            <DialogContent className="sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>İş Geçmişi Düzenle</DialogTitle>
                                <DialogDescription>İş geçmişi bilgilerini güncelleyin</DialogDescription>
                              </DialogHeader>
                              <div className="grid md:grid-cols-2 gap-4 mt-2">
                                <FormField name={`metadata.workHistory.${editingWorkHistoryIndex}.company`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Şirket</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: X A.Ş." value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.workHistory.${editingWorkHistoryIndex}.title`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ünvan</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: Yazılım Uzmanı" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.workHistory.${editingWorkHistoryIndex}.startDate`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Başlangıç</FormLabel>
                                    <div className="flex gap-2">
                                      <Select
                                        value={parseYearMonth(field.value).year}
                                        onValueChange={(year) => field.onChange(joinYearMonth(year, parseYearMonth(field.value).month))}
                                      >
                                        <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                        <SelectContent>
                                          {yearOptions.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={parseYearMonth(field.value).month || "none"}
                                        onValueChange={(m) => field.onChange(joinYearMonth(parseYearMonth(field.value).year, m === 'none' ? '' : m))}
                                      >
                                        <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Ay (yok)</SelectItem>
                                          {monthOptions.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.workHistory.${editingWorkHistoryIndex}.endDate`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bitiş</FormLabel>
                                    <div className="flex gap-2">
                                      <Select
                                        value={parseYearMonth(field.value).year}
                                        onValueChange={(year) => field.onChange(joinYearMonth(year, parseYearMonth(field.value).month))}
                                      >
                                        <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                        <SelectContent>
                                          {yearOptions.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={parseYearMonth(field.value).month || "none"}
                                        onValueChange={(m) => field.onChange(joinYearMonth(parseYearMonth(field.value).year, m === 'none' ? '' : m))}
                                      >
                                        <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Ay (yok)</SelectItem>
                                          {monthOptions.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </FormItem>
                                )} />
                              </div>
                              <DialogFooter className="flex justify-between mt-4">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    if (typeof editingWorkHistoryIndex === 'number') {
                                      const current = form.getValues();
                                      const next = (current.metadata?.workHistory ?? []).filter((_: any, i: number) => i !== editingWorkHistoryIndex);
                                      workHistoryArray.replace(next as any);
                                      const payload = { ...current, metadata: { ...(current.metadata || {}), workHistory: next } } as any;
                                      saveMutation.mutate(payload);
                                      setEditingWorkHistoryIndex(null);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingWorkHistoryIndex(null)}>Kapat</Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const payload = form.getValues();
                                      saveMutation.mutate(payload as any);
                                      setEditingWorkHistoryIndex(null);
                                    }}
                                  >
                                    Kaydet
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>
                      </div>
                      ) : (
                        <div className="space-y-6 text-sm">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Departman</div>
                              <div className="text-foreground">
                                {(() => {
                                  const val = form.getValues().departmentId as any;
                                  if (!val) return <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>;
                                  const d = departments.find((x) => x.id === val);
                                  return d?.name || val;
                                })()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Birim</div>
                              <div className="text-foreground">
                                {(() => {
                                  const val = form.getValues().unitId as any;
                                  if (!val) return <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>;
                                  const u = units.find((x) => x.id === val);
                                  return u?.name || val;
                                })()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Pozisyon</div>
                              <div className="text-foreground">
                                {form.getValues().position ? (
                                  form.getValues().position
                                ) : (
                                  <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Çalışma Türü</div>
                              <div className="text-foreground">
                                {form.getValues().employmentType ? (
                                  form.getValues().employmentType
                                ) : (
                                  <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">İşe Başlangıç</div>
                              <div className="text-foreground">{formatDateTR(form.getValues().startDate)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">İşten Ayrılış</div>
                              <div className="text-foreground">{formatDateTR(form.getValues().endDate)}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-base">İş Geçmişi</FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                variant="actionSecondary"
                                onClick={() => {
                                  setNewWorkHistory({ company: "", title: "", startDate: "", endDate: "" });
                                  setIsAddWorkHistoryOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Ekle
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {(watchedWorkHistory?.length ?? 0) === 0 && (
                                <Card className="border-dashed border-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors">
                                  <CardContent className="p-6 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Henüz iş geçmişi kaydı yok</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir iş geçmişi eklemek için yukarıdaki butonu kullanın</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                              <div className="grid grid-cols-1 gap-3">
                                {watchedWorkHistory?.map((wh, index) => {
                                  const range = buildRangeDisplay(wh?.startDate, wh?.endDate);
                                  return (
                                    <Card key={workHistoryArray.fields[index]?.id ?? index} className="overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                            <div className="font-medium truncate">{wh?.title || "-"}</div>
                                          </div>
                                          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-1">
                                              <Building2 className="h-3.5 w-3.5" />
                                              <span className="truncate">{wh?.company || "-"}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                              <CalendarDays className="h-3.5 w-3.5" />
                                              <span>{range}</span>
                                            </span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Work History Add Modal (View mode) */}
                            <Dialog open={isAddWorkHistoryOpen} onOpenChange={(open) => { if (!open) setIsAddWorkHistoryOpen(false); }}>
                              <DialogContent className="sm:max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>İş Geçmişi Ekle</DialogTitle>
                                  <DialogDescription>Önceki çalışma bilgilerini girin</DialogDescription>
                                </DialogHeader>
                                <div className="grid md:grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label>Şirket</Label>
                                    <Input placeholder="Örn: X A.Ş." value={newWorkHistory.company} onChange={(e) => setNewWorkHistory((p) => ({ ...p, company: e.target.value }))} />
                                  </div>
                                  <div>
                                    <Label>Ünvan</Label>
                                    <Input placeholder="Örn: Yazılım Uzmanı" value={newWorkHistory.title} onChange={(e) => setNewWorkHistory((p) => ({ ...p, title: e.target.value }))} />
                                  </div>
                                  <div>
                                    <Label>Başlangıç</Label>
                                    <div className="flex gap-2">
                                      <Select
                                        value={parseYearMonth(newWorkHistory.startDate).year}
                                        onValueChange={(year) => {
                                          const { month } = parseYearMonth(newWorkHistory.startDate);
                                          setNewWorkHistory((p) => ({ ...p, startDate: joinYearMonth(year, month) }));
                                        }}
                                      >
                                        <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                        <SelectContent>
                                          {yearOptions.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={parseYearMonth(newWorkHistory.startDate).month || "none"}
                                        onValueChange={(m) => {
                                          const month = m === "none" ? "" : m;
                                          const { year } = parseYearMonth(newWorkHistory.startDate);
                                          setNewWorkHistory((p) => ({ ...p, startDate: joinYearMonth(year, month) }));
                                        }}
                                      >
                                        <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Ay (yok)</SelectItem>
                                          {monthOptions.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Bitiş</Label>
                                    <div className="flex gap-2">
                                      <Select
                                        value={parseYearMonth(newWorkHistory.endDate).year}
                                        onValueChange={(year) => {
                                          const { month } = parseYearMonth(newWorkHistory.endDate);
                                          setNewWorkHistory((p) => ({ ...p, endDate: joinYearMonth(year, month) }));
                                        }}
                                      >
                                        <SelectTrigger className="min-w-[6rem]"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                        <SelectContent>
                                          {yearOptions.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={parseYearMonth(newWorkHistory.endDate).month || "none"}
                                        onValueChange={(m) => {
                                          const month = m === "none" ? "" : m;
                                          const { year } = parseYearMonth(newWorkHistory.endDate);
                                          setNewWorkHistory((p) => ({ ...p, endDate: joinYearMonth(year, month) }));
                                        }}
                                      >
                                        <SelectTrigger className="min-w-[7rem]"><SelectValue placeholder="Ay (opsiyonel)" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Ay (yok)</SelectItem>
                                          {monthOptions.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter className="flex justify-end mt-4">
                                  <Button type="button" variant="outline" onClick={() => setIsAddWorkHistoryOpen(false)}>İptal</Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const current = form.getValues();
                                      const next = [ ...(current.metadata?.workHistory ?? []), { ...newWorkHistory } ];
                                      workHistoryArray.replace(next as any);
                                      const payload = { ...current, metadata: { ...(current.metadata || {}), workHistory: next } } as any;
                                      saveMutation.mutate(payload);
                                      setIsAddWorkHistoryOpen(false);
                                    }}
                                  >
                                    Ekle
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )
                    )}
              </CardContent>
            </Card>

            {/* İletişim Bilgileri Section */}
            <Card data-section="contact-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">İletişim Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Adres ve iletişim detayları</CardDescription>
                    </div>
                  </div>
                  {!editMode["personal-info"] && !editMode["employee-info"] && !editMode["health-info"] && (
                    !editMode["contact-info"] ? (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="actionSecondary"
                        onClick={() => setEditMode((prev) => ({ ...prev, ["contact-info"]: true } as any))}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => { 
                            form.reset(normalizedProfile ?? ({} as any)); 
                            setEditMode((prev) => ({ ...prev, ["contact-info"]: false } as any)); 
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          variant="actionSecondary"
                          onClick={form.handleSubmit((d) => { 
                            saveMutation.mutate(d); 
                            setEditMode((prev) => ({ ...prev, ["contact-info"]: false } as any)); 
                          })}
                        >
                          Kaydet
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {(
                  editMode["contact-info"] ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField name="address" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Adres</FormLabel>
                              <FormControl>
                                <Textarea rows={3} placeholder="Adres" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <Input placeholder="+90 5xx xxx xx xx" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="emergencyContactName" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Acil Durum Kişisi</FormLabel>
                              <FormControl>
                                <Input placeholder="Ad Soyad" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="emergencyContactPhone" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Acil Durum Telefon</FormLabel>
                              <FormControl>
                                <Input placeholder="+90 5xx xxx xx xx" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground">Adres</div>
                            <div className="text-foreground whitespace-pre-wrap">
                              {form.getValues().address ? (
                                form.getValues().address
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Adres eklenmemiş</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Telefon</div>
                            <div className="text-foreground">
                              {form.getValues().phone ? (
                                form.getValues().phone
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground">Acil Durum Kişisi</div>
                            <div className="text-foreground">
                              {form.getValues().emergencyContactName ? (
                                form.getValues().emergencyContactName
                              ) : (
                                <span className="inline-flex items-center gap-2 text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-md text-sm">
                                  <User className="h-4 w-4" />
                                  <span>Belirtilmemiş</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground">Acil Durum Telefon</div>
                            <div className="text-foreground">
                              {form.getValues().emergencyContactPhone ? (
                                form.getValues().emergencyContactPhone
                              ) : (
                                <span className="inline-flex items-center gap-2 text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-md text-sm">
                                  <Phone className="h-4 w-4" />
                                  <span>Belirtilmemiş</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
              </CardContent>
            </Card>

            {/* Banka Bilgileri Section */}
            <Card data-section="bank-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Banka Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Banka hesapları ve finansal bilgiler</CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="actionSecondary"
                    onClick={() => { 
                      setNewBankAccount({ bankName: "", iban: "" }); 
                      setIsAddBankOpen(true); 
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Hesap Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                        <div className="space-y-3">
                          {(watchedBankAccounts?.length ?? 0) === 0 && (
                            <Card className="border-dashed border-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors">
                              <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Henüz banka hesabı kaydı yok</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir banka hesabı eklemek için yukarıdaki butonu kullanın</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          <div className="grid sm:grid-cols-2 gap-3">
                            {watchedBankAccounts?.map((acc, index) => (
                              <Card key={bankAccountsArray.fields[index]?.id ?? index} className="overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{acc?.bankName || "-"}</div>
                                      <div className="mt-1 text-sm text-muted-foreground flex flex-col">
                                        <span>{(acc?.iban || "-") && typeof acc?.iban === 'string' ? acc.iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim() : '-'}</span>
                                        
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button type="button" variant="ghost" size="icon" onClick={() => bankAccountsArray.remove(index)} aria-label="Sil">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                        {/* Bank Add Modal */}
                        <Dialog open={isAddBankOpen} onOpenChange={(open) => { if (!open) setIsAddBankOpen(false); }}>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Banka Hesabı Ekle</DialogTitle>
                              <DialogDescription>Yeni banka hesabı bilgilerini girin</DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                              <div className="md:col-span-2">
                                <Label>Banka Adı</Label>
                                <Input placeholder="Banka" value={newBankAccount.bankName} onChange={(e) => setNewBankAccount((p) => ({ ...p, bankName: e.target.value }))} />
                              </div>
                              <div className="md:col-span-2">
                                <Label>IBAN</Label>
                                <Input placeholder="TR.." value={newBankAccount.iban} onChange={(e) => setNewBankAccount((p) => ({ ...p, iban: e.target.value.toUpperCase() }))} />
                                {(() => {
                                  const normalized = (newBankAccount.iban || '').replace(/\s+/g, '').toUpperCase();
                                  const valid = /^TR\d{24}$/.test(normalized);
                                  if (!newBankAccount.iban) return null;
                                  return valid ? null : (
                                    <p className="text-xs text-destructive mt-1">Geçersiz IBAN. TR ile başlamalı ve 26 haneli olmalıdır.</p>
                                  );
                                })()}
                              </div>
                              
                            </div>
                            <DialogFooter className="flex justify-end mt-4">
                              <Button type="button" variant="outline" onClick={() => setIsAddBankOpen(false)}>İptal</Button>
                              <Button
                                type="button"
                                disabled={(() => {
                                  const normalized = (newBankAccount.iban || '').replace(/\s+/g, '').toUpperCase();
                                  const valid = /^TR\d{24}$/.test(normalized);
                                  return !(newBankAccount.bankName && valid);
                                })()}
                                onClick={() => {
                                  const current = form.getValues();
                                  const normalized = (newBankAccount.iban || '').replace(/\s+/g, '').toUpperCase();
                                  if (!/^TR\d{24}$/.test(normalized)) return;
                                  const next = [ ...(current.metadata?.bankAccounts ?? []), { bankName: newBankAccount.bankName, iban: normalized } ];
                                  bankAccountsArray.replace(next as any);
                                  const payload = { ...current, metadata: { ...(current.metadata || {}), bankAccounts: next } } as any;
                                  saveMutation.mutate(payload);
                                  setIsAddBankOpen(false);
                                }}
                              >
                                Ekle
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
              </CardContent>
            </Card>

            {/* Sağlık Bilgileri Section */}
            <Card data-section="health-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Sağlık Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Sağlık durumu ve tıbbi bilgiler</CardDescription>
                    </div>
                  </div>
                  {!editMode["personal-info"] && !editMode["employee-info"] && !editMode["contact-info"] && (
                    !editMode["health-info"] ? (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="actionSecondary"
                        onClick={() => setEditMode((prev) => ({ ...prev, ["health-info"]: true } as any))}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => { 
                            form.reset(normalizedProfile ?? ({} as any)); 
                            setEditMode((prev) => ({ ...prev, ["health-info"]: false } as any)); 
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          variant="actionSecondary"
                          onClick={form.handleSubmit((d) => { 
                            saveMutation.mutate(d); 
                            setEditMode((prev) => ({ ...prev, ["health-info"]: false } as any)); 
                          })}
                        >
                          Kaydet
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {(
                  editMode["health-info"] ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField name="metadata.health.bloodType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kan Grubu</FormLabel>
                              <FormControl>
                                <Input placeholder="A Rh+" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="metadata.health.isDisabled" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Engelli</FormLabel>
                              <FormControl>
                                <Input placeholder="Evet/Hayır" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField name="metadata.health.notes" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Notlar</FormLabel>
                              <FormControl>
                                <Textarea rows={3} placeholder="Sağlık ile ilgili notlar" value={field.value ?? ''} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Kan Grubu</div>
                            <div className="text-foreground">
                              {(form.getValues() as any)?.metadata?.health?.bloodType ? (
                                (form.getValues() as any)?.metadata?.health?.bloodType
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Engelli</div>
                            <div className="text-foreground">
                              {(form.getValues() as any)?.metadata?.health?.isDisabled ? (
                                (form.getValues() as any)?.metadata?.health?.isDisabled
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Belirtilmemiş</span>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground">Notlar</div>
                            <div className="text-foreground whitespace-pre-wrap">
                              {(form.getValues() as any)?.metadata?.health?.notes ? (
                                (form.getValues() as any)?.metadata?.health?.notes
                              ) : (
                                <span className="text-muted-foreground/60 text-sm italic">Not eklenmemiş</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
              </CardContent>
            </Card>

            {/* Eğitim Bilgileri Section */}
            <Card data-section="education-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Eğitim Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Akademik geçmiş ve eğitim durumu</CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="actionSecondary"
                    onClick={() => { 
                      setNewEducation({ degree: "", institution: "", department: "", startYear: "", endYear: "" }); 
                      setIsAddEducationOpen(true); 
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Eğitim Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                        <div className="space-y-3">
                          {educationsArray.fields.length === 0 && (
                            <Card className="border-dashed border-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors">
                              <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                    <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Henüz eğitim kaydı yok</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir eğitim eklemek için yukarıdaki butonu kullanın</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          <div className="grid grid-cols-1 gap-3">
                            {watchedEducations?.map((edu, index) => {
                              const yearRange = [edu?.startYear, edu?.endYear].filter(Boolean).join(" - ") || "-";
                              return (
                                <Card
                                  key={educationsArray.fields[index]?.id ?? index}
                                  className="border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-3">
                                          <div className="size-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary inline-flex items-center justify-center shrink-0 shadow-sm">
                                            <GraduationCap className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <h4 className="font-semibold text-foreground truncate">{edu?.degree || "-"}</h4>
                                              {edu?.type && <Badge variant="secondary" className="text-xs">{edu.type}</Badge>}
                                            </div>
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Building2 className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{edu?.institution || "-"}</span>
                                              </div>
                                              {edu?.department && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                  <span className="w-4 h-4 shrink-0" />
                                                  <span className="truncate">{edu.department}</span>
                                                </div>
                                              )}
                                              <div className="flex items-center gap-3 pt-1">
                                                <Badge variant="outline" className="text-xs">{yearRange}</Badge>
                                                {edu?.fileUrl && (
                                                  <a href={edu.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Dosyayı Gör</a>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditingEducationIndex(index)} aria-label="Düzenle" className="hover:bg-primary/10 hover:text-primary">
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => educationsArray.remove(index)} aria-label="Sil" className="hover:bg-destructive/10 hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        {/* Education Edit Modal */}
                        <Dialog open={editingEducationIndex !== null} onOpenChange={(open) => { if (!open) setEditingEducationIndex(null); }}>
                          {typeof editingEducationIndex === "number" && editingEducationIndex >= 0 && (
                            <DialogContent className="sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Eğitim Düzenle</DialogTitle>
                                <DialogDescription>Eğitim bilgilerini güncelleyin</DialogDescription>
                              </DialogHeader>
                              <div className="grid md:grid-cols-2 gap-4 mt-2">
                                <FormField name={`metadata.educations.${editingEducationIndex}.degree`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Derece</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Lisans / YL / Doktora" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.educations.${editingEducationIndex}.type`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tür</FormLabel>
                                    <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seçin" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Lise">Lise</SelectItem>
                                        <SelectItem value="Lisans">Lisans</SelectItem>
                                        <SelectItem value="Yüksek Lisans">Yüksek Lisans</SelectItem>
                                        <SelectItem value="Doktora">Doktora</SelectItem>
                                        <SelectItem value="Özel">Özel</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.educations.${editingEducationIndex}.institution`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Üniversite</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: Boğaziçi Üniversitesi" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.educations.${editingEducationIndex}.department`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bölüm</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: Bilgisayar Müh." value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.educations.${editingEducationIndex}.startYear`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Başlangıç</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.educations.${editingEducationIndex}.endYear`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bitiş</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm text-muted-foreground">
                                    {(() => {
                                      const current = form.getValues();
                                      const url = (current as any)?.metadata?.educations?.[editingEducationIndex]?.fileUrl as string | undefined;
                                      return url ? (
                                        <a href={url} target="_blank" rel="noreferrer" className="underline">Mevcut dosyayı görüntüle</a>
                                      ) : (
                                        <span>Dosya yok</span>
                                      );
                                    })()}
                                  </div>
                                  <div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const url = await uploadGenericFile(file);
                                          const current = form.getValues();
                                          const next = [ ...(current as any).metadata?.educations ?? [] ];
                                          next[editingEducationIndex] = { ...(next[editingEducationIndex] || {}), fileUrl: url, fileType: 'education' } as any;
                                          educationsArray.replace(next as any);
                                          const payload = { ...current, metadata: { ...(current as any).metadata || {}, educations: next } } as any;
                                          saveMutation.mutate(payload);
                                        } finally {
                                          (e.target as HTMLInputElement).value = "";
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={(ev) => (ev.currentTarget.previousSibling as HTMLInputElement)?.click()}>
                                      <Upload className="h-4 w-4 mr-1" /> Dosya Ekle
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="flex justify-between mt-4">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    if (typeof editingEducationIndex === "number") {
                                      const current = form.getValues();
                                      const newEducations = (current.metadata?.educations ?? []).filter((item: any, i: number) => i !== editingEducationIndex);
                                      educationsArray.replace(newEducations as any);
                                      const payload = { ...current, metadata: { ...(current.metadata || {}), educations: newEducations } } as any;
                                      saveMutation.mutate(payload);
                                      setEditingEducationIndex(null);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingEducationIndex(null)}>Kapat</Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const payload = form.getValues();
                                      saveMutation.mutate(payload as any);
                                      setEditingEducationIndex(null);
                                    }}
                                  >
                                    Kaydet
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>

                        {/* Education Add Modal */}
                        <Dialog open={isAddEducationOpen} onOpenChange={(open) => { if (!open) setIsAddEducationOpen(false); }}>
                          <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Eğitim Ekle</DialogTitle>
                              <DialogDescription>Yeni eğitim bilgilerini girin</DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                              <div>
                                <Label>Derece</Label>
                                <Input placeholder="Lisans / YL / Doktora" value={newEducation.degree} onChange={(e) => setNewEducation((p) => ({ ...p, degree: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Tür</Label>
                                <Select value={newEducation.type || ''} onValueChange={(v) => setNewEducation((p) => ({ ...p, type: v }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Lise">Lise</SelectItem>
                                    <SelectItem value="Lisans">Lisans</SelectItem>
                                    <SelectItem value="Yüksek Lisans">Yüksek Lisans</SelectItem>
                                    <SelectItem value="Doktora">Doktora</SelectItem>
                                    <SelectItem value="Özel">Özel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Üniversite</Label>
                                <Input placeholder="Örn: Boğaziçi Üniversitesi" value={newEducation.institution} onChange={(e) => setNewEducation((p) => ({ ...p, institution: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Bölüm</Label>
                                <Input placeholder="Örn: Bilgisayar Müh." value={newEducation.department} onChange={(e) => setNewEducation((p) => ({ ...p, department: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Başlangıç</Label>
                                <Input placeholder="YYYY" value={newEducation.startYear} onChange={(e) => setNewEducation((p) => ({ ...p, startYear: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Bitiş</Label>
                                <Input placeholder="YYYY" value={newEducation.endYear} onChange={(e) => setNewEducation((p) => ({ ...p, endYear: e.target.value }))} />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="text-sm text-muted-foreground">
                                {newEducation.fileUrl ? (
                                  <a href={newEducation.fileUrl} target="_blank" rel="noreferrer" className="underline">Dosya yüklendi</a>
                                ) : (
                                  <span>Dosya eklenmedi</span>
                                )}
                              </div>
                              <div>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const url = await uploadGenericFile(file);
                                      setNewEducation((p) => ({ ...p, fileUrl: url, fileType: 'education' }));
                                    } finally {
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={(ev) => (ev.currentTarget.previousSibling as HTMLInputElement)?.click()}>
                                  <Upload className="h-4 w-4 mr-1" /> Dosya Ekle
                                </Button>
                              </div>
                            </div>
                            <DialogFooter className="flex justify-end mt-4">
                              <Button type="button" variant="outline" onClick={() => setIsAddEducationOpen(false)}>İptal</Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  const current = form.getValues();
                                  const nextEducations = [ ...(current.metadata?.educations ?? []), { ...newEducation } ];
                                  educationsArray.replace(nextEducations as any);
                                  const payload = { ...current, metadata: { ...(current.metadata || {}), educations: nextEducations } } as any;
                                  saveMutation.mutate(payload);
                                  setIsAddEducationOpen(false);
                                }}
                              >
                                Ekle
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
              </CardContent>
            </Card>

            {/* Sertifika Bilgileri Section */}
            <Card data-section="certificate-info" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 gap-0 py-0">
              <CardHeader className="border-b border-border/40 py-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Sertifika Bilgileri</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Mesleki sertifikalar ve yetkinlikler</CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="actionSecondary"
                    onClick={() => { 
                      setNewCertificate({ name: "", issuer: "", date: "", expiresAt: "", description: "" }); 
                      setIsAddCertificateOpen(true); 
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Sertifika Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                        <div className="space-y-3">
                          {certificatesArray.fields.length === 0 && (
                            <Card className="border-dashed border-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors">
                              <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                    <Award className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Henüz sertifika kaydı yok</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir sertifika eklemek için yukarıdaki butonu kullanın</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          <div className="grid grid-cols-1 gap-3">
                            {watchedCertificates?.map((cert, index) => {
                              const status = computeCertificateStatus(cert?.expiresAt);
                              const range = [cert?.date, cert?.expiresAt].filter(Boolean).join(" → ") || "-";
                              return (
                                <Card key={certificatesArray.fields[index]?.id ?? index} className="overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Award className="h-4 w-4 text-primary" />
                                          <div className="font-medium truncate">{cert?.name || "-"}</div>
                                          <Badge variant={status.variant as any} className={status.className}>{status.label}</Badge>
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                          <span className="inline-flex items-center gap-1">
                                            <Building2 className="h-3.5 w-3.5" />
                                            <span className="truncate">{cert?.issuer || "-"}</span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>{range}</span>
                                          </span>
                                          {cert?.fileUrl && (
                                            <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="underline">Dosya</a>
                                          )}
                                        </div>
                                        {/* Dosya ekleme sadece düzenle/oluştur modallarında yapılır */}
                                        {cert?.description && (
                                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{cert.description}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditingCertificateIndex(index)} aria-label="Düzenle">
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => certificatesArray.remove(index)} aria-label="Sil">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        {/* Certificate Edit Modal */}
                        <Dialog open={editingCertificateIndex !== null} onOpenChange={(open) => { if (!open) setEditingCertificateIndex(null); }}>
                          {typeof editingCertificateIndex === "number" && editingCertificateIndex >= 0 && (
                            <DialogContent className="sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Sertifika Düzenle</DialogTitle>
                                <DialogDescription>Sertifika bilgilerini güncelleyin</DialogDescription>
                              </DialogHeader>
                              <div className="grid md:grid-cols-2 gap-4 mt-2">
                                <FormField name={`metadata.certificates.${editingCertificateIndex}.name`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sertifika</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: AWS Solutions Architect" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.certificates.${editingCertificateIndex}.issuer`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Veren Kurum</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Örn: Amazon" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.certificates.${editingCertificateIndex}.date`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tarih</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                          {field.value ? new Date(field.value).toLocaleDateString() : "Tarih seçin"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value ? new Date(field.value) : undefined}
                                          onSelect={(d) => field.onChange(d ? d.toISOString().slice(0,10) : '')}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.certificates.${editingCertificateIndex}.expiresAt`} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Geçerlilik</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                          {field.value ? new Date(field.value).toLocaleDateString() : "Tarih seçin"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value ? new Date(field.value) : undefined}
                                          onSelect={(d) => field.onChange(d ? d.toISOString().slice(0,10) : '')}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </FormItem>
                                )} />
                                <FormField name={`metadata.certificates.${editingCertificateIndex}.description`} render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Açıklama</FormLabel>
                                    <FormControl>
                                      <Textarea rows={3} placeholder="Sertifika ile ilgili açıklama" value={field.value ?? ''} onChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )} />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm text-muted-foreground">
                                    {(() => {
                                      const current = form.getValues();
                                      const url = (current as any)?.metadata?.certificates?.[editingCertificateIndex]?.fileUrl as string | undefined;
                                      return url ? (
                                        <a href={url} target="_blank" rel="noreferrer" className="underline">Mevcut dosyayı görüntüle</a>
                                      ) : (
                                        <span>Dosya yok</span>
                                      );
                                    })()}
                                  </div>
                                  <div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const url = await uploadGenericFile(file);
                                          const current = form.getValues();
                                          const next = [ ...(current as any).metadata?.certificates ?? [] ];
                                          next[editingCertificateIndex] = { ...(next[editingCertificateIndex] || {}), fileUrl: url, fileType: 'Sertifika' } as any;
                                          certificatesArray.replace(next as any);
                                          const payload = { ...current, metadata: { ...(current as any).metadata || {}, certificates: next } } as any;
                                          saveMutation.mutate(payload);
                                        } finally {
                                          (e.target as HTMLInputElement).value = "";
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={(ev) => (ev.currentTarget.previousSibling as HTMLInputElement)?.click()}>
                                      <Upload className="h-4 w-4 mr-1" /> Dosya Ekle
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="flex justify-between mt-4">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    if (typeof editingCertificateIndex === "number") {
                                      const current = form.getValues();
                                      const newCertificates = (current.metadata?.certificates ?? []).filter((item: any, i: number) => i !== editingCertificateIndex);
                                      certificatesArray.replace(newCertificates as any);
                                      const payload = { ...current, metadata: { ...(current.metadata || {}), certificates: newCertificates } } as any;
                                      saveMutation.mutate(payload);
                                      setEditingCertificateIndex(null);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingCertificateIndex(null)}>Kapat</Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const payload = form.getValues();
                                      saveMutation.mutate(payload as any);
                                      setEditingCertificateIndex(null);
                                    }}
                                  >
                                    Kaydet
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>

                        {/* Certificate Add Modal */}
                        <Dialog open={isAddCertificateOpen} onOpenChange={(open) => { if (!open) setIsAddCertificateOpen(false); }}>
                          <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Sertifika Ekle</DialogTitle>
                              <DialogDescription>Yeni sertifika bilgilerini girin</DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-4 mt-2">
                              <div>
                                <Label>Sertifika</Label>
                                <Input placeholder="Örn: AWS Solutions Architect" value={newCertificate.name} onChange={(e) => setNewCertificate((p) => ({ ...p, name: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Veren Kurum</Label>
                                <Input placeholder="Örn: Amazon" value={newCertificate.issuer} onChange={(e) => setNewCertificate((p) => ({ ...p, issuer: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Tarih</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                      {newCertificate.date ? new Date(newCertificate.date).toLocaleDateString() : "Tarih seçin"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newCertificate.date ? new Date(newCertificate.date) : undefined}
                                      onSelect={(d) => setNewCertificate((p) => ({ ...p, date: d ? d.toISOString().slice(0,10) : "" }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div>
                                <Label>Geçerlilik</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                      {newCertificate.expiresAt ? new Date(newCertificate.expiresAt).toLocaleDateString() : "Tarih seçin"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newCertificate.expiresAt ? new Date(newCertificate.expiresAt) : undefined}
                                      onSelect={(d) => setNewCertificate((p) => ({ ...p, expiresAt: d ? d.toISOString().slice(0,10) : "" }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="md:col-span-2">
                                <Label>Açıklama</Label>
                                <Textarea rows={3} placeholder="Sertifika ile ilgili açıklama" value={newCertificate.description} onChange={(e) => setNewCertificate((p) => ({ ...p, description: e.target.value }))} />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="text-sm text-muted-foreground">
                                {newCertificate.fileUrl ? (
                                  <a href={newCertificate.fileUrl} target="_blank" rel="noreferrer" className="underline">Dosya yüklendi</a>
                                ) : (
                                  <span>Dosya eklenmedi</span>
                                )}
                              </div>
                              <div>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const url = await uploadGenericFile(file);
                                      setNewCertificate((p) => ({ ...p, fileUrl: url, fileType: 'Sertifika' }));
                                    } finally {
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={(ev) => (ev.currentTarget.previousSibling as HTMLInputElement)?.click()}>
                                  <Upload className="h-4 w-4 mr-1" /> Dosya Ekle
                                </Button>
                              </div>
                            </div>
                            <DialogFooter className="flex justify-end mt-4">
                              <Button type="button" variant="outline" onClick={() => setIsAddCertificateOpen(false)}>İptal</Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  const current = form.getValues();
                                  const nextCertificates = [ ...(current.metadata?.certificates ?? []), { ...newCertificate } ];
                                  certificatesArray.replace(nextCertificates as any);
                                  const payload = { ...current, metadata: { ...(current.metadata || {}), certificates: nextCertificates } } as any;
                                  saveMutation.mutate(payload);
                                  setIsAddCertificateOpen(false);
                                }}
                              >
                                Ekle
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                                                </Dialog>
                </div>
              </CardContent>
            </Card>
          </Form>
        </div>
      )}
    </PageWrapper>
  );
}


