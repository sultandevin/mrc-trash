import { getRequest, setResponseHeader, useSession } from "@tanstack/react-start/server";
import { passwordHashPattern, passwordVersion } from "./password.server";

export const sessionLifetime = 60 * 60 * 24 * 30;

export function privateResponse() {
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  setResponseHeader("X-Robots-Tag", "noindex, nofollow");
}

export function adminConfig() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!hash || !passwordHashPattern.test(hash) || !secret || secret.length < 32) {
    throw new Error("Admin access is not configured.");
  }
  return { hash, secret };
}

export function checkOrigin() {
  const request = getRequest();
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Error("Invalid request origin.");
  }
}

export async function adminSession() {
  const { secret } = adminConfig();
  return useSession<{ version?: string; expiresAt?: number }>({
    name: process.env.NODE_ENV === "production" ? "__Host-mom-admin" : "mom-admin",
    password: secret,
    maxAge: sessionLifetime,
    sessionHeader: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    },
  });
}

export async function isAdmin() {
  const session = await adminSession();
  return (
    session.data.version === passwordVersion(adminConfig().hash) &&
    typeof session.data.expiresAt === "number" &&
    session.data.expiresAt > Date.now()
  );
}
