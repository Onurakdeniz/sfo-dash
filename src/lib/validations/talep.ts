import { z } from 'zod';

// ============================================
// TALEP STATUS SCHEMA
// ============================================
export const TalepStatusSchema = z.enum([
  'new',           // Yeni talep
  'in_progress',   // İşlemde
  'waiting',       // Beklemede
  'resolved',      // Çözüldü
  'closed',        // Kapandı
  'cancelled'      // İptal edildi
]);

export type TalepStatus = z.infer<typeof TalepStatusSchema>;

// ============================================
// TALEP PRIORITY SCHEMA
// ============================================
export const TalepPrioritySchema = z.enum([
  'low',           // Düşük
  'medium',        // Orta
  'high',          // Yüksek
  'urgent'         // Acil
]);

export type TalepPriority = z.infer<typeof TalepPrioritySchema>;

// ============================================
// TALEP TYPE SCHEMA
// ============================================
export const TalepTypeSchema = z.enum([
  // Defense industry specific
  'rfq',                 // Request for Quotation
  'rfi',                 // Request for Information
  'rfp',                 // Request for Proposal
  'product_inquiry',     // Ürün Sorgusu
  'price_request',       // Fiyat Talebi
  'quotation_request',   // Teklif Talebi
  'order_request',       // Sipariş Talebi
  'sample_request',      // Numune Talebi
  'certification_req',   // Sertifika Talebi
  'compliance_inquiry',  // Uygunluk Sorgusu
  'export_license',      // İhracat Lisansı
  'end_user_cert',       // Son Kullanıcı Sertifikası
  
  // Existing types
  'delivery_status',     // Teslimat Durumu
  'return_request',      // İade Talebi
  'billing',             // Fatura
  'technical_support',   // Teknik Destek
  'general_inquiry',     // Genel Soru
  'complaint',           // Şikayet
  'feature_request',     // Özellik Talebi
  'bug_report',          // Hata Bildirimi
  'installation',        // Kurulum
  'training',            // Eğitim
  'maintenance',         // Bakım
  'other'                // Diğer
]);

export type TalepType = z.infer<typeof TalepTypeSchema>;

// ============================================
// TALEP CATEGORY SCHEMA
// ============================================
export const TalepCategorySchema = z.enum([
  // Defense industry categories
  'weapon_systems',      // Silah Sistemleri
  'ammunition',          // Mühimmat
  'avionics',           // Aviyonik
  'radar_systems',      // Radar Sistemleri
  'communication',      // Haberleşme Sistemleri
  'electronic_warfare', // Elektronik Harp
  'naval_systems',      // Deniz Sistemleri
  'land_systems',       // Kara Sistemleri
  'air_systems',        // Hava Sistemleri
  'cyber_security',     // Siber Güvenlik
  'simulation',         // Simülasyon
  'c4isr',             // Command, Control, Communications, Computers, Intelligence, Surveillance, and Reconnaissance
  
  // General categories (kept for compatibility)
  'hardware',            // Donanım
  'software',            // Yazılım
  'network',             // Ağ
  'database',            // Veritabanı
  'security',            // Güvenlik
  'performance',         // Performans
  'integration',         // Entegrasyon
  'reporting',           // Raporlama
  'user_access',         // Kullanıcı Erişimi
  'other'                // Diğer
]);

export type TalepCategory = z.infer<typeof TalepCategorySchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

// Helper to validate talep status transitions
export function isValidTalepStatusTransition(currentStatus: TalepStatus, newStatus: TalepStatus): boolean {
  const validTransitions: Record<TalepStatus, TalepStatus[]> = {
    'new': ['in_progress', 'waiting', 'cancelled'],
    'in_progress': ['waiting', 'resolved', 'cancelled'],
    'waiting': ['in_progress', 'resolved', 'cancelled'],
    'resolved': ['closed', 'in_progress'], // Can reopen if needed
    'closed': [], // No transitions from closed
    'cancelled': [] // No transitions from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

// Helper to get next valid statuses for talep
export function getNextValidTalepStatuses(currentStatus: TalepStatus): TalepStatus[] {
  const validTransitions: Record<TalepStatus, TalepStatus[]> = {
    'new': ['in_progress', 'waiting', 'cancelled'],
    'in_progress': ['waiting', 'resolved', 'cancelled'],
    'waiting': ['in_progress', 'resolved', 'cancelled'],
    'resolved': ['closed', 'in_progress'],
    'closed': [],
    'cancelled': []
  };

  return validTransitions[currentStatus] ?? [];
}

// Helper to check if talep status is final
export function isFinalTalepStatus(status: TalepStatus): boolean {
  return ['closed', 'cancelled'].includes(status);
}

// Helper to check if talep status is active
export function isActiveTalepStatus(status: TalepStatus): boolean {
  return !isFinalTalepStatus(status);
}

// Export all schemas as a collection
export const TalepValidationSchemas = {
  TalepStatus: TalepStatusSchema,
  TalepPriority: TalepPrioritySchema,
  TalepType: TalepTypeSchema,
  TalepCategory: TalepCategorySchema
};