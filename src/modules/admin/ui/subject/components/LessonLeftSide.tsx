import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import CreateLessonLeftSide from "./CreateLessonLeftSide";

export default function LessonCreate() {
  const [openCreateLesson, setOpenCreateLesson] = React.useState(false);
  return (
    <>
      <div className="bg-accent flex flex-col gap-2">
        <Button variant="outline" onClick={() => setOpenCreateLesson(true)}>
          <Plus /> Lesson
        </Button>
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
