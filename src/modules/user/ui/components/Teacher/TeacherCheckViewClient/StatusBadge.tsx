import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SubmissionStatus = "submitted" | "graded" | "missing" | "late" | "in_progress" | "expired";

interface Props {
  status: SubmissionStatus;
  size?: "sm" | "default";
}

export function StatusBadge({ status, size = "default" }: Props) {
  const config = {
    in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
    submitted: { label: "Submitted", className: "bg-amber-50 text-amber-700 border-amber-200" },
    graded: { label: "Graded", className: "bg-green-50 text-green-700 border-green-200" },
    expired: { label: "Expired", className: "bg-red-50 text-red-700 border-red-200" },
    late: { label: "Late", className: "bg-red-50 text-red-700 border-red-200" },
    missing: { label: "Missing", className: "bg-slate-100 text-slate-500 border-slate-200" },
  };

  const c = config[status];

  return (
    <span
      className={cn(
        "rounded-full border font-medium",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}