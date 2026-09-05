import { createServerFn } from "@tanstack/react-start";
import { submissionSchema } from "./schema";

export const submitResponse = createServerFn({ method: "POST" })
  .validator(submissionSchema)
  .handler(async ({ data }) => {
    const { db } = await import("@mom/db");
    const { submissions } = await import("@mom/db/schema/index");
    try {
      // A stable client-generated ID makes retrying the same submission safe.
      await db
        .insert(submissions)
        .values({
          ...data,
          otherMethod: data.methods.includes("other") ? data.otherMethod : null,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: submissions.id });
      return { success: true as const, id: data.id };
    } catch {
      return {
        success: false as const,
        message: "Data belum berhasil disimpan. Silakan coba lagi.",
      };
    }
  });
