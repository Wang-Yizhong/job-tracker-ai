// --- file: src/components/DataTable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyText?: string;
  className?: string;
};

export default function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyText = "Keine Daten",
  className,
}: Props<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 小工具：从列 meta 里取出 width / className
  const getMeta = (col: any) =>
    (col?.columnDef?.meta as {
      width?: number | string;
      thClassName?: string;
      tdClassName?: string;
    }) || {};

  return (
    <div className={className}>
      {/* table-fixed 让 width/min/maxWidth 生效且不抖动 */}
      <Table className="w-full table-fixed">
        <TableHeader className="border-b border-border">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sort = header.column.getIsSorted(); // false | 'asc' | 'desc'
                const meta = getMeta(header.column);
                const w = meta.width;
                const widthStyle: React.CSSProperties = w
                  ? { width: w as any, minWidth: w as any, maxWidth: w as any }
                  : {};
                return (
                  <TableHead
                    key={header.id}
                    className={[
                      "sticky top-0 z-20 whitespace-nowrap bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
                      meta.thClassName || "",
                    ].join(" ")}
                    style={widthStyle}
                  >
                    {canSort ? (
                      <button
                        className="inline-flex items-center gap-1 hover:opacity-80"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sort === "asc" ? (
                          <ArrowUp className="ml-0.5 h-3.5 w-3.5" />
                        ) : sort === "desc" ? (
                          <ArrowDown className="ml-0.5 h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="ml-0.5 h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted">
                Lädt…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta = getMeta(cell.column);
                  const w = meta.width;
                  const widthStyle: React.CSSProperties = w
                    ? { width: w as any, minWidth: w as any, maxWidth: w as any }
                    : {};
                  return (
                    <TableCell
                      key={cell.id}
                      className={["align-middle truncate", meta.tdClassName || ""].join(" ")}
                      style={widthStyle}
                      title={
                        typeof cell.getValue() === "string"
                          ? (cell.getValue() as string)
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
