import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile(absolutePath: string, name: string) {
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(absolutePath, 'utf-8');
  console.log(`⏳ Executing ${name} (${path.basename(absolutePath)})...`);

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`✅ Successfully executed ${name}!`);
  } catch (err) {
    console.error(`❌ Error executing ${name}:`, err);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function applyModularSchemas() {
  const schemasDir = path.resolve(__dirname, '..', 'schemas');
  if (!fs.existsSync(schemasDir)) {
    console.error(`❌ Schemas directory not found: ${schemasDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(schemasDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Found ${files.length} modular schema files in packages/db/schemas:`);
  for (const file of files) {
    const fullPath = path.join(schemasDir, file);
    await runSqlFile(fullPath, `Schema Module [${file}]`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const applySchema = args.includes('--apply-schema') || args.includes('-s');
  const applySeed = args.includes('--seed');

  if (!applySchema && !applySeed) {
    console.log('Usage:');
    console.log('  tsx src/migrate.ts --apply-schema   (Applies all modular schemas in packages/db/schemas)');
    console.log('  tsx src/migrate.ts --seed           (Applies seed.sql)');
    process.exit(0);
  }

  if (applySchema) {
    await applyModularSchemas();
  }

  if (applySeed) {
    const seedPath = path.resolve(__dirname, '..', 'seed.sql');
    await runSqlFile(seedPath, 'Database Seed Data');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
