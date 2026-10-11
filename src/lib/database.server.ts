import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
let client: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  if (!database) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable.");
    }

    client = postgres(connectionString, { prepare: false });
    database = drizzle(client, { schema });
  }

  return database;
}
