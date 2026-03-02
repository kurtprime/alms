"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

// ============================================
// SCHEMAS
// ============================================

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const getView = () => {
    if (error) return "error";
    if (token) return "reset";
    return "request";
  };

  const view = getView();

  useEffect(() => {
    if (error) {
      toast.error("Invalid Link", {
        description: "This link is invalid or has expired.",
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {view === "request" && (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RequestResetCard />
            </motion.div>
          )}
          {view === "reset" && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NewPasswordCard token={token!} />
            </motion.div>
          )}
          {view === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ExpiredLinkCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// 1. REQUEST RESET CARD
// ============================================

function RequestResetCard() {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof requestSchema>) => {
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSuccess(true);
  };

  const { isSubmitting } = form.formState;

  return (
    <Card className="w-full border-transparent shadow-none bg-transparent">
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center pt-12"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                Check your email
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm">
                We have sent a password reset link to your email address.
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/sign-in")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-50 mb-4">
                  <Mail className="h-6 w-6 text-white dark:text-slate-900" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Forgot password?
                </h1>
                <p className="text-slate-500 mt-2">
                  No worries, we&apos;ll send you reset instructions.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            {...field}
                            className="h-11"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm text-slate-500">
                <Link
                  href="/sign-in"
                  className="font-medium text-slate-900 dark:text-slate-50 hover:underline"
                >
                  ← Back to Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ============================================
// 2. NEW PASSWORD CARD
// ============================================

function NewPasswordCard({ token }: { token: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token: token,
    });

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Password Updated!", {
        description: "Redirecting to login...",
      });
      setTimeout(() => router.push("/sign-in"), 1500);
    }
  };

  return (
    <Card className="w-full border-transparent shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-600 mb-4">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Reset password
          </h1>
          <p className="text-slate-500 mt-2">
            Create a strong password for your account.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="h-11 pr-10"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="h-11"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ============================================
// 3. EXPIRED LINK CARD
// ============================================

function ExpiredLinkCard() {
  return (
    <Card className="w-full border-transparent shadow-none bg-transparent">
      <CardContent className="p-0 flex flex-col items-center text-center pt-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Invalid Link
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm">
          This link has expired or is invalid. Please request a new one.
        </p>
        <div className="w-full space-y-2">
          <Button asChild className="w-full h-11">
            <Link href="/reset-password">Request New Link</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/sign-in" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
