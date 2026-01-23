import {
  AdminGetMultipleChoiceQuizQuestions,
  AdminUpdateMultipleChoiceQuizQuestions,
  updateMultipleChoiceQuestionDetailsSchema,
  updateTrueOrFalseQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import z from "zod";

interface UseAutoSaveMultipleQuestion {
  data: z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>;
  interval?: number; // seconds
  enabled?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (
    result: AdminUpdateMultipleChoiceQuizQuestions["insertedChoices"],
  ) => void;
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
      onSuccess: (result) => {
        onSuccess?.(result.insertedChoices || []);
        queryClient.invalidateQueries(
          trpc.admin.getMultipleChoiceQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
        return err;
      },
    }),
  );

  useEffect(() => {
    if (!enabled) return;
    if (!debouncedData || !debouncedData.multipleChoices) return;

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
    mutate(transformedData);
    console.log("Testing Mutate", transformedData);
    previousDataRef.current = transformedData;
  }, [debouncedData, enabled, mutate]);

  const errorMessage = error ? JSON.parse(error.message)[0].message : null;

  return {
    isSaving: isPending,
    errorMessage,
    lastSaved: isPending ? null : new Date(),
  };
}

interface UseAutoSaveTrueOrFalseQuestion {
  data: z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>;
  interval?: number; // seconds
  enabled?: boolean;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export function useAutoSaveTrueOrFalseQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveTrueOrFalseQuestion) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef =
    useRef<z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateTrueOrFalseQuestionDetails.mutationOptions({
      onSuccess: () => {
        onSuccess?.();
        queryClient.invalidateQueries(
          trpc.admin.getTrueOrFalseQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
        return err;
      },
    }),
  );

  useEffect(() => {
    if (!enabled) return;
    if (!debouncedData) return;

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
    mutate(transformedData);
    console.log("Testing mutate data", transformedData);
    previousDataRef.current = transformedData;
  }, [debouncedData, enabled, mutate]);

  const errorMessage = error ? JSON.parse(error.message)[0].message : null;

  return {
    isSaving: isPending,
    errorMessage,
    lastSaved: isPending ? null : new Date(),
  };
}
