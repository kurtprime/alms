"use client";

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
import { createStudentFormSchema } from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import SearchSectionCommand from "../../section/components/SearchSectionCommand";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import LoadingSwap from "@/components/LoadingSwap";

export default function AdminCreateStudent() {
  const [open, setOpen] = useState(false);
  const [recentSections, setRecentSections] = useState<string>("");

  return (
    <div className="flex justify-end md:mr-14 mb-4">
      <Button className="justify-self-end" onClick={() => setOpen(true)}>
        <Plus className="size-5" /> Create Student
      </Button>
      <ResponsiveDialog
        title="Create Student"
        description="Create a new student account"
        open={open}
        onOpenChange={setOpen}
      >
        <AdminCreateStudentForm
          setOpen={setOpen}
          setRecentSections={setRecentSections}
          recentSections={recentSections}
        />
      </ResponsiveDialog>
    </div>
  );
}

function AdminCreateStudentForm({
  setOpen,
  setRecentSections,
  recentSections,
}: {
  setOpen: (open: boolean) => void;
  setRecentSections: (sectionId: string) => void;
  recentSections: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchSection, setSearchSection] = useState("");

  const { data: sections, isLoading } = useQuery(
    trpc.admin.getManySections.queryOptions(
      searchSection
        ? {
            name: searchSection,
            slug: searchSection,
          }
        : {}
    )
  );

  const createStudent = useMutation(
    trpc.admin.createStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getManyStudents.queryOptions({})
        );
        toast.success("Student created successfully");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useForm<z.infer<typeof createStudentFormSchema>>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organizationId: recentSections ?? "",
    },
  });
  async function onSubmit(values: z.infer<typeof createStudentFormSchema>) {
    createStudent.mutate(values);
  }
  const isPending = createStudent.isPending;
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="md:space-y-8 flex flex-col m-5 bg-background"
      >
        <div className="grid gap-4 py-4 md:grid-cols-2">
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
        <div className="grid gap-4 py-4 ">
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Name</FormLabel>
                <FormControl>
                  <SearchSectionCommand
                    options={(sections ?? []).map((section) => ({
                      id: section.id,
                      value: section.id,
                      children: (
                        <div className="flex items-center space-x-2">
                          {section.logo ? (
                            <Avatar className="size-10">
                              <AvatarImage
                                src={section.logo}
                                alt={section.name}
                              />
                              <AvatarFallback>{section.name}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <GeneratedAvatar
                              className="size-10"
                              seed={section.name}
                              variant="initials"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {section.slug}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {section.name}
                            </span>
                          </div>
                        </div>
                      ),
                    }))}
                    onSelect={(event) => {
                      field.onChange(event);
                      setRecentSections(event);
                    }}
                    isLoading={isLoading}
                    onSearch={setSearchSection}
                    placeholder="Select Section"
                    value={field.value ?? ""}
                    className="h-auto"
                  />
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
        <LoadingSwap isLoading={isPending}>
          <Button type="submit">Submit</Button>
        </LoadingSwap>
      </form>
    </Form>
  );
}
