'use client';

import { useState, useRef } from 'react';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { useUploadThing } from '@/services/uploadthing/uploadthing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ResponsiveDialog from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { ImageCropper } from '@/components/image-cropper';

interface ClassHeaderImageProps {
  classId: string;
  headerImage?: string | null;
  isTeacher: boolean;
}

export default function ClassHeaderImage({
  classId,
  headerImage,
  isTeacher,
}: ClassHeaderImageProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { startUpload, isUploading } = useUploadThing('classHeaderUploader', {
    onClientUploadComplete: (res) => {
      setUploadProgress(0);
      if (res && res[0]) {
        updateHeaderImage({ classId, headerImage: res[0].url });
      }
    },
    onUploadError: (error) => {
      setUploadProgress(0);
      setIsProcessing(false);
      toast.error(error.message);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const { mutate: updateHeaderImage, isPending: isUpdating } = useMutation(
    trpc.user.updateClassSubjectHeaderImage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.getClassSubjectDetails.queryOptions({ classId }));
        toast.success('Header image updated!');
        setIsEditOpen(false);
        setIsCropperOpen(false);
        setSelectedFile(null);
        setIsProcessing(false);
      },
      onError: (error) => {
        setIsProcessing(false);
        toast.error(error.message);
      },
    })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setSelectedFile(file);
    setIsCropperOpen(true);
  };

  const handleCropComplete = async (croppedImage: string) => {
    setIsProcessing(true);

    try {
      const base64Data = croppedImage.split(',')[1];
      if (!base64Data) {
        setIsProcessing(false);
        return;
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'image/jpeg' });
      const fileName = selectedFile?.name || 'header-image.jpg';
      const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

      startUpload([croppedFile]);
    } catch {
      setIsProcessing(false);
      toast.error('Failed to process image');
    }
  };

  const closeCropper = () => {
    if (!isProcessing) {
      setIsCropperOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative m w-full h-32 md:h-54 overflow-hidden cursor-pointer group',
          isTeacher && 'hover:opacity-90 transition-opacity'
        )}
        onClick={() => isTeacher && !isUploading && setIsEditOpen(true)}
      >
        {headerImage ? (
          <div
            className="absolute m-5 rounded-2xl inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${headerImage})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
        )}

        {isTeacher && (
          <div
            className={cn(
              'absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity',
              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white">
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Change Header</span>
              </div>
            )}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-white/80 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      <ResponsiveDialog
        title="Change Header Image"
        description="Upload a new header image for your class"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div
            className="relative w-full h-40 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => inputRef.current?.click()}
          >
            {headerImage ? (
              <img src={headerImage} alt="Current header" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Camera className="h-12 w-12 text-white/50" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>

          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isUploading || isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={() => inputRef.current?.click()} disabled={isUploading || isUpdating}>
              {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Choose Image
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title="Crop Header Image"
        description="Adjust zoom and rotation, then crop your image"
        open={isCropperOpen}
        onOpenChange={closeCropper}
      >
        <div className="relative max-h-[70vh] overflow-auto">
          <div className={cn(isProcessing && 'opacity-50 pointer-events-none')}>
            <ImageCropper aspectRatio={3} onCropComplete={handleCropComplete} />
          </div>

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg z-10">
              <div className="flex flex-col items-center gap-3 p-6 bg-background/80 rounded-lg shadow-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Processing your image...</p>
              </div>
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
