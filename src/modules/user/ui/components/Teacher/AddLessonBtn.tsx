"use client";
import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React, { useState } from "react";

export default function AddLessonBtn({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="md:w-110 mt-5">
        <Button onClick={() => setOpen(true)} className="text-lg px-3 py-2">
          <Plus className="size-5" />
          Create
        </Button>
      </div>

      <ResponsiveDialog
        title="Add Lesson"
        description=""
        open={open}
        onOpenChange={setOpen}
      >
        TEST
      </ResponsiveDialog>
    </>
  );
}
