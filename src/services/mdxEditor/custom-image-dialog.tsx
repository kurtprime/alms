// components/mdx-editor/add-image.tsx
"use client";

import { useState } from "react";
import {
  Button,
  insertImage$,
  usePublisher,
  useCellValues,
  markdown$,
} from "@mdxeditor/editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"; // ✅ Added Loader2
import { toast } from "sonner";
import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { useUploadThing } from "../uploadthing/uploadthing";

export const AddImage = () => {
  const insertImage = usePublisher(insertImage$);
  const [markdown] = useCellValues(markdown$); // ✅ Fixed: pass array, not single value
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState({ src: "", alt: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [lessonTypeParams] = useLessonTypeParams();
  const { startUpload } = useUploadThing("mdxImageUploader");

  const handleFileUpload = async () => {
    if (!selectedFile) return; // ✅ Removed undefined `editor` check

    setIsUploading(true);
    try {
      const uploadedFiles = await startUpload([selectedFile], {
        lessonTypeId: lessonTypeParams.id,
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
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.src.trim() || !imageUrl.alt.trim()) return; // ✅ Removed undefined `editor` check

    try {
      setIsUploading(true);
      await insertImage({
        src: imageUrl.src,
        altText: imageUrl.alt,
        title: imageUrl.alt,
      });
      toast.success("Image added from URL");
      setOpen(false);
      resetForm(); // ✅ Added missing reset
    } catch {
      toast.error("Failed to add image. Check the URL.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setImageUrl({ src: "", alt: "" });
    setSelectedFile(null);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} title="Insert Image">
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Upload Section */}
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
                      if (file) setSelectedFile(file);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(selectedFile)}
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

            {/* URL Input Section */}
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

            {/* Upload Button (shows when file is selected) */}
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

            {/* URL Button (shows when no file, but URL is filled) */}
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
