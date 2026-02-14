"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  MoreVertical,
  Users,
  BookOpen,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
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
}

interface ClassCardProps {
  classItem: ClassItem;
  index: number;
  onNavigate: (classId: string) => void;
  isTeacher: boolean;
}

// Modern color palette - vibrant but not overwhelming
const cardThemes = [
  {
    accent: "bg-violet-500",
    accentLight: "bg-violet-100 dark:bg-violet-950/50",
    text: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500/10 to-transparent",
  },
  {
    accent: "bg-sky-500",
    accentLight: "bg-sky-100 dark:bg-sky-950/50",
    text: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-500/10 to-transparent",
  },
  {
    accent: "bg-emerald-500",
    accentLight: "bg-emerald-100 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    accent: "bg-amber-500",
    accentLight: "bg-amber-100 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    accent: "bg-rose-500",
    accentLight: "bg-rose-100 dark:bg-rose-950/50",
    text: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500/10 to-transparent",
  },
  {
    accent: "bg-cyan-500",
    accentLight: "bg-cyan-100 dark:bg-cyan-950/50",
    text: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-500/10 to-transparent",
  },
] as const;

function ClassCard({
  classItem,
  index,
  onNavigate,
  isTeacher,
}: ClassCardProps) {
  const theme = cardThemes[index % cardThemes.length];

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case "copy-link":
        navigator.clipboard.writeText(
          `${window.location.origin}/join/${classItem.id}`,
        );
        break;
      default:
        break;
    }
  };

  return (
    <Card
      className={cn(
        // Base styles
        "group relative w-full max-w-sm overflow-hidden",
        "bg-card/50 backdrop-blur-sm",
        "border border-border/50",
        // Hover effects
        "hover:border-border hover:bg-card",
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        "hover:-translate-y-0.3",
        "transition-all duration-300 ease-out",
        "cursor-pointer",
      )}
      onClick={() => onNavigate(classItem.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(classItem.id);
        }
      }}
    >
      {/* Accent bar at top */}
      <div className={cn("h-1 w-full", theme.accent)} />

      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          theme.gradient,
        )}
      />

      {/* Content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={cn("font-medium", theme.accentLight, theme.text)}
              >
                {classItem.subjectCode}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold tracking-tight truncate mb-0.5">
              {classItem.subjectName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {classItem.enrolledClass.name}
            </p>
          </div>

          {/* Actions dropdown */}
          {isTeacher && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => handleAction("copy-link", e)}>
                  Copy invite link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleAction("edit", e)}>
                  Edit class
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => handleAction("archive", e)}
                >
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Teacher info */}
        <div className="flex items-center gap-3 py-3 border-t border-border/50">
          <Avatar className="h-9 w-9">
            <AvatarFallback
              className={cn(
                "text-xs font-medium",
                theme.accentLight,
                theme.text,
              )}
            >
              {classItem.teacher.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{classItem.teacher}</p>
            <p className="text-xs text-muted-foreground">Teacher</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{classItem.studentCount} students</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>0 lessons</span>
          </div>
        </div>

        {/* Quick action hint */}
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to open
          </span>
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center",
              "opacity-0 group-hover:opacity-100 transition-all duration-300",
              "transform translate-x-2 group-hover:translate-x-0",
              theme.accentLight,
            )}
          >
            <ChevronRight className={cn("h-4 w-4", theme.text)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Loading skeleton
function ClassCardSkeleton() {
  return (
    <Card className="w-full max-w-sm overflow-hidden border border-border/50">
      <div className="h-1 w-full bg-muted animate-pulse" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3 py-3 border-t border-border/50">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="space-y-1 flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Page Component
export default function CurrentSectionClass() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { data: classes, isPending } = useSuspenseQuery(
    trpc.user.getCurrentSectionInfo.queryOptions(),
  );

  const handleNavigate = (classId: string) => {
    router.push(`/class/${classId}`);
  };

  const isTeacher = !isSessionPending && session?.user.role === "teacher";

  if (isPending) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {[...Array(4)].map((_, i) => (
          <ClassCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
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
  );
}
