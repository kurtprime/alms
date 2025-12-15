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
import {
  createStudentFormSchema,
  updateStudentFormSchema,
} from "@/modules/admin/server/adminSchema";
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
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { organizationMemberStrand } from "@/db/schema";

export default function AdminCreateStudent({
  studentInfo,
}: {
  studentInfo?: z.infer<typeof updateStudentFormSchema>;
}) {
  const [open, setOpen] = useState(false);
  const [recentSections, setRecentSections] = useState<string>("");
  const [recentStrand, setRecentStrand] = useState<
    (typeof organizationMemberStrand.enumValues)[number]
  >(organizationMemberStrand.enumValues[0]);

  return (
    <div className="flex justify-end md:mr-14 mb-4">
      <Button
        className="justify-self-end text-primary"
        variant="outline"
        onClick={() => setOpen(true)}
      >
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
          recentStrand={recentStrand}
          setRecentStrand={setRecentStrand}
          studentInfo={studentInfo}
        />
      </ResponsiveDialog>
    </div>
  );
}

export function AdminCreateStudentForm({
  setOpen,
  setRecentSections,
  recentSections,
  setRecentStrand,
  recentStrand,
  studentInfo,
}: {
  studentInfo?: z.infer<typeof updateStudentFormSchema>;
  setOpen: (open: boolean) => void;
  setRecentSections?: (sectionId: string) => void;
  recentSections?: string;
  setRecentStrand?: (
    strand: (typeof organizationMemberStrand.enumValues)[number]
  ) => void;
  recentStrand?: (typeof organizationMemberStrand.enumValues)[number];
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
  const updateStudent = useMutation(
    trpc.admin.updateStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getManyStudents.queryOptions({})
        );
        queryClient.invalidateQueries(
          trpc.admin.getManyStudents.queryOptions({ userId: studentInfo?.id })
        );
        toast.success("Student updated successfully");
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
      firstName: studentInfo?.firstName || "",
      lastName: studentInfo?.lastName || "",
      middleInitial: studentInfo?.middleInitial || "",
      organizationId: recentSections ?? "",
      userId: studentInfo?.userId || "",
      strand: recentStrand || "Not Specified",
    },
  });

  async function onSubmit(values: z.infer<typeof createStudentFormSchema>) {
    if (!studentInfo) {
      createStudent.mutate(values);
    } else {
      updateStudent.mutate({ ...values, id: studentInfo.id });
    }
  }
  const isPending = createStudent.isPending;
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className=" flex flex-col bg-background"
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="middleInitial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Initial</FormLabel>
                <FormControl>
                  <Input placeholder="Middle Initial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 pb-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Student ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="strand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strand</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(
                    event: (typeof organizationMemberStrand.enumValues)[number]
                  ) => {
                    field.onChange(event);
                    setRecentStrand?.(event);
                  }}
                  value={setRecentStrand ? recentStrand : field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Strand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>SHS Strand</SelectLabel>
                      {organizationMemberStrand.enumValues.map((strand) => (
                        <SelectItem
                          className="hover:bg-primary/20"
                          key={strand}
                          value={strand}
                          onSelect={(e) => {
                            field.onChange(e);
                            setRecentStrand?.(strand);
                          }}
                        >
                          {strand}
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
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem className="my-4">
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
                          <span className="font-semibold">{section.slug}</span>
                          <span className="text-sm text-muted-foreground">
                            {section.name}
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                  onSelect={(event) => {
                    field.onChange(event);
                    setRecentSections?.(event);
                  }}
                  isLoading={isLoading}
                  onSearch={setSearchSection}
                  placeholder="Select Section"
                  value={field.value ?? ""}
                  className="h-auto"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingSwap isLoading={isPending}>
          <Button type="submit">Submit</Button>
        </LoadingSwap>
      </form>
    </Form>
  );
}
