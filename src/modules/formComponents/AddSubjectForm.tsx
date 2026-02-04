import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
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
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ResponsiveDialog from "@/components/responsive-dialog";
import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import SelectSubjectName from "../admin/ui/subject/components/SelectSubjectName";
import CreateNewSubjectName from "../admin/ui/subject/components/CreateNewSubjectName";
import { AdminCreateTeacherForm } from "../admin/ui/users/components/AdminCreateTeacher";
import SectionForm from "../admin/ui/section/components/SectionForm";
import SelectTeacher from "../admin/ui/subject/components/SelectTeacher";
import SelectSection from "../admin/ui/subject/components/SelectSection";
import { authClient, Session } from "@/lib/auth-client";

// Define the schema type
type SubjectFormValues = z.infer<typeof createSubjectSchema>;

interface SubjectFormProps {
  // Form instance from react-hook-form
  form: UseFormReturn<SubjectFormValues>;
  // Submit handler
  onSubmit: (values: SubjectFormValues) => void | Promise<void>;
  // Loading state
  isSubmitting?: boolean;
  // Button text customization
  submitButtonText?: string;
  loadingButtonText?: string;
  // Dialog states
  createNewSubjectName: boolean;
  createNewTeacher: boolean;
  createNewSection: boolean;
  // Dialog setters
  setCreateNewSubjectName: (open: boolean) => void;
  setCreateNewTeacher: (open: boolean) => void;
  setCreateNewSection: (open: boolean) => void;
  // // Optional custom components (if you need different implementations)
  // customSelectSubjectName?: React.ComponentType<{
  //   field: any;
  //   setCreateNewSubjectName: (open: boolean) => void;
  // }>;
  // customSelectTeacher?: React.ComponentType<{
  //   field: any;
  //   setCreateNewTeacher: (open: boolean) => void;
  // }>;
  // customSelectSection?: React.ComponentType<{
  //   field: any;
  //   setCreateNewSection: (open: boolean) => void;
  // }>;
  // Optional dialog content props
  createSubjectNameComponent?: React.ReactNode;
  createTeacherComponent?: React.ReactNode;
  createSectionComponent?: React.ReactNode;
  session: Session;
}

// Status values - import from your schema or define here
const statusEnumValues = ["draft", "archived", "published"] as const;

export function AddSubjectForm({
  form,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Add Subject Class",
  loadingButtonText = "Adding Subject...",
  createNewSubjectName,
  createNewTeacher,
  createNewSection,
  setCreateNewSubjectName,
  setCreateNewTeacher,
  setCreateNewSection,
  createSubjectNameComponent = (
    <CreateNewSubjectName onOpenChange={setCreateNewSubjectName} />
  ),
  createTeacherComponent = (
    <AdminCreateTeacherForm setOpen={setCreateNewTeacher} />
  ),
  createSectionComponent = <SectionForm setOpen={setCreateNewSection} />,
  session,
}: SubjectFormProps) {
  const handleSubmit = form.handleSubmit(onSubmit);

  const isTeacher = session?.user.role === "teacher";

  if (isTeacher) {
    form.setValue("teacherId", session.user.id);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
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
          {!isTeacher && (
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-[2fr_0.7fr] gap-4">
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
                        <SelectValue placeholder="Select status" />
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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

          <Button
            type="submit"
            disabled={isSubmitting || form.formState.isSubmitting}
          >
            {isSubmitting || form.formState.isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                {loadingButtonText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </form>
      </Form>

      {/* New Subject Name Dialog */}
      <Dialog
        open={createNewSubjectName}
        onOpenChange={setCreateNewSubjectName}
      >
        <DialogContent>{createSubjectNameComponent}</DialogContent>
      </Dialog>

      {/* New Teacher Dialog */}
      <ResponsiveDialog
        title="Add New Teacher"
        description="Add a new teacher to the system"
        open={createNewTeacher}
        onOpenChange={setCreateNewTeacher}
      >
        {createTeacherComponent}
      </ResponsiveDialog>

      {/* New Section Dialog */}
      <ResponsiveDialog
        title="Add New Section"
        description="Add a new section to the system"
        open={createNewSection}
        onOpenChange={setCreateNewSection}
      >
        {createSectionComponent}
      </ResponsiveDialog>
    </>
  );
}
