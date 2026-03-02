"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { FcGoogle } from "react-icons/fc";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const SignInSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }).max(100),
  password: z.string().min(1, { message: "Password is required" }).max(100),
});

export default function SignInCard() {
  const login = async (provider: "google") => {
    await authClient.signIn.social({
      provider: provider,
      callbackURL: "/",
    });
  };

  return (
    <div className="w-full max-w-[450px]">
      <Card className="border-0 bg-[#f3f3f3] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <CardContent className="p-10">
          {/* Header Section - Styled like old login-header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image
                src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
                alt="ARK Logo"
                fill // Keep this
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome Arkadian!
            </h2>
            <p className="text-sm text-gray-600">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Form Section */}
          <div className="mb-6">
            <SignInForm />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f3f3f3] px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => login("google")}
              variant="outline"
              className="flex items-center justify-center gap-2 h-12 w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-800 font-medium"
            >
              <FcGoogle size={22} />
              <span>Sign in with Google</span>
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-800">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-800">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignInSchema>) {
    const { data, error } = await authClient.signIn.username({
      username: values.username,
      password: values.password,
      callbackURL: "/",
    });

    if (error) {
      toast.error("Sign In Failed", {
        description: error.message,
      });
    }
    if (data) router.push("/");
  }

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel className="text-sm text-gray-800">User ID</FormLabel>
              <FormControl>
                <Input
                  placeholder=""
                  {...field}
                  className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mt-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm text-gray-800">
                  Password
                </FormLabel>
                <Link
                  href="/reset-password"
                  className="text-xs text-gray-700 hover:text-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder=""
                  {...field}
                  className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <Button
          disabled={isSubmitting}
          type="submit"
          className="w-full h-12 mt-8 rounded-full bg-[#e02424] hover:bg-[#c81e1e] text-white font-semibold text-base transition-transform hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </Form>
  );
}
