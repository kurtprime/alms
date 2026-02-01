import { authClient } from "@/lib/auth-client";
import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import { AddSubjectForm } from "@/modules/formComponents/AddSubjectForm";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function TeacherAddClassForm({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  const [createNewSubjectName, setCreateNewSubjectName] = useState(false);
  const [createNewTeacher, setCreateNewTeacher] = useState(false);
  const [createNewSection, setCreateNewSection] = useState(false);
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isAdmin = session?.user.role === "admin";

  const createNewSubject = useMutation(
    isAdmin
      ? trpc.admin.createSubjectClass.mutationOptions({
          onSuccess: (data, variables) => {
            //todo invalidate subject list query
            setOpen(false);
            queryClient.invalidateQueries(
              trpc.admin.getAllAdminSubject.queryOptions({}),
            );
            queryClient.invalidateQueries(
              trpc.admin.getAllSubjectIdPerClass.queryOptions({
                subjectId: +variables.name,
              }),
            );
          },
          onError: (error) => {
            toast.error(error.message);
          },
        })
      : trpc.user.createSubjectClass.mutationOptions({
          onSuccess: (data, variables) => {
            setOpen(false);
            queryClient.invalidateQueries(
              trpc.user.getAllSubjectNames.queryOptions(),
            );
            queryClient.invalidateQueries(
              trpc.user.getCurrentSubjectName.queryOptions(),
            );
            queryClient.invalidateQueries(
              trpc.user.getManySections.queryOptions({}),
            );
            queryClient.invalidateQueries(
              trpc.user.getTheCurrentJoinedSections.queryOptions({}),
            );
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }),
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
    <AddSubjectForm
      form={form}
      onSubmit={onSubmitSubject}
      isSubmitting={createNewSubject.isPending}
      createNewSubjectName={createNewSubjectName}
      createNewTeacher={createNewTeacher}
      createNewSection={createNewSection}
      setCreateNewSubjectName={setCreateNewSubjectName}
      setCreateNewTeacher={setCreateNewTeacher}
      setCreateNewSection={setCreateNewSection}
    />
  );
}
