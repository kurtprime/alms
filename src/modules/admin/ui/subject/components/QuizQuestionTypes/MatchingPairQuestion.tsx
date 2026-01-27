import {
  AdminGetMatchingPairQuestion,
  updateMatchingPairDetailSchema,
} from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import React, { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { useAutoSaveMatchingPairQuestion } from "../../hooks/use-auto-save";
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
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";
import { SaveStatusBadge } from "./MultipleChoiceQuestion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MatchingPairsSortableItem from "./_MatchingPairsSortableItem";

interface OrderingQuestionInterface {
  questionId: number;
  initialData: AdminGetMatchingPairQuestion;
  orderIndex: number;
  setDeleteQuestion: (arg: boolean) => void;
  mutate: ({ id }: { id: number }) => void;
}

type MatchingPairData = z.infer<typeof updateMatchingPairDetailSchema>;

export default function MatchingPairQuestion({
  questionId,
  initialData,
  setDeleteQuestion,
  orderIndex,
  mutate: deleteQuestion,
}: OrderingQuestionInterface) {
  const form = useForm<MatchingPairData>({
    resolver: zodResolver(updateMatchingPairDetailSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 1,
      required: initialData?.required ?? false,
      imageBase64Jpg: initialData?.imageBase64Jpg ?? undefined,
      deletedChoiceIds: [],
      matchingOptions:
        initialData?.matchingOptions.length === 0
          ? [
              {
                matchingPairId: `temp_${nanoid(8)}`,
                leftItem: "",
                rightItem: "",
                questionId,
                orderIndex: 0,
                points: 1,
                leftImageBase64Jpg: null,
                rightImageBase64Jpg: null,
              },
              {
                matchingPairId: `temp_${nanoid(8)}`,
                leftItem: "",
                rightItem: "",
                questionId,
                orderIndex: 1,
                points: 1,
                leftImageBase64Jpg: null,
                rightImageBase64Jpg: null,
              },
            ]
          : initialData?.matchingOptions,
    },
  });
  const [openCropImage, setOpenCropImag] = useState(false);

  const { fields, append, remove, move } = useFieldArray<MatchingPairData>({
    control: form.control,
    name: "matchingOptions",
  });
  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  function compute() {
    const choices = form.getValues("matchingOptions");
    const totalPoints = choices.reduce(
      (acc, choice) => acc + (Number(choice.points) || 0),
      0,
    );
    return totalPoints;
  }

  const { isSaving, errorMessage } = useAutoSaveMatchingPairQuestion({
    data: {
      ...formValues,
      points: compute(),
      id: initialData.id,
    } as MatchingPairData,
    onError: (e) => {
      toast.error(e);
    },
    onSuccess: (insertedChoices) => {
      if (insertedChoices.length > 0) {
        const currentChoices = form.getValues("matchingOptions");

        const updatedChoices = currentChoices.map((choice) => {
          const mapping = insertedChoices.find(
            (m) => m.tempId === choice.matchingPairId,
          );
          return mapping
            ? { ...choice, matchingPairId: mapping.realId }
            : choice;
        });

        // Update form without marking as dirty
        form.setValue("matchingOptions", updatedChoices, {
          shouldDirty: false,
        });
      }
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
    const choices = form.getValues("matchingOptions");
    choices.forEach((choice, index) => {
      form.setValue(`matchingOptions.${index}.orderIndex`, index);
    });

    // Mark form as dirty
    form.setValue("question", form.getValues("question"), {
      shouldDirty: true,
    });
  };

  const addMatchingPairs = () => {
    append({
      matchingPairId: `temp_${nanoid(8)}`,
      questionId,
      leftItem: "",
      rightItem: "",
      orderIndex: fields.length,
      points: 1,
      leftImageBase64Jpg: null,
      rightImageBase64Jpg: null,
    });
  };
  const onSubmit = async (data: MatchingPairData) => {};

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-6 w-full mx-auto px-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-row  gap-4 justify-between items-center">
            <Badge className="text-sm h-8">
              Question {(orderIndex ?? 0) + 1} - Matching
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
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Answer Choices
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMatchingPairs}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Matching Pairs
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
                  {fields
                    .filter((e) => e.orderIndex != null)
                    .map((field, index) => {
                      return (
                        <MatchingPairsSortableItem
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
