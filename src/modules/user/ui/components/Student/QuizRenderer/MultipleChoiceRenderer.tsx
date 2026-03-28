'use client';

import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { cn } from '@/lib/utils';
import { MultipleChoiceQuestion } from './types';

interface Props {
  data: MultipleChoiceQuestion;
  // Value can be a single string (radio) or an array of strings (checkbox)
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}

export function MultipleChoiceRenderer({ data, value, onChange }: Props) {
  const isMultiple = data.multipleAnswer === true;

  // Helper for Checkbox Toggle
  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    const currentValues = (Array.isArray(value) ? value : []) as string[];
    if (checked) {
      onChange([...currentValues, optionId]);
    } else {
      onChange(currentValues.filter((id) => id !== optionId));
    }
  };

  return (
    <div className="space-y-3">
      {data.multipleChoices.map((option) => {
        const isSelected = isMultiple
          ? Array.isArray(value) && value.includes(option.multipleChoiceId)
          : value === option.multipleChoiceId;

        return (
          <div
            key={option.multipleChoiceId}
            onClick={() => {
              if (isMultiple) {
                handleCheckboxChange(option.multipleChoiceId, !isSelected);
              } else {
                onChange(option.multipleChoiceId);
              }
            }}
            className={cn(
              'flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
            )}
          >
            {isMultiple ? (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(option.multipleChoiceId, !!checked)
                }
                id={option.multipleChoiceId}
              />
            ) : (
              <RadioGroupItem value={option.multipleChoiceId} id={option.multipleChoiceId} />
            )}
            <Label
              htmlFor={option.multipleChoiceId}
              className="cursor-pointer font-medium text-base flex-1"
            >
              {option.optionText}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
