import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quizTypeEnum } from "@/db/schema";
import { formatQuizType } from "@/hooks/initials";
import { Plus } from "lucide-react";
import React from "react";

export default function CreateQuiz() {
  return (
    <div className="flex flex-col gap-2 ">
      <AddQuizButton />
      <div></div>
    </div>
  );
}

function AddQuizButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-auto mr-2 my-3" asChild>
        <Button>
          <Plus /> Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {quizTypeEnum.enumValues.map((type) => (
          <DropdownMenuItem key={type}>{formatQuizType(type)}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
