import { pgEnum } from "drizzle-orm/pg-core";

export const talepStatusEnum = pgEnum("talep_status", [
  "new",           // Yeni talep
  "in_progress",   // İşlemde
  "waiting",       // Beklemede
  "resolved",      // Çözüldü
  "closed",        // Kapandı
  "cancelled"      // İptal edildi
]);

export const talepPriorityEnum = pgEnum("talep_priority", [
  "low",           // Düşük
  "medium",        // Orta
  "high",          // Yüksek
  "urgent"         // Acil
]);

export const talepTypeEnum = pgEnum("talep_type", [
  // Satın alma ve satış odaklı talepler
  "product_inquiry",     // Ürün Sorgusu
  "price_request",       // Fiyat Talebi
  "quotation_request",   // Teklif Talebi (RFQ)
  "order_request",       // Sipariş Talebi
  "sample_request",      // Numune Talebi
  "delivery_status",     // Teslimat Durumu
  "return_request",      // İade Talebi

  // Mevcut ve destekleyici tipler
  "billing",             // Fatura
  "technical_support",   // Teknik Destek
  "general_inquiry",     // Genel Soru
  "complaint",           // Şikayet
  "feature_request",     // Özellik Talebi
  "bug_report",          // Hata Bildirimi
  "installation",        // Kurulum
  "training",            // Eğitim
  "maintenance",         // Bakım
  "other"                // Diğer
]);

export const talepCategoryEnum = pgEnum("talep_category", [
  "hardware",            // Donanım
  "software",            // Yazılım
  "network",             // Ağ
  "database",            // Veritabanı
  "security",            // Güvenlik
  "performance",         // Performans
  "integration",         // Entegrasyon
  "reporting",           // Raporlama
  "user_access",         // Kullanıcı Erişimi
  "other"                // Diğer
]);
