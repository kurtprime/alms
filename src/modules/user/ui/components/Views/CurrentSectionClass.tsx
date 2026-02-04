"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MoreVertical, TrendingUp, Users, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Google Classroom-style header colors using OKLCH for proper theming
const getHeaderGradient = (index: number) => {
  const gradients = [
    "from-blue-600 to-blue-800", // Classic blue
    "from-orange-400 to-orange-600", // Orange/Coral
    "from-green-600 to-green-800", // Green
    "from-purple-600 to-purple-800", // Purple
    "from-red-500 to-red-700", // Red
    "from-teal-500 to-teal-700", // Teal
  ];
  return gradients[index % gradients.length];
};

export default function CurrentSectionClass() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.user.getCurrentSectionInfo.queryOptions(),
  );
  const router = useRouter();

  // TODO: Replace console.log with actual navigation or modal opening
  const handleCardClick = (classId: string) => {
    console.log("Selected class ID:", classId);
    // TODO: Implement navigation or action here
    router.push(`/class/${classId}`);
    // TODO: Example: router.push(`/class/${classId}`);
    // TODO: Example: setSelectedClass(classId);
    // TODO: Example: openClassModal(classId);
  };

  return (
    <div className="flex flex-row flex-wrap gap-6 p-6">
      {data.map((classItem, index) => (
        <Card
          key={`${classItem.id}-${index}`}
          onClick={() => handleCardClick(classItem.id)}
          className="group w-80 h-100 flex flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-accent hover:-translate-y-0.1 transition-all duration-300 cursor-pointer py-0 pb-5 relative"
        >
          {/* Google Classroom Style Header */}
          <div
            className={`relative h-32 bg-gradient-to-r ${getHeaderGradient(index)} p-4`}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-background rounded-full -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-foreground rounded-full -ml-10 -mb-10" />
            </div>
            <Badge className="absolute right-2 top-2 text-background ">
              {classItem.subjectCode}
            </Badge>

            {/* Title Section */}
            <div className="relative z-10 h-full flex flex-col justify-center pr-10">
              <h3 className="text-background text-2xl font-normal tracking-tight truncate">
                {classItem.subjectName}
              </h3>
              <div className="mt-1 border-b-2 border-background/30 pb-1">
                <span className="text-background/90 text-sm font-light">
                  {classItem.enrolledClass.name}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <CardContent className="flex-1 p-0 bg-card">
            <div className="h-full flex flex-col">
              {/* Teacher Info Bar - shadcn styled */}
              <div className="px-4 pb-1 border-b border-border flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {classItem.teacher.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Teacher</p>
                  <p className="text-sm text-foreground truncate">
                    {classItem.teacher}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Users className="h-3 w-3" />
                  {classItem.studentCount}
                </div>
              </div>

              {/* Space for Future Data (Announcements, Assignments, etc.) */}
              <div className="flex-1 p-4 space-y-3">
                {/* Placeholder for future content - remove when you add real data */}
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No recent announcements</p>
                </div>

                {/* TODO: Add real announcements here when API is ready
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-border transition-colors cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        New assignment posted
                      </p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                </div>
                */}
              </div>
            </div>
          </CardContent>

          {/* Google Classroom Style Footer */}
          <CardFooter
            className="h-14 px-0 pb-5 border-t border-border flex justify-end gap-1 bg-card"
            onClick={(e) => e.stopPropagation()} // TODO: Prevent card click when using footer actions
          >
            {classItem.role === "teacher" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-muted hover:text-foreground text-muted-foreground"
                title="Grade Book"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-muted hover:text-foreground text-muted-foreground mr-1"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover text-popover-foreground border-border"
              >
                <DropdownMenuItem>Copy invite link</DropdownMenuItem>
                <DropdownMenuItem>Move</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Archive {classItem.role}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
