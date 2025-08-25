import { pgEnum } from "drizzle-orm/pg-core";

// Request workflow status - represents the overall state
export const requestStatusEnum = pgEnum("request_status", [
  "new",                  // New request created
  "in_progress",          // Being processed
  "pending_customer",     // Waiting for customer input
  "pending_supplier",     // Waiting for supplier response
  "pending_internal",     // Waiting for internal approval/action
  "quoted",              // Quote has been prepared
  "negotiating",         // In negotiation with customer
  "approved",            // Customer approved the offer
  "rejected",            // Customer rejected the offer
  "on_hold",             // Temporarily on hold
  "closed",              // Request is closed
  "cancelled"            // Request was cancelled
]);

// Request workflow stages - represents the lifecycle stage
export const requestStageEnum = pgEnum("request_stage", [
  "new",                 // Initial stage when request is created
  "clarification",       // Gathering and clarifying requirements
  "supplier_inquiry",    // Requesting quotes from suppliers
  "pricing",             // Calculating and preparing pricing
  "offer",               // Offer preparation and submission
  "negotiation",         // Commercial negotiation
  "closing",             // Final stage before closure
  "closed"               // Request is archived
]);

// Request priority levels
export const requestPriorityEnum = pgEnum("request_priority", [
  "low",                 // Low priority
  "medium",              // Medium priority
  "high",                // High priority
  "urgent",              // Urgent priority
  "critical"             // Critical priority
]);

// Request types - aligned with defense industry standards
export const requestTypeEnum = pgEnum("request_type", [
  // Standard procurement types
  "rfq",                 // Request for Quotation
  "rfi",                 // Request for Information
  "rfp",                 // Request for Proposal
  "rft",                 // Request for Tender
  
  // Specific request types
  "product_inquiry",     // Product information inquiry
  "price_request",       // Price request only
  "quotation_request",   // Formal quotation request
  "order_request",       // Direct order request
  "sample_request",      // Sample/demo request
  "technical_inquiry",   // Technical specification inquiry
  
  // Compliance and certification
  "certification_req",   // Certification requirement
  "compliance_inquiry",  // Compliance verification
  "export_license",      // Export license request
  "end_user_cert",       // End user certificate request
  
  // Support and service
  "technical_support",   // Technical support request
  "maintenance",         // Maintenance request
  "training",            // Training request
  "installation",        // Installation service request
  
  // Other types
  "delivery_status",     // Delivery status inquiry
  "return_request",      // Return/RMA request
  "complaint",           // Complaint
  "general_inquiry",     // General inquiry
  "other"                // Other type
]);

// Request categories - defense industry focused
export const requestCategoryEnum = pgEnum("request_category", [
  // Defense systems
  "weapon_systems",      // Weapon systems and platforms
  "ammunition",          // Ammunition and explosives
  "missiles",            // Missile systems
  "uav_systems",         // Unmanned aerial vehicles
  
  // Electronics and communication
  "avionics",           // Aviation electronics
  "radar_systems",      // Radar and detection systems
  "communication",      // Communication systems
  "electronic_warfare", // Electronic warfare systems
  "c4isr",             // Command, Control, Communications, Computers, ISR
  
  // Platform specific
  "naval_systems",      // Naval platforms and systems
  "land_systems",       // Land vehicles and systems
  "air_systems",        // Aircraft and air systems
  "space_systems",      // Space and satellite systems
  
  // Support systems
  "simulation",         // Simulation and training systems
  "cyber_security",     // Cybersecurity solutions
  "logistics",          // Logistics and support equipment
  "maintenance_equip",  // Maintenance equipment
  
  // Components and materials
  "electronics",        // Electronic components
  "mechanical",         // Mechanical components
  "materials",          // Raw materials and composites
  "software",           // Software and licenses
  
  // General categories
  "hardware",           // General hardware
  "services",           // Services
  "spare_parts",        // Spare parts
  "consumables",        // Consumable items
  "other"               // Other category
]);

// Request action types - specific actions that can be taken
export const requestActionTypeEnum = pgEnum("request_action_type", [
  // Communication actions
  "email_sent",         // Email communication sent
  "email_received",     // Email communication received
  "call_made",          // Phone call made
  "call_received",      // Phone call received
  "meeting_held",       // Meeting conducted
  "site_visit",         // Site visit conducted
  "video_conference",   // Video conference held
  
  // Document actions
  "document_requested", // Document requested from customer/supplier
  "document_received",  // Document received
  "document_sent",      // Document sent
  "specification_updated", // Specification updated
  
  // Supplier actions
  "supplier_contacted", // Supplier contacted for quote
  "quote_requested",    // Quote formally requested
  "quote_received",     // Quote received from supplier
  "supplier_selected",  // Supplier selected
  "supplier_rejected",  // Supplier rejected
  
  // Commercial actions
  "price_calculated",   // Price calculation completed
  "offer_prepared",     // Offer document prepared
  "offer_sent",         // Offer sent to customer
  "offer_revised",      // Offer revised
  "negotiation_round",  // Negotiation round conducted
  "discount_applied",   // Discount applied
  
  // Internal actions
  "internal_review",    // Internal review conducted
  "approval_requested", // Approval requested
  "approval_granted",   // Approval granted
  "approval_denied",    // Approval denied
  "escalation",         // Issue escalated
  
  // Customer actions
  "customer_clarification", // Clarification from customer
  "customer_feedback",  // Feedback from customer
  "customer_approval",  // Customer approval received
  "customer_rejection", // Customer rejection received
  
  // Technical actions
  "technical_review",   // Technical review completed
  "compliance_check",   // Compliance check performed
  "certification_verified", // Certification verified
  "export_control_check", // Export control check
  
  // Follow-up actions
  "follow_up_scheduled", // Follow-up scheduled
  "follow_up_completed", // Follow-up completed
  "reminder_sent",      // Reminder sent
  
  // Other actions
  "note_added",         // Note added
  "status_changed",     // Status changed
  "assignment_changed", // Assignment changed
  "other"               // Other action type
]);