"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import z from "zod";
import SelectSubjectName from "./SelectSubjectName";
import SelectTeacher from "./SelectTeacher";
import ResponsiveDialog from "@/components/responsive-dialog";
import { AdminCreateTeacherForm } from "../../users/components/AdminCreateTeacher";
import SelectSection from "./SelectSection";
import SectionForm from "../../section/components/SectionForm";
import { toast } from "sonner";
import { statusEnumValues } from "@/db/schema";

type Props = {
  setOpen: (open: boolean) => void;
};

export default function AdminAddSubjectForm({ setOpen }: Props) {
  const [createNewSubjectName, setCreateNewSubjectName] = useState(false);
  const [createNewTeacher, setCreateNewTeacher] = useState(false);
  const [createNewSection, setCreateNewSection] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createNewSubject = useMutation(
    trpc.admin.createSubjectClass.mutationOptions({
      onSuccess: (data, variables) => {
        //todo invalidate subject list query
        console.log(data);
        console.log(variables);
        setOpen(false);
        queryClient.invalidateQueries(
          trpc.admin.getAllAdminSubject.queryOptions({})
        );
        queryClient.invalidateQueries(
          trpc.admin.getAllSubjectIdPerClass.queryOptions({
            subjectId: +variables.name,
          })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

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

  async function onSubmitSubject(values: z.infer<typeof createSubjectSchema>) {
    await createNewSubject.mutateAsync(values);
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmitSubject)}
        >
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
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
          <div className="grid grid-cols-1 md:grid-cols-[2fr_0.7fr]">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <SelectSection
                      field={field}
                      setCreateNewSection={setCreateNewSection}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status</SelectLabel>
                        {statusEnumValues.map((status) => (
                          <SelectItem
                            className="hover:bg-primary/10"
                            key={status}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Spinner className="mr-2" /> Adding Subject...
              </>
            ) : (
              <>Add Subject Class </>
            )}
          </Button>
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
      <ResponsiveDialog
        title="Add New Section"
        description="Add a new section to the system"
        open={createNewSection}
        onOpenChange={setCreateNewSection}
      >
        <SectionForm setOpen={setCreateNewSection} />
      </ResponsiveDialog>
    </>
  );
}
