/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface SkeletonCellProps {
  columnId: string;
}

// Skeleton cell that adapts to column content types
const SkeletonCell = ({ columnId }: SkeletonCellProps) => {
  // Avatar + text (Class column)
  if (columnId === "enrolledClass") {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col space-y-1">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    );
  }

  // Action button column
  if (columnId === "id") {
    return <Skeleton className="h-5 w-10 rounded-2xl" />;
  }

  // Badge with icon (Subject Code & Status columns)
  if (columnId === "subjectCode" || columnId === "status") {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-16 h-4 rounded-full" />
      </div>
    );
  }

  // Icon + text columns (Teacher & Student Count)
  const widthMap: Record<string, string> = {
    teacher: "w-32",
    studentCount: "w-16",
  };

  return (
    <div className="flex items-center gap-2">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className={`h-4 ${widthMap[columnId] || "w-24"} rounded`} />
    </div>
  );
};

const TableBodySkeleton = <TData, TValue>({
  columns,
  rowCount = 5,
  tableCellClassName,
}: {
  columns: ColumnDef<TData, TValue>[];
  rowCount?: number;
  tableCellClassName?: string;
}) => {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {columns.map((column, index) => {
            // Generate a stable column ID without using any
            const columnId = column.id || `col-${rowIndex}`;
            return (
              <TableCell
                key={`skeleton-cell-${rowIndex}-${columnId}-${index}`}
                className={cn("cursor-pointer w-max", tableCellClassName)}
              >
                <SkeletonCell columnId={columnId} />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  className?: string;
  tableRowClassName?: string;
  tableCellClassName?: string;
  showHeader?: boolean;
  loading?: boolean; // Add this
  skeletonRows?: number; // Add this
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  className,
  tableRowClassName,
  tableCellClassName,
  showHeader = false,
  loading = false,
  skeletonRows = 5,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background",
        className
      )}
    >
      <Table>
        {showHeader && (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {loading ? (
            <TableBodySkeleton
              columns={columns}
              rowCount={skeletonRows}
              tableCellClassName={tableCellClassName}
            />
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn("cursor-pointer", tableRowClassName)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("cursor-pointer w-max", tableCellClassName)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
