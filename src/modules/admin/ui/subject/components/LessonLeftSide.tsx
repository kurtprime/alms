"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import CreateLessonLeftSide from "./CreateLessonLeftSide";

interface LessonCreateProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LessonCreate({
  onSuccess,
  variant = "outline",
  size = "default",
  className,
}: LessonCreateProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Plus className="h-4 w-4 mr-2" />
        Lesson
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        description=""
        title="Create Lesson"
      >
        <CreateLessonLeftSide onOpen={setOpen} />
      </ResponsiveDialog>
    </>
  );
}
