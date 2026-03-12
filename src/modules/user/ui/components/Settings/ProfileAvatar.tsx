"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { Session } from "@/lib/auth-client";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { settingsApi } from "./api";

type User = Session["user"];

interface ProfileAvatarProps {
  user: User;
}

export function ProfileAvatar({ user }: ProfileAvatarProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { startUpload, isUploading: isUploadThingUploading } = useUploadThing(
    "profileImage",
    {
      onClientUploadComplete: async (res) => {
        if (res?.[0]) {
          try {
            await settingsApi.updateAvatar(res[0].url);
            toast.success("Profile picture updated!");
            router.refresh();
          } catch (error) {
            toast.error("Failed to save avatar URL");
          }
        }
        setIsUploading(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      },
      onUploadError: (error) => {
        toast.error(error.message);
        setIsUploading(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      },
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 1MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, and WebP files are allowed");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await startUpload([selectedFile]);
  };

  const displayUrl = previewUrl || user.image;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {displayUrl ? (
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src={displayUrl} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <GeneratedAvatar
            className="h-32 w-32 border-4 border-white shadow-lg"
            seed={separateFullName(user.name).join(" ")}
            variant="initials"
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-full cursor-pointer">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-8 w-8 text-white" />
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600">{selectedFile.name}</p>
          <p className="text-xs text-slate-400">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || isUploadThingUploading}
            >
              {isUploading || isUploadThingUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">JPG, PNG, GIF or WebP. Max 1MB.</p>
    </div>
  );
}
