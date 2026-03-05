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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ListChecks,
  ToggleLeft,
  ArrowUpDown,
  Link2,
  FileText,
  Loader2,
  Wand2,
  Sparkles,
  Save,
  Eye,
} from "lucide-react";
import { SortableQuestion } from "@/components/SortableQuestion";
import EssayQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/EssayQuestion";
import MatchingPairQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/MatchingPairQuestion";
import MultipleChoiceQuestionForm from "@/modules/admin/ui/subject/components/QuizQuestionTypes/MultipleChoiceQuestion";
import OrderingQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/OrderingQuestion";
import TrueOrFalseQuestion from "@/modules/admin/ui/subject/components/QuizQuestionTypes/TrueOrFalseQuestion";
import { toast } from "sonner";

// ============================================
// TYPES & CONFIG
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

const QUESTION_TYPE_CONFIG = {
  multiple_choice: { label: "Multiple Choice", icon: ListChecks },
  true_false: { label: "True / False", icon: ToggleLeft },
  ordering: { label: "Ordering", icon: ArrowUpDown },
  matching: { label: "Matching Type", icon: Link2 },
};

// ============================================
// MOCK DATA GENERATOR (AI Simulation)
// ============================================

const generateMockQuestion = (
  type: QuestionType,
  index: number,
  topic: string,
): BaseQuestion => {
  const id = `q_${Date.now()}_${Math.random()}`;

  const base = {
    id,
    type,
    orderIndex: index,
    question: `Generated Question ${index + 1} about ${topic}`,
    points: 5,
    required: true,
    imageBase64Jpg: null,
  };

  switch (type) {
    case "multiple_choice":
      return {
        ...base,
        multipleChoices: [
          {
            multipleChoiceId: `${id}_mc1`,
            optionText: "Option A",
            isCorrect: true,
            points: 5,
          },
          {
            multipleChoiceId: `${id}_mc2`,
            optionText: "Option B",
            isCorrect: false,
            points: 0,
          },
          {
            multipleChoiceId: `${id}_mc3`,
            optionText: "Option C",
            isCorrect: false,
            points: 0,
          },
        ],
      } as any;
    case "true_false":
      return {
        ...base,
        correctBoolean: true,
      } as any;
    case "ordering":
      return {
        ...base,
        orderingOptions: [
          { orderingOptionId: `${id}_o1`, itemText: "Step 1", points: 1 },
          { orderingOptionId: `${id}_o2`, itemText: "Step 2", points: 1 },
          { orderingOptionId: `${id}_o3`, itemText: "Step 3", points: 1 },
        ],
      } as any;
    case "matching":
      return {
        ...base,
        matchingPairs: [
          {
            matchingPairId: `${id}_mp1`,
            leftItem: "Term A",
            rightItem: "Definition A",
            points: 1,
          },
          {
            matchingPairId: `${id}_mp2`,
            leftItem: "Term B",
            rightItem: "Definition B",
            points: 1,
          },
        ],
      } as any;
    default:
      return base;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

interface QuizEditClientProps {
  quizId: string;
}

export default function QuizEditClient({ quizId }: QuizEditClientProps) {
  const [questions, setQuestions] = useState<BaseQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState("Untitled Quiz");
  const [quizDesc, setQuizDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // AI Dialog State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiTypes, setAiTypes] = useState<QuestionType[]>(["multiple_choice"]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Handlers ---

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        return newArray.map((q, idx) => ({ ...q, orderIndex: idx }));
      });
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion = generateMockQuestion(type, questions.length, "");
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleAiTypeToggle = (type: QuestionType) => {
    if (aiTypes.includes(type)) {
      setAiTypes(aiTypes.filter((t) => t !== type));
    } else {
      setAiTypes([...aiTypes, type]);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) {
      toast.error("Please enter a topic.");
      return;
    }
    if (aiTypes.length === 0) {
      toast.error("Please select at least one question type.");
      return;
    }

    setIsAiGenerating(true);

    // Simulate AI Processing Delay
    await new Promise((r) => setTimeout(r, 2000));

    const newQuestions: BaseQuestion[] = [];

    for (let i = 0; i < aiCount; i++) {
      // Cycle through selected types randomly or round-robin
      const typeToUse = aiTypes[i % aiTypes.length];
      const q = generateMockQuestion(typeToUse, questions.length + i, aiTopic);
      newQuestions.push(q);
    }

    setQuestions([...questions, ...newQuestions]);
    setIsAiGenerating(false);
    setIsAiOpen(false);
    toast.success(`Generated ${aiCount} questions!`);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Saving Quiz:", {
      title: quizTitle,
      desc: quizDesc,
      questions,
    });
    setIsSaving(false);
    toast.success("Quiz saved successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-white dark:bg-slate-950 p-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className=" pt-6">
            <h3 className="font-semibold mb-4">Add Manually</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(QUESTION_TYPE_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(key as QuestionType)}
                >
                  <config.icon className="h-4 w-4 mr-1" />
                  {config.label.split(" ")[0]}
                </Button>
              ))}
              {/* Essay Button separate */}
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

          <div className="border-t pt-6">
            <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    AI Quiz Generator
                  </DialogTitle>
                  <DialogDescription>
                    Let AI help you create questions. Select types and topic
                    below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Topic / Context</Label>
                    <Input
                      placeholder="e.g., Photosynthesis, World War II, Newton's Laws"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) =>
                        setAiCount(parseInt(e.target.value) || 5)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Question Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(QUESTION_TYPE_CONFIG).map(
                        ([key, config]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`ai-${key}`}
                              checked={aiTypes.includes(key as QuestionType)}
                              onCheckedChange={() =>
                                handleAiTypeToggle(key as QuestionType)
                              }
                            />
                            <label
                              htmlFor={`ai-${key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {config.label}
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Note: Essays are excluded as they require manual grading.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAiOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAiGenerate} disabled={isAiGenerating}>
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full pb-24">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="text-3xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
            placeholder="Enter Quiz Title..."
          />
          <Textarea
            placeholder="Add a description for your quiz..."
            className="resize-none border-none shadow-none p-0 focus-visible:ring-0 bg-transparent text-muted-foreground"
            rows={2}
            value={quizDesc}
            onChange={(e) => setQuizDesc(e.target.value)}
          />
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No questions yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add questions manually using the sidebar or use AI to generate
              them automatically.
            </p>
            <Button onClick={() => setIsAiOpen(true)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        ) : (
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
                    {question.type === "multiple_choice" && (
                      <MultipleChoiceQuestionForm
                        questionId={parseInt(question.id.split("_")[1]) || 0}
                        initialData={question as any}
                        orderIndex={index}
                        setDeleteQuestion={(val) =>
                          val && deleteQuestion(question.id)
                        }
                        mutate={({ id }) => Promise.resolve()}
                      />
                    )}
                    {question.type === "true_false" && (
                      <TrueOrFalseQuestion
                        initialData={question as any}
                        orderIndex={index}
                        setDeleteQuestion={(val) =>
                          val && deleteQuestion(question.id)
                        }
                        mutate={() => Promise.resolve()}
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
                        mutate={() => Promise.resolve()}
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
                        mutate={() => Promise.resolve()}
                      />
                    )}
                    {question.type === "essay" && (
                      <EssayQuestion
                        initialData={question as any}
                        orderIndex={index}
                        setDeleteQuestion={(val) =>
                          val && deleteQuestion(question.id)
                        }
                        mutate={() => Promise.resolve()}
                      />
                    )}
                  </SortableQuestion>
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-80 bg-white dark:bg-slate-950 border-t p-4 flex justify-end gap-4 z-40 shadow-lg">
        <Button variant="outline" disabled={questions.length === 0}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={handleSaveAll}
          disabled={isSaving || questions.length === 0}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Quiz
        </Button>
      </div>
    </div>
  );
}
