import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (typeof window === "undefined") {
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
