"use client";
import LoadingSwap from "@/components/LoadingSwap";
import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createTeacherFormSchema } from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function AdminCreateTeacher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex justify-end md:mr-14 mb-4">
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-5" /> Teacher
      </Button>
      <ResponsiveDialog
        title="Create Teacher"
        description="Create a new teacher account"
        open={open}
        onOpenChange={setOpen}
      >
        <AdminCreateTeacherForm setOpen={setOpen} />
      </ResponsiveDialog>
    </div>
  );
}

function AdminCreateTeacherForm({
  setOpen,
}: {
  setOpen: (arg1: boolean) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createTeacherFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  const createTeacher = useMutation(
    trpc.admin.createTeacher.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getManyTeachers.queryOptions({})
        );
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  async function onSubmit(values: z.infer<typeof createTeacherFormSchema>) {
    await createTeacher.mutateAsync(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 py-4 md:grid-cols-2 ">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                {/* <FormDescription>
                          This is the name of the strand that will be displayed to
                          users.
                        </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                {/* <FormDescription>
                          This is the name of the section that will be displayed to
                          users.
                        </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          <Button type="submit">Submit</Button>
        </LoadingSwap>
      </form>
    </Form>
  );
}
