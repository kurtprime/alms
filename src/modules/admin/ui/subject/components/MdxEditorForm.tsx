"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { mdxEditorSchema } from "@/modules/admin/server/adminSchema";
import { MdxEditor } from "@/services/mdxEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function MdxEditorForm({
  markup,
}: {
  markup: string | null | undefined;
}) {
  const [lessonTypeParams] = useLessonTypeParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const lessonTypeId = lessonTypeParams.id ?? -1;

  const updateMarkup = useMutation(
    trpc.admin.updateMarkUp.mutationOptions({
      onSuccess: () => {
        toast.success("Save");
        queryClient.invalidateQueries(
          trpc.admin.getMarkUp.queryOptions({ id: lessonTypeId }),
        );
      },
    }),
  );

  const form = useForm({
    resolver: zodResolver(mdxEditorSchema),
    defaultValues: {
      description:
        markup ??
        "# 📚 My Lesson Title\n\n## Learning Objectives\n\n- [ ] Understand key concepts\n- [ ] Apply knowledge in practice\n- [ ] Complete the exercise\n\n## Key Concepts\n\nReact Hooks are  powerful  functions that let you use state in functional components.\n\nts\n// Example: useState Hook\nconst [count, setCount] = useState(0);\n\n\n## Comparison Table\n\n| Feature | Class Component | Hook |\n|---------|----------------|------|\n| State   | this.state     | useState |\n| Mount   | componentDidMount | useEffect |\n\n> 💡 Pro Tip: Always use hooks at the top level!\n\n---\n\nNext: Continue to practice exercises.",
    },
  });

  const handleSave = (data: z.infer<typeof mdxEditorSchema>) => {
    updateMarkup.mutate({
      markup: data.description,
      lessonTypeId,
    });
  };

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={form.handleSubmit(handleSave)}>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MdxEditor
                  value={field.value}
                  onChange={field.onChange}
                  className="border rounded-md"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          disabled={form.formState.isSubmitting || updateMarkup.isPending}
          variant={"outline"}
          className="mt-4 flex-1 "
        >
          {form.formState.isSubmitting || updateMarkup.isPending ? (
            <span className="flex justify-center items-center gap-2">
              <Spinner /> Saving...
            </span>
          ) : (
            "Save Lesson"
          )}
        </Button>
      </form>
    </Form>
  );
}
