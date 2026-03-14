import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

interface Props {
  currentIndex: number;
  total: number;
  onBack: () => void;
}

export function TeacherCheckSidebar({ currentIndex, total, onBack }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <h2 className="font-semibold text-slate-800 hidden sm:block">
        Activity Review
      </h2>
    </div>
  );
}