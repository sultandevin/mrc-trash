import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { hashPassword } from "../apps/web/src/features/admin/password.server";

if (!process.stdin.isTTY) throw new Error("Run this command in an interactive terminal.");
// Suppress terminal echo so the password never enters logs or shell history.
const silent = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});
const prompt = createInterface({ input: process.stdin, output: silent, terminal: true });
process.stdout.write("Choose an admin password (12+ characters, hidden): ");
const password = await prompt.question("");
process.stdout.write("\nConfirm password (hidden): ");
const confirmation = await prompt.question("");
prompt.close();
process.stdout.write("\n");
if (password !== confirmation) throw new Error("Passwords do not match. Nothing changed.");
if (password.length < 12 || password.length > 1024) {
  throw new Error("Use a password between 12 and 1024 characters.");
}
const envPath = new URL("../apps/web/.env", import.meta.url);
const existing = await readFile(envPath, "utf8").catch((error: NodeJS.ErrnoException) => {
  if (error.code === "ENOENT") return "";
  throw error;
});
const preserved = existing
  .split(/\r?\n/)
  .filter((line) => !/^\s*(?:export\s+)?ADMIN_(PASSWORD_HASH|SESSION_SECRET)\s*=/.test(line))
  .join("\n")
  .trimEnd();
await writeFile(
  envPath,
  `${preserved}\nADMIN_PASSWORD_HASH=${await hashPassword(password)}\nADMIN_SESSION_SECRET=${randomBytes(32).toString("hex")}\n`,
  { mode: 0o600 },
);
console.log(
  "Admin credentials saved to apps/web/.env. Restart the app. Sync these variables to Vercel before deploying. Previous sessions are invalidated after the new values take effect.",
);
