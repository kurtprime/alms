"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import CreateNewSubjectName from "./CreateNewSubjectName";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import z from "zod";
import SelectSubjectName from "./SelectSubjectName";
import SelectTeacher from "./SelectTeacher";
import ResponsiveDialog from "@/components/responsive-dialog";
import { AdminCreateTeacherForm } from "../../users/components/AdminCreateTeacher";

export default function AdminAddSubjectForm() {
  const [createNewSubjectName, setCreateNewSubjectName] = useState(false);
  const [createNewTeacher, setCreateNewTeacher] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      code: "",
      teacherId: "",
      description: "",
      status: "draft",
      classId: "",
    },
  });

  function onSubmitSubject(values: z.infer<typeof createSubjectSchema>) {
    console.log(values);
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmitSubject)}
        >
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] ">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <SelectSubjectName
                      field={field}
                      setCreateNewSubjectName={setCreateNewSubjectName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subject code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <FormControl>
                    <SelectTeacher
                      field={field}
                      setCreateNewTeacher={setCreateNewTeacher}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Input placeholder="Select Class" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit">Add Subject</Button>
        </form>
      </Form>
      <Dialog
        open={createNewSubjectName}
        onOpenChange={setCreateNewSubjectName}
      >
        <DialogContent>
          <CreateNewSubjectName onOpenChange={setCreateNewSubjectName} />
        </DialogContent>
      </Dialog>
      <ResponsiveDialog
        title="Add New Teacher"
        description="Add a new teacher to the system"
        open={createNewTeacher}
        onOpenChange={setCreateNewTeacher}
      >
        <AdminCreateTeacherForm setOpen={setCreateNewTeacher} />
      </ResponsiveDialog>
    </>
  );
}
