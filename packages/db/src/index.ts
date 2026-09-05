import { createClient } from "@libsql/client";
import { env } from "@mom/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb() {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  return drizzle({ client, schema });
}

export const db = createDb();
