"use client";
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SectionForm from "./SectionForm";

export default function SectionHeader() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div className="w-full h-12 flex flex-row items-center justify-between my-4 px-2">
        <span className="flex items-center md:mx-7">
          <h2 className="text-lg text-accent-foreground font-semibold">
            <SidebarTrigger className="md:hidden" />
            List Sections
          </h2>
        </span>
        <div>
          <Button
            onClick={() => setOpen(true)}
            variant="default"
            className="md:mx-7"
          >
            <Plus />
            New Section
          </Button>
        </div>
      </div>
      <ResponsiveDialog
        title="Create Section"
        description="This will create section for students and teachers to be assigned to."
        open={open}
        onOpenChange={setOpen}
      >
        <SectionForm setOpen={setOpen} />
      </ResponsiveDialog>
    </>
  );
}
