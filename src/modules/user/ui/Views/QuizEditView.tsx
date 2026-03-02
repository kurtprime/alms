/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ListChecks,
  ToggleLeft,
  ArrowUpDown,
  Link2,
  FileText,
  Settings2,
  Loader2,
} from "lucide-react";
import { SortableQuestion } from "@/components/SortableQuestion";
import EssayQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/EssayQuestion";
import MatchingPairQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/MatchingPairQuestion";
import MultipleChoiceQuestionForm from "@/modules/admin/ui/subject/components/QuizQuestionTypes/MultipleChoiceQuestion";
import OrderingQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/OrderingQuestion";
import TrueOrFalseQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/TrueOrFalseQuestion";

// Import your existing question components

// ============================================
// MOCK DATA & TYPES
// ============================================

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "ordering"
  | "matching"
  | "essay";

interface BaseQuestion {
  id: string;
  type: QuestionType;
  orderIndex: number;
}

// Mock Data Generator
const createMockQuestion = (
  type: QuestionType,
  index: number,
): BaseQuestion => {
  const base = {
    id: `q_${Date.now()}_${Math.random()}`,
    type,
    orderIndex: index,
  };

  // Return specific mock data based on type (simplified for brevity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return base as any;
};

// Initial Mock Data
const initialQuestions: BaseQuestion[] = [
  {
    id: "q_1",
    type: "multiple_choice",
    orderIndex: 0,
    question: "What is the capital of France?",
    points: 5,
    required: true,
    imageBase64Jpg: null,
    multipleChoices: [
      {
        multipleChoiceId: "mc_1",
        optionText: "Paris",
        isCorrect: true,
        points: 5,
        imageBase64Jpg: null,
      },
      {
        multipleChoiceId: "mc_2",
        optionText: "London",
        isCorrect: false,
        points: 0,
        imageBase64Jpg: null,
      },
    ],
  } as any,
  {
    id: "q_2",
    type: "true_false",
    orderIndex: 1,
    question: "The Earth is flat.",
    points: 1,
    required: true,
    correctBoolean: false,
    imageBase64Jpg: null,
  } as any,
  {
    id: "q_3",
    type: "ordering",
    orderIndex: 2,
    question: "Arrange the following in order of size (smallest to largest).",
    points: 3,
    required: false,
    orderingOptions: [
      { orderingOptionId: "oo_1", itemText: "Atom", points: 1 },
      { orderingOptionId: "oo_2", itemText: "Molecule", points: 1 },
      { orderingOptionId: "oo_3", itemText: "Cell", points: 1 },
    ],
  } as any,
];

// ============================================
// MAIN COMPONENT
// ============================================

interface QuizEditClientProps {
  quizId: string;
}

export default function QuizEditClient({ quizId }: QuizEditClientProps) {
  const [questions, setQuestions] = useState<BaseQuestion[]>(initialQuestions);
  const [quizTitle, setQuizTitle] = useState("Untitled Quiz");
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        // Update orderIndex
        return newArray.map((q, idx) => ({ ...q, orderIndex: idx }));
      });
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion = createMockQuestion(type, questions.length);
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Saving Quiz:", { title: quizTitle, questions });
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar / Settings */}
      <aside className="w-80 border-r bg-white dark:bg-slate-950 p-6 hidden lg:block sticky top-0 h-screen">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Quiz Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure time limits, attempts, etc.
            </p>
            <Button variant="outline" className="w-full mt-4">
              <Settings2 className="h-4 w-4 mr-2" />
              Open Settings
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Question Types</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("multiple_choice")}
              >
                <ListChecks className="h-4 w-4 mr-1" /> Multiple
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("true_false")}
              >
                <ToggleLeft className="h-4 w-4 mr-1" /> T/F
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("ordering")}
              >
                <ArrowUpDown className="h-4 w-4 mr-1" /> Order
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion("matching")}
              >
                <Link2 className="h-4 w-4 mr-1" /> Match
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="col-span-2"
                onClick={() => addQuestion("essay")}
              >
                <FileText className="h-4 w-4 mr-1" /> Essay
              </Button>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Points:</span>
              <Badge variant="secondary">
                {questions.reduce(
                  (acc, q) => acc + ((q as any).points || 0),
                  0,
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Questions:</span>
              <Badge variant="secondary">{questions.length}</Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="text-3xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
            placeholder="Enter Quiz Title..."
          />
          <Textarea
            placeholder="Add a description for your quiz..."
            className="resize-none border-none shadow-none p-0 focus-visible:ring-0 text-muted-foreground"
            rows={2}
          />
        </div>

        {/* Questions List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((question, index) => {
              return (
                <SortableQuestion key={question.id} id={question.id}>
                  {/* Render Specific Component based on Type */}
                  {question.type === "multiple_choice" && (
                    <MultipleChoiceQuestionForm
                      questionId={parseInt(question.id.split("_")[1]) || 0}
                      initialData={question as any}
                      orderIndex={index}
                      setDeleteQuestion={(val) =>
                        val && deleteQuestion(question.id)
                      }
                      mutate={({ id }) => {
                        console.log("Mock delete mutation for", id);
                        return Promise.resolve();
                      }}
                    />
                  )}
                  {question.type === "true_false" && (
                    <TrueOrFalseQuestion
                      initialData={question as any}
                      orderIndex={index}
                      setDeleteQuestion={(val) =>
                        val && deleteQuestion(question.id)
                      }
                      mutate={({ id }) => {
                        console.log("Mock delete mutation for", id);
                        return Promise.resolve();
                      }}
                    />
                  )}
                  {question.type === "ordering" && (
                    <OrderingQuestion
                      questionId={parseInt(question.id.split("_")[1]) || 0}
                      initialData={question as any}
                      orderIndex={index}
                      setDeleteQuestion={(val) =>
                        val && deleteQuestion(question.id)
                      }
                      mutate={({ id }) => {
                        console.log("Mock delete mutation for", id);
                        return Promise.resolve();
                      }}
                    />
                  )}
                  {question.type === "matching" && (
                    <MatchingPairQuestion
                      questionId={parseInt(question.id.split("_")[1]) || 0}
                      initialData={question as any}
                      orderIndex={index}
                      setDeleteQuestion={(val) =>
                        val && deleteQuestion(question.id)
                      }
                      mutate={({ id }) => {
                        console.log("Mock delete mutation for", id);
                        return Promise.resolve();
                      }}
                    />
                  )}
                  {question.type === "essay" && (
                    <EssayQuestion
                      initialData={question as any}
                      orderIndex={index}
                      setDeleteQuestion={(val) =>
                        val && deleteQuestion(question.id)
                      }
                      mutate={({ id }) => {
                        console.log("Mock delete mutation for", id);
                        return Promise.resolve();
                      }}
                    />
                  )}
                </SortableQuestion>
              );
            })}
          </SortableContext>
        </DndContext>

        {/* Add Question Button (Mobile/Floating) */}
        <div className="flex justify-center mt-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2 shadow-md">
                <Plus className="h-5 w-5" />
                Add Question
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => addQuestion("multiple_choice")}>
                <ListChecks className="mr-2 h-4 w-4" /> Multiple Choice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("true_false")}>
                <ToggleLeft className="mr-2 h-4 w-4" /> True / False
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("ordering")}>
                <ArrowUpDown className="mr-2 h-4 w-4" /> Ordering
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("matching")}>
                <Link2 className="mr-2 h-4 w-4" /> Matching Type
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion("essay")}>
                <FileText className="mr-2 h-4 w-4" /> Essay
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer Save Button */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-80 bg-white dark:bg-slate-950 border-t p-4 flex justify-end gap-4 z-40">
          <Button variant="outline">Preview</Button>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
}
