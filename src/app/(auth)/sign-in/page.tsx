"use client";

import { useState } from "react";
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
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ==========================================
// 1. AUTH FORM & CARD
// ==========================================

const SignInSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }).max(100),
  password: z.string().min(1, { message: "Password is required" }).max(100),
});

function SignInForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof SignInSchema>) {
    const { data, error } = await authClient.signIn.username({
      username: values.username,
      password: values.password,
      callbackURL: "/",
    });

    if (error) {
      toast.error("Sign In Failed", { description: error.message });
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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const login = async (provider: "google") => {
    await authClient.signIn.social({ provider, callbackURL: "/" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-10 bg-[#f3f3f3] border-0 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Header Section */}
        <DialogHeader className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <Image
              src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
              alt="ARK Logo"
              fill
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome Arkadian!
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Enter your credentials to access your dashboard.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}

function SignInCard() {
  const login = async (provider: "google") => {
    await authClient.signIn.social({ provider, callbackURL: "/" });
  };

  return (
    <div className="w-full max-w-[450px]">
      <Card className="border-0 bg-[#f3f3f3] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <CardContent className="p-10">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image
                src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
                alt="ARK Logo"
                fill
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

          <div className="mb-6">
            <SignInForm />
          </div>

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

// ==========================================
// 2. NAVIGATION BAR
// ==========================================

function NavBar() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className=" top-0 left-0 w-full z-1000">
        <div className="max-w-full mx-auto px-10 py-3.5 flex items-center justify-between bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="relative h-[50px] w-[50px]">
              <Image
                src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
                alt="ARK Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-[17px] font-semibold text-gray-900">
              ARK Technological Institute Education System Inc.
            </div>
          </div>

          <div className="flex items-center gap-9">
            <a
              href="#"
              className="text-[15px] text-gray-900 font-medium relative group"
            >
              <strong>Helpdesk</strong>
              <span className="absolute bottom-[-5px] left-0 w-0 h-0.5 bg-[#e02424] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#"
              className="text-[15px] text-gray-900 font-medium relative group"
            >
              <strong>FAQ</strong>
              <span className="absolute bottom-[-5px] left-0 w-0 h-0.5 bg-[#e02424] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <button
              className="bg-[#e02424] text-white border-none py-2 px-6 rounded-full text-[15px] font-semibold cursor-pointer transition-all duration-300 hover:bg-[#c81e1e] hover:-translate-y-0.5"
              onClick={() => setShowLogin(true)}
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* Use the Shadcn Modal Component */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

// ==========================================
// 3. HERO BLOCK (SLIDER)
// ==========================================

function HeroBlock() {
  const slides = [
    {
      image:
        "https://5geycduwue.ufs.sh/f/KIddkrDeaHXJRGrL0idydZczXHGSN36MuIQ87AqBaFhfbjiD",
      title: "WELCOME TO A-LMS",
      text: "This is your central hub for everything related to class announcements, course materials, and assignments. Please check this page regularly to stay informed about deadlines and new resources.",
    },
    {
      image:
        "https://5geycduwue.ufs.sh/f/KIddkrDeaHXJkH5ZTqf10XqRDFfZr7PCu8GpVg5b9LBwstzQ",
      title: "Admission for SY 2026–2027 is now open!!",
      text: "Apply now and secure your future with ARK Technological Institute. Limited slots available.",
    },
  ];

  const [active, setActive] = useState(0);

  const nextSlide = () => setActive((n) => (n + 1) % slides.length);
  const prevSlide = () =>
    setActive((n) => (n - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setActive(index);

  return (
    // .hero-slider: Full width, fixed height, margin for navbar
    <section className="w-full h-screen relative overflow-hidden">
      {/* .hero-slide: Background image */}
      <div
        className="w-full h-full bg-cover bg-center bg-no-repeat relative transition-all duration-500"
        style={{ backgroundImage: `url(${slides[active].image})` }}
      >
        {/* .hero-dark: Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(149,2,5,0.5)] to-transparent flex items-center pl-[80px]">
          {/* .hero-content: Text on the left */}
          <div className="max-w-[700px] text-white">
            <h1 className="text-5xl tracking-[4px] mb-5 font-bold drop-shadow-lg">
              {slides[active].title}
            </h1>
            <p className="text-lg leading-relaxed drop-shadow-md">
              {slides[active].text}
            </p>
          </div>
        </div>

        {/* Arrows */}
        <button
          className="absolute top-1/2 -translate-y-1/2 bg-transparent border-none text-4xl text-white cursor-pointer transition-opacity hover:opacity-70 left-[25px]"
          onClick={prevSlide}
        >
          ‹
        </button>
        <button
          className="absolute top-1/2 -translate-y-1/2 bg-transparent border-none text-4xl text-white cursor-pointer transition-opacity hover:opacity-70 right-[25px]"
          onClick={nextSlide}
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-[25px] left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`w-[35px] h-1.5 rounded-full cursor-pointer transition-all duration-300 ${active === index ? "bg-white" : "bg-white/40"}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. FOOTER
// ==========================================

function FooterBar() {
  return (
    <footer className="bg-[#0b0b0b] text-white pt-[70px]">
      <div className="max-w-[1300px] mx-auto px-10 pb-[60px] grid grid-cols-3 gap-[60px]">
        <div className="flex flex-col gap-3.5 col-span-1">
          <h3 className="text-lg mb-2">
            ARK Technological Institute Education System Inc.
          </h3>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2">
            Empowering students and teachers through innovative
            technology-driven education using A-LMS, a Smart Teacher-Centered
            Learning Management System with AI Instructional Support.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <h4 className="text-sm tracking-[2px] text-[#bbb] mb-4">
            QUICK LINKS
          </h4>
          <a
            href="#"
            className="no-underline text-[#ddd] text-sm flex gap-2 items-center hover:text-white transition"
          >
            <HelpCircle size={16} /> Helpdesk
          </a>
          <a
            href="#"
            className="no-underline text-[#ddd] text-sm flex gap-2 items-center hover:text-white transition"
          >
            <MessageCircle size={16} /> FAQ
          </a>
        </div>

        <div className="flex flex-col gap-3.5">
          <h4 className="text-sm tracking-[2px] text-[#bbb] mb-4">
            CONTACT US
          </h4>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-start">
            <MapPin size={16} className="mt-1 shrink-0" />
            <span>
              J-Seven Building, Magallanes Cor Granja St. Brgy 7, Lucena,
              Philippines, 4301
            </span>
          </p>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-center">
            <Phone size={16} /> 0907-082-9390
          </p>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-center">
            <Mail size={16} /> ark.lucena@gmail.com
          </p>
        </div>
      </div>

      <div className="border-t border-[#222] text-center py-5 text-[13px] text-[#777]">
        © 2015 ARK Technological Institute Education System Inc. All rights
        reserved.
      </div>
    </footer>
  );
}

// ==========================================
// 5. MAIN PAGE EXPORT
// ==========================================

export default function SignInPage() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <NavBar />

      {/* Hero Block contains the background slider AND the SignInCard (for desktop) */}
      <HeroBlock />

      {/* 
         MOBILE FALLBACK:
         On mobile, the card inside HeroBlock is hidden (hidden lg:block).
         We show it here for mobile users.
      */}
      {/* <div className="lg:hidden flex justify-center py-10 bg-slate-100">
        <SignInCard />
      </div> */}

      <FooterBar />
    </div>
  );
}
