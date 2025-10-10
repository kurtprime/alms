"use client";
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminAddSubjectForm from "./AdminAddSubjectForm";

export default function SubjectHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="w-full h-12 flex flex-row items-center justify-between my-4 px-2">
        <span className="flex items-center md:mx-7">
          <h2 className="text-lg text-accent-foreground font-semibold">
            <SidebarTrigger className="md:hidden" />
            List of Subjects
          </h2>
        </span>
        <div>
          <Button
            onClick={() => setOpen(true)}
            variant="default"
            className="md:mx-7"
          >
            <Plus />
            New Subject
          </Button>
        </div>
      </div>
      <ResponsiveDialog
        title="Create Subject"
        description="This will create a subject for students and teachers"
        open={open}
        onOpenChange={setOpen}
        className="md:max-w-150"
      >
        <AdminAddSubjectForm />
      </ResponsiveDialog>
    </>
  );
}
