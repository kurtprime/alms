"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { Session } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client"; // Import authClient
import { ProfileAvatar } from "./ProfileAvatar";

type User = Session["user"];

interface ProfileTabProps {
  user: User;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [isSending, setIsSending] = useState(false);

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/settings", // Where to redirect after verification
      });
      toast.success("Verification email sent! Please check your inbox.");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          View your profile details and update your picture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <ProfileAvatar user={user} />
        <Separator />

        <div className="space-y-6">
          {/* Name Field (Read Only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Full Name
            </label>
            <Input
              value={user.name || "N/A"}
              disabled
              className="bg-slate-50"
            />
          </div>

          {/* Email Field & Verification */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email Address
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input
                value={user.email}
                disabled
                className="bg-slate-50 flex-1"
              />

              {user.emailVerified ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 w-full sm:w-auto justify-center"
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 flex-1 sm:flex-none justify-center"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" /> Unverified
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    Verify
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Your name and email address cannot be changed directly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
