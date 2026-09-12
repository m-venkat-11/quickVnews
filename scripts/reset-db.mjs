/** db:reset — remove the database files (schema is recreated by db:init). */
import { rmSync } from 'node:fs';
import path from 'node:path';

const dbPath = process.env.PRISM_DB_PATH || 'data/prism.db';
const abs = path.resolve(process.cwd(), dbPath);
for (const f of [abs, `${abs}-wal`, `${abs}-shm`, `${abs}-journal`]) {
  try { rmSync(f); console.log('removed', f); } catch { /* absent */ }
}
console.log('Database reset. Run `npm run db:init` to recreate.');
