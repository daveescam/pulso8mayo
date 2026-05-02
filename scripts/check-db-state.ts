import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '__drizzle_migrations')`;
  console.log('Migrations table exists:', JSON.stringify(result));

  const hooks = await sql`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '__drizzle_migrations_hooks')`;
  console.log('Hooks table exists:', JSON.stringify(hooks));

  const enums = await sql`SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY typname`;
  console.log('Existing enums:', enums.map((r: any) => r.typname));

  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Existing tables:', tables.map((r: any) => r.tablename));
}

main().catch(console.error);
