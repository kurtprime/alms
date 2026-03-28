// src/modules/user/ui/components/OnboardingDialog.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authClient, Session } from '@/lib/auth-client';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, ArrowRight, Lock } from 'lucide-react';
import { useUploadThing } from '@/services/uploadthing/uploadthing';
import { separateFullName } from '@/hooks/separate-name';
import { GeneratedAvatar } from '@/components/generatedAvatar';

interface Props {
  user: Session['user'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingDialog({ user, open, onOpenChange, onComplete }: Props) {
  const trpc = useTRPC();
  const [step, setStep] = useState(0); // 0: Profile, 1: Password
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // For the "default password" case

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- Mutations ---

  const { mutate: setPasswordMutation, isPending } = useMutation(
    trpc.user.setOrUpdatePassword.mutationOptions({
      onSuccess: () => {
        toast.success('Password set successfully!');
        onComplete();
      },
      onError: (err) => {
        toast.error(
          err.message || 'Could not set password. If you have an old password, please enter it.'
        );
      },
    })
  );

  // --- Image Upload Handlers ---

  const { startUpload, isUploading: isUploadThingUploading } = useUploadThing('profileImage', {
    onClientUploadComplete: async (res) => {
      if (res?.[0]) {
        // Update user with the new URL
        const { error } = await authClient.updateUser({
          image: res[0].url,
        });

        if (error) {
          toast.error('Failed to save avatar URL');
          setIsLoading(false);
        } else {
          toast.success('Profile picture updated!');
          setIsLoading(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          // Move to next step
          setStep(1);
        }
      }
    },
    onUploadError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 1MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadAndContinue = async () => {
    if (selectedFile) {
      setIsLoading(true);
      await startUpload([selectedFile]);
    } else {
      // Skip upload, just move next
      setStep(1);
    }
  };

  // --- Step Handlers ---

  // Step 1: Password Logic
  const handleSetPassword = () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPass) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordMutation({
      newPassword: password,
      currentPassword: currentPassword || undefined,
    });
  };

  const skipStep = () => {
    if (step === 0)
      setStep(1); // Skip Profile -> Go to Password
    else onComplete(); // Skip Password -> Finish
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to LMS</DialogTitle>
          <DialogDescription>Let&apos;s finish setting up your account.</DialogDescription>
        </DialogHeader>

        {/* STEP 0: Profile Setup (Avatar Only) */}
        {step === 0 && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {previewUrl || user.image ? (
                  <Avatar className="h-24 w-24 border-2 border-slate-200">
                    <AvatarImage src={previewUrl || user.image || undefined} />
                    <AvatarFallback className="text-2xl bg-slate-100">
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <GeneratedAvatar
                    className="h-24 w-24 border-2 border-slate-200"
                    seed={separateFullName(user.name || '').join(' ')}
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
                    <Upload className="h-6 w-6 text-white" />
                  </label>
                </div>
              </div>

              {selectedFile && (
                <div className="text-center space-y-1 w-full">
                  <p className="text-xs text-slate-600 truncate">{selectedFile.name}</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      variant="ghost"
                      className="h-7 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              JPG, PNG, GIF or WebP. Max 1MB.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={skipStep} className="flex-1">
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleUploadAndContinue}
                disabled={isLoading || isUploadThingUploading}
              >
                {(isLoading || isUploadThingUploading) && <Loader2 className="animate-spin mr-2" />}
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Security */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-full">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a password to protect your account.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {/* Optional: For default password users */}
              <div className="grid gap-1.5">
                <Label htmlFor="curr-pass">Current Password (if any)</Label>
                <Input
                  id="curr-pass"
                  type="password"
                  placeholder="Leave blank if none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  If you signed up with a default password, enter it here.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pass">New Password</Label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onComplete} className="flex-1">
                Skip for now
              </Button>
              <Button
                className="flex-1"
                onClick={handleSetPassword}
                disabled={isLoading || isPending}
              >
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                Finish Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
