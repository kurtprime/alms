"use client";

import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UseFormReturn } from "react-hook-form";
import { LESSON_TYPE_CONFIG, LessonTeacherData } from "./types";

interface TitleSectionProps {
  form: UseFormReturn<LessonTeacherData>;
  lessonType: "handout" | "assignment" | "quiz";
  isSaving: boolean;
  isDirty: boolean;
  errorMessage: string | null;
}

// Simple save status badge component
function SaveStatusBadge({
  isSaving,
  isDirty,
  error,
}: {
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <Badge variant="destructive" className="text-xs">
        Error saving
      </Badge>
    );
  }
  if (isSaving) {
    return (
      <Badge variant="secondary" className="text-xs">
        Saving...
      </Badge>
    );
  }
  if (isDirty) {
    return (
      <Badge variant="outline" className="text-xs">
        Unsaved changes
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="text-xs bg-emerald-50 text-emerald-700"
    >
      Saved
    </Badge>
  );
}

export function TitleSection({
  form,
  lessonType,
  isSaving,
  isDirty,
  errorMessage,
}: TitleSectionProps) {
  const config = LESSON_TYPE_CONFIG[lessonType];

  return (
    <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter a title..."
                className="border-0 bg-transparent text-2xl font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {config.label}
        </Badge>
        <SaveStatusBadge
          isSaving={isSaving}
          isDirty={isDirty}
          error={errorMessage}
        />
      </div>
    </div>
  );
}
