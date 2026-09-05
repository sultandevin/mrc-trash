import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@mom/ui/components/button";
import { Checkbox } from "@mom/ui/components/checkbox";
import { Input } from "@mom/ui/components/input";
import { Label } from "@mom/ui/components/label";
import {
  compostingMethods,
  submissionSchema,
  type FieldErrors,
  type SubmissionInput,
} from "./schema";

type Save = (options: {
  data: SubmissionInput;
}) => Promise<{ success: true; id: string } | { success: false; message: string }>;
type TextField = "name" | "address" | "otherMethod";
const emptyValues = { name: "", address: "", rt: "", otherMethod: "" };
const stepFields: (keyof FieldErrors)[][] = [
  ["name", "address", "rt"],
  ["methods", "otherMethod"],
];
const titles = ["Pendataan Pengolahan Sampah Organik", "Pengolahan sampah organik"];
const descriptions = [
  "Lengkapi nama dan alamat tempat tinggal Anda.",
  "Pilih satu atau lebih cara yang digunakan di rumah.",
];

export function SubmissionForm({ save }: { save: Save }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(emptyValues);
  const [methods, setMethods] = useState<SubmissionInput["methods"]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [direction, setDirection] = useState(1);
  const requestId = useRef<string | null>(null);
  const focusTarget = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();
  const submission = useMutation({
    mutationFn: async (data: SubmissionInput) => {
      const result = await save({ data }).catch(() => {
        throw new Error("Tidak dapat terhubung. Periksa koneksi internet dan coba lagi.");
      });
      if (!result.success) throw new Error(result.message);
      return result;
    },
    retry: false,
    onSuccess: () => {
      focusTarget.current = "step-title";
    },
  });
  const saved = submission.isSuccess;
  const error = submission.error?.message;
  const progress = saved ? 2 : step;

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    focusTarget.current = "step-title";
    setStep(next);
    setErrors({});
    submission.reset();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.isPending) return;
    requestId.current ??= crypto.randomUUID();
    const parsed = submissionSchema.safeParse({
      id: requestId.current,
      ...values,
      methods,
      otherMethod: methods.includes("other") ? values.otherMethod : "",
    });
    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (step === 1 || stepFields[step].includes(field)) nextErrors[field] ??= issue.message;
      }
    }
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0] as keyof FieldErrors;
      const target = first === "methods" ? compostingMethods[0].id : first;
      const invalidStep = stepFields.findIndex((fields) => fields.includes(first));
      if (invalidStep !== step) {
        goTo(invalidStep);
        focusTarget.current = target;
      } else document.getElementById(target)?.focus();
      setErrors(nextErrors);
      return;
    }
    if (step < 1) {
      goTo(step + 1);
      return;
    }
    if (!parsed.success) return;
    setErrors({});
    submission.reset();
    submission.mutate(parsed.data);
  }

  function field(id: TextField, label: string, placeholder: string, maxLength: number) {
    return (
      <div className="space-y-2.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          name={id}
          value={values[id]}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={id === "name" ? "name" : "off"}
          inputMode="text"
          required
          aria-invalid={!!errors[id]}
          aria-describedby={errors[id] ? `${id}-error` : undefined}
          onChange={(event) => setValues((previous) => ({ ...previous, [id]: event.target.value }))}
        />
        {errors[id] && (
          <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
            {errors[id]}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-svh max-w-[640px] px-6 py-10 sm:px-10 sm:py-16">
      <div className="mb-12 sm:mb-16">
        <div className="mb-3 flex justify-between gap-4 text-xs text-muted-foreground">
          <span>Pendataan warga</span>
          <span className="tabular-nums">{saved ? "Selesai" : `Langkah ${step + 1} dari 2`}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progres pengisian"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={progress}
          aria-valuetext={saved ? "Selesai" : `${progress} dari 2 langkah selesai`}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <m.div
            className="h-full origin-left bg-primary"
            initial={false}
            animate={{ scaleX: progress / 2 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          />
        </div>
      </div>
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <m.section
          key={saved ? "saved" : step}
          custom={direction}
          variants={{
            enter: (travel: number) => ({ opacity: 0, y: reducedMotion ? 0 : travel * 10 }),
            visible: { opacity: 1, y: 0 },
            exit: (travel: number) => ({
              opacity: 0,
              y: reducedMotion ? 0 : travel * -6,
              transition: { duration: reducedMotion ? 0 : 0.12 },
            }),
          }}
          initial="enter"
          animate="visible"
          exit="exit"
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          onAnimationComplete={(definition) => {
            if (definition === "visible" && focusTarget.current) {
              document.getElementById(focusTarget.current)?.focus();
              focusTarget.current = null;
            }
          }}
        >
          {saved ? (
            <>
              <Check className="mb-6 size-8 text-primary" aria-hidden="true" />
              <h1
                id="step-title"
                tabIndex={-1}
                className="text-balance font-heading text-3xl font-bold tracking-tight outline-none sm:text-4xl"
              >
                Data berhasil disimpan.
              </h1>
              <p className="mt-4 leading-7 text-muted-foreground">
                Terima kasih sudah ikut mendata pengolahan sampah organik di lingkungan kita.
              </p>
              <Button
                variant="outline"
                className="mt-8 h-11 rounded-md"
                onClick={() => {
                  setValues(emptyValues);
                  setMethods([]);
                  requestId.current = null;
                  submission.reset();
                  goTo(0);
                }}
              >
                Isi formulir lagi
              </Button>
            </>
          ) : (
            <>
              <h1
                id="step-title"
                tabIndex={-1}
                className="text-balance font-heading text-3xl font-bold tracking-tight outline-none sm:text-4xl"
              >
                {titles[step]}
              </h1>
              <p className="mt-4 text-pretty leading-7 text-muted-foreground">
                {descriptions[step]}
              </p>
              <form
                className="mt-8"
                onSubmit={handleSubmit}
                noValidate
                aria-busy={submission.isPending}
              >
                <fieldset disabled={submission.isPending} className="space-y-6">
                  {step === 0 && (
                    <>
                      {field("name", "Nama", "Nama lengkap Anda", 120)}
                      {field("address", "Nomor rumah + jalan", "Contoh: No. 12, Jalan Melati", 260)}
                      <div className="space-y-2.5">
                        <Label htmlFor="rt">RT</Label>
                        <select
                          id="rt"
                          name="rt"
                          value={values.rt}
                          required
                          aria-invalid={!!errors.rt}
                          aria-describedby={errors.rt ? "rt-error" : undefined}
                          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={(event) =>
                            setValues((previous) => ({ ...previous, rt: event.target.value }))
                          }
                        >
                          <option value="">Pilih RT</option>
                          {Array.from({ length: 16 }, (_, index) =>
                            String(index + 1).padStart(2, "0"),
                          ).map((rt) => (
                            <option key={rt} value={rt}>
                              RT {rt}
                            </option>
                          ))}
                        </select>
                        {errors.rt && (
                          <p id="rt-error" role="alert" className="text-sm text-destructive">
                            {errors.rt}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <fieldset aria-describedby={errors.methods ? "methods-error" : undefined}>
                        <legend className="sr-only">Metode pengolahan sampah organik</legend>
                        <div className="space-y-1">
                          {compostingMethods.map((method) => (
                            <Label
                              key={method.id}
                              htmlFor={method.id}
                              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors ${methods.includes(method.id) ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}
                            >
                              <Checkbox
                                id={method.id}
                                checked={methods.includes(method.id)}
                                aria-invalid={!!errors.methods}
                                className="size-[18px] rounded-[3px] border-input bg-card"
                                onCheckedChange={(checked) =>
                                  setMethods((previous) =>
                                    checked
                                      ? [...previous, method.id]
                                      : previous.filter((id) => id !== method.id),
                                  )
                                }
                              />
                              <span className="text-base font-normal">{method.label}</span>
                            </Label>
                          ))}
                        </div>
                        {errors.methods && (
                          <p
                            id="methods-error"
                            role="alert"
                            className="mt-2 text-sm text-destructive"
                          >
                            {errors.methods}
                          </p>
                        )}
                      </fieldset>
                      {methods.includes("other") &&
                        field(
                          "otherMethod",
                          "Metode lainnya",
                          "Tuliskan metode yang digunakan",
                          200,
                        )}
                    </>
                  )}
                  {error && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 rounded-md text-muted-foreground"
                      onClick={() => goTo(0)}
                      disabled={step === 0}
                    >
                      <ArrowLeft aria-hidden="true" /> Kembali
                    </Button>
                    <Button
                      type="submit"
                      className="h-11 rounded-md px-6"
                      disabled={submission.isPending}
                    >
                      {submission.isPending ? (
                        <>
                          <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />{" "}
                          Menyimpan…
                        </>
                      ) : step === 1 ? (
                        <>
                          Kirim data <ArrowRight aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          Lanjut <ArrowRight aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                </fieldset>
              </form>
            </>
          )}
        </m.section>
      </AnimatePresence>
    </main>
  );
}
