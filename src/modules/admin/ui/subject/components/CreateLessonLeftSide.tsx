import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import {
  AdminGetLessonsPerClass,
  createLessonSchema,
} from "@/modules/admin/server/adminSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { lessonTerm } from "@/db/schema";
import z from "zod";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function CreateLessonLeftSide({
  onOpen,
  initialValues,
}: {
  onOpen: (open: boolean) => void;
  initialValues?: AdminGetLessonsPerClass[number];
}) {
  const params: { subjectId: string } = useParams();
  const form = useForm({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      terms: initialValues?.terms ?? "prelims",
      classId: initialValues?.classSubjectId ?? params.subjectId,
    },
  });
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const newLesson = useMutation(
    trpc.admin.createLessons.mutationOptions({
      onSuccess: () => {
        toast.success("Lesson create Successfully");
        queryClient.invalidateQueries(
          trpc.admin.getLessonsPerClass.queryOptions({
            classId: params.subjectId,
          })
        );
        onOpen(false);
      },
      onError: () => {
        toast.error("Failed to create Lesson");
      },
    })
  );

  const updateLesson = useMutation(
    trpc.admin.updateLessons.mutationOptions({
      onSuccess: () => {
        toast.success("Lesson Updated Successfully");
        queryClient.invalidateQueries(
          trpc.admin.getLessonsPerClass.queryOptions({
            classId: params.subjectId,
          })
        );
        onOpen(false);
      },
      onError: () => {
        toast.error("Failed to create Lesson");
      },
    })
  );
  const onSubmit = (data: z.infer<typeof createLessonSchema>) => {
    if (!initialValues) {
      newLesson.mutate(data);
    } else {
      updateLesson.mutate({ ...data, id: initialValues.id });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem className="hidden ">
              <FormLabel>Lesson Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter Lesson name " {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 flex-col justify-stretch items-stretch md:flex-row">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Lesson Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Lesson name " {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-34" {...field}>
                      <SelectValue {...field} placeholder="Select Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Terms</SelectLabel>
                        {lessonTerm.enumValues.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {newLesson.isPending ||
        updateLesson.isPending ||
        form.formState.isSubmitting ? (
          <Button disabled className="mt-4 w-40">
            <Spinner />
          </Button>
        ) : (
          <Button type="submit" className="mt-4 w-40">
            {initialValues ? "Update Lesson" : "Create Lesson"}
          </Button>
        )}
      </form>
    </Form>
  );
}
