"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { TrueFalseQuestion } from "./types";

interface Props {
  data: TrueFalseQuestion;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

export function TrueFalseRenderer({ data, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        size="lg"
        className={cn(
          "h-24 text-lg border-2",
          value === true
            ? "border-green-500 bg-green-50 dark:bg-green-900"
            : "",
        )}
        onClick={() => onChange(true)}
      >
        <Check className="h-6 w-6 mr-2 text-green-600" />
        True
      </Button>
      <Button
        variant="outline"
        size="lg"
        className={cn(
          "h-24 text-lg border-2",
          value === false ? "border-red-500 bg-red-50 dark:bg-red-900" : "",
        )}
        onClick={() => onChange(false)}
      >
        <X className="h-6 w-6 mr-2 text-red-600" />
        False
      </Button>
    </div>
  );
}
