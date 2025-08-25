import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function main() {
  console.log(`${colors.cyan}${colors.bright}🚀 Business Entity Migration Script${colors.reset}\n`);

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error(`${colors.red}❌ Error: DATABASE_URL environment variable is not set${colors.reset}`);
    console.log('Please set it in your .env file or export it:');
    console.log('export DATABASE_URL="postgresql://user:password@host:port/database"');
    process.exit(1);
  }

  // Check if backup exists for today
  const backupDir = path.join(process.cwd(), 'backups');
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const hasBackup = fs.existsSync(backupDir) && 
    fs.readdirSync(backupDir).some(file => file.includes(today));

  if (!hasBackup) {
    console.log(`${colors.yellow}⚠️  Warning: No backup found for today${colors.reset}`);
    console.log('It is STRONGLY recommended to backup your database before migration.');
    console.log('Run: npm run backup:db or ./scripts/backup-database.sh\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      readline.question('Do you want to continue without backup? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled. Please create a backup first.');
      process.exit(0);
    }
  }

  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    // Pre-migration checks
    console.log(`${colors.blue}📊 Pre-migration checks...${colors.reset}`);
    
    const preChecks = await sql`
      SELECT 
        (SELECT COUNT(*) FROM customers) as customer_count,
        (SELECT COUNT(*) FROM suppliers) as supplier_count,
        (SELECT COUNT(*) FROM business_entities) as entity_count,
        (SELECT COUNT(*) FROM customers c JOIN suppliers s ON c.id = s.id) as duplicate_count
    `;
    
    console.log(`  Customers: ${preChecks[0].customer_count}`);
    console.log(`  Suppliers: ${preChecks[0].supplier_count}`);
    console.log(`  Existing Entities: ${preChecks[0].entity_count}`);
    console.log(`  Dual Entities: ${preChecks[0].duplicate_count}\n`);

    // Run migration
    console.log(`${colors.blue}🔄 Running migration...${colors.reset}`);
    await migrate(db, { migrationsFolder: './drizzle' });
    
    // Post-migration verification
    console.log(`\n${colors.blue}✅ Verifying migration...${colors.reset}`);
    
    const postChecks = await sql`
      SELECT 
        entity_type,
        COUNT(*) as count
      FROM business_entities
      GROUP BY entity_type
      ORDER BY entity_type
    `;
    
    console.log('Entity counts by type:');
    postChecks.forEach(row => {
      console.log(`  ${row.entity_type}: ${row.count}`);
    });

    // Check for unmigrated records
    const unmigrated = await sql`
      SELECT 
        (SELECT COUNT(*) FROM customers c WHERE NOT EXISTS (
          SELECT 1 FROM business_entities be WHERE be.id = c.id
        )) as unmigrated_customers,
        (SELECT COUNT(*) FROM suppliers s WHERE NOT EXISTS (
          SELECT 1 FROM business_entities be WHERE be.id = s.id
        )) as unmigrated_suppliers
    `;

    if (unmigrated[0].unmigrated_customers > 0 || unmigrated[0].unmigrated_suppliers > 0) {
      console.log(`\n${colors.yellow}⚠️  Warning: Some records were not migrated:${colors.reset}`);
      console.log(`  Unmigrated Customers: ${unmigrated[0].unmigrated_customers}`);
      console.log(`  Unmigrated Suppliers: ${unmigrated[0].unmigrated_suppliers}`);
    }

    // Check related tables
    console.log(`\n${colors.blue}📋 Related tables migration:${colors.reset}`);
    
    const relatedChecks = await sql`
      SELECT 
        'Addresses' as table_type,
        (SELECT COUNT(*) FROM customer_addresses) + (SELECT COUNT(*) FROM supplier_addresses) as old_count,
        (SELECT COUNT(*) FROM business_entity_addresses) as new_count
      UNION ALL
      SELECT 
        'Contacts',
        (SELECT COUNT(*) FROM customer_contacts) + (SELECT COUNT(*) FROM supplier_contacts),
        (SELECT COUNT(*) FROM business_entity_contacts)
      UNION ALL
      SELECT 
        'Files',
        (SELECT COUNT(*) FROM customer_files) + (SELECT COUNT(*) FROM supplier_files),
        (SELECT COUNT(*) FROM business_entity_files)
      UNION ALL
      SELECT 
        'Notes',
        (SELECT COUNT(*) FROM customer_notes) + (SELECT COUNT(*) FROM supplier_notes),
        (SELECT COUNT(*) FROM business_entity_notes)
    `;

    relatedChecks.forEach(row => {
      const status = row.new_count >= row.old_count ? '✅' : '⚠️';
      console.log(`  ${status} ${row.table_type}: ${row.old_count} → ${row.new_count}`);
    });

    console.log(`\n${colors.green}${colors.bright}✅ Migration completed successfully!${colors.reset}`);
    
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log('1. Test your application thoroughly');
    console.log('2. Update your API routes to use businessEntity');
    console.log('3. Monitor for any issues');
    console.log('4. After 1-2 weeks of stable operation, consider removing old tables');

  } catch (error) {
    console.error(`\n${colors.red}❌ Migration failed:${colors.reset}`, error);
    console.log(`\n${colors.yellow}To rollback, restore from backup:${colors.reset}`);
    console.log('gunzip < ./backups/backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});