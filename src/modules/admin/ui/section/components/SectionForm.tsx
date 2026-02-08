import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createSectionFormSchema } from "@/modules/admin/server/adminSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SectionFormProps {
  initialValues?: typeof createSectionFormSchema;
  setOpen: (open: boolean) => void;
}

export default function SectionForm({ setOpen }: SectionFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createSectionFormSchema>>({
    resolver: zodResolver(createSectionFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const createSection = useMutation(
    trpc.admin.create.mutationOptions({
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries(
          trpc.admin.getManySections.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.user.getManySections.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.user.getTheCurrentJoinedSections.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(
          error.message === "slug is taken"
            ? "Section name already created"
            : error.message,
        );
      },
    }),
  );
  async function onSubmit(values: z.infer<typeof createSectionFormSchema>) {
    createSection.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 flex flex-col m-5 bg-background"
      >
        <div className="grid gap-4 py-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strand Name</FormLabel>
                <FormControl>
                  <Input placeholder="Strand Name" {...field} />
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
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Name</FormLabel>
                <FormControl>
                  <Input placeholder="Section Name" {...field} />
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

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
