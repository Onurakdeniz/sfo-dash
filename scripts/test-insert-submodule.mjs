import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import postgres from 'postgres';

function readDatabaseUrlFromEnvFile(envFilePath) {
  try {
    const raw = fs.readFileSync(envFilePath, 'utf8');
    const match = raw.match(/DATABASE_URL\s*=\s*"([\s\S]*?)"/m);
    if (match && match[1]) {
      return match[1].replace(/\s+/g, '');
    }
  } catch (_) {}
  return undefined;
}

async function main() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const envPath = path.join(process.cwd(), '.env');
    databaseUrl = readDatabaseUrlFromEnvFile(envPath);
  }
  if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  const id = randomUUID();
  try {
    const mod = await sql`select id from modules where deleted_at is null limit 1`;
    if (!mod.length) {
      console.error('No module found to attach test resource');
      process.exit(2);
    }
    const moduleId = mod[0].id;
    const now = new Date();
    await sql`
      insert into module_resources (
        id, module_id, code, name, display_name, description,
        resource_type, path, parent_resource_id, is_active, is_public,
        requires_approval, sort_order, metadata, created_at, updated_at
      ) values (
        ${id}, ${moduleId}, ${'test.submodule.tmp'}, ${'Test Submodule'}, ${'Test Submodule'}, ${'temporary test row'},
        ${'submodule'}, ${null}, ${null}, ${true}, ${false},
        ${false}, ${0}, ${sql`'{}'::jsonb`}, ${now}, ${now}
      )
    `;
    console.log('Insert succeeded');
  } finally {
    try { await sql`delete from module_resources where id = ${id}`; } catch (_) {}
    await sql.end({ timeout: 0 });
  }
}

main().catch((err) => {
  console.error('Insert failed:', err?.message || err);
  process.exit(1);
});


