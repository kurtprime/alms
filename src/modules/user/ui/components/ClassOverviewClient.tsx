"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  HelpCircle,
  ClipboardList,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Session } from "@/lib/auth-client";
import AddLessonBtn, { AddLessonDialog } from "./Teacher/AddLesson";
import { UserGetAllLessonsWithContentsInClass } from "../../server/userSchema";
import ResponsiveDialog from "@/components/responsive-dialog";

type Lesson = UserGetAllLessonsWithContentsInClass;
type LessonType = Lesson[number]["lessonTypes"];

const typeIcons = {
  handout: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

const typeColors = {
  handout: "text-blue-600 bg-blue-50",
  quiz: "text-purple-600 bg-purple-50",
  assignment: "text-green-600 bg-green-50",
};

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

function LessonTypeCard({
  item,
  classId,
}: {
  item: LessonType[number];
  classId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: deleteLessonType, isPending } = useMutation(
    trpc.user.deleteLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({
            classId,
          }),
        );
      },
    }),
  );
  const [openDeleteLessonType, setOpenDeleteLessonType] = useState(false);
  const [openEditLessonType, setEditLessonType] = useState(false);
  const Icon = typeIcons[item.type];

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-blue-500">
        <CardContent className="">
          <div className="flex items-start gap-4">
            <div className={` rounded-full ${typeColors[item.type]}`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.name || `Untitled ${item.type}`}
                </h4>
                {item.status && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusColors[item.status]}`}
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditLessonType(true)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenDeleteLessonType(true)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      <ResponsiveDialog
        title={`Delete document`}
        description="This Action cannot be undone"
        onOpenChange={setOpenDeleteLessonType}
        open={openDeleteLessonType}
      >
        <div className="flex justify-stretch gap-2">
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={() => setOpenDeleteLessonType(false)}
            variant={"outline"}
          >
            No
          </Button>
          <Button
            onClick={() => deleteLessonType({ lessonTypeId: item.id })}
            className="flex-1"
            disabled={isPending}
          >
            Delete Document
          </Button>
        </div>
      </ResponsiveDialog>
      <ResponsiveDialog
        title={"Edit " + item.type}
        description=""
        open={openEditLessonType}
        className="min-w-[90vw] max-w-[90vw] min-h-[90vh] max-h-[90vh] flex flex-col justify-stretch items-stretch gap-3"
        onOpenChange={setEditLessonType}
      >
        <AddLessonDialog
          initialData={{
            lessonId: `${item.lessonId}`,
            lessonTypeId: item.id,
            title: item.name ?? "",
            markDownDescription: item.markup ?? "",
          }}
          classId={classId}
          setOpen={setEditLessonType}
        />
      </ResponsiveDialog>
    </>
  );
}

function TopicSection({
  title,
  lessons,
  session,
  defaultOpen = true,
  classId,
}: {
  title: string;
  lessons: Lesson;
  session: Session;
  defaultOpen?: boolean;
  classId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isTeacher = session.user.role === "teacher";

  // Get all lesson types for this topic
  const allLessonTypes = lessons
    .flatMap((lesson) =>
      lesson.lessonTypes.map((lt) => ({
        ...lt,
        lessonName: lesson.name,
        term: lesson.term,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  if (allLessonTypes.length === 0 && !isTeacher) return null;

  return (
    <div className="mb-6">
      <div
        className="w-full flex items-center lg:w-180 mx-auto justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-700">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {allLessonTypes.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2 ">
          {isTeacher && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // Add create handler
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}

          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2 lg:w-180 mx-auto">
          {allLessonTypes.map((item) => (
            <LessonTypeCard classId={classId} key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClassOverviewClient({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.user.getAllLessonsWithContentsInClass.queryOptions({
      classId,
    }),
  );

  // Use lessons directly without grouping by term
  const lessons = data as Lesson;
  const isTeacher = session.user.role === "teacher";

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Topic Sections - Render each lesson as its own topic */}
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <TopicSection
              classId={classId}
              key={lesson.id}
              session={session}
              title={
                lesson.term ? `${lesson.name} - ${lesson.term}` : "No Topic"
              }
              lessons={[lesson]}
            />
          ))}
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-20 flex flex-col justify-center items-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No classwork yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first assignment or announcement
            </p>
            {isTeacher && <AddLessonBtn classId={classId} />}
          </div>
        )}
      </div>
    </div>
  );
}
