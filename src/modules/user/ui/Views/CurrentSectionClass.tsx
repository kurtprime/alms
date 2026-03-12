"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  MoreVertical,
  Users,
  ChevronRight,
  FileText,
  ClipboardList,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { authClient, Session } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==========================================
// 1. TYPES
// ==========================================

interface ClassItem {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacher: string;
  studentCount: number;
  role: string;
  enrolledClass: {
    name: string;
  };
  // Teacher specific
  classImage?: string | null;
  // Student specific (Requires updated backend query)
  pendingHandouts?: number;
  pendingActivities?: number;
  pendingQuizzes?: number;
  totalHandouts?: number;
  totalActivities?: number;
  totalQuizzes?: number;
}

// ==========================================
// 2. UI COMPONENTS
// ==========================================

// A more sophisticated color palette
const themes = [
  {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "hover:border-slate-400",
    accent: "bg-slate-600",
  },
  {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "hover:border-blue-400",
    accent: "bg-blue-600",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "hover:border-emerald-400",
    accent: "bg-emerald-600",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "hover:border-amber-400",
    accent: "bg-amber-600",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "hover:border-rose-400",
    accent: "bg-rose-600",
  },
  {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "hover:border-indigo-400",
    accent: "bg-indigo-600",
  },
];

function StatChip({
  icon: Icon,
  label,
  count,
  total,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  total?: number;
}) {
  const isComplete = count === 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={cn(
          "p-1.5 rounded-md",
          isComplete
            ? "bg-green-100 text-green-600"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {count}
          {total !== undefined ? `/${total}` : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function ClassCard({
  classItem,
  index,
  onNavigate,
  isTeacher,
}: {
  classItem: ClassItem;
  index: number;
  onNavigate: (id: string) => void;
  isTeacher: boolean;
}) {
  const theme = themes[index % themes.length];

  // Calculate Progress for Student
  const totalItems =
    (classItem.totalHandouts || 0) +
    (classItem.totalActivities || 0) +
    (classItem.totalQuizzes || 0);

  const completedItems =
    totalItems -
    ((classItem.pendingHandouts || 0) +
      (classItem.pendingActivities || 0) +
      (classItem.pendingQuizzes || 0));

  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

  return (
    <Card
      onClick={() => onNavigate(classItem.id)}
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer border-2 border-transparent",
        "bg-white dark:bg-slate-900",
        "hover:shadow-xl hover:-translate-y-1",
        theme.border,
      )}
    >
      {/* Gradient Top Bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", theme.accent)} />

      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 dark:border-slate-700"
              >
                {classItem.subjectCode}
              </Badge>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">
                {classItem.subjectName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {classItem.enrolledClass.name}
              </p>
            </div>

            {/* Teacher Menu */}
            {isTeacher && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Manage Students</DropdownMenuItem>
                  <DropdownMenuItem>Edit Class</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500 focus:text-red-500">
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed dark:border-slate-800" />

        {/* Dynamic Body */}
        <div className="p-5 min-h-[140px] flex flex-col justify-center">
          {isTeacher ? (
            // --- TEACHER VIEW ---
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 dark:border-slate-800">
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {classItem.teacher.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{classItem.teacher}</p>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {classItem.studentCount}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Students
                </p>
              </div>
            </div>
          ) : (
            // --- STUDENT VIEW (PROGRESS) ---
            <div className="space-y-4">
              {/* Progress Bar Header */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Class Progress</span>
                <span
                  className={cn(
                    "font-bold",
                    progressPercentage === 100
                      ? "text-green-600"
                      : "text-slate-800 dark:text-white",
                  )}
                >
                  {progressPercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <Progress value={progressPercentage} className="h-2" />

              {/* Detailed Stats Row */}
              <div className="flex justify-between pt-2">
                <StatChip
                  icon={FileText}
                  label="Handouts"
                  count={classItem.pendingHandouts ?? 0}
                  total={classItem.totalHandouts}
                />
                <StatChip
                  icon={ClipboardList}
                  label="Activities"
                  count={classItem.pendingActivities ?? 0}
                  total={classItem.totalActivities}
                />
                <StatChip
                  icon={FileQuestion}
                  label="Quizzes"
                  count={classItem.pendingQuizzes ?? 0}
                  total={classItem.totalQuizzes}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hover Action Footer */}
        <div className="border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {isTeacher ? "Manage Class" : "Enter Class"}
          </span>
          <ChevronRight className="h-4 w-4 ml-1 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. PAGE & SKELETON
// ==========================================

function ClassCardSkeleton() {
  return (
    <Card className="overflow-hidden h-[260px] animate-pulse">
      <div className="h-1 bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="px-5 py-3">
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
    </Card>
  );
}

export default function CurrentSectionClass({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();

  // Note: Ensure your query returns total counts for progress calculation
  const { data: classes, isPending } = useSuspenseQuery(
    trpc.user.getCurrentSectionInfo.queryOptions(),
  );

  const handleNavigate = (classId: string) => {
    router.push(`/class/${classId}`);
  };

  const isTeacher = session.user.role === "teacher";

  if (isPending) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(4)].map((_, i) => (
          <ClassCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Optional: Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Classes</h2>
          <p className="text-muted-foreground">
            {isTeacher
              ? "Manage your classes and students"
              : "Track your progress and pending tasks"}
          </p>
        </div>
        {isTeacher && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Class
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map((classItem, index) => (
          <ClassCard
            key={classItem.id}
            classItem={classItem}
            index={index}
            onNavigate={handleNavigate}
            isTeacher={isTeacher}
          />
        ))}
      </div>
    </div>
  );
}

// Helper for the Plus icon if not already imported
import { Plus } from "lucide-react";
import { session } from "../../../../db/schemas/auth-schema";
