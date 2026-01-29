import { updateOrderingChoiceDetailSchema } from "@/modules/admin/server/adminSchema";
import React, { useState } from "react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import z from "zod";
import { SortableChoiceItem } from "./_MultipleChoiceSortableChoiceItem";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type OrderedQuestionData = z.infer<typeof updateOrderingChoiceDetailSchema>;
interface OrderedAnswerInterface {
  form: UseFormReturn<OrderedQuestionData>;
  index: number;
  field: FieldArrayWithId<OrderedQuestionData>;
  fields: FieldArrayWithId<OrderedQuestionData, "orderingOptions", "id">[];
  remove: (num1: number) => void;
}

export default function OrderedAnswersSortableItem({
  field,
  fields,
  index,
  form,
  remove,
}: OrderedAnswerInterface) {
  const [openCropImage, setOpenCropImag] = useState(false);

  const onCropComplete = (base64: string) => {
    form.setValue(`orderingOptions.${index}.imageBase64Jpg`, base64, {
      shouldDirty: true,
    });

    setOpenCropImag(false);
  };
  return (
    <>
      <SortableChoiceItem id={field.id} index={index}>
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
              name={`orderingOptions.${index}.itemText`}
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
            name={`orderingOptions.${index}.points`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    className="w-15"
                    min={1}
                    placeholder={"points"}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
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
                choice.orderingOptionId &&
                !choice.orderingOptionId.startsWith("temp_")
              ) {
                const currentDeleted = form.getValues("deletedChoiceIds") || [];
                form.setValue(
                  "deletedChoiceIds",
                  [...currentDeleted, choice.orderingOptionId],
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
        {form.getValues(`orderingOptions.${index}.imageBase64Jpg`) && (
          <div className="col-span-full relative">
            <Button
              onClick={() => {
                form.setValue(`orderingOptions.${index}.imageBase64Jpg`, null, {
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
                  form.getValues(`orderingOptions.${index}.imageBase64Jpg`) ??
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
        description={"Question: " + field.itemText}
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
