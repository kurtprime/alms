"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Camera, Loader2 } from "lucide-react";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { toast } from "sonner";

interface AvatarUploaderProps {
  currentImage?: string | null;
  name: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUploader({
  currentImage,
  name,
  onUploadComplete,
}: AvatarUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setUploadProgress(0);
      if (res && res[0]) {
        onUploadComplete(res[0].ufsUrl);
        toast.success("Profile picture updated!");
      }
    },
    onUploadError: (error) => {
      setUploadProgress(0);
      toast.error(error.message);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Optional: Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    startUpload([file]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative group cursor-pointer"
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg transition-transform group-hover:scale-105">
          <AvatarImage src={currentImage || undefined} />
          <AvatarFallback className="text-3xl bg-slate-100 text-slate-600">
            {name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>

      {/* Progress bar below avatar */}
      {isUploading && (
        <div className="w-32 space-y-1">
          <Progress value={uploadProgress} className="h-1" />
          <p className="text-[10px] text-center text-slate-500">
            {uploadProgress}%
          </p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        Change Photo
      </Button>
    </div>
  );
}
