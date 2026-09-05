import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(1024) }))
  .handler(async ({ data }) => {
    const auth = await import("./session.server");
    auth.privateResponse();
    auth.checkOrigin();
    const { hash } = auth.adminConfig();
    const { consumeLoginAttempt } = await import("@mom/db/admin");
    if (!(await consumeLoginAttempt())) {
      return { success: false, message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
    }
    const { verifyPassword, passwordVersion } = await import("./password.server");
    if (!(await verifyPassword(data.password, hash))) {
      return { success: false, message: "Kata sandi salah. Silakan coba lagi." };
    }
    const session = await auth.adminSession();
    await session.clear();
    await session.update({
      version: passwordVersion(hash),
      expiresAt: Date.now() + auth.sessionLifetime * 1000,
    });
    return { success: true, message: "" };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await import("./session.server");
  auth.privateResponse();
  auth.checkOrigin();
  await (await auth.adminSession()).clear();
});

export const listAdminSubmissions = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(0).max(100000) }))
  .handler(async ({ data }) => {
    const auth = await import("./session.server");
    auth.privateResponse();
    if (!(await auth.isAdmin())) return { authenticated: false as const };
    const { readSubmissions } = await import("@mom/db/admin");
    return { authenticated: true as const, ...(await readSubmissions(data.page)) };
  });
