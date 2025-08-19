import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

function readDatabaseUrlFromEnvFile(envFilePath) {
  try {
    const raw = fs.readFileSync(envFilePath, 'utf8');
    const match = raw.match(/DATABASE_URL\s*=\s*"([\s\S]*?)"/m);
    if (match && match[1]) {
      // Remove any whitespace/newlines inadvertently added in the URL
      return match[1].replace(/\s+/g, '');
    }
    const alt = raw.match(/DATABASE_URL\s*=\s*([^\n\r]+)/);
    if (alt && alt[1]) {
      return alt[1].trim();
    }
  } catch (_) {
    // ignore
  }
  return undefined;
}

async function main() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const envPath = path.join(process.cwd(), '.env');
    databaseUrl = readDatabaseUrlFromEnvFile(envPath);
  }

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment or .env file');
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  try {
    await sql`ALTER TABLE "module_resources" DROP CONSTRAINT IF EXISTS "module_resources_type_check"`;
    await sql`ALTER TABLE "module_resources" ADD CONSTRAINT "module_resources_type_check" CHECK (resource_type IN ('page','api','feature','report','action','widget','submodule'))`;
    const rows = await sql`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'module_resources_type_check'
    `;
    console.log('Constraint recreated:', rows.length > 0);
  } finally {
    await sql.end({ timeout: 0 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


