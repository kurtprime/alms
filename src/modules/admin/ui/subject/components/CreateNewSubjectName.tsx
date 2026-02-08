import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { newSubjectNameSchema } from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function CreateNewSubjectName({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm({
    resolver: zodResolver(newSubjectNameSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const subjectName = useMutation(
    trpc.admin.createSubjectName.mutationOptions({
      //TODO
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getAllSubjectNames.queryOptions(),
        );
        queryClient.invalidateQueries(
          trpc.admin.getAllAdminSubject.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.user.getAllSubjectNames.queryOptions(),
        );
        queryClient.invalidateQueries(
          trpc.user.getCurrentSubjectName.queryOptions(),
        );
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: z.infer<typeof newSubjectNameSchema>) => {
    await subjectName.mutateAsync(values);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Subject Name</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subject name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Subject Description
                  <span className="text-muted-foreground">optional</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter subject description"
                    rows={10}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.isSubmitting ? (
            <Button variant="secondary" disabled>
              <Spinner /> Creating Subject...
            </Button>
          ) : (
            <Button type="submit" variant="outline">
              <PlusIcon /> Add New Subject
            </Button>
          )}
        </form>
      </Form>
    </>
  );
}
