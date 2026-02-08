"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function CardDemo() {
  const login = async (provider: "facebook" | "google") => {
    authClient.signIn.social({
      provider: provider,
      callbackURL: "/",
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border-0">
      <div className="bg-gradient-to-r from-primary/90 to-primary/40 py-6">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-blue-100 pt-2">
            Ark Learning Management System
          </CardDescription>
        </CardHeader>
      </div>

      <CardContent className="p-6">
        <div className="mb-6">
          <SignInForm />
        </div>

        {/* <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div> */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* <Button
            onClick={() => login("facebook")}
            variant="outline"
            className="flex items-center justify-center gap-2 py-5 px-4 flex-1"
            size="lg"
          >
            <FaFacebook size={20} className="text-blue-600" />
            <span className="hidden sm:inline">Facebook</span>
          </Button> */}

          <Button
            onClick={() => login("google")}
            variant="outline"
            className="flex items-center justify-center gap-2 py-5 px-4 flex-1"
            size="lg"
          >
            <FcGoogle size={20} />
            <span className="hidden sm:inline">Google</span>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardContent>
    </Card>
  );
}

function SignInForm() {
  const router = useRouter();

  const form = useForm({
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
      toast.error(error.message);
    }
    if (data) router.push("/");
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-10">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="enter password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={form.formState.isSubmitting} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}

const SignInSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }).max(100),
  password: z.string().min(1, { message: "Password is required" }).max(100),
});
