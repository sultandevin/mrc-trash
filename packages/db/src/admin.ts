import { desc, sql } from "drizzle-orm";
import { db } from "./index";
import { submissions } from "./schema";

export async function consumeLoginAttempt(now = Date.now()) {
  // Atomic increment, including window rollover; no per-instance memory limiter.
  const result = await db.run(sql`
    INSERT INTO admin_login_attempts (id, attempts, reset_at)
    VALUES ('admin', 1, ${now + 15 * 60 * 1000})
    ON CONFLICT(id) DO UPDATE SET
      attempts = CASE WHEN reset_at <= ${now} THEN 1 ELSE attempts + 1 END,
      reset_at = CASE WHEN reset_at <= ${now} THEN ${now + 15 * 60 * 1000} ELSE reset_at END
    RETURNING attempts
  `);
  return Number(result.rows[0]?.attempts) <= 20;
}

export async function readSubmissions(page: number) {
  const rows = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt), desc(submissions.id))
    .limit(51)
    .offset(page * 50);
  return { rows: rows.slice(0, 50), hasMore: rows.length > 50 };
}
