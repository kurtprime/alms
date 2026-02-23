"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileUp } from "lucide-react";

interface FormFooterProps {
  isPending: boolean;
  isValid: boolean;
  totalCount: number;
  onReset: () => void;
  onCancel: () => void;
  onShowFiles: () => void;
}

export function FormFooter({
  isPending,
  isValid,
  totalCount,
  onReset,
  onCancel,
  onShowFiles,
}: FormFooterProps) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-t bg-background px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Mobile: Show files tab shortcut */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 lg:hidden"
          onClick={onShowFiles}
        >
          <FileUp className="h-4 w-4" />
          Files
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={isPending}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!isValid || isPending}
          className="gap-2 min-w-[100px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </div>
  );
}
