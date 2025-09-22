"use client";

import { useState } from "react";
import { UploadButton } from "../uploadthing";
import { useFormContext } from "react-hook-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { customFileRouter } from "../router";
import { deleteExistingFile } from "../server";
type ImageUploadProps = {
  /** Form field name for the image URL */
  urlField?: string;
  /** Form field name for the image key */
  keyField?: string;
  /** Default image to display */
  defaultImage?: string;
  /** UploadThing endpoint */
  endpoint: keyof typeof customFileRouter;
  /** Size of the avatar preview (in pixels) */
  size?: "xs" | "sm" | "md" | "lg";
  /** Button text */
  buttonText?: string;
  /** Additional classes for the container */
  className?: string;
  /** Additional classes for the upload button */
  buttonClassName?: string;
  /** Callback when image is uploaded successfully */
  onUploadComplete?: (url: string, key: string) => void;
};

const sizeMap = {
  xs: "size-10",
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
};

export function ImageUpload({
  urlField = "logo",
  keyField = "logoKey",
  defaultImage,
  endpoint,
  size = "md",
  buttonText = "Upload Image",
  className,
  buttonClassName,
  onUploadComplete,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(defaultImage);

  // Optional form integration
  const formContext = useFormContext();

  const handleUploadComplete = async (url: string, key: string) => {
    setImageUrl(url);
    if (formContext.getValues("logoKey")) {
      // Prevent unnecessary updates
      await deleteExistingFile(formContext.getValues("logoKey"));
    }
    // Update form values if using react-hook-form
    if (formContext) {
      formContext.setValue(urlField, url);
      formContext.setValue(keyField, key);
      formContext.setValue("isUploading", false);
    }

    // Call callback if provided
    onUploadComplete?.(url, key);
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {imageUrl ? (
        <Avatar className={cn(sizeMap[size], "border border-border")}>
          <AvatarImage src={imageUrl} alt="Uploaded image" />
          <AvatarFallback className="bg-muted">Loading</AvatarFallback>
        </Avatar>
      ) : null}

      <div className={cn("ut-container", isUploading && "ut-loading")}>
        <UploadButton
          className={cn("ut-button", buttonClassName)}
          endpoint={endpoint}
          content={{
            button: () => (
              <div className="flex items-center gap-2">
                {isUploading && <Loader2 className="size-3 animate-spin" />}
                {isUploading ? "Uploading..." : buttonText}
              </div>
            ),
          }}
          onUploadBegin={() => {
            setIsUploading(true);
            if (formContext) {
              formContext.setValue("isUploading", true);
            }
          }}
          onClientUploadComplete={(res) => {
            setIsUploading(false);
            if (res && res.length > 0) {
              handleUploadComplete(res[0].ufsUrl, res[0].key);
            }
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false);
            if (formContext) {
              formContext.setValue("isUploading", false);
            }
            console.error("Upload error:", error);
          }}
        />
      </div>
    </div>
  );
}
