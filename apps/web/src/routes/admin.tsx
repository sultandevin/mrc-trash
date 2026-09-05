import { createFileRoute } from "@tanstack/react-router";
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
import { Button } from "@mom/ui/components/button";
import { Input } from "@mom/ui/components/input";
import { Label } from "@mom/ui/components/label";
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
      // Stop in-flight reads and discard every cached page immediately.
      await queryClient.cancelQueries({ queryKey: ["admin"] });
      queryClient.setQueriesData({ queryKey: ["admin"] }, { authenticated: false });
      queryClient.removeQueries({ queryKey: ["admin"], type: "inactive" });
    },
    onSuccess: () => window.location.replace("/admin"),
  });
  const result = submissions.isError ? undefined : submissions.data;
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
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Pendataan sampah organik</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            {result?.authenticated ? "Data warga" : "Masuk admin"}
          </h1>
        </div>
        {result?.authenticated && (
          <Button
            className="min-h-11"
            variant="outline"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            <HugeiconsIcon
              icon={logoutMutation.isPending ? Loading03Icon : Logout02Icon}
              strokeWidth={2}
              className={logoutMutation.isPending ? "size-4 motion-safe:animate-spin" : "size-4"}
              aria-hidden="true"
            />
            {logoutMutation.isPending ? "Keluar…" : "Keluar"}
          </Button>
        )}
      </header>

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

      {!result &&
        (error ? (
          <Button className="min-h-11" onClick={() => submissions.refetch()}>
            <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} aria-hidden="true" />
            Coba lagi
          </Button>
        ) : (
          <p role="status" className="text-muted-foreground">
            Membuka halaman admin…
          </p>
        ))}

      {result && !result.authenticated && (
        <form onSubmit={signIn} className="max-w-sm space-y-5">
          <p className="text-pretty text-muted-foreground">
            Masukkan kata sandi untuk melihat jawaban warga.
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Kata sandi</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11"
              disabled={loginMutation.isPending}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Tetap masuk selama 30 hari di perangkat ini. Gunakan perangkat pribadi dan keluar
            setelah memakai perangkat bersama.
          </p>
          <Button type="submit" className="min-h-11 w-full" disabled={loginMutation.isPending}>
            <HugeiconsIcon
              icon={loginMutation.isPending ? Loading03Icon : Login01Icon}
              strokeWidth={2}
              className={loginMutation.isPending ? "size-4 motion-safe:animate-spin" : "size-4"}
              aria-hidden="true"
            />
            {loginMutation.isPending ? "Memeriksa…" : "Masuk"}
          </Button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
            Kembali ke formulir
          </a>
        </form>
      )}

      {result?.authenticated && (
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
      )}
    </main>
  );
}
