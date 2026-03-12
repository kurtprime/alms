"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // For redirection
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronsUpDown,
  Plus,
  FileText,
  ExternalLink,
  Trophy,
  ListChecks,
  Loader2,
  X,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

// ============================================
// COMPONENT
// ============================================
interface QuizSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  classId: string;
  lessonTypeId: number; // Added: Needed to link the quiz
}

export function QuizSelector({
  value,
  onChange,
  classId,
  lessonTypeId,
}: QuizSelectorProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // --- Queries ---
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery(
    trpc.admin.getQuizzesOptions.queryOptions(),
  );

  // --- Mutations ---
  const createMutation = useMutation(
    trpc.user.createNewQuiz.mutationOptions({
      onSuccess: (data) => {
        toast.success("Quiz created!");
        // Update the form value to the new quiz ID
        onChange(data.quizId);
        // Redirect to the quiz builder
        router.push(`/class/${classId}/quiz/e/${data.quizId}`);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create quiz");
      },
    }),
  );

  const selectedQuiz = quizzes?.find((q) => q.id === value);

  // Derived Hrefs
  const editHref = value ? `/class/${classId}/quiz/e/${value}` : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Link Quiz</h3>

        {/* CREATE NEW BUTTON */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-blue-600 h-8"
          onClick={() => {
            createMutation.mutate({ lessonTypeId });
          }}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Create New
        </Button>
      </div>

      {/* --- SELECTION AREA --- */}
      {!selectedQuiz ? (
        // STATE: NOTHING SELECTED -> Show Dropdown Trigger
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto py-3 px-4 text-slate-500 hover:text-slate-700"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                <span>Select an existing quiz...</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search quizzes..." />
              <CommandList>
                {isLoadingQuizzes ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No quizzes found.</CommandEmpty>
                    <CommandGroup heading="Your Quizzes">
                      {quizzes?.map((quiz) => (
                        <CommandItem
                          key={quiz.id}
                          value={quiz.name || `quiz-${quiz.id}`}
                          onSelect={() => {
                            onChange(quiz.id);
                            setOpen(false);
                          }}
                          className="flex flex-col items-start gap-1 py-2"
                        >
                          <div className="flex w-full justify-between items-center">
                            <span className="font-medium">
                              {quiz.name || "Untitled Quiz"}
                            </span>
                            {quiz.status === "draft" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                Draft
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ListChecks className="h-3 w-3" />{" "}
                              {quiz.totalQuestions}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-amber-500" />{" "}
                              {quiz.totalScore} pts
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        // STATE: SELECTED -> Show Card with Details
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedQuiz.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {selectedQuiz.description || "No description provided"}
                </p>
              </div>

              <Badge
                variant={
                  selectedQuiz.status === "published" ? "default" : "secondary"
                }
                className="capitalize"
              >
                {selectedQuiz.status || "Draft"}
              </Badge>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <ListChecks className="h-4 w-4 text-blue-600" />
                <span>{selectedQuiz.totalQuestions} Questions</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>{selectedQuiz.totalScore} Total Points</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-blue-100 dark:border-blue-900">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onChange(null)} // Deselect
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
              {editHref && (
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <a href={editHref} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Edit Quiz
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Select a quiz template to attach to this lesson. Editing opens a new
        tab.
      </p>
    </div>
  );
}
