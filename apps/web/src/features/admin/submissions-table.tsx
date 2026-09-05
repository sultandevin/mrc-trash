import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@mom/ui/components/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mom/ui/components/table";
import type { listAdminSubmissions } from "./actions";
import { compostingMethods } from "../submissions/schema";

type Submission = Extract<
  Awaited<ReturnType<typeof listAdminSubmissions>>,
  { authenticated: true }
>["rows"][number];
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const columns: ColumnDef<Submission>[] = [
  {
    accessorKey: "name",
    header: "Nama warga",
    cell: ({ row }) => (
      <span className="block min-w-36 max-w-56 break-words font-medium whitespace-normal">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "address",
    header: "Alamat",
    cell: ({ row }) => (
      <span className="block min-w-48 max-w-72 break-words whitespace-normal">
        {row.original.address}
      </span>
    ),
  },
  {
    accessorKey: "methods",
    header: "Pengolahan sampah organik",
    cell: ({ row }) => (
      <div className="flex min-w-48 max-w-72 flex-wrap gap-1.5">
        {row.original.methods.map((method) => (
          <span
            key={method}
            className="max-w-full rounded-md bg-muted px-2 py-1 text-xs break-words whitespace-normal"
          >
            {method === "other"
              ? `Lainnya: ${row.original.otherMethod || "—"}`
              : compostingMethods.find((item) => item.id === method)?.label || method}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Dikirim (WIB)",
    cell: ({ row }) => (
      <time
        dateTime={row.original.createdAt}
        className="whitespace-nowrap tabular-nums text-muted-foreground"
      >
        {Number.isNaN(Date.parse(row.original.createdAt))
          ? row.original.createdAt
          : dateFormat.format(new Date(row.original.createdAt))}
      </time>
    ),
  },
];

export function SubmissionsTable({
  rows,
  page,
  hasMore,
  onPageChange,
}: {
  rows: Submission[];
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
    state: { pagination: { pageIndex: page, pageSize: 50 } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex: page, pageSize: 50 }) : updater;
      onPageChange(next.pageIndex);
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground sm:hidden">
        Geser tabel ke samping untuk melihat semua kolom.
      </p>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableCaption className="sr-only">
            Jawaban warga tentang pengolahan sampah organik, terbaru lebih dulu.
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/40 hover:bg-muted/40">
                {group.headers.map((header) => (
                  <TableHead key={header.id} scope="col" className="h-12 px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-4 align-top leading-relaxed">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center whitespace-normal">
                  <p className="font-medium">Belum ada jawaban</p>
                  <p className="mt-2 text-muted-foreground">
                    Jawaban warga akan muncul di sini setelah formulir dikirim.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <nav
        aria-label="Halaman jawaban"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          Halaman {page + 1} · {rows.length} jawaban
        </p>
        <div className="flex gap-2">
          <Button
            className="min-h-11"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
            Sebelumnya
          </Button>
          <Button
            className="min-h-11"
            variant="outline"
            disabled={!hasMore}
            onClick={() => table.nextPage()}
          >
            Berikutnya
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
