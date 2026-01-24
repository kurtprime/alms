import {
  AdminGetOrderingQuizQuestion,
  updateOrderingChoiceDetailSchema,
} from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import React, { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { useAutoSaveOrderingQuestion } from "../../hooks/use-auto-save";
import { toast } from "sonner";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SaveStatusBadge } from "./MultipleChoiceQuestion";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderedAnswersSortableItem from "./_OrderedAnswersSortableItem";

interface OrderingQuestionInterface {
  questionId: number;
  initialData: AdminGetOrderingQuizQuestion;
  orderIndex?: number;
  setDeleteQuestion: (arg: boolean) => void;
  mutate: ({ id }: { id: number }) => void;
}

export default function OrderingQuestion({
  questionId,
  initialData,
  orderIndex,
  setDeleteQuestion,
  mutate: deleteQuestion,
}: OrderingQuestionInterface) {
  type OrderingQuestionData = z.infer<typeof updateOrderingChoiceDetailSchema>;

  const form = useForm<OrderingQuestionData>({
    resolver: zodResolver(updateOrderingChoiceDetailSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 1,
      required: initialData?.required ?? false,
      imageBase64Jpg: initialData?.imageBase64Jpg ?? undefined,
      orderingOptions:
        initialData?.orderingOptions.length === 0
          ? [
              {
                orderingOptionId: `temp_${nanoid(8)}`,
                itemText: "",
                questionId,
                correctPosition: 0,
                points: 1,
                imageBase64Jpg: null,
              },
              {
                orderingOptionId: `temp_${nanoid(8)}`,
                itemText: "",
                questionId,
                correctPosition: 1,
                points: 1,
                imageBase64Jpg: null,
              },
            ]
          : initialData?.orderingOptions,
      deletedChoiceIds: [],
    },
  });

  const [openCropImage, setOpenCropImag] = useState(false);

  const { fields, append, remove, move } = useFieldArray<OrderingQuestionData>({
    control: form.control,
    name: "orderingOptions",
  });

  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  //computes for the total points of the ordering question
  function compute() {
    const choices = form.getValues("orderingOptions");
    const totalPoints = choices.reduce(
      (acc, choice) => acc + (Number(choice.points) || 0),
      0,
    );

    return totalPoints;
  }

  const { isSaving, errorMessage } = useAutoSaveOrderingQuestion({
    data: {
      ...formValues,
      points: compute(),
      id: initialData.id,
    } as OrderingQuestionData,
    interval: 1,
    enabled: isDirty,
    onError: (e) => {
      toast.error(e);
    },

    onSuccess: (insertedChoices) => {
      if (insertedChoices.length > 0) {
        const currentChoices = form.getValues("orderingOptions");

        // Replace temp IDs with real IDs
        const updatedChoices = currentChoices.map((choice) => {
          const mapping = insertedChoices.find(
            (m) => m.tempId === choice.orderingOptionId,
          );
          return mapping
            ? { ...choice, orderingOptionId: mapping.realId }
            : choice;
        });

        // Update form without marking as dirty
        form.setValue("orderingOptions", updatedChoices, {
          shouldDirty: false,
        });
        console.log("Success: ", updatedChoices);
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
    form.setValue("imageBase64Jpg", baseImage64, {
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
    const choices = form.getValues("orderingOptions");
    choices.forEach((choice, index) => {
      form.setValue(`orderingOptions.${index}.correctPosition`, index);
    });

    // Mark form as dirty
    form.setValue("question", form.getValues("question"), {
      shouldDirty: true,
    });
  };
  const addChoice = () => {
    console.log("ADD CHOICE", fields);
    append({
      orderingOptionId: `temp_${nanoid(8)}`,
      itemText: "",
      questionId,
      correctPosition: fields.length,
      points: 1,
      imageBase64Jpg: null,
    });
  };

  const onSubmit = async (data: OrderingQuestionData) => {
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
              Question {(initialData?.orderIndex ?? 0) + 1} - Ordering
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

                {form.getValues("imageBase64Jpg") && (
                  <picture className="relative">
                    <Button
                      className="absolute right-0 w-auto"
                      variant={"outline"}
                      onClick={() => {
                        form.setValue("imageBase64Jpg", null, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <X />
                      Remove Image
                    </Button>
                    <img
                      className="max-h-50 mx-auto"
                      src={form.getValues("imageBase64Jpg") ?? undefined}
                      alt="Question Image"
                    />
                  </picture>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Order of answers */}
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
                      <OrderedAnswersSortableItem
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
              error={errorMessage ?? ""}
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
