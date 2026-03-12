import { Textarea } from "@/components/ui/textarea";
import { EssayQuestion } from "./types";

interface Props {
  data: EssayQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function EssayRenderer({ data, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Type your answer here..."
        className="min-h-[200px] text-base p-4"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
