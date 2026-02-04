"use client";
import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import React from "react";
import TeacherAddClassForm from "./TeacherAddClassForm";
import { Session } from "@/lib/auth-client";

export default function ClassroomDropdown({
  session,
  isPending,
}: {
  session: Session;
  isPending: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="rounded-full w-9">
            <Plus className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="size-4 " />
                Create Class
              </Button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResponsiveDialog
        onOpenChange={setOpen}
        open={open}
        title="Create New Class"
        description="Create a new class to start teaching"
      >
        <TeacherAddClassForm
          setOpen={setOpen}
          session={session}
          isPending={isPending}
        />
      </ResponsiveDialog>
    </>
  );
}
