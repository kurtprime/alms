"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { Loader2, User, Shield, KeyRound, CheckCircle2 } from "lucide-react";
import {
  changePassword,
  sendVerificationEmail,
  updateProfile,
} from "../../server/serverSettingAction";
import { Session } from "@/lib/auth-client";
import { AvatarUploader } from "../components/AvatarUploader";

// Schemas
const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  // Image is handled by the uploader, not this form schema directly
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Min 8 characters"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface SettingsFormProps {
  session: Session;
}

export function SettingsForm({ session }: SettingsFormProps) {
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(session.user.image);

  const user = session.user;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsProfileLoading(true);
    const formData = new FormData();
    formData.append("name", values.name);
    // Send the current image URL which might have been updated by AvatarUploader
    formData.append("image", currentImageUrl || "");

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setIsProfileLoading(false);
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsPasswordLoading(true);
    const formData = new FormData();
    formData.append("currentPassword", values.currentPassword);
    formData.append("newPassword", values.newPassword);

    const result = await changePassword(formData);

    if (result.success) {
      toast.success(result.message);
      passwordForm.reset();
    } else {
      toast.error(result.message);
    }
    setIsPasswordLoading(false);
  };

  const handleVerifyEmail = async () => {
    const result = await sendVerificationEmail();
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  // Callback for Avatar Uploader
  const handleImageUpload = (url: string) => {
    setCurrentImageUrl(url);
    // Optionally: Auto-submit the form or just update state
    // For better UX, we update state and let user save other details or auto-save
    // Here we just update state, user clicks "Save Changes" to persist name + new image
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6 mx-auto">
      <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
        <TabsTrigger value="profile">
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="h-4 w-4 mr-2" />
          Security
        </TabsTrigger>
        <TabsTrigger value="account">
          <KeyRound className="h-4 w-4 mr-2" />
          Account
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                {/* REPLACED: Avatar Uploader instead of Input */}
                <div className="flex justify-center py-4">
                  <AvatarUploader
                    currentImage={currentImageUrl}
                    name={user.name || "User"}
                    onUploadComplete={handleImageUpload}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isProfileLoading}>
                  {isProfileLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab (Same as before) */}
      <TabsContent value="security">
        {/* ... Password Card logic remains the same ... */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Tab - REMOVED Delete User */}
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Verify your email to enable all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user.email}</span>
              {user.emailVerified ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge variant="destructive">Unverified</Badge>
              )}
            </div>

            {!user.emailVerified && (
              <Button variant="outline" size="sm" onClick={handleVerifyEmail}>
                Resend Verification
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone Card is completely removed as requested */}
      </TabsContent>
    </Tabs>
  );
}
