import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
export const passwordHashPattern = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string) {
  if (!passwordHashPattern.test(hash)) return false;
  const [, salt, expected] = hash.split(":");
  const actual = (await derive(password, salt!, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected!, "hex"));
}

export function passwordVersion(hash: string) {
  return createHash("sha256").update(hash).digest("hex");
}
