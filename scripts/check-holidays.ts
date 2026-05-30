import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'holidays' AND column_name = 'date'`;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
