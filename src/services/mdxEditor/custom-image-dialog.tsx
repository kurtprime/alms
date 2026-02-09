"use client";

import { useState } from "react";
import { Button, insertImage$, usePublisher } from "@mdxeditor/editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { useUploadThing } from "../uploadthing/uploadthing";

export const CustomAddImage = ({ lessonTypeId }: { lessonTypeId?: number }) => {
  const insertImage = usePublisher(insertImage$);
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState({ src: "", alt: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Track preview URL

  const [lessonTypeParams] = useLessonTypeParams();
  const { startUpload } = useUploadThing("mdxImageUploader");

  const resetForm = () => {
    setImageUrl({ src: "", alt: "" });
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Clean up object URL
      setPreviewUrl(null);
    }
    setIsDragging(false);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const uploadedFiles = await startUpload([selectedFile], {
        lessonTypeId: lessonTypeId ?? lessonTypeParams.id,
      });

      if (uploadedFiles?.[0]) {
        insertImage({
          src: uploadedFiles[0].ufsUrl,
          altText: selectedFile.name,
          title: selectedFile.name,
        });
        toast.success(`Image uploaded successfully`);
        setOpen(false);
        resetForm();
      } else {
        throw new Error("No files returned from upload");
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.src.trim() || !imageUrl.alt.trim()) return;

    try {
      setIsUploading(true);
      insertImage({
        src: imageUrl.src,
        altText: imageUrl.alt,
        title: imageUrl.alt,
      });
      toast.success("Image added from URL");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add image. Check the URL.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  // Cleanup on unmount
  useState(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} title="Insert Image">
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() =>
                    document.getElementById("image-upload-input")?.click()
                  }
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop image here or click to browse
                  </p>
                  <Input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    {/* Use previewUrl state instead of creating new object URL */}
                    <img
                      src={previewUrl || ""}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-center text-gray-500 truncate">
                    {selectedFile.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-500 uppercase">Or</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="image-source" className="text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="image-source"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl.src}
                  onChange={(e) =>
                    setImageUrl({ ...imageUrl, src: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="image-alt" className="text-sm font-medium">
                  Alt Text
                </label>
                <Input
                  id="image-alt"
                  placeholder="Description of the image"
                  value={imageUrl.alt}
                  onChange={(e) =>
                    setImageUrl({ ...imageUrl, alt: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            {selectedFile && (
              <Button onClick={handleFileUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload & Insert"
                )}
              </Button>
            )}

            {!selectedFile && imageUrl.src.trim() && (
              <Button
                onClick={handleUrlSubmit}
                disabled={!imageUrl.alt.trim() || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add from URL"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
