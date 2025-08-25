# Request Management System - Database Schema Documentation

## Overview
The Request Management System is a comprehensive solution for tracking customer requests through their entire lifecycle, from initial inquiry to final resolution. The system is designed with defense industry and B2B procurement processes in mind, supporting complex workflows, multi-item requests, and detailed audit trails.

## Core Concepts

### Request (Main Entity)
The `request` table is the central entity that represents a customer's request for products, services, or information. Each request:
- Has a unique request number (e.g., REQ-2024-001)
- Is associated with a customer (business entity)
- Moves through defined workflow stages
- Can contain multiple items
- Has assigned team members
- Maintains comprehensive activity logs

### Key Features
1. **Multi-item Support**: Each request can contain multiple products/services
2. **Team Collaboration**: Multiple employees can be assigned with different roles
3. **File Management**: Documents can be attached at request or item level
4. **Activity Tracking**: All actions are logged for audit purposes
5. **Workflow Management**: Requests progress through defined stages
6. **Revision Tracking**: Changes to request items are versioned

## Database Tables

### 1. Request Table (`request`)
**Purpose**: Core request information and metadata

**Key Fields**:
- `id`: Primary identifier
- `requestNumber`: Unique request number
- `status`: Current workflow status
- `customerId`: Link to customer (business entity)
- `ownerId`: Primary responsible person
- Financial fields (estimated, quoted, final values)
- Workflow tracking fields
- Audit fields

**Workflow States**:
- `new`: Initial state when request is created
- `clarification`: Gathering requirements from customer
- `supplier_inquiry`: Ready for supplier quotations
- `pricing`: Calculating pricing
- `offer`: Formal offer sent
- `negotiation`: In negotiation
- `customer_review`: Customer reviewing
- `approved`: Approved, moving to order
- `closed`: Completed (won/lost)
- `cancelled`: Cancelled

### 2. Request Items Table (`request_item`)
**Purpose**: Individual products/services within a request

**Key Fields**:
- `requestId`: Link to parent request
- `itemNumber`: Line item number
- `revision`: Version number for tracking changes
- Product details (code, name, specifications)
- Quantity and pricing information
- Compliance requirements (certifications, export controls)
- `status`: Item-specific status

**Item Statuses**:
- `pending`: Awaiting processing
- `reviewing`: Under review
- `sourcing`: Finding suppliers
- `quoted`: Price provided
- `approved`: Customer approved
- `rejected`: Customer rejected
- `ordered`: Ordered from supplier

### 3. Request Item Revisions Table (`request_item_revision`)
**Purpose**: Track all changes to request items

**Key Fields**:
- `requestItemId`: Link to item
- `revisionNumber`: Sequential revision number
- `itemData`: Complete snapshot of item at revision
- `changeType`: Type of change made
- `changedFields`: Which fields were modified

### 4. Request Files Table (`request_file`)
**Purpose**: Document management for requests

**Key Fields**:
- `requestId`: Link to request
- `requestItemId`: Optional link to specific item
- File metadata (name, type, size)
- `category`: Document classification
- `isInternal`: Internal-only flag
- Version tracking fields

**File Categories**:
- RFQ documents
- Technical specifications
- Certificates
- Contracts
- Quotations
- General documents

### 5. Request Notes Table (`request_note`)
**Purpose**: Comments and notes on requests

**Key Fields**:
- `noteType`: Classification of note
- `isInternal`: Internal visibility flag
- `isCustomerVisible`: Customer can see
- `isPinned`: Important note flag

**Note Types**:
- `general`: General comments
- `clarification`: Clarification notes
- `technical`: Technical details
- `commercial`: Commercial terms
- `internal`: Internal only

### 6. Request Employees Table (`request_employee`)
**Purpose**: Team member assignments

**Key Fields**:
- `userId`: Assigned user
- `role`: Role in this request
- Permission flags (edit, delete, change status)
- `isPrimary`: Primary contact for role
- Assignment period tracking

**Employee Roles**:
- `owner`: Primary responsible
- `sales_rep`: Sales representative
- `technical_lead`: Technical expert
- `procurement`: Procurement specialist
- `support`: Support staff

### 7. Request Activities Table (`request_activity`)
**Purpose**: Comprehensive audit log

**Key Fields**:
- `activityType`: Type of activity
- `importance`: Activity importance level
- Change tracking (old/new values)
- System metadata (IP, user agent)

**Activity Types**:
- Status changes
- Assignments
- Note additions
- Item updates
- File uploads
- Email communications

### 8. Request Actions Table (`request_action`)
**Purpose**: Specific actions taken (calls, meetings, etc.)

**Key Fields**:
- `actionType`: Type of action
- Scheduling fields (scheduled, started, completed)
- Participant tracking
- Outcome and follow-up fields
- Location/meeting details

**Action Types**:
- `call`: Phone call
- `email`: Email sent
- `meeting`: Meeting held
- `site_visit`: Customer visit
- `quote_request`: Quote requested
- `sample_sent`: Sample provided

### 9. Request Workflow Stages Table (`request_workflow_stage`)
**Purpose**: Track progression through workflow

**Key Fields**:
- `stage`: Current stage
- Entry/exit timestamps
- `duration`: Time in stage
- Completion criteria and status
- `blockers`: What's preventing progress

## Workflow Implementation

### Stage Transitions

#### 1. New → Clarification
**Trigger**: Request created or needs clarification
**Actions**:
- Set `status` to 'clarification'
- Set `clarificationStartedAt`
- Create workflow stage record
- Log activity

#### 2. Clarification → Supplier Inquiry
**Trigger**: All details clarified
**Validation**:
- All required item specifications complete
- Customer contact confirmed
- `isClarified` = true
**Actions**:
- Set `status` to 'supplier_inquiry'
- Set `clarificationCompletedAt`
- Update workflow stage
- Notify procurement team

#### 3. Supplier Inquiry → Pricing/Offer
**Trigger**: Quotes received from suppliers
**Actions**:
- Update `suppliersContacted` and `quotesReceived`
- Set item prices
- Calculate total values
- Progress to pricing/offer stage

#### 4. Any Stage → Closed
**Trigger**: Deal won/lost or cancelled
**Actions**:
- Set `status` to 'closed'
- Set `outcome` (won/lost/cancelled)
- Set `closedAt` and `closedBy`
- Make request read-only

## Best Practices

### 1. Data Integrity
- Use database transactions for multi-table updates
- Implement optimistic locking with version field
- Validate status transitions
- Maintain referential integrity

### 2. Performance
- Index frequently queried fields
- Use composite indexes for common query patterns
- Implement pagination for large result sets
- Consider partitioning for historical data

### 3. Security
- Implement row-level security based on assignments
- Audit all data changes
- Encrypt sensitive data
- Validate all user inputs

### 4. Workflow Management
- Validate status transitions
- Track time in each stage
- Implement SLA monitoring
- Send notifications on stage changes

## Example Queries

### Get Active Requests for a User
```sql
SELECT r.*, re.role 
FROM request r
JOIN request_employee re ON r.id = re.request_id
WHERE re.user_id = ? 
  AND re.is_active = true
  AND r.status NOT IN ('closed', 'cancelled')
ORDER BY r.priority DESC, r.created_at DESC;
```

### Get Request with All Items
```sql
SELECT r.*, 
       json_agg(ri.*) as items
FROM request r
LEFT JOIN request_item ri ON r.id = ri.request_id
WHERE r.id = ?
GROUP BY r.id;
```

### Track Stage Duration
```sql
SELECT stage, 
       AVG(duration) as avg_duration,
       COUNT(*) as count
FROM request_workflow_stage
WHERE request_id IN (
  SELECT id FROM request 
  WHERE workspace_id = ?
    AND created_at > NOW() - INTERVAL '30 days'
)
GROUP BY stage;
```

## Migration from Old Schema

The new schema maintains backward compatibility while adding enhanced features:

1. **Table Mapping**:
   - `talep` → `request`
   - `talep_product` → `request_item`
   - `talep_note` → `request_note`
   - `talep_file` → `request_file`
   - `talep_activity` → `request_activity`
   - `talep_action` → `request_action`

2. **New Tables**:
   - `request_item_revision`: Version tracking
   - `request_employee`: Team assignments
   - `request_workflow_stage`: Workflow tracking

3. **Enhanced Fields**:
   - Better workflow status management
   - Comprehensive financial tracking
   - Improved audit trails
   - More detailed item specifications

## API Integration Points

### Request Creation
```typescript
interface CreateRequestInput {
  title: string;
  description?: string;
  customerId: string;
  customerContactId?: string;
  type: RequestType;
  priority: RequestPriority;
  items: CreateRequestItemInput[];
  requestedDeliveryDate?: Date;
}
```

### Status Updates
```typescript
interface UpdateRequestStatusInput {
  requestId: string;
  newStatus: RequestStatus;
  reason?: string;
  notes?: string;
}
```

### Item Revisions
```typescript
interface ReviseRequestItemInput {
  itemId: string;
  changes: Partial<RequestItem>;
  reason: string;
}
```

## Conclusion

This schema provides a robust foundation for managing complex B2B requests with:
- Complete audit trails
- Flexible workflow management
- Multi-user collaboration
- Comprehensive document management
- Detailed item tracking with revisions
- Strong data integrity and performance

The design supports both current requirements and future extensions while maintaining clean separation of concerns and following database best practices.
