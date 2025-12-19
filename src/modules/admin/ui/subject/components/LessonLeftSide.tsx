import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Edit, EllipsisIcon, Plus, Trash } from "lucide-react";
import React, { useState } from "react";
import CreateLessonLeftSide from "./CreateLessonLeftSide";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AdminGetLessonsPerClass } from "@/modules/admin/server/adminSchema";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
                <AccordionTrigger className="px-2 py-4 pr-12 items-center bg-card/60 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5 mx-0.2">
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

                <AccordionContent className="border-l-2 border-l-primary/100 my-2 ml-1 pl-1">
                  <div>asda</div>
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
        description="This will be move to an arhive section"
        onOpenChange={setOpenDelete}
        open={openDelete}
      >
        <AreYouSure onOpen={setOpenDelete} id={lessonData?.id} />
      </ResponsiveDialog>
    </>
  );
}

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
      <Button onClick={() => onOpen(false)}>cancel</Button>
      <Button
        onClick={() => {
          if (id) archiveLesson.mutate({ id: id });
        }}
        disabled={archiveLesson.isPending}
        variant={"outline"}
      >
        Archive
      </Button>
    </div>
  );
}
