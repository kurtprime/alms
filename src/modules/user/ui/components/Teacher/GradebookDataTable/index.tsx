"use client";
"use no memo";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AssessmentColumn,
  StudentGradeRow,
} from "@/modules/user/server/userSchema";
import { FileSpreadsheet, ExternalLink, Check, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// FIXED TYPES
// ============================================

// Fixed: Added maxScore to the grade object
interface GradebookProps {
  data: {
    assessments: AssessmentColumn[];
    rows: StudentGradeRow[];
  };
  classId: string;
  isTeacher: boolean;
}

export function GradebookDataTable({
  data,
  classId,
  isTeacher,
}: GradebookProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState<string>("");

  // --- MUTATION ---
  const { mutate: updateScore, isPending: isUpdating } = useMutation(
    trpc.user.updateGrade.mutationOptions({
      onSuccess: () => {
        toast.success("Score updated");
        queryClient.invalidateQueries(
          trpc.user.getGradebookData.queryOptions({ classId }),
        );
        setOpenDropdown(null);
      },
      onError: (e) => {
        toast.error(e.message);
      },
    }),
  );

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    if (!data.rows.length) return;
    const headers = [
      "Student Name",
      ...data.assessments.map((a) => a.title || `Assessment ${a.id}`),
      "Average",
    ];
    const rows = data.rows.map((row) => {
      const rowData: (string | number)[] = [row.student.name || "N/A"];
      let totalScore = 0;
      let totalMax = 0;
      data.assessments.forEach((assessment) => {
        const grade = row.grades[assessment.id.toString()];
        const score = grade?.score;
        // Use assessment maxScore for calculation logic consistency
        const max = assessment.maxScore ?? 100;

        if (score != null && assessment.maxScore) {
          rowData.push(`${score}/${max}`);
          totalScore += score;
          totalMax += max;
        } else {
          rowData.push("--");
        }
      });
      const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      rowData.push(`${avg}%`);
      return rowData;
    });
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const colWidths = [
      { wch: 25 },
      ...data.assessments.map(() => ({ wch: 15 })),
      { wch: 10 },
    ];
    worksheet["!cols"] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gradebook");
    XLSX.writeFile(
      workbook,
      `Gradebook_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // --- HANDLERS ---
  const handleOpenChange = (
    isOpen: boolean,
    cellId: string,
    currentScore: number | null,
  ) => {
    if (isOpen) {
      setOpenDropdown(cellId);
      setInputValue(currentScore !== null ? String(currentScore) : "");
    } else {
      setOpenDropdown(null);
    }
  };

  const handleSave = (
    lessonTypeId: number,
    studentId: string,
    value: string,
  ) => {
    const newScore = value === "" ? null : parseFloat(value);
    if (value !== "" && isNaN(newScore as number)) {
      toast.error("Invalid number");
      return;
    }
    updateScore({
      lessonTypeId,
      studentId,
      score: newScore,
    });
  };

  const columns: ColumnDef<StudentGradeRow>[] = React.useMemo(() => {
    // 1. Student Column
    const studentCol: ColumnDef<StudentGradeRow> = {
      id: "student",
      header: "Student",
      accessorKey: "student.name",
      enableSorting: true,
      cell: ({ row }) => {
        const student = row.original.student;
        return (
          <div className="flex items-center gap-2 min-w-[180px]">
            {student.image ? (
              <Avatar className="size-10">
                <AvatarImage src={student.image} alt={student.name} />
                <AvatarFallback>{student.name}</AvatarFallback>
              </Avatar>
            ) : (
              <GeneratedAvatar
                className="size-10"
                seed={separateFullName(student.name).join(" ")}
                variant="initials"
              />
            )}
            <span className="font-medium truncate">{student.name}</span>
          </div>
        );
      },
    };

    // 2. Assessment Columns
    const assessmentCols: ColumnDef<StudentGradeRow>[] = data.assessments.map(
      (assessment) => ({
        id: `assessment-${assessment.id}`,
        header: () => (
          <div className="flex flex-col items-center justify-center text-center min-w-[80px]">
            <span className="truncate max-w-[120px] text-xs font-semibold">
              {assessment.title || "Untitled"}
            </span>
            <Badge
              variant="outline"
              className="mt-1 text-[10px] px-1 py-0 h-4 capitalize"
            >
              {assessment.type}
            </Badge>
          </div>
        ),
        accessorKey: `grades.${assessment.id}`,
        cell: ({ row }) => {
          const grade = row.original.grades[assessment.id.toString()];
          const score = grade?.score;

          // FIX: Prioritize assessment maxScore, fallback to 100
          // If your DB has maxScore: 50 for this assessment, this will now show /50
          const max = assessment.maxScore ?? grade?.maxScore ?? 100;

          const percentage =
            score != null ? Math.round((score / max) * 100) : null;

          const cellId = `${row.original.student.id}-${assessment.id}`;
          const isOpen = openDropdown === cellId;

          let statusColor = "text-slate-400";
          let bgColor = "bg-slate-50";
          if (percentage !== null) {
            if (percentage >= 75) {
              statusColor = "text-green-600";
              bgColor = "bg-green-50";
            } else if (percentage >= 50) {
              statusColor = "text-amber-600";
              bgColor = "bg-amber-50";
            } else {
              statusColor = "text-red-600";
              bgColor = "bg-red-50";
            }
          }

          return (
            <DropdownMenu
              open={isOpen}
              onOpenChange={(o) => handleOpenChange(o, cellId, score ?? null)}
            >
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md min-w-[70px]",
                    isTeacher &&
                      "cursor-pointer hover:ring-2 hover:ring-blue-200",
                    bgColor,
                  )}
                >
                  {grade != null && score != null ? (
                    <>
                      <span className={cn("text-sm font-bold", statusColor)}>
                        {score}/{max}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {percentage}%
                      </span>
                    </>
                  ) : grade == null ? (
                    <span className="text-slate-300 text-xs">
                      No submission
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">To Grade</span>
                  )}
                </div>
              </DropdownMenuTrigger>

              {isTeacher && (
                <DropdownMenuContent align="center" className="w-56 p-2">
                  <div className="mb-2 text-center">
                    <p className="text-xs text-slate-500">Edit Score</p>
                    <p className="font-semibold text-sm">{assessment.title}</p>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="h-8"
                      placeholder={`Score (Max: ${max})`}
                      disabled={isUpdating}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        handleSave(
                          assessment.id,
                          row.original.student.id,
                          inputValue,
                        )
                      }
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild className="cursor-pointer">
                    <a
                      href={`/check/${classId}/${assessment.id}/${row.original.student.id}`}
                      target="_blank"
                      className="flex items-center justify-between w-full"
                    >
                      <span>View Activity</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          );
        },
      }),
    );

    // 3. Average Column
    const avgCol: ColumnDef<StudentGradeRow> = {
      id: "average",
      header: "Average",
      cell: ({ row }) => {
        let totalScore = 0;
        let totalMax = 0;
        data.assessments.forEach((a) => {
          const g = row.original.grades[a.id.toString()];
          if (g && g.score != null && a.maxScore) {
            totalScore += g.score;
            totalMax += a.maxScore;
          }
        });
        const avg =
          totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        return (
          <div className="text-center font-bold text-sm">
            <span
              className={cn(
                avg >= 75
                  ? "text-green-600"
                  : avg >= 50
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {avg}%
            </span>
          </div>
        );
      },
    };

    return [studentCol, ...assessmentCols, avgCol];
  }, [
    data.assessments,
    openDropdown,
    isTeacher,
    isUpdating,
    inputValue,
    classId, // added classId to deps
    handleSave,
  ]);

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4 md:mx-20">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search student..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!data.rows.length}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea className="whitespace-nowrap">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSticky = header.column.id === "student";
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "bg-slate-50 dark:bg-slate-900",
                          isSticky &&
                            "sticky left-0 z-10 bg-slate-100 dark:bg-slate-800",
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isSticky = cell.column.id === "student";
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            isSticky &&
                              "sticky left-0 z-0 bg-white dark:bg-slate-950",
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
