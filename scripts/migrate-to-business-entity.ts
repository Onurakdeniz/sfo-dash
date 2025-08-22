import { db } from "@/db";
import { customer, supplier, businessEntity } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

/**
 * Migration script to consolidate customers and suppliers into businessEntity
 * This script:
 * 1. Migrates all customers to businessEntity
 * 2. Migrates all suppliers to businessEntity  
 * 3. Handles entities that are both customer and supplier
 */

async function migrateCustomersToBusinessEntity() {
  console.log("Starting customer migration...");
  
  const customers = await db.select().from(customer);
  console.log(`Found ${customers.length} customers to migrate`);
  
  for (const cust of customers) {
    // Check if entity already exists (might be a supplier too)
    const existingEntity = await db.select()
      .from(businessEntity)
      .where(
        or(
          eq(businessEntity.taxNumber, cust.taxNumber || ''),
          and(
            eq(businessEntity.name, cust.name),
            eq(businessEntity.companyId, cust.companyId)
          )
        )
      )
      .limit(1);
    
    if (existingEntity.length > 0) {
      // Update existing entity to be both customer and supplier
      await db.update(businessEntity)
        .set({
          entityType: 'both',
          customerCode: cust.customerCode,
          // Merge any customer-specific fields
          updatedAt: new Date(),
        })
        .where(eq(businessEntity.id, existingEntity[0].id));
      
      console.log(`Updated entity ${existingEntity[0].name} to be both customer and supplier`);
    } else {
      // Create new business entity from customer
      await db.insert(businessEntity).values({
        id: cust.id, // Preserve original ID for FK references
        workspaceId: cust.workspaceId,
        companyId: cust.companyId,
        entityType: 'customer',
        name: cust.name,
        fullName: cust.fullName,
        logoUrl: cust.customerLogoUrl,
        entityCategory: cust.customerCategory,
        businessType: cust.customerType === 'company' ? 'company' : 
                     cust.customerType === 'individual' ? 'individual' : 'company',
        status: cust.status,
        industry: cust.industry,
        priority: cust.priority,
        
        // Contact info
        phone: cust.phone,
        email: cust.email,
        website: cust.website,
        fax: cust.fax,
        
        // Address
        address: cust.address,
        district: cust.district,
        city: cust.city,
        postalCode: cust.postalCode,
        country: cust.country,
        
        // Financial & legal
        taxOffice: cust.taxOffice,
        taxNumber: cust.taxNumber,
        mersisNumber: cust.mersisNumber,
        tradeRegistryNumber: cust.tradeRegistryNumber,
        
        // Financial
        defaultCurrency: cust.defaultCurrency,
        creditLimit: cust.creditLimit,
        paymentTerms: cust.paymentTerms,
        discountRate: cust.discountRate,
        
        // Codes
        customerCode: cust.customerCode,
        
        // Contact person
        primaryContactName: cust.primaryContactName,
        primaryContactTitle: cust.primaryContactTitle,
        primaryContactPhone: cust.primaryContactPhone,
        primaryContactEmail: cust.primaryContactEmail,
        
        // Relationships
        parentEntityId: cust.parentCustomerId,
        entityGroup: cust.customerGroup,
        tags: cust.tags,
        
        // Notes
        notes: cust.notes,
        internalNotes: cust.internalNotes,
        metadata: cust.metadata,
        
        // Audit
        createdBy: cust.createdBy,
        updatedBy: cust.updatedBy,
        createdAt: cust.createdAt,
        updatedAt: cust.updatedAt,
        deletedAt: cust.deletedAt,
      });
      
      console.log(`Migrated customer: ${cust.name}`);
    }
  }
  
  console.log("Customer migration completed");
}

async function migrateSuppliersToBusinessEntity() {
  console.log("Starting supplier migration...");
  
  const suppliers = await db.select().from(supplier);
  console.log(`Found ${suppliers.length} suppliers to migrate`);
  
  for (const supp of suppliers) {
    // Check if entity already exists (might be a customer too)
    const existingEntity = await db.select()
      .from(businessEntity)
      .where(
        or(
          eq(businessEntity.taxNumber, supp.taxNumber || ''),
          and(
            eq(businessEntity.name, supp.name),
            eq(businessEntity.companyId, supp.companyId)
          )
        )
      )
      .limit(1);
    
    if (existingEntity.length > 0) {
      // Update existing entity to be both customer and supplier
      await db.update(businessEntity)
        .set({
          entityType: 'both',
          supplierCode: supp.supplierCode,
          // Merge supplier-specific fields
          leadTimeDays: supp.leadTimeDays,
          minimumOrderQuantity: supp.minimumOrderQuantity,
          qualityRating: supp.qualityRating,
          deliveryRating: supp.deliveryRating,
          defenseContractor: supp.defenseContractor,
          exportLicense: supp.exportLicense,
          updatedAt: new Date(),
        })
        .where(eq(businessEntity.id, existingEntity[0].id));
      
      console.log(`Updated entity ${existingEntity[0].name} to be both customer and supplier`);
    } else {
      // Create new business entity from supplier
      await db.insert(businessEntity).values({
        id: supp.id, // Preserve original ID for FK references
        workspaceId: supp.workspaceId,
        companyId: supp.companyId,
        entityType: 'supplier',
        name: supp.name,
        fullName: supp.fullName,
        logoUrl: supp.supplierLogoUrl,
        entityCategory: supp.supplierCategory,
        businessType: supp.supplierType === 'company' ? 'company' : 
                     supp.supplierType === 'individual' ? 'individual' : 'company',
        status: supp.status,
        industry: supp.industry,
        priority: supp.priority,
        
        // Contact info
        phone: supp.phone,
        email: supp.email,
        website: supp.website,
        fax: supp.fax,
        
        // Address
        address: supp.address,
        district: supp.district,
        city: supp.city,
        postalCode: supp.postalCode,
        country: supp.country,
        
        // Financial & legal
        taxOffice: supp.taxOffice,
        taxNumber: supp.taxNumber,
        mersisNumber: supp.mersisNumber,
        tradeRegistryNumber: supp.tradeRegistryNumber,
        
        // Financial
        defaultCurrency: supp.defaultCurrency,
        creditLimit: supp.creditLimit,
        paymentTerms: supp.paymentTerms,
        discountRate: supp.discountRate,
        
        // Codes
        supplierCode: supp.supplierCode,
        
        // Supplier specific
        leadTimeDays: supp.leadTimeDays,
        minimumOrderQuantity: supp.minimumOrderQuantity,
        qualityRating: supp.qualityRating,
        deliveryRating: supp.deliveryRating,
        defenseContractor: supp.defenseContractor,
        exportLicense: supp.exportLicense,
        
        // Contact person
        primaryContactName: supp.primaryContactName,
        primaryContactTitle: supp.primaryContactTitle,
        primaryContactPhone: supp.primaryContactPhone,
        primaryContactEmail: supp.primaryContactEmail,
        
        // Relationships
        parentEntityId: supp.parentSupplierId,
        entityGroup: supp.supplierGroup,
        tags: supp.tags,
        
        // Notes
        notes: supp.notes,
        internalNotes: supp.internalNotes,
        metadata: supp.metadata,
        
        // Audit
        createdBy: supp.createdBy,
        updatedBy: supp.updatedBy,
        createdAt: supp.createdAt,
        updatedAt: supp.updatedAt,
        deletedAt: supp.deletedAt,
      });
      
      console.log(`Migrated supplier: ${supp.name}`);
    }
  }
  
  console.log("Supplier migration completed");
}

async function main() {
  try {
    console.log("Starting migration to businessEntity...");
    
    // First migrate customers
    await migrateCustomersToBusinessEntity();
    
    // Then migrate suppliers
    await migrateSuppliersToBusinessEntity();
    
    console.log("Migration completed successfully!");
    
    // Show statistics
    const entityStats = await db.select({
      total: db.count(),
      customers: db.count(eq(businessEntity.entityType, 'customer')),
      suppliers: db.count(eq(businessEntity.entityType, 'supplier')),
      both: db.count(eq(businessEntity.entityType, 'both')),
    }).from(businessEntity);
    
    console.log("\nMigration Statistics:");
    console.log(`Total entities: ${entityStats[0].total}`);
    console.log(`Customer only: ${entityStats[0].customers}`);
    console.log(`Supplier only: ${entityStats[0].suppliers}`);
    console.log(`Both customer & supplier: ${entityStats[0].both}`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

export { migrateCustomersToBusinessEntity, migrateSuppliersToBusinessEntity };