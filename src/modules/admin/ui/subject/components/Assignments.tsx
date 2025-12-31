import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedCallback } from "use-debounce";
import {
  Loader2,
  Check,
  Info,
  RotateCcw,
  Clock,
  CalendarIcon,
} from "lucide-react";
import {
  format,
  set,
  getHours,
  getMinutes,
  intervalToDuration,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

// Define your schema here or import it
import {
  AdminGetQuizSettings,
  updateQuizSettingsFormSchema,
} from "@/modules/admin/server/adminSchema";
import z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { start } from "repl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Assignments() {
  const trpc = useTRPC();
  const [lessonTypeParams] = useLessonTypeParams();
  const { data, isPending, isError } = useQuery(
    trpc.admin.getQuizSettings.queryOptions({
      lessonTypeId: lessonTypeParams.id,
    })
  );

  if (isError) {
    return <div className="p-4">Error loading quiz settings.</div>;
  }

  return (
    <div className="bg-background flex flex-col justify-stretch items-stretch w-full min-h-[calc(100vh-110px)]">
      {isPending ? (
        <QuizSettingsSkeleton />
      ) : (
        <AssignmentHeader data={data} lessonTypeId={lessonTypeParams.id} />
      )}
      <Separator />
    </div>
  );
}

function AssignmentHeader({
  data,
  lessonTypeId,
}: {
  data?: AdminGetQuizSettings;
  lessonTypeId?: number;
}) {
  const [saveStatus, setSaveStatus] = useState<"syncing" | "synced" | "error">(
    "synced"
  );
  const isInitialMount = useRef(true);
  const [lessonTypeParams] = useLessonTypeParams();

  const form = useForm({
    resolver: zodResolver(updateQuizSettingsFormSchema),
    defaultValues: {
      description: data?.description ?? "",
      timeLimit: data?.timeLimit ?? 30,
      attemptsAllowed: data?.maxAttempts ?? 3,
      isShuffleQuestions: data?.shuffleQuestions ?? true,
      isShowCorrectAnswers: data?.showCorrectAnswers ?? false,
      isShowScoreAfterSubmission: data?.showScoreAfterSubmission ?? false,
      startDate: data?.startDate ? data.startDate : undefined,
      endDate: data?.endDate ? data.endDate : undefined,
    },
  });

  const trpc = useTRPC();

  const updateQuizSettingsMutation = useMutation(
    trpc.admin.updateQuizSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Quiz settings updated successfully");
      },
      onError: (error) => {
        console.error("Update quiz settings failed:", error);
        setSaveStatus("error");
      },
    })
  );

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback(
    async (values: z.infer<typeof updateQuizSettingsFormSchema>) => {
      setSaveStatus("syncing");
      // Simulate API call
      await updateQuizSettingsMutation.mutateAsync({
        ...values,
        lessonTypeId: lessonTypeParams.id,
      });

      console.log("Auto-saved:", values);
      setSaveStatus("synced");

      // Reset dirty state after successful save
      form.reset(values, { keepDefaultValues: false });

      setTimeout(() => setSaveStatus("synced"), 2000);
    },
    2000 // Wait 2 second after last change
  );

  // Watch for changes and trigger debounced save
  const watchedValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (form.formState.isDirty) {
      debouncedSave(
        watchedValues as z.infer<typeof updateQuizSettingsFormSchema>
      );
    }
  }, [watchedValues, form.formState.isDirty, debouncedSave]);

  const onSubmit = async (
    values: z.infer<typeof updateQuizSettingsFormSchema>
  ) => {
    setSaveStatus("syncing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("Form submitted:", values);
      setSaveStatus("synced");
      form.reset(values);
      setTimeout(() => setSaveStatus("synced"), 2000);
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card border-b sticky top-0 z-10 shadow-sm"
      >
        {/* Top Row: Title & Primary Actions */}
        <Separator />

        {/* Save Status Indicator */}
        <div className="px-4 py-2 border-b flex items-center justify-end gap-2 text-sm">
          {saveStatus === "syncing" && (
            <span className="text-blue-600 flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </span>
          )}
          {saveStatus === "synced" && (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Synced
            </span>
          )}
        </div>

        {/* Bottom Row: Configuration */}
        <div className="flex flex-wrap justify-evenly items-start gap-6 p-4">
          {/* Duration */}
          <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Time Limit
                </Label>
                <Popover>
                  <PopoverTrigger onChange={field.onChange} asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-32 justify-start"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {field.value === 0 ? "No limit" : `${field.value} min`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-2">
                    <div className="grid gap-1">
                      {[15, 30, 45, 60, 90, 120].map((min) => (
                        <Button
                          key={min}
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(min)}
                          className={field.value === min ? "bg-accent" : ""}
                        >
                          {min} min
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange(0)}
                        className={field.value === 0 ? "bg-accent" : ""}
                      >
                        No limit
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          {/* Max Attempts */}
          <FormField
            control={form.control}
            name="attemptsAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Attempts
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-32 justify-start"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {field.value === 99
                        ? "Unlimited"
                        : `${field.value} attempts`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-2">
                    <div className="grid gap-1">
                      {[1, 2, 3, 5, 10, 99].map((attempts) => (
                        <Button
                          key={attempts}
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(attempts)}
                          className={
                            field.value === attempts ? "bg-accent" : ""
                          }
                        >
                          {attempts === 99
                            ? "Unlimited"
                            : `${attempts} attempts`}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          {/* Shuffle Toggle */}
          <FormField
            control={form.control}
            name="isShuffleQuestions"
            render={({ field }) => (
              <FormItem className="flex flex-col  gap-4">
                <Label
                  htmlFor="shuffle"
                  className="text-xs text-muted-foreground"
                >
                  Shuffle Questions
                </Label>
                <div className="flex gap-2 items-center">
                  <FormControl>
                    <Switch
                      id="shuffle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <HoverCard openDelay={500}>
                    <HoverCardTrigger>
                      <Info className="size-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-sm">
                      Questions will appear in random order for each student.
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </FormItem>
            )}
          />

          {/* Show Answers Toggle */}
          <FormField
            control={form.control}
            name="isShowCorrectAnswers"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-4">
                <Label
                  htmlFor="showAnswers"
                  className="text-xs text-muted-foreground"
                >
                  Show Answers
                </Label>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      id="showAnswers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <HoverCard openDelay={500}>
                    <HoverCardTrigger>
                      <Info className="size-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-sm">
                      After a student submits the quiz, they will be able to see
                      the correct answers for each question.
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </FormItem>
            )}
          />

          {/* Show Score Toggle */}
          <FormField
            control={form.control}
            name="isShowScoreAfterSubmission"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-4">
                <Label
                  htmlFor="showScore"
                  className="text-xs text-muted-foreground"
                >
                  Show Score
                </Label>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      id="showScore"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <HoverCard openDelay={500}>
                    <HoverCardTrigger>
                      <Info className="size-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-sm">
                      After a student submits the quiz, they will be able to see
                      their score for each question.
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </FormItem>
            )}
          />

          {/* Date Range */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field: startField }) => (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field: endField }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-xs text-muted-foreground">
                      Set Due Date
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="justify-start gap-2 min-w-[200px]"
                            >
                              <CalendarIcon className="h-4 w-4 shrink-0" />
                              {startField.value ? (
                                <div className="flex items-center gap-2 flex-1">
                                  {/* Start Date */}
                                  <span className="text-sm">
                                    {format(
                                      startField.value as Date,
                                      "MMM d, h:mm a"
                                    )}
                                  </span>

                                  {/* Duration Badge (only if end date exists) */}
                                  {endField.value && (
                                    <>
                                      <span className="text-muted-foreground">
                                        →
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="font-mono text-xs font-medium"
                                      >
                                        {formatDurationBadge(
                                          startField.value as Date,
                                          endField.value as Date
                                        )}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(
                                          endField.value as Date,
                                          "MMM d, h:mm a"
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No Due Date
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4">
                            <div className="flex flex-col">
                              <Calendar
                                mode="range"
                                selected={
                                  startField.value && endField.value
                                    ? {
                                        from: new Date(startField.value),
                                        to: new Date(endField.value),
                                      }
                                    : undefined
                                }
                                onSelect={(date) => {
                                  startField.onChange(date?.from);
                                  endField.onChange(date?.to);
                                }}
                              />
                              <div className="flex justify-evenly">
                                {startField.value != undefined && (
                                  <div>
                                    <Label className="text-xs">
                                      Start Time
                                    </Label>
                                    <Input
                                      type="time"
                                      id="start-time-picker"
                                      step="60"
                                      value={format(
                                        startField.value as Date,
                                        "HH:mm"
                                      )}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value
                                          .split(":")
                                          .map(Number);
                                        startField.onChange(
                                          set(startField.value!, {
                                            hours,
                                            minutes,
                                          })
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                                {endField.value != undefined && (
                                  <div>
                                    <Label className="text-xs">End Time</Label>
                                    <Input
                                      type="time"
                                      id="start-time-picker"
                                      step="60"
                                      value={format(
                                        endField.value as Date,
                                        "HH:mm"
                                      )}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value
                                          .split(":")
                                          .map(Number);
                                        endField.onChange(
                                          set(endField.value!, {
                                            hours,
                                            minutes,
                                          })
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            )}
          />
          {/* Submit Button */}
        </div>
      </form>
    </Form>
  );
}
const formatDurationBadge = (start?: Date, end?: Date) => {
  if (!start || !end) return null;

  const duration = intervalToDuration({ start, end });
  const days = duration.days || 0;
  const hours = duration.hours || 0;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return "<1h";
};

export function QuizSettingsSkeleton() {
  return (
    <div className="bg-card border-b sticky top-0 z-10 shadow-sm p-0">
      {/* Save Status Indicator Skeleton */}
      <Separator />
      <div className="px-4 py-2 border-b flex items-center justify-end gap-2 text-sm">
        <Skeleton className="h-4 w-20 bg-muted-foreground" />
      </div>

      {/* Configuration Row Skeleton */}
      <div className="flex flex-wrap justify-evenly items-start gap-6 p-4">
        {/* Duration Skeleton */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16 bg-muted-foreground" />
          <Skeleton className="w-32 h-9 rounded-md bg-muted-foreground" />
        </div>

        {/* Max Attempts Skeleton */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16 bg-muted-foreground" />
          <Skeleton className="w-32 h-9 rounded-md bg-muted-foreground" />
        </div>

        {/* Shuffle Questions Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-32 bg-muted-foreground" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-5 rounded-full bg-muted-foreground" />
            <Skeleton className="w-4 h-4 rounded-full bg-muted-foreground" />
          </div>
        </div>

        {/* Show Answers Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24 bg-muted-foreground" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-5 rounded-full bg-muted-foreground" />
            <Skeleton className="w-4 h-4 rounded-full bg-muted-foreground" />
          </div>
        </div>

        {/* Show Score Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-20 bg-muted-foreground" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-5 rounded-full bg-muted-foreground" />
            <Skeleton className="w-4 h-4 rounded-full bg-muted-foreground" />
          </div>
        </div>

        {/* Date Range Skeleton */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20 bg-muted-foreground" />
          <Skeleton className="w-48 h-9 rounded-md bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
