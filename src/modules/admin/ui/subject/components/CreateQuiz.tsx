import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quizTypeEnum } from "@/db/schema";
import { formatQuizType } from "@/hooks/initials";
import { AdminGetQuizQuestions } from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import React from "react";
import MultipleChoiceQuestion from "./QuizQuestionTypes/MultipleChoiceQuestion";
import MultipleChoiceQuestionForm from "./QuizQuestionTypes/MultipleChoiceQuestion";
import { Badge } from "@/components/ui/badge";

export default function CreateQuiz({ quizId }: { quizId: number }) {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(
    trpc.admin.getQuizQuestions.queryOptions({
      quizId,
    })
  );

  return (
    <div className="flex flex-col gap-2 ">
      <QuizQuestionType data={data} isLoading={isLoading} isError={isError} />
      <AddQuizButton count={data?.length || 0} quizId={quizId} />
    </div>
  );
}

function QuizQuestionType({
  data,
  isLoading,
  isError,
}: {
  data?: AdminGetQuizQuestions;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <div>Loading questions...</div>;
  }
  if (isError) {
    return <div>Error loading questions.</div>;
  }
  return (
    <div className="flex flex-col gap-2 mt-1">
      {data && data.length > 0 ? (
        data.map((question) => (
          <Card className="mx-2" key={question.id}>
            {question.type === "multiple_choice" ? (
              <MultipleChoiceQuestionCard data={question} />
            ) : (
              question.type
            )}
          </Card>
        ))
      ) : (
        <div>No questions added yet.</div>
      )}
    </div>
  );
}

function MultipleChoiceQuestionCard({
  data,
}: {
  data: AdminGetQuizQuestions[number];
}) {
  const trpc = useTRPC();
  const {
    data: multipleChoiceQuestionDetails,
    isPending,
    isError,
  } = useQuery(
    trpc.admin.getMultipleChoiceQuestionDetails.queryOptions({
      quizQuestionId: data.id,
    })
  );

  if (isPending) {
    return <div>Loading question details...</div>;
  }

  if (isError) {
    return <div>Error loading question details.</div>;
  }

  return (
    <>
      <MultipleChoiceQuestionForm
        questionId={data.id}
        orderIndex={data.orderIndex}
        initialData={multipleChoiceQuestionDetails}
      />
    </>
  );
}

function AddQuizButton({ count, quizId }: { count: number; quizId: number }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const handleAddQuestion = useMutation(
    trpc.admin.addQuizQuestion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getQuizQuestions.queryOptions({ quizId })
        );
      },
    })
  );

  const addQuestion = (type: (typeof quizTypeEnum.enumValues)[number]) => {
    handleAddQuestion.mutate({ quizId, questionType: type, orderIndex: count });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mr-auto ml-2 w-40" asChild>
        <Button>
          <Plus /> Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {quizTypeEnum.enumValues.map((type) => (
          <DropdownMenuItem
            onClick={() => {
              addQuestion(type);
            }}
            key={type}
          >
            {formatQuizType(type)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
