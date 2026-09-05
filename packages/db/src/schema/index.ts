import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// One shared login budget survives cold starts and concurrent server instances.
export const adminLoginAttempts = sqliteTable("admin_login_attempts", {
  id: text("id").primaryKey(),
  attempts: integer("attempts").notNull(),
  resetAt: integer("reset_at").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Keep the original display address for existing records and consumers.
  address: text("address").notNull(),
  roadName: text("road_name"),
  block: text("block"),
  rt: text("rt"),
  rw: text("rw"),
  methods: text("methods", { mode: "json" }).$type<string[]>().notNull(),
  otherMethod: text("other_method"),
  createdAt: text("created_at").notNull(),
});
