import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpenTextIcon,
  Check,
  Edit,
  EllipsisIcon,
  Plus,
  PlusSquare,
  Trash,
  X,
} from "lucide-react";
import React, { useState } from "react";
import CreateLessonLeftSide from "./CreateLessonLeftSide";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  AdminGetLessonsPerClass,
  AdminGetLessonsTypes,
} from "@/modules/admin/server/adminSchema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { lessonTypeEnum } from "@/db/schema";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Renders the lessons view for the current class and provides a dialog to create a new lesson.
 *
 * Fetches lessons for the class identified by the current route `subjectId`, shows them in a list,
 * and exposes a "Lesson" button that opens a create-lesson dialog.
 *
 * @returns A JSX element containing the create-lesson button, the lessons list, and the create dialog.
 */
export default function LessonCreate() {
  const [openCreateLesson, setOpenCreateLesson] = React.useState(false);
  const trpc = useTRPC();
  const params: { subjectId: string } = useParams();

  const { data, isLoading } = useQuery(
    trpc.admin.getLessonsPerClass.queryOptions({
      classId: params.subjectId,
    })
  );

  return (
    <>
      <div className="flex flex-col">
        <Button variant="outline" onClick={() => setOpenCreateLesson(true)}>
          <Plus /> Lesson
        </Button>
        <DisplayLessons data={data ?? []} isLoading={isLoading} />
      </div>
      <ResponsiveDialog
        open={openCreateLesson}
        onOpenChange={setOpenCreateLesson}
        description=""
        title="Create Lesson"
      >
        <CreateLessonLeftSide onOpen={setOpenCreateLesson} />
      </ResponsiveDialog>
    </>
  );
}

/**
 * Render an accordion of lessons with controls to edit, archive, and manage lesson types.
 *
 * Renders each lesson as an accordion item showing name and terms, a per-lesson dropdown for Edit/Delete actions, the LessonType list for that lesson, and two dialogs for editing and archiving the selected lesson.
 *
 * @param data - Array of lessons for the current class
 * @param isLoading - Whether lesson data is still loading; when true a loading placeholder is shown
 * @returns The lesson list UI including lesson-type controls and modal dialogs
 */
function DisplayLessons({
  data,
  isLoading,
}: {
  data: AdminGetLessonsPerClass;
  isLoading: boolean;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [lessonData, setLessonData] = useState<
    AdminGetLessonsPerClass[number] | undefined
  >(undefined);

  return (
    <>
      {!isLoading ? (
        <Accordion
          defaultValue={data.map((lesson) => `${lesson.name}-${lesson.id}`)}
          type="multiple"
          className=""
        >
          {data.map((lesson) => {
            return (
              <AccordionItem
                key={lesson.id}
                value={`${lesson.name}-${lesson.id}`}
                className="my-2 mx-0.2 border-none relative" // Add relative
              >
                {/* Accordion Trigger with extra right padding */}
                <AccordionTrigger className="px-2 py-4 pr-12 items-center ring-primary bg-card/60 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5 mx-0.2">
                  <span>
                    {lesson.name} ({lesson.terms})
                  </span>
                </AccordionTrigger>

                {/* Dropdown positioned absolutely - sibling, not child */}
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
                        className="hover:rounded-full cursor-pointer"
                      >
                        <EllipsisIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-10">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => {
                            setOpenEdit(true);
                            setLessonData(lesson);
                          }}
                        >
                          <Edit /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          defaultValue="destructive"
                          onClick={() => {
                            setLessonData(lesson);
                            setOpenDelete(true);
                          }}
                        >
                          <Trash /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <AccordionContent className="flex flex-col justify-stretch border-l-2 border-l-primary/100 my-2 ml-1 pl-1 pb-0">
                  <LessonType lessonId={lesson.id} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
          <AccordionItem
            key={"lesson.id"}
            value={"${lesson.name}-${lesson.id}"}
          >
            <AccordionTrigger className="hidden">asd</AccordionTrigger>
            <AccordionContent>OPEN</AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div>loading</div>
      )}
      <ResponsiveDialog
        title="Edit Lesson"
        description=""
        onOpenChange={setOpenEdit}
        open={openEdit}
      >
        <CreateLessonLeftSide onOpen={setOpenEdit} initialValues={lessonData} />
      </ResponsiveDialog>
      <ResponsiveDialog
        title="Archive Lesson"
        description="This will be move to an archive section"
        onOpenChange={setOpenDelete}
        open={openDelete}
      >
        <AreYouSure onOpen={setOpenDelete} id={lessonData?.id} />
      </ResponsiveDialog>
    </>
  );
}

/**
 * Render lesson-type UI for a specific lesson and provide a control to create new lesson types.
 *
 * Shows a loading indicator while types are being fetched, an empty state when no types exist,
 * a list of lesson-type action items when types are present, and a dropdown menu to create new types.
 * Creating a type triggers the create mutation and surfaces success or error toasts.
 *
 * @param props.lessonId - The lesson's numeric identifier whose lesson types are loaded and managed.
 * @returns A React element that displays the lesson-type list, empty/loading states, and creation controls.
 */
function LessonType({ lessonId }: { lessonId: number }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createLessonType = useMutation(
    trpc.admin.createLessonType.mutationOptions({
      onSuccess: (data, value) => {
        queryClient.invalidateQueries(
          trpc.admin.getLessonType.queryOptions({ lessonId })
        );
        toast.success("Created " + value.type);
      },
      onError: ({ message }) => {
        toast.error("Something went wrong " + message);
      },
    })
  );
  const { data, isLoading } = useQuery(
    trpc.admin.getLessonType.queryOptions({
      lessonId,
    })
  );

  return (
    <>
      {isLoading ? (
        <div>loading...</div>
      ) : data?.length == 0 || data == undefined ? (
        <Empty className="p-2 md:p-2">
          <EmptyHeader className="p-0 m-0">
            <EmptyMedia>
              <BookOpenTextIcon />
            </EmptyMedia>
            <EmptyDescription>
              Create an activity or handout first
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2 mb-2">
          {data.map((lessonType, index) => {
            return (
              <ButtonMenuComponent
                key={index}
                lessonType={lessonType}
                lessonId={lessonId}
              />
            );
          })}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="mx-auto p-0">
            <PlusSquare className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {lessonTypeEnum.enumValues.map((lessonType, index) => {
            return (
              <DropdownMenuItem
                disabled={createLessonType.isPending}
                key={index}
                onClick={async () => {
                  function countLessonType(
                    arg0: (typeof lessonTypeEnum.enumValues)[number],
                    data: AdminGetLessonsTypes
                  ) {
                    return ++data.filter((type) => {
                      if (type.type === arg0) return type;
                    }).length;
                  }

                  const count = data ? countLessonType(lessonType, data) : 0;

                  createLessonType.mutate({
                    name: `${lessonType} ${count}`,
                    lessonId: lessonId,
                    type: lessonType,
                  });
                }}
              >
                {lessonType.toLocaleUpperCase()}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

/**
 * Renders the controls for a single lesson type including selection, inline name editing, status changes, and archival.
 *
 * Allows selecting the lesson type (updates global selection and refreshes the view), editing its display name inline, changing its status between Published and Draft, and archiving it. Successful updates propagate to the lesson-type list so the UI reflects the change.
 *
 * @param lessonType - The lesson type data to render controls for
 * @param lessonId - The parent lesson's id used to scope updates and cache invalidation
 * @returns The rendered lesson-type menu and controls
 */
function ButtonMenuComponent({
  lessonType,
  lessonId,
}: {
  lessonType: AdminGetLessonsTypes[number];
  lessonId: number;
}) {
  const [lessonTypeParams, setLessonTypeParams] = useLessonTypeParams();
  const router = useRouter();
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState(lessonType.name ?? "");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateName = useMutation(
    trpc.admin.updateLessonTypeName.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getLessonType.queryOptions({
            lessonId,
          })
        );
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  const updateStatus = useMutation(
    trpc.admin.updateLessonTypeStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getLessonType.queryOptions({
            lessonId,
          })
        );
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  return (
    <div
      key={`${lessonType.id} + ${lessonType.name} + ${lessonType.type}`}
      className={cn("flex")}
    >
      {showEditName ? (
        <>
          <Input
            className="focus:ring-2 mr-1"
            placeholder="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Button
            className="absolute right-11"
            variant={"ghost"}
            onClick={() => setShowEditName(false)}
          >
            <X />
          </Button>
          <Button
            onClick={() => {
              updateName.mutate({
                id: lessonType.id,
                name: editName,
              });
              setShowEditName(false);
            }}
            className="absolute right-1"
            variant={"ghost"}
          >
            <Check />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant={"ghost"}
            className={cn(
              "border rounded-r-none  flex-1 justify-start text-start",
              lessonTypeParams.id === lessonType.id &&
                lessonTypeParams.type === lessonType.type &&
                "bg-accent"
            )}
            onClick={() => {
              router.refresh();
              setLessonTypeParams({
                type: lessonType.type,
                id: lessonType.id,
              });
            }}
          >
            {lessonType.name}
          </Button>
          <div className="absolute right-0 flex justify-center items-center gap-2">
            <span
              className={cn(
                "text-muted-foreground hidden hover:block",
                lessonType.id === lessonTypeParams.id && "block"
              )}
            >
              {lessonType.status}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"}>
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setShowEditName(true)}>
                    Edit Name
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={lessonType.status ?? undefined}
                          onValueChange={(e) => {
                            updateStatus.mutate({
                              id: lessonType.id,
                              status: e as "draft" | "published" | "archived",
                            });
                          }}
                        >
                          <DropdownMenuRadioItem value={"published"}>
                            Published
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value={"draft"}>
                            Draft
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onClick={() => {
                      updateStatus.mutate({
                        id: lessonType.id,
                        status: "archived",
                      });
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Renders a confirmation row with "cancel" and "Archive" actions for archiving a lesson.
 *
 * Triggers an archive mutation when "Archive" is clicked; on success it closes the dialog, invalidates the lessons-per-class query for the current class, and shows a success toast; on error it shows an error toast.
 *
 * @param onOpen - Callback invoked with `false` to close the parent dialog.
 * @param id - Optional lesson id to archive; if omitted the Archive action is a no-op.
 * @returns A JSX element containing the Cancel and Archive buttons.
 */
function AreYouSure({
  onOpen,
  id,
}: {
  onOpen: (bool: boolean) => void;
  id?: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params: { subjectId: string } = useParams();
  const archiveLesson = useMutation(
    trpc.admin.archiveLesson.mutationOptions({
      onSuccess: () => {
        onOpen(false);
        queryClient.invalidateQueries(
          trpc.admin.getLessonsPerClass.queryOptions({
            classId: params.subjectId,
          })
        );
        toast.success("Successfully Archive");
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );
  return (
    <div className="flex flex-row justify-around items-center mt-3">
      <Button variant={"outline"} onClick={() => onOpen(false)}>
        cancel
      </Button>
      <Button
        onClick={() => {
          if (id) archiveLesson.mutate({ id: id });
        }}
        disabled={archiveLesson.isPending}
      >
        Archive
      </Button>
    </div>
  );
}