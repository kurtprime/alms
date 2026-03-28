'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  BookOpen,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Clock,
  Award,
  Target,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StudentClassItem {
  role: 'student';
  progress: { total: number; done: number };
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

export default function StudentDashboardClient({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: classes } = useSuspenseQuery(trpc.user.getCurrentSectionInfo.queryOptions());

  const studentClasses = classes.filter((c): c is StudentClassItem => c.role === 'student');

  const totalClasses = studentClasses.length;
  const totalProgress = studentClasses.reduce((sum, c) => {
    if (c.progress.total === 0) return sum;
    return sum + (c.progress.done / c.progress.total) * 100;
  }, 0);
  const avgProgress = totalClasses > 0 ? Math.round(totalProgress / totalClasses) : 0;
  const completedItems = studentClasses.reduce((sum, c) => sum + c.progress.done, 0);
  const totalItems = studentClasses.reduce((sum, c) => sum + c.progress.total, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || 'Student'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {completedItems}/{totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Assignments & quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalItems - completedItems}</div>
            <p className="text-xs text-muted-foreground">In progress or not started</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Classes</h2>
        </div>

        {studentClasses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Classes Enrolled</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                You haven't been enrolled in any classes yet. Contact your teacher or administrator
                to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentClasses.map((item, index) => {
              const theme = themes[index % themes.length];
              const progressPercent =
                item.progress.total > 0
                  ? Math.round((item.progress.done / item.progress.total) * 100)
                  : 0;

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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-bold">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          {item.progress.done}/{item.progress.total} completed
                        </span>
                        {progressPercent === 100 && item.progress.total > 0 && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Teacher: {item.teacherName}</span>
                      </div>
                      <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ChevronRight className="h-4 w-4 inline" />
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
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/assignments')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Assignments
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/grades')}
            >
              <Award className="h-4 w-4 mr-2" />
              View My Grades
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/calendar')}
            >
              <Clock className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Complete tasks on time</p>
                  <p className="text-xs text-muted-foreground">
                    Stay on top of your assignments and quizzes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Review course materials</p>
                  <p className="text-xs text-muted-foreground">
                    Read through handouts and study guides before quizzes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Track your progress</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor your grades and identify areas for improvement
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
