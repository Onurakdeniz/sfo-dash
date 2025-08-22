# Product and Supplier System Documentation

## Overview

This document describes the comprehensive product and supplier management system that has been implemented. The system provides full-featured management of products, suppliers, inventory, and their relationships.

## Database Schema

### Product-Related Tables

#### 1. **products**
Main product information table with comprehensive product details.

Key fields:
- `id`: Unique identifier
- `workspaceId`, `companyId`: Multi-tenant support
- `name`, `description`, `shortDescription`: Product details
- `sku`, `barcode`, `qrCode`: Product identifiers
- `productType`: physical, service, digital, bundle, raw_material, consumable
- `productCategory`: electronics, clothing, food_beverage, etc.
- `status`: active, inactive, draft, discontinued, out_of_stock, coming_soon
- `unit`: piece, kg, g, ton, lt, ml, m, m2, m3, etc.
- Physical properties: `weight`, `width`, `height`, `depth`, `volume`
- Inventory settings: `trackInventory`, `minStockLevel`, `maxStockLevel`, `reorderPoint`
- Pricing: `basePrice`, `currency`, `taxRate`
- Manufacturing: `manufacturer`, `brand`, `model`, `countryOfOrigin`
- Images and documents: `primaryImageUrl`, `images[]`, `documents[]`
- Features and specifications as JSON

#### 2. **product_variants**
For products with variations (size, color, etc.)

Key fields:
- Links to parent product
- `variantSku`, `variantBarcode`
- `attributes`: JSON object for variant properties
- Override pricing and physical properties
- Individual stock tracking

#### 3. **product_inventory**
Current stock levels and inventory tracking

Key fields:
- Stock quantities: `quantityOnHand`, `quantityAvailable`, `quantityReserved`
- `quantityIncoming`, `quantityOutgoing`
- Stock values: `averageCost`, `lastPurchasePrice`, `totalValue`
- Location tracking: `warehouseId`, `location`
- Batch/lot tracking: `batchNumber`, `serialNumber`, `expiryDate`
- Alert flags: `lowStockAlert`, `outOfStockAlert`

#### 4. **product_price_history**
Tracks all price changes over time

Key fields:
- Price types: purchase, selling, list, special, contract, promotional
- `oldPrice`, `newPrice`, `changePercentage`
- `effectiveFrom`, `effectiveTo`
- Links to supplier for purchase prices

### Supplier-Related Tables

#### 1. **suppliers**
Main supplier information table

Key fields:
- Business information: `name`, `fullName`, `supplierLogoUrl`
- `supplierType`: individual, corporate
- `supplierCategory`: strategic, preferred, approved, standard, new, temporary
- `status`: active, inactive, prospect, suspended, blacklisted, closed
- Contact: `phone`, `email`, `website`, `fax`
- Address: `address`, `district`, `city`, `postalCode`, `country`
- Tax info: `taxOffice`, `taxNumber`, `mersisNumber`, `tradeRegistryNumber`
- Financial: `creditLimit`, `paymentTerms`, `discountRate`
- Supply terms: `leadTimeDays`, `minimumOrderQuantity`, `orderIncrement`
- Ratings: `qualityRating`, `deliveryRating`

#### 2. **supplier_addresses**
Multiple addresses per supplier

Key fields:
- `addressType`: billing, shipping, warehouse, etc.
- Full address details
- `isDefault`, `isActive` flags

#### 3. **supplier_contacts**
Contact persons for suppliers

Key fields:
- Contact details: `firstName`, `lastName`, `title`, `department`
- Communication: `phone`, `mobile`, `email`, `fax`
- `role`: sales_rep, account_manager, technical_support, etc.
- `isPrimary`, `isActive` flags

#### 4. **supplier_files**
Documents associated with suppliers

Key fields:
- `category`: contract, certificate, catalog, document, etc.
- File storage: `blobUrl`, `blobPath`
- Metadata and audit trail

#### 5. **supplier_notes**
Track interactions and notes

Key fields:
- `noteType`: general, call, meeting, email, etc.
- `isInternal` flag for internal-only notes
- `priority`: high, medium, low

#### 6. **supplier_performance**
Performance metrics over time

Key fields:
- Performance period tracking
- Metrics: `onTimeDeliveryRate`, `qualityRating`, `responseTimeHours`
- Financial metrics: `totalOrders`, `totalOrderValue`
- Issue tracking: `qualityIssues`, `deliveryIssues`, `communicationIssues`
- `overallScore` calculation

### Relationship Tables

#### **supplier_products**
Links suppliers to products they can provide

Key fields:
- Supplier-specific product info: `supplierSku`, `supplierProductName`
- Pricing: `purchasePrice`, `priceValidFrom`, `priceValidTo`
- Supply terms specific to this product
- `isPreferred` flag and `priority` ordering
- Contract information

## API Endpoints

### Product Endpoints

#### `GET /api/workspaces/[workspaceId]/products`
List products with filtering, sorting, and pagination.

Query parameters:
- `page`, `limit`: Pagination
- `search`: Search in name, SKU, barcode, manufacturer, brand
- `status`, `category`, `type`: Filter by enums
- `sortBy`, `sortOrder`: Sorting options
- `companyId`: Filter by company

Response includes:
- Product list with stock levels and supplier count
- Pagination metadata

#### `POST /api/workspaces/[workspaceId]/products`
Create a new product.

Required fields:
- `name`, `sku`, `companyId`

Optional initial stock can be provided.

#### `GET /api/workspaces/[workspaceId]/products/[productId]`
Get detailed product information including:
- Full product details
- Variants
- Suppliers
- Inventory details
- Price history

#### `PATCH /api/workspaces/[workspaceId]/products/[productId]`
Update product information.
- Validates unique constraints (SKU, barcode)
- Tracks price changes automatically

#### `DELETE /api/workspaces/[workspaceId]/products/[productId]`
Soft delete a product.

### Supplier Endpoints

#### `GET /api/workspaces/[workspaceId]/suppliers`
List suppliers with filtering, sorting, and pagination.

Query parameters:
- `page`, `limit`: Pagination
- `search`: Search in name, email, phone, tax number, supplier code
- `status`, `category`, `type`, `priority`: Filters
- `sortBy`, `sortOrder`: Sorting options
- `companyId`: Filter by company

Response includes:
- Supplier list with contact and address counts
- Pagination metadata

#### `POST /api/workspaces/[workspaceId]/suppliers`
Create a new supplier.

Required fields:
- `name`, `companyId`

Automatically creates:
- Primary contact (if provided)
- Default address (if provided)

#### `GET /api/workspaces/[workspaceId]/suppliers/[supplierId]`
Get detailed supplier information including:
- Full supplier details
- Contacts
- Addresses
- Files
- Recent notes
- Performance history
- Products supplied

#### `PATCH /api/workspaces/[workspaceId]/suppliers/[supplierId]`
Update supplier information.
- Validates unique constraints (supplier code, tax number)

#### `DELETE /api/workspaces/[workspaceId]/suppliers/[supplierId]`
Soft delete a supplier.
- Prevents deletion if supplier has active products

## Features

### Product Management
- Comprehensive product information tracking
- Product variants support
- Multi-currency pricing
- Inventory tracking with multiple warehouse locations
- Batch/lot tracking with expiry dates
- Automatic price history tracking
- Product categorization and tagging
- Image and document management
- SEO fields for e-commerce

### Supplier Management
- Detailed supplier profiles
- Multiple addresses and contacts per supplier
- Performance tracking and ratings
- Document management
- Supplier categorization (strategic, preferred, etc.)
- Credit limit and payment terms
- Lead time tracking
- Quality and delivery ratings

### Product-Supplier Relationships
- Link products to multiple suppliers
- Supplier-specific pricing and terms
- Preferred supplier designation
- Contract tracking
- Price validity periods

### Inventory Management
- Real-time stock tracking
- Available vs. reserved quantities
- Incoming and outgoing stock tracking
- Low stock alerts
- Stock valuation (average cost, last purchase price)
- Multiple warehouse/location support

## Security and Multi-tenancy

- All endpoints require authentication
- Workspace-based access control
- Company-level data isolation
- Role-based permissions (owner, admin, member)
- Soft delete for data recovery
- Comprehensive audit trails

## Data Validation

- Unique constraints on SKU and barcode per company
- Unique supplier codes and tax numbers
- Email and phone number format validation
- Price and tax rate range validation
- Stock level consistency checks

## Usage Examples

### Creating a Product
```javascript
POST /api/workspaces/[workspaceId]/products
{
  "name": "Laptop Computer",
  "sku": "LAPTOP-001",
  "companyId": "company-123",
  "productType": "physical",
  "productCategory": "electronics",
  "basePrice": 15000,
  "currency": "TRY",
  "taxRate": 18,
  "trackInventory": true,
  "minStockLevel": 5,
  "reorderPoint": 10,
  "initialStock": 20
}
```

### Creating a Supplier
```javascript
POST /api/workspaces/[workspaceId]/suppliers
{
  "name": "Tech Supplies Co.",
  "companyId": "company-123",
  "supplierType": "corporate",
  "supplierCategory": "preferred",
  "taxNumber": "1234567890",
  "email": "contact@techsupplies.com",
  "phone": "+90 212 555 0123",
  "address": "123 Tech Street",
  "city": "Istanbul",
  "primaryContactName": "John Doe",
  "primaryContactEmail": "john@techsupplies.com"
}
```

## Next Steps

To complete the implementation, you'll need to:

1. **Run Database Migration**
   ```bash
   npm run db:migrate
   ```

2. **Create UI Components** (pending tasks):
   - Product list, form, and detail views
   - Supplier list, form, and detail views
   - Inventory management interface
   - Product-supplier relationship management

3. **Additional Features to Consider**:
   - Purchase order management
   - Stock movement tracking
   - Barcode scanning integration
   - Supplier portal
   - Automated reordering
   - Price comparison tools
   - Quality control tracking

## Database Relationships Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  products   │────<│ product_variants │     │ product_inventory│
└─────────────┘     └──────────────────┘     └─────────────────┘
      │                                              │
      │                                              │
      ├────────────────────────────────────────────<│
      │
      │            ┌──────────────────┐
      ├───────────<│ supplier_products│>────────────┐
      │            └──────────────────┘             │
      │                                             │
      │            ┌────────────────────┐      ┌────────────┐
      └───────────<│product_price_history│     │ suppliers  │
                   └────────────────────┘      └────────────┘
                                                     │
                           ┌─────────────────────────┼─────────────────────┐
                           │                         │                     │
                    ┌──────────────┐         ┌──────────────┐      ┌──────────────┐
                    │supplier_addresses│      │supplier_contacts│   │supplier_notes│
                    └──────────────┘         └──────────────┘      └──────────────┘
```

This system provides a robust foundation for managing products and suppliers with comprehensive tracking, multi-tenancy support, and extensive customization options.