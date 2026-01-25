import {
  AdminGetEssayQuizQuestion,
  updateEssayQuestionDetailSchema,
} from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { useAutoSaveEssayQuestion } from "../../hooks/use-auto-save";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon, InfoIcon, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ResponsiveDialog from "@/components/responsive-dialog";
import { ImageCropper } from "@/components/image-cropper";
import { SaveStatusBadge } from "./MultipleChoiceQuestion";

interface EssayQuestionInterface {
  initialData: AdminGetEssayQuizQuestion;
  setDeleteQuestion: (arg: boolean) => void;
  mutate: ({ id }: { id: number }) => void;
  orderIndex: number;
}

export default function EssayQuestion({
  initialData,
  setDeleteQuestion,
  orderIndex,
  mutate: deleteQuestion,
}: EssayQuestionInterface) {
  type EssayData = z.infer<typeof updateEssayQuestionDetailSchema>;
  const form = useForm<EssayData>({
    resolver: zodResolver(updateEssayQuestionDetailSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      points: initialData?.points ?? 5,
      required: initialData?.required ?? true,
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
  const { isSaving, errorMessage } = useAutoSaveEssayQuestion({
    data: {
      ...formValues,
      id: initialData.id,
    } as EssayData,
    enabled: isDirty,
    onError: (e) => toast.error(e),
    onSuccess: () => {
      form.reset(form.getValues(), {
        keepValues: true,
        keepDirty: false,
      });
    },
  });
  function onSubmit(data: EssayData) {
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
            <span className="flex gap-2 items-center">
              <Badge className="text-sm h-8">
                Question {(orderIndex ?? 0) + 1} - Essay
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"} className="rounded-full size-6">
                    <InfoIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background text-muted-foreground p-3">
                  <p>Essay questions require manual scoring</p>
                </TooltipContent>
              </Tooltip>
            </span>

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
