import {
  AdminGetTrueOrFalseQuizQuestions,
  updateTrueOrFalseQuestionDetailsSchema,
} from "@/modules/admin/server/adminSchema";
import React, { useState } from "react";
import { useAutoSaveTrueOrFalseQuestion } from "../../hooks/use-auto-save";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SaveStatusBadge } from "./MultipleChoiceQuestion";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";

interface TrueOrFalseQuestionInterface {
  initialData: AdminGetTrueOrFalseQuizQuestions;
  setDeleteQuestion: (arg: boolean) => void;
  mutate: ({ id }: { id: number }) => void;
}

export default function TrueOrFalseQuestion({
  initialData,
  setDeleteQuestion,
  mutate: deleteQuestion,
}: TrueOrFalseQuestionInterface) {
  const form = useForm<z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>>({
    resolver: zodResolver(updateTrueOrFalseQuestionDetailsSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 1,
      required: initialData?.required ?? true,
      correctBoolean: initialData?.correctBoolean ?? false,
      imageBase64Jpg: initialData?.imageBase64Jpg ?? undefined,
    },
  });

  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  const [openCropImage, setOpenCropImag] = useState(false);
  const onCropComplete = (baseImage64: string) => {
    form.setValue("imageBase64Jpg", baseImage64, {
      shouldDirty: true,
    });
    console.log(baseImage64);
    setOpenCropImag(false);
  };
  const { isSaving, errorMessage } = useAutoSaveTrueOrFalseQuestion({
    data: {
      ...formValues,
      id: initialData.id,
    } as z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>,
    enabled: isDirty,
    onError: (e) => toast.error(e),
    onSuccess: () => {
      form.reset(form.getValues(), {
        keepValues: true,
        keepDirty: false,
      });
    },
  });

  function onSubmit(
    data: z.infer<typeof updateTrueOrFalseQuestionDetailsSchema>,
  ) {
    console.log(data);
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-6 w-full mx-auto px-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-row  gap-4 justify-between items-center">
            <Badge className="text-sm h-8">
              Question {(initialData?.orderIndex ?? 0) + 1} - True or False
            </Badge>
            <div className="flex gap-4 ">
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
                  <FormItem className="mr-2">
                    <div className="space-y-0.5">
                      <FormLabel>Points</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        min={1}
                        className="w-15"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-5 self-center"
                onClick={() => {
                  deleteQuestion({ id: initialData.id });
                  setDeleteQuestion(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
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
          <FormField
            control={form.control}
            name="correctBoolean"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-row gap-2">
                  <Button
                    type="button"
                    variant={field.value === true ? "secondary" : "outline"}
                    onClick={() => {
                      field.onChange(true);
                    }}
                    className="flex-1"
                  >
                    True
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === false ? "secondary" : "outline"}
                    onClick={() => field.onChange(false)}
                    className="flex-1"
                  >
                    False
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
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
