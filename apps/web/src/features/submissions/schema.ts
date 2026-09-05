import { z } from "zod";

export const compostingMethods = [
  { id: "teba", label: "Teba" },
  { id: "biopori", label: "Biopori" },
  { id: "bag-composter", label: "Bag composter" },
  { id: "galon-composter", label: "Galon composter" },
  { id: "other", label: "Lainnya" },
] as const;

export const submissionSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1, "Masukkan nama.").max(120, "Nama maksimal 120 karakter."),
    address: z
      .string()
      .trim()
      .min(1, "Masukkan nomor rumah dan nama jalan.")
      .max(260, "Alamat maksimal 260 karakter."),
    rt: z.enum(
      [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
      ],
      { message: "Pilih RT." },
    ),
    methods: z
      .array(z.enum(["teba", "biopori", "bag-composter", "galon-composter", "other"]))
      .min(1, "Pilih minimal satu metode.")
      .max(5, "Pilih maksimal lima metode.")
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
  Record<"name" | "address" | "rt" | "methods" | "otherMethod", string>
>;
