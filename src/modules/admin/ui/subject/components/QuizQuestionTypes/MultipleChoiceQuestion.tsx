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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CheckCircle,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import React from "react";
import {
  AdminGetMultipleChoiceQuizQuestions,
  updateMultipleChoiceQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useAutoSaveMultipleQuestion } from "../../hooks/use-auto-save";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import z from "zod";
import { getViewSelectedFields } from "drizzle-orm";

function SortableChoiceItem({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-2 flex items-center cursor-grab active:cursor-grabbing h-full"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </div>
    </div>
  );
}

interface AutoSaveQuestionFormProps {
  questionId: number;
  initialData: AdminGetMultipleChoiceQuizQuestions;
  orderIndex?: number;
}

export default function MultipleChoiceQuestionForm({
  questionId,
  initialData,
}: AutoSaveQuestionFormProps) {
  const form = useForm<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  >({
    resolver: zodResolver(updateMultipleChoiceQuestionDetailsSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 1,
      required: initialData?.required ?? false,
      multipleChoices: initialData?.multipleChoices ?? [],
      deletedChoiceIds: [],
    },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  //load existing data todo
  const { data: questionData, isLoading } = useQuery(
    trpc.admin.getMultipleChoiceQuestionDetails.queryOptions(
      { quizQuestionId: questionId },
      {
        enabled: !!questionId && !initialData,
        staleTime: Infinity,
      }
    )
  );

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "multipleChoices",
  });

  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  const { isSaving, error } = useAutoSaveMultipleQuestion({
    data: {
      ...formValues,
      deletedChoiceIds: formValues.deletedChoiceIds ?? [],
      id: initialData.id,
    } as z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>,
    interval: 1,
    enabled: isDirty,
    onError: (err) => {
      toast.error("Failed to auto-save changes.");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    // Update order in React Hook Form
    move(oldIndex, newIndex);

    // Update orderIndex values
    const choices = form.getValues("multipleChoices");
    choices.forEach((choice, index) => {
      form.setValue(`multipleChoices.${index}.orderIndex`, index);
    });

    // Mark form as dirty
    form.setValue("question", form.getValues("question"), {
      shouldDirty: true,
    });
  };

  const addChoice = () => {
    append({
      multipleChoiceId: `temp_${nanoid(8)}`,
      optionText: "",
      questionId,
      isCorrect: false,
      orderIndex: fields.length,
      feedback: "",
    });
  };

  const onSubmit = async (
    data: z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  ) => {
    // Manual save on explicit submit button click
    try {
      form.reset(data, { keepDirty: false });
    } catch {
      toast.error("Failed to save changes.");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full mx-auto px-3"
      >
        <div className="flex flex-row gap-4 justify-between items-center">
          <Badge className="text-sm h-8">
            Question {(initialData?.orderIndex ?? 0) + 1} - Multiple Choice
          </Badge>
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem className="mr-2">
                  <div className="space-y-0.5">
                    <FormLabel>Required Question</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Question Details */}
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Enter your question..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Answer Choices */}
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Answer Choices
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChoice}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Choice
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {fields.map((field, index) => (
                  <SortableChoiceItem
                    key={field.id}
                    id={field.id}
                    index={index}
                  >
                    {/* Your existing form fields for each choice */}
                    <div className="flex-1 flex gap-2 items-center justify-stretch">
                      <FormField
                        control={form.control}
                        name={`multipleChoices.${index}.optionText`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                className="w-full "
                                placeholder={`Enter option ${index + 1}...`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`multipleChoices.${index}.isCorrect`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              {field.value ? "Correct" : "Incorrect"}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value ?? undefined}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const choice = fields[index];

                          if (
                            choice.multipleChoiceId &&
                            !choice.multipleChoiceId.startsWith("temp_")
                          ) {
                            const currentDeleted =
                              form.getValues("deletedChoiceIds") || [];
                            form.setValue(
                              "deletedChoiceIds",
                              [...currentDeleted, choice.multipleChoiceId],
                              {
                                shouldDirty: true,
                              }
                            );
                          }
                          remove(index);
                        }}
                        disabled={fields.length <= 2}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </SortableChoiceItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={!isDirty}
          >
            Reset Changes
          </Button>
          <Button type="submit" disabled={!form.formState.isValid}>
            Save Question
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SaveStatusBadge({
  isSaving,
  isDirty,
  error,
}: {
  isSaving: boolean;
  isDirty: boolean;
  error: unknown;
}) {
  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Auto-save failed
      </Badge>
    );
  }

  if (isSaving) {
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1 animate-pulse"
      >
        <Save className="h-3 w-3 animate-spin" />
        Saving...
      </Badge>
    );
  }

  if (!isSaving && !isDirty) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-green-500" />
        All changes saved
      </Badge>
    );
  }

  return null;
}
