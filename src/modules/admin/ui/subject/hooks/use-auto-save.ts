import {
  AdminMatchingPairQuestion,
  AdminOrderingChoiceQuizQuestions,
  AdminUpdateMultipleChoiceQuizQuestions,
  updateEssayQuestionDetailSchema,
  updateMatchingPairDetailSchema,
  updateMultipleChoiceQuestionDetailsSchema,
  updateOrderingChoiceDetailSchema,
  updateTrueOrFalseQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import z from "zod";

// Generic interface that accepts the data type and optional success payload
interface UseAutoSaveQuestion<TData, TSuccessPayload = void> {
  data: TData;
  interval?: number; // seconds
  enabled?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (result: TSuccessPayload) => void;
}

// Type aliases for cleaner usage
type MultipleChoiceData = z.infer<
  typeof updateMultipleChoiceQuestionDetailsSchema
>;
type TrueOrFalseData = z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>;

export function useAutoSaveMultipleQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveQuestion<
  MultipleChoiceData,
  AdminUpdateMultipleChoiceQuizQuestions["insertedChoices"]
>) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef<MultipleChoiceData>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateMultipleChoiceQuestionDetails.mutationOptions({
      onSuccess: (result: AdminUpdateMultipleChoiceQuizQuestions) => {
        onSuccess?.(result.insertedChoices || []);
        queryClient.invalidateQueries(
          trpc.admin.getMultipleChoiceQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        if (error != null) {
          onError?.(e.message);
          toast.error(e.message);
        }
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !debouncedData?.multipleChoices) return;

    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    mutate(debouncedData);
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    errorMessage: error ? error.message : null,
    lastSaved: isPending ? null : new Date(),
  };
}

export function useAutoSaveTrueOrFalseQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveQuestion<TrueOrFalseData>) {
  // TSuccessPayload defaults to void
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef<TrueOrFalseData>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateTrueOrFalseQuestionDetails.mutationOptions({
      onSuccess: () => {
        onSuccess?.(); // No payload needed
        queryClient.invalidateQueries(
          trpc.admin.getTrueOrFalseQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !debouncedData) return;

    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    mutate(debouncedData);
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    errorMessage: error ? JSON.parse(error.message)[0].message : null,
    lastSaved: isPending ? null : new Date(),
  };
}

// For Essay questions - just define the data type
type EssayData = z.infer<typeof updateEssayQuestionDetailSchema>; // Assuming you have this schema

export function useAutoSaveEssayQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveQuestion<EssayData>) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef<EssayData>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateEssayQuestionDetails.mutationOptions({
      onSuccess: () => {
        onSuccess?.(); // No payload needed
        queryClient.invalidateQueries(
          trpc.admin.getEssayQuestionDetails.queryOptions({
            id: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !debouncedData) return;

    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    mutate(debouncedData);
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    errorMessage: error ? JSON.parse(error.message)[0].message : null,
    lastSaved: isPending ? null : new Date(),
  };
}

type OrderingData = z.infer<typeof updateOrderingChoiceDetailSchema>;

export function useAutoSaveOrderingQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveQuestion<
  OrderingData,
  AdminOrderingChoiceQuizQuestions["insertedChoices"]
>) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef<OrderingData>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateOrderingQuestionDetails.mutationOptions({
      onSuccess: (result) => {
        onSuccess?.(result.insertedChoices || []);
        queryClient.invalidateQueries(
          trpc.admin.getOrderingQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !debouncedData?.orderingOptions) return;

    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    mutate(debouncedData);
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    errorMessage: error ? JSON.stringify(error) : null,
    lastSaved: isPending ? null : new Date(),
  };
}

type MatchingPairData = z.infer<typeof updateMatchingPairDetailSchema>;

export function useAutoSaveMatchingPairQuestion({
  data,
  interval = 1,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveQuestion<
  MatchingPairData,
  AdminMatchingPairQuestion["insertedChoices"]
>) {
  const [debouncedData] = useDebounce(data, interval * 1000);
  const previousDataRef = useRef<MatchingPairData>(data);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation(
    trpc.admin.updateMatchingQuestionDetails.mutationOptions({
      onSuccess: (result) => {
        onSuccess?.(result.insertedChoices || []);
        queryClient.invalidateQueries(
          trpc.admin.getMatchingQuestionDetails.queryOptions({
            quizQuestionId: debouncedData.id,
          }),
        );
      },
      onError: (e) => {
        const err = JSON.parse(e.message)[0].message;
        onError?.(JSON.parse(err.message)[0].message);
      },
    }),
  );

  useEffect(() => {
    if (!enabled || !debouncedData?.matchingOptions) return;

    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    mutate(debouncedData);
    previousDataRef.current = debouncedData;
  }, [debouncedData, enabled, mutate]);

  return {
    isSaving: isPending,
    errorMessage: error ? JSON.stringify(error) : null,
    lastSaved: isPending ? null : new Date(),
  };
}
