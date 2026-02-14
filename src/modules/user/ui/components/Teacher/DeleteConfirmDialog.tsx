"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { LessonDocument } from "@/modules/user/types/addLesson";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteConfirmDialogProps {
  doc: LessonDocument | null;
  onClose: () => void;
  lessonTypeId: number | undefined;
}

export function DeleteConfirmDialog({
  doc,
  onClose,
  lessonTypeId,
}: DeleteConfirmDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteFile = useMutation(
    trpc.admin.deleteLessonDocument.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getLessonDocument.queryOptions({
            lessonId: lessonTypeId ?? -1,
          }),
        );
        toast.success("File deleted successfully");
        onClose();
      },
      onError: (error) => {
        toast.error("Failed to delete file");
        console.error(error);
      },
    }),
  );

  if (!doc) return null;

  return (
    <ResponsiveDialog
      title="Delete File"
      description={`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`}
      open={!!doc}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={deleteFile.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => deleteFile.mutate({ fileKey: doc.fileKey })}
          disabled={deleteFile.isPending}
        >
          {deleteFile.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
