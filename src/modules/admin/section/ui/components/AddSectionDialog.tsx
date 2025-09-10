import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import React from "react";

export default function AddSectionDialog() {
  return (
    <>
      <DialogTrigger className="md:mx-6" asChild>
        <Button>
          <Plus />
          New Section
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Section</DialogTitle>
          <DialogDescription>
            This will create section for students and teachers to be assigned
            to.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </>
  );
}
