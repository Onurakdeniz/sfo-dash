import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, or, sql, count } from 'drizzle-orm';
import { 
  businessEntity, 
  businessEntityAddress,
  businessEntityContact,
  businessEntityFile,
  businessEntityNote,
  businessEntityPerformance 
} from '../src/db/schema/tables/businessEntity';
import { customer, customerAddress, customerContact } from '../src/db/schema/tables/customers';
import { supplier, supplierAddress, supplierContact } from '../src/db/schema/tables/suppliers';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}🔍 Migration Verification Script${colors.reset}\n`);

  if (!process.env.DATABASE_URL) {
    console.error(`${colors.red}❌ Error: DATABASE_URL environment variable is not set${colors.reset}`);
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const results: VerificationResult[] = [];

  try {
    // Test 1: Check if business_entities table exists and has data
    console.log(`${colors.blue}Test 1: Business entities table${colors.reset}`);
    const entityCount = await db.select({ count: count() }).from(businessEntity);
    const hasEntities = entityCount[0].count > 0;
    
    results.push({
      passed: hasEntities,
      message: `Business entities table has ${entityCount[0].count} records`,
      details: { count: entityCount[0].count }
    });

    // Test 2: Check entity type distribution
    console.log(`${colors.blue}Test 2: Entity type distribution${colors.reset}`);
    const entityTypes = await client`
      SELECT entity_type, COUNT(*) as count
      FROM business_entities
      GROUP BY entity_type
      ORDER BY entity_type
    `;
    
    results.push({
      passed: entityTypes.length > 0,
      message: 'Entity types distribution',
      details: entityTypes
    });

    // Test 3: Check for unmigrated customers
    console.log(`${colors.blue}Test 3: Unmigrated customers${colors.reset}`);
    const unmigratedCustomers = await client`
      SELECT COUNT(*) as count
      FROM customers c
      WHERE NOT EXISTS (
        SELECT 1 FROM business_entities be WHERE be.id = c.id
      )
    `;
    
    results.push({
      passed: unmigratedCustomers[0].count === 0,
      message: `Unmigrated customers: ${unmigratedCustomers[0].count}`,
      details: { unmigrated: unmigratedCustomers[0].count }
    });

    // Test 4: Check for unmigrated suppliers
    console.log(`${colors.blue}Test 4: Unmigrated suppliers${colors.reset}`);
    const unmigratedSuppliers = await client`
      SELECT COUNT(*) as count
      FROM suppliers s
      WHERE NOT EXISTS (
        SELECT 1 FROM business_entities be WHERE be.id = s.id
      )
    `;
    
    results.push({
      passed: unmigratedSuppliers[0].count === 0,
      message: `Unmigrated suppliers: ${unmigratedSuppliers[0].count}`,
      details: { unmigrated: unmigratedSuppliers[0].count }
    });

    // Test 5: Check dual entities (both customer and supplier)
    console.log(`${colors.blue}Test 5: Dual entities${colors.reset}`);
    const dualEntities = await db
      .select({ 
        id: businessEntity.id,
        name: businessEntity.name,
        entityType: businessEntity.entityType 
      })
      .from(businessEntity)
      .where(eq(businessEntity.entityType, 'both'));
    
    results.push({
      passed: true,
      message: `Found ${dualEntities.length} dual entities (both customer and supplier)`,
      details: { count: dualEntities.length, sample: dualEntities.slice(0, 3) }
    });

    // Test 6: Check address migration
    console.log(`${colors.blue}Test 6: Address migration${colors.reset}`);
    const addressComparison = await client`
      SELECT 
        (SELECT COUNT(*) FROM customer_addresses) as old_customer_addresses,
        (SELECT COUNT(*) FROM supplier_addresses) as old_supplier_addresses,
        (SELECT COUNT(*) FROM business_entity_addresses) as new_addresses
    `;
    
    const oldTotal = addressComparison[0].old_customer_addresses + addressComparison[0].old_supplier_addresses;
    results.push({
      passed: addressComparison[0].new_addresses >= oldTotal,
      message: `Addresses: ${oldTotal} old → ${addressComparison[0].new_addresses} new`,
      details: addressComparison[0]
    });

    // Test 7: Check contact migration
    console.log(`${colors.blue}Test 7: Contact migration${colors.reset}`);
    const contactComparison = await client`
      SELECT 
        (SELECT COUNT(*) FROM customer_contacts) as old_customer_contacts,
        (SELECT COUNT(*) FROM supplier_contacts) as old_supplier_contacts,
        (SELECT COUNT(*) FROM business_entity_contacts) as new_contacts
    `;
    
    const oldContactTotal = contactComparison[0].old_customer_contacts + contactComparison[0].old_supplier_contacts;
    results.push({
      passed: contactComparison[0].new_contacts >= oldContactTotal,
      message: `Contacts: ${oldContactTotal} old → ${contactComparison[0].new_contacts} new`,
      details: contactComparison[0]
    });

    // Test 8: Check data integrity - sample verification
    console.log(`${colors.blue}Test 8: Data integrity check${colors.reset}`);
    const sampleCheck = await client`
      SELECT 
        c.id,
        c.name as customer_name,
        be.name as entity_name,
        c.email as customer_email,
        be.email as entity_email,
        be.entity_type
      FROM customers c
      LEFT JOIN business_entities be ON c.id = be.id
      LIMIT 5
    `;
    
    const integrityPassed = sampleCheck.every(row => 
      row.customer_name === row.entity_name && 
      row.customer_email === row.entity_email
    );
    
    results.push({
      passed: integrityPassed,
      message: 'Data integrity check (sample of 5 records)',
      details: { checked: sampleCheck.length, passed: integrityPassed }
    });

    // Test 9: Check foreign key references
    console.log(`${colors.blue}Test 9: Foreign key references${colors.reset}`);
    const fkCheck = await client`
      SELECT 
        'Orders' as table_name,
        COUNT(*) as total,
        COUNT(CASE WHEN be.id IS NULL THEN 1 END) as broken_refs
      FROM orders o
      LEFT JOIN business_entities be ON o.customer_id = be.id
      UNION ALL
      SELECT 
        'Talep',
        COUNT(*),
        COUNT(CASE WHEN be.id IS NULL THEN 1 END)
      FROM talep t
      LEFT JOIN business_entities be ON t.entity_id = be.id
    `;
    
    const fkPassed = fkCheck.every(row => row.broken_refs === 0);
    results.push({
      passed: fkPassed,
      message: 'Foreign key references check',
      details: fkCheck
    });

    // Test 10: Performance metrics migration (for suppliers)
    console.log(`${colors.blue}Test 10: Performance metrics${colors.reset}`);
    const performanceCheck = await client`
      SELECT 
        (SELECT COUNT(*) FROM supplier_performance) as old_performance,
        (SELECT COUNT(*) FROM business_entity_performance) as new_performance
    `;
    
    results.push({
      passed: performanceCheck[0].new_performance >= performanceCheck[0].old_performance,
      message: `Performance records: ${performanceCheck[0].old_performance} → ${performanceCheck[0].new_performance}`,
      details: performanceCheck[0]
    });

    // Print results summary
    console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}📊 VERIFICATION RESULTS${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);

    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
      const icon = result.passed ? `${colors.green}✅` : `${colors.red}❌`;
      const status = result.passed ? `${colors.green}PASSED` : `${colors.red}FAILED`;
      
      console.log(`${icon} Test ${index + 1}: ${status}${colors.reset}`);
      console.log(`   ${result.message}`);
      
      if (result.details && !result.passed) {
        console.log(`   Details:`, result.details);
      }
      
      if (result.passed) passedCount++;
      else failedCount++;
    });

    // Final summary
    console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}SUMMARY${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    
    const allPassed = failedCount === 0;
    const summaryColor = allPassed ? colors.green : colors.yellow;
    
    console.log(`${summaryColor}Passed: ${passedCount}/${results.length}${colors.reset}`);
    
    if (!allPassed) {
      console.log(`${colors.red}Failed: ${failedCount}/${results.length}${colors.reset}`);
      console.log(`\n${colors.yellow}⚠️  Some tests failed. Please review the issues above.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}${colors.bright}🎉 All verification tests passed!${colors.reset}`);
      console.log(`${colors.green}Your migration was successful!${colors.reset}`);
    }

    // Recommendations
    console.log(`\n${colors.cyan}📝 Recommendations:${colors.reset}`);
    console.log('1. Test all CRUD operations for customers and suppliers');
    console.log('2. Verify that existing API endpoints work correctly');
    console.log('3. Check that reports and analytics queries still function');
    console.log('4. Monitor application logs for any errors');
    console.log('5. Keep old tables for at least 2 weeks before removal');

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error(`\n${colors.red}❌ Verification script error:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});