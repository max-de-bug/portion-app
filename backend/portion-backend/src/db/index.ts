import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[Database] DATABASE_URL is not set. Database features will be disabled.",
  );
}

// In production, postgres-js throws on empty connection string
// We'll only initialize the client if we have a string, otherwise use a placeholder to avoid crash on import
const client = postgres(
  connectionString || "postgres://dummy:dummy@localhost:5432/dummy",
);
export const db = drizzle(client, { schema });
