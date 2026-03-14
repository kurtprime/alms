'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AssessmentColumn, StudentGradeRow } from '@/modules/user/server/userSchema';
import {
  FileSpreadsheet,
  ExternalLink,
  Check,
  Loader2,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  Calculator,
  FileText,
  MoreHorizontal,
  Smartphone,
  Monitor,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GeneratedAvatar } from '@/components/generatedAvatar';
import { separateFullName } from '@/hooks/separate-name';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

// ============================================
// TYPES
// ============================================

interface GradebookProps {
  data: {
    assessments: AssessmentColumn[];
    rows: StudentGradeRow[];
  };
  classId: string;
  isTeacher: boolean;
}

// ============================================
// MOBILE CARD COMPONENT
// ============================================

function StudentGradeCard({
  student,
  grades,
  assessments,
  classId,
  isTeacher,
  openDropdown,
  inputValue,
  isUpdating,
  setOpenDropdown,
  setInputValue,
  updateScore,
}: {
  student: StudentGradeRow['student'];
  grades: StudentGradeRow['grades'];
  assessments: AssessmentColumn[];
  classId: string;
  isTeacher: boolean;
  inputValue: string;
  isUpdating: boolean;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  setInputValue: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScore: any; //TODO: create a function for update Score;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate average
  let totalScore = 0;
  let totalMax = 0;
  assessments.forEach((a) => {
    const grade = grades[a.id.toString()];
    if (grade?.score != null && a.maxScore) {
      totalScore += grade.score;
      totalMax += a.maxScore;
    }
  });
  const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return 'text-slate-400';
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="overflow-hidden">
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {student.image ? (
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={student.image} alt={student.name} />
                <AvatarFallback>{student.name}</AvatarFallback>
              </Avatar>
            ) : (
              <GeneratedAvatar
                className="size-10 shrink-0"
                seed={separateFullName(student.name).join(' ')}
                variant="initials"
              />
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{student.name}</p>
              <p className={cn('text-sm font-bold', getScoreColor(avg))}>Average: {avg}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Assessments List */}
          {assessments.map((assessment) => {
            const grade = grades[assessment.id.toString()];
            const score = grade?.score;
            const max = assessment.maxScore ?? grade?.maxScore ?? 100;
            const percentage = score != null ? Math.round((score / max) * 100) : null;

            const cellId = `${student.id}-${assessment.id}`;
            const isOpen = openDropdown === cellId;

            return (
              <div key={assessment.id} className="flex items-center justify-between py-2 border-t">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{assessment.title}</p>
                  <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                    {assessment.type}
                  </Badge>
                </div>

                {isTeacher ? (
                  <DropdownMenu
                    open={isOpen}
                    onOpenChange={(o) => {
                      if (o) {
                        setOpenDropdown(cellId);
                        setInputValue(score !== null ? String(score) : '');
                      } else {
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center p-2 rounded-md min-w-[70px] cursor-pointer hover:ring-2 hover:ring-blue-200',
                          percentage !== null
                            ? percentage >= 75
                              ? 'bg-green-50'
                              : percentage >= 50
                                ? 'bg-amber-50'
                                : 'bg-red-50'
                            : 'bg-slate-50'
                        )}
                      >
                        {score != null ? (
                          <>
                            <span className={cn('text-sm font-bold', getScoreColor(percentage))}>
                              {score}/{max}
                            </span>
                            <span className="text-[10px] text-slate-500">{percentage}%</span>
                          </>
                        ) : (
                          <span className="text-slate-300 text-xs">No grade</span>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2">
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
                          onClick={() => {
                            const newScore = inputValue === '' ? null : parseFloat(inputValue);
                            if (inputValue !== '' && isNaN(newScore as number)) {
                              toast.error('Invalid number');
                              return;
                            }
                            updateScore({
                              lessonTypeId: assessment.id,
                              studentId: student.id,
                              score: newScore,
                            });
                          }}
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
                          href={`/check/${classId}/${assessment.id}/${student.id}`}
                          target="_blank"
                          className="flex items-center justify-between w-full"
                        >
                          <span>View Activity</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center p-2 rounded-md min-w-[70px]',
                      percentage !== null
                        ? percentage >= 75
                          ? 'bg-green-50'
                          : percentage >= 50
                            ? 'bg-amber-50'
                            : 'bg-red-50'
                        : 'bg-slate-50'
                    )}
                  >
                    {score != null ? (
                      <>
                        <span className={cn('text-sm font-bold', getScoreColor(percentage))}>
                          {score}/{max}
                        </span>
                        <span className="text-[10px] text-slate-500">{percentage}%</span>
                      </>
                    ) : (
                      <span className="text-slate-300 text-xs">No grade</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GradebookDataTable({ data, classId, isTeacher }: GradebookProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isMobile = useIsMobile();

  // --- STATE ---
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState<string>('');

  // --- MUTATION ---
  const { mutate: updateScore, isPending: isUpdating } = useMutation(
    trpc.user.updateGrade.mutationOptions({
      onSuccess: () => {
        toast.success('Score updated');
        queryClient.invalidateQueries(trpc.user.getGradebookData.queryOptions({ classId }));
        setOpenDropdown(null);
      },
      onError: (e) => {
        toast.error(e.message);
      },
    })
  );

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    if (!data.rows.length) return;
    const headers = [
      'Student Name',
      ...data.assessments.map((a) => a.title || `Assessment ${a.id}`),
      'Average',
    ];
    const rows = data.rows.map((row) => {
      const rowData: (string | number)[] = [row.student.name || 'N/A'];
      let totalScore = 0;
      let totalMax = 0;
      data.assessments.forEach((assessment) => {
        const grade = row.grades[assessment.id.toString()];
        const score = grade?.score;
        const max = assessment.maxScore ?? 100;

        if (score != null && assessment.maxScore) {
          rowData.push(`${score}/${max}`);
          totalScore += score;
          totalMax += max;
        } else {
          rowData.push('--');
        }
      });
      const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      rowData.push(`${avg}%`);
      return rowData;
    });
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const colWidths = [{ wch: 25 }, ...data.assessments.map(() => ({ wch: 15 })), { wch: 10 }];
    worksheet['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook');
    XLSX.writeFile(workbook, `Gradebook_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- TABLE COLUMNS ---
  const columns: ColumnDef<StudentGradeRow>[] = React.useMemo(() => {
    const studentCol: ColumnDef<StudentGradeRow> = {
      id: 'student',
      header: 'Student',
      accessorKey: 'student.name',
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
                seed={separateFullName(student.name).join(' ')}
                variant="initials"
              />
            )}
            <span className="font-medium truncate">{student.name}</span>
          </div>
        );
      },
    };

    const assessmentCols: ColumnDef<StudentGradeRow>[] = data.assessments.map((assessment) => ({
      id: `assessment-${assessment.id}`,
      header: () => (
        <div className="flex flex-col items-center justify-center text-center min-w-[80px]">
          <span className="truncate max-w-[120px] text-xs font-semibold">
            {assessment.title || 'Untitled'}
          </span>
          <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 h-4 capitalize">
            {assessment.type}
          </Badge>
        </div>
      ),
      accessorKey: `grades.${assessment.id}`,
      cell: ({ row }) => {
        const grade = row.original.grades[assessment.id.toString()];
        const score = grade?.score;
        const max = assessment.maxScore ?? grade?.maxScore ?? 100;
        const percentage = score != null ? Math.round((score / max) * 100) : null;

        const cellId = `${row.original.student.id}-${assessment.id}`;
        const isOpen = openDropdown === cellId;

        let statusColor = 'text-slate-400';
        let bgColor = 'bg-slate-50';
        if (percentage !== null) {
          if (percentage >= 75) {
            statusColor = 'text-green-600';
            bgColor = 'bg-green-50';
          } else if (percentage >= 50) {
            statusColor = 'text-amber-600';
            bgColor = 'bg-amber-50';
          } else {
            statusColor = 'text-red-600';
            bgColor = 'bg-red-50';
          }
        }

        return (
          <DropdownMenu
            open={isOpen}
            onOpenChange={(o) => {
              if (o) {
                setOpenDropdown(cellId);
                setInputValue(score !== null ? String(score) : '');
              } else {
                setOpenDropdown(null);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-md min-w-[70px]',
                  isTeacher && 'cursor-pointer hover:ring-2 hover:ring-blue-200',
                  bgColor
                )}
              >
                {grade != null && score != null ? (
                  <>
                    <span className={cn('text-sm font-bold', statusColor)}>
                      {score}/{max}
                    </span>
                    <span className="text-[10px] text-slate-500">{percentage}%</span>
                  </>
                ) : grade == null ? (
                  <span className="text-slate-300 text-xs">No submission</span>
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
                    onClick={() => {
                      const newScore = inputValue === '' ? null : parseFloat(inputValue);
                      if (inputValue !== '' && isNaN(newScore as number)) {
                        toast.error('Invalid number');
                        return;
                      }
                      updateScore({
                        lessonTypeId: assessment.id,
                        studentId: row.original.student.id,
                        score: newScore,
                      });
                    }}
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
                    href={`/check/${classId}/${assessment.lessonTypeId}/${row.original.student.id}`}
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
    }));

    const avgCol: ColumnDef<StudentGradeRow> = {
      id: 'average',
      header: 'Average',
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
        const avg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        return (
          <div className="text-center font-bold text-sm">
            <span
              className={cn(
                avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-amber-600' : 'text-red-600'
              )}
            >
              {avg}%
            </span>
          </div>
        );
      },
    };

    return [studentCol, ...assessmentCols, avgCol];
  }, [data.assessments, openDropdown, isTeacher, isUpdating, inputValue, classId, updateScore]);

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Filter data for mobile view
  const filteredData = React.useMemo(() => {
    if (!globalFilter) return data.rows;
    const search = globalFilter.toLowerCase();
    return data.rows.filter((row) => row.student.name?.toLowerCase().includes(search));
  }, [data.rows, globalFilter]);

  // --- RENDER ---
  return (
    <div className="space-y-4 w-full p-5 md:p-10">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search student..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Toggle - Mobile/Desktop */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 lg:hidden">
            <Button
              variant={isMobile ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => {}}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={!isMobile ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => {}}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data.rows.length}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary - Only show on mobile when there's data */}
      {data.rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="py-3">
            <CardContent className="py-0 flex flex-col items-center">
              <User className="h-4 w-4 text-slate-500 mb-1" />
              <p className="text-lg font-bold">{data.rows.length}</p>
              <p className="text-xs text-slate-500">Students</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="py-0 flex flex-col items-center">
              <FileText className="h-4 w-4 text-slate-500 mb-1" />
              <p className="text-lg font-bold">{data.assessments.length}</p>
              <p className="text-xs text-slate-500">Activities</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="py-0 flex flex-col items-center">
              <Calculator className="h-4 w-4 text-slate-500 mb-1" />
              <p className="text-lg font-bold">
                {data.rows.reduce((sum, r) => {
                  let hasGrade = false;
                  data.assessments.forEach((a) => {
                    if (r.grades[a.id.toString()]?.score != null) hasGrade = true;
                  });
                  return sum + (hasGrade ? 1 : 0);
                }, 0)}
              </p>
              <p className="text-xs text-slate-500">Graded</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="py-0 flex flex-col items-center">
              <MoreHorizontal className="h-4 w-4 text-slate-500 mb-1" />
              <p className="text-lg font-bold">
                {data.rows.length * data.assessments.length -
                  data.rows.reduce((sum, r) => {
                    let count = 0;
                    data.assessments.forEach((a) => {
                      if (r.grades[a.id.toString()]?.score != null) count++;
                    });
                    return sum + count;
                  }, 0)}
              </p>
              <p className="text-xs text-slate-500">Pending</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MOBILE VIEW: Card-based layout */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
              <StudentGradeCard
                key={row.student.id}
                student={row.student}
                grades={row.grades}
                assessments={data.assessments}
                classId={classId}
                isTeacher={isTeacher}
                openDropdown={openDropdown}
                inputValue={inputValue}
                isUpdating={isUpdating}
                setOpenDropdown={setOpenDropdown}
                setInputValue={setInputValue}
                updateScore={updateScore}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No students found</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* DESKTOP VIEW: Table */
        <div className="rounded-md border">
          <ScrollArea className="whitespace-nowrap w-sceen md:w-[calc(100vw-340px)] ">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isSticky = header.column.id === 'student';
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            'bg-slate-50 dark:bg-slate-900',
                            isSticky && 'sticky left-0 z-10 bg-slate-100 dark:bg-slate-800'
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isSticky = cell.column.id === 'student';
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              isSticky && 'sticky left-0 z-0 bg-white dark:bg-slate-950'
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
