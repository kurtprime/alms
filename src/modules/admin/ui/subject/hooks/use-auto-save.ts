import {
  AdminGetMultipleChoiceQuizQuestions,
  updateMultipleChoiceQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import z from "zod";

interface UseAutoSaveMultipleQuestion {
  data: z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>;
  interval?: number; // seconds
  enabled?: boolean;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

export function useAutoSaveMultipleQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveMultipleQuestion) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef =
    useRef<z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateMultipleChoiceQuestionDetails.mutationOptions({
      onSuccess: () => {
        onSuccess?.();
        queryClient.invalidateQueries(
          trpc.admin.getMultipleChoiceQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          })
        );
      },
      onError: (error) => {
        onError?.(error);
        console.log(error);
      },
    })
  );

  useEffect(() => {
    if (!enabled) return;
    if (!debouncedData || !debouncedData.multipleChoices?.length) return;

    const transformedData = {
      ...debouncedData,
    };
    // Deep equality check to prevent duplicate saves

    if (
      JSON.stringify(previousDataRef.current) ===
      JSON.stringify(transformedData)
    ) {
      return;
    }
    console.log(transformedData);
    mutate(transformedData);
    previousDataRef.current = transformedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    error,
    lastSaved: isPending ? null : new Date(),
  };
}
