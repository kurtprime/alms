import { updateMultipleChoiceQuestionDetailsSchema } from "@/modules/admin/server/adminSchema";
import { useSortable } from "@dnd-kit/sortable";
import React, { useState } from "react";
import z from "zod";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, X } from "lucide-react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";

function SortableChoiceItem({
  id,
  children,
  ImageCropped,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
  ImageCropped?: React.ReactNode;
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
      <div className="grid grid-cols-[20px_1fr] items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className=" flex items-center cursor-grab active:cursor-grabbing h-full"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MultipleChoiceSortableChoiceItem({
  field,
  fields,
  index,
  form,
  remove,
}: {
  form: UseFormReturn<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  >;
  index: number;
  field: FieldArrayWithId<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>
  >;
  fields: FieldArrayWithId<
    z.infer<typeof updateMultipleChoiceQuestionDetailsSchema>,
    "multipleChoices",
    "id"
  >[];
  remove: (num1: number) => void;
}) {
  const [openCropImage, setOpenCropImag] = useState(false);

  const onCropComplete = (base64: string) => {
    console.log(base64);
    form.setValue(`multipleChoices.${index}.imageBase64Jpg`, base64, {
      shouldDirty: true,
    });

    setOpenCropImag(false);
  };

  return (
    <>
      <SortableChoiceItem id={field.id} index={index}>
        {/* Your existing form fields for each choice */}
        <div className="flex gap-4 items-center justify-stretch">
          <div className="relative -left-2 w-full">
            <Button
              variant={"ghost"}
              className="absolute"
              onClick={() => setOpenCropImag(true)}
            >
              <ImageIcon />
            </Button>
            <FormField
              control={form.control}
              name={`multipleChoices.${index}.optionText`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      className="w-full pl-10"
                      placeholder={`Enter option ${index + 1}...`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name={`multipleChoices.${index}.points`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    className="w-15"
                    min={0}
                    placeholder={"points"}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
                    checked={field.value ?? false}
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
                const currentDeleted = form.getValues("deletedChoiceIds") || [];
                form.setValue(
                  "deletedChoiceIds",
                  [...currentDeleted, choice.multipleChoiceId],
                  {
                    shouldDirty: true,
                  },
                );
              }
              remove(index);
            }}
            disabled={fields.length <= 2}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        {form.getValues(`multipleChoices.${index}.imageBase64Jpg`) && (
          <div className="col-span-full relative">
            <Button
              onClick={() => {
                form.setValue(`multipleChoices.${index}.imageBase64Jpg`, null, {
                  shouldDirty: true,
                });
              }}
              className="absolute right-10"
              variant={"ghost"}
            >
              <X />
              Remove Image
            </Button>
            <picture>
              <img
                className="max-h-50 mx-auto"
                src={
                  form.getValues(`multipleChoices.${index}.imageBase64Jpg`) ??
                  undefined
                }
                alt={"test"}
              />
            </picture>
          </div>
        )}
      </SortableChoiceItem>
      <ResponsiveDialog
        title="Image"
        description={"Question: " + field.optionText}
        className="min-w-[900px]"
        open={openCropImage}
        onOpenChange={setOpenCropImag}
      >
        <ImageCropper
          onCropComplete={(a) => {
            onCropComplete(a);
          }}
        />
      </ResponsiveDialog>
    </>
  );
}
