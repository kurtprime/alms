"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  Smartphone,
  Copy,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Session } from "@/lib/auth-client";
import { TwoFactorFormValues, twoFactorSchema } from "./schema";
import { settingsApi } from "./api";

type User = Session["user"];

interface TwoFactorTabProps {
  user: User;
}

export function TwoFactorTab({ user }: TwoFactorTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Dialog States
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

  // Enable Flow States
  const [step, setStep] = useState<"init" | "verify" | "success">("init");
  const [password, setPassword] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Form for Verification Code
  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  // --- ENABLE FLOW ---

  const handleInitEnable = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setIsLoading(true);
    try {
      const result = await settingsApi.initiate2FA(password);
      if (result.success && result.data) {
        setQrCodeUri(result.data.totpURI);
        setStep("verify");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (values: TwoFactorFormValues) => {
    setIsLoading(true);
    try {
      const result = await settingsApi.verify2FA(values.code);
      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setStep("success");
        toast.success("Two-factor authentication enabled!");
        router.refresh();
      } else {
        toast.error(result.message || "Invalid code");
      }
    } catch (error) {
      toast.error("Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DISABLE FLOW ---

  const [disablePassword, setDisablePassword] = useState("");

  const handleDisable = async () => {
    if (!disablePassword) {
      toast.error("Password required");
      return;
    }
    setIsLoading(true);
    try {
      const result = await settingsApi.disable2FA(disablePassword);
      if (result.success) {
        toast.success("2FA Disabled");
        setIsDisableDialogOpen(false);
        setDisablePassword("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied!");
  };

  const resetEnableDialog = () => {
    setStep("init");
    setPassword("");
    setQrCodeUri(null);
    setBackupCodes([]);
    form.reset();
  };

  const isTwoFactorEnabled = user.twoFactorEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">
              {isTwoFactorEnabled ? "Enabled" : "Disabled"}
            </p>
            <p className="text-sm text-slate-500">
              {isTwoFactorEnabled
                ? "Your account is protected with 2FA"
                : "Add 2FA to protect your account"}
            </p>
          </div>

          {/* ENABLE DIALOG */}
          <Dialog
            open={isEnableDialogOpen}
            onOpenChange={(open) => {
              setIsEnableDialogOpen(open);
              if (!open) resetEnableDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant={isTwoFactorEnabled ? "outline" : "default"}
                disabled={isLoading}
              >
                {isTwoFactorEnabled ? "Manage" : "Enable"}
              </Button>
            </DialogTrigger>

            <DialogContent>
              {/* STEP 1: Password */}
              {step === "init" && (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Verify your identity to continue.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    onClick={handleInitEnable}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              )}

              {/* STEP 2: QR Code & Verify */}
              {step === "verify" && qrCodeUri && (
                <>
                  <DialogHeader>
                    <DialogTitle>Scan QR Code</DialogTitle>
                    <DialogDescription>
                      Scan with your authenticator app (Google Authenticator,
                      Authy) and enter the code.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      {/* Generate QR Image from URI */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleVerify)}
                        className="space-y-4 w-full"
                      >
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verification Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000000"
                                  className="text-center text-2xl tracking-widest font-mono"
                                  maxLength={6}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Verify & Enable
                        </Button>
                      </form>
                    </Form>
                  </div>
                </>
              )}

              {/* STEP 3: Success & Backup Codes */}
              {step === "success" && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                      <ShieldCheck className="h-5 w-5" /> 2FA Enabled!
                    </DialogTitle>
                    <DialogDescription>
                      Save these backup codes in a safe place. You can use them
                      if you lose your device.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg font-mono text-sm grid grid-cols-2 gap-2">
                      {backupCodes.map((code, i) => (
                        <div key={i} className="text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={copyCodes}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setIsEnableDialogOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* DISABLE SECTION */}
        {isTwoFactorEnabled && (
          <div className="mt-4 pt-4 border-t">
            <Dialog
              open={isDisableDialogOpen}
              onOpenChange={setIsDisableDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isLoading}>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    This will make your account less secure. Please enter your
                    password to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDisable}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Confirm Disable"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
