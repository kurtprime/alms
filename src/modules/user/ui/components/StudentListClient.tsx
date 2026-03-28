'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  ClipboardCheck,
  TrendingUp,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { separateFullName } from '@/hooks/separate-name';
import { useTRPC } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GeneratedAvatar } from '@/components/generatedAvatar';

// --- 1. TYPE DEFINITIONS ---
interface StudentProgress {
  handouts: { completed: number; total: number };
  activities: { completed: number; total: number };
}

interface Student {
  userId: string;
  userName: string;
  userImage: string | null;
  progress: StudentProgress;
}

// ----------------------------------------------------------------

export default function StudentListClient({ classId }: { classId: string }) {
  const trpc = useTRPC();

  // --- State for UI Controls ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- Data Fetching ---
  const { data } = useSuspenseQuery(trpc.user.getAllStudentsInClass.queryOptions({ classId }));

  // --- Derived Data & Logic ---

  // Helper to calculate percentage safely
  const getPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Calculate Class Stats
  const classStats = useMemo(() => {
    if (!data || data.length === 0) return { avgProgress: 0, completed: 0, needsAttention: 0 };

    let totalPerc = 0;
    let completedCount = 0;
    let attentionCount = 0;

    data.forEach((s: Student) => {
      const totalTasks = s.progress.handouts.total + s.progress.activities.total;
      const totalDone = s.progress.handouts.completed + s.progress.activities.completed;
      const perc = getPercentage(totalDone, totalTasks);

      totalPerc += perc;
      if (perc === 100) completedCount++;
      if (perc < 30) attentionCount++;
    });

    return {
      avgProgress: Math.round(totalPerc / data.length),
      completed: completedCount,
      needsAttention: attentionCount,
    };
  }, [data]);

  // Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s: Student) => s.userName?.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a: Student, b: Student) => {
      if (sortBy === 'name') {
        return (a.userName || '').localeCompare(b.userName || '');
      }
      // Sort by overall progress (high to low)
      const aPerc = getPercentage(
        a.progress.handouts.completed + a.progress.activities.completed,
        a.progress.handouts.total + a.progress.activities.total
      );
      const bPerc = getPercentage(
        b.progress.handouts.completed + b.progress.activities.completed,
        b.progress.handouts.total + b.progress.activities.total
      );
      return bPerc - aPerc;
    });

    return result;
  }, [data, searchQuery, sortBy]);

  // --- Helpers ---
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getProgressBg = (percentage: number) => {
    if (percentage < 30) return 'bg-red-100 dark:bg-red-900/30';
    if (percentage < 70) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  const getStudentStatus = (student: Student) => {
    const total = student.progress.handouts.total + student.progress.activities.total;
    const done = student.progress.handouts.completed + student.progress.activities.completed;
    const perc = getPercentage(done, total);

    if (perc === 100)
      return {
        label: 'Completed',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2,
      };
    if (perc < 30)
      return {
        label: 'Needs Help',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertCircle,
      };
    return { label: 'On Track', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
  };

  return (
    <div className="space-y-6 p-4 w-full">
      {/* === SECTION 1: QUICK STATS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled in this class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.avgProgress}%</div>
            <Progress value={classStats.avgProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.completed}</div>
            <p className="text-xs text-muted-foreground">Students finished all tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.needsAttention}</div>
            <p className="text-xs text-muted-foreground">Students below 30% progress</p>
          </CardContent>
        </Card>
      </div>

      {/* === SECTION 2: TOOLBAR === */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Sort Dropdown - Fixed Type */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'progress')}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="progress">Sort by Progress</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle - Fixed Type */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              // ToggleGroup passes empty string sometimes, ensure we have a value
              if (v) setViewMode(v as 'grid' | 'list');
            }}
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* === SECTION 3: CONTENT === */}

      {filteredStudents.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No students found matching your search.
        </div>
      ) : viewMode === 'grid' ? (
        // --- Grid View ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student: Student) => {
            const progress = student.progress;
            const totalTasks = progress.handouts.total + progress.activities.total;
            const completedTasks = progress.handouts.completed + progress.activities.completed;
            const totalPerc = getPercentage(completedTasks, totalTasks);
            const status = getStudentStatus(student);
            const StatusIcon = status.icon;

            return (
              <Card
                key={student.userId}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4 group"
                style={{ borderTopColor: totalPerc > 80 ? '#22c55e' : '#6366f1' }}
              >
                <CardHeader className="flex flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-0">
                  <div className="flex-shrink-0">
                    {student.userImage ? (
                      <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image
                          src={student.userImage}
                          fill
                          className="object-cover"
                          alt={student.userName || 'Student'}
                        />
                      </div>
                    ) : (
                      <GeneratedAvatar
                        className="h-12 w-12 border-2 border-white shadow-sm"
                        variant="initials"
                        seed={separateFullName(student.userName || '').join(' ')}
                      />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {student.userName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>
                        {completedTasks} of {totalTasks} tasks
                      </span>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto opacity-0 group-hover:opacity-100 transition-opacity border',
                      status.color
                    )}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Handouts */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Handouts</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {progress.handouts.completed}/{progress.handouts.total}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'h-2 rounded-full overflow-hidden',
                        getProgressBg(
                          getPercentage(progress.handouts.completed, progress.handouts.total)
                        )
                      )}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          getProgressColor(
                            getPercentage(progress.handouts.completed, progress.handouts.total)
                          )
                        )}
                        style={{
                          width: `${getPercentage(progress.handouts.completed, progress.handouts.total)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium">Activities</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {progress.activities.completed}/{progress.activities.total}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'h-2 rounded-full overflow-hidden',
                        getProgressBg(
                          getPercentage(progress.activities.completed, progress.activities.total)
                        )
                      )}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          getProgressColor(
                            getPercentage(progress.activities.completed, progress.activities.total)
                          )
                        )}
                        style={{
                          width: `${getPercentage(progress.activities.completed, progress.activities.total)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // --- List View (Table) ---
        <Card className="border-none shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Student</TableHead>
                <TableHead>Handouts</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead className="text-right">Total Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student: Student) => {
                const progress = student.progress;
                const totalTasks = progress.handouts.total + progress.activities.total;
                const completedTasks = progress.handouts.completed + progress.activities.completed;
                const totalPerc = getPercentage(completedTasks, totalTasks);

                return (
                  <TableRow key={student.userId} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {student.userImage ? (
                          <Image
                            src={student.userImage}
                            width={32}
                            height={32}
                            className="rounded-full"
                            alt={student.userName || ''}
                          />
                        ) : (
                          <GeneratedAvatar
                            seed={student.userName || ''}
                            className="h-8 w-8"
                            variant="initials"
                          />
                        )}
                        <span className="font-medium">{student.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={getPercentage(
                            progress.handouts.completed,
                            progress.handouts.total
                          )}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground w-12">
                          {progress.handouts.completed}/{progress.handouts.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={getPercentage(
                            progress.activities.completed,
                            progress.activities.total
                          )}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground w-12">
                          {progress.activities.completed}/{progress.activities.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-mono',
                          totalPerc === 100 ? 'border-green-300 text-green-700' : 'border-slate-200'
                        )}
                      >
                        {totalPerc}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
