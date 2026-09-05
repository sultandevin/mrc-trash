import { z } from "zod";

// Replace these three placeholder methods when the neighborhood list is ready.
export const compostingMethods = [
  {
    id: "compost-bin",
    label: "Komposter",
  },
  {
    id: "biopore",
    label: "Lubang biopori",
  },
  {
    id: "worm-bin",
    label: "Kompos cacing",
  },
  { id: "other", label: "Lainnya" },
] as const;

export const submissionSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1, "Masukkan nama.").max(120, "Nama maksimal 120 karakter."),
    roadName: z
      .string()
      .trim()
      .min(1, "Masukkan nama jalan.")
      .max(200, "Nama jalan maksimal 200 karakter."),
    block: z
      .string()
      .trim()
      .min(1, "Masukkan blok dan nomor rumah.")
      .max(60, "Blok dan nomor rumah maksimal 60 karakter."),
    rt: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, "Masukkan RT dengan 1–3 angka."),
    rw: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, "Masukkan RW dengan 1–3 angka."),
    methods: z
      .array(z.enum(["compost-bin", "biopore", "worm-bin", "other"]))
      .min(1, "Pilih minimal satu metode.")
      .max(4, "Pilih maksimal empat metode.")
      .refine(
        (values) => new Set(values).size === values.length,
        "Pilih setiap metode hanya sekali.",
      ),
    otherMethod: z.string().trim().max(200, "Metode lainnya maksimal 200 karakter.").default(""),
  })
  .refine((data) => !data.methods.includes("other") || data.otherMethod.length > 0, {
    path: ["otherMethod"],
    message: "Tuliskan metode lainnya.",
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type FieldErrors = Partial<
  Record<"name" | "roadName" | "block" | "rt" | "rw" | "methods" | "otherMethod", string>
>;
