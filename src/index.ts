import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// 1. Declare a global variable to store the connection
// This prevents creating a new connection on every hot-reload
declare global {
  // eslint-disable-next-line no-var
  var client: postgres.Sql | undefined;
}

// 2. Create the connection
// Check if the global client exists, otherwise create a new one.
// We also added 'max: 10' to limit the number of connections this app uses.
export const client =
  globalThis.client ??
  postgres(connectionString, {
    prepare: false,
    max: 10, // Important: Limit connection pool size
  });

// 3. Save the client to the global variable in development
if (process.env.NODE_ENV !== "production") {
  globalThis.client = client;
}

export const db = drizzle(client);
