# 🚀 Quick Migration Steps

## ⚡ TL;DR - Run These Commands

```bash
# Step 1: Backup your database
npm run migration:backup

# Step 2: Run the full migration (backup + migrate + verify)
npm run migration:full

# OR run steps individually:
npm run migration:run     # Run migration only
npm run migration:verify  # Verify migration only
```

## 📋 Detailed Step-by-Step Guide

### 1️⃣ **Preparation**
```bash
# Make sure you have DATABASE_URL set
echo $DATABASE_URL

# If not set, add to .env file:
echo "DATABASE_URL=postgresql://user:password@host:port/database" >> .env

# Install dependencies if needed
npm install
```

### 2️⃣ **Create Backup** (CRITICAL!)
```bash
npm run migration:backup
# This creates a compressed backup in ./backups/ folder
```

### 3️⃣ **Run Migration**
```bash
npm run migration:run
```

This will:
- ✅ Check for today's backup
- ✅ Show pre-migration statistics
- ✅ Run the migration
- ✅ Show post-migration statistics
- ✅ Alert you to any issues

### 4️⃣ **Verify Migration**
```bash
npm run migration:verify
```

This runs 10 verification tests:
1. Business entities table exists
2. Entity type distribution
3. Unmigrated customers check
4. Unmigrated suppliers check
5. Dual entities check
6. Address migration
7. Contact migration
8. Data integrity
9. Foreign key references
10. Performance metrics

### 5️⃣ **Test Your Application**

Start your application and test:
```bash
npm run dev
```

Check these critical paths:
- [ ] List all customers
- [ ] List all suppliers
- [ ] Create new customer
- [ ] Create new supplier
- [ ] View customer details
- [ ] View supplier details
- [ ] Edit customer/supplier
- [ ] Delete customer/supplier
- [ ] Check orders still work
- [ ] Check talep (requests) still work

## 🔍 What the Migration Does

The migration (`0015_migrate_customers_suppliers_to_entities.sql`) will:

1. **Copy all customers** → `business_entities` with `entityType='customer'`
2. **Copy all suppliers** → `business_entities` with `entityType='supplier'`
3. **Identify dual entities** → Set `entityType='both'` for companies that are both
4. **Migrate all related data**:
   - `customer_addresses` → `business_entity_addresses`
   - `supplier_addresses` → `business_entity_addresses`
   - `customer_contacts` → `business_entity_contacts`
   - `supplier_contacts` → `business_entity_contacts`
   - `customer_files` → `business_entity_files`
   - `supplier_files` → `business_entity_files`
   - `customer_notes` → `business_entity_notes`
   - `supplier_notes` → `business_entity_notes`
   - `supplier_performance` → `business_entity_performance`

## ⚠️ If Something Goes Wrong

### Rollback Option 1: Restore Backup
```bash
# Find your backup
ls -la ./backups/

# Restore it
gunzip < ./backups/backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL
```

### Rollback Option 2: Manual Cleanup
```sql
-- Connect to database
psql $DATABASE_URL

-- Remove migrated data (BE CAREFUL!)
DELETE FROM business_entity_addresses WHERE created_at >= '2024-01-01';
DELETE FROM business_entity_contacts WHERE created_at >= '2024-01-01';
DELETE FROM business_entity_files WHERE created_at >= '2024-01-01';
DELETE FROM business_entity_notes WHERE created_at >= '2024-01-01';
DELETE FROM business_entity_performance WHERE created_at >= '2024-01-01';
DELETE FROM business_entities WHERE created_at >= '2024-01-01';
```

## ✅ Success Indicators

Your migration is successful when:
- ✅ `npm run migration:verify` shows all tests passed
- ✅ No customers/suppliers left unmigrated
- ✅ Application works without errors
- ✅ All CRUD operations function correctly
- ✅ Reports and queries return expected data

## 📊 Check Migration Status

```sql
-- Quick status check
SELECT 
    'Total Entities' as metric,
    COUNT(*) as count
FROM business_entities
UNION ALL
SELECT 
    'Customers',
    COUNT(*)
FROM business_entities 
WHERE entity_type IN ('customer', 'both')
UNION ALL
SELECT 
    'Suppliers',
    COUNT(*)
FROM business_entities 
WHERE entity_type IN ('supplier', 'both')
UNION ALL
SELECT 
    'Dual (Both)',
    COUNT(*)
FROM business_entities 
WHERE entity_type = 'both';
```

## 🎯 Next Steps After Migration

1. **Update your code** to use `businessEntity` instead of separate tables
2. **Update API routes** - See `/src/app/api/workspaces/[workspaceId]/business-entities/route.example.ts`
3. **Monitor for 1-2 weeks** before removing old tables
4. **Document the change** for your team

## 🗑️ Cleanup (After 2 Weeks)

Once you're confident everything works:

```sql
-- DANGER: Only run after thorough testing!
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customer_files CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;

DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS supplier_addresses CASCADE;
DROP TABLE IF EXISTS supplier_contacts CASCADE;
DROP TABLE IF EXISTS supplier_files CASCADE;
DROP TABLE IF EXISTS supplier_notes CASCADE;
DROP TABLE IF EXISTS supplier_performance CASCADE;
```

## 💡 Tips

- Always backup before migration
- Test in staging/development first
- Run migration during low-traffic hours
- Keep monitoring logs after migration
- Don't rush to delete old tables

## 🆘 Need Help?

Check these resources:
- `/MIGRATION_GUIDE.md` - Detailed migration guide
- `/BUSINESS_ENTITY_MIGRATION_SUMMARY.md` - Migration overview
- `/src/db/migrations/migrate_to_business_entity.sql` - Manual SQL migration
- `/drizzle/0015_migrate_customers_suppliers_to_entities.sql` - Drizzle migration file

---

**Remember**: The migration is designed to be safe and non-destructive. Old tables are NOT deleted automatically!