"use client";

import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import z from "zod";
import { toast } from "sonner";
import { AddSubjectForm } from "@/modules/formComponents/AddSubjectForm";

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
