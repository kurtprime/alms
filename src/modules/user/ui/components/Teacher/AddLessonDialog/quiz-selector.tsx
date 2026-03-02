"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronsUpDown,
  Plus,
  FileText,
  ExternalLink,
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form";

// ============================================
// TYPES
// ============================================
interface DummyQuiz {
  id: number;
  name: string;
  questionsCount: number;
  status: "draft" | "published";
}

// ============================================
// COMPONENT
// ============================================
interface QuizSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  classId: string;
}

export function QuizSelector({ value, onChange, classId }: QuizSelectorProps) {
  // Calculate Hrefs for Quiz Editor
  const createHref = `/class/${classId}/quiz/e`;
  const editHref = value ? `/class/${classId}/quiz/e/${value}` : null;
  const [open, setOpen] = useState(false);

  // Dummy Data Fetch
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["available-quizzes"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [
        {
          id: 101,
          name: "Midterm Exam - Science",
          questionsCount: 50,
          status: "published",
        },
        {
          id: 102,
          name: "Chapter 5 Quiz",
          questionsCount: 20,
          status: "published",
        },
        {
          id: 103,
          name: "Pop Quiz - History",
          questionsCount: 10,
          status: "draft",
        },
      ] as DummyQuiz[];
    },
  });

  const selectedQuiz = quizzes?.find((q) => q.id === value);

  return (
    <div className="space-y-3">
      <FormLabel>Link Existing Quiz</FormLabel>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between h-11 font-normal"
            >
              {selectedQuiz ? (
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate">{selectedQuiz.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Select existing quiz...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search quizzes..." />
              <CommandList>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          No quizzes found.
                        </p>
                        <Button size="sm" asChild>
                          <a
                            href={createHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Create New Quiz
                          </a>
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup heading="Available Quizzes">
                      {quizzes?.map((quiz) => (
                        <CommandItem
                          key={quiz.id}
                          value={quiz.name}
                          onSelect={() => {
                            onChange(quiz.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === quiz.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <span>{quiz.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {quiz.questionsCount} questions
                              </span>
                              {quiz.status === "draft" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4"
                                >
                                  Draft
                                </Badge>
                              )}
                            </div>
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

        {/* Create Button */}
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 h-11"
          asChild
        >
          <a href={createHref} target="_blank" rel="noopener noreferrer">
            <Plus className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Edit Button - Appears only if a quiz is selected */}
      {selectedQuiz && editHref && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="font-medium truncate max-w-[250px]">
              {selectedQuiz.name}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-blue-600 hover:text-blue-700"
            asChild
          >
            <a href={editHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Edit
            </a>
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Select a pre-existing quiz or create a new one. Opens in new tab.
      </p>
    </div>
  );
}
