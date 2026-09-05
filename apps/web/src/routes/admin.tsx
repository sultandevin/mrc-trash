import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Loading03Icon,
  Login01Icon,
  Logout02Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@mom/ui/components/alert-dialog";
import { Button } from "@mom/ui/components/button";
import { Input } from "@mom/ui/components/input";
import { Label } from "@mom/ui/components/label";
import { Skeleton } from "@mom/ui/components/skeleton";
import { listAdminSubmissions, loginAdmin, logoutAdmin } from "@/features/admin/actions";
import { SubmissionsTable } from "@/features/admin/submissions-table";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Data warga · Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  headers: () => ({
    "Cache-Control": "private, no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow",
  }),
  component: AdminPage,
});

function AdminPage() {
  const list = useServerFn(listAdminSubmissions);
  const login = useServerFn(loginAdmin);
  const logout = useServerFn(logoutAdmin);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [password, setPassword] = useState("");
  const submissions = useQuery({
    queryKey: ["admin", "submissions", page],
    queryFn: ({ signal }) => list({ data: { page }, signal }),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await login({ data: { password } }).catch(() => {
        throw new Error("Belum bisa masuk. Coba lagi atau hubungi pengelola aplikasi.");
      });
      if (!response.success) throw new Error(response.message);
    },
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onSettled: () => setPassword(""),
  });
  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    retry: false,
    onMutate: async () => {
      // Stop in-flight reads and discard inactive cached pages while logout completes.
      await queryClient.cancelQueries({ queryKey: ["admin"] });
      queryClient.removeQueries({ queryKey: ["admin"], type: "inactive" });
    },
    onSuccess: () => window.location.replace("/admin"),
  });
  const result = submissions.isError ? undefined : submissions.data;
  const isCheckingSession = submissions.isPending && !result;
  const isTransitioning = isCheckingSession || loginMutation.isPending || logoutMutation.isPending;
  const title = logoutMutation.isPending
    ? "Data warga"
    : loginMutation.isPending
      ? "Masuk admin"
      : result?.authenticated
        ? "Data warga"
        : result
          ? "Masuk admin"
          : "Admin";
  const error = logoutMutation.isError
    ? "Belum berhasil keluar. Silakan coba lagi."
    : loginMutation.isError
      ? loginMutation.error.message
      : submissions.isError
        ? "Data belum bisa dibuka. Coba lagi atau hubungi pengelola aplikasi."
        : "";

  function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginMutation.isPending) loginMutation.mutate();
  }

  return (
    <main className="mx-auto min-h-svh max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 flex min-h-24 flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Pendataan sampah organik</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        {result?.authenticated && !isCheckingSession ? (
          <AlertDialog>
            <AlertDialogTrigger render={<Button className="min-h-11" variant="outline" />}>
              <HugeiconsIcon
                icon={Logout02Icon}
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              />
              Keluar
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Keluar dari admin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda perlu memasukkan kata sandi lagi untuk kembali melihat data warga.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11">Batal</AlertDialogCancel>
                <AlertDialogAction className="min-h-11" onClick={() => logoutMutation.mutate()}>
                  Keluar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-4"
              aria-hidden="true"
            />
            Kembali ke formulir
          </Link>
        )}
      </header>

      {isTransitioning ? (
        <AdminLoading
          label={
            logoutMutation.isPending
              ? "Mengakhiri sesi…"
              : loginMutation.isPending
                ? "Memeriksa akses…"
                : "Memeriksa sesi admin…"
          }
        />
      ) : result?.authenticated ? (
        <>
          {logoutMutation.isError && (
            <Button className="mb-4 min-h-11" onClick={() => logoutMutation.mutate()}>
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} aria-hidden="true" />
              Coba keluar lagi
            </Button>
          )}
          {error && (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <section aria-label="Jawaban warga" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Jawaban terbaru ditampilkan lebih dulu · Waktu WIB
              </p>
              <Button
                className="min-h-11"
                variant="outline"
                disabled={submissions.isFetching}
                onClick={() => submissions.refetch()}
              >
                <HugeiconsIcon
                  icon={submissions.isFetching ? Loading03Icon : Refresh01Icon}
                  strokeWidth={2}
                  className={submissions.isFetching ? "size-4 motion-safe:animate-spin" : "size-4"}
                  aria-hidden="true"
                />
                Muat ulang
              </Button>
            </div>
            <SubmissionsTable
              rows={result.rows}
              page={page}
              hasMore={result.hasMore}
              onPageChange={setPage}
            />
          </section>
        </>
      ) : result ? (
        <section className="max-w-sm" aria-label="Masuk admin">
          {error && (
            <p
              role="alert"
              className="mb-6 rounded-md bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {logoutMutation.isError && (
            <Button className="mb-6 min-h-11" onClick={() => logoutMutation.mutate()}>
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} aria-hidden="true" />
              Coba keluar lagi
            </Button>
          )}

          {!result.authenticated && (
            <form onSubmit={signIn} className="space-y-5" aria-busy={loginMutation.isPending}>
              <div className="space-y-2.5">
                <Label htmlFor="admin-password">Kata sandi</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loginMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                className="min-h-11 w-full rounded-md"
                disabled={loginMutation.isPending}
              >
                <HugeiconsIcon
                  icon={loginMutation.isPending ? Loading03Icon : Login01Icon}
                  strokeWidth={2}
                  className={loginMutation.isPending ? "size-4 motion-safe:animate-spin" : "size-4"}
                  aria-hidden="true"
                />
                {loginMutation.isPending ? "Memeriksa…" : "Masuk"}
              </Button>
            </form>
          )}
        </section>
      ) : (
        <section className="max-w-sm" aria-label="Admin tidak dapat dibuka">
          <p role="alert" className="mb-6 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
          <Button className="min-h-11" onClick={() => submissions.refetch()}>
            <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} aria-hidden="true" />
            Coba lagi
          </Button>
        </section>
      )}
    </main>
  );
}

function AdminLoading({ label }: { label: string }) {
  return (
    <section aria-label={label} aria-busy="true">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="size-4 motion-safe:animate-spin"
          aria-hidden="true"
        />
        {label}
      </div>
      <div className="overflow-hidden rounded-xl border" aria-hidden="true">
        <div className="grid grid-cols-4 gap-6 border-b bg-muted/40 px-4 py-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 rounded-md" />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, row) => (
          <div key={row} className="grid grid-cols-4 gap-6 border-b px-4 py-5 last:border-b-0">
            {Array.from({ length: 4 }, (_, column) => (
              <Skeleton
                key={column}
                className={`h-4 rounded-md ${column === 1 || column === 2 ? "w-full" : "w-3/4"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
