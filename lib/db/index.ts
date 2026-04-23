import { config } from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import ws from "ws";

config({ path: ".env" });

neonConfig.webSocketConstructor = ws;

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
