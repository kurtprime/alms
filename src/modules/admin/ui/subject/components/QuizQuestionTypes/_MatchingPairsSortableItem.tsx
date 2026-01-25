/* eslint-disable @next/next/no-img-element */
import { updateMatchingPairDetailSchema } from "@/modules/admin/server/adminSchema";
import React, { useState } from "react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import z from "zod";
import { SortableChoiceItem } from "./_MultipleChoiceSortableChoiceItem";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, GripVertical, ArrowLeftRight } from "lucide-react";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";

type MatchingPairData = z.infer<typeof updateMatchingPairDetailSchema>;

interface MatchingPairSortableItemInterface {
  field: FieldArrayWithId<MatchingPairData, "matchingOptions", "id">;
  fields: FieldArrayWithId<MatchingPairData, "matchingOptions", "id">[];
  index: number;
  form: UseFormReturn<MatchingPairData>;
  remove: (index: number) => void;
}

export default function MatchingPairsSortableItem({
  field,
  fields,
  index,
  form,
  remove,
}: MatchingPairSortableItemInterface) {
  const [openLeftCropImage, setOpenLeftCropImage] = useState(false);
  const [openRightCropImage, setOpenRightCropImage] = useState(false);

  const leftImage = form.getValues(
    `matchingOptions.${index}.leftImageBase64Jpg`,
  );
  const rightImage = form.getValues(
    `matchingOptions.${index}.rightImageBase64Jpg`,
  );

  const onLeftCropComplete = (base64: string) => {
    form.setValue(`matchingOptions.${index}.leftImageBase64Jpg`, base64, {
      shouldDirty: true,
    });
    setOpenLeftCropImage(false);
  };

  const onRightCropComplete = (base64: string) => {
    form.setValue(`matchingOptions.${index}.rightImageBase64Jpg`, base64, {
      shouldDirty: true,
    });
    setOpenRightCropImage(false);
  };

  const handleRemove = () => {
    const choice = fields[index];
    if (choice.matchingPairId && !choice.matchingPairId.startsWith("temp_")) {
      const currentDeleted = form.getValues("deletedChoiceIds") || [];
      form.setValue(
        "deletedChoiceIds",
        [...currentDeleted, choice.matchingPairId],
        {
          shouldDirty: true,
        },
      );
    }
    remove(index);
  };

  return (
    <>
      <SortableChoiceItem id={field.id} index={index}>
        <div className="flex items-start gap-3 w-full p-3 bg-muted/50 rounded-lg">
          {/* Drag Handle */}

          {/* Left Side - Input on top, Image below */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <FormField
              control={form.control}
              name={`matchingOptions.${index}.leftItem`}
              render={({ field: inputField }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder={`Left item ${index + 1}...`}
                      className="h-10"
                      {...inputField}
                      value={inputField.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {leftImage ? (
              <div
                className="relative mx-auto shrink-0 cursor-pointer group w-fit"
                onClick={() => setOpenLeftCropImage(true)}
              >
                <img
                  src={leftImage}
                  alt="Left"
                  className="max-h-50 rounded-md object-cover border"
                />
                <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    form.setValue(
                      `matchingOptions.${index}.leftImageBase64Jpg`,
                      null,
                      {
                        shouldDirty: true,
                      },
                    );
                  }}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive hover:bg-destructive/90 text-white rounded-full shadow-sm"
                  variant="ghost"
                  size="icon"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit h-8 px-3 text-xs"
                onClick={() => setOpenLeftCropImage(true)}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Add Image
              </Button>
            )}
          </div>

          {/* Connection Arrow - Centered vertically */}
          <div className="flex items-center justify-center h-10 mt-0">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>

          {/* Right Side - Input on top, Image below */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <FormField
              control={form.control}
              name={`matchingOptions.${index}.rightItem`}
              render={({ field: inputField }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder={`Right item ${index + 1}...`}
                      className="h-10"
                      {...inputField}
                      value={inputField.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {rightImage ? (
              <div
                className="relative mx-auto shrink-0 cursor-pointer group w-fit"
                onClick={() => setOpenRightCropImage(true)}
              >
                <img
                  src={rightImage}
                  alt="Right"
                  className="max-h-50 rounded-md object-cover border"
                />
                <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    form.setValue(
                      `matchingOptions.${index}.rightImageBase64Jpg`,
                      null,
                      {
                        shouldDirty: true,
                      },
                    );
                  }}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive hover:bg-destructive/90 text-white rounded-full shadow-sm"
                  variant="ghost"
                  size="icon"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit h-8 px-3 text-xs"
                onClick={() => setOpenRightCropImage(true)}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Add Image
              </Button>
            )}
          </div>

          {/* Points */}
          <FormField
            control={form.control}
            name={`matchingOptions.${index}.points`}
            render={({ field: pointsField }) => (
              <FormItem className="w-20 shrink-0">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Pts"
                    className="h-10 text-center"
                    {...pointsField}
                    onChange={(e) =>
                      pointsField.onChange(Number(e.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Delete */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-destructive hover:text-destructive mt-0"
            onClick={handleRemove}
            disabled={fields.length <= 2}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </SortableChoiceItem>

      {/* Left Image Cropper Dialog */}
      <ResponsiveDialog
        title="Left Item Image"
        description="Crop image for left side"
        className="min-w-[900px]"
        open={openLeftCropImage}
        onOpenChange={setOpenLeftCropImage}
      >
        <ImageCropper onCropComplete={onLeftCropComplete} />
      </ResponsiveDialog>

      {/* Right Image Cropper Dialog */}
      <ResponsiveDialog
        title="Right Item Image"
        description="Crop image for right side"
        className="min-w-[900px]"
        open={openRightCropImage}
        onOpenChange={setOpenRightCropImage}
      >
        <ImageCropper onCropComplete={onRightCropComplete} />
      </ResponsiveDialog>
    </>
  );
}
