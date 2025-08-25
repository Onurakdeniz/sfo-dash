import { pgEnum } from "drizzle-orm/pg-core";

export const talepStatusEnum = pgEnum("talep_status", [
  "new",              // Yeni talep - Initial state
  "clarification",    // Müşteri ile detaylandırma aşaması
  "supplier_inquiry", // Tedarikçi sorgulama aşaması
  "pricing",          // Fiyatlandırma aşaması
  "offer",            // Teklif hazırlama aşaması
  "negotiation",      // Müzakere aşaması
  "closed"            // Kapandı - Deal won or lost
]);

export const talepPriorityEnum = pgEnum("talep_priority", [
  "low",           // Düşük
  "medium",        // Orta
  "high",          // Yüksek
  "urgent"         // Acil
]);

export const talepTypeEnum = pgEnum("talep_type", [
  // Defense industry specific
  "rfq",                 // Request for Quotation
  "rfi",                 // Request for Information
  "rfp",                 // Request for Proposal
  "product_inquiry",     // Ürün Sorgusu
  "price_request",       // Fiyat Talebi
  "quotation_request",   // Teklif Talebi
  "order_request",       // Sipariş Talebi
  "sample_request",      // Numune Talebi
  "certification_req",   // Sertifika Talebi
  "compliance_inquiry",  // Uygunluk Sorgusu
  "export_license",      // İhracat Lisansı
  "end_user_cert",       // Son Kullanıcı Sertifikası
  
  // Existing types
  "delivery_status",     // Teslimat Durumu
  "return_request",      // İade Talebi
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
  // Defense industry categories
  "weapon_systems",      // Silah Sistemleri
  "ammunition",          // Mühimmat
  "avionics",           // Aviyonik
  "radar_systems",      // Radar Sistemleri
  "communication",      // Haberleşme Sistemleri
  "electronic_warfare", // Elektronik Harp
  "naval_systems",      // Deniz Sistemleri
  "land_systems",       // Kara Sistemleri
  "air_systems",        // Hava Sistemleri
  "cyber_security",     // Siber Güvenlik
  "simulation",         // Simülasyon
  "c4isr",             // Command, Control, Communications, Computers, Intelligence, Surveillance, and Reconnaissance
  
  // General categories (kept for compatibility)
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
