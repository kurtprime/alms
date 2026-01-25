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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertCircle,
  CheckCircle,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import {
  AdminGetMultipleChoiceQuizQuestions,
  updateMultipleChoiceQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { Label } from "@/components/ui/label";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";
import z from "zod";
import MultipleChoiceSortableChoiceItem from "./_MultipleChoiceSortableChoiceItem";
import { parseErrorMessage } from "../../hooks/parseErrorMessage";

interface AutoSaveQuestionFormProps {
  questionId: number;
  initialData: AdminGetMultipleChoiceQuizQuestions;
  orderIndex?: number;
  setDeleteQuestion: (arg: boolean) => void;
  mutate: ({ id }: { id: number }) => void;
}

export default function MultipleChoiceQuestionForm({
  questionId,
  initialData,
  setDeleteQuestion,
  orderIndex,
  mutate: deleteQuestion,
}: AutoSaveQuestionFormProps) {
  const form = useForm<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  >({
    resolver: zodResolver(updateMultipleChoiceQuestionDetailsSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 1,
      required: initialData?.required ?? false,
      imageBase64: initialData?.imageBase64Jpg ?? undefined,
      multipleChoices:
        initialData?.multipleChoices.length === 0
          ? [
              {
                multipleChoiceId: `temp_${nanoid(8)}`,
                optionText: "",
                questionId,
                isCorrect: true,
                orderIndex: 0,
                feedback: "",
                points: 1,
                imageBase64Jpg: null,
              },
              {
                multipleChoiceId: `temp_${nanoid(8)}`,
                optionText: "",
                questionId,
                isCorrect: false,
                orderIndex: 1,
                feedback: "",
                points: 0,
                imageBase64Jpg: null,
              },
            ]
          : initialData?.multipleChoices,
      deletedChoiceIds: [],
    },
  });

  const [openCropImage, setOpenCropImag] = useState(false);

  const { fields, append, remove, move } = useFieldArray<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  >({
    control: form.control,
    name: "multipleChoices",
  });

  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;
  function compute() {
    const choices = form.getValues("multipleChoices");
    const totalPoints = choices.reduce(
      (acc, choice) => acc + (Number(choice.points) || 0),
      0,
    );

    return totalPoints;
  }
  const { isSaving, errorMessage } = useAutoSaveMultipleQuestion({
    data: {
      ...formValues,
      deletedChoiceIds: formValues.deletedChoiceIds ?? [],
      points: compute(),
      id: initialData.id,
    } as z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>,
    interval: 1,
    enabled: isDirty,
    onError: (e) => {
      toast.error(e);
    },
    onSuccess: (insertedChoices) => {
      if (insertedChoices.length > 0) {
        const currentChoices = form.getValues("multipleChoices");

        // Replace temp IDs with real IDs
        const updatedChoices = currentChoices.map((choice) => {
          const mapping = insertedChoices.find(
            (m) => m.tempId === choice.multipleChoiceId,
          );
          return mapping
            ? { ...choice, multipleChoiceId: mapping.realId }
            : choice;
        });
        console.log("Updated Choices", updatedChoices);
        // Update form without marking as dirty
        form.setValue("multipleChoices", updatedChoices, {
          shouldDirty: false,
        });
      }

      // ✅ Clear deleted IDs
      form.setValue("deletedChoiceIds", [], { shouldDirty: false });
      form.reset(form.getValues(), {
        keepValues: true,
        keepDirty: false,
      });
    },
  });

  const onCropComplete = (baseImage64: string) => {
    form.setValue("imageBase64", baseImage64, {
      shouldDirty: true,
    });
    console.log(baseImage64);
    setOpenCropImag(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    console.log("ADD CHOICE", fields);
    append({
      multipleChoiceId: `temp_${nanoid(8)}`,
      optionText: "",
      questionId,
      isCorrect: false,
      orderIndex: fields.length,
      feedback: "",
      points: 0,
      imageBase64Jpg: null,
    });
  };

  const onSubmit = async (
    data: z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>,
  ) => {
    console.log(data);
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full mx-auto px-5"
        >
          <div className="flex flex-row  gap-4 justify-between items-center">
            <Badge className="text-sm h-8">
              Question {(orderIndex ?? 0) + 1} - Multiple Choice
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

              <div className="flex flex-col gap-2">
                <Label>Total Points</Label>
                <span>{compute()}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-5"
                onClick={() => {
                  deleteQuestion({ id: initialData.id });
                  setDeleteQuestion(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          {/* Question Details */}
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <Button
                    className="w-10 absolute"
                    variant={"ghost"}
                    onClick={() => setOpenCropImag(true)}
                  >
                    <ImageIcon />
                  </Button>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your question..."
                      className="min-h-[30px] pl-10"
                      {...field}
                    />
                  </FormControl>
                </div>

                {form.getValues("imageBase64") && (
                  <picture className="relative">
                    <Button
                      className="absolute right-0 w-auto"
                      variant={"outline"}
                      onClick={() => {
                        form.setValue("imageBase64", null, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <X />
                      Remove Image
                    </Button>
                    <img
                      className="max-h-50 mx-auto"
                      src={form.getValues("imageBase64") ?? undefined}
                      alt="Question Image"
                    />
                  </picture>
                )}
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
          <CardContent className="p-0">
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
                  {fields.map((field, index) => {
                    return (
                      <MultipleChoiceSortableChoiceItem
                        key={field.id}
                        field={field}
                        fields={fields}
                        index={index}
                        form={form}
                        remove={remove}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>

          <div className="flex justify-end">
            <SaveStatusBadge
              isSaving={isSaving}
              isDirty={isDirty}
              error={errorMessage}
            />
          </div>
        </form>
      </Form>
      <ResponsiveDialog
        title="Image"
        description=""
        className="min-w-[900px]"
        open={openCropImage}
        onOpenChange={setOpenCropImag}
      >
        <ImageCropper onCropComplete={(a) => onCropComplete(a)} />
      </ResponsiveDialog>
    </>
  );
}

interface SaveStatusBadgeProps {
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
}

export function SaveStatusBadge({
  isSaving,
  error,
  isDirty,
}: SaveStatusBadgeProps) {
  if (error) {
    const readableError = parseErrorMessage(error);

    return (
      <Badge
        variant="destructive"
        className="flex items-center gap-1 max-w-[300px] truncate"
        title={readableError} // Show full error on hover
      >
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">Auto-save failed: {readableError}</span>
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

  if (isDirty) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-yellow-500" />
        Unsaved changes
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3 text-green-500" />
      All changes saved
    </Badge>
  );
}
