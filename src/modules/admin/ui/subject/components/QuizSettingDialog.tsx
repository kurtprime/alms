// src/modules/admin/ui/subject/components/QuizSettingsDialog.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, FileText } from "lucide-react";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

// Simplified Schema: Only Name and Description
const settingsSchema = z.object({
  name: z.string().min(1, "Quiz name is required"),
  description: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface QuizSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: inferRouterOutputs<AppRouter>["user"]["getQuizDetails"];
  onSave: (data: SettingsFormValues) => void;
  isSaving: boolean;
}

export function QuizSettingsDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSaving,
}: QuizSettingsDialogProps) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when data loads
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: SettingsFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Quiz Details
          </DialogTitle>
          <DialogDescription>
            Update the name and description for this quiz.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 py-4"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right">
              Quiz Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Midterm Exam"
              {...form.register("name")}
              className="col-span-3"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Brief instructions or context (optional)"
              {...form.register("description")}
              className="col-span-3"
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
