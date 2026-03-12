"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { MultipleChoiceQuestion } from "./types";

interface Props {
  data: MultipleChoiceQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function MultipleChoiceRenderer({ data, value, onChange }: Props) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
      {data.multipleChoices.map((option) => (
        <div
          key={option.multipleChoiceId}
          onClick={() => onChange(option.multipleChoiceId)}
          className={cn(
            "flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
            value === option.multipleChoiceId
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-slate-200 hover:border-slate-300 dark:border-slate-700",
          )}
        >
          <RadioGroupItem
            value={option.multipleChoiceId}
            id={option.multipleChoiceId}
          />
          <Label
            htmlFor={option.multipleChoiceId}
            className="cursor-pointer font-medium text-base"
          >
            {option.optionText}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
