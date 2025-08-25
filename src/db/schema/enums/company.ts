import { z } from "zod";

// Company status values
export const COMPANY_STATUS = [
  "active", 
  "inactive", 
  "onboarding", 
  "suspended", 
  "lead"
] as const;

// Company type values
export const COMPANY_TYPE = [
  "anonim_sirket", // A.Ş. - Anonim Şirket
  "limited_sirket", // Ltd. Şti. - Limited Şirket
  "kolektif_sirket", // Kolektif Şirket
  "komandit_sirket", // Komandit Şirket
  "sermayesi_paylara_bolunmus_komandit_sirket", // Sermayesi Paylara Bölünmüş Komandit Şirket
  "kooperatif", // Kooperatif
  "dernek", // Dernek
  "vakif", // Vakıf
  "sahis_isletmesi", // Şahıs İşletmesi
  "diger" // Diğer
] as const;

// Zod schemas
export const companyStatusSchema = z.enum(COMPANY_STATUS);
export const companyTypeSchema = z.enum(COMPANY_TYPE);

// Type exports
export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type CompanyType = z.infer<typeof companyTypeSchema>;