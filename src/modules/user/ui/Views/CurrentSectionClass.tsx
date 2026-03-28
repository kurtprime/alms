'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  MoreVertical,
  Users,
  ChevronRight,
  FileText,
  ClipboardList,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import ResponsiveDialog from '@/components/responsive-dialog';
import TeacherAddClassForm from '../components/Teacher/TeacherAddClassForm';

// ==========================================
// 1. TYPES (Strictly based on provided TRPC return)
// ==========================================

interface TeacherClassItem {
  role: string;
  studentCount: number;
  toCheckCount: number;
  id: string;
  subjectName: string;
  subjectCode: string;
  enrolledClassName: string;
  teacherName: string;
  teacherId: string;
}

interface StudentClassItem {
  role: string;
  progress: {
    total: number;
    done: number;
  };
  id: string;
  subjectName: string;
  subjectCode: string;
  enrolledClassName: string;
  teacherName: string;
  teacherId: string;
}

type ClassItem = TeacherClassItem | StudentClassItem;

// ==========================================
// 2. UI COMPONENTS
// ==========================================

const themes = [
  { accent: 'bg-blue-600', border: 'hover:border-blue-400' },
  { accent: 'bg-emerald-600', border: 'hover:border-emerald-400' },
  { accent: 'bg-amber-600', border: 'hover:border-amber-400' },
  { accent: 'bg-rose-600', border: 'hover:border-rose-400' },
  { accent: 'bg-indigo-600', border: 'hover:border-indigo-400' },
];

// --- TEACHER CARD ---
function TeacherCard({ item, theme }: { item: TeacherClassItem; theme: (typeof themes)[number] }) {
  const hasPending = item.toCheckCount > 0;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer border-2 border-transparent hover:shadow-xl hover:-translate-y-1',
        theme.border
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1.5', theme.accent)} />

      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="secondary" className="mb-2">
              {item.subjectCode}
            </Badge>
            <h3 className="text-xl font-bold tracking-tight">{item.subjectName}</h3>
            <p className="text-sm text-muted-foreground">{item.enrolledClassName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Manage Students</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-px bg-border" />

        {/* Main Stat: To Check */}
        <div
          className={cn(
            'p-4 rounded-lg flex items-center justify-between',
            hasPending
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-800'
          )}
        >
          <div className="flex items-center gap-3">
            {hasPending ? (
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            ) : (
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  hasPending && 'text-amber-800 dark:text-amber-200'
                )}
              >
                {hasPending ? 'Needs Grading' : 'All Caught Up!'}
              </p>
              <p className="text-xs text-muted-foreground">{item.toCheckCount} pending review</p>
            </div>
          </div>
          <span
            className={cn('text-3xl font-bold', hasPending ? 'text-amber-600' : 'text-green-600')}
          >
            {item.toCheckCount}
          </span>
        </div>

        {/* Footer Stats */}
        <div className="flex justify-between text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{item.studentCount} Students</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Manage <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- STUDENT CARD ---
function StudentCard({ item, theme }: { item: StudentClassItem; theme: (typeof themes)[number] }) {
  const progress = item.progress || { total: 0, done: 0 };
  const percentage = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer border-2 border-transparent hover:shadow-xl hover:-translate-y-1',
        theme.border
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1.5', theme.accent)} />

      <CardContent className="p-6 space-y-4">
        <div>
          <Badge variant="secondary" className="mb-2">
            {item.subjectCode}
          </Badge>
          <h3 className="text-xl font-bold tracking-tight">{item.subjectName}</h3>
          <p className="text-sm text-muted-foreground">{item.teacherName}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Class Progress</span>
            <span
              className={cn(
                'font-bold',
                percentage === 100 ? 'text-green-600' : 'text-slate-900 dark:text-white'
              )}
            >
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                progress.done === progress.total ? 'text-green-500' : 'text-slate-400'
              )}
            />
            <span>
              {progress.done} / {progress.total} Done
            </span>
          </div>
        </div>

        <div className="flex justify-end items-center text-xs text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pt-2">
          Continue <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. PAGE
// ==========================================

export default function CurrentSectionClass({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isTeacher = session.user.role === 'teacher';

  const { data: classes } = useSuspenseQuery(trpc.user.getCurrentSectionInfo.queryOptions());

  const handleNavigate = (classId: string) => router.push(`/class/${classId}`);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isTeacher ? 'My Classes' : 'My Subjects'}
            </h2>
            <p className="text-muted-foreground">
              {isTeacher ? 'Manage your classes and reviews' : 'Track your progress'}
            </p>
          </div>
          {isTeacher && (
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create Class
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map((item: ClassItem, index: number) => {
            const theme = themes[index % themes.length];

            // Discriminated Union based on the shape of the data
            // Since the backend returns different shapes based on role
            if ('toCheckCount' in item) {
              return (
                <div key={item.id} onClick={() => handleNavigate(item.id)}>
                  <TeacherCard item={item} theme={theme} />
                </div>
              );
            } else {
              return (
                <div key={item.id} onClick={() => handleNavigate(item.id)}>
                  <StudentCard item={item} theme={theme} />
                </div>
              );
            }
          })}
        </div>
      </div>

      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Create New Class">
        <TeacherAddClassForm setOpen={setOpen} session={session} isPending={false} />
      </ResponsiveDialog>
    </>
  );
}
