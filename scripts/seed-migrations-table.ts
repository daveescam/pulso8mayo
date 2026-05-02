import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

const migrations = [
  { hash: '0000_dapper_proudstar', created_at: 1769719948063 },
  { hash: '0001_solid_blonde_phantom', created_at: 1769720734102 },
  { hash: '0002_melodic_silverclaw', created_at: 1776698671833 },
  { hash: '0003_sudden_mister_fear', created_at: 1776722091474 },
  { hash: '0004_secret_vance_astro', created_at: 1776969267742 },
  { hash: '0005_cuddly_unus', created_at: 1777057547381 },
  { hash: '0006_faithful_sumo', created_at: 1777526036676 },
];

async function main() {
  console.log('Creating __drizzle_migrations table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint NOT NULL
    )
  `;

  for (const m of migrations) {
    const existing = await sql`SELECT id FROM "__drizzle_migrations" WHERE hash = ${m.hash}`;
    if (existing.length === 0) {
      await sql`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (${m.hash}, ${m.created_at})`;
      console.log(`  Inserted migration: ${m.hash}`);
    } else {
      console.log(`  Already exists: ${m.hash}`);
    }
  }

  const result = await sql`SELECT * FROM "__drizzle_migrations" ORDER BY id`;
  console.log(`\n${result.length} migrations registered. db:migrate should now skip these.`);
}

main().catch(console.error);
