import { pgEnum } from "drizzle-orm/pg-core";

export const companyStatusEnum = pgEnum("company_status", [
  "active", 
  "inactive", 
  "onboarding", 
  "suspended", 
  "lead"
]);

export const companyTypeEnum = pgEnum("company_type", [
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
]);