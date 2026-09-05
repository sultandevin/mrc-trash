import { afterAll, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hashPassword,
  verifyPassword,
  passwordVersion,
} from "../apps/web/src/features/admin/password.server";

const directory = await mkdtemp(join(tmpdir(), "mom-admin-test-"));
process.env.TURSO_DATABASE_URL = `file:${join(directory, "test.db")}`;
const sqlite = new Database(join(directory, "test.db"));
const migrationDirectory = new URL("../packages/db/src/migrations/", import.meta.url);
for (const name of (await readdir(migrationDirectory))
  .filter((name) => name.endsWith(".sql"))
  .sort()) {
  sqlite.exec(await readFile(new URL(name, migrationDirectory), "utf8"));
}
const { consumeLoginAttempt, readSubmissions } = await import("../packages/db/src/admin");
afterAll(async () => {
  sqlite.close();
  await rm(directory, { recursive: true, force: true });
});

test("password hashes are salted, reject incorrect input, and rotate session versions", async () => {
  const first = await hashPassword("a long test password");
  const second = await hashPassword("a long test password");
  expect(first).not.toBe(second);
  expect(await verifyPassword("a long test password", first)).toBe(true);
  expect(await verifyPassword("incorrect password", first)).toBe(false);
  expect(await verifyPassword("anything", "malformed")).toBe(false);
  expect(passwordVersion(first)).not.toBe(passwordVersion(second));
});

test("concurrent login attempts share one atomic budget and recover after the window", async () => {
  const now = Date.now();
  const attempts = await Promise.all(Array.from({ length: 25 }, () => consumeLoginAttempt(now)));
  expect(attempts.filter(Boolean)).toHaveLength(20);
  expect(await consumeLoginAttempt(now + 899999)).toBe(false);
  expect(await consumeLoginAttempt(now + 900000)).toBe(true);
});

test("listing paginates deterministically and preserves legacy addresses", async () => {
  expect(await readSubmissions(0)).toEqual({ rows: [], hasMore: false });
  const insert = sqlite.prepare(
    "INSERT INTO submissions (id, name, address, methods, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  for (let index = 0; index < 51; index++) {
    insert.run(
      String(index).padStart(3, "0"),
      "Test resident",
      "Legacy address",
      '["compost-bin"]',
      "2026-09-01T00:00:00.000Z",
    );
  }
  const first = await readSubmissions(0);
  const second = await readSubmissions(1);
  expect(first.rows).toHaveLength(50);
  expect(first.hasMore).toBe(true);
  expect(first.rows[0]?.id).toBe("050");
  expect(second.rows).toHaveLength(1);
  expect(second.hasMore).toBe(false);
  expect(second.rows[0]?.address).toBe("Legacy address");
  expect(second.rows[0]?.roadName).toBeNull();
});
