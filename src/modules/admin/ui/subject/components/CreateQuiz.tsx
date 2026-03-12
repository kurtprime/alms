"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quizTypeEnum } from "@/db/schema";
import { formatQuizType } from "@/hooks/initials";
import {
  AdminGetQuizQuestions,
  updateQuizSettingsFormSchema,
} from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Plus,
  GripVertical,
  Loader2,
  AlertCircle,
  ListChecks,
  Trophy,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Question Type Components
import MultipleChoiceQuestionForm from "./QuizQuestionTypes/MultipleChoiceQuestion";
import TrueOrFalseQuestion from "./QuizQuestionTypes/TrueOrFalseQuestion";
import EssayQuestion from "./QuizQuestionTypes/EssayQuestion";
import OrderingQuestion from "./QuizQuestionTypes/OrderingQuestion";
import MatchingPairQuestion from "./QuizQuestionTypes/MatchingPairQuestion";
import z from "zod";
import { QuizSettingsDialog } from "./QuizSettingDialog";

// ==========================================
// 1. TYPES
// ==========================================

type QuizType = (typeof quizTypeEnum.enumValues)[number];

// ==========================================
// 2. SORTABLE WRAPPER COMPONENT
// ==========================================

function SortableQuestionWrapper({
  id,
  children,
  index,
}: {
  id: number;
  children: React.ReactNode;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", isDragging && "z-50")}
    >
      <Card
        className={cn(
          "overflow-hidden border shadow-sm transition-all duration-200",
          isDragging
            ? "border-primary shadow-2xl scale-[1.01] ring-2 ring-primary/20"
            : "hover:shadow-md hover:border-slate-300",
        )}
      >
        <div className="flex">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "w-10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-900 border-r transition-colors select-none",
              "opacity-0 group-hover:opacity-100",
              isDragging &&
                "opacity-100 bg-blue-50 dark:bg-blue-950 border-r-blue-200 dark:border-r-blue-800",
            )}
          >
            <GripVertical className="h-5 w-5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 mt-1">
              {index + 1}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1">{children}</div>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 3. QUESTION CARDS
// ==========================================

interface QuizQuestionInterface {
  data: AdminGetQuizQuestions[number];
  mutate: (input: { id: number }) => void;
}

// Specific Card Renderers (Kept logic intact as requested)
function TrueOrFalseQuestionCard({ data, mutate }: QuizQuestionInterface) {
  const trpc = useTRPC();
  const {
    data: details,
    isPending,
    isError,
    error,
  } = useQuery(
    trpc.admin.getTrueOrFalseQuestionDetails.queryOptions({
      quizQuestionId: data.id,
    }),
  );
  const [deleteQuestion, setDeleteQuestion] = useState(false);

  if (isPending) return <LoadingPlaceholder />;
  if (isError) return <ErrorPlaceholder message={error.message} />;

  return (
    !deleteQuestion && (
      <TrueOrFalseQuestion
        mutate={mutate}
        orderIndex={data.orderIndex}
        setDeleteQuestion={setDeleteQuestion}
        initialData={details}
      />
    )
  );
}

function MultipleChoiceQuestionCard({ data, mutate }: QuizQuestionInterface) {
  const trpc = useTRPC();
  const {
    data: details,
    isPending,
    isError,
  } = useQuery(
    trpc.admin.getMultipleChoiceQuestionDetails.queryOptions({
      quizQuestionId: data.id,
    }),
  );
  const [deleteQuestion, setDeleteQuestion] = useState(false);

  if (isPending) return <LoadingPlaceholder />;
  if (isError) return <ErrorPlaceholder />;

  return (
    !deleteQuestion && (
      <MultipleChoiceQuestionForm
        setDeleteQuestion={setDeleteQuestion}
        questionId={data.id}
        mutate={mutate}
        orderIndex={data.orderIndex}
        initialData={details}
      />
    )
  );
}

function MatchingPairQuestionCard({ data, mutate }: QuizQuestionInterface) {
  const trpc = useTRPC();
  const {
    data: details,
    isPending,
    isError,
    error,
  } = useQuery(
    trpc.admin.getMatchingQuestionDetails.queryOptions({
      quizQuestionId: data.id,
    }),
  );
  const [deleteQuestion, setDeleteQuestion] = useState(false);

  if (isPending) return <LoadingPlaceholder />;
  if (isError) return <ErrorPlaceholder message={error.message} />;

  return (
    !deleteQuestion && (
      <MatchingPairQuestion
        questionId={data.id}
        initialData={details}
        mutate={mutate}
        orderIndex={data.orderIndex}
        setDeleteQuestion={setDeleteQuestion}
      />
    )
  );
}

function OrderingQuestionCard({ data, mutate }: QuizQuestionInterface) {
  const trpc = useTRPC();
  const {
    data: details,
    isPending,
    isError,
  } = useQuery(
    trpc.admin.getOrderingQuestionDetails.queryOptions({
      quizQuestionId: data.id,
    }),
  );
  const [deleteQuestion, setDeleteQuestion] = useState(false);

  if (isPending) return <LoadingPlaceholder />;
  if (isError) return <ErrorPlaceholder />;

  return (
    !deleteQuestion && (
      <OrderingQuestion
        initialData={details}
        mutate={mutate}
        setDeleteQuestion={setDeleteQuestion}
        questionId={data.id}
        orderIndex={data.orderIndex}
      />
    )
  );
}

function EssayQuestionCard({ data, mutate }: QuizQuestionInterface) {
  const trpc = useTRPC();
  const {
    data: details,
    isPending,
    isError,
  } = useQuery(
    trpc.admin.getEssayQuestionDetails.queryOptions({ id: data.id }),
  );
  const [deleteQuestion, setDeleteQuestion] = useState(false);

  if (isPending) return <LoadingPlaceholder />;
  if (isError) return <ErrorPlaceholder />;

  return (
    !deleteQuestion && (
      <EssayQuestion
        initialData={details}
        setDeleteQuestion={setDeleteQuestion}
        orderIndex={data.orderIndex}
        mutate={mutate}
      />
    )
  );
}

// ==========================================
// 4. MAIN COMPONENT
// ==========================================

export default function CreateQuiz({ quizId }: { quizId: number }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const SettingSchema = z.object({
    name: z.string().min(1, "Quiz name is required"),
    description: z.string().optional(),
  });

  const {
    data,
    isLoading: isLoadingQuestions,
    isError,
  } = useQuery(trpc.admin.getQuizQuestions.queryOptions({ quizId }));

  const { data: quizDetails, isLoading: isLoadingDetails } = useSuspenseQuery(
    trpc.user.getQuizDetails.queryOptions({ quizId }),
  );

  const deleteMutation = useMutation(
    trpc.admin.deleteQuestion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getQuizQuestions.queryOptions({ quizId }),
        );
        toast.success("Question removed");
      },
    }),
  );

  const addMutation = useMutation(
    trpc.admin.addQuizQuestion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getQuizQuestions.queryOptions({ quizId }),
        );
        toast.success("Question added");
      },
    }),
  );

  const updateSettingsMutation = useMutation(
    trpc.user.updateQuizSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getQuizDetails.queryOptions({ quizId }),
        );
        toast.success("Settings saved!");
        setIsSettingsOpen(false);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = (values: z.infer<typeof SettingSchema>) => {
    updateSettingsMutation.mutate({
      quizId,
      data: values,
    });
  };

  // DnD Setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement to start drag, prevents accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id && data) {
      const oldIndex = data.findIndex((q) => q.id === active.id);
      const newIndex = data.findIndex((q) => q.id === over.id);

      const newOrder = arrayMove(data, oldIndex, newIndex);

      queryClient.setQueryData(
        trpc.admin.getQuizQuestions.queryKey({ quizId }),
        newOrder,
      );

      // TODO: Trigger backend save
      console.log(
        "New order:",
        newOrder.map((q) => q.id),
      );
    }
  }

  const totalPoints = data?.reduce((acc, q) => acc + (q.points || 0), 0) || 0;
  const questionCount = data?.length || 0;

  if (isLoadingQuestions || isLoadingDetails) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 md:px-10 md:py-5">
      {/* --- REFINED HEADER UI --- */}
      <div className="bg-background/80 backdrop-blur-lg border-b ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Side: Info & Stats */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Quiz Builder
              </h2>
              {questionCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>

            {/* Visual Stats Pills */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <ListChecks className="h-4 w-4" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {questionCount}
                </span>
                <span className="font-normal">Questions</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {totalPoints}
                </span>
                <span className="font-normal">Points</span>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              size="icon"
              className="hidden sm:flex"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <AddQuizButton
              count={questionCount}
              quizId={quizId}
              isPending={addMutation.isPending}
              onAdd={addMutation.mutate}
            />
          </div>
        </div>
      </div>

      {/* --- QUESTION LIST AREA --- */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoadingQuestions ? (
          <LoadingPlaceholder message="Loading questions..." />
        ) : isError ? (
          <ErrorPlaceholder message="Failed to load questions" />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data?.map((q) => q.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {data && data.length > 0 ? (
                  data.map((question, index) => (
                    <SortableQuestionWrapper
                      key={question.id}
                      id={question.id}
                      index={index}
                    >
                      <CardContent className="p-0 border-0 shadow-none bg-transparent">
                        {question.type === "multiple_choice" && (
                          <MultipleChoiceQuestionCard
                            data={question}
                            mutate={deleteMutation.mutate}
                          />
                        )}
                        {question.type === "true_false" && (
                          <TrueOrFalseQuestionCard
                            data={question}
                            mutate={deleteMutation.mutate}
                          />
                        )}
                        {question.type === "essay" && (
                          <EssayQuestionCard
                            data={question}
                            mutate={deleteMutation.mutate}
                          />
                        )}
                        {question.type === "ordering" && (
                          <OrderingQuestionCard
                            data={question}
                            mutate={deleteMutation.mutate}
                          />
                        )}
                        {question.type === "matching" && (
                          <MatchingPairQuestionCard
                            data={question}
                            mutate={deleteMutation.mutate}
                          />
                        )}
                      </CardContent>
                    </SortableQuestionWrapper>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-200 dark:bg-blue-900 rounded-full blur-3xl opacity-20 scale-150" />
                      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-full p-6 mb-6 border dark:border-slate-700">
                        <ListChecks className="h-10 w-10 text-slate-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      Start Building Your Quiz
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-2">
                      Click the &quot;Add Question&quot; button to create your
                      first question.
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <QuizSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialData={quizDetails}
        onSave={handleSaveSettings}
        isSaving={updateSettingsMutation.isPending}
      />
    </div>
  );
}

// ==========================================
// 5. UTILS & SUB-COMPONENTS
// ==========================================

function AddQuizButton({
  count,
  quizId,
  isPending,
  onAdd,
}: {
  count: number;
  quizId: number;
  isPending: boolean;
  onAdd: (opts: {
    quizId: number;
    questionType: QuizType;
    orderIndex: number;
  }) => void;
}) {
  const addQuestion = (type: QuizType) => {
    onAdd({ quizId, questionType: type, orderIndex: count });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/20"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {quizTypeEnum.enumValues.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => addQuestion(type)}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <ListChecks className="h-4 w-4" />
            </div>
            <span>{formatQuizType(type)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoadingPlaceholder({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p>{message}</p>
    </div>
  );
}

function ErrorPlaceholder({ message = "Error" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-destructive">
      <AlertCircle className="h-8 w-8" />
      <p>{message}</p>
    </div>
  );
}
