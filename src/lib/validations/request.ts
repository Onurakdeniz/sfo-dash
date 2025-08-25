import { z } from 'zod';

// ============================================
// REQUEST WORKFLOW STATUS SCHEMA
// ============================================
export const RequestStatusSchema = z.enum([
  // Initial Stage
  'new',                    // New request created, awaiting processing
  
  // Clarification Stage
  'clarification',          // Gathering requirements and specifications from customer
  
  // Sourcing Stage  
  'supplier_inquiry',       // Ready for supplier quotations, handed over to procurement
  
  // Commercial Stages
  'pricing',               // Calculating and preparing pricing
  'offer',                 // Formal offer sent to customer
  'negotiation',           // In negotiation with customer
  
  // Decision Stages
  'customer_review',       // Customer reviewing the offer
  'pending_approval',      // Awaiting internal or customer approval
  
  // Final Stages
  'approved',              // Request approved, moving to order
  'closed',                // Request closed (won or lost)
  'cancelled',             // Request cancelled
  'expired',               // Request expired due to timeout
  
  // Special States
  'on_hold',               // Temporarily paused
  'escalated'              // Escalated to management
]);

export type RequestStatus = z.infer<typeof RequestStatusSchema>;

// ============================================
// REQUEST PRIORITY SCHEMA
// ============================================
export const RequestPrioritySchema = z.enum([
  'low',                   // Low priority
  'medium',                // Normal priority
  'high',                  // High priority  
  'urgent',                // Urgent, needs immediate attention
  'critical'               // Critical, business impact
]);

export type RequestPriority = z.infer<typeof RequestPrioritySchema>;

// ============================================
// REQUEST TYPE SCHEMA
// ============================================
export const RequestTypeSchema = z.enum([
  // Procurement Requests
  'rfq',                   // Request for Quotation
  'rfi',                   // Request for Information
  'rfp',                   // Request for Proposal
  'rft',                   // Request for Tender
  
  // Product Requests
  'product_inquiry',       // General product inquiry
  'price_request',         // Price inquiry only
  'availability_check',    // Stock/availability check
  'technical_inquiry',     // Technical specifications inquiry
  
  // Sample & Trial
  'sample_request',        // Request for product samples
  'trial_request',         // Trial/evaluation request
  'demo_request',          // Product demonstration request
  
  // Order Related
  'order_request',         // Direct order request
  'repeat_order',          // Repeat of previous order
  'blanket_order',         // Framework/blanket order
  'call_off_order',        // Call-off from blanket order
  
  // Compliance & Documentation
  'certification_request', // Certification documents request
  'compliance_inquiry',    // Compliance verification
  'export_license',        // Export license request
  'end_user_certificate',  // End-user certificate request
  
  // Service Requests
  'service_request',       // Service inquiry
  'maintenance_request',   // Maintenance service
  'training_request',      // Training services
  'installation_request',  // Installation services
  'calibration_request',   // Calibration services
  
  // Support & Issues
  'technical_support',     // Technical support request
  'warranty_claim',        // Warranty claim
  'complaint',             // Customer complaint
  'return_request',        // Return/RMA request
  
  // Other
  'custom_manufacturing',  // Custom manufacturing request
  'modification_request',  // Product modification request
  'general_inquiry',       // General inquiry
  'other'                  // Other type of request
]);

export type RequestType = z.infer<typeof RequestTypeSchema>;

// ============================================
// REQUEST CATEGORY SCHEMA
// ============================================
export const RequestCategorySchema = z.enum([
  // Defense Categories
  'weapon_systems',        // Weapon systems and platforms
  'ammunition',            // Ammunition and explosives
  'avionics',             // Aviation electronics
  'radar_systems',        // Radar and detection systems
  'communication_systems', // Military communication systems
  'electronic_warfare',    // EW systems and countermeasures
  'naval_systems',        // Naval platforms and systems
  'land_systems',         // Land vehicles and systems
  'air_systems',          // Aircraft and aerial systems
  'space_systems',        // Space and satellite systems
  'missile_systems',      // Missile and rocket systems
  'uav_systems',          // Unmanned aerial vehicles
  'cyber_security',       // Cyber defense systems
  'simulation_training',  // Simulation and training systems
  'c4isr',               // Command, Control, Communications, Computers, ISR
  
  // Industrial Categories
  'industrial_equipment', // Industrial machinery
  'automation',          // Automation systems
  'sensors',             // Sensors and measurement
  'power_systems',       // Power generation and distribution
  'hydraulics',          // Hydraulic systems
  'pneumatics',          // Pneumatic systems
  'electronics',         // Electronic components
  'mechanical_parts',    // Mechanical components
  'raw_materials',       // Raw materials and commodities
  'chemicals',           // Chemical products
  'safety_equipment',    // Safety and protective equipment
  
  // IT Categories
  'hardware',            // Computer hardware
  'software',            // Software solutions
  'networking',          // Network equipment
  'data_center',         // Data center equipment
  'security_systems',    // Security and surveillance
  
  // Services
  'maintenance_services', // Maintenance and repair
  'engineering_services', // Engineering and design
  'logistics_services',   // Logistics and transportation
  'consulting_services',  // Consulting and advisory
  
  // Other
  'spare_parts',         // Spare parts and consumables
  'tools_equipment',     // Tools and equipment
  'office_supplies',     // Office supplies
  'other'               // Other categories
]);

export type RequestCategory = z.infer<typeof RequestCategorySchema>;

// ============================================
// REQUEST ITEM STATUS SCHEMA
// ============================================
export const RequestItemStatusSchema = z.enum([
  'pending',              // Awaiting processing
  'reviewing',            // Under technical review
  'sourcing',             // Finding suppliers
  'quoted',               // Price quoted
  'approved',             // Approved by customer
  'rejected',             // Rejected by customer
  'alternative_offered',  // Alternative product offered
  'ordered',              // Ordered from supplier
  'delivered',            // Delivered to customer
  'cancelled',            // Cancelled
  'out_of_stock',        // Not available
  'discontinued'          // Product discontinued
]);

export type RequestItemStatus = z.infer<typeof RequestItemStatusSchema>;

// ============================================
// COMMUNICATION TYPE SCHEMA
// ============================================
export const CommunicationTypeSchema = z.enum([
  'email',                // Email communication
  'phone',                // Phone call
  'video_call',           // Video conference
  'meeting',              // In-person meeting
  'site_visit',           // Customer site visit
  'chat',                 // Chat/instant messaging
  'portal_message',       // Message via customer portal
  'fax',                  // Fax communication
  'letter',               // Physical letter
  'whatsapp',             // WhatsApp message
  'other'                 // Other communication method
]);

export type CommunicationType = z.infer<typeof CommunicationTypeSchema>;

// ============================================
// ACTION STATUS SCHEMA
// ============================================
export const ActionStatusSchema = z.enum([
  'pending',              // Not yet started
  'scheduled',            // Scheduled for future
  'in_progress',          // Currently ongoing
  'completed',            // Successfully completed
  'failed',               // Failed to complete
  'cancelled',            // Cancelled
  'postponed',            // Postponed to later date
  'waiting'               // Waiting for response/input
]);

export type ActionStatus = z.infer<typeof ActionStatusSchema>;

// ============================================
// ACTION OUTCOME SCHEMA
// ============================================
export const ActionOutcomeSchema = z.enum([
  'successful',           // Successful outcome
  'unsuccessful',         // Unsuccessful
  'partially_successful', // Partial success
  'follow_up_required',   // Needs follow-up
  'escalated',            // Escalated to higher level
  'no_response',          // No response received
  'rescheduled',          // Rescheduled for later
  'information_gathered', // Information collected
  'decision_pending',     // Awaiting decision
  'action_required'       // Further action needed
]);

export type ActionOutcome = z.infer<typeof ActionOutcomeSchema>;

// ============================================
// FILE TYPE SCHEMA
// ============================================
export const FileTypeSchema = z.enum([
  'document',             // General document
  'spreadsheet',          // Excel/spreadsheet
  'presentation',         // PowerPoint/presentation
  'image',                // Image file
  'drawing',              // Technical drawing/CAD
  'specification',        // Technical specification
  'datasheet',            // Product datasheet
  'certificate',          // Certificates
  'contract',             // Contract document
  'purchase_order',       // Purchase order
  'invoice',              // Invoice
  'quotation',            // Price quotation
  'report',               // Reports
  'email',                // Email correspondence
  'other'                 // Other file types
]);

export type FileType = z.infer<typeof FileTypeSchema>;

// ============================================
// DELIVERY TERMS SCHEMA (INCOTERMS)
// ============================================
export const DeliveryTermsSchema = z.enum([
  'EXW',                  // Ex Works
  'FCA',                  // Free Carrier
  'CPT',                  // Carriage Paid To
  'CIP',                  // Carriage and Insurance Paid To
  'DAP',                  // Delivered At Place
  'DPU',                  // Delivered At Place Unloaded
  'DDP',                  // Delivered Duty Paid
  'FAS',                  // Free Alongside Ship
  'FOB',                  // Free On Board
  'CFR',                  // Cost and Freight
  'CIF'                   // Cost, Insurance and Freight
]);

export type DeliveryTerms = z.infer<typeof DeliveryTermsSchema>;

// ============================================
// REQUEST OUTCOME SCHEMA
// ============================================
export const RequestOutcomeSchema = z.enum([
  'won',                  // Deal won, converted to order
  'lost',                 // Deal lost to competition
  'cancelled',            // Cancelled by customer
  'expired',              // Expired due to timeout
  'no_decision',          // Customer made no decision
  'postponed',            // Postponed to future
  'merged',               // Merged with another request
  'duplicate'             // Duplicate request
]);

export type RequestOutcome = z.infer<typeof RequestOutcomeSchema>;

// ============================================
// REQUEST SOURCE SCHEMA
// ============================================
export const RequestSourceSchema = z.enum([
  'web',                  // Website/portal
  'email',                // Email
  'phone',                // Phone call
  'in_person',            // In-person visit
  'api',                  // API integration
  'import',               // Bulk import
  'mobile',               // Mobile app
  'social_media',         // Social media
  'partner',              // Partner referral
  'other'                 // Other source
]);

export type RequestSource = z.infer<typeof RequestSourceSchema>;

// ============================================
// REQUEST CHANNEL SCHEMA
// ============================================
export const RequestChannelSchema = z.enum([
  'sales_team',           // Direct sales team
  'customer_portal',      // Self-service portal
  'partner',              // Partner channel
  'direct',               // Direct customer contact
  'distributor',          // Distributor network
  'agent',                // Sales agent
  'marketplace',          // Online marketplace
  'tender',               // Public tender
  'other'                 // Other channel
]);

export type RequestChannel = z.infer<typeof RequestChannelSchema>;

// ============================================
// NOTE TYPE SCHEMA
// ============================================
export const NoteTypeSchema = z.enum([
  'general',              // General comments
  'clarification',        // Clarification notes
  'technical',            // Technical details
  'commercial',           // Commercial terms
  'internal',             // Internal only
  'customer_feedback',    // Customer feedback
  'action_item',          // Action required
  'decision',             // Decision made
  'escalation',           // Escalation note
  'resolution'            // Resolution details
]);

export type NoteType = z.infer<typeof NoteTypeSchema>;

// ============================================
// EMPLOYEE ROLE SCHEMA
// ============================================
export const EmployeeRoleSchema = z.enum([
  'owner',                // Primary responsible
  'sales_rep',            // Sales representative
  'technical_lead',       // Technical expert
  'procurement',          // Procurement specialist
  'support',              // Support staff
  'manager',              // Manager/supervisor
  'finance',              // Finance team
  'legal',                // Legal team
  'quality',              // Quality assurance
  'logistics',            // Logistics coordinator
  'observer'              // Observer only
]);

export type EmployeeRole = z.infer<typeof EmployeeRoleSchema>;

// ============================================
// ACTIVITY TYPE SCHEMA
// ============================================
export const ActivityTypeSchema = z.enum([
  'status_change',        // Status changed
  'assignment',           // User assigned/unassigned
  'note_added',           // Note added
  'item_added',           // Item added to request
  'item_updated',         // Item details updated
  'item_removed',         // Item removed
  'file_uploaded',        // File uploaded
  'file_deleted',         // File deleted
  'email_sent',           // Email sent
  'email_received',       // Email received
  'call_logged',          // Phone call logged
  'meeting_held',         // Meeting conducted
  'quote_sent',           // Quote sent to customer
  'quote_received',       // Quote received from supplier
  'approval_requested',   // Approval requested
  'approval_granted',     // Approval granted
  'approval_denied',      // Approval denied
  'escalated',            // Escalated to management
  'merged',               // Merged with another request
  'split',                // Split into multiple requests
  'reminder_sent',        // Reminder sent
  'sla_breach',           // SLA breached
  'custom'                // Custom activity
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

// ============================================
// CURRENCY SCHEMA
// ============================================
export const CurrencySchema = z.enum([
  'USD',                  // US Dollar
  'EUR',                  // Euro
  'GBP',                  // British Pound
  'TRY',                  // Turkish Lira
  'AED',                  // UAE Dirham
  'SAR',                  // Saudi Riyal
  'CNY',                  // Chinese Yuan
  'JPY',                  // Japanese Yen
  'KRW',                  // South Korean Won
  'INR',                  // Indian Rupee
  'CAD',                  // Canadian Dollar
  'AUD',                  // Australian Dollar
  'CHF',                  // Swiss Franc
  'SEK',                  // Swedish Krona
  'NOK',                  // Norwegian Krone
  'DKK',                  // Danish Krone
  'PLN',                  // Polish Zloty
  'RUB',                  // Russian Ruble
  'BRL',                  // Brazilian Real
  'MXN'                   // Mexican Peso
]);

export type Currency = z.infer<typeof CurrencySchema>;

// ============================================
// UNIT OF MEASURE SCHEMA
// ============================================
export const UnitOfMeasureSchema = z.enum([
  // Count
  'piece',                // Individual pieces
  'set',                  // Set of items
  'pair',                 // Pair
  'dozen',                // Dozen (12)
  'gross',                // Gross (144)
  
  // Weight
  'mg',                   // Milligram
  'g',                    // Gram
  'kg',                   // Kilogram
  'ton',                  // Metric ton
  'lb',                   // Pound
  'oz',                   // Ounce
  
  // Length
  'mm',                   // Millimeter
  'cm',                   // Centimeter
  'm',                    // Meter
  'km',                   // Kilometer
  'inch',                 // Inch
  'ft',                   // Foot
  'yard',                 // Yard
  'mile',                 // Mile
  
  // Area
  'sqm',                  // Square meter
  'sqft',                 // Square foot
  'acre',                 // Acre
  'hectare',              // Hectare
  
  // Volume
  'ml',                   // Milliliter
  'l',                    // Liter
  'gal',                  // Gallon
  'barrel',               // Barrel
  'cubic_m',              // Cubic meter
  'cubic_ft',             // Cubic foot
  
  // Time
  'hour',                 // Hour
  'day',                  // Day
  'week',                 // Week
  'month',                // Month
  'year',                 // Year
  
  // Other
  'box',                  // Box
  'pallet',               // Pallet
  'container',            // Container
  'roll',                 // Roll
  'sheet',                // Sheet
  'pack',                 // Pack
  'bottle',               // Bottle
  'can',                  // Can
  'other'                 // Other unit
]);

export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

// Helper to validate status transitions
export function isValidStatusTransition(currentStatus: RequestStatus, newStatus: RequestStatus): boolean {
  const validTransitions: Record<RequestStatus, RequestStatus[]> = {
    'new': ['clarification', 'cancelled', 'on_hold'],
    'clarification': ['supplier_inquiry', 'cancelled', 'on_hold', 'new'],
    'supplier_inquiry': ['pricing', 'offer', 'cancelled', 'on_hold', 'clarification'],
    'pricing': ['offer', 'cancelled', 'on_hold', 'supplier_inquiry'],
    'offer': ['negotiation', 'customer_review', 'approved', 'closed', 'cancelled', 'on_hold'],
    'negotiation': ['offer', 'approved', 'closed', 'cancelled', 'on_hold'],
    'customer_review': ['negotiation', 'approved', 'closed', 'cancelled', 'on_hold'],
    'pending_approval': ['approved', 'closed', 'cancelled', 'on_hold'],
    'approved': ['closed'],
    'closed': [], // No transitions from closed
    'cancelled': [], // No transitions from cancelled
    'expired': [], // No transitions from expired
    'on_hold': ['new', 'clarification', 'supplier_inquiry', 'pricing', 'offer', 'cancelled'],
    'escalated': ['new', 'clarification', 'supplier_inquiry', 'pricing', 'offer', 'closed', 'cancelled']
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

// Helper to get next valid statuses
export function getNextValidStatuses(currentStatus: RequestStatus): RequestStatus[] {
  const validTransitions: Record<RequestStatus, RequestStatus[]> = {
    'new': ['clarification', 'cancelled', 'on_hold'],
    'clarification': ['supplier_inquiry', 'cancelled', 'on_hold', 'new'],
    'supplier_inquiry': ['pricing', 'offer', 'cancelled', 'on_hold', 'clarification'],
    'pricing': ['offer', 'cancelled', 'on_hold', 'supplier_inquiry'],
    'offer': ['negotiation', 'customer_review', 'approved', 'closed', 'cancelled', 'on_hold'],
    'negotiation': ['offer', 'approved', 'closed', 'cancelled', 'on_hold'],
    'customer_review': ['negotiation', 'approved', 'closed', 'cancelled', 'on_hold'],
    'pending_approval': ['approved', 'closed', 'cancelled', 'on_hold'],
    'approved': ['closed'],
    'closed': [],
    'cancelled': [],
    'expired': [],
    'on_hold': ['new', 'clarification', 'supplier_inquiry', 'pricing', 'offer', 'cancelled'],
    'escalated': ['new', 'clarification', 'supplier_inquiry', 'pricing', 'offer', 'closed', 'cancelled']
  };

  return validTransitions[currentStatus] ?? [];
}

// Helper to check if status is final
export function isFinalStatus(status: RequestStatus): boolean {
  return ['closed', 'cancelled', 'expired'].includes(status);
}

// Helper to check if status is active
export function isActiveStatus(status: RequestStatus): boolean {
  return !isFinalStatus(status);
}

// Export all schemas as a collection
export const RequestValidationSchemas = {
  RequestStatus: RequestStatusSchema,
  RequestPriority: RequestPrioritySchema,
  RequestType: RequestTypeSchema,
  RequestCategory: RequestCategorySchema,
  RequestItemStatus: RequestItemStatusSchema,
  CommunicationType: CommunicationTypeSchema,
  ActionStatus: ActionStatusSchema,
  ActionOutcome: ActionOutcomeSchema,
  FileType: FileTypeSchema,
  DeliveryTerms: DeliveryTermsSchema,
  RequestOutcome: RequestOutcomeSchema,
  RequestSource: RequestSourceSchema,
  RequestChannel: RequestChannelSchema,
  NoteType: NoteTypeSchema,
  EmployeeRole: EmployeeRoleSchema,
  ActivityType: ActivityTypeSchema,
  Currency: CurrencySchema,
  UnitOfMeasure: UnitOfMeasureSchema
};