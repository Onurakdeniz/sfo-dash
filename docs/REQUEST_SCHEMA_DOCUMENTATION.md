# Request Management System Schema Documentation

## Overview

This document describes the improved Request Management System schema with English naming conventions. The schema is designed to handle complex request workflows, particularly suited for defense industry procurement and quotation processes.

## Core Tables

### 1. `requests` - Main Request Table

The central table storing all request information with comprehensive metadata.

**Key Features:**
- Unique request numbering per workspace
- Full customer association through business entities
- Workflow management with status and stage tracking
- Parent-child request relationships for follow-ups
- Financial tracking (estimated, quoted, final values)
- Export control and compliance flags
- Comprehensive audit trail

**Workflow States:**
- **Status**: Overall state of the request (new, in_progress, pending_customer, etc.)
- **Stage**: Lifecycle stage (new, clarification, supplier_inquiry, pricing, offer, etc.)

### 2. `request_items` - Individual Products/Services

Stores individual line items within a request.

**Key Features:**
- Revision tracking for item changes
- Detailed product specifications
- Quantity and pricing information
- Delivery requirements per item
- Compliance and certification tracking
- Quality standards and export control

### 3. `request_files` - Document Management

Manages all documents associated with requests.

**Key Features:**
- File categorization (RFQ, technical specs, compliance, etc.)
- Version control
- Visibility controls (internal, customer, supplier)
- Support for various file types
- Metadata and tagging

### 4. `request_notes` - Communication Tracking

Tracks all communications and internal notes.

**Key Features:**
- Multiple note types (internal, customer communication, clarification)
- Communication method tracking
- Visibility controls
- Pin important notes
- Related contact tracking

### 5. `request_team_members` - Team Assignment

Manages personnel assigned to work on requests.

**Key Features:**
- Role-based assignments (owner, technical lead, commercial lead)
- Permission management per team member
- Activity and time tracking
- Assignment history

### 6. `request_activities` - Comprehensive Audit Log

Detailed activity tracking for all request changes.

**Key Features:**
- Activity categorization
- Field-level change tracking
- Related entity tracking
- Customer visibility controls
- IP and session tracking

### 7. `request_actions` - Specific Actions

Tracks specific actions taken during request processing.

**Key Features:**
- Detailed action types (40+ predefined types)
- Communication tracking
- Outcome tracking
- Follow-up management
- Time tracking
- Stage and status context

### 8. `request_stage_transitions` - Workflow Transitions

Tracks stage and status changes throughout the request lifecycle.

**Key Features:**
- Transition history
- Duration tracking per stage
- Automatic vs manual transitions
- Reason and notes for transitions

## Workflow Management

### Stages and Their Purpose

1. **new** - Initial request creation
   - Trigger: User creates new request
   - Purpose: Log initial customer request
   - Actions: Create request and items, attach initial files

2. **clarification** - Requirement gathering
   - Trigger: Request created or manually moved
   - Purpose: Ensure all details are understood
   - Actions: Communicate with customer, update specifications, add files/notes

3. **supplier_inquiry** - Supplier engagement
   - Trigger: Clarification complete
   - Purpose: Ready for sourcing process
   - Actions: Request quotes from suppliers

4. **pricing** - Price calculation
   - Purpose: Calculate and prepare pricing
   - Actions: Analyze costs, apply margins

5. **offer** - Offer preparation
   - Purpose: Prepare and send formal offer
   - Actions: Generate offer documents, send to customer

6. **negotiation** - Commercial negotiation
   - Purpose: Negotiate terms with customer
   - Actions: Revise pricing, adjust terms

7. **closing** - Final stage
   - Purpose: Final activities before closure
   - Actions: Final approvals, contract preparation

8. **closed** - Archived
   - Trigger: Deal won/lost
   - Purpose: Archive request
   - Actions: Request becomes read-only

## Key Improvements Over Original Schema

### 1. English Naming Conventions
- All table and column names in English
- Clear, descriptive naming
- Industry-standard terminology

### 2. Enhanced Workflow Management
- Separate status and stage tracking
- Detailed stage transition history
- Workflow timestamps for each stage

### 3. Comprehensive Team Management
- Multiple team members per request
- Role-based assignments
- Permission management

### 4. Better Document Management
- File versioning support
- Visibility controls
- Category-based organization

### 5. Advanced Action Tracking
- 40+ predefined action types
- Follow-up management
- Outcome tracking

### 6. Item-Level Management
- Individual item tracking
- Revision management
- Item-specific notes and files

### 7. Export Control & Compliance
- ITAR control flags
- End-user certificate tracking
- Certification requirements
- Quality standards

## Migration Path

To migrate from the old `talep` schema to the new `request` schema:

1. **Run the migration**: `npx drizzle-kit push`
2. **Data migration**: Create a script to migrate existing talep data to request tables
3. **Update application code**: Replace talep references with request references
4. **Test thoroughly**: Ensure all workflows function correctly

## Usage Examples

### Creating a New Request

```typescript
const newRequest = await db.insert(request).values({
  id: generateId(),
  requestNumber: generateRequestNumber(),
  workspaceId: workspace.id,
  companyId: company.id,
  title: "RFQ for Defense Electronics",
  description: "Request for quotation for radar components",
  type: "rfq",
  category: "radar_systems",
  customerId: customer.id,
  createdBy: user.id,
});
```

### Adding Request Items

```typescript
const requestItem = await db.insert(requestItem).values({
  id: generateId(),
  requestId: request.id,
  itemNumber: 1,
  productName: "Radar Transceiver Module",
  requestedQuantity: 10,
  specifications: {
    frequency: "X-band",
    power: "100W",
  },
  exportControlled: true,
});
```

### Tracking Stage Transitions

```typescript
const transition = await db.insert(requestStageTransition).values({
  id: generateId(),
  requestId: request.id,
  fromStage: "new",
  toStage: "clarification",
  fromStatus: "new",
  toStatus: "in_progress",
  reason: "Moving to clarification phase",
  transitionedBy: user.id,
});
```

## Best Practices

1. **Always track activities**: Use the activity log for all changes
2. **Document communications**: Record all customer interactions in notes
3. **Manage visibility**: Set appropriate visibility flags for files and notes
4. **Track time**: Use the time tracking features for accurate project costing
5. **Follow workflow**: Respect the stage progression for consistency
6. **Use metadata**: Leverage JSON fields for flexible, type-specific data

## Security Considerations

1. **Access Control**: Implement row-level security based on workspace and company
2. **Sensitive Data**: Use encryption for sensitive fields
3. **Audit Trail**: Maintain comprehensive audit logs
4. **Export Control**: Properly flag and handle export-controlled items
5. **Data Retention**: Implement appropriate data retention policies

## Performance Optimization

The schema includes numerous indexes for optimal query performance:
- Status and stage indexes for filtering
- Customer and team member indexes for relationships
- Date indexes for time-based queries
- Composite indexes for common query patterns

## Conclusion

This improved schema provides a robust foundation for a comprehensive request management system, with particular strength in handling complex procurement workflows in regulated industries like defense. The English naming conventions, enhanced workflow management, and comprehensive tracking capabilities make it suitable for international business operations.