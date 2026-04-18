'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import ResponsiveDialog from '@/components/responsive-dialog';
import TeacherAddClassForm from '../components/Teacher/TeacherAddClassForm';

interface TeacherClassItem {
  role: 'teacher';
  studentCount: number;
  toCheckCount: number;
  id: string;
  organizationId: string;
  subjectName: string;
  subjectCode: string;
  enrolledClassName: string;
  teacherName: string;
  teacherId: string;
}

const themes = [
  {
    accent: 'bg-blue-600',
    border: 'hover:border-blue-400',
    light: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    accent: 'bg-emerald-600',
    border: 'hover:border-emerald-400',
    light: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    accent: 'bg-amber-600',
    border: 'hover:border-amber-400',
    light: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    accent: 'bg-rose-600',
    border: 'hover:border-rose-400',
    light: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    accent: 'bg-indigo-600',
    border: 'hover:border-indigo-400',
    light: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
];

export default function TeacherDashboardClient({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();
  const [openCreateClass, setOpenCreateClass] = useState(false);

  const { data: classes } = useSuspenseQuery(trpc.user.getCurrentSectionInfo.queryOptions());

  const teacherClasses = classes.filter((c): c is TeacherClassItem => c.role === 'teacher');

  const totalStudents = teacherClasses.reduce((sum, c) => sum + c.studentCount, 0);
  const totalPending = teacherClasses.reduce((sum, c) => sum + c.toCheckCount, 0);
  const totalClasses = teacherClasses.length;

  return (
    <div className="p-3 space-y-3 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || 'Teacher'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-row items-center p-4 h-24 shadow-none bg-white border border-border hover:shadow-md transition-shadow">
          <div className="flex-1 flex flex-col justify-between h-full py-0.5">
            <div>
              <p className="text-[12px] font-bold">Total Classes</p>
              <div className="text-2xl font-bold leading-none mb-3">{totalClasses}</div>
            </div>
            <p className="text-[10px] text-muted-foreground text-left">
              Active teaching assignments
            </p>
          </div>

          <div className="p-2 bg-rose-50 rounded-full flex items-center justify-center self-start shadow-none">
            <BookOpen className="h-4 w-4 text-rose-500" />
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 h-24 shadow-none bg-white border border-border hover:shadow-md transition-shadow">
          <div className="flex-1 flex flex-col justify-between h-full py-0.5">
            <div>
              <p className="text-[12px] font-bold">Total Students</p>
              <div className="text-2xl font-bold leading-none text-left">{totalStudents}</div>
            </div>
            <p className="text-[10px] text-muted-foreground text-left">Across all classes</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 h-24 shadow-none bg-white border border-border hover:shadow-md transition-shadow">
          <div className="flex-1 flex flex-col justify-between h-full py-0.5">
            <div>
              <p className="text-[12px] font-bold">Upcoming Deadlines</p>
              <div className="text-2xl font-bold leading-none text-left">0</div>
            </div>
            <p className="text-[10px] text-muted-foreground text-left">Check deadlines this week</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-amber-500" />
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 h-24 shadow-none bg-white border border-border hover:shadow-md transition-shadow">
          <div className="flex-1 flex flex-col justify-between h-full py-0.5">
            <div>
              <p className="text-[12px] font-bold">Pending Review</p>
              <div className="text-2xl font-bold leading-none text-left">{totalPending}</div>
            </div>
            <p className="text-[10px] text-muted-foreground text-left">Submissions to grade</p>
          </div>
          <div className="p-2 bg-rose-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-rose-500" />
          </div>
        </Card>
      </div>

      {totalPending > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  You have {totalPending} submission{totalPending !== 1 ? 's' : ''} pending review
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Students are waiting for their grades. Review them now to keep your class on
                  track.
                </p>
              </div>
              <Button
                onClick={() => router.push('/check')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Review Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Classes</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/class')}>
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {teacherClasses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Get started by creating your first class. You can add students and assignments once
                created.
              </p>
              <Button onClick={() => setOpenCreateClass(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherClasses.map((item, index) => {
              const theme = themes[index % themes.length];
              return (
                <Card
                  key={item.id}
                  className={cn(
                    'group relative overflow-hidden transition-all duration-300 cursor-pointer border-2 border-transparent hover:shadow-lg hover:-translate-y-1',
                    theme.border
                  )}
                  onClick={() => router.push(`/class/${item.id}`)}
                >
                  <div className={cn('absolute top-0 left-0 right-0 h-1', theme.accent)} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {item.subjectCode}
                        </Badge>
                        <CardTitle className="text-lg">{item.subjectName}</CardTitle>
                        <CardDescription>{item.enrolledClassName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={cn('p-3 rounded-lg', theme.light)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.toCheckCount > 0 ? (
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          )}
                          <span className="text-sm font-medium">
                            {item.toCheckCount > 0
                              ? `${item.toCheckCount} pending`
                              : 'All caught up'}
                          </span>
                        </div>
                        <span className="text-lg font-bold">{item.toCheckCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{item.studentCount} students</span>
                      </div>
                      <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage <ChevronRight className="h-4 w-4 inline" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setOpenCreateClass(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Assignment
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/check/s')}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Review Submissions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Create your first assignment</p>
                  <p className="text-xs text-muted-foreground">
                    Add quizzes, handouts, or activities for your students
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Invite students to your class</p>
                  <p className="text-xs text-muted-foreground">
                    Share class codes or send email invitations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Grade submissions</p>
                  <p className="text-xs text-muted-foreground">
                    Review and provide feedback on student work
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResponsiveDialog
        open={openCreateClass}
        onOpenChange={setOpenCreateClass}
        title="Create New Class"
      >
        <TeacherAddClassForm setOpen={setOpenCreateClass} session={session} isPending={false} />
      </ResponsiveDialog>
    </div>
  );
}
