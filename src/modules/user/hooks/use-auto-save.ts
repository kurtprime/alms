// hooks/useAutoSaveLesson.ts
"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import z from "zod";
import { addLessonTeacherSchema } from "../server/userSchema";

interface UseAutoSaveLessonProps {
  data: z.infer<typeof addLessonTeacherSchema>;
  interval?: number; // seconds
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAutoSaveLesson({
  data,
  interval = 1,
  enabled = false,
  onSuccess,
  onError,
}: UseAutoSaveLessonProps) {
  const { lessonTypeId } = data;
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef(data);
  const trpc = useTRPC();
  const { mutate, isPending, error } = useMutation(
    trpc.user.updateLessonType.mutationOptions({
      onSuccess: () => {
        // Invalidate to refresh data
        onSuccess?.();
      },
      onError: (e) => {
        toast.error("Auto-save failed: " + e.message);
        onError?.();
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !lessonTypeId) return;
    console.log(data);

    // Skip if data hasn't changed
    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    // Don't save empty initial state
    if (!debouncedData.title && !debouncedData.markDownDescription) {
      return;
    }

    mutate({
      ...debouncedData,
    });

    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, lessonTypeId, mutate]);

  return {
    errorMessage: error ? JSON.parse(error.message)[0].message : null,
    isSaving: isPending,
    lastSaved: isPending ? null : new Date(),
  };
}
