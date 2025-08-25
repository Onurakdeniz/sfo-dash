import { pgEnum } from "drizzle-orm/pg-core";

// ============================================
// REQUEST WORKFLOW STATUS ENUM
// ============================================
// Defines the lifecycle stages of a request
export const requestStatusEnum = pgEnum("request_status", [
  // Initial Stage
  "new",                    // New request created, awaiting processing
  
  // Clarification Stage
  "clarification",          // Gathering requirements and specifications from customer
  
  // Sourcing Stage  
  "supplier_inquiry",       // Ready for supplier quotations, handed over to procurement
  
  // Commercial Stages
  "pricing",               // Calculating and preparing pricing
  "offer",                 // Formal offer sent to customer
  "negotiation",           // In negotiation with customer
  
  // Decision Stages
  "customer_review",       // Customer reviewing the offer
  "pending_approval",      // Awaiting internal or customer approval
  
  // Final Stages
  "approved",              // Request approved, moving to order
  "closed",                // Request closed (won or lost)
  "cancelled",             // Request cancelled
  "expired",               // Request expired due to timeout
  
  // Special States
  "on_hold",               // Temporarily paused
  "escalated"              // Escalated to management
]);

// ============================================
// REQUEST PRIORITY ENUM
// ============================================
export const requestPriorityEnum = pgEnum("request_priority", [
  "low",                   // Low priority
  "medium",                // Normal priority
  "high",                  // High priority  
  "urgent",                // Urgent, needs immediate attention
  "critical"               // Critical, business impact
]);

// ============================================
// REQUEST TYPE ENUM
// ============================================
// Types of requests in defense/procurement context
export const requestTypeEnum = pgEnum("request_type", [
  // Procurement Requests
  "rfq",                   // Request for Quotation
  "rfi",                   // Request for Information
  "rfp",                   // Request for Proposal
  "rft",                   // Request for Tender
  
  // Product Requests
  "product_inquiry",       // General product inquiry
  "price_request",         // Price inquiry only
  "availability_check",    // Stock/availability check
  "technical_inquiry",     // Technical specifications inquiry
  
  // Sample & Trial
  "sample_request",        // Request for product samples
  "trial_request",         // Trial/evaluation request
  "demo_request",          // Product demonstration request
  
  // Order Related
  "order_request",         // Direct order request
  "repeat_order",          // Repeat of previous order
  "blanket_order",         // Framework/blanket order
  "call_off_order",        // Call-off from blanket order
  
  // Compliance & Documentation
  "certification_request", // Certification documents request
  "compliance_inquiry",    // Compliance verification
  "export_license",        // Export license request
  "end_user_certificate",  // End-user certificate request
  
  // Service Requests
  "service_request",       // Service inquiry
  "maintenance_request",   // Maintenance service
  "training_request",      // Training services
  "installation_request",  // Installation services
  "calibration_request",   // Calibration services
  
  // Support & Issues
  "technical_support",     // Technical support request
  "warranty_claim",        // Warranty claim
  "complaint",             // Customer complaint
  "return_request",        // Return/RMA request
  
  // Other
  "custom_manufacturing",  // Custom manufacturing request
  "modification_request",  // Product modification request
  "general_inquiry",       // General inquiry
  "other"                  // Other type of request
]);

// ============================================
// REQUEST CATEGORY ENUM
// ============================================
// Categories specific to defense and industrial sectors
export const requestCategoryEnum = pgEnum("request_category", [
  // Defense Categories
  "weapon_systems",        // Weapon systems and platforms
  "ammunition",            // Ammunition and explosives
  "avionics",             // Aviation electronics
  "radar_systems",        // Radar and detection systems
  "communication_systems", // Military communication systems
  "electronic_warfare",    // EW systems and countermeasures
  "naval_systems",        // Naval platforms and systems
  "land_systems",         // Land vehicles and systems
  "air_systems",          // Aircraft and aerial systems
  "space_systems",        // Space and satellite systems
  "missile_systems",      // Missile and rocket systems
  "uav_systems",          // Unmanned aerial vehicles
  "cyber_security",       // Cyber defense systems
  "simulation_training",  // Simulation and training systems
  "c4isr",               // Command, Control, Communications, Computers, ISR
  
  // Industrial Categories
  "industrial_equipment", // Industrial machinery
  "automation",          // Automation systems
  "sensors",             // Sensors and measurement
  "power_systems",       // Power generation and distribution
  "hydraulics",          // Hydraulic systems
  "pneumatics",          // Pneumatic systems
  "electronics",         // Electronic components
  "mechanical_parts",    // Mechanical components
  "raw_materials",       // Raw materials and commodities
  "chemicals",           // Chemical products
  "safety_equipment",    // Safety and protective equipment
  
  // IT Categories
  "hardware",            // Computer hardware
  "software",            // Software solutions
  "networking",          // Network equipment
  "data_center",         // Data center equipment
  "security_systems",    // Security and surveillance
  
  // Services
  "maintenance_services", // Maintenance and repair
  "engineering_services", // Engineering and design
  "logistics_services",   // Logistics and transportation
  "consulting_services",  // Consulting and advisory
  
  // Other
  "spare_parts",         // Spare parts and consumables
  "tools_equipment",     // Tools and equipment
  "office_supplies",     // Office supplies
  "other"               // Other categories
]);

// ============================================
// REQUEST ITEM STATUS ENUM
// ============================================
// Status for individual items within a request
export const requestItemStatusEnum = pgEnum("request_item_status", [
  "pending",              // Awaiting processing
  "reviewing",            // Under technical review
  "sourcing",             // Finding suppliers
  "quoted",               // Price quoted
  "approved",             // Approved by customer
  "rejected",             // Rejected by customer
  "alternative_offered",  // Alternative product offered
  "ordered",              // Ordered from supplier
  "delivered",            // Delivered to customer
  "cancelled",            // Cancelled
  "out_of_stock",        // Not available
  "discontinued"          // Product discontinued
]);

// ============================================
// COMMUNICATION TYPE ENUM
// ============================================
export const communicationTypeEnum = pgEnum("communication_type", [
  "email",                // Email communication
  "phone",                // Phone call
  "video_call",           // Video conference
  "meeting",              // In-person meeting
  "site_visit",           // Customer site visit
  "chat",                 // Chat/instant messaging
  "portal_message",       // Message via customer portal
  "fax",                  // Fax communication
  "letter",               // Physical letter
  "whatsapp",             // WhatsApp message
  "other"                 // Other communication method
]);

// ============================================
// ACTION STATUS ENUM
// ============================================
export const actionStatusEnum = pgEnum("action_status", [
  "pending",              // Not yet started
  "scheduled",            // Scheduled for future
  "in_progress",          // Currently ongoing
  "completed",            // Successfully completed
  "failed",               // Failed to complete
  "cancelled",            // Cancelled
  "postponed",            // Postponed to later date
  "waiting",              // Waiting for response/input
]);

// ============================================
// ACTION OUTCOME ENUM
// ============================================
export const actionOutcomeEnum = pgEnum("action_outcome", [
  "successful",           // Successful outcome
  "unsuccessful",         // Unsuccessful
  "partially_successful", // Partial success
  "follow_up_required",   // Needs follow-up
  "escalated",            // Escalated to higher level
  "no_response",          // No response received
  "rescheduled",          // Rescheduled for later
  "information_gathered", // Information collected
  "decision_pending",     // Awaiting decision
  "action_required"       // Further action needed
]);

// ============================================
// FILE TYPE ENUM
// ============================================
export const fileTypeEnum = pgEnum("file_type", [
  "document",             // General document
  "spreadsheet",          // Excel/spreadsheet
  "presentation",         // PowerPoint/presentation
  "image",                // Image file
  "drawing",              // Technical drawing/CAD
  "specification",        // Technical specification
  "datasheet",            // Product datasheet
  "certificate",          // Certificates
  "contract",             // Contract document
  "purchase_order",       // Purchase order
  "invoice",              // Invoice
  "quotation",            // Price quotation
  "report",               // Reports
  "email",                // Email correspondence
  "other"                 // Other file types
]);

// ============================================
// DELIVERY TERMS ENUM (INCOTERMS)
// ============================================
export const deliveryTermsEnum = pgEnum("delivery_terms", [
  "EXW",                  // Ex Works
  "FCA",                  // Free Carrier
  "CPT",                  // Carriage Paid To
  "CIP",                  // Carriage and Insurance Paid To
  "DAP",                  // Delivered At Place
  "DPU",                  // Delivered At Place Unloaded
  "DDP",                  // Delivered Duty Paid
  "FAS",                  // Free Alongside Ship
  "FOB",                  // Free On Board
  "CFR",                  // Cost and Freight
  "CIF"                   // Cost, Insurance and Freight
]);

// ============================================
// REQUEST OUTCOME ENUM
// ============================================
export const requestOutcomeEnum = pgEnum("request_outcome", [
  "won",                  // Deal won, converted to order
  "lost",                 // Deal lost to competition
  "cancelled",            // Cancelled by customer
  "expired",              // Expired due to timeout
  "no_decision",          // Customer made no decision
  "postponed",            // Postponed to future
  "merged",               // Merged with another request
  "duplicate"             // Duplicate request
]);